; ============================================
; Demo 7: Cache Memoire
; ============================================
; Objectif: Illustrer le fonctionnement du cache
; - Premier acces: cache miss (lent)
; - Acces repete: cache hit (rapide)
; ============================================

.data
tableau:
    .word 1
    .word 2
    .word 3
    .word 4
    .word 5
    .word 6
    .word 7
    .word 8
    .word 9
    .word 10
    .word 11
    .word 12
    .word 13
    .word 14
    .word 15
    .word 16

.text
.global _start

_start:
    LDR R0, =tableau    ; R0 = adresse du tableau

    ; --- Premier parcours (cache misses) ---
    MOV R1, #0          ; somme = 0
    MOV R2, #0          ; index = 0

premier_parcours:
    LDR R3, [R0]        ; Charger element (cache miss probable)
    ADD R1, R1, R3      ; somme += element
    ADD R0, R0, #4      ; adresse++
    ADD R2, R2, #1      ; index++
    CMP R2, #16
    B.LT premier_parcours

    ; R1 = 1+2+...+16 = 136
    MOV R4, R1          ; Sauvegarder resultat

    ; --- Deuxieme parcours (cache hits) ---
    LDR R0, =tableau    ; Reset adresse
    MOV R1, #0          ; somme = 0
    MOV R2, #0          ; index = 0

deuxieme_parcours:
    LDR R3, [R0]        ; Charger element (cache hit probable)
    ADD R1, R1, R3      ; somme += element
    ADD R0, R0, #4      ; adresse++
    ADD R2, R2, #1      ; index++
    CMP R2, #16
    B.LT deuxieme_parcours

    ; R1 devrait aussi = 136
    ; Verifier: R4 == R1 ?
    CMP R4, R1
    B.NE erreur

    MOV R0, R4          ; R0 = 136 (somme correcte)
    HALT

erreur:
    MOV R0, #0          ; Erreur!
    HALT
