use crate::ast::{
    bool_type, char_type, int_type, uint_type, BaseType, BinaryOp, Expr, Func, Item,
    NumberLit, Program, Stmt, Type, UnaryOp,
};
use crate::error::CError;
use std::collections::{HashMap, HashSet};
use std::fmt::Write;

pub fn compile_to_a32(program: &Program) -> Result<String, CError> {
    let mut codegen = Codegen::new();
    codegen.collect_symbols(program)?;
    codegen.emit_program(program)
}

#[derive(Clone, Debug)]
struct FuncSymbol {
    ret: Type,
    params: Vec<Type>,
    defined: bool,
}

#[derive(Clone, Debug)]
struct GlobalSymbol {
    ty: Type,
    init: Option<Expr>,
    defined: bool,
}

struct Codegen {
    text: String,
    data: String,
    rodata: String,
    bss: String,
    label_id: usize,
    funcs: HashMap<String, FuncSymbol>,
    globals: HashMap<String, GlobalSymbol>,
    global_order: Vec<String>,
}

impl Codegen {
    fn new() -> Self {
        Self {
            text: String::new(),
            data: String::new(),
            rodata: String::new(),
            bss: String::new(),
            label_id: 0,
            funcs: HashMap::new(),
            globals: HashMap::new(),
            global_order: Vec::new(),
        }
    }

    fn collect_symbols(&mut self, program: &Program) -> Result<(), CError> {
        for item in &program.items {
            match item {
                Item::Func(func) => {
                    let entry = self.funcs.get_mut(&func.name);
                    let param_types = func.params.iter().map(|p| p.ty.clone()).collect::<Vec<_>>();
                    let defined = func.body.is_some();
                    if let Some(existing) = entry {
                        if existing.ret != func.ret || existing.params != param_types {
                            return Err(CError::new("E2002", "function type mismatch"));
                        }
                        if defined && existing.defined {
                            return Err(CError::new("E2004", "duplicate function definition"));
                        }
                        existing.defined |= defined;
                    } else {
                        self.funcs.insert(
                            func.name.clone(),
                            FuncSymbol {
                                ret: func.ret.clone(),
                                params: param_types,
                                defined,
                            },
                        );
                    }
                }
                Item::Global(global) => {
                    let defined = !global.is_extern;
                    let entry = self.globals.get_mut(&global.name);
                    if let Some(existing) = entry {
                        if existing.ty != global.ty {
                            return Err(CError::new("E2002", "global type mismatch"));
                        }
                        if defined && existing.defined {
                            return Err(CError::new("E2004", "duplicate global definition"));
                        }
                        if defined {
                            existing.defined = true;
                            existing.init = global.init.clone();
                            self.global_order.push(global.name.clone());
                        }
                    } else {
                        self.globals.insert(
                            global.name.clone(),
                            GlobalSymbol {
                                ty: global.ty.clone(),
                                init: global.init.clone(),
                                defined,
                            },
                        );
                        if defined {
                            self.global_order.push(global.name.clone());
                        }
                    }
                }
            }
        }
        Ok(())
    }

    fn emit_program(&mut self, program: &Program) -> Result<String, CError> {
        let mut emitted = HashSet::new();
        let global_order = self.global_order.clone();
        for name in &global_order {
            if emitted.contains(name) {
                continue;
            }
            let info = self
                .globals
                .get(name)
                .ok_or_else(|| CError::new("E2003", "missing global"))?
                .clone();
            self.emit_global(name, &info)?;
            emitted.insert(name.clone());
        }
        for (name, info) in self.globals.clone() {
            if emitted.contains(&name) {
                continue;
            }
            if info.defined {
                continue;
            }
            self.emit_global(&name, &info)?;
            emitted.insert(name);
        }

        for item in &program.items {
            if let Item::Func(func) = item {
                if func.body.is_some() {
                    self.emit_function(func)?;
                }
            }
        }

        self.emit_helpers();

        let mut out = String::new();
        if !self.text.is_empty() {
            out.push_str(".text\n");
            out.push_str(&self.text);
        }
        if !self.rodata.is_empty() {
            out.push_str("\n.rodata\n");
            out.push_str(&self.rodata);
        }
        if !self.data.is_empty() {
            out.push_str("\n.data\n");
            out.push_str(&self.data);
        }
        if !self.bss.is_empty() {
            out.push_str("\n.bss\n");
            out.push_str(&self.bss);
        }
        Ok(out)
    }

    fn emit_global(&mut self, name: &str, info: &GlobalSymbol) -> Result<(), CError> {
        let mut ty = info.ty.clone();
        let init = info.init.clone();
        if let Type::Array(elem, len) = &ty {
            if *len == 0 {
                if let Some(Expr::String(s)) = &init {
                    ty = Type::Array(elem.clone(), s.len() + 1);
                } else {
                    return Err(CError::new("E2006", "array size must be constant"));
                }
            }
        }

        if let Some(ref init_expr) = init {
            match (&ty, init_expr) {
                (Type::Array(elem, len), Expr::String(value)) => {
                    if !matches!(elem.as_ref(), Type::Base(BaseType::Char)) {
                        return Err(CError::new("E2002", "array initializer type mismatch"));
                    }
                    if value.len() + 1 > *len {
                        return Err(CError::new("E2002", "string initializer too long"));
                    }
                    if ty.align() == Some(4) {
                        writeln!(self.data, "  .align 2").unwrap();
                    }
                    writeln!(self.data, "  .global {}", name).unwrap();
                    writeln!(self.data, "{}:", name).unwrap();
                    writeln!(self.data, "  .asciz \"{}\"", escape_asm_string(&value)).unwrap();
                    let pad = *len - (value.len() + 1);
                    if pad > 0 {
                        writeln!(self.data, "  .space {}", pad).unwrap();
                    }
                    return Ok(());
                }
                (Type::Pointer(inner), Expr::String(value)) => {
                    if !matches!(inner.as_ref(), Type::Base(BaseType::Char)) {
                        return Err(CError::new("E2002", "string literal pointer type mismatch"));
                    }
                    let label = self.emit_string_literal(&value);
                    if ty.align() == Some(4) {
                        writeln!(self.data, "  .align 2").unwrap();
                    }
                    writeln!(self.data, "  .global {}", name).unwrap();
                    writeln!(self.data, "{}:", name).unwrap();
                    writeln!(self.data, "  .word {}", label).unwrap();
                    return Ok(());
                }
                _ => {}
            }

            let value = eval_const_expr(&init_expr, None)?;
            let bits = const_to_u32(value, &ty)?;
            if ty.align() == Some(4) {
                writeln!(self.data, "  .align 2").unwrap();
            }
            writeln!(self.data, "  .global {}", name).unwrap();
            writeln!(self.data, "{}:", name).unwrap();
            if ty.size() == Some(1) {
                writeln!(self.data, "  .byte {}", bits & 0xFF).unwrap();
            } else {
                writeln!(self.data, "  .word {}", bits).unwrap();
            }
            return Ok(());
        }

        let size = ty
            .size()
            .ok_or_else(|| CError::new("E2002", "invalid global size"))?;
        if ty.align() == Some(4) {
            writeln!(self.bss, "  .align 2").unwrap();
        }
        writeln!(self.bss, "  .global {}", name).unwrap();
        writeln!(self.bss, "{}:", name).unwrap();
        writeln!(self.bss, "  .space {}", size).unwrap();
        Ok(())
    }

