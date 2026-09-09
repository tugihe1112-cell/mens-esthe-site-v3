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
// ⚠️ 2026-09-08: 逆に**全部を固定文言へ潰す**のも不具合だった。
//   `+t1@gmail.com` を送ると Supabase 側で落ちるが、画面には「送信できませんでした」しか出ず、
//   利用者も我々も原因が分からなかった。4xx はAPIが利用者向けに書いた文言なので出す。
//   500 だけは `err.message` が入るので絶対に出さない。この線引きを守る。
// ⚠️ 参照ではなく**定義**を見る。`.has()` の呼び出しだけ残っていても通してしまう
//    （妨害テストで実際に素通りした。トークン検査でも同じ取り違えをしている）。
requireText(registerSrc, /const\s+SAFE_API_MESSAGE_STATUS\s*=/,
  '登録画面が4xxの案内文言を出す仕組み（SAFE_API_MESSAGE_STATUS）を失っています（原因の分からないエラーに戻ります）');
if (!/SAFE_API_MESSAGE_STATUS\.has\([^)]*\)\s*&&\s*apiMessage/.test(stripSrc(registerSrc))) {
  failures.push('登録画面がAPI文言の表示を4xxに限定していません（500の err.message が露出します）');
}
requireText(registerSrc, /text:\s*FORM_ERROR_TEXT\.server/,
  '登録画面の5xx経路が固定文言になっていません（内部の例外文が出ます）');

// ── ログイン画面も同じ扱いにする（2026-09-08）────────────────────────────────
// 【背景】登録画面だけ直して満足していたが、ログイン画面は
//   「ログインできませんでした」の1行しか出ず、**なぜ入れないのかが分からない**ままだった。
//   原因の分類と文言は src/utils/authErrorText.js に集約し、
//   scripts/ci/check_ssr_helpers.mjs が**実際に呼んで**内容を検査している。
//   ここでは「画面がその仕組みを使い続けているか」だけを見る。
requireText(read('src/utils/authErrorText.js'), /export function loginErrorFor/,
  '認証エラー文言の写し表（src/utils/authErrorText.js）が消えています');
requireText(loginSrc, /from '\.\.\/utils\/authErrorText\.js'/,
  'ログイン画面が authErrorText.js を使っていません（画面内で文言を組み立てると内部文言が漏れます）');
