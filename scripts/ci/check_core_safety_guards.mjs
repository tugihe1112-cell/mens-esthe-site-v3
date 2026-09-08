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


// ── F01: 静的最適化ページで戻り先・確認トークンを落とさない（2026-09-08）──────
// 【事故】/login /register /admin /auth/* は `○ Static` で router.asPath にクエリが載らない。
//   asPath だけからクエリを読む実装に戻すと、戻り先も確認トークンもページに届かなくなる。
const compatRouter = read('src/compat/router.js');
const compatQuery = read('src/compat/queryString.js');
const compatRouterCode = compatRouter
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

requireText(compatQuery, /export function resolveQueryString/,
  'resolveQueryString が消えています（静的ページで戻り先が落ちます）');
requireText(compatQuery, /split\('#'\)/,
  "resolveQueryString が fragment を落としていません（access_token がクエリ値へ混入します）");

if (/asPath\.split\('\?'\)\[1\]/.test(compatRouterCode)) {
  failures.push(
    "compat/router.js が asPath だけからクエリを読む形に戻っています" +
    "（/login・/register・/admin で戻り先が落ちます）"
  );
}
const resolvedUses = (compatRouterCode.match(/useResolvedQueryString\(/g) || []).length;
if (resolvedUses < 3) {
  failures.push(
    `compat/router.js の useResolvedQueryString が減っています（定義1 + useLocation + useSearchParams = 3箇所必要、実際 ${resolvedUses}箇所）`
  );
}


// ── F01: 認証画面のリンクは「マウント後に読む」形を保つ（2026-09-08 本番実測）──────
// 【事故】/login /register は `○ Static`。HTMLに `href="/register"`（戻り先なし）が焼かれる。
//   クライアントの初回レンダーが正しい href を計算しても、**Reactはハイドレーション時の
//   属性の食い違いを直さない**ため、古い href がDOMに残る（本番では警告も出ない）。
//   実測: Reactのpropsは `/register?redirect=%2Fpopular-reviews`、DOMは `/register`。
//   → 初回はSSRと同じ空を返し、マウント後のeffectで実値に切り替える（＝本物の再レンダー）。
const loginPage = read('src/pages/LoginPage.jsx');
const registerPage = read('src/pages/RegisterPage.jsx');
const returnToHook = read('src/utils/useReturnTo.js');

requireText(returnToHook, /export function useRequestedReturnTo/,
  'useRequestedReturnTo が消えています（認証画面のリンクが戻り先を失います）');
requireText(loginPage, /useRequestedReturnTo\(/,
  'LoginPage が戻り先をマウント後に読む形をやめています（新規登録リンクから redirect が消えます）');
requireText(registerPage, /useRequestedReturnTo\(/,
  'RegisterPage が戻り先をマウント後に読む形をやめています（ログインリンクから redirect が消えます）');

// 描画時に直接読む形へ戻していないか（コメントは除去してから検査する）
const stripJs = (src) => (src || '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
if (/searchParams\.get\(['"]redirect['"]\)/.test(stripJs(registerPage))) {
  failures.push('RegisterPage が描画時に searchParams から redirect を読んでいます（DOMのhrefが更新されません）');
}
if (/new URLSearchParams\(location\.search[\s\S]{0,40}\)\.get\(['"]redirect['"]\)/.test(stripJs(loginPage))) {
  failures.push('LoginPage が描画時に location.search から redirect を読んでいます（DOMのhrefが更新されません）');
}


// ── U03-10: 内部の例外メッセージを利用者にそのまま出さない（2026-09-08）──────
// 【事故】ログイン画面が `"ログインに失敗しました: " + err.message` を表示していた。
//   Supabase の内部文言が画面に出るうえ、利用者は次に何をすればよいか分からない。
const loginSrc = read('src/pages/LoginPage.jsx');
const registerSrc = read('src/pages/RegisterPage.jsx');
const stripSrc = (src) => (src || '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
if (/setError\([^;]*\+\s*err(or)?\??\.message/.test(stripSrc(loginSrc))) {
  failures.push('ログイン画面が内部の例外文（err.message）を画面へ連結しています（U03-10）');
}
if (/setError\(\s*result\.error/.test(stripSrc(registerSrc))) {
  failures.push('登録画面がAPIの内部エラー文（result.error）をそのまま表示しています（U03-10）');
}
requireText(registerSrc, /FORM_ERROR_TEXT/,
  '登録画面のエラー文言の写し表（FORM_ERROR_TEXT）が消えています（内部文言が露出します）');

if (failures.length) {
  console.error('❌ コア安全ガードの回帰を検出:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('✅ 認証・レート制限・履歴・CSPの安全ガードを確認');
