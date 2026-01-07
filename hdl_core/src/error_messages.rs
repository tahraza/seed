//! Messages d'erreur HDL en français
//!
//! Ce module centralise tous les messages d'erreur du compilateur HDL
//! avec des traductions françaises pédagogiques.

/// Code d'erreur pour référence dans la documentation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorCode {
    // Erreurs de lexer (L1xx)
    L101, // invalid bit literal
    L102, // invalid hex literal
    L103, // invalid binary literal
    L104, // invalid int literal
    L105, // unexpected character
    L106, // expected quote
    L107, // unterminated string

    // Erreurs de parser (P2xx)
    P201, // expected entity or architecture
    P202, // expected port direction
    P203, // expected type
    P204, // expected range direction
    P205, // expected signal or component
    P206, // unexpected token in expression
    P207, // expected identifier
    P208, // expected literal
    P209, // expected integer
    P210, // unexpected token

    // Erreurs d'élaboration - nommage (E3xx)
    E301, // duplicate entity
    E302, // duplicate signal
    E303, // duplicate port mapping
    E304, // unknown entity
    E305, // missing architecture
    E306, // missing port mapping
    E307, // unknown port
    E308, // unknown signal
    E309, // multiple drivers
    E310, // multiple architectures

    // Erreurs d'élaboration - types (E4xx)
    E401, // port width mismatch
    E402, // primitive width mismatch
    E403, // mux sel must be 1 bit
    E404, // dff clk must be 1 bit
    E405, // ram clk must be 1 bit
    E406, // ram we must be 1 bit
    E407, // ram addr width invalid

    // Erreurs d'élaboration - contraintes (E5xx)
    E501, // out port must map to signal
    E502, // out port must be driven once
    E503, // cannot drive input port

    // Erreurs de process (E6xx)
    E601, // process has no statements
    E602, // process must start with rising_edge
    E603, // rising_edge expects 1 arg
    E604, // rising_edge arg must be signal
    E605, // rising_edge clock mismatch

    // Erreurs de fonction (E7xx)
    E701, // resize expects 2 args
    E702, // resize width must be positive
    E703, // resize width must be integer
    E704, // unsupported function

    // Erreurs runtime (R8xx)
    R801, // ram address out of range
    R802, // index out of range
    R803, // combinational logic did not converge
    R804, // unknown primitive
}

impl ErrorCode {
    /// Retourne le code sous forme de chaîne (ex: "E301")
    pub fn as_str(&self) -> &'static str {
        use ErrorCode::*;
        match self {
            L101 => "L101", L102 => "L102", L103 => "L103", L104 => "L104",
            L105 => "L105", L106 => "L106", L107 => "L107",
            P201 => "P201", P202 => "P202", P203 => "P203", P204 => "P204",
            P205 => "P205", P206 => "P206", P207 => "P207", P208 => "P208",
            P209 => "P209", P210 => "P210",
            E301 => "E301", E302 => "E302", E303 => "E303", E304 => "E304",
            E305 => "E305", E306 => "E306", E307 => "E307", E308 => "E308",
            E309 => "E309", E310 => "E310",
            E401 => "E401", E402 => "E402", E403 => "E403", E404 => "E404",
            E405 => "E405", E406 => "E406", E407 => "E407",
            E501 => "E501", E502 => "E502", E503 => "E503",
            E601 => "E601", E602 => "E602", E603 => "E603", E604 => "E604",
            E605 => "E605",
            E701 => "E701", E702 => "E702", E703 => "E703", E704 => "E704",
            R801 => "R801", R802 => "R802", R803 => "R803", R804 => "R804",
        }
    }
}

