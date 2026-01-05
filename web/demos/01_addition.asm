; ============================================
; Demo 1: Addition Simple
; ============================================
; Objectif: Additionner deux nombres
; Résultat attendu: R0 = 8
;
; Concepts illustrés:
;   - MOV: charger une valeur dans un registre
;   - ADD: additionner deux registres
; ============================================

.text
.global _start

_start:
    ; Étape 1: Charger 5 dans R0
    MOV R0, #5          ; R0 = 5

    ; Étape 2: Charger 3 dans R1
    MOV R1, #3          ; R1 = 3

    ; Étape 3: Additionner R0 + R1, résultat dans R0
    ADD R0, R0, R1      ; R0 = R0 + R1 = 5 + 3 = 8

    ; Fin du programme
    HALT                 ; Arrêt (R0 contient 8)
