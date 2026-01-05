; ============================================
; Demo 6: Flags du Processeur (N, Z, C, V)
; ============================================
; Objectif: Illustrer les flags CPU
;   N = Negative (bit 31 = 1)
;   Z = Zero (resultat = 0)
;   C = Carry (depassement non-signe)
;   V = oVerflow (depassement signe)
; ============================================

.text
.global _start

_start:
    ; --- Test du flag Z (Zero) ---
    MOV R0, #5
    SUB R0, R0, #5      ; R0 = 0, Z=1
    ; Apres: Z=1 (resultat nul)

    ; --- Test du flag N (Negative) ---
    MOV R1, #0
    SUB R1, R1, #1      ; R1 = -1 = 0xFFFFFFFF, N=1
    ; Apres: N=1 (bit 31 = 1)

    ; --- Test du flag C (Carry) ---
    MOV R2, #0
    SUB R2, R2, #1      ; Carry set (borrow)
    ; Apres: C=0 (borrow = not carry)

    ; --- Test comparaisons ---
    MOV R3, #10
    MOV R4, #20
    CMP R3, R4          ; 10 - 20 = negatif
    ; Apres: N=1, Z=0

    CMP R4, R3          ; 20 - 10 = positif
    ; Apres: N=0, Z=0

    CMP R3, R3          ; 10 - 10 = 0
    ; Apres: Z=1

    ; --- Branchements conditionnels ---
    MOV R5, #0          ; compteur de tests

    CMP R3, R4
    B.LT skip1          ; 10 < 20 ? oui, sauter
    ADD R5, R5, #1      ; ne pas executer
skip1:

    CMP R4, R3
    B.GT skip2          ; 20 > 10 ? oui, sauter
    ADD R5, R5, #1      ; ne pas executer
skip2:

    MOV R0, R5          ; R0 = 0 si tous les tests OK
    HALT