/// Génère un message d'erreur en français avec contexte pédagogique
pub fn msg(code: ErrorCode) -> &'static str {
    use ErrorCode::*;
    match code {
        // Lexer errors
        L101 => "Littéral de bit invalide. Utilisez '0' ou '1' entre apostrophes.",
        L102 => "Littéral hexadécimal invalide. Format attendu: x\"1A2B\" ou 0x1A2B",
        L103 => "Littéral binaire invalide. Format attendu: b\"0101\" ou 0b0101",
        L104 => "Littéral entier invalide.",
        L105 => "Caractère inattendu.",
        L106 => "Guillemet fermant attendu.",
        L107 => "Chaîne de caractères non terminée. Ajoutez un guillemet fermant.",

        // Parser errors
        P201 => "Attendu 'entity' ou 'architecture'. Un fichier HDL doit commencer par une déclaration d'entité ou d'architecture.",
        P202 => "Direction de port attendue: 'in' (entrée) ou 'out' (sortie).",
        P203 => "Type attendu: 'bit' (1 bit) ou 'bits(N downto 0)' (bus de N+1 bits).",
        P204 => "Direction de plage attendue: 'to' ou 'downto'. Ex: bits(7 downto 0)",
        P205 => "Attendu une déclaration de signal ou de component.",
        P206 => "Expression invalide. Vérifiez la syntaxe de votre expression.",
        P207 => "Identificateur attendu (nom de signal, entité, etc.).",
        P208 => "Littéral attendu (nombre, '0', '1', b\"...\", x\"...\").",
        P209 => "Entier attendu.",
        P210 => "Jeton inattendu.",

        // Elaboration - naming
        E301 => "Cette entité est déjà définie. Chaque entité doit avoir un nom unique.",
        E302 => "Ce signal est déjà déclaré. Choisissez un nom différent.",
        E303 => "Ce port est déjà mappé. Chaque port ne peut être connecté qu'une seule fois.",
        E304 => "Entité inconnue. Vérifiez que l'entité est bien définie ou incluse.",
        E305 => "Architecture manquante. Chaque entité doit avoir une architecture associée.",
        E306 => "Port non connecté. Tous les ports du component doivent être mappés.",
        E307 => "Port inconnu. Vérifiez le nom du port dans la définition de l'entité.",
        E308 => "Signal inconnu. Déclarez le signal avec 'signal nom : type;' avant de l'utiliser.",
        E309 => "Plusieurs pilotes pour ce signal. Un signal ne peut avoir qu'une seule source.",
        E310 => "Plusieurs architectures pour cette entité. Une seule architecture par entité.",

        // Elaboration - types
        E401 => "Largeurs incompatibles. Vérifiez que les bus ont le même nombre de bits.",
        E402 => "Largeurs des entrées/sorties incompatibles pour cette porte.",
        E403 => "Le signal de sélection 'sel' du multiplexeur doit être de 1 bit.",
        E404 => "L'horloge 'clk' du registre (DFF) doit être de 1 bit.",
        E405 => "L'horloge 'clk' de la RAM doit être de 1 bit.",
        E406 => "Le signal d'écriture 'we' (write enable) de la RAM doit être de 1 bit.",
        E407 => "Largeur d'adresse RAM invalide. Doit être entre 1 et 32 bits.",

        // Elaboration - constraints
        E501 => "Un port de sortie doit être connecté à un signal, pas à une expression.",
        E502 => "Ce port de sortie doit être piloté exactement une fois.",
        E503 => "Impossible de piloter un port d'entrée. Les entrées sont en lecture seule.",

        // Process errors
        E601 => "Le process est vide. Ajoutez des instructions à l'intérieur.",
        E602 => "Le process doit commencer par 'if rising_edge(clk) then'. C'est obligatoire pour la logique synchrone.",
        E603 => "La fonction 'rising_edge' attend exactement 1 argument: le signal d'horloge.",
        E604 => "L'argument de 'rising_edge' doit être un signal (généralement 'clk').",
        E605 => "Le signal d'horloge dans rising_edge ne correspond pas à celui du process.",

        // Function errors
        E701 => "La fonction 'resize' attend 2 arguments: resize(signal, nouvelle_largeur).",
        E702 => "La nouvelle largeur pour resize doit être positive.",
        E703 => "La nouvelle largeur pour resize doit être une constante entière.",
        E704 => "Fonction non supportée.",

        // Runtime errors
        R801 => "Adresse RAM hors limites. L'adresse dépasse la taille de la mémoire.",
        R802 => "Index de bit hors limites. Vérifiez la plage du signal.",
        R803 => "La logique combinatoire n'a pas convergé. Vérifiez qu'il n'y a pas de boucle de rétroaction.",
        R804 => "Primitive inconnue.",
    }
}

