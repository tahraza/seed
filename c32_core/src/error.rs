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
pub fn find_best_match<'a>(name: &str, candidates: impl Iterator<Item = &'a String>) -> Option<&'a str> {
    let name_lower = name.to_lowercase();
    let mut best: Option<(&str, usize)> = None;

    for candidate in candidates {
        let dist = edit_distance(&name_lower, &candidate.to_lowercase());
        // Only suggest if reasonably similar (distance <= 3 and < half the length)
        let max_dist = (name.len() / 2).max(3);
        if dist <= max_dist {
            if best.is_none() || dist < best.unwrap().1 {
                best = Some((candidate.as_str(), dist));
            }
        }
    }

    best.map(|(s, _)| s)
}

#[derive(Debug, Clone)]
pub struct CError {
    code: String,
    message: String,
    line: Option<usize>,
    column: Option<usize>,
    context: Option<String>,
}

impl CError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
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

    pub fn code_str(&self) -> &str {
        &self.code
    }

    /// Get detailed explanation and hint for this error
    pub fn get_help(&self) -> Option<ErrorHelp> {
        get_error_help(&self.code, &self.message)
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
        // Type errors
        "E2002" => {
            if msg.contains("cannot implicitly convert integer to pointer") {
                Some(ErrorHelp {
                    explanation: "Un entier ne peut pas être converti automatiquement en pointeur.",
                    hint: "Utilisez un cast explicite: (int*)valeur ou (char*)valeur",
                    example: Some("int *ptr = (int*)0x400000;  // Cast explicite requis"),
                })
            } else if msg.contains("pointer type mismatch") {
                Some(ErrorHelp {
                    explanation: "Les types de pointeurs ne correspondent pas.",
                    hint: "Vérifiez que les deux pointeurs pointent vers le même type.",
                    example: Some("int *a; char *b; a = (int*)b;  // Cast nécessaire"),
                })
            } else if msg.contains("invalid operands") {
                Some(ErrorHelp {
                    explanation: "Les opérandes ne sont pas compatibles avec cet opérateur.",
                    hint: "Vérifiez les types: arithmétique sur int, comparaison entre types compatibles.",
                    example: Some("int x = 5 + 3;     // OK\nint *p; int y = p + 1;  // OK (arithmétique pointeur)"),
                })
            } else if msg.contains("invalid dereference") {
                Some(ErrorHelp {
                    explanation: "Vous essayez de déréférencer quelque chose qui n'est pas un pointeur.",
                    hint: "Seuls les pointeurs peuvent être déréférencés avec *.",
                    example: Some("int *ptr = &x;\nint val = *ptr;  // OK\nint y = 5;\nint z = *y;  // ERREUR: y n'est pas un pointeur"),
                })
            } else if msg.contains("arrow on non-pointer") {
                Some(ErrorHelp {
                    explanation: "L'opérateur -> ne peut être utilisé qu'avec un pointeur vers struct.",
                    hint: "Pour un struct (non pointeur), utilisez le point: s.field",
                    example: Some("Point *p; p->x = 5;  // OK\nPoint s; s.x = 5;    // Utilisez . pour non-pointeur"),
                })
            } else if msg.contains("invalid unary") {
                Some(ErrorHelp {
                    explanation: "Cet opérateur unaire n'est pas valide pour ce type.",
                    hint: "- fonctionne sur int, ~ sur int (bitwise), ! sur int (logique)",
                    example: None,
                })
            } else if msg.contains("member access on non-struct") {
                Some(ErrorHelp {
                    explanation: "L'opérateur . ne peut être utilisé qu'avec un struct.",
                    hint: "Vérifiez que la variable est bien de type struct.",
                    example: Some("struct Point { int x; int y; };\nstruct Point p;\np.x = 5;  // OK"),
                })
            } else if msg.contains("argument count mismatch") {
                Some(ErrorHelp {
                    explanation: "Le nombre d'arguments ne correspond pas à la déclaration de la fonction.",
                    hint: "Vérifiez le prototype de la fonction.",
                    example: Some("int add(int a, int b);\nadd(1, 2);    // OK: 2 arguments\nadd(1);       // ERREUR: 1 argument"),
                })
            } else if msg.contains("array initializer") || msg.contains("string initializer") {
                Some(ErrorHelp {
                    explanation: "L'initialiseur ne correspond pas au type du tableau.",
                    hint: "char[] peut être initialisé avec une chaîne, int[] avec des valeurs.",
                    example: Some("char s[] = \"hello\";  // OK\nint arr[] = {1, 2, 3};  // OK"),
                })
            } else if msg.contains("invalid array type") {
                Some(ErrorHelp {
                    explanation: "Type de tableau invalide.",
                    hint: "Les tableaux doivent avoir un type d'élément valide (int, char, pointeur, struct).",
                    example: None,
                })
            } else if msg.contains("invalid index") {
                Some(ErrorHelp {
                    explanation: "L'index d'un tableau doit être un entier.",
                    hint: "Utilisez une expression entière comme index: arr[i] où i est int.",
                    example: Some("int arr[10];\narr[5] = 1;      // OK\narr[2+3] = 1;    // OK"),
                })
            } else {
                Some(ErrorHelp {
                    explanation: "Erreur de type: les types ne correspondent pas.",
                    hint: "Vérifiez que les types sont compatibles ou utilisez un cast.",
                    example: None,
                })
            }
        }

        // Undefined symbol errors
        "E2003" => {
            if msg.contains("undefined identifier") {
                Some(ErrorHelp {
                    explanation: "Cette variable n'a pas été déclarée.",
                    hint: "Déclarez la variable avant de l'utiliser, ou vérifiez l'orthographe.",
                    example: Some("int counter = 0;  // Déclaration\ncounter = counter + 1;  // Utilisation"),
                })
            } else if msg.contains("undefined function") {
                Some(ErrorHelp {
                    explanation: "Cette fonction n'a pas été déclarée ou définie.",
                    hint: "Ajoutez un prototype ou définissez la fonction avant l'appel.",
                    example: Some("int add(int a, int b);  // Prototype\n// ... plus tard ...\nint result = add(1, 2);"),
                })
            } else if msg.contains("undefined struct") {
                Some(ErrorHelp {
                    explanation: "Ce type struct n'a pas été défini.",
                    hint: "Définissez le struct avant de l'utiliser.",
                    example: Some("struct Point { int x; int y; };\nstruct Point p;  // Maintenant valide"),
                })
            } else if msg.contains("undefined field") {
                Some(ErrorHelp {
                    explanation: "Ce champ n'existe pas dans le struct.",
                    hint: "Vérifiez le nom du champ et la définition du struct.",
                    example: Some("struct Point { int x; int y; };\nstruct Point p;\np.x = 5;  // OK\np.z = 5;  // ERREUR: 'z' n'existe pas"),
                })
            } else {
                Some(ErrorHelp {
                    explanation: "Symbole non défini.",
                    hint: "Vérifiez que le nom est correct et déclaré avant utilisation.",
                    example: None,
                })
            }
        }

        // Duplicate definition
        "E2004" => {
            if msg.contains("duplicate function") {
                Some(ErrorHelp {
                    explanation: "Une fonction avec ce nom existe déjà.",
                    hint: "Chaque fonction doit avoir un nom unique.",
                    example: None,
                })
            } else if msg.contains("duplicate global") {
                Some(ErrorHelp {
                    explanation: "Une variable globale avec ce nom existe déjà.",
                    hint: "Chaque variable globale doit avoir un nom unique.",
                    example: None,
                })
            } else if msg.contains("duplicate local") {
                Some(ErrorHelp {
                    explanation: "Une variable locale avec ce nom existe déjà dans cette portée.",
                    hint: "Utilisez un nom différent ou réutilisez la variable existante.",
                    example: None,
                })
            } else {
                Some(ErrorHelp {
                    explanation: "Définition dupliquée.",
                    hint: "Chaque identifiant doit être unique dans sa portée.",
                    example: None,
                })
            }
        }

        // Invalid lvalue
        "E2005" => Some(ErrorHelp {
            explanation: "Le côté gauche de l'affectation doit être une variable modifiable.",
            hint: "On ne peut assigner qu'à des variables, éléments de tableau, ou déréférencements.",
            example: Some("int x;\nx = 5;       // OK: variable\narr[0] = 5;  // OK: élément de tableau\n*ptr = 5;    // OK: déréférencement\n5 = x;       // ERREUR: 5 n'est pas une lvalue"),
        }),

        // Constant expression required
        "E2006" => Some(ErrorHelp {
            explanation: "Cette expression doit être une constante connue à la compilation.",
            hint: "Utilisez des littéraux, sizeof, ou des expressions constantes.",
            example: Some("int arr[10];     // OK: 10 est constant\nint n = 5;\nint arr2[n];     // ERREUR: n n'est pas constant"),
        }),

        // Division by zero
        "E2007" => Some(ErrorHelp {
            explanation: "Division par zéro détectée.",
            hint: "Vérifiez que le diviseur n'est jamais zéro.",
            example: Some("int x = 10 / 2;  // OK\nint y = 10 / 0;  // ERREUR"),
        }),

        // Various syntax/semantic errors
        "E2008" => {
            if msg.contains("break outside loop") {
                Some(ErrorHelp {
                    explanation: "L'instruction 'break' ne peut être utilisée que dans une boucle.",
                    hint: "Placez 'break' à l'intérieur d'un while ou for.",
                    example: Some("while (1) {\n    if (done) break;  // OK\n}"),
                })
            } else if msg.contains("continue outside loop") {
                Some(ErrorHelp {
                    explanation: "L'instruction 'continue' ne peut être utilisée que dans une boucle.",
                    hint: "Placez 'continue' à l'intérieur d'un while ou for.",
                    example: Some("for (i = 0; i < 10; i = i + 1) {\n    if (skip) continue;  // OK\n}"),
                })
            } else if msg.contains("sizeof invalid") {
                Some(ErrorHelp {
                    explanation: "sizeof ne peut pas calculer la taille de ce type.",
                    hint: "Utilisez sizeof avec des types valides: int, char, pointeurs, structs.",
                    example: Some("sizeof(int)     // 4\nsizeof(char)    // 1\nsizeof(int*)    // 4"),
                })
            } else if msg.contains("write to string literal") {
                Some(ErrorHelp {
                    explanation: "Les chaînes littérales sont en lecture seule.",
                    hint: "Pour modifier une chaîne, copiez-la dans un tableau char[].",
                    example: Some("char *s = \"hello\";\ns[0] = 'H';  // ERREUR: chaîne en lecture seule\n\nchar buf[] = \"hello\";\nbuf[0] = 'H';  // OK: tableau modifiable"),
                })
            } else if msg.contains("unterminated") {
                Some(ErrorHelp {
                    explanation: "Un littéral (chaîne, caractère, commentaire) n'est pas fermé.",
                    hint: "Ajoutez le délimiteur de fin: \" pour chaînes, ' pour caractères, */ pour commentaires.",
                    example: Some("\"hello\"   // OK\n\"hello    // ERREUR: manque \""),
                })
            } else if msg.contains("unexpected character") {
                Some(ErrorHelp {
                    explanation: "Caractère non reconnu dans le code source.",
                    hint: "Vérifiez qu'il n'y a pas de caractères spéciaux ou d'encodage incorrect.",
                    example: None,
                })
            } else if msg.contains("invalid escape") {
                Some(ErrorHelp {
                    explanation: "Séquence d'échappement invalide.",
                    hint: "Séquences valides: \\n (newline), \\t (tab), \\0 (null), \\\\ (backslash), \\' \\\"",
                    example: Some("\"hello\\nworld\"  // OK: newline\n\"path\\\\file\"    // OK: backslash"),
                })
            } else {
                Some(ErrorHelp {
                    explanation: "Erreur de syntaxe ou sémantique.",
                    hint: "Vérifiez la syntaxe de votre code.",
                    example: None,
                })
            }
        }

        _ => None,
    }
}

impl fmt::Display for CError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // Format: [CODE] ligne:col: message
        let prefix = format!("[{}] ", self.code);

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

impl std::error::Error for CError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = CError::new("E2003", "undefined identifier")
            .with_location(10, 5);
        let s = format!("{}", err);
        assert!(s.contains("[E2003]"));
        assert!(s.contains("ligne 10:5"));
        assert!(s.contains("undefined identifier"));
        assert!(s.contains("Déclarez la variable"));
    }

    #[test]
    fn test_error_with_context() {
        let err = CError::new("E2003", "undefined identifier")
            .with_location(10, 5)
            .with_context("variable 'counter' not found");
        let s = format!("{}", err);
        assert!(s.contains("counter"));
    }
}