// ⚠️ 参照ではなく**使用**を見る（import だけ残して固定文へ潰す改変を通さないため）。
requireText(loginSrc, /setError\(loginErrorFor\(/,
  'ログイン画面が失敗理由を分類していません（全部が同じ文言に戻ります）');
requireText(loginSrc, /setError\(resetErrorFor\(/,
  'パスワード再設定の失敗が分類されていません（原因の分からない案内に戻ります）');
// 原因だけ出して終わらない。次の一手（hint）を画面に描いているか。
if (!/error\.hint\s*&&/.test(stripSrc(loginSrc))) {
  failures.push('ログイン画面が「次に何をすればいいか」(hint)を表示していません（U03-10）');
}
// どちらの欄が問題なのかを欄ごとに出す（1行のまとめ表示に戻さない）。
requireText(loginSrc, /aria-invalid=\{fieldErrors\./,
  'ログイン画面が項目別のエラー表示を失っています（どの欄が問題か分かりません）');
requireText(loginSrc, /fieldError\('password'\)/,
  'ログイン画面のパスワード欄に項目別エラーが出ていません');

// ── 登録APIが「利用者が直せる失敗」を500で返さない（2026-09-08）──────────────
// 【事故】`+t1@gmail.com` を送ると Supabase が弾くが、API は throw して **500** を返していた。
//   500 の本文は `err.message`（英語＋内部パス）で、画面はそれを固定文言へ写す。
//   結果、利用者にも我々にも「メールアドレスが受け付けられない」ことが伝わらず、
//   登録できない理由を誰も特定できなかった。利用者が直せる失敗は 4xx ＋ 日本語で返す。
requireText(signup, /email_address_invalid/,
  '登録APIがメールアドレス不正を4xxで案内していません（500に落ちて理由が消えます）');
if (/res\.status\([^)]*\)\.json\(\{[^{}]*err\.message/.test(stripSrc(signup))) {
  failures.push('登録APIが応答本文へ内部の例外文（err.message）を入れています（利用者と通信経路へ露出します）');
}
// 🚩 分類はヘルパ側の仕事。画面が例外文へ触れた時点で露出経路が復活する。
if (/\berr(or)?\??\.message/.test(stripSrc(loginSrc))) {
  failures.push('ログイン画面が例外文（.message）を直接読んでいます（画面へ露出する経路が復活します）');
}


// ── 同名の別人を混ぜない（FIXES.md F04 / 2026-09-08）──────────────────────
// 【事故】検索・店舗・人物詳細・人物SSRが**名前だけ**で口コミを人物へ割り当てていた。
//   同名の別人の写真・件数・評価・タグが1枚のカードに混ざる。
//   割り当ての契約は src/utils/reviewIdentity.js の1か所だけに置く（散らすと必ず緩む）。
requireText(read('src/utils/reviewIdentity.js'), /export function buildTherapistReviewIndex/,
  '口コミと人物の照合契約（src/utils/reviewIdentity.js）が消えています');
{
  const ssrThread = stripSrc(read('pages/shops/[shopId]/threads/[threadId].jsx'));
  // 🚩 `therapist_id === threadId || 名前一致` の OR は、左辺で弾いた別人を右辺が拾い直す。
  if (/therapist_id\s*===\s*threadId\s*\|\|/.test(ssrThread)) {
    failures.push('人物SSRが「IDが違っても名前が同じなら採用」に戻っています（F04）');
  }
  requireText(ssrThread, /filterReviewsForTherapist\(/,
    '人物SSRが照合契約（filterReviewsForTherapist）を使っていません（F04）');

  const thread = stripSrc(read('src/pages/ThreadDetailPage.jsx'));
  if (/r\.therapist_name\s*&&\s*r\.therapist_name\.replace|r\.therapist_name\s*===\s*therapist\.name/.test(thread)) {
    failures.push('人物詳細が口コミを名前だけで照合しています（系列店の同名が混ざります・F04）');
  }
  // ⚠️ 参照が1つ残っているだけでは足りない。**両方の経路**（DB取得とDataContextの
  //    フォールバック）が契約を通ることを件数で見る。片方だけ外す壊し方が素通りした。
  {
    const uses = (thread.match(/filterReviewsForTherapist\(/g) || []).length;
    if (uses < 2) {
      failures.push(`人物詳細の口コミ照合が契約を通っていません（${uses}箇所。DB取得とフォールバックの両方が必要・F04）`);
    }
  }

  for (const p of ['src/pages/SearchPage.jsx', 'src/pages/ShopDetailPage.jsx']) {
    requireText(read(p), /buildTherapistReviewIndex/,
      `${p} の口コミ集計が照合契約を使っていません（名前キーの集計に戻っています・F04）`);
  }
  // 検索は同名カードを潰さない（別IDは別人）
  // ⚠️ 「名前キーで統合していないこと」を否定形で書くと、別の書き方の統合を見逃す。
  //    **IDでまとめている定義そのもの**を要求する。
  const search = stripSrc(read('src/pages/SearchPage.jsx'));
  if (!/const key = String\(t\.id \?\? ''\);/.test(search)) {
    failures.push('検索のカード統合キーが therapist_id ではありません（同名の別人が1枚に統合されます・F04）');
  }
}

// ── 通信失敗を「0件」と表示しない（FIXES.md F05 / 2026-09-08）──────────────
{
  const search = stripSrc(read('src/pages/SearchPage.jsx'));
  const throws = (search.match(/if \(error\) throw error;/g) || []).length;
  if (throws < 3) {
    failures.push(`検索のDB取得が error を無視しています（${throws}箇所しか投げていない。通信失敗が「見つかりませんでした」になります・F05）`);
  }
  requireText(search, /setFetchError\(true\)/, '検索が取得失敗を利用者へ伝えていません（F05）');

  const pop = stripSrc(read('src/pages/PopularReviewsPage.jsx'));
  // 🚩 取得前に offset を進めると、失敗した20件がそのまま飛ぶ
  if (/const next = offset \+ PAGE_SIZE;\s*setOffset\(next\)/.test(pop)) {
    failures.push('口コミ一覧が取得前に offset を進めています（失敗すると次の20件を飛ばします・F05）');
  }
  requireText(pop, /setOffset\(currentOffset\)/,
    '口コミ一覧の offset が「正常結果の反映後」に更新されていません（F05）');
  requireText(pop, /if \(!res\.ok\) throw/,
    '口コミ一覧が res.ok を検査していません（HTTPエラーが0件表示になります・F05）');
}

// ── 登録ボーナスの付与失敗を「登録成功」にしない（FIXES.md F08 / 2026-09-08）────
// 【事故の芽】user_credits の INSERT 失敗を console に出すだけで確認メールへ進んでいた。
//   利用者は「3日間読み放題」を読んでメールを踏み、閲覧権が無いまま着地する。
requireText(signup, /Signup bonus was not granted/,
  '登録APIが特典付与の失敗をそのまま成功にしています（F08）');
requireText(signup, /from\('user_credits'\)\s*\.select\(|\.from\('user_credits'\)[\s\S]{0,120}\.select\(/,
  '登録APIが特典行を読み戻して確認していません（書込成功・応答だけ失敗を判定できません・F08）');
// ⚠️ 参照ではなく**定義**と検証条件そのものを見る。
//    `const grantedOk` を消しても `if (!grantedOk)` の参照が残っていれば素通りした（妨害テスト）。
{
  const src = stripSrc(signup);
  if (!/const\s+grantedOk\s*=/.test(src)) {
    failures.push('登録APIの特典付与の検証（grantedOk）の定義が消えています（F08）');
  }
  for (const [re, label] of [
    [/Number\(bonus\.credits_days\)\s*===\s*bonusDays/, '付与日数'],
    [/Number\(bonus\.total_reviews_posted[^)]*\)\s*===\s*0/, '投稿数0'],
    [/new Date\(bonus\.expires_at\)\.getTime\(\)\s*>\s*Date\.now\(\)/, '期限が未来'],
  ]) {
    if (!re.test(src)) failures.push(`登録APIの特典検証から「${label}」の条件が外れています（F08）`);
  }
}
// 後始末はこのリクエストが作ったuserIdだけ。既存会員を消す経路を作らない。
requireText(signup, /ROLLBACK FAILED \(needs manual recovery\)/,
  '登録APIが後始末の失敗を記録していません（回復が必要な状態を見逃します・F08）');

// ── 登録の計測に個人情報・生URLを載せない（DESIGN.md U06 / 2026-09-08）─────────
requireText(read('src/utils/registerAnalytics.js'), /export const REGISTER_CTA_SOURCES/,
  '登録CTAの source 許可リストが消えています（U06）');
{
  const reg = stripSrc(read('src/pages/RegisterPage.jsx'));
  for (const [fn, label] of [
    ['trackRegisterView', '登録画面の表示'],
    ['trackRegisterStart', '入力開始'],
    ['trackRegisterSubmit', '送信'],
    ['trackRegisterEmailSent', 'メール送信成功'],
    ['trackRegisterError', '失敗'],
  ]) {
    if (!new RegExp(`${fn}\\(`).test(reg)) failures.push(`登録画面が「${label}」を計測していません（U06）`);
  }
  // 完了イベントは確認後ページ1か所だけ（OTP確認ページから撃つと二重に数える）
  const complete = stripSrc(read('src/pages/AuthCompletePage.jsx'));
  const confirm = stripSrc(read('src/pages/AuthConfirmPage.jsx'));
  requireText(complete, /trackRegistrationConfirmed\(/,
    '確認後ページが登録完了を計測していません（U06）');
  if (/trackRegistrationConfirmed\(/.test(confirm)) {
    failures.push('OTP確認ページからも登録完了を撃っています（同じ登録が二重に数えられます・U06）');
  }
  // 認証経路の自動page_viewに token / next 入りの生URLを載せない
  requireText(read('pages/_app.jsx'), /isAuthPath/,
    '認証経路のGA自動page_viewが生URL（token・next付き）のままです（U06）');
}

// ── Vercelの関数から .mjs を import しない（2026-09-08 / 本番21時間停止）────────
// 【事故】`api/auth/signup.js` が `src/utils/authRedirect.mjs` を import していた。
//   Vercelは `api/` 配下をCommonJSにコンパイルするため、その import は require() になる。
//   **.mjs は常にESMなので require() できない**。本番でだけこうなる:
//     Error [ERR_REQUIRE_ESM]: require() of ES Module /var/task/src/utils/authRedirect.mjs
//   関数が起動せず `/api/auth/signup` が Next の静的500ページを返し、
//   **新規登録が約21時間まるごと止まっていた**（誰も登録できない状態）。
// 🚩 `npm run build` は `api/` を検査しないので、**ビルド成功は何の保証にもならない**。
//   ローカルの `node` でも読める（拡張子を解決できるため）。だから機械で止めるしかない。
// ⚠️ 共有したい処理は `.js` に置くこと（`server/rateLimit.js` と同じ。実績がある）。
//   Node 24 は `.js` の中のESM構文を自動判別するので、CIから直接 import しても動く。
{
  const offenders = [];
  const walkApi = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = `${dir}/${e.name}`;
      if (e.isDirectory()) { walkApi(full); continue; }
      if (!/\.(js|mjs|ts)$/.test(e.name)) continue;
      const code = (read(full) || '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      for (const m of code.matchAll(/from\s*['"]([^'"]+\.mjs)['"]/g)) {
        offenders.push(`${full} → ${m[1]}`);
      }
      for (const m of code.matchAll(/import\(\s*['"]([^'"]+\.mjs)['"]\s*\)/g)) {
        offenders.push(`${full} → ${m[1]}（動的import）`);
      }
    }
  };
  for (const root of ['api', 'server']) walkApi(root);
  if (offenders.length) {
    failures.push(
      'Vercelの関数が .mjs を import しています（本番で ERR_REQUIRE_ESM になり関数が起動しません）:\n' +
      offenders.map((o) => `      - ${o}`).join('\n') +
      '\n      → 共有する処理は .js に置くこと（server/rateLimit.js と同じ形）。'
    );
  }
}

if (failures.length) {
  console.error('❌ コア安全ガードの回帰を検出:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('✅ 認証・レート制限・履歴・CSPの安全ガードを確認');