    fn emit_function(&mut self, func: &Func) -> Result<(), CError> {
        let mut body = String::new();
        let ret_label = self.new_label("ret");
        let mut ctx = FuncContext::new(self, func.ret.clone(), ret_label.clone());
        ctx.push_scope();
        let mut params = Vec::new();
        for param in &func.params {
            let info = ctx.alloc_local(param.name.clone(), param.ty.clone())?;
            params.push((param, info));
        }
        if let Some(stmts) = &func.body {
            for stmt in stmts {
                ctx.emit_stmt(stmt, &mut body)?;
            }
        }
        if !ctx.saw_return {
            if !matches!(func.ret, Type::Base(BaseType::Void)) {
                ctx.emit_move_imm(&mut body, "R0", 0);
            }
            writeln!(body, "  B {}", ret_label).unwrap();
        }
        ctx.pop_scope();

        let stack_size = ctx.stack_size();
        writeln!(self.text, "  .global {}", func.name).unwrap();
        writeln!(self.text, "{}:", func.name).unwrap();
        writeln!(self.text, "  SUB SP, SP, #8").unwrap();
        writeln!(self.text, "  STR R11, [SP]").unwrap();
        writeln!(self.text, "  STR LR, [SP, #4]").unwrap();
        writeln!(self.text, "  MOV R11, SP").unwrap();
        if stack_size > 0 {
            emit_stack_adjust(&mut self.text, "SUB", stack_size as u32);
        }
        for (idx, (param, info)) in params.iter().enumerate() {
            let ty = &param.ty;
            let offset = match info.storage {
                Storage::Local(off) => off,
                _ => continue,
            };
            if idx < 4 {
                let reg = format!("R{}", idx);
                emit_store_local(&mut self.text, &reg, offset, ty);
            } else {
                let stack_off = 8 + ((idx - 4) as i32) * 4;
                emit_load_base_off(&mut self.text, "R0", "R11", stack_off, ty);
                emit_store_local(&mut self.text, "R0", offset, ty);
            }
        }
        self.text.push_str(&body);
        writeln!(self.text, "{}:", ret_label).unwrap();
        writeln!(self.text, "  MOV SP, R11").unwrap();
        writeln!(self.text, "  LDR R11, [SP]").unwrap();
        writeln!(self.text, "  LDR LR, [SP, #4]").unwrap();
        writeln!(self.text, "  ADD SP, SP, #8").unwrap();
        writeln!(self.text, "  MOV PC, LR\n").unwrap();
        Ok(())
    }

    fn emit_helpers(&mut self) {
        writeln!(self.text, "  .global __mul_u32").unwrap();
        writeln!(self.text, "__mul_u32:").unwrap();
        writeln!(self.text, "  MOV R2, #0").unwrap();
        writeln!(self.text, ".Lmul_u32_loop:").unwrap();
        writeln!(self.text, "  CMP R1, #0").unwrap();
        writeln!(self.text, "  B.EQ .Lmul_u32_end").unwrap();
        writeln!(self.text, "  AND R3, R1, #1").unwrap();
        writeln!(self.text, "  CMP R3, #0").unwrap();
        writeln!(self.text, "  B.EQ .Lmul_u32_skip").unwrap();
        writeln!(self.text, "  ADD R2, R2, R0").unwrap();
        writeln!(self.text, ".Lmul_u32_skip:").unwrap();
        writeln!(self.text, "  MOV R0, R0, LSL #1").unwrap();
        writeln!(self.text, "  MOV R1, R1, LSR #1").unwrap();
        writeln!(self.text, "  B .Lmul_u32_loop").unwrap();
        writeln!(self.text, ".Lmul_u32_end:").unwrap();
        writeln!(self.text, "  MOV R0, R2").unwrap();
        writeln!(self.text, "  MOV PC, LR\n").unwrap();

        writeln!(self.text, "  .global __mul_i32").unwrap();
        writeln!(self.text, "__mul_i32:").unwrap();
        writeln!(self.text, "  MOV R2, #0").unwrap();
        writeln!(self.text, "  CMP R0, #0").unwrap();
        writeln!(self.text, "  B.GE .Lmul_i32_a_pos").unwrap();
        writeln!(self.text, "  MOV R3, #0").unwrap();
        writeln!(self.text, "  SUB R0, R3, R0").unwrap();
        writeln!(self.text, "  EOR R2, R2, #1").unwrap();
        writeln!(self.text, ".Lmul_i32_a_pos:").unwrap();
        writeln!(self.text, "  CMP R1, #0").unwrap();
        writeln!(self.text, "  B.GE .Lmul_i32_b_pos").unwrap();
        writeln!(self.text, "  MOV R3, #0").unwrap();
        writeln!(self.text, "  SUB R1, R3, R1").unwrap();
        writeln!(self.text, "  EOR R2, R2, #1").unwrap();
        writeln!(self.text, ".Lmul_i32_b_pos:").unwrap();
        writeln!(self.text, "  MOV R3, #0").unwrap();
        writeln!(self.text, ".Lmul_i32_loop:").unwrap();
        writeln!(self.text, "  CMP R1, #0").unwrap();
        writeln!(self.text, "  B.EQ .Lmul_i32_end").unwrap();
        writeln!(self.text, "  AND R12, R1, #1").unwrap();
        writeln!(self.text, "  CMP R12, #0").unwrap();
        writeln!(self.text, "  B.EQ .Lmul_i32_skip").unwrap();
        writeln!(self.text, "  ADD R3, R3, R0").unwrap();
        writeln!(self.text, ".Lmul_i32_skip:").unwrap();
        writeln!(self.text, "  MOV R0, R0, LSL #1").unwrap();
        writeln!(self.text, "  MOV R1, R1, LSR #1").unwrap();
        writeln!(self.text, "  B .Lmul_i32_loop").unwrap();
        writeln!(self.text, ".Lmul_i32_end:").unwrap();
        writeln!(self.text, "  CMP R2, #0").unwrap();
        writeln!(self.text, "  B.EQ .Lmul_i32_done").unwrap();
        writeln!(self.text, "  MOV R0, #0").unwrap();
        writeln!(self.text, "  SUB R3, R0, R3").unwrap();
        writeln!(self.text, ".Lmul_i32_done:").unwrap();
        writeln!(self.text, "  MOV R0, R3").unwrap();
        writeln!(self.text, "  MOV PC, LR\n").unwrap();

        emit_div_mod_helpers(&mut self.text, true);
        emit_div_mod_helpers(&mut self.text, false);
    }

    fn new_label(&mut self, prefix: &str) -> String {
        let id = self.label_id;
        self.label_id += 1;
        format!(".L{}_{}", prefix, id)
    }

    fn emit_string_literal(&mut self, value: &str) -> String {
        let label = self.new_label("str");
        writeln!(self.rodata, "{}:", label).unwrap();
        writeln!(self.rodata, "  .asciz \"{}\"", escape_asm_string(value)).unwrap();
        label
    }
}

#[derive(Clone, Debug)]
struct VarInfo {
    ty: Type,
    storage: Storage,
    readonly: bool,
}

#[derive(Clone, Debug)]
enum Storage {
    Local(i32),
    Global(String),
}

struct FuncContext<'a> {
    cg: &'a mut Codegen,
    scopes: Vec<HashMap<String, VarInfo>>,
    stack_marks: Vec<i32>,
    stack_offset: i32,
    max_stack: i32,
    ret_type: Type,
    ret_label: String,
    break_labels: Vec<String>,
    continue_labels: Vec<String>,
    saw_return: bool,
}

impl<'a> FuncContext<'a> {
    fn new(cg: &'a mut Codegen, ret_type: Type, ret_label: String) -> Self {
        Self {
            cg,
            scopes: Vec::new(),
            stack_marks: Vec::new(),
            stack_offset: 0,
            max_stack: 0,
            ret_type,
            ret_label,
            break_labels: Vec::new(),
            continue_labels: Vec::new(),
            saw_return: false,
        }
    }

    fn push_scope(&mut self) {
        self.scopes.push(HashMap::new());
        self.stack_marks.push(self.stack_offset);
    }

    fn pop_scope(&mut self) {
        self.scopes.pop();
        if let Some(offset) = self.stack_marks.pop() {
            self.stack_offset = offset;
        }
    }

    fn stack_size(&self) -> u32 {
        let size = -self.max_stack;
        if size <= 0 {
            return 0;
        }
        align_up(size as u32, 4)
    }

    fn alloc_local(&mut self, name: String, ty: Type) -> Result<VarInfo, CError> {
        if let Type::Array(elem, len) = &ty {
            if *len == 0 {
                return Err(CError::new("E2006", "array size must be constant"));
            }
            if elem.size().is_none() {
                return Err(CError::new("E2002", "invalid array type"));
            }
        }
        let size = ty
            .size()
            .ok_or_else(|| CError::new("E2002", "invalid local type"))?;
        let align = ty.align().unwrap_or(4) as i32;
        let mut offset = self.stack_offset - size as i32;
        offset = align_down(offset, align);
        self.stack_offset = offset;
        if offset < self.max_stack {
            self.max_stack = offset;
        }
        let info = VarInfo {
            ty: ty.clone(),
            storage: Storage::Local(offset),
            readonly: false,
        };
        if let Some(scope) = self.scopes.last_mut() {
            if scope.contains_key(&name) {
                return Err(CError::new("E2004", "duplicate local definition"));
            }
            scope.insert(name, info.clone());
        }
        Ok(info)
    }