/// Génère un message d'erreur formaté avec le code et des arguments
pub fn fmt_msg(code: ErrorCode, args: &[&str]) -> String {
    let base = msg(code);
    let code_str = code.as_str();

    // Remplacer les placeholders {0}, {1}, etc. par les arguments
    let mut result = base.to_string();
    for (i, arg) in args.iter().enumerate() {
        let placeholder = format!("{{{}}}", i);
        result = result.replace(&placeholder, arg);
    }

    format!("[{}] {}", code_str, result)
}

// Messages avec placeholders pour les noms
pub mod detailed {
    pub fn duplicate_entity(name: &str) -> String {
        format!("[E301] L'entité '{}' est déjà définie. Chaque entité doit avoir un nom unique.", name)
    }

    pub fn duplicate_signal(name: &str) -> String {
        format!("[E302] Le signal '{}' est déjà déclaré. Choisissez un nom différent.", name)
    }

    pub fn duplicate_port_mapping(name: &str) -> String {
        format!("[E303] Le port '{}' est déjà mappé. Chaque port ne peut être connecté qu'une seule fois.", name)
    }

    pub fn unknown_entity(name: &str) -> String {
        format!("[E304] L'entité '{}' n'existe pas. Vérifiez l'orthographe ou ajoutez sa définition.", name)
    }

    pub fn missing_architecture(name: &str) -> String {
        format!("[E305] Aucune architecture ne définit l'entité '{}'. Ajoutez: architecture rtl of {} is ... end architecture;", name, name)
    }

    pub fn missing_port_mapping(name: &str) -> String {
        format!("[E306] Le port '{}' n'est pas connecté. Tous les ports doivent être mappés.", name)
    }

    pub fn unknown_port(port: &str, entity: &str) -> String {
        format!("[E307] Le port '{}' n'existe pas dans l'entité '{}'. Vérifiez la définition de l'entité.", port, entity)
    }

    pub fn unknown_signal(name: &str) -> String {
        format!("[E308] Le signal '{}' n'a pas été déclaré. Ajoutez: signal {} : bit; (ou bits)", name, name)
    }

    pub fn multiple_drivers(name: &str) -> String {
        format!("[E309] Le signal '{}' a plusieurs pilotes. Un signal ne peut avoir qu'une seule source (une seule affectation <=).", name)
    }

    pub fn multiple_architectures(name: &str) -> String {
        format!("[E310] L'entité '{}' a plusieurs architectures. Une seule architecture par entité est autorisée.", name)
    }

    pub fn port_width_mismatch(name: &str, expected: usize, got: usize) -> String {
        format!("[E401] Largeur incompatible pour '{}': attendu {} bit(s), obtenu {} bit(s).", name, expected, got)
    }

    pub fn out_port_not_driven(name: &str) -> String {
        format!("[E502] Le port de sortie '{}' n'est pas piloté. Ajoutez une affectation: {} <= ...;", name, name)
    }

    pub fn out_port_must_map_signal(name: &str) -> String {
        format!("[E501] Le port de sortie '{}' doit être connecté à un signal, pas à une expression ou constante.", name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_codes() {
        assert_eq!(ErrorCode::L101.as_str(), "L101");
        assert_eq!(ErrorCode::E301.as_str(), "E301");
    }

    #[test]
    fn test_messages() {
        let msg = msg(ErrorCode::L101);
        assert!(msg.contains("bit"));
        assert!(msg.contains("'0'"));
    }

    #[test]
    fn test_detailed_messages() {
        let msg = detailed::unknown_signal("counter");
        assert!(msg.contains("counter"));
        assert!(msg.contains("E308"));
    }
}
