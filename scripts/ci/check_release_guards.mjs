await import('./check_design_decisions.mjs');
await import('./check_security_guards.mjs');
// ⚠️ 2026-08-22追加: `npm run build` は**実行時エラーを検出できない**。
//    実際に「ビルド成功 → デプロイ → 本番500」を同じ日に2回起こしたため、
//    ①未定義参照を静的に検出し ②SSRが依存する関数を実際に呼ぶ、の2段で止める。
await import('./check_undefined_refs.mjs');
await import('./check_ssr_helpers.mjs');
