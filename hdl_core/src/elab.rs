use crate::ast::*;
use crate::error::Error;
use crate::value::{BitVec, Value, ValueKind};
use std::collections::{HashMap, HashSet};

#[derive(Clone, Debug)]
pub struct Signal {
    pub name: String,
    pub width: usize,
    pub msb: i64,
    pub lsb: i64,
    pub dir: RangeDir,
    pub value: BitVec,
    pub port_dir: Option<Direction>,
}

#[derive(Clone, Debug)]
pub struct TargetRef {
    pub signal: usize,
    pub sel: Option<Selector>,
}

#[derive(Clone, Debug)]
pub enum ExprRef {
    Literal(Value),
    Target(TargetRef),
    Unary { op: UnaryOp, expr: Box<ExprRef> },
    Binary { op: BinaryOp, left: Box<ExprRef>, right: Box<ExprRef> },
    Call { name: String, args: Vec<ExprRef> },
}

#[derive(Clone, Debug)]
pub enum SeqStmtRef {
    Assign(TargetRef, ExprRef),
    If(IfRef),
    Case(CaseRef),
}

#[derive(Clone, Debug)]
pub struct IfRef {
    pub cond: ExprRef,
    pub then_stmts: Vec<SeqStmtRef>,
    pub elsif: Vec<(ExprRef, Vec<SeqStmtRef>)>,
    pub else_stmts: Vec<SeqStmtRef>,
}

#[derive(Clone, Debug)]
pub struct CaseRef {
    pub expr: ExprRef,
    pub arms: Vec<(CaseChoiceRef, Vec<SeqStmtRef>)>,
}

#[derive(Clone, Debug)]
pub enum CaseChoiceRef {
    Literal(Value),
    Target(TargetRef),
    Others,
}

#[derive(Clone, Debug)]
pub struct AssignNet {
    pub target: TargetRef,
    pub expr: ExprRef,
}

#[derive(Clone, Debug)]
pub struct ProcessNet {
    pub clk: String,
    pub stmts: Vec<SeqStmtRef>,
}

#[derive(Clone, Debug)]
pub enum PrimitiveNet {
    Nand2 { a: ExprRef, b: ExprRef, y: TargetRef },
    Not1 { a: ExprRef, y: TargetRef },
    And2 { a: ExprRef, b: ExprRef, y: TargetRef },
    Or2 { a: ExprRef, b: ExprRef, y: TargetRef },
    Xor2 { a: ExprRef, b: ExprRef, y: TargetRef },
    Mux2 { a: ExprRef, b: ExprRef, sel: ExprRef, y: TargetRef },
    Dff { clk: ExprRef, d: ExprRef, q: TargetRef },
    Ram {
        clk: ExprRef,
        we: ExprRef,
        addr: ExprRef,
        din: ExprRef,
        dout: TargetRef,
        addr_width: usize,
        data_width: usize,
    },
    /// Read-only memory - combinatorial read, content loaded externally
    Rom {
        addr: ExprRef,
        dout: TargetRef,
        addr_width: usize,
        data_width: usize,
        /// Index into the simulator's ROM state array
        rom_index: usize,
    },
}

#[derive(Clone, Debug)]
pub struct Netlist {
    pub signals: Vec<Signal>,
    pub assigns: Vec<AssignNet>,
    pub processes: Vec<ProcessNet>,
    pub primitives: Vec<PrimitiveNet>,
    pub name_to_id: HashMap<String, usize>,
    /// Number of ROM primitives (for indexing ROM state in simulator)
    pub rom_count: usize,
}

pub fn elaborate(design: &Design, top: &str) -> Result<Netlist, Error> {
    let mut lib = Library::new(design)?;
    let mut netlist = Netlist {
        signals: Vec::new(),
        assigns: Vec::new(),
        processes: Vec::new(),
        primitives: Vec::new(),
        name_to_id: HashMap::new(),
        rom_count: 0,
    };
    let mut drivers: HashMap<usize, usize> = HashMap::new();
    lib.elaborate_entity(top, None, None, &mut netlist, &mut drivers)?;
    for (sig, count) in &drivers {
        if *count > 1 {
            return Err(Error::new(format!(
                "multiple drivers for signal {}",
                netlist.signals[*sig].name
            )));
        }
    }
    for (idx, sig) in netlist.signals.iter().enumerate() {
        if matches!(sig.port_dir, Some(Direction::Out)) {
            let count = drivers.get(&idx).copied().unwrap_or(0);
            if count != 1 {
                return Err(Error::new(format!(
                    "out port {} must be driven exactly once",
                    sig.name
                )));
            }
        }
    }
    Ok(netlist)
}