    fn find_var(&self, name: &str) -> Option<VarInfo> {
        for scope in self.scopes.iter().rev() {
            if let Some(info) = scope.get(name) {
                return Some(info.clone());
            }
        }
        self.cg.globals.get(name).map(|g| VarInfo {
            ty: g.ty.clone(),
            storage: Storage::Global(name.to_string()),
            readonly: false,
        })
    }

    fn find_var_mut(&mut self, name: &str) -> Option<&mut VarInfo> {
        for scope in self.scopes.iter_mut().rev() {
            if let Some(info) = scope.get_mut(name) {
                return Some(info);
            }
        }
        None
    }

    fn emit_stmt(&mut self, stmt: &Stmt, out: &mut String) -> Result<(), CError> {
        match stmt {
            Stmt::Block(stmts) => {
                self.push_scope();
                for s in stmts {
                    self.emit_stmt(s, out)?;
                }
                self.pop_scope();
            }
            Stmt::Decl(decl) => {
                let mut ty = decl.ty.clone();
                if let Type::Array(elem, len) = &ty {
                    if *len == 0 {
                        if let Some(Expr::String(value)) = &decl.init {
                            ty = Type::Array(elem.clone(), value.len() + 1);
                        } else {
                            return Err(CError::new("E2006", "array size must be constant"));
                        }
                    }
                }
                let mut info = self.alloc_local(decl.name.clone(), ty.clone())?;
                if let Some(init) = &decl.init {
                    match (&ty, init) {
                        (Type::Array(elem, len), Expr::String(value)) => {
                            if !matches!(elem.as_ref(), Type::Base(BaseType::Char)) {
                                return Err(CError::new("E2002", "string initializer type mismatch"));
                            }
                            if value.len() + 1 > *len {
                                return Err(CError::new("E2002", "string initializer too long"));
                            }
                            self.emit_addr_of_local(out, info.storage.clone(), "R1")?;
                            for (idx, byte) in value.as_bytes().iter().enumerate() {
                                self.emit_move_imm(out, "R0", *byte as i64);
                                emit_store_addr(out, "R1", idx as i32, &char_type());
                            }
                            self.emit_move_imm(out, "R0", 0);
                            emit_store_addr(out, "R1", value.len() as i32, &char_type());
                            let pad = *len - (value.len() + 1);
                            if pad > 0 {
                                for i in 0..pad {
                                    self.emit_move_imm(out, "R0", 0);
                                    emit_store_addr(out, "R1", (value.len() + 1 + i) as i32, &char_type());
                                }
                            }
                        }
                        (Type::Pointer(inner), Expr::String(value)) => {
                            if !matches!(inner.as_ref(), Type::Base(BaseType::Char)) {
                                return Err(CError::new("E2002", "string literal pointer type mismatch"));
                            }
                            let label = self.cg.emit_string_literal(value);
                            writeln!(out, "  LDR R0, ={}", label).unwrap();
                            emit_store_local(out, "R0", local_offset(&info.storage)?, &ty);
                            info.readonly = true;
                            if let Some(var) = self.find_var_mut(&decl.name) {
                                var.readonly = true;
                            }
                        }
                        _ => {
                            let rhs_ty = self.emit_expr(init, out)?;
                            self.convert_reg(out, &rhs_ty, &ty)?;
                            emit_store_local(out, "R0", local_offset(&info.storage)?, &ty);
                        }
                    }
                }
            }
            Stmt::Expr(expr) => {
                self.emit_expr(expr, out)?;
            }
            Stmt::Return(expr) => {
                if let Some(expr) = expr {
                    let rhs_ty = self.emit_expr(expr, out)?;
                    self.convert_reg(out, &rhs_ty, &self.ret_type)?;
                } else if !matches!(self.ret_type, Type::Base(BaseType::Void)) {
                    self.emit_move_imm(out, "R0", 0);
                }
                writeln!(out, "  B {}", self.ret_label).unwrap();
                self.saw_return = true;
            }
            Stmt::If {
                cond,
                then_branch,
                else_branch,
            } => {
                let else_label = self.cg.new_label("else");
                let end_label = self.cg.new_label("endif");
                self.emit_expr(cond, out)?;
                writeln!(out, "  CMP R0, #0").unwrap();
                writeln!(out, "  B.EQ {}", else_label).unwrap();
                self.emit_stmt(then_branch, out)?;
                writeln!(out, "  B {}", end_label).unwrap();
                writeln!(out, "{}:", else_label).unwrap();
                if let Some(else_branch) = else_branch {
                    self.emit_stmt(else_branch, out)?;
                }
                writeln!(out, "{}:", end_label).unwrap();
            }
            Stmt::While { cond, body } => {
                let cond_label = self.cg.new_label("while_cond");
                let end_label = self.cg.new_label("while_end");
                self.break_labels.push(end_label.clone());
                self.continue_labels.push(cond_label.clone());
                writeln!(out, "{}:", cond_label).unwrap();
                self.emit_expr(cond, out)?;
                writeln!(out, "  CMP R0, #0").unwrap();
                writeln!(out, "  B.EQ {}", end_label).unwrap();
                self.emit_stmt(body, out)?;
                writeln!(out, "  B {}", cond_label).unwrap();
                writeln!(out, "{}:", end_label).unwrap();
                self.break_labels.pop();
                self.continue_labels.pop();
            }
            Stmt::For {
                init,
                cond,
                post,
                body,
            } => {
                let cond_label = self.cg.new_label("for_cond");
                let post_label = self.cg.new_label("for_post");
                let end_label = self.cg.new_label("for_end");
                if let Some(init) = init {
                    self.emit_stmt(init, out)?;
                }
                self.break_labels.push(end_label.clone());
                self.continue_labels.push(post_label.clone());
                writeln!(out, "{}:", cond_label).unwrap();
                if let Some(cond) = cond {
                    self.emit_expr(cond, out)?;
                    writeln!(out, "  CMP R0, #0").unwrap();
                    writeln!(out, "  B.EQ {}", end_label).unwrap();
                }
                self.emit_stmt(body, out)?;
                writeln!(out, "{}:", post_label).unwrap();
                if let Some(post) = post {
                    self.emit_expr(post, out)?;
                }
                writeln!(out, "  B {}", cond_label).unwrap();
                writeln!(out, "{}:", end_label).unwrap();
                self.break_labels.pop();
                self.continue_labels.pop();
            }
            Stmt::Break => {
                let target = self
                    .break_labels
                    .last()
                    .ok_or_else(|| CError::new("E2008", "break outside loop"))?;
                writeln!(out, "  B {}", target).unwrap();
            }
            Stmt::Continue => {
                let target = self
                    .continue_labels
                    .last()
                    .ok_or_else(|| CError::new("E2008", "continue outside loop"))?;
                writeln!(out, "  B {}", target).unwrap();
            }
        }
        Ok(())
    }

