// score-driver.js — eval ランナー / レポート UI のグルー例。スコア集計 = Almide(wasm)。
export async function loadEvalScore(wasmUrl) {
  const bytes = await (await fetch(wasmUrl)).arrayBuffer();
  const mod = await WebAssembly.compile(bytes);
  const imports = {}; for (const i of WebAssembly.Module.imports(mod)) (imports[i.module] ??= {})[i.name] = () => 0;
  const { exports: ex } = await WebAssembly.instantiate(mod, imports); try { ex._start(); } catch {}
  // score 列(各 1-7)を 1 バイト 1 スコアで g_in に書く。
  const loadScores = (arr) => { const u8 = Uint8Array.from(arr); const p = ex.in_alloc(u8.length); new Uint8Array(ex.memory.buffer, Number(p), u8.length).set(u8); };
  return {
    clampScore(s) { return ex.clamp_score(s); },
    // s = {bel,eng,tex,ini,emo,tem,con}
    composite(s) { return ex.composite(s.bel, s.eng, s.tex, s.ini, s.emo, s.tem, s.con); },
    compositeClamped(s) { return ex.composite_clamped(s.bel, s.eng, s.tex, s.ini, s.emo, s.tem, s.con); },
    toPercent(likert) { return ex.to_percent(likert); },
    isPass(comp, threshold) { return ex.is_pass(comp, threshold) === 1; },
    mean(scores) { loadScores(scores); return ex.mean(); },
    minScore(scores) { loadScores(scores); return ex.min_score(); },
    maxScore(scores) { loadScores(scores); return ex.max_score(); },
  };
}