struct Library {
    entities: HashMap<String, Entity>,
    archs: HashMap<String, Architecture>,
}

impl Library {
    fn new(design: &Design) -> Result<Self, Error> {
        let mut entities = HashMap::new();
        for ent in &design.entities {
            if entities.insert(ent.name.clone(), ent.clone()).is_some() {
                return Err(Error::new(format!("duplicate entity {}", ent.name)));
            }
        }
        let mut archs = HashMap::new();
        for arch in &design.architectures {
            if archs.insert(arch.entity.clone(), arch.clone()).is_some() {
                return Err(Error::new(format!("multiple architectures for entity {}", arch.entity)));
            }
        }
        Ok(Self { entities, archs })
    }

    fn elaborate_entity(
        &mut self,
        entity_name: &str,
        inst_prefix: Option<&str>,
        port_map: Option<&HashMap<String, usize>>,
        netlist: &mut Netlist,
        drivers: &mut HashMap<usize, usize>,
    ) -> Result<(), Error> {
        let ent = self
            .entities
            .get(entity_name)
            .ok_or_else(|| Error::new(format!("unknown entity {}", entity_name)))?
            .clone();
        let arch = self
            .archs
            .get(entity_name)
            .ok_or_else(|| Error::new(format!("missing architecture for {}", entity_name)))?
            .clone();

        let mut mapping: HashMap<String, usize> = HashMap::new();
        let mut in_ports: HashSet<usize> = HashSet::new();
        for port in &ent.ports {
            let id = if let Some(map) = port_map {
                map.get(&port.name)
                    .copied()
                    .ok_or_else(|| Error::new(format!("missing port mapping for {}", port.name)))?
            } else {
                let name = scoped(inst_prefix, &port.name);
                define_signal(netlist, &name, &port.ty, Some(port.dir.clone()))?
            };
            if matches!(port.dir, Direction::In) {
                in_ports.insert(id);
            }
            mapping.insert(port.name.clone(), id);
        }

        for sig in &arch.signals {
            for name in &sig.names {
                let scoped_name = scoped(inst_prefix, name);
                let id = define_signal(netlist, &scoped_name, &sig.ty, None)?;
                if let Some(init) = &sig.init {
                    let expr = convert_expr(init, &mapping)?;
                    if let ExprRef::Literal(val) = expr {
                        netlist.signals[id].value = val.bits.clone();
                    }
                }
                mapping.insert(name.clone(), id);
            }
        }

        // Track signals with indexed output assignments to avoid multiple driver errors
        let mut indexed_out_sigs: HashSet<usize> = HashSet::new();

        for stmt in &arch.stmts {
            match stmt {
                ConcurrentStmt::Assign(a) => {
                    let target = convert_target(&a.target, &mapping)?;
                    register_driver(&target, &in_ports, drivers)?;
                    let expr = convert_expr(&a.expr, &mapping)?;
                    netlist.assigns.push(AssignNet { target, expr });
                }
                ConcurrentStmt::Process(p) => {
                    let proc = convert_process(p, &mapping)?;
                    let mut proc_targets: HashSet<usize> = HashSet::new();
                    collect_process_targets(&proc.stmts, &mut proc_targets);
                    for sig in proc_targets {
                        let target = TargetRef { signal: sig, sel: None };
                        register_driver(&target, &in_ports, drivers)?;
                    }
                    netlist.processes.push(proc);
                }
                ConcurrentStmt::Instance(i) => {
                    self.elaborate_instance(i, inst_prefix, &mapping, netlist, drivers, &in_ports, &mut indexed_out_sigs)?;
                }
            }
        }
        Ok(())
    }