    fn emit_expr(&mut self, expr: &Expr, out: &mut String) -> Result<Type, CError> {
        match expr {
            Expr::Number(NumberLit { value, unsigned }) => {
                self.emit_move_imm(out, "R0", *value as i64);
                if *unsigned {
                    Ok(uint_type())
                } else {
                    Ok(int_type())
                }
            }
            Expr::Char(value) => {
                self.emit_move_imm(out, "R0", *value as i64);
                Ok(char_type())
            }
            Expr::String(value) => {
                let label = self.cg.emit_string_literal(value);
                writeln!(out, "  LDR R0, ={}", label).unwrap();
                Ok(Type::Pointer(Box::new(char_type())))
            }
            Expr::Var(name) => {
                let info = self
                    .find_var(name)
                    .ok_or_else(|| CError::new("E2003", "undefined identifier"))?;
                if info.ty.is_array() {
                    self.emit_addr_of_var(out, &info, "R0")?;
                    if let Type::Array(elem, _) = info.ty {
                        return Ok(Type::Pointer(elem));
                    }
                }
                self.emit_load_var(out, &info)?;
                Ok(info.ty)
            }
            Expr::Unary { op, expr } => self.emit_unary(*op, expr, out),
            Expr::Binary { op, left, right } => self.emit_binary(*op, left, right, out),
            Expr::Assign { left, right } => self.emit_assign(left, right, out),
            Expr::Call { name, args } => self.emit_call(name, args, out),
            Expr::Index { base: _, index: _ } => {
                let lval = self.emit_lvalue_addr(expr, out)?;
                self.emit_load_addr(out, "R0", &lval.ty)?;
                Ok(lval.ty)
            }
            Expr::Cast { ty, expr } => {
                let from_ty = self.emit_expr(expr, out)?;
                self.convert_reg_explicit(out, &from_ty, ty)?;
                Ok(ty.clone())
            }
            Expr::SizeofType(ty) => {
                let size = ty
                    .size()
                    .ok_or_else(|| CError::new("E2008", "sizeof invalid type"))?;
                self.emit_move_imm(out, "R0", size as i64);
                Ok(int_type())
            }
            Expr::SizeofExpr(expr) => {
                let ty = self.type_of_expr(expr, false)?;
                let size = ty
                    .size()
                    .ok_or_else(|| CError::new("E2008", "sizeof invalid type"))?;
                self.emit_move_imm(out, "R0", size as i64);
                Ok(int_type())
            }
        }
    }

    fn emit_unary(&mut self, op: UnaryOp, expr: &Expr, out: &mut String) -> Result<Type, CError> {
        match op {
            UnaryOp::Neg => {
                let ty = self.emit_expr(expr, out)?;
                if !ty.is_integer() {
                    return Err(CError::new("E2002", "invalid unary -"));
                }
                writeln!(out, "  MOV R1, #0").unwrap();
                writeln!(out, "  SUB R0, R1, R0").unwrap();
                Ok(ty)
            }
            UnaryOp::Not => {
                self.emit_expr(expr, out)?;
                writeln!(out, "  CMP R0, #0").unwrap();
                writeln!(out, "  MOV R0, #0").unwrap();
                writeln!(out, "  MOV.EQ R0, #1").unwrap();
                Ok(bool_type())
            }
            UnaryOp::BitNot => {
                let ty = self.emit_expr(expr, out)?;
                if !ty.is_integer() {
                    return Err(CError::new("E2002", "invalid unary ~"));
                }
                writeln!(out, "  MVN R0, R0").unwrap();
                Ok(ty)
            }
            UnaryOp::Addr => {
                let lval = self.emit_lvalue_addr(expr, out)?;
                let base = if let Type::Array(elem, _) = lval.ty {
                    Type::Pointer(elem)
                } else {
                    Type::Pointer(Box::new(lval.ty))
                };
                Ok(base)
            }
            UnaryOp::Deref => {
                let ty = self.emit_expr(expr, out)?;
                if let Type::Pointer(elem) = ty {
                    self.emit_load_addr(out, "R0", elem.as_ref())?;
                    Ok(*elem)
                } else {
                    Err(CError::new("E2002", "invalid dereference"))
                }
            }
        }
    }

    fn emit_binary(
        &mut self,
        op: BinaryOp,
        left: &Expr,
        right: &Expr,
        out: &mut String,
    ) -> Result<Type, CError> {
        match op {
            BinaryOp::LogAnd => return self.emit_logical_and(left, right, out),
            BinaryOp::LogOr => return self.emit_logical_or(left, right, out),
            _ => {}
        }

        let left_ty = self.emit_expr(left, out)?;
        self.emit_push(out, "R0");
        let right_ty = self.emit_expr(right, out)?;
        self.emit_pop(out, "R1");

        match op {
            BinaryOp::Add | BinaryOp::Sub => {
                if left_ty.is_pointer() && right_ty.is_integer() {
                    let elem = left_ty.elem().ok_or_else(|| CError::new("E2002", "bad pointer"))?;
                    let scale = elem.size().unwrap_or(1) as i32;
                    if scale == 4 {
                        if op == BinaryOp::Sub {
                            writeln!(out, "  SUB R0, R1, R0, LSL #2").unwrap();
                        } else {
                            writeln!(out, "  ADD R0, R1, R0, LSL #2").unwrap();
                        }
                    } else {
                        if op == BinaryOp::Sub {
                            writeln!(out, "  SUB R0, R1, R0").unwrap();
                        } else {
                            writeln!(out, "  ADD R0, R1, R0").unwrap();
                        }
                    }
                    return Ok(left_ty);
                }
                if right_ty.is_pointer() && left_ty.is_integer() && op == BinaryOp::Add {
                    let elem = right_ty.elem().ok_or_else(|| CError::new("E2002", "bad pointer"))?;
                    let scale = elem.size().unwrap_or(1) as i32;
                    if scale == 4 {
                        writeln!(out, "  ADD R0, R0, R1, LSL #2").unwrap();
                    } else {
                        writeln!(out, "  ADD R0, R0, R1").unwrap();
                    }
                    return Ok(right_ty);
                }
                if left_ty.is_pointer() && right_ty.is_pointer() && op == BinaryOp::Sub {
                    let elem_left = left_ty.elem().ok_or_else(|| CError::new("E2002", "bad pointer"))?;
                    let elem_right = right_ty.elem().ok_or_else(|| CError::new("E2002", "bad pointer"))?;
                    if elem_left != elem_right {
                        return Err(CError::new("E2002", "pointer type mismatch"));
                    }
                    writeln!(out, "  SUB R0, R1, R0").unwrap();
                    let scale = elem_left.size().unwrap_or(1);
                    if scale == 4 {
                        writeln!(out, "  MOV R0, R0, ASR #2").unwrap();
                    }
                    return Ok(int_type());
                }
                if !left_ty.is_integer() || !right_ty.is_integer() {
                    return Err(CError::new("E2002", "invalid operands"));
                }
                let common = common_int_type(&left_ty, &right_ty);
                self.convert_reg(out, &right_ty, &common)?;
                if left_ty != common {
                    writeln!(out, "  MOV R2, R0").unwrap();
                    writeln!(out, "  MOV R0, R1").unwrap();
                    self.convert_reg(out, &left_ty, &common)?;
                    writeln!(out, "  MOV R1, R0").unwrap();
                    writeln!(out, "  MOV R0, R2").unwrap();
                }
                match op {
                    BinaryOp::Add => writeln!(out, "  ADD R0, R1, R0").unwrap(),
                    BinaryOp::Sub => writeln!(out, "  SUB R0, R1, R0").unwrap(),
                    _ => {}
                }
                Ok(common)
            }
            BinaryOp::Mul | BinaryOp::Div | BinaryOp::Mod => {
                if !left_ty.is_integer() || !right_ty.is_integer() {
                    return Err(CError::new("E2002", "invalid operands"));
                }
                let common = common_int_type(&left_ty, &right_ty);
                let helper = match (op, common.is_unsigned()) {
                    (BinaryOp::Mul, true) => "__mul_u32",
                    (BinaryOp::Mul, false) => "__mul_i32",
                    (BinaryOp::Div, true) => "__div_u32",
                    (BinaryOp::Div, false) => "__div_i32",
                    (BinaryOp::Mod, true) => "__mod_u32",
                    (BinaryOp::Mod, false) => "__mod_i32",
                    _ => "__mul_i32",
                };
                self.convert_reg(out, &right_ty, &common)?;
                writeln!(out, "  MOV R2, R0").unwrap();
                writeln!(out, "  MOV R0, R1").unwrap();
                self.convert_reg(out, &left_ty, &common)?;
                writeln!(out, "  MOV R1, R2").unwrap();
                writeln!(out, "  BL {}", helper).unwrap();
                Ok(common)
            }
            BinaryOp::BitAnd | BinaryOp::BitOr | BinaryOp::BitXor => {
                if !left_ty.is_integer() || !right_ty.is_integer() {
                    return Err(CError::new("E2002", "invalid operands"));
                }
                let common = common_int_type(&left_ty, &right_ty);
                self.convert_reg(out, &right_ty, &common)?;
                writeln!(out, "  MOV R2, R0").unwrap();
                writeln!(out, "  MOV R0, R1").unwrap();
                self.convert_reg(out, &left_ty, &common)?;
                writeln!(out, "  MOV R1, R0").unwrap();
                writeln!(out, "  MOV R0, R2").unwrap();
                match op {
                    BinaryOp::BitAnd => writeln!(out, "  AND R0, R1, R0").unwrap(),
                    BinaryOp::BitOr => writeln!(out, "  ORR R0, R1, R0").unwrap(),
                    BinaryOp::BitXor => writeln!(out, "  EOR R0, R1, R0").unwrap(),
                    _ => {}
                }
                Ok(common)
            }
            BinaryOp::Shl | BinaryOp::Shr => {
                if !left_ty.is_integer() || !right_ty.is_integer() {
                    return Err(CError::new("E2002", "invalid operands"));
                }
                let left_prom = promote_int(&left_ty);
                self.convert_reg(out, &right_ty, &int_type())?;
                if left_ty != left_prom {
                    writeln!(out, "  MOV R2, R0").unwrap();
                    writeln!(out, "  MOV R0, R1").unwrap();
                    self.convert_reg(out, &left_ty, &left_prom)?;
                    writeln!(out, "  MOV R1, R0").unwrap();
                    writeln!(out, "  MOV R0, R2").unwrap();
                }
                writeln!(out, "  AND R0, R0, #31").unwrap();
                let loop_label = self.cg.new_label("shift");
                let end_label = self.cg.new_label("shift_end");
                writeln!(out, "  CMP R0, #0").unwrap();
                writeln!(out, "  B.EQ {}", end_label).unwrap();
                writeln!(out, "{}:", loop_label).unwrap();
                match (op, left_prom.is_unsigned()) {
                    (BinaryOp::Shl, _) => writeln!(out, "  MOV R1, R1, LSL #1").unwrap(),
                    (BinaryOp::Shr, true) => writeln!(out, "  MOV R1, R1, LSR #1").unwrap(),
                    (BinaryOp::Shr, false) => writeln!(out, "  MOV R1, R1, ASR #1").unwrap(),
                    _ => {}
                }
                writeln!(out, "  SUB R0, R0, #1").unwrap();
                writeln!(out, "  CMP R0, #0").unwrap();
                writeln!(out, "  B.NE {}", loop_label).unwrap();
                writeln!(out, "{}:", end_label).unwrap();
                writeln!(out, "  MOV R0, R1").unwrap();
                Ok(left_prom)
            }
            BinaryOp::Eq
            | BinaryOp::Ne
            | BinaryOp::Lt
            | BinaryOp::Le
            | BinaryOp::Gt
            | BinaryOp::Ge => {
                if left_ty.is_pointer() && right_ty.is_pointer() {
                    writeln!(out, "  CMP R1, R0").unwrap();
                    emit_set_cond(out, op, false);
                    return Ok(bool_type());
                }
                if !left_ty.is_integer() || !right_ty.is_integer() {
                    return Err(CError::new("E2002", "invalid operands"));
                }
                let common = common_int_type(&left_ty, &right_ty);
                self.convert_reg(out, &right_ty, &common)?;
                writeln!(out, "  MOV R2, R0").unwrap();
                writeln!(out, "  MOV R0, R1").unwrap();
                self.convert_reg(out, &left_ty, &common)?;
                writeln!(out, "  MOV R1, R0").unwrap();
                writeln!(out, "  MOV R0, R2").unwrap();
                writeln!(out, "  CMP R1, R0").unwrap();
                emit_set_cond(out, op, common.is_unsigned());
                Ok(bool_type())
            }
            _ => Err(CError::new("E2008", "unsupported binary op")),
        }
    }

