await import('./check_design_decisions.mjs');
await import('./check_security_guards.mjs');
// ⚠️ 2026-08-22追加: `npm run build` は**実行時エラーを検出できない**。
//    実際に「ビルド成功 → デプロイ → 本番500」を起こしたため、
//    SSRが依存する関数を実際に呼んで動くことを確かめる工程を最後に置く。
await import('./check_ssr_helpers.mjs');
