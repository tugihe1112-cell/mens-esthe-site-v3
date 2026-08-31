/**
 * リリース前に必ず通すガードの**唯一の一覧**。
 *
 * ⚠️ 2026-08-26: ここと .github/workflows/ci.yml で**別々のガードを並べていた**ため、
 *    手元の `npm run build` は通るのにCIだけが落ちた（区分を4→5に増やしたとき）。
 *    重複が無いどころか、CI専用が4本・prebuild専用が5本あり、共通は1本だけだった。
 *    → **CIもこのファイルを呼ぶ**ことに統一し、「手元で通れば必ずCIも通る」状態にする。
 *    新しいガードを足すときは、ここに1行足すだけでよい（ci.yml は触らない）。
 */
await import('./check_design_decisions.mjs');
await import('./check_security_guards.mjs');
await import('./check_therapist_image_quality.mjs');
await import('./check_admin_review_notification.mjs');
await import('./check_review_story_format.mjs');
await import('./check_core_safety_guards.mjs');
// ⚠️ 2026-08-22追加: `npm run build` は**実行時エラーを検出できない**。
//    実際に「ビルド成功 → デプロイ → 本番500」を同じ日に2回起こしたため、
//    ①未定義参照を静的に検出し ②SSRが依存する関数を実際に呼ぶ、の2段で止める。
await import('./check_undefined_refs.mjs');
await import('./check_ssr_helpers.mjs');
// ⚠️ 2026-08-26追加: 列を足したのに GRANT を忘れて**口コミ投稿が4日間止まった**。
//    テーブル定義と権限は必ず2箇所同時に直す必要があるが人間は片方を忘れるので機械で突き合わせる。
await import('./check_review_insert_columns.mjs');
// ⚠️ 2026-08-26追加: 口コミの「区分」はクライアントとDBの4箇所に影響する。
//    どれか1つ漏れると「画面では書けたのにDBが拒否」または「保存されたのに表示されない」。
await import('./check_review_story_sync.mjs');
// 監視自身の一時通信失敗で障害メールを連発せず、恒久404/5xxは隠さない。
await import('./check_monitor_resilience.mjs');
// ⚠️ 最後に「手元とCIで同じガードが走るか」自体を検査する。
//    ここが崩れると、手元のビルド成功がCIの成功を保証しなくなる（2026-08-26の事故）。
await import('./check_guard_parity.mjs');
