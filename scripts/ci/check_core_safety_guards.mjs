/**
 * 今回塞いだ高リスクの回帰を、依存インストール前に静的検査する。
 * 挙動の詳細はbuildで検査し、ここでは「防御そのものの削除」を即座に止める。
 */
import fs from 'fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};

const signup = read('api/auth/signup.js');
const register = read('src/pages/RegisterPage.jsx');
const notifyCredit = read('api/notify-credit.js');
const admin = read('src/pages/AdminPage.jsx');
const contact = read('api/contact.js');
const historyHook = read('src/hooks/useRecentlyViewed.js');
const thread = read('src/pages/ThreadDetailPage.jsx');
const csp = read('vercel.json');
const migration = read('supabase_migrations/16_harden_public_api_rate_limits.sql');
const migrationFix = read('supabase_migrations/17_fix_public_api_rate_limit_runtime.sql');

requireText(signup, /user_metadata:\s*\{\s*display_name:\s*displayName\s*\}/, '登録時の表示名保存がありません');
requireText(register, /display_name:\s*displayName/, '登録画面が表示名をAPIへ送っていません');
requireText(signup, /scope:\s*'signup-ip'/, '登録APIのIPレート制限がありません');
requireText(contact, /scope:\s*'contact-ip'/, 'お問い合わせAPIのIPレート制限がありません');
requireText(notifyCredit, /supabaseAdmin\.auth\.getUser\(token\)/, '付与メールAPIがJWTを検証していません');
requireText(notifyCredit, /ADMIN_EMAILS\.includes\(caller\.email\)/, '付与メールAPIが管理者を検証していません');
requireText(admin, /Authorization:\s*`Bearer \$\{jwt\}`/, '管理画面が付与メールAPIへJWTを送っていません');
requireText(historyHook, /function historyLink/, '閲覧履歴のリンク復元処理がありません');
requireText(thread, /link:\s*`\/shops\/\$\{shop\.id\}\/threads\/\$\{therapist\.id\}`/, 'セラピスト閲覧履歴に遷移先を保存していません');
requireText(csp, /Content-Security-Policy/, 'CSPヘッダーがありません');
requireText(migration, /enable row level security/i, 'レート制限テーブルでRLSが有効ではありません');
requireText(migration, /revoke all on function[\s\S]*from public, anon, authenticated/i, 'レート制限RPCの実行権限が閉じていません');
requireText(migrationFix, /return coalesce\(v_allowed, false\)/, 'レート制限RPCの実行時修正がありません');
requireText(migrationFix, /limit verification failed/, 'レート制限RPCの実呼び出し自己検証がありません');


// ── F07: 外部出勤表のiframeとCSP（2026-09-08）────────────────────────────
// 【事故】店舗詳細が外部の出勤表を 75vh の iframe で埋め込んでいたが、
//   当サイトのCSPは `default-src 'self'` で frame-src を持たない＝構造的に読み込めず、
//   本番では灰色のエラー枠が出ていた。公式の出勤URL自体は 200 を返しており、
//   壊れているのは埋め込みの方。CSPを緩めて通すのではなく、公式サイトへの導線にする。
const shopDetail = read('src/pages/ShopDetailPage.jsx');
const shopDetailCode = shopDetail
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');
if (/<iframe/.test(shopDetailCode)) {
  failures.push('店舗詳細に外部iframeが復活しています（F07: CSPが許可しないので必ずエラー表示になる）');
}
if (/frame-src/.test(csp)) {
  failures.push("CSPに frame-src が追加されています（F07: 外部埋め込みのためにCSPを緩めない）");
}
requireText(csp, /default-src 'self'/, "CSPの default-src 'self' が外れています");
requireText(shopDetail, /id="sec-schedule"/, '出勤セクションのアンカー(sec-schedule)が消えています');
requireText(shopDetail, /公式サイトで出勤を確認/, '出勤セクションの公式サイト導線が消えています');
requireText(shopDetail, /schedule_url[\s\S]{0,400}rel="noopener noreferrer"/, '出勤リンクの rel="noopener noreferrer" がありません');

if (failures.length) {
  console.error('❌ コア安全ガードの回帰を検出:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('✅ 認証・レート制限・履歴・CSPの安全ガードを確認');