    fn elaborate_instance(
        &mut self,
        inst: &InstanceStmt,
        parent_prefix: Option<&str>,
        parent_map: &HashMap<String, usize>,
        netlist: &mut Netlist,
        drivers: &mut HashMap<usize, usize>,
        in_ports: &HashSet<usize>,
        indexed_out_sigs: &mut HashSet<usize>,
    ) -> Result<(), Error> {
        if !self.entities.contains_key(&inst.entity) {
            let lower = inst.entity.to_ascii_lowercase();
            if is_primitive_name(&lower) {
                return elaborate_primitive(inst, parent_map, netlist, drivers, in_ports, &lower);
            }
            return Err(Error::new(format!("unknown entity {}", inst.entity)));
        }
        let ent = self
            .entities
            .get(&inst.entity)
            .ok_or_else(|| Error::new(format!("unknown entity {}", inst.entity)))?
            .clone();

        let mut assoc_map: HashMap<String, &Assoc> = HashMap::new();
        for assoc in &inst.port_map {
            if assoc_map.insert(assoc.port.clone(), assoc).is_some() {
                return Err(Error::new(format!(
                    "duplicate port mapping for {}",
                    assoc.port
                )));
            }
        }
        for assoc in &inst.port_map {
            if !ent.ports.iter().any(|p| p.name == assoc.port) {
                return Err(Error::new(format!(
                    "unknown port {} on {}",
                    assoc.port, ent.name
                )));
            }
        }

        let inst_name = scoped(parent_prefix, &inst.name);
        let mut mapping: HashMap<String, usize> = HashMap::new();

        for port in &ent.ports {
            let assoc = assoc_map
                .get(&port.name)
                .ok_or_else(|| Error::new(format!("missing port mapping for {}", port.name)))?;
            match port.dir {
                Direction::In => {
                    let port_width = type_width(&port.ty);
                    let expr_width = expr_width(&assoc.expr, parent_map, netlist)?;
                    if expr_width != port_width {
                        return Err(Error::new(format!(
                            "port width mismatch for {}",
                            port.name
                        )));
                    }
                    let expr = convert_expr(&assoc.expr, parent_map)?;
                    let sig_name = scoped(Some(&inst_name), &port.name);
                    let id = define_signal(netlist, &sig_name, &port.ty, Some(port.dir.clone()))?;
                    let target = TargetRef { signal: id, sel: None };
                    netlist.assigns.push(AssignNet {
                        target: target.clone(),
                        expr,
                    });
                    register_driver(&target, in_ports, drivers)?;
                    mapping.insert(port.name.clone(), id);
                }
                Direction::Out => {
                    let target_ast = match &assoc.expr {
                        Expr::Target(t) => t,
                        _ => {
                            return Err(Error::new(format!(
                                "out port {} must map to a signal",
                                port.name
                            )))
                        }
                    };
                    let target_ref = convert_target(target_ast, parent_map)?;
                    let port_width = type_width(&port.ty);
                    // For indexed targets, check the selection width, not the full signal width
                    let target_width = if let Some(ref sel) = target_ref.sel {
                        match sel {
                            Selector::Index(_) => 1,
                            Selector::Range { msb, lsb, .. } => (msb - lsb).unsigned_abs() as usize + 1,
                        }
                    } else {
                        netlist.signals[target_ref.signal].width
                    };
                    if target_width != port_width {
                        return Err(Error::new(format!(
                            "port width mismatch for {} (expected {}, got {})",
                            port.name, port_width, target_width
                        )));
                    }

                    // If output target has a selection (e.g., y(0)), create an intermediate signal
                    // and add an assignment to propagate the output to the correct bits
                    if target_ref.sel.is_some() {
                        // Create intermediate signal for the child's output port
                        let inter_name = scoped(Some(&inst_name), &format!("{}_out", port.name));
                        let inter_id = define_signal(netlist, &inter_name, &port.ty, None)?;
                        mapping.insert(port.name.clone(), inter_id);

                        // Add assignment: parent_target = intermediate_signal
                        let inter_target = TargetRef { signal: inter_id, sel: None };
                        netlist.assigns.push(AssignNet {
                            target: target_ref.clone(),
                            expr: ExprRef::Target(inter_target),
                        });
                        // Track this signal for indexed output - only register once per signal
                        if !indexed_out_sigs.contains(&target_ref.signal) {
                            indexed_out_sigs.insert(target_ref.signal);
                            let target = TargetRef { signal: target_ref.signal, sel: None };
                            register_driver(&target, in_ports, drivers)?;
                        }
                    } else {
                        mapping.insert(port.name.clone(), target_ref.signal);
                    }
                }
            }
        }

        self.elaborate_entity(&ent.name, Some(&inst_name), Some(&mapping), netlist, drivers)?;
        Ok(())
    }
}

