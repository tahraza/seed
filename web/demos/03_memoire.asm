; ============================================
; Demo 3: Accès Mémoire
; ============================================
; Objectif: Lire une valeur, la doubler, la sauvegarder
; Résultat attendu: La valeur en mémoire passe de 42 à 84
;
; Concepts illustrés:
;   - LDR: charger depuis la mémoire
;   - STR: stocker en mémoire
;   - Section .data pour les données
; ============================================

.data
valeur:
    .word 42            ; Notre valeur initiale

.text
.global _start

_start:
    ; Étape 1: Charger l'adresse de la donnée
    LDR R0, =valeur     ; R0 = adresse de 'valeur'

    ; Étape 2: Lire la valeur depuis la mémoire
    LDR R1, [R0]        ; R1 = mémoire[R0] = 42

    ; Étape 3: Doubler la valeur
    ADD R1, R1, R1      ; R1 = R1 + R1 = 84

    ; Étape 4: Sauvegarder le résultat en mémoire
    STR R1, [R0]        ; mémoire[R0] = R1 = 84

    ; Fin du programme
    HALT                 ; valeur en mémoire = 84
