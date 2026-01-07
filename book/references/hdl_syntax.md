# Référence Syntaxe HDL Codex

Ce document décrit la syntaxe complète du langage HDL utilisé dans le projet Codex.

## Vue d'Ensemble

Le HDL Codex est inspiré de VHDL mais simplifié pour l'apprentissage. Il supporte :
- Déclarations d'entité et d'architecture
- Logique combinatoire (affectations concurrentes)
- Logique séquentielle (processus synchrones)
- Instanciation de composants

---

## 1. Structure d'un Fichier HDL

```vhdl
-- Commentaire (jusqu'à fin de ligne)

entity NomEntite is
  port(
    -- déclarations de ports
  );
end entity;

architecture rtl of NomEntite is
  -- déclarations de signaux et composants
begin
  -- instructions concurrentes
end architecture;
```

---

## 2. Déclaration d'Entité

```vhdl
entity And2 is
  port(
    a : in bit;
    b : in bit;
    y : out bit
  );
end entity;
```

### Types de Ports

| Type | Description | Exemple |
|------|-------------|---------|
| `bit` | Signal 1 bit | `clk : in bit` |
| `bits(N downto 0)` | Bus N+1 bits, MSB en premier | `data : in bits(31 downto 0)` |
| `bits(0 to N)` | Bus N+1 bits, LSB en premier | `addr : out bits(0 to 15)` |

### Directions

| Direction | Description |
|-----------|-------------|
| `in` | Entrée (lecture seule) |
| `out` | Sortie (écriture seule) |

---

## 3. Déclaration d'Architecture

```vhdl
architecture rtl of And2 is
  -- Signaux internes
  signal temp : bit;
  signal bus_data : bits(7 downto 0);

  -- Déclaration de composants
  component Nand
    port(a : in bit; b : in bit; y : out bit);
  end component;

begin
  -- Corps de l'architecture
end architecture;
```

---

## 4. Littéraux

### Bit Simple
```vhdl
'0'    -- bit à 0
'1'    -- bit à 1
```

### Vecteurs Binaires
```vhdl
b"0101"        -- 4 bits : 0101
b"11001010"    -- 8 bits
b"0000_0000"   -- underscores autorisés (lisibilité)
```

### Vecteurs Hexadécimaux
```vhdl
x"2A"          -- 8 bits  : 00101010
x"FF"          -- 8 bits  : 11111111
x"DEAD_BEEF"   -- 32 bits
```

### Entiers
```vhdl
42             -- décimal
0x2A           -- hexadécimal
0b101010       -- binaire
```

**Important** : Les guillemets doubles (`"`) sont obligatoires pour `b"..."` et `x"..."`.

---

## 5. Opérateurs

### Opérateurs Logiques (bit à bit)
```vhdl
a and b        -- ET logique
a or b         -- OU logique
a xor b        -- OU exclusif
not a          -- NON logique
```

### Opérateurs Arithmétiques
```vhdl
a + b          -- Addition
a - b          -- Soustraction
-a             -- Négation
```

### Opérateurs de Décalage
```vhdl
a << 2         -- Décalage gauche de 2
a >> 1         -- Décalage droite de 1
```

### Concaténation
```vhdl
a & b          -- Concatène a (MSB) et b (LSB)
x"00" & data   -- Préfixe 8 zéros
data & '0'     -- Suffixe un zéro
```

### Opérateurs de Comparaison
```vhdl
a = b          -- Égalité
a /= b         -- Différence (aussi <>)
a < b          -- Inférieur (non-signé)
a <= b         -- Inférieur ou égal
a > b          -- Supérieur
a >= b         -- Supérieur ou égal
```

---

## 6. Affectations Concurrentes

```vhdl
-- Affectation simple
y <= a and b;

-- Affectation avec sélection de bits
result(7 downto 0) <= data(15 downto 8);

-- Affectation avec concaténation
output <= x"00" & input(7 downto 0);
```

**Règle importante** : Chaque signal ne peut avoir qu'UN SEUL driver (une seule affectation).

---

## 7. Instanciation de Composants

```vhdl
-- Syntaxe
label: NomComposant port map (
  port1 => signal1,
  port2 => signal2,
  ...
);

-- Exemple
u_add: Add32 port map (
  a => operand_a,
  b => operand_b,
  cin => '0',
  y => result,
  cout => carry
);
```

**Règles** :
- Le label est obligatoire et unique
- Tous les ports doivent être mappés
- Le mapping est par nom (pas positionnel)

---

## 8. Sélection de Bits

```vhdl
data           -- Signal complet
data(5)        -- Bit 5 uniquement
data(7 downto 0)   -- Bits 7 à 0 (8 bits)
data(15 downto 8)  -- Bits 15 à 8 (8 bits)
```

---

## 9. Logique Séquentielle (Processus)

```vhdl
process(clk)
begin
  if rising_edge(clk) then
    -- Logique synchrone
    q <= d;
  end if;
end process;
```

### Registre avec Reset
```vhdl
process(clk)
begin
  if rising_edge(clk) then
    if reset = '1' then
      q <= b"00000000";
    elsif load = '1' then
      q <= d;
    end if;
  end if;
end process;
```

### Instruction Case
```vhdl
process(clk)
begin
  if rising_edge(clk) then
    case state is
      when b"00" => next_state <= b"01";
      when b"01" => next_state <= b"10";
      when others => next_state <= b"00";
    end case;
  end if;
end process;
```

---

## 10. Fonctions Supportées

| Fonction | Description | Exemple |
|----------|-------------|---------|
| `rising_edge(clk)` | Détecte front montant | `if rising_edge(clk)` |
| `resize(expr, N)` | Extension zéro à N bits | `resize(val, 32)` |
| `sresize(expr, N)` | Extension signée à N bits | `sresize(val, 32)` |

---

## 11. Exemple Complet

```vhdl
-- Registre 8 bits avec load et reset
entity Register8 is
  port(
    clk   : in bit;
    reset : in bit;
    load  : in bit;
    d     : in bits(7 downto 0);
    q     : out bits(7 downto 0)
  );
end entity;

architecture rtl of Register8 is
  signal reg : bits(7 downto 0);
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        reg <= x"00";
      elsif load = '1' then
        reg <= d;
      end if;
    end if;
  end process;

  q <= reg;
end architecture;
```

---

## 12. Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `unexpected character` | Littéral mal formaté | Utiliser `b"..."` ou `x"..."` |
| `multiple drivers` | Signal affecté plusieurs fois | Une seule affectation par signal |
| `expected port direction` | Direction manquante | Ajouter `in` ou `out` |
| `invalid bit literal` | Mauvaises quotes | Utiliser `'0'` pas `"0"` |

---

## 13. Limitations

Ce qui n'est **PAS** supporté :

- Logique asynchrone (sensibilité niveau)
- Instructions `wait`
- Instructions `generate`
- Génériques (`generic`)
- Variables (seulement `signal`)
- Types `record` ou tableaux complexes
- Fonctions/procédures utilisateur
- Attributs (`'length`, `'range`)

---

## 14. Bonnes Pratiques

1. **Un fichier = une entité** (convention)
2. **Noms explicites** : `counter_reg` pas `cr`
3. **Commentaires** : Documenter les interfaces
4. **Initialisation** : Toujours initialiser les registres
5. **Reset synchrone** : Préférer au reset asynchrone

```vhdl

-- BON
signal counter : bits(7 downto 0) := x"00";

-- ÉVITER
signal x : bits(7 downto 0);  -- Non initialisé
```