    fn emit_assign(&mut self, left: &Expr, right: &Expr, out: &mut String) -> Result<Type, CError> {
        if let Expr::Var(name) = left {
            if let Some(info) = self.find_var_mut(name) {
                info.readonly = false;
            }
        }
        let lval = self.emit_lvalue_addr(left, out)?;
        if !lval.assignable {
            return Err(CError::new("E2005", "invalid lvalue"));
        }
        if lval.readonly {
            return Err(CError::new("E2008", "write to string literal"));
        }
        self.emit_push(out, "R0");
        let rhs_ty = self.emit_expr(right, out)?;
        self.convert_reg(out, &rhs_ty, &lval.ty)?;
        self.emit_pop(out, "R1");
        emit_store_addr(out, "R1", 0, &lval.ty);
        Ok(lval.ty)
    }

    fn emit_call(&mut self, name: &str, args: &[Expr], out: &mut String) -> Result<Type, CError> {
        match name {
            "putc" => {
                if args.len() != 1 {
                    return Err(CError::new("E2002", "putc expects 1 argument"));
                }
                let ty = self.emit_expr(&args[0], out)?;
                self.convert_reg(out, &ty, &int_type())?;
                writeln!(out, "  SVC #0x11").unwrap();
                return Ok(int_type());
            }
            "getc" => {
                if !args.is_empty() {
                    return Err(CError::new("E2002", "getc expects 0 arguments"));
                }
                writeln!(out, "  SVC #0x12").unwrap();
                return Ok(int_type());
            }
            "exit" => {
                if args.len() != 1 {
                    return Err(CError::new("E2002", "exit expects 1 argument"));
                }
                let ty = self.emit_expr(&args[0], out)?;
                self.convert_reg(out, &ty, &int_type())?;
                writeln!(out, "  SVC #0x10").unwrap();
                return Ok(Type::Base(BaseType::Void));
            }
            _ => {}
        }
        let func = self
            .cg
            .funcs
            .get(name)
            .ok_or_else(|| CError::new("E2003", "undefined function"))?
            .clone();
        if func.params.len() != args.len() {
            return Err(CError::new("E2002", "argument count mismatch"));
        }
        for (idx, arg) in args.iter().enumerate().rev() {
            let arg_ty = self.emit_expr(arg, out)?;
            let target_ty = func.params[idx].clone();
            self.convert_reg(out, &arg_ty, &target_ty)?;
            self.emit_push(out, "R0");
        }
        let regs = args.len().min(4);
        for i in 0..regs {
            let reg = format!("R{}", i);
            self.emit_pop(out, &reg);
        }
        writeln!(out, "  BL {}", name).unwrap();
        if args.len() > 4 {
            emit_stack_adjust(out, "ADD", ((args.len() - 4) * 4) as u32);
        }
        Ok(func.ret)
    }

    fn emit_logical_and(&mut self, left: &Expr, right: &Expr, out: &mut String) -> Result<Type, CError> {
        let false_label = self.cg.new_label("land_false");
        let end_label = self.cg.new_label("land_end");
        self.emit_expr(left, out)?;
        writeln!(out, "  CMP R0, #0").unwrap();
        writeln!(out, "  B.EQ {}", false_label).unwrap();
        self.emit_expr(right, out)?;
        writeln!(out, "  CMP R0, #0").unwrap();
        writeln!(out, "  B.EQ {}", false_label).unwrap();
        writeln!(out, "  MOV R0, #1").unwrap();
        writeln!(out, "  B {}", end_label).unwrap();
        writeln!(out, "{}:", false_label).unwrap();
        writeln!(out, "  MOV R0, #0").unwrap();
        writeln!(out, "{}:", end_label).unwrap();
        Ok(bool_type())
    }

    fn emit_logical_or(&mut self, left: &Expr, right: &Expr, out: &mut String) -> Result<Type, CError> {
        let true_label = self.cg.new_label("lor_true");
        let end_label = self.cg.new_label("lor_end");
        self.emit_expr(left, out)?;
        writeln!(out, "  CMP R0, #0").unwrap();
        writeln!(out, "  B.NE {}", true_label).unwrap();
        self.emit_expr(right, out)?;
        writeln!(out, "  CMP R0, #0").unwrap();
        writeln!(out, "  B.NE {}", true_label).unwrap();
        writeln!(out, "  MOV R0, #0").unwrap();
        writeln!(out, "  B {}", end_label).unwrap();
        writeln!(out, "{}:", true_label).unwrap();
        writeln!(out, "  MOV R0, #1").unwrap();
        writeln!(out, "{}:", end_label).unwrap();
        Ok(bool_type())
    }

