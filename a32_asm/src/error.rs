use std::fmt;

/// Calculate Levenshtein edit distance between two strings
pub fn edit_distance(a: &str, b: &str) -> usize {
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let m = a_chars.len();
    let n = b_chars.len();

    if m == 0 {
        return n;
    }
    if n == 0 {
        return m;
    }

    let mut prev = vec![0usize; n + 1];
    let mut curr = vec![0usize; n + 1];

    for j in 0..=n {
        prev[j] = j;
    }

    for i in 1..=m {
        curr[0] = i;
        for j in 1..=n {
            let cost = if a_chars[i - 1] == b_chars[j - 1] { 0 } else { 1 };
            curr[j] = (prev[j] + 1)
                .min(curr[j - 1] + 1)
                .min(prev[j - 1] + cost);
        }
        std::mem::swap(&mut prev, &mut curr);
    }

    prev[n]
}

/// Find the best match from a list of candidates
pub fn find_best_match<'a>(name: &str, candidates: &[&'a str]) -> Option<&'a str> {
    let name_upper = name.to_uppercase();
    let mut best: Option<(&str, usize)> = None;

    for &candidate in candidates {
        let dist = edit_distance(&name_upper, &candidate.to_uppercase());
        // Only suggest if reasonably similar
        let max_dist = (name.len() / 2).max(2);
        if dist <= max_dist {
            if best.is_none() || dist < best.unwrap().1 {
                best = Some((candidate, dist));
            }
        }
    }

    best.map(|(s, _)| s)
}

/// List of valid A32 mnemonics
pub const VALID_MNEMONICS: &[&str] = &[
    "MOV", "MVN", "ADD", "SUB", "RSB", "MUL", "SDIV", "UDIV",
    "AND", "ORR", "EOR", "BIC", "LSL", "LSR", "ASR", "ROR",
    "CMP", "CMN", "TST", "TEQ",
    "LDR", "STR", "LDRB", "STRB", "LDRH", "STRH",
    "PUSH", "POP", "LDM", "STM",
    "B", "BL", "BX", "BLX",
    "SVC", "NOP",
];

#[derive(Debug, Clone)]
pub struct AsmError {
    code: Option<String>,
    message: String,
    line: Option<usize>,
    column: Option<usize>,
    context: Option<String>,
}

