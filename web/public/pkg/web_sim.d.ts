/* tslint:disable */
/* eslint-disable */

export class WasmA32 {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Get cache hits count
   */
  cache_hits(): number;
  /**
   * Get cache line info: returns [valid (0/1), tag, first_word] or null
   */
  cache_line(index: number): any;
  /**
   * Get the loaded binary (for display purposes)
   */
  get_binary(): Uint8Array;
  /**
   * Get cache misses count
   */
  cache_misses(): number;
  /**
   * Check if screen has been modified since last clear
   */
  screen_dirty(): boolean;
  /**
   * Get screen width
   */
  screen_width(): number;
  /**
   * Get screen height
   */
  screen_height(): number;
  /**
   * Compile C source code and return the generated assembly
   */
  compile_to_asm(source: string): string;
  /**
   * Get number of cache lines
   */
  cache_num_lines(): number;
  /**
   * Get last call/return event: returns ["call", target, return_addr] or ["return", to_addr, 0] or null
   */
  last_call_event(): any;
  /**
   * Get last memory access: returns [addr, size, is_write] or null
   */
  last_mem_access(): any;
  /**
   * Clear the screen dirty flag
   */
  clear_screen_dirty(): void;
  constructor();
  /**
   * Get register value by index (0-15)
   */
  reg(index: number): number;
  run(max_steps: number): string;
  step(): string;
  /**
   * Get CPU flags as bitmask: bit0=N, bit1=Z, bit2=C, bit3=V
   */
  flags(): number;
  reset(): void;
  output(): string;
  /**
   * Get screen framebuffer as bytes (1 bit per pixel, MSB first)
   */
  screen(): Uint8Array;
  /**
   * Compile C source code and load the resulting binary
   */
  compile(source: string): void;
  /**
   * Get current keyboard key
   */
  get_key(): number;
  /**
   * Set keyboard key (0 = no key pressed)
   */
  set_key(key: number): void;
  /**
   * Assemble source code and load the resulting binary
   */
  assemble(source: string): void;
  /**
   * Get RAM size
   */
  ram_size(): number;
  load_a32b(bytes: Uint8Array, ram_size: number, strict_traps: boolean): void;
  /**
   * Read a 32-bit word from memory
   */
  read_word(addr: number): number;
}

export class WasmHdl {
  free(): void;
  [Symbol.dispose](): void;
  get_signal(name: string): string;
  set_signal(name: string, value: string): void;
  /**
   * Get all signal values as JSON object { name: value, ... }
   */
  dump_signals(): string;
  /**
   * Get all signal names as JSON array
   */
  list_signals(): string;
  /**
   * Get signal info as JSON: { width, is_input, is_output }
   */
  get_signal_info(name: string): string;
  constructor();
  eval(): void;
  load(top: string, sources: string[]): void;
  tick(): void;
  tock(): void;
  /**
   * Load hex data into ROM
   * hex_data is space-separated hex values like "0x1234 0x5678"
   */
  load_rom(rom_index: number, hex_data: string): void;
  /**
   * Run a test script against HDL source
   * Returns JSON: { passed: bool, total: number, passed_checks: number, errors: string[] }
   */
  run_test(hdl_source: string, test_script: string, library_json: string): string;
  set_clock(name: string): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasma32_free: (a: number, b: number) => void;
  readonly __wbg_wasmhdl_free: (a: number, b: number) => void;
  readonly wasma32_assemble: (a: number, b: number, c: number) => [number, number];
  readonly wasma32_cache_hits: (a: number) => [number, number, number];
  readonly wasma32_cache_line: (a: number, b: number) => [number, number, number];
  readonly wasma32_cache_misses: (a: number) => [number, number, number];
  readonly wasma32_cache_num_lines: (a: number) => [number, number, number];
  readonly wasma32_clear_screen_dirty: (a: number) => [number, number];
  readonly wasma32_compile: (a: number, b: number, c: number) => [number, number];
  readonly wasma32_compile_to_asm: (a: number, b: number, c: number) => [number, number, number, number];
  readonly wasma32_flags: (a: number) => [number, number, number];
  readonly wasma32_get_binary: (a: number) => [number, number, number, number];
  readonly wasma32_get_key: (a: number) => [number, number, number];
  readonly wasma32_last_call_event: (a: number) => [number, number, number];
  readonly wasma32_last_mem_access: (a: number) => [number, number, number];
  readonly wasma32_load_a32b: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly wasma32_new: () => number;
  readonly wasma32_output: (a: number) => [number, number, number, number];
  readonly wasma32_ram_size: (a: number) => number;
  readonly wasma32_read_word: (a: number, b: number) => [number, number, number];
  readonly wasma32_reg: (a: number, b: number) => [number, number, number];
  readonly wasma32_reset: (a: number) => [number, number];
  readonly wasma32_run: (a: number, b: number) => [number, number, number, number];
  readonly wasma32_screen: (a: number) => [number, number, number, number];
  readonly wasma32_screen_dirty: (a: number) => [number, number, number];
  readonly wasma32_screen_height: (a: number) => number;
  readonly wasma32_screen_width: (a: number) => number;
  readonly wasma32_set_key: (a: number, b: number) => [number, number];
  readonly wasma32_step: (a: number) => [number, number, number, number];
  readonly wasmhdl_dump_signals: (a: number) => [number, number, number, number];
  readonly wasmhdl_eval: (a: number) => [number, number];
  readonly wasmhdl_get_signal: (a: number, b: number, c: number) => [number, number, number, number];
  readonly wasmhdl_get_signal_info: (a: number, b: number, c: number) => [number, number, number, number];
  readonly wasmhdl_list_signals: (a: number) => [number, number, number, number];
  readonly wasmhdl_load: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly wasmhdl_load_rom: (a: number, b: number, c: number, d: number) => [number, number];
  readonly wasmhdl_new: () => number;
  readonly wasmhdl_run_test: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number, number];
  readonly wasmhdl_set_clock: (a: number, b: number, c: number) => void;
  readonly wasmhdl_set_signal: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly wasmhdl_tick: (a: number) => [number, number];
  readonly wasmhdl_tock: (a: number) => [number, number];
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
