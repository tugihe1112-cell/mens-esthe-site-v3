await import('./check_design_decisions.mjs');
await import('./check_security_guards.mjs');
// ⚠️ 2026-08-22追加: `npm run build` は**実行時エラーを検出できない**。
//    実際に「ビルド成功 → デプロイ → 本番500」を同じ日に2回起こしたため、
//    ①未定義参照を静的に検出し ②SSRが依存する関数を実際に呼ぶ、の2段で止める。
await import('./check_undefined_refs.mjs');
await import('./check_ssr_helpers.mjs');
// ⚠️ 2026-08-26追加: 列を足したのに GRANT を忘れて**口コミ投稿が4日間止まった**。
//    テーブル定義と権限は必ず2箇所同時に直す必要があるが人間は片方を忘れるので機械で突き合わせる。
await import('./check_review_insert_columns.mjs');
// 監視自身の一時通信失敗で障害メールを連発せず、恒久404/5xxは隠さない。
await import('./check_monitor_resilience.mjs');