fn define_signal(
    netlist: &mut Netlist,
    name: &str,
    ty: &Type,
    port_dir: Option<Direction>,
) -> Result<usize, Error> {
    if netlist.name_to_id.contains_key(name) {
        return Err(Error::new(format!("duplicate signal {}", name)));
    }
    let (msb, lsb, dir, width) = match ty {
        Type::Bit => (0, 0, RangeDir::Downto, 1usize),
        Type::Bits { msb, lsb, dir } => {
            let w = (msb - lsb).abs() as usize + 1;
            (*msb, *lsb, dir.clone(), w)
        }
    };
    let id = netlist.signals.len();
    netlist.signals.push(Signal {
        name: name.to_string(),
        width,
        msb,
        lsb,
        dir,
        value: BitVec::new(width, 0),
        port_dir,
    });
    netlist.name_to_id.insert(name.to_string(), id);
    Ok(id)
}

fn type_width(ty: &Type) -> usize {
    match ty {
        Type::Bit => 1,
        Type::Bits { msb, lsb, .. } => (*msb - *lsb).abs() as usize + 1,
    }
}

fn scoped(prefix: Option<&str>, name: &str) -> String {
    match prefix {
        Some(p) if !p.is_empty() => format!("{}/{}", p, name),
        _ => name.to_string(),
    }
}

fn convert_expr(expr: &Expr, mapping: &HashMap<String, usize>) -> Result<ExprRef, Error> {
    Ok(match expr {
        Expr::Literal(lit) => ExprRef::Literal(literal_to_value(lit)?),
        Expr::Target(t) => ExprRef::Target(convert_target(t, mapping)?),
        Expr::Unary { op, expr } => ExprRef::Unary {
            op: *op,
            expr: Box::new(convert_expr(expr, mapping)?),
        },
        Expr::Binary { op, left, right } => ExprRef::Binary {
            op: *op,
            left: Box::new(convert_expr(left, mapping)?),
            right: Box::new(convert_expr(right, mapping)?),
        },
        Expr::Call { name, args } => {
            let mut out = Vec::new();
            for a in args {
                out.push(convert_expr(a, mapping)?);
            }
            ExprRef::Call {
                name: name.clone(),
                args: out,
            }
        }
    })
}

fn literal_to_value(lit: &Literal) -> Result<Value, Error> {
    let (bits, kind) = match lit {
        Literal::Bit(b) => (BitVec::new(1, if *b { 1 } else { 0 }), ValueKind::Literal),
        Literal::Bits(digits, base) => {
            let bv = match base {
                LiteralBase::Bin => BitVec::from_bits_msb(digits)?,
                LiteralBase::Hex => BitVec::from_hex_msb(digits)?,
            };
            (bv, ValueKind::Literal)
        }
        Literal::Int(v) => {
            let width = int_min_width(*v).max(32);
            (BitVec::from_i64(width, *v), ValueKind::Literal)
        }
    };
    Ok(Value { bits, kind })
}

fn int_min_width(v: i64) -> usize {
    let mut w = 1usize;
    loop {
        let min = -(1i128 << (w - 1));
        let max = (1i128 << (w - 1)) - 1;
        let vv = v as i128;
        if vv >= min && vv <= max {
            return w;
        }
        w += 1;
        if w >= 64 {
            return 64;
        }
    }
}

