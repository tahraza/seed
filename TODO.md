  1. Simulateur HDL (parser + exécution + tests)
  2. Assembleur + émulateur A32‑Lite
  3. Toolchain C‑like (parser + IR + codegen)
  4. Web IDE (UI + integration)


    Ce qu’on a

  - Un HDL VHDL‑like avec parser + simulateur (CLI hdl_cli et UI web).
  - Une ISA A32‑Lite inspirée ARM (predication, ALU/LS/branch/system) + assembleur A32 + format binaire A32B.
  - Un émulateur A32 avec MMIO/traps + runner de tests .a32/.ref.
  - Une UI web minimale pour charger/exécuter des .a32b (step/run/reset + sortie).
  - Des specs détaillées pour l’ISA, le format binaire, les tests de référence.

  Ce qu’on n’a pas (par rapport à nand2tetris)

  - Le parcours matériel NAND→CPU (lib de portes, chips, CPU/ALU/registers en HDL comme dans Hack).
  - La toolchain complète (VM translator, compilateur Jack, OS), ni l’assembleur Hack.
  - Un compilateur C‑like opérationnel (la spec est posée, mais pas d’implémentation).
  - Un linker/objdump/map/archive réellement implémentés (specs seulement).
  - Un IDE/traceur/debugger complet (breakpoints, traces, perf, etc.).

  1. Étendre le compilateur au subset complet (types, variables, if/while/for, pointeurs, arrays, casts, sizeof,
     etc.) + runner tests_c.
  2. Implémenter le CPU A32‑Lite en HDL (multi‑cycle) avec RAM et un testbench.

