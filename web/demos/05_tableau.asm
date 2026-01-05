; ============================================
; Demo 5: Parcours de Tableau
; ============================================
; Objectif: Calculer la somme d'un tableau
; Résultat attendu: R0 = 10 + 20 + 30 + 40 = 100
;
; Concepts illustrés:
;   - Tableau en mémoire
;   - Parcours avec pointeur
;   - Boucle avec compteur
; ============================================

.data
tableau:
    .word 10            ; tableau[0]
    .word 20            ; tableau[1]
    .word 30            ; tableau[2]
    .word 40            ; tableau[3]

.text
.global _start

_start:
    ; Initialisation
    LDR R0, =tableau    ; R0 = adresse du tableau
    MOV R2, #0          ; R2 = somme = 0
    MOV R3, #4          ; R3 = compteur = 4 elements

boucle:
    ; Charger l'élément courant
    LDR R4, [R0]        ; R4 = *R0 (element courant)

    ; Ajouter à la somme
    ADD R2, R2, R4      ; somme += element

    ; Avancer le pointeur
    ADD R0, R0, #4      ; R0 += 4 (prochain mot de 32 bits)

    ; Décrémenter le compteur
    SUB R3, R3, #1      ; compteur--

    ; Test: compteur > 0 ?
    CMP R3, #0
    B.GT boucle         ; Si compteur > 0, continuer

    ; Copier résultat dans R0
    MOV R0, R2          ; R0 = somme = 100

    HALT