fn convert_target(target: &Target, mapping: &HashMap<String, usize>) -> Result<TargetRef, Error> {
    let signal = mapping
        .get(&target.name)
        .ok_or_else(|| Error::new(format!("unknown signal {}", target.name)))?;
    Ok(TargetRef {
        signal: *signal,
        sel: target.sel.clone(),
    })
}

fn target_width(
    target: &Target,
    mapping: &HashMap<String, usize>,
    netlist: &Netlist,
) -> Result<usize, Error> {
    let signal = mapping
        .get(&target.name)
        .ok_or_else(|| Error::new(format!("unknown signal {}", target.name)))?;
    let sig = &netlist.signals[*signal];
    Ok(match &target.sel {
        None => sig.width,
        Some(Selector::Index(_)) => 1,
        Some(Selector::Range { msb, lsb, .. }) => (*msb - *lsb).abs() as usize + 1,
    })
}

fn expr_width(expr: &Expr, mapping: &HashMap<String, usize>, netlist: &Netlist) -> Result<usize, Error> {
    Ok(match expr {
        Expr::Literal(lit) => literal_to_value(lit)?.bits.width(),
        Expr::Target(t) => target_width(t, mapping, netlist)?,
        Expr::Unary { expr, .. } => expr_width(expr, mapping, netlist)?,
        Expr::Binary { op, left, right } => {
            let lw = expr_width(left, mapping, netlist)?;
            let rw = expr_width(right, mapping, netlist)?;
            match op {
                BinaryOp::Concat => lw + rw,
                BinaryOp::Shl | BinaryOp::Shr => lw,
                BinaryOp::Eq | BinaryOp::Ne | BinaryOp::Lt | BinaryOp::Le | BinaryOp::Gt | BinaryOp::Ge => 1,
                _ => lw.max(rw),
            }
        }
        Expr::Call { name, args } => {
            let lower = name.to_ascii_lowercase();
            if lower == "resize" || lower == "sresize" {
                if args.len() != 2 {
                    return Err(Error::new("resize expects 2 args"));
                }
                match &args[1] {
                    Expr::Literal(Literal::Int(v)) => {
                        if *v <= 0 {
                            return Err(Error::new("resize width must be positive"));
                        }
                        *v as usize
                    }
                    _ => return Err(Error::new("resize width must be an integer literal")),
                }
            } else if lower == "rising_edge" {
                1
            } else {
                return Err(Error::new("unsupported function in width check"));
            }
        }
    })
}

fn convert_process(proc: &ProcessStmt, mapping: &HashMap<String, usize>) -> Result<ProcessNet, Error> {
    if proc.stmts.is_empty() {
        return Err(Error::new("process has no statements"));
    }
    let (guard, body) = match &proc.stmts[0] {
        SeqStmt::If(ifstmt) => (ifstmt, &ifstmt.then_stmts),
        _ => return Err(Error::new("process must start with rising_edge guard")),
    };

    match &guard.cond {
        Expr::Call { name, args } => {
            if !name.eq_ignore_ascii_case("rising_edge") {
                return Err(Error::new("process guard must be rising_edge"));
            }
            if args.len() != 1 {
                return Err(Error::new("rising_edge expects 1 arg"));
            }
            if let Expr::Target(t) = &args[0] {
                if !t.name.eq_ignore_ascii_case(&proc.clk) {
                    return Err(Error::new("rising_edge clock name mismatch"));
                }
            } else {
                return Err(Error::new("rising_edge arg must be a signal"));
            }
        }
        _ => return Err(Error::new("process guard must be rising_edge")),
    }

    let mut out = Vec::new();
    for s in body {
        out.push(convert_seq_stmt(s, mapping)?);
    }
    Ok(ProcessNet {
        clk: proc.clk.clone(),
        stmts: out,
    })
}

fn convert_seq_stmt(stmt: &SeqStmt, mapping: &HashMap<String, usize>) -> Result<SeqStmtRef, Error> {
    Ok(match stmt {
        SeqStmt::Assign(a) => SeqStmtRef::Assign(convert_target(&a.target, mapping)?, convert_expr(&a.expr, mapping)?),
        SeqStmt::If(i) => SeqStmtRef::If(IfRef {
            cond: convert_expr(&i.cond, mapping)?,
            then_stmts: convert_seq_block(&i.then_stmts, mapping)?,
            elsif: convert_elsif(&i.elsif, mapping)?,
            else_stmts: convert_seq_block(&i.else_stmts, mapping)?,
        }),
        SeqStmt::Case(c) => SeqStmtRef::Case(CaseRef {
            expr: convert_expr(&c.expr, mapping)?,
            arms: convert_case_arms(&c.arms, mapping)?,
        }),
    })
}

