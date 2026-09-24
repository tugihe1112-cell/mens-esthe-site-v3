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

// ── GA4の送信先とCSP（2026-09-22）──────────────────────────────────────
// 【事故】2026-08-22 にCSPを入れたとき connect-src に google-analytics.com しか入れず、
//   GA4 の今の送信先（analytics.google.com / www.google.com の /g/collect）を**全部拒否**していた。
//   本番のコンソールで page_view・scroll・カスタムイベントとも "violates the following Content Security Policy" で止まり、
//   metrics-log の「GA4 U」（28日）は CSP 導入後の28日で 33→2 に落ちた（同じ期間の検索クリックは横ばい）。
//   ＝アクセスが減ったのではなく、**計測が止まっていた**。1か月気づかなかった。
// ⚠️ 直し方は「送信先を名指しで足す」。connect-src に https: や * を入れて全部通すことはしない。
{
  const gaLoaded = /googletagmanager\.com\/gtag\/js/.test(read('pages/_app.jsx'));
  const connect = (csp.match(/connect-src ([^;"]*)/) || [])[1] || '';
  const sources = connect.trim().split(/\s+/);
  if (gaLoaded) {
    for (const host of ['https://*.google-analytics.com', 'https://analytics.google.com', 'https://*.analytics.google.com', 'https://www.google.com']) {
      if (!sources.includes(host)) {
        failures.push(`CSPの connect-src に GA4 の送信先 ${host} がありません（gtag は読み込むのに送信だけ拒否され、計測が0になる）`);
      }
    }
  }
  if (sources.some((src) => src === '*' || src === 'https:' || src === 'http:' || src === 'https://*' || src === 'wss:')) {
    failures.push('CSPの connect-src が全部の送信先を許しています（名指しで足すこと）');
  }
}
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
  requireText(ssrThread, /filterReviewsFor(Therapist|Person)\(/,
    '人物SSRが照合契約（filterReviewsForTherapist/ForPerson）を使っていません（F04）');
  // 🚩 2026-09-13: 系列店に散らばった本人の行を集めずに本人ID1つで引くと、
  //    渋谷店で書かれた口コミが同じ人の恵比寿店のページに出ない（公開34件中9件が該当していた）。
  requireText(ssrThread, /samePersonTherapistIds\(/,
    '人物SSRが系列店の本人を集めていません（口コミが支店ごとに分断されます）');

  const thread = stripSrc(read('src/pages/ThreadDetailPage.jsx'));
  if (/r\.therapist_name\s*&&\s*r\.therapist_name\.replace|r\.therapist_name\s*===\s*therapist\.name/.test(thread)) {
    failures.push('人物詳細が口コミを名前だけで照合しています（系列店の同名が混ざります・F04）');
  }
  // ⚠️ 参照が1つ残っているだけでは足りない。**両方の経路**（DB取得とDataContextの
  //    フォールバック）が契約を通ることを件数で見る。片方だけ外す壊し方が素通りした。
  {
    const uses = (thread.match(/filterReviewsFor(?:Therapist|Person)\(/g) || []).length;
    if (uses < 2) {
      failures.push(`人物詳細の口コミ照合が契約を通っていません（${uses}箇所。DB取得とフォールバックの両方が必要・F04）`);
    }
  }

  // 🚩 系列またぎの同一人物判定は、**正規化した名前**で比べること。
  //    生の文字列比較に戻すと「似鳥 芹香 / 似鳥芹香」のような表記ゆれが別人扱いになり、
  //    335組が分かれたままになる（2026-09-13実測。スペースの有無で二重取り込みされた同一人物）。
  {
    const identity = stripSrc(read('src/utils/reviewIdentity.js'));
    const fn = identity.match(/export function samePersonTherapistIds\([\s\S]*?\n\}/);
    if (!fn) {
      failures.push('samePersonTherapistIds が消えています（系列またぎの同一人物判定）');
    } else {
      const norms = (fn[0].match(/normalizeTherapistName\(/g) || []).length;
      // 対象と候補の**両方**を正規化して初めて表記ゆれを吸収できる。片方だけでは素通りする。
      if (norms < 2) {
        failures.push(`系列またぎの同一人物判定が名前を正規化していません（${norms}箇所。対象と候補の両方が必要・表記ゆれが別人に戻ります）`);
      }
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

// ── Vercel 無料プラン（Hobby）: api/ の関数は1デプロイ12本まで（2026-09-24）──────────
// 🚩 api/site-counts.js を足したら13本になり、「No more than 12 Serverless Functions can be added to a
//    Deployment on the Hobby plan」で本番デプロイが失敗した（本番は前の版のまま残った）。
//    手元の `npm run build` は api/ を見ないので通っていた＝ここで止めるしかない。
// ⚠️ api/ の下のファイルは1つ1つが別の関数になる（_ や . で始まるものは除かれる）。
//    新しい処理は既存の関数に同居させるか、共有部分を server/ に置くこと（server/siteCounts.js と同じ形）。
{
  const HOBBY_FUNCTION_LIMIT = 12;
  const fns = [];
  const walkFns = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
      const full = `${dir}/${e.name}`;
      if (e.isDirectory()) { walkFns(full); continue; }
      if (/\.(js|mjs|cjs|ts)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) fns.push(full);
    }
  };
  walkFns('api');
  if (fns.length === 0) {
    failures.push('api/ の関数が1本も見つかりません（検査が壊れています）');
  } else if (fns.length > HOBBY_FUNCTION_LIMIT) {
    failures.push(
      `api/ の関数が ${fns.length} 本あります（Vercel の無料プランは1デプロイ${HOBBY_FUNCTION_LIMIT}本まで。超えると本番デプロイが失敗します）:\n` +
      fns.map((f) => `      - ${f}`).join('\n') +
      '\n      → 新しい処理は既存の関数に同居させるか、共有部分を server/ に置くこと（server/siteCounts.js と同じ形）。'
    );
  }
}

// ── 口コミ保存の失敗文言に内部の例外文を混ぜない（2026-09-15）──────────
// 🚩 `authErrorText.js` に「返す文字列に err.message を混ぜないこと。混ぜた瞬間に
//    『Supabaseの英語文がそのまま出る』状態へ戻る」と書いてあるのに、
//    `DataContext.addReview` の**分類漏れの分岐だけ**が
//    `口コミの保存に失敗しました（${error.message}）` と括弧書きで混ぜていた。
//    RLS違反なら `... for table "reviews"`、制約違反なら制約名まで利用者の画面に出る。
//    投稿はこのサイトの一次コンテンツを作る唯一の経路なので、ここが一番出てはいけない。
{
  const dataContext = fs.readFileSync('src/contexts/DataContext.jsx', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
  // 利用者に見せる message を組み立てる箇所に error.message を差し込んでいないか
  if (/message\s*=\s*[`'"][^`'"]*\$\{\s*error\.message/.test(dataContext)) {
    failures.push(
      '口コミ保存の失敗文言に error.message を混ぜています（Supabaseの英語文とテーブル名が利用者に出ます）。\n' +
      '      → 固定の日本語文に写すこと。技術的な詳細は console.error と e.cause に残っています。'
    );
  }
}

// ── 利用者に内部の例外文を出さない（2026-09-15）────────────────────────
// 🚩 2026-09-08 に登録・ログイン画面で確立した線引き＝
//    「4xxと503はAPIの文言をそのまま出す／500と通信失敗だけ固定文言に写す」。
//    ところが**お問い合わせ画面だけ古いまま**で、(1)`catch` で `e.message` を出しており
//    通信失敗時に「Failed to fetch」が利用者に出る (2)4xxを全部同じ固定文言に潰しており、
//    APIが書いた「何を直せばいいか」が消える、の2つが同時に起きていた。
//    さらにAPI側の400本文が英語の内部文字列（'Invalid email'）だったので、
//    画面だけ直すと今度は英語が出る＝**両方**直す必要があった。
{
  const contactPage = fs.readFileSync('src/pages/ContactPage.jsx', 'utf8');
  const contactApi = fs.readFileSync('api/contact.js', 'utf8');
  const stripJs = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
  const pageCode = stripJs(contactPage);
  const apiCode = stripJs(contactApi);

  if (/setError\([^)]*\be\.message/.test(pageCode)) {
    failures.push(
      'お問い合わせ画面が例外の message を利用者に出しています（通信失敗時に「Failed to fetch」が出ます）。\n' +
      '      → 500と通信失敗は固定文言に写すこと（RegisterPage と同じ線引き）。'
    );
  }
  if (!/const SAFE_API_MESSAGE_STATUS =/.test(pageCode)) {
    failures.push(
      'お問い合わせ画面が4xxの案内文言を握りつぶしています。\n' +
      '      → SAFE_API_MESSAGE_STATUS で「そのまま出してよい状態コード」を定義すること\n' +
      '        （2026-09-08、全部を固定文言に潰して原因が誰にも分からなくなった型）。'
    );
  }
  // 🚩 4xxの本文は利用者がそのまま読む。英語の内部文言を返していないか。
  const engFourXX = apiCode.match(/res\.status\(4\d\d\)\.json\(\{ error: '[ -~]+' \}\)/g) || [];
  const userFacing = engFourXX.filter((m) => !/Method not allowed/.test(m));
  if (userFacing.length) {
    failures.push(
      'お問い合わせAPIの4xxが英語の内部文言を返しています:\n' +
      userFacing.map((m) => `      - ${m}`).join('\n') +
      '\n      → 4xxの本文は画面にそのまま出る。日本語の案内にすること。'
    );
  }
}

// ── 人物の同定は reviewIdentity に一本化する（2026-09-15）──────────────
// 🚩 2026-09-08(F04)で人物照合を `reviewIdentity.js` に集約したはずだったが、
//    画面側に**自前の正規化が6か所残っていた**（`(t.name||'').replace(/[\s　]/g,'')`）。
//    空白を除くだけでは半角/全角・大文字小文字が畳まれないので、
//    「ｱｲ」と「アイ」、「似鳥 芹香」と「似鳥芹香」の片方が別人として扱われる。
//    オーナーの指摘（「苗字名前が一緒なら一緒でいい」）はまさにこの型。
//    ⚠️ 検索用の正規化（normalizeForSearch、カタカナ→ひらがな）は別物なので対象外。
{
  const PERSON_NAME_SCREENS = [
    'src/pages/Home.jsx',
    'src/pages/SearchPage.jsx',
    'src/pages/ShopDetailPage.jsx',
    'src/pages/NewTherapistsPage.jsx',
    'src/pages/PopularReviewsPage.jsx',
  ];
  const offenders = [];
  for (const file of PERSON_NAME_SCREENS) {
    const code = fs.readFileSync(file, 'utf8');
    if (!/normalizeTherapistName/.test(code)) {
      offenders.push(`${file} が normalizeTherapistName を使っていない`);
      continue;
    }
    // `t.name` / `therapist.name` に直接 空白除去だけを掛けている書き方を禁止する
    const adhoc = code.match(/\(?\s*[A-Za-z_$][\w$]*\.name\s*\|\|\s*''\s*\)\s*\.replace\(\/\[\\s　\]\/g/g)
      || code.match(/[A-Za-z_$][\w$]*\.name\.replace\(\/\[\\s　\]\/g/g);
    if (adhoc) offenders.push(`${file} に自前の人物名正規化が残っている（${adhoc.length}箇所）`);
  }
  if (offenders.length) {
    failures.push(
      '人物名の正規化が reviewIdentity に一本化されていません:\n' +
      offenders.map((o) => `      - ${o}`).join('\n') +
      '\n      → normalizeTherapistName を使うこと。空白除去だけでは「ｱｲ」と「アイ」が別人になります。'
    );
  }
}

// ── 在籍者は therapists テーブルだけから作る（2026-09-16）────────────
// 以前 DataContext.getTherapistsByShopId は **`[...fromTable, ...fromRaw]`** ＝足し算で、
// `raw_data.therapists`（`1137_1137-1` のようなIDだけの行や `dejavu_tokyo_望月 うらら` の
// 接頭辞つきの行）から作った偽の行が**本物の在籍者に足されて**返っていた。
// 実測: raw を持つ367店のうち360店がテーブルに無い名前を含み、該当22,937件。
//       そして **raw にしか在籍が無い店は0件**＝足し算は何も足していなかった。
{
  const ctx = stripSrc(read('src/contexts/DataContext.jsx'));
  const fn = ctx.match(/getTherapistsByShopId = useCallback\([\s\S]{0,1200}?\}, \[/);
  if (!fn) {
    failures.push('DataContext に getTherapistsByShopId が見つかりません（在籍者の作り方を検査できません）');
  } else {
    if (/raw_data\?\.therapists|raw_data\.therapists|raw_data\?\.threads|raw_data\.threads/.test(fn[0])) {
      failures.push(
        'DataContext の在籍者に raw_data.therapists / raw_data.threads が戻っています。'
        + '\n      → 取り込み元の文字列から作った**実在しない名前**が在籍者に足されます。'
        + '\n        raw にしか在籍が無い店は0件なので、読む必要はありません。'
      );
    }
  }
}

// ── 在籍者の「受け皿」も本命と同じ方針に揃える（2026-09-20）──────────
// 店舗ページの在籍者は**2経路**ある。①ページ自身の取得（F06-C で写真の絞りを外した）と、
// ②それが0件・失敗のときに使う DataContext.loadTherapistsForShop。
// ②だけ古いままで、`.not('image_url','is',null)` ＝**写真のある人しか取らない**、
// 重複を消すキーが**生の名前**（「ｱｲ」と「アイ」が別人のまま）だった。
// ⚠️ ②は普段は使われないので**画面に出ない**＝取得が失敗したときだけ古い方針に戻る。
//    「普段は見えないので気づけない」型。ここは人が気づけないので機械で止める。
{
  const ctx = stripSrc(read('src/contexts/DataContext.jsx'));
  const fn = ctx.match(/loadTherapistsForShop = useCallback\([\s\S]{0,4000}?\}, \[/);
  if (!fn) {
    failures.push('DataContext に loadTherapistsForShop が見つかりません（在籍者の受け皿を検査できません）');
  } else {
    const body = fn[0];
    if (/\.not\(\s*'image_url'|\.neq\(\s*'image_url'/.test(body)) {
      failures.push(
        'DataContext の受け皿が写真の有無で在籍者を絞っています。'
        + '\n      → 2026-09-16の決定「写真が無い人も名前で出す」と食い違います。'
        + '\n        取得が失敗したときだけ古い方針に戻るので、**画面を見ても気づけません**。'
      );
    }
    if (!/\.range\(/.test(body)) {
      failures.push(
        'DataContext の受け皿にページ送りがありません（PostgRESTは1回1000行）。'
        + '\n      → 写真で絞らなくなった分だけ行数が増えます。12ルームで2,181行のブランドが実在し、'
        + '\n        打ち切られると**黙って在籍者が欠けます**。'
      );
    }
    if (!/normalizeTherapistName\(/.test(body)) {
      failures.push(
        'DataContext の受け皿が生の名前で重複を消しています。'
        + '\n      → normalizeTherapistName を使うこと。「ｱｲ」と「アイ」が別人のまま残ります（F04）。'
      );
    }
  }
}

// ── セラピスト名から店名を外して表示する（2026-09-16）──────────────
// 「瑠香 -るか- Marvelous -マーベラス-」が180行。実在の人なので消さず、表示名から店名を外す。
for (const [path, label] of [
  ['src/pages/ShopDetailPage.jsx', '店舗ページ'],
  ['src/pages/BrandPage.jsx', 'ブランドページ'],
]) {
  const src = stripSrc(read(path));
  if (!/getTherapistDisplayName\(/.test(src)) {
    failures.push(
      `${label}がセラピスト名をそのまま出しています（${path}）。`
      + '\n      → getTherapistDisplayName で店名を外すこと。全カードに同じ店名が並んで人名が読めません。'
    );
  }
}

// ── ホームのエリア選択（2026-09-24）──────────────────────────────
// ①「よく検索されるエリア」の件数が手書きの固定値（新宿区42件など）で、実数と合っていなかった。
// ② shop.area だけを見ていたため、エリアが配列の店（複数ルーム）がエリア選択に出なかった。
{
  const src = stripSrc(read('src/components/PrefectureSelector.jsx'));
  const popular = src.match(/const POPULAR_WARDS = \[([\s\S]*?)\];/)?.[1];
  if (popular === undefined) {
    failures.push('PrefectureSelector の POPULAR_WARDS が見つかりません（検査が何も見ていない状態）。');
  } else if (/count\s*:/.test(popular)) {
    failures.push(
      'ホームのエリア選択の件数が固定値に戻っています（POPULAR_WARDS の count）。'
      + '\n      → 件数は shops から数えること。手書きの数字は実数と食い違います（根拠のない数字）。'
    );
  }
  if (!/shopAreaList\(/.test(src)) {
    failures.push(
      'ホームのエリア選択が shopAreaList を使っていません。'
      + '\n      → shop.area だけだと、エリアが配列の店（複数ルーム）がエリア選択に出ません。'
    );
  }
}

if (failures.length) {
  console.error('❌ コア安全ガードの回帰を検出:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('✅ 認証・レート制限・履歴・CSPの安全ガードを確認');
