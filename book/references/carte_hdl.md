# Carte de Référence HDL

## Structure d'un Fichier HDL

```vhdl
-- Déclaration de l'entité (interface)
entity NomComposant is
  port(
    entree1 : in bit;
    entree2 : in bits(7 downto 0);
    sortie  : out bit
  );
end entity;

-- Implémentation (architecture)
architecture rtl of NomComposant is
  -- Déclaration des composants utilisés
  component AutreComposant
    port(a : in bit; y : out bit);
  end component;

  -- Signaux internes
  signal sig1, sig2 : bit;
  signal bus1 : bits(7 downto 0);

begin
  -- Instanciation de composants
  u1: AutreComposant port map (a => entree1, y => sig1);

  -- Assignations concurrentes
  sortie <= sig1 and sig2;

end architecture;
```

## Types de Données

| Type | Description | Exemple |
|------|-------------|---------|
| bit | Un seul bit (0 ou 1) | `signal x : bit;` |
| bits(n downto 0) | Vecteur de n+1 bits | `signal data : bits(31 downto 0);` |

## Opérateurs Logiques

| Opérateur | Description | Exemple |
|-----------|-------------|---------|
| `not` | Inversion | `y <= not a;` |
| `and` | ET logique | `y <= a and b;` |
| `or` | OU logique | `y <= a or b;` |
| `xor` | OU exclusif | `y <= a xor b;` |
| `nand` | NON-ET | `y <= a nand b;` |
| `nor` | NON-OU | `y <= a nor b;` |

## Accès aux Bits

```vhdl
signal data : bits(31 downto 0);

-- Bit individuel
data(0)           -- Bit de poids faible (LSB)
data(31)          -- Bit de poids fort (MSB)

-- Tranche (slice)
data(7 downto 0)  -- 8 bits de poids faible
data(31 downto 16) -- 16 bits de poids fort

-- Concaténation
result <= high_bits & low_bits;
```

## Instanciation de Composants

```vhdl
-- Forme complète
u_and: And2 port map (
  a => signal_a,
  b => signal_b,
  y => signal_y
);

-- Plusieurs instances
u1: Not1 port map (a => in1, y => not_in1);
u2: Not1 port map (a => in2, y => not_in2);
```

## Composants Primitifs

| Composant | Ports | Description |
|-----------|-------|-------------|
| Nand | a, b → y | Porte NAND (primitif) |
| DFF | d, clk → q | D Flip-Flop (primitif) |

## Composants de Base (à construire)

| Composant | Ports | Description |
|-----------|-------|-------------|
| Inv / Not1 | a → y | Inverseur |
| And2 | a, b → y | Porte AND |
| Or2 | a, b → y | Porte OR |
| Xor2 | a, b → y | Porte XOR |
| Mux | a, b, sel → y | Multiplexeur 2:1 |
| DMux | in, sel → a, b | Démultiplexeur 1:2 |

## Composants Arithmétiques

| Composant | Ports | Description |
|-----------|-------|-------------|
| HalfAdder | a, b → sum, carry | Demi-additionneur |
| FullAdder | a, b, cin → sum, cout | Additionneur complet |
| Add32 | a[32], b[32] → sum[32], cout | Additionneur 32 bits |
| ALU32 | a[32], b[32], op[4] → result[32], flags[4] | ALU complète |

## Composants Séquentiels

| Composant | Ports | Description |
|-----------|-------|-------------|
| Bit | in, load, clk → out | Registre 1 bit |
| Register | in[32], load, clk → out[32] | Registre 32 bits |
| PC | in[32], load, inc, reset, clk → out[32] | Program Counter |
| RAM8 | in[32], addr[3], load, clk → out[32] | RAM 8 mots |

## Bonnes Pratiques

1. **Nommage** : Utilisez des noms descriptifs
   - `u_` pour les instances : `u_alu`, `u_mux`
   - `sig_` ou suffixe descriptif pour les signaux

2. **Organisation** :
   - Composants en premier
   - Signaux ensuite
   - Instanciations dans `begin...end`

3. **Commentaires** :
   ```vhdl
   -- Description de ce que fait le bloc
   u_add: Add32 port map (...);
   ```

4. **Hiérarchie** :
   - Construisez des composants simples d'abord
   - Réutilisez-les pour construire des composants complexes

## Fichier de Test (.tst)

```
// Charger le composant
load MyComponent.hdl

// Définir les entrées
set a 0
set b 1

// Évaluer (circuits combinatoires)
eval

// Vérifier la sortie
expect y 1

// Pour circuits séquentiels
tick    // Front montant
tock    // Front descendant
step    // tick + tock
```