    fn emit_lvalue_addr(&mut self, expr: &Expr, out: &mut String) -> Result<LValue, CError> {
        match expr {
            Expr::Var(name) => {
                let info = self
                    .find_var(name)
                    .ok_or_else(|| CError::new("E2003", "undefined identifier"))?;
                if info.ty.is_array() {
                    self.emit_addr_of_var(out, &info, "R0")?;
                    return Ok(LValue {
                        ty: info.ty,
                        assignable: false,
                        readonly: false,
                    });
                }
                self.emit_addr_of_var(out, &info, "R0")?;
                Ok(LValue {
                    ty: info.ty,
                    assignable: true,
                    readonly: false,
                })
            }
            Expr::Unary { op: UnaryOp::Deref, expr } => {
                let base_ty = self.emit_expr(expr, out)?;
                if let Type::Pointer(elem) = base_ty {
                    let readonly = self.is_readonly_ptr_expr(expr);
                    Ok(LValue {
                        ty: *elem,
                        assignable: true,
                        readonly,
                    })
                } else {
                    Err(CError::new("E2002", "invalid dereference"))
                }
            }
            Expr::Index { base, index } => {
                let base_ty = self.emit_expr(base, out)?;
                self.emit_push(out, "R0");
                let idx_ty = self.emit_expr(index, out)?;
                if !idx_ty.is_integer() {
                    return Err(CError::new("E2002", "invalid index type"));
                }
                self.emit_pop(out, "R1");
                let elem = match base_ty {
                    Type::Pointer(elem) => elem,
                    Type::Array(elem, _) => elem,
                    _ => return Err(CError::new("E2002", "invalid index base")),
                };
                let scale = elem.size().unwrap_or(1) as i32;
                if scale == 4 {
                    writeln!(out, "  ADD R0, R1, R0, LSL #2").unwrap();
                } else {
                    writeln!(out, "  ADD R0, R1, R0").unwrap();
                }
                Ok(LValue {
                    ty: *elem,
                    assignable: true,
                    readonly: self.is_readonly_ptr_expr(base),
                })
            }
            _ => Err(CError::new("E2005", "invalid lvalue")),
        }
    }

    fn emit_load_var(&mut self, out: &mut String, info: &VarInfo) -> Result<(), CError> {
        match &info.storage {
            Storage::Local(offset) => {
                emit_load_base_off(out, "R0", "R11", *offset, &info.ty);
            }
            Storage::Global(name) => {
                writeln!(out, "  LDR R0, ={}", name).unwrap();
                self.emit_load_addr(out, "R0", &info.ty)?;
            }
        }
        Ok(())
    }

    fn emit_addr_of_var(&mut self, out: &mut String, info: &VarInfo, dst: &str) -> Result<(), CError> {
        match &info.storage {
            Storage::Local(_) => self.emit_addr_of_local(out, info.storage.clone(), dst),
            Storage::Global(name) => {
                writeln!(out, "  LDR {}, ={}", dst, name).unwrap();
                Ok(())
            }
        }
    }

    fn emit_addr_of_local(&mut self, out: &mut String, storage: Storage, dst: &str) -> Result<(), CError> {
        let offset = local_offset(&storage)?;
        emit_add_reg_imm(out, dst, "R11", offset);
        Ok(())
    }

    fn emit_load_addr(&mut self, out: &mut String, base: &str, ty: &Type) -> Result<(), CError> {
        match ty {
            Type::Base(BaseType::Char) | Type::Base(BaseType::Bool) => {
                writeln!(out, "  LDRB R0, [{}]", base).unwrap();
            }
            _ => {
                writeln!(out, "  LDR R0, [{}]", base).unwrap();
            }
        }
        Ok(())
    }

    fn emit_move_imm(&self, out: &mut String, reg: &str, value: i64) {
        writeln!(out, "  MOV {}, #{}", reg, value).unwrap();
    }

    fn emit_push(&self, out: &mut String, reg: &str) {
        writeln!(out, "  SUB SP, SP, #4").unwrap();
        writeln!(out, "  STR {}, [SP]", reg).unwrap();
    }

    fn emit_pop(&self, out: &mut String, reg: &str) {
        writeln!(out, "  LDR {}, [SP]", reg).unwrap();
        writeln!(out, "  ADD SP, SP, #4").unwrap();
    }

    fn convert_reg(&self, out: &mut String, from: &Type, to: &Type) -> Result<(), CError> {
        if from == to {
            return Ok(());
        }
        match (from, to) {
            (Type::Base(BaseType::Char), Type::Base(BaseType::Int))
            | (Type::Base(BaseType::Bool), Type::Base(BaseType::Int))
            | (Type::Base(BaseType::Char), Type::Base(BaseType::UInt))
            | (Type::Base(BaseType::Bool), Type::Base(BaseType::UInt))
            | (Type::Base(BaseType::Int), Type::Base(BaseType::UInt))
            | (Type::Base(BaseType::UInt), Type::Base(BaseType::Int))
            | (Type::Pointer(_), Type::Pointer(_))
            | (Type::Pointer(_), Type::Base(BaseType::Int))
            | (Type::Pointer(_), Type::Base(BaseType::UInt)) => Ok(()),
            // int/uint to pointer requires explicit cast
            (Type::Base(BaseType::Int), Type::Pointer(_))
            | (Type::Base(BaseType::UInt), Type::Pointer(_)) => {
                Err(CError::new("E2002", "cannot implicitly convert integer to pointer"))
            }
            (_, Type::Base(BaseType::Char)) => {
                writeln!(out, "  AND R0, R0, #255").unwrap();
                Ok(())
            }
            (_, Type::Base(BaseType::Bool)) => {
                writeln!(out, "  CMP R0, #0").unwrap();
                writeln!(out, "  MOV R0, #0").unwrap();
                writeln!(out, "  MOV.NE R0, #1").unwrap();
                Ok(())
            }
            _ => Err(CError::new("E2002", "invalid conversion")),
        }
    }

    /// Like convert_reg but allows explicit int↔pointer conversions (for casts)
    fn convert_reg_explicit(&self, out: &mut String, from: &Type, to: &Type) -> Result<(), CError> {
        if from == to {
            return Ok(());
        }
        // Allow int/uint to pointer for explicit casts
        match (from, to) {
            (Type::Base(BaseType::Int), Type::Pointer(_))
            | (Type::Base(BaseType::UInt), Type::Pointer(_)) => Ok(()),
            _ => self.convert_reg(out, from, to),
        }
    }

