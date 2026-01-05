; ============================================
; Demo 4: Conditions - Valeur Absolue
; ============================================
; Objectif: Calculer la valeur absolue de -7
; Résultat attendu: R0 = 7
;
; Concepts illustrés:
;   - CMP: comparaison avec 0
;   - BGE: branchement si >= 0
;   - SUB: soustraction pour inverser
; ============================================

.text
.global _start

_start:
    ; Charger une valeur négative (-7)
    MOV R0, #0
    SUB R0, R0, #7      ; R0 = 0 - 7 = -7

    ; Test: R0 >= 0 ?
    CMP R0, #0          ; Compare R0 avec 0
    B.GE positif         ; Si R0 >= 0, sauter

    ; R0 est négatif: inverser le signe
    MOV R1, #0
    SUB R0, R1, R0      ; R0 = 0 - R0 = 7

positif:
    ; R0 contient maintenant |R0|
    HALT                ; R0 = 7