impl AsmError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            code: None,
            message: message.into(),
            line: None,
            column: None,
            context: None,
        }
    }

    pub fn code(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: Some(code.into()),
            message: message.into(),
            line: None,
            column: None,
            context: None,
        }
    }

    pub fn with_location(mut self, line: usize, column: usize) -> Self {
        self.line = Some(line);
        self.column = Some(column);
        self
    }

    pub fn with_context(mut self, ctx: impl Into<String>) -> Self {
        self.context = Some(ctx.into());
        self
    }

    pub fn code_str(&self) -> Option<&str> {
        self.code.as_deref()
    }

    /// Get detailed explanation and hint for this error
    pub fn get_help(&self) -> Option<ErrorHelp> {
        match &self.code {
            Some(code) => get_error_help(code, &self.message),
            None => get_error_help_by_msg(&self.message),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ErrorHelp {
    pub explanation: &'static str,
    pub hint: &'static str,
    pub example: Option<&'static str>,
}

fn get_error_help(code: &str, msg: &str) -> Option<ErrorHelp> {
    match code {
        // Unknown mnemonic
        "E1001" => Some(ErrorHelp {
            explanation: "Cette instruction n'existe pas dans le jeu d'instructions A32.",
            hint: "Vérifiez l'orthographe. Instructions valides: MOV, ADD, SUB, AND, ORR, EOR, LDR, STR, B, BL, CMP, etc.",
            example: Some("MOV R0, #5     ; Charger 5 dans R0\nADD R0, R0, #1 ; R0 = R0 + 1\nLDR R1, [R2]   ; Charger depuis mémoire"),
        }),

        // Various syntax errors
        "E1002" => {
            if msg.contains("invalid operand count") {
                Some(ErrorHelp {
                    explanation: "Le nombre d'opérandes ne correspond pas à l'instruction.",
                    hint: "Vérifiez la syntaxe de l'instruction.",
                    example: Some("ADD R0, R1, R2   ; 3 opérandes\nMOV R0, R1       ; 2 opérandes\nB label          ; 1 opérande"),
                })
            } else if msg.contains("invalid operand") {
                Some(ErrorHelp {
                    explanation: "L'opérande n'est pas valide pour cette instruction.",
                    hint: "Vérifiez le type d'opérande: registre (R0-R15), immédiat (#valeur), ou adresse.",
                    example: Some("MOV R0, #255     ; Immédiat avec #\nADD R0, R1, R2   ; Registres sans #\nLDR R0, =label   ; Adresse avec ="),
                })
            } else if msg.contains("instruction outside .text") {
                Some(ErrorHelp {
                    explanation: "Les instructions doivent être dans la section .text",
                    hint: "Ajoutez .text avant vos instructions.",
                    example: Some(".text\n_start:\n    MOV R0, #0"),
                })
            } else if msg.contains("branch target misaligned") {
                Some(ErrorHelp {
                    explanation: "L'adresse de branchement doit être alignée sur 4 octets.",
                    hint: "Les instructions sont sur 4 octets, utilisez .align 4 si nécessaire.",
                    example: None,
                })
            } else if msg.contains("invalid condition") {
                Some(ErrorHelp {
                    explanation: "Condition invalide pour l'instruction.",
                    hint: "Conditions valides: EQ, NE, LT, LE, GT, GE, CS, CC, MI, PL, VS, VC, HI, LS, AL",
                    example: Some("B.EQ label    ; Branch si égal (Z=1)\nB.NE label    ; Branch si non égal\nB.LT label    ; Branch si inférieur (signé)"),
                })
            } else if msg.contains("invalid suffix") {
                Some(ErrorHelp {
                    explanation: "Suffixe d'instruction invalide.",
                    hint: "Suffixes valides: .S (update flags), .B (byte), conditions (.EQ, .NE, etc.)",
                    example: Some("ADDS R0, R0, #1  ; ADD avec update flags\nLDRB R0, [R1]    ; Load byte"),
                })
            } else if msg.contains("negative .space") {
                Some(ErrorHelp {
                    explanation: "La directive .space doit avoir une taille positive.",
                    hint: "Utilisez une valeur >= 0.",
                    example: Some(".space 100   ; Réserver 100 octets"),
                })
            } else if msg.contains("invalid .align") {
                Some(ErrorHelp {
                    explanation: "La directive .align doit être une puissance de 2.",
                    hint: "Valeurs valides: 1, 2, 4, 8, 16, etc.",
                    example: Some(".align 4     ; Aligner sur 4 octets"),
                })
            } else if msg.contains("backward .org") {
                Some(ErrorHelp {
                    explanation: "La directive .org ne peut pas reculer l'adresse.",
                    hint: "L'adresse doit être supérieure à la position actuelle.",
                    example: None,
                })
            } else {
                Some(ErrorHelp {
                    explanation: "Erreur de syntaxe dans l'instruction.",
                    hint: "Vérifiez la syntaxe de l'instruction.",
                    example: None,
                })
            }
        }

        // Invalid register
        "E1003" => Some(ErrorHelp {
            explanation: "Registre invalide.",
            hint: "Registres valides: R0-R12, SP (R13), LR (R14), PC (R15)",
            example: Some("MOV R0, R1     ; Registres généraux\nMOV SP, R0     ; Stack Pointer\nBL function    ; Utilise LR implicitement"),
        }),

        // Immediate out of range
        "E1004" => {
            if msg.contains("branch") {
                Some(ErrorHelp {
                    explanation: "La destination du branchement est trop loin.",
                    hint: "Les branches ont une portée limitée (~32MB). Utilisez BL pour les appels longs.",
                    example: None,
                })
            } else if msg.contains("shift") {
                Some(ErrorHelp {
                    explanation: "La valeur de décalage est hors limites (0-31).",
                    hint: "Le décalage doit être entre 0 et 31 bits.",
                    example: Some("LSL R0, R1, #5   ; Décalage de 5 bits (OK)\nLSL R0, R1, #32  ; ERREUR: hors limites"),
                })
            } else {
                Some(ErrorHelp {
                    explanation: "La valeur immédiate est trop grande pour cette instruction.",
                    hint: "MOV: 0-255, ADD/SUB: dépend de la rotation. Utilisez LDR R0, =valeur pour les grandes valeurs.",
                    example: Some("MOV R0, #255     ; OK\nMOV R0, #256     ; ERREUR\nLDR R0, =0x12345 ; OK: charge depuis literal pool"),
                })
            }
        }

        // Undefined symbol
        "E1005" => Some(ErrorHelp {
            explanation: "Ce label ou symbole n'est pas défini.",
            hint: "Vérifiez l'orthographe et que le label existe dans le code.",
            example: Some("_start:          ; Définition du label\n    B _start     ; Utilisation du label\n    B loop       ; ERREUR si 'loop' n'existe pas"),
        }),

        // Duplicate label
        "E1006" => Some(ErrorHelp {
            explanation: "Un label avec ce nom existe déjà.",
            hint: "Chaque label doit être unique. Renommez l'un des labels.",
            example: Some("loop1:\n    ; ...\nloop2:           ; Utilisez des noms différents\n    ; ..."),
        }),

        // Misaligned .word
        "E1007" => Some(ErrorHelp {
            explanation: "La directive .word doit être alignée sur 4 octets.",
            hint: "Ajoutez .align 4 avant .word, ou assurez-vous que la position est alignée.",
            example: Some(".align 4\n.word 0x12345678"),
        }),

        // Literal pool overflow
        "E1008" => Some(ErrorHelp {
            explanation: "Le literal pool est plein ou trop loin.",
            hint: "Le literal pool doit être à moins de 4KB. Ajoutez .pool pour forcer un nouveau pool.",
            example: Some("LDR R0, =0x12345\n    ; ... beaucoup de code ...\n.pool              ; Force l'émission du pool ici"),
        }),

        // Duplicate suffix
        "E1009" => Some(ErrorHelp {
            explanation: "Suffixe dupliqué dans l'instruction.",
            hint: "Chaque suffixe ne peut apparaître qu'une fois.",
            example: Some("ADDS R0, R1, R2   ; OK\nADDSS R0, R1, R2  ; ERREUR: .S dupliqué"),
        }),

        // Entry symbol missing
        "E3002" => Some(ErrorHelp {
            explanation: "Le point d'entrée _start n'est pas défini.",
            hint: "Définissez un label _start: pour indiquer où commence l'exécution.",
            example: Some(".text\n_start:           ; Point d'entrée requis\n    MOV R0, #0\n    ; ..."),
        }),

        // Section overlap
        "E3001" => Some(ErrorHelp {
            explanation: "Les sections se chevauchent en mémoire.",
            hint: "Vérifiez les directives .org et les tailles de sections.",
            example: None,
        }),

        // Output exceeds RAM
        "E3004" => Some(ErrorHelp {
            explanation: "Le programme est trop grand pour la mémoire RAM disponible.",
            hint: "Réduisez la taille du programme ou des données.",
            example: None,
        }),

        _ => None,
    }
}

fn get_error_help_by_msg(msg: &str) -> Option<ErrorHelp> {
    if msg.contains("unexpected character") {
        Some(ErrorHelp {
            explanation: "Caractère non reconnu dans le code source.",
            hint: "Vérifiez qu'il n'y a pas de caractères spéciaux.",
            example: None,
        })
    } else if msg.contains("invalid hex") || msg.contains("invalid binary") || msg.contains("invalid number") {
        Some(ErrorHelp {
            explanation: "Format de nombre invalide.",
            hint: "Formats: décimal (123), hexadécimal (0x7B), binaire (0b1111011)",
            example: Some("MOV R0, #123     ; Décimal\nMOV R0, #0xFF    ; Hexadécimal\nMOV R0, #0b1010  ; Binaire"),
        })
    } else if msg.contains("unterminated string") {
        Some(ErrorHelp {
            explanation: "La chaîne n'est pas fermée.",
            hint: "Ajoutez le guillemet fermant \".",
            example: Some(".asciz \"hello\"   ; Chaîne terminée correctement"),
        })
    } else if msg.contains("invalid escape") {
        Some(ErrorHelp {
            explanation: "Séquence d'échappement invalide.",
            hint: "Séquences valides: \\n, \\t, \\0, \\\\, \\\"",
            example: Some(".asciz \"line1\\nline2\"  ; Newline"),
        })
    } else {
        None
    }
}

impl fmt::Display for AsmError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // Format: [CODE] ligne:col: message
        let prefix = match &self.code {
            Some(code) => format!("[{}] ", code),
            None => String::new(),
        };

        match (self.line, self.column) {
            (Some(line), Some(column)) => {
                write!(f, "{}ligne {}:{}: {}", prefix, line, column, self.message)?;
            }
            _ => {
                write!(f, "{}{}", prefix, self.message)?;
            }
        }

        // Add context if available
        if let Some(ctx) = &self.context {
            write!(f, "\n  → {}", ctx)?;
        }

        // Add help if available
        if let Some(help) = self.get_help() {
            write!(f, "\n\n  💡 {}", help.explanation)?;
            write!(f, "\n  ✏️  Conseil: {}", help.hint)?;
            if let Some(example) = help.example {
                write!(f, "\n\n  Exemple:\n")?;
                for line in example.lines() {
                    write!(f, "    {}\n", line)?;
                }
            }
        }

        Ok(())
    }
}

impl std::error::Error for AsmError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = AsmError::code("E1001", "unknown mnemonic")
            .with_location(10, 5);
        let s = format!("{}", err);
        assert!(s.contains("[E1001]"));
        assert!(s.contains("ligne 10:5"));
        assert!(s.contains("unknown mnemonic"));
        assert!(s.contains("jeu d'instructions"));
    }

    #[test]
    fn test_error_without_code() {
        let err = AsmError::new("unexpected character")
            .with_location(5, 1);
        let s = format!("{}", err);
        assert!(s.contains("ligne 5:1"));
        assert!(s.contains("Caractère non reconnu"));
    }
}