    fn type_of_expr(&self, expr: &Expr, decay_arrays: bool) -> Result<Type, CError> {
        match expr {
            Expr::Number(NumberLit { unsigned, .. }) => {
                if *unsigned {
                    Ok(uint_type())
                } else {
                    Ok(int_type())
                }
            }
            Expr::Char(_) => Ok(char_type()),
            Expr::String(_) => Ok(Type::Pointer(Box::new(char_type()))),
            Expr::Var(name) => {
                let info = self
                    .find_var(name)
                    .ok_or_else(|| CError::new("E2003", "undefined identifier"))?;
                if decay_arrays {
                    Ok(info.ty.decay())
                } else {
                    Ok(info.ty)
                }
            }
            Expr::Unary { op, expr } => match op {
                UnaryOp::Addr => {
                    let inner = self.type_of_expr(expr, false)?;
                    Ok(Type::Pointer(Box::new(inner)))
                }
                UnaryOp::Deref => {
                    let inner = self.type_of_expr(expr, true)?;
                    if let Type::Pointer(elem) = inner {
                        Ok(*elem)
                    } else {
                        Err(CError::new("E2002", "invalid dereference"))
                    }
                }
                UnaryOp::Not => Ok(bool_type()),
                UnaryOp::BitNot | UnaryOp::Neg => {
                    let inner = self.type_of_expr(expr, true)?;
                    if inner.is_integer() {
                        Ok(promote_int(&inner))
                    } else {
                        Err(CError::new("E2002", "invalid unary"))
                    }
                }
            },
            Expr::Binary { op, left, right } => match op {
                BinaryOp::LogAnd | BinaryOp::LogOr => Ok(bool_type()),
                BinaryOp::Eq
                | BinaryOp::Ne
                | BinaryOp::Lt
                | BinaryOp::Le
                | BinaryOp::Gt
                | BinaryOp::Ge => Ok(bool_type()),
                BinaryOp::Add | BinaryOp::Sub => {
                    let lt = self.type_of_expr(left, true)?;
                    let rt = self.type_of_expr(right, true)?;
                    if lt.is_pointer() && rt.is_integer() {
                        Ok(lt)
                    } else if rt.is_pointer() && lt.is_integer() && *op == BinaryOp::Add {
                        Ok(rt)
                    } else if lt.is_pointer() && rt.is_pointer() && *op == BinaryOp::Sub {
                        Ok(int_type())
                    } else if lt.is_integer() && rt.is_integer() {
                        Ok(common_int_type(&lt, &rt))
                    } else {
                        Err(CError::new("E2002", "invalid operands"))
                    }
                }
                BinaryOp::Mul
                | BinaryOp::Div
                | BinaryOp::Mod
                | BinaryOp::BitAnd
                | BinaryOp::BitOr
                | BinaryOp::BitXor
                | BinaryOp::Shl
                | BinaryOp::Shr => {
                    let lt = self.type_of_expr(left, true)?;
                    let rt = self.type_of_expr(right, true)?;
                    if lt.is_integer() && rt.is_integer() {
                        Ok(common_int_type(&lt, &rt))
                    } else {
                        Err(CError::new("E2002", "invalid operands"))
                    }
                }
            },
            Expr::Assign { left, .. } => {
                let lt = self.type_of_expr(left, false)?;
                Ok(lt)
            }
            Expr::Call { name, .. } => {
                let func = self
                    .cg
                    .funcs
                    .get(name)
                    .ok_or_else(|| CError::new("E2003", "undefined function"))?;
                Ok(func.ret.clone())
            }
            Expr::Index { base, .. } => {
                let bt = self.type_of_expr(base, true)?;
                if let Type::Pointer(elem) = bt {
                    Ok(*elem)
                } else if let Type::Array(elem, _) = bt {
                    Ok(*elem)
                } else {
                    Err(CError::new("E2002", "invalid index base"))
                }
            }
            Expr::Cast { ty, .. } => Ok(ty.clone()),
            Expr::SizeofType(_) | Expr::SizeofExpr(_) => Ok(int_type()),
        }
    }

    fn is_readonly_ptr_expr(&mut self, expr: &Expr) -> bool {
        match expr {
            Expr::String(_) => true,
            Expr::Var(name) => self
                .find_var(name)
                .map(|v| v.readonly)
                .unwrap_or(false),
            Expr::Binary { op: BinaryOp::Add, left, .. }
            | Expr::Binary { op: BinaryOp::Sub, left, .. } => self.is_readonly_ptr_expr(left),
            Expr::Cast { expr, .. } => self.is_readonly_ptr_expr(expr),
            _ => false,
        }
    }
}

struct LValue {
    ty: Type,
    assignable: bool,
    readonly: bool,
}

fn local_offset(storage: &Storage) -> Result<i32, CError> {
    match storage {
        Storage::Local(off) => Ok(*off),
        _ => Err(CError::new("E2008", "expected local")),
    }
}

fn emit_store_local(out: &mut String, reg: &str, offset: i32, ty: &Type) {
    if reg != "R0" {
        writeln!(out, "  MOV R0, {}", reg).unwrap();
    }
    emit_store_addr(out, "R11", offset, ty);
}

fn emit_load_base_off(out: &mut String, reg: &str, base: &str, offset: i32, ty: &Type) {
    match ty {
        Type::Base(BaseType::Char) | Type::Base(BaseType::Bool) => {
            writeln!(out, "  LDRB {}, [{}, #{}]", reg, base, offset).unwrap();
        }
        _ => {
            writeln!(out, "  LDR {}, [{}, #{}]", reg, base, offset).unwrap();
        }
    }
}

fn emit_store_addr(out: &mut String, base: &str, offset: i32, ty: &Type) {
    match ty {
        Type::Base(BaseType::Char) | Type::Base(BaseType::Bool) => {
            writeln!(out, "  STRB R0, [{}, #{}]", base, offset).unwrap();
        }
        _ => {
            writeln!(out, "  STR R0, [{}, #{}]", base, offset).unwrap();
        }
    }
}

fn emit_add_reg_imm(out: &mut String, dst: &str, base: &str, offset: i32) {
    if fits_imm12(offset) {
        writeln!(out, "  ADD {}, {}, #{}", dst, base, offset).unwrap();
    } else {
        writeln!(out, "  MOV R12, #{}", offset).unwrap();
        writeln!(out, "  ADD {}, {}, R12", dst, base).unwrap();
    }
}

fn emit_stack_adjust(out: &mut String, op: &str, amount: u32) {
    if amount == 0 {
        return;
    }
    if amount <= 2047 {
        writeln!(out, "  {} SP, SP, #{}", op, amount).unwrap();
    } else {
        writeln!(out, "  MOV R12, #{}", amount).unwrap();
        writeln!(out, "  {} SP, SP, R12", op).unwrap();
    }
}

fn emit_set_cond(out: &mut String, op: BinaryOp, unsigned: bool) {
    writeln!(out, "  MOV R0, #0").unwrap();
    let cond = match op {
        BinaryOp::Eq => "EQ",
        BinaryOp::Ne => "NE",
        BinaryOp::Lt => {
            if unsigned {
                "CC"
            } else {
                "LT"
            }
        }
        BinaryOp::Le => {
            if unsigned {
                "LS"
            } else {
                "LE"
            }
        }
        BinaryOp::Gt => {
            if unsigned {
                "HI"
            } else {
                "GT"
            }
        }
        BinaryOp::Ge => {
            if unsigned {
                "CS"
            } else {
                "GE"
            }
        }
        _ => "EQ",
    };
    writeln!(out, "  MOV.{} R0, #1", cond).unwrap();
}

fn promote_int(ty: &Type) -> Type {
    match ty {
        Type::Base(BaseType::Char) | Type::Base(BaseType::Bool) => int_type(),
        Type::Base(BaseType::UInt) => uint_type(),
        Type::Base(BaseType::Int) => int_type(),
        _ => ty.clone(),
    }
}

fn common_int_type(left: &Type, right: &Type) -> Type {
    let l = promote_int(left);
    let r = promote_int(right);
    if l.is_unsigned() || r.is_unsigned() {
        uint_type()
    } else {
        int_type()
    }
}

fn fits_imm12(value: i32) -> bool {
    value >= -2048 && value <= 2047
}

fn align_up(value: u32, align: u32) -> u32 {
    if align == 0 {
        return value;
    }
    (value + align - 1) & !(align - 1)
}

fn align_down(value: i32, align: i32) -> i32 {
    if align == 0 {
        return value;
    }
    let rem = value % align;
    if rem == 0 {
        value
    } else {
        value - (align + rem)
    }
}

fn escape_asm_string(value: &str) -> String {
    let mut out = String::new();
    for ch in value.chars() {
        match ch {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            _ => out.push(ch),
        }
    }
    out
}

