# fizz-eval-score

kotodama-eval **スコア集計の算術コア**。Almide 1 コアを native + wasm へ。
openaituber `kotodama-cli/src/eval.rs`(`ScenarioScore::composite` / `aggregate`)から、
スコアの集計算術だけを切り出した単一責任部品(§12 評価系)。

judge LLM の実行は外部 API、**スコアをどう集計するか**は純粋なのでここに集約。
軸の定義(重みの正本)は [fizz-eval-rubric](https://github.com/aiviecast/fizz-eval-rubric)。

## API

| 関数 | 説明 |
|---|---|
| `clamp_score(s)` | 1..7 にクランプ(judge の逸脱を吸収) |
| `composite(bel,..,con) -> Float` | 7 軸の重み付き合計(eval.rs と一致): `0.20·BEL + 0.20·ENG + 0.15·TEX + 0.10·INI + 0.20·EMO + 0.10·TEM + 0.05·CON` |
| `composite_clamped(...)` | クランプしてから合成 |
| `to_percent(likert)` | Likert 1..7 → 0..100 % |
| `is_pass(comp, threshold)` | 合否 |
| `mean(scores)` / `mean_f(xs)` | エピソード横断の平均(eval.rs aggregate: Σ/n) |
| `min_score(scores)` / `max_score(scores)` | 最弱/最強(regression 検出) |

`composite` は全 1→1.0、全 7→7.0、全 4(中立)→4.0。重みは eval.rs:108-116 と同値。

## wasm 境界

`composite` はスカラー 7 引数。`mean`/`min`/`max` は score 列を `in_alloc` バッファに
**1 スコア = 1 バイト**(1-7 なので収まる)で書き、`bytes.to_list` で読む(String を
跨がないので almide#690 と無縁)。返り値は全て Float。
例: [`browser/score-driver.js`](browser/score-driver.js)。

## ビルド / テスト

```sh
almide test spec/eval_score_test.almd
almide build src/main.almd -o build/fizz-eval-score
almide build src/bridge.almd --target wasm -o build/sc.wasm
node test/wasm-smoke.mjs
```

Almide v0.27.7 で native / wasm とも green。