fn convert_seq_block(stmts: &[SeqStmt], mapping: &HashMap<String, usize>) -> Result<Vec<SeqStmtRef>, Error> {
    let mut out = Vec::new();
    for s in stmts {
        out.push(convert_seq_stmt(s, mapping)?);
    }
    Ok(out)
}

fn convert_elsif(
    elsif: &[(Expr, Vec<SeqStmt>)],
    mapping: &HashMap<String, usize>,
) -> Result<Vec<(ExprRef, Vec<SeqStmtRef>)>, Error> {
    let mut out = Vec::new();
    for (e, block) in elsif {
        out.push((convert_expr(e, mapping)?, convert_seq_block(block, mapping)?));
    }
    Ok(out)
}

fn convert_case_arms(
    arms: &[(CaseChoice, Vec<SeqStmt>)],
    mapping: &HashMap<String, usize>,
) -> Result<Vec<(CaseChoiceRef, Vec<SeqStmtRef>)>, Error> {
    let mut out = Vec::new();
    for (choice, block) in arms {
        let c = match choice {
            CaseChoice::Literal(l) => CaseChoiceRef::Literal(literal_to_value(l)?),
            CaseChoice::Ident(id) => {
                let target = Target {
                    name: id.clone(),
                    sel: None,
                    span: None,
                };
                CaseChoiceRef::Target(convert_target(&target, mapping)?)
            }
            CaseChoice::Others => CaseChoiceRef::Others,
        };
        out.push((c, convert_seq_block(block, mapping)?));
    }
    Ok(out)
}

fn collect_process_targets(stmts: &[SeqStmtRef], out: &mut HashSet<usize>) {
    for s in stmts {
        match s {
            SeqStmtRef::Assign(t, _) => {
                out.insert(t.signal);
            }
            SeqStmtRef::If(i) => {
                collect_process_targets(&i.then_stmts, out);
                for (_, block) in &i.elsif {
                    collect_process_targets(block, out);
                }
                collect_process_targets(&i.else_stmts, out);
            }
            SeqStmtRef::Case(c) => {
                for (_, block) in &c.arms {
                    collect_process_targets(block, out);
                }
            }
        }
    }
}

fn register_driver(
    target: &TargetRef,
    in_ports: &HashSet<usize>,
    drivers: &mut HashMap<usize, usize>,
) -> Result<(), Error> {
    if in_ports.contains(&target.signal) {
        return Err(Error::new("cannot drive input port"));
    }
    let entry = drivers.entry(target.signal).or_insert(0);
    *entry += 1;
    Ok(())
}

fn is_primitive_name(name: &str) -> bool {
    matches!(name, "nand2" | "not1" | "and2" | "or2" | "xor2" | "mux2" | "dff" | "ram" | "rom")
}

fn ensure_exact_ports(assoc_map: &HashMap<String, &Assoc>, required: &[&str]) -> Result<(), Error> {
    for &name in required {
        if !assoc_map.contains_key(name) {
            return Err(Error::new(format!("missing port mapping for {}", name)));
        }
    }
    for key in assoc_map.keys() {
        if !required.iter().any(|r| r == key) {
            return Err(Error::new(format!("unknown port {}", key)));
        }
    }
    Ok(())
}

fn assoc_target_no_sel<'a>(assoc: &'a Assoc) -> Result<&'a Target, Error> {
    match &assoc.expr {
        Expr::Target(t) if t.sel.is_none() => Ok(t),
        _ => Err(Error::new("output port must map to a signal")),
    }
}