fn eval_const_expr(expr: &Expr, ctx: Option<&FuncContext>) -> Result<i64, CError> {
    match expr {
        Expr::Number(NumberLit { value, .. }) => Ok(*value as i64),
        Expr::Char(value) => Ok(*value as i64),
        Expr::Unary { op, expr } => {
            let v = eval_const_expr(expr, ctx)?;
            match op {
                UnaryOp::Neg => Ok(v.wrapping_neg()),
                UnaryOp::BitNot => Ok(!v),
                _ => Err(CError::new("E2006", "constant expression required")),
            }
        }
        Expr::Binary { op, left, right } => {
            let a = eval_const_expr(left, ctx)?;
            let b = eval_const_expr(right, ctx)?;
            match op {
                BinaryOp::Add => Ok(a.wrapping_add(b)),
                BinaryOp::Sub => Ok(a.wrapping_sub(b)),
                BinaryOp::Mul => Ok(a.wrapping_mul(b)),
                BinaryOp::Div => {
                    if b == 0 {
                        return Err(CError::new("E2007", "division by zero"));
                    }
                    Ok(a / b)
                }
                BinaryOp::Mod => {
                    if b == 0 {
                        return Err(CError::new("E2007", "division by zero"));
                    }
                    Ok(a % b)
                }
                BinaryOp::BitAnd => Ok(a & b),
                BinaryOp::BitOr => Ok(a | b),
                BinaryOp::BitXor => Ok(a ^ b),
                BinaryOp::Shl => Ok(a << (b & 31)),
                BinaryOp::Shr => Ok(a >> (b & 31)),
                _ => Err(CError::new("E2006", "constant expression required")),
            }
        }
        Expr::Cast { expr, .. } => eval_const_expr(expr, ctx),
        Expr::SizeofType(ty) => ty
            .size()
            .map(|s| s as i64)
            .ok_or_else(|| CError::new("E2008", "sizeof invalid type")),
        Expr::SizeofExpr(expr) => {
            let ctx = ctx.ok_or_else(|| CError::new("E2006", "constant expression required"))?;
            let ty = ctx.type_of_expr(expr, false)?;
            ty.size()
                .map(|s| s as i64)
                .ok_or_else(|| CError::new("E2008", "sizeof invalid type"))
        }
        _ => Err(CError::new("E2006", "constant expression required")),
    }
}

fn const_to_u32(value: i64, ty: &Type) -> Result<u32, CError> {
    match ty {
        Type::Base(BaseType::Char) => Ok((value as i64 as u32) & 0xFF),
        Type::Base(BaseType::Bool) => Ok(if value == 0 { 0 } else { 1 }),
        Type::Base(BaseType::Int) => Ok(value as i32 as u32),
        Type::Base(BaseType::UInt) | Type::Pointer(_) => Ok(value as u32),
        Type::Array(_, _) => Err(CError::new("E2002", "invalid const conversion")),
        Type::Base(BaseType::Void) => Err(CError::new("E2002", "invalid const conversion")),
    }
}

fn emit_div_mod_helpers(out: &mut String, unsigned: bool) {
    let suffix = if unsigned { "u32" } else { "i32" };
    writeln!(out, "  .global __div_{}", suffix).unwrap();
    writeln!(out, "__div_{}:", suffix).unwrap();
    writeln!(out, "  CMP R1, #0").unwrap();
    writeln!(out, "  B.NE .Ldiv_{}_cont", suffix).unwrap();
    writeln!(out, "  SVC #1").unwrap();
    writeln!(out, ".Ldiv_{}_cont:", suffix).unwrap();
    if unsigned {
        writeln!(out, "  MOV R2, #0").unwrap();
        writeln!(out, ".Ldiv_{}_loop:", suffix).unwrap();
        writeln!(out, "  CMP R0, R1").unwrap();
        writeln!(out, "  B.CC .Ldiv_{}_end", suffix).unwrap();
        writeln!(out, "  SUB R0, R0, R1").unwrap();
        writeln!(out, "  ADD R2, R2, #1").unwrap();
        writeln!(out, "  B .Ldiv_{}_loop", suffix).unwrap();
        writeln!(out, ".Ldiv_{}_end:", suffix).unwrap();
        writeln!(out, "  MOV R0, R2").unwrap();
        writeln!(out, "  MOV PC, LR\n").unwrap();
    } else {
        writeln!(out, "  MOV R2, #0").unwrap();
        writeln!(out, "  CMP R0, #0").unwrap();
        writeln!(out, "  B.GE .Ldiv_{}_a_pos", suffix).unwrap();
        writeln!(out, "  MOV R3, #0").unwrap();
        writeln!(out, "  SUB R0, R3, R0").unwrap();
        writeln!(out, "  EOR R2, R2, #1").unwrap();
        writeln!(out, ".Ldiv_{}_a_pos:", suffix).unwrap();
        writeln!(out, "  CMP R1, #0").unwrap();
        writeln!(out, "  B.GE .Ldiv_{}_b_pos", suffix).unwrap();
        writeln!(out, "  MOV R3, #0").unwrap();
        writeln!(out, "  SUB R1, R3, R1").unwrap();
        writeln!(out, "  EOR R2, R2, #1").unwrap();
        writeln!(out, ".Ldiv_{}_b_pos:", suffix).unwrap();
        writeln!(out, "  MOV R3, #0").unwrap();
        writeln!(out, ".Ldiv_{}_loop:", suffix).unwrap();
        writeln!(out, "  CMP R0, R1").unwrap();
        writeln!(out, "  B.CC .Ldiv_{}_end", suffix).unwrap();
        writeln!(out, "  SUB R0, R0, R1").unwrap();
        writeln!(out, "  ADD R3, R3, #1").unwrap();
        writeln!(out, "  B .Ldiv_{}_loop", suffix).unwrap();
        writeln!(out, ".Ldiv_{}_end:", suffix).unwrap();
        writeln!(out, "  CMP R2, #0").unwrap();
        writeln!(out, "  B.EQ .Ldiv_{}_done", suffix).unwrap();
        writeln!(out, "  MOV R0, #0").unwrap();
        writeln!(out, "  SUB R3, R0, R3").unwrap();
        writeln!(out, ".Ldiv_{}_done:", suffix).unwrap();
        writeln!(out, "  MOV R0, R3").unwrap();
        writeln!(out, "  MOV PC, LR\n").unwrap();
    }

    writeln!(out, "  .global __mod_{}", suffix).unwrap();
    writeln!(out, "__mod_{}:", suffix).unwrap();
    writeln!(out, "  CMP R1, #0").unwrap();
    writeln!(out, "  B.NE .Lmod_{}_cont", suffix).unwrap();
    writeln!(out, "  SVC #1").unwrap();
    writeln!(out, ".Lmod_{}_cont:", suffix).unwrap();
    if unsigned {
        writeln!(out, ".Lmod_{}_loop:", suffix).unwrap();
        writeln!(out, "  CMP R0, R1").unwrap();
        writeln!(out, "  B.CC .Lmod_{}_end", suffix).unwrap();
        writeln!(out, "  SUB R0, R0, R1").unwrap();
        writeln!(out, "  B .Lmod_{}_loop", suffix).unwrap();
        writeln!(out, ".Lmod_{}_end:", suffix).unwrap();
        writeln!(out, "  MOV PC, LR\n").unwrap();
    } else {
        writeln!(out, "  MOV R2, #0").unwrap();
        writeln!(out, "  CMP R0, #0").unwrap();
        writeln!(out, "  B.GE .Lmod_{}_a_pos", suffix).unwrap();
        writeln!(out, "  MOV R3, #0").unwrap();
        writeln!(out, "  SUB R0, R3, R0").unwrap();
        writeln!(out, "  MOV R2, #1").unwrap();
        writeln!(out, ".Lmod_{}_a_pos:", suffix).unwrap();
        writeln!(out, "  CMP R1, #0").unwrap();
        writeln!(out, "  B.GE .Lmod_{}_b_pos", suffix).unwrap();
        writeln!(out, "  MOV R3, #0").unwrap();
        writeln!(out, "  SUB R1, R3, R1").unwrap();
        writeln!(out, ".Lmod_{}_b_pos:", suffix).unwrap();
        writeln!(out, ".Lmod_{}_loop:", suffix).unwrap();
        writeln!(out, "  CMP R0, R1").unwrap();
        writeln!(out, "  B.CC .Lmod_{}_end", suffix).unwrap();
        writeln!(out, "  SUB R0, R0, R1").unwrap();
        writeln!(out, "  B .Lmod_{}_loop", suffix).unwrap();
        writeln!(out, ".Lmod_{}_end:", suffix).unwrap();
        writeln!(out, "  CMP R2, #0").unwrap();
        writeln!(out, "  B.EQ .Lmod_{}_done", suffix).unwrap();
        writeln!(out, "  MOV R3, #0").unwrap();
        writeln!(out, "  SUB R0, R3, R0").unwrap();
        writeln!(out, ".Lmod_{}_done:", suffix).unwrap();
        writeln!(out, "  MOV PC, LR\n").unwrap();
    }
}
