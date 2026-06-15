import { readFileSync } from "node:fs";
const mod = await WebAssembly.compile(readFileSync(new URL("../build/sc.wasm", import.meta.url)));
const imports = {}; for (const i of WebAssembly.Module.imports(mod)) (imports[i.module] ??= {})[i.name] = () => 0;
const { exports: ex } = await WebAssembly.instantiate(mod, imports); try { ex._start(); } catch {}
// score 列(1 バイト 1 スコア)を g_in に書く。
const loadScores = (arr) => { const p = ex.in_alloc(arr.length); new Uint8Array(ex.memory.buffer, Number(p), arr.length).set(arr); };
const milli = (x) => Math.round(x * 1000);
let ok = true; const ck = (c, m) => { if (!c) { console.error("FAIL " + m); ok = false; } };

ck(ex.clamp_score(9) === 7 && ex.clamp_score(0) === 1, "clamp");
ck(milli(ex.composite(6, 5, 4, 5, 6, 5, 4)) === 5200, "composite 5.2");
ck(milli(ex.composite(7, 7, 7, 7, 7, 7, 7)) === 7000, "composite all-7");
ck(milli(ex.composite_clamped(9, 5, 4, 5, 6, 5, 0)) === 5250, "composite_clamped");
ck(milli(ex.to_percent(4.0)) === 50000, "to_percent 4→50%");
ck(ex.is_pass(5.2, 4.5) === 1 && ex.is_pass(4.4, 4.5) === 0, "is_pass");

loadScores(new Uint8Array([6, 4, 7]));
ck(milli(ex.mean()) === 5667, "mean 17/3");
ck(ex.min_score() === 4, "min 4");
ck(ex.max_score() === 7, "max 7");
// 多重読み: 同じバッファで mean/min/max を繰り返しても安全(to_list は String を跨がない)。
ck(ex.mean() === ex.mean() && ex.min_score() === 4, "multi-read scores");
loadScores(new Uint8Array([]));
ck(ex.mean() === 0 && ex.min_score() === 0 && ex.max_score() === 0, "empty list → 0");

console.log(ok ? "wasm OK — score aggregation matches native" : "FAIL"); if (!ok) process.exit(1);