fn elaborate_primitive(
    inst: &InstanceStmt,
    parent_map: &HashMap<String, usize>,
    netlist: &mut Netlist,
    drivers: &mut HashMap<usize, usize>,
    in_ports: &HashSet<usize>,
    kind: &str,
) -> Result<(), Error> {
    let mut assoc_map: HashMap<String, &Assoc> = HashMap::new();
    for assoc in &inst.port_map {
        if assoc_map.insert(assoc.port.clone(), assoc).is_some() {
            return Err(Error::new(format!(
                "duplicate port mapping for {}",
                assoc.port
            )));
        }
    }

    match kind {
        "nand2" => {
            ensure_exact_ports(&assoc_map, &["a", "b", "y"])?;
            let a_expr = &assoc_map["a"].expr;
            let b_expr = &assoc_map["b"].expr;
            let y_target = assoc_target_no_sel(assoc_map["y"])?;
            let a_w = expr_width(a_expr, parent_map, netlist)?;
            let b_w = expr_width(b_expr, parent_map, netlist)?;
            let y_w = target_width(y_target, parent_map, netlist)?;
            if a_w != b_w || a_w != y_w {
                return Err(Error::new("nand2 width mismatch"));
            }
            let a = convert_expr(a_expr, parent_map)?;
            let b = convert_expr(b_expr, parent_map)?;
            let y = convert_target(y_target, parent_map)?;
            register_driver(&y, in_ports, drivers)?;
            netlist.primitives.push(PrimitiveNet::Nand2 { a, b, y });
        }
        "not1" => {
            ensure_exact_ports(&assoc_map, &["a", "y"])?;
            let a_expr = &assoc_map["a"].expr;
            let y_target = assoc_target_no_sel(assoc_map["y"])?;
            let a_w = expr_width(a_expr, parent_map, netlist)?;
            let y_w = target_width(y_target, parent_map, netlist)?;
            if a_w != y_w {
                return Err(Error::new("not1 width mismatch"));
            }
            let a = convert_expr(a_expr, parent_map)?;
            let y = convert_target(y_target, parent_map)?;
            register_driver(&y, in_ports, drivers)?;
            netlist.primitives.push(PrimitiveNet::Not1 { a, y });
        }
        "and2" | "or2" | "xor2" => {
            ensure_exact_ports(&assoc_map, &["a", "b", "y"])?;
            let a_expr = &assoc_map["a"].expr;
            let b_expr = &assoc_map["b"].expr;
            let y_target = assoc_target_no_sel(assoc_map["y"])?;
            let a_w = expr_width(a_expr, parent_map, netlist)?;
            let b_w = expr_width(b_expr, parent_map, netlist)?;
            let y_w = target_width(y_target, parent_map, netlist)?;
            if a_w != b_w || a_w != y_w {
                return Err(Error::new("bitwise primitive width mismatch"));
            }
            let a = convert_expr(a_expr, parent_map)?;
            let b = convert_expr(b_expr, parent_map)?;
            let y = convert_target(y_target, parent_map)?;
            register_driver(&y, in_ports, drivers)?;
            let prim = match kind {
                "and2" => PrimitiveNet::And2 { a, b, y },
                "or2" => PrimitiveNet::Or2 { a, b, y },
                _ => PrimitiveNet::Xor2 { a, b, y },
            };
            netlist.primitives.push(prim);
        }
        "mux2" => {
            ensure_exact_ports(&assoc_map, &["a", "b", "sel", "y"])?;
            let a_expr = &assoc_map["a"].expr;
            let b_expr = &assoc_map["b"].expr;
            let sel_expr = &assoc_map["sel"].expr;
            let y_target = assoc_target_no_sel(assoc_map["y"])?;
            let a_w = expr_width(a_expr, parent_map, netlist)?;
            let b_w = expr_width(b_expr, parent_map, netlist)?;
            let sel_w = expr_width(sel_expr, parent_map, netlist)?;
            let y_w = target_width(y_target, parent_map, netlist)?;
            if a_w != b_w || a_w != y_w {
                return Err(Error::new("mux2 width mismatch"));
            }
            if sel_w != 1 {
                return Err(Error::new("mux2 sel must be 1 bit"));
            }
            let a = convert_expr(a_expr, parent_map)?;
            let b = convert_expr(b_expr, parent_map)?;
            let sel = convert_expr(sel_expr, parent_map)?;
            let y = convert_target(y_target, parent_map)?;
            register_driver(&y, in_ports, drivers)?;
            netlist.primitives.push(PrimitiveNet::Mux2 { a, b, sel, y });
        }
        "dff" => {
            ensure_exact_ports(&assoc_map, &["clk", "d", "q"])?;
            let clk_expr = &assoc_map["clk"].expr;
            let d_expr = &assoc_map["d"].expr;
            let q_target = assoc_target_no_sel(assoc_map["q"])?;
            let clk_w = expr_width(clk_expr, parent_map, netlist)?;
            let d_w = expr_width(d_expr, parent_map, netlist)?;
            let q_w = target_width(q_target, parent_map, netlist)?;
            if clk_w != 1 {
                return Err(Error::new("dff clk must be 1 bit"));
            }
            if d_w != q_w {
                return Err(Error::new("dff width mismatch"));
            }
            let clk = convert_expr(clk_expr, parent_map)?;
            let d = convert_expr(d_expr, parent_map)?;
            let q = convert_target(q_target, parent_map)?;
            register_driver(&q, in_ports, drivers)?;
            netlist.primitives.push(PrimitiveNet::Dff { clk, d, q });
        }
        "ram" => {
            ensure_exact_ports(&assoc_map, &["clk", "we", "addr", "din", "dout"])?;
            let clk_expr = &assoc_map["clk"].expr;
            let we_expr = &assoc_map["we"].expr;
            let addr_expr = &assoc_map["addr"].expr;
            let din_expr = &assoc_map["din"].expr;
            let dout_target = assoc_target_no_sel(assoc_map["dout"])?;
            let clk_w = expr_width(clk_expr, parent_map, netlist)?;
            let we_w = expr_width(we_expr, parent_map, netlist)?;
            let addr_w = expr_width(addr_expr, parent_map, netlist)?;
            let din_w = expr_width(din_expr, parent_map, netlist)?;
            let dout_w = target_width(dout_target, parent_map, netlist)?;
            if clk_w != 1 {
                return Err(Error::new("ram clk must be 1 bit"));
            }
            if we_w != 1 {
                return Err(Error::new("ram we must be 1 bit"));
            }
            if addr_w == 0 {
                return Err(Error::new("ram addr width must be > 0"));
            }
            if din_w != dout_w {
                return Err(Error::new("ram data width mismatch"));
            }
            if addr_w as u32 >= usize::BITS {
                return Err(Error::new("ram addr width too large"));
            }
            let clk = convert_expr(clk_expr, parent_map)?;
            let we = convert_expr(we_expr, parent_map)?;
            let addr = convert_expr(addr_expr, parent_map)?;
            let din = convert_expr(din_expr, parent_map)?;
            let dout = convert_target(dout_target, parent_map)?;
            register_driver(&dout, in_ports, drivers)?;
            netlist.primitives.push(PrimitiveNet::Ram {
                clk,
                we,
                addr,
                din,
                dout,
                addr_width: addr_w,
                data_width: din_w,
            });
        }
        "rom" => {
            // ROM primitive: read-only memory with combinatorial output
            // Ports: addr (input), dout (output)
            ensure_exact_ports(&assoc_map, &["addr", "dout"])?;
            let addr_expr = &assoc_map["addr"].expr;
            let dout_target = assoc_target_no_sel(assoc_map["dout"])?;
            let addr_w = expr_width(addr_expr, parent_map, netlist)?;
            let dout_w = target_width(dout_target, parent_map, netlist)?;
            if addr_w == 0 {
                return Err(Error::new("rom addr width must be > 0"));
            }
            let addr = convert_expr(addr_expr, parent_map)?;
            let dout = convert_target(dout_target, parent_map)?;
            register_driver(&dout, in_ports, drivers)?;
            let rom_index = netlist.rom_count;
            netlist.rom_count += 1;
            netlist.primitives.push(PrimitiveNet::Rom {
                addr,
                dout,
                addr_width: addr_w,
                data_width: dout_w,
                rom_index,
            });
        }
        _ => return Err(Error::new("unknown primitive")),
    }
    Ok(())
}
