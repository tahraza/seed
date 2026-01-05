; ============================================
; Demo 2: Boucle - Somme de 1 à 5
; ============================================
; Objectif: Calculer 1 + 2 + 3 + 4 + 5
; Résultat attendu: R0 = 15
;
; Concepts illustrés:
;   - Boucle avec compteur
;   - CMP: comparaison
;   - BLE: branchement conditionnel
; ============================================

.text
.global _start

_start:
    ; Initialisation
    MOV R0, #0          ; R0 = somme = 0
    MOV R1, #1          ; R1 = compteur i = 1
    MOV R2, #5          ; R2 = limite = 5

boucle:
    ; Corps de la boucle: somme += i
    ADD R0, R0, R1      ; R0 = R0 + R1

    ; Incrémenter le compteur
    ADD R1, R1, #1      ; R1 = R1 + 1

    ; Test: i <= 5 ?
    CMP R1, R2          ; Compare R1 avec R2
    B.LE boucle          ; Si R1 <= R2, continuer

    ; Fin du programme
    HALT                 ; R0 contient 15
