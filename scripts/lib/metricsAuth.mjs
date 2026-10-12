/**
 * Google（GA4・Search Console）の数字を読む道具の共通部分（2026-10-11）。
 *
 * 鍵の置き場所は3通り。どれでも同じ道具が動く（上から順に見る）。
 *   1. 環境変数 `GCP_METRICS_KEY_JSON` に `.gcp-metrics-key.json` の中身
 *      ⚠️ クラウドの環境変数は「その環境を使う人なら誰でも読める」ので、クラウドでは使わない（3 を使う）
 *   2. Mac: リポジトリ直下の `.gcp-metrics-key.json`（.env の GCP_METRICS_KEY で別の場所も指定できる）
 *   3. クラウドのセッション: 環境の「ネットワークシークレット」（種類 GCP access token (with Service Account Key)）。
 *      鍵はセッションの外（Anthropic のプロキシ）にあり、Google への通信にプロキシが Authorization を付ける。
 *      ここでは**認証を付けずに**送る（付けるとプロキシの分と二重になる）。鍵が無いときの 401 は理由を添えて出す。
 *      環境「スマホ」には 2026-10-12 に2つ入れてある（同じ鍵）: 許可するサイト analyticsdata.googleapis.com ＋スコープ
 *      analytics.readonly／searchconsole.googleapis.com ＋ webmasters.readonly。新しいサイトやスコープを足すときは3つ目を作る。
 *
 * Search Console の窓口は searchConsole() を通す（クラウドのプロキシでは検索の数字を batch の本文で送る＝下の説明）。
 *
 * ⚠️ 鍵の中身は画面にもログにも出さない。読めないときの文言にも値を混ぜない。
 */
import fs from 'fs';

const DEFAULT_KEY_FILE = '.gcp-metrics-key.json';
// GA4 のプロパティ番号（秘密ではない。CLAUDE.md にも記録済み）。.env が無いクラウドでも動くように既定値にする。
export const DEFAULT_GA4_PROPERTY_ID = '539711702';

let dotEnvCache = null;
function dotEnv() {
  if (dotEnvCache) return dotEnvCache;
  dotEnvCache = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
  return dotEnvCache;
}

// 環境変数を先に見て、無ければ .env を見る（.env が無くても止まらない）。
export function getEnv(key) {
  const fromProcess = process.env[key];
  if (fromProcess && fromProcess.trim()) return fromProcess.trim();
  return dotEnv().match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
}

const tryJson = (s) => { try { const v = JSON.parse(s); return v && typeof v === 'object' ? v : null; } catch { return null; } };

/**
 * GCP_METRICS_KEY_JSON の値をサービスアカウントの鍵として読む。読めなければ値を含まない文言で止める。
 * 入れ方の揺れに耐える: ファイルの中身そのまま／1行に詰めたもの／base64 にしたもの／改行が「\n」の2文字のまま。
 */
export function parseServiceAccountJson(raw) {
  const text = String(raw ?? '').trim();
  let key = tryJson(text);
  if (!key && /^[A-Za-z0-9+/=\s]+$/.test(text)) key = tryJson(Buffer.from(text, 'base64').toString('utf8'));
  if (!key) throw new Error('GCP_METRICS_KEY_JSON を JSON として読めません（.gcp-metrics-key.json の中身を丸ごと入れてください）');
  if (key.type !== 'service_account' || typeof key.client_email !== 'string' || typeof key.private_key !== 'string') {
    throw new Error('GCP_METRICS_KEY_JSON がサービスアカウントの鍵ではありません（type・client_email・private_key が要ります）');
  }
  if (!key.private_key.includes('\n') && key.private_key.includes('\\n')) key = { ...key, private_key: key.private_key.replace(/\\n/g, '\n') };
  if (!/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(key.private_key)) {
    throw new Error('GCP_METRICS_KEY_JSON の private_key が鍵の形ではありません');
  }
  return key;
}

// どこから鍵を読むかを決める（googleapis を読み込まずに判定できる＝CI で試せる）。
export function resolveMetricsKey() {
  const raw = getEnv('GCP_METRICS_KEY_JSON');
  if (raw) return { source: 'env', credentials: parseServiceAccountJson(raw) };
  const keyFile = getEnv('GCP_METRICS_KEY') || DEFAULT_KEY_FILE;
  if (fs.existsSync(keyFile)) return { source: 'file', keyFile };
  // クラウドのセッション（Anthropic のプロキシ経由）なら、鍵はネットワークシークレットとしてプロキシ側にある前提で送る
  if (process.env.CCR_AGENT_PROXY_ENABLED === '1') return { source: 'proxy' };
  throw new Error(`Google の鍵がありません。Mac では ${keyFile} を置いてください（クラウドのセッションでは、環境のネットワークシークレットに入れます）`);
}


/**
 * GoogleAuth を作る。鍵が無い・読めないときは理由を出して終了する（値は出さない）。
 * @param {string[]} scopes
 */
export async function metricsAuth(scopes) {
  let resolved;
  try {
    resolved = resolveMetricsKey();
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }
  // クラウドは外への通信がプロキシ経由。Node はこの指定が無いとプロキシを使わず、Google の返事を待ったまま止まる（2026-10-11 実測）。
  if ((process.env.HTTPS_PROXY || process.env.https_proxy) && process.env.NODE_USE_ENV_PROXY !== '1') {
    console.error('❌ プロキシ経由の環境です。NODE_USE_ENV_PROXY=1 を付けて起動してください（例: NODE_USE_ENV_PROXY=1 node scripts/metrics/…）');
    process.exit(1);
  }
  // 認証を付けずに送る（プロキシがネットワークシークレットから Authorization を付ける）
  if (resolved.source === 'proxy') {
    console.error('ℹ️ Google の鍵は環境のネットワークシークレット（プロキシ）から使います。401 が出たら、環境の編集画面の'
      + '「ネットワークシークレット」に GCP access token (with Service Account Key) の鍵が2つ（許可するサイト '
      + 'analyticsdata.googleapis.com＋スコープ analytics.readonly／searchconsole.googleapis.com＋webmasters.readonly）あるか確かめてください');
    return undefined;
  }
  const { google } = await import('googleapis');
  return resolved.source === 'env'
    ? new google.auth.GoogleAuth({ credentials: resolved.credentials, scopes })
    : new google.auth.GoogleAuth({ keyFile: resolved.keyFile, scopes });
}

// ── Search Console の窓口 ────────────────────────────────────────────
// searchanalytics.query は URL の途中にサイトの住所を「https%3A%2F%2F…%2F」の形で置く作り。
// クラウドの Anthropic のプロキシは、この「%2F」を「/」に戻して URL を崩す（Google は 404）。
// 二重にエンコードすると「path contains encoded separator」で通信ごと止める（どちらも 2026-10-12 実測）。
// → プロキシを通るときだけ、Google の batch 窓口の**本文**に問い合わせを入れて送る（URL に住所が載らない）。
//   Mac（プロキシなし）は今までどおり googleapis の窓口をそのまま使う（毎朝の取得は変えない）。
//   URL 検査（urlInspection）は住所を本文で送る作りなので、どちらでもそのまま通る。
const SC_BATCH_URL = 'https://searchconsole.googleapis.com/batch';
const BATCH_BOUNDARY = 'metrics_batch_boundary';

const viaAgentProxy = () => process.env.CCR_AGENT_PROXY_ENABLED === '1';

export function buildSearchAnalyticsBatch(siteUrl, requestBody) {
  if (!siteUrl) throw new Error('Search Console のサイトの住所（siteUrl）がありません');
  const inner = JSON.stringify(requestBody ?? {});
  const body = [
    `--${BATCH_BOUNDARY}`,
    'Content-Type: application/http',
    'Content-ID: <q1>',
    '',
    `POST /webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query HTTP/1.1`,
    'Content-Type: application/json; charset=UTF-8',
    `Content-Length: ${Buffer.byteLength(inner)}`,
    '',
    inner,
    `--${BATCH_BOUNDARY}--`,
    '',
  ].join('\r\n');
  return { contentType: `multipart/mixed; boundary=${BATCH_BOUNDARY}`, body };
}

// batch の返事から1件目の答えを取り出す。Google の答えが 200 以外なら、その番号と理由で止める（番号は毎朝の再試行の判定に使う）。
export function parseSearchAnalyticsBatch(contentType, text) {
  const boundary = /boundary="?([^";\s]+)"?/i.exec(contentType || '')?.[1];
  if (!boundary) throw new Error('Search Console batch: 返事の区切りが分かりません');
  const part = String(text ?? '').split(`--${boundary}`).map((p) => p.trim()).find((p) => p && p !== '--');
  if (!part) throw new Error('Search Console batch: 返事に答えが入っていません');
  const status = /HTTP\/1\.[01] (\d{3})/.exec(part);
  if (!status) throw new Error('Search Console batch: 答えの状態が読めません');
  const afterStatus = part.slice(status.index);
  const blank = /\r?\n\r?\n/.exec(afterStatus);
  const payload = blank ? afterStatus.slice(blank.index + blank[0].length).trim() : '';
  let data = null;
  try { data = payload ? JSON.parse(payload) : {}; } catch { data = null; }
  const code = Number(status[1]);
  if (code !== 200) {
    const reason = data?.error?.message || payload.slice(0, 200) || '理由なし';
    throw new Error(`Search Console ${code}: ${reason}`);
  }
  if (!data) throw new Error('Search Console batch: 答えを JSON として読めません');
  return data;
}

/**
 * Search Console の窓口を作る。scripts/metrics はここを通す（google.searchconsole を直接作らない）。
 * 呼び方・返す形（r.data.rows など）は googleapis と同じ。
 * @param {object|undefined} auth metricsAuth() の返り値（プロキシのときは undefined）
 */
export async function searchConsole(auth) {
  const { google } = await import('googleapis');
  const sc = google.searchconsole({ version: 'v1', auth });
  if (!viaAgentProxy()) return sc;
  sc.searchanalytics.query = async ({ siteUrl, requestBody } = {}) => {
    const { contentType, body } = buildSearchAnalyticsBatch(siteUrl, requestBody);
    const headers = new Headers(auth ? await auth.getRequestHeaders(SC_BATCH_URL) : undefined);
    headers.set('content-type', contentType);
    const res = await fetch(SC_BATCH_URL, { method: 'POST', headers, body });
    const text = await res.text();
    if (!res.ok) throw new Error(`Search Console batch ${res.status}: ${text.replace(/\s+/g, ' ').slice(0, 200)}`);
    return { data: parseSearchAnalyticsBatch(res.headers.get('content-type'), text) };
  };
  return sc;
}

// 起動時・CI の自己診断。テスト用の偽の鍵だけを使う（本物の鍵には触らない）。
export function selfTestMetricsAuth() {
  const errors = [];
  const ok = (cond, msg) => { if (!cond) errors.push(msg); };
  const pem = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n';
  const key = { type: 'service_account', client_email: 'x@y.iam.gserviceaccount.com', private_key: pem, project_id: 'p' };
  const pretty = JSON.stringify(key, null, 2);
  // 読めるはずの形で例外が出ても、診断そのものは落とさず「読めない」として数える
  const parsed = (value) => { try { return parseServiceAccountJson(value); } catch { return null; } };
  ok(parsed(pretty)?.private_key === pem, 'ファイルの中身そのまま（複数行）を読めない');
  ok(parsed(JSON.stringify(key))?.client_email === key.client_email, '1行に詰めた JSON を読めない');
  ok(parsed(Buffer.from(pretty).toString('base64'))?.private_key === pem, 'base64 にした JSON を読めない');
  const doubled = JSON.stringify({ ...key, private_key: pem.replace(/\n/g, '\\n') });
  ok(parsed(doubled)?.private_key === pem, '改行が「\\n」の2文字のままの鍵を直せない');
  const secretish = 'SECRET-VALUE-SHOULD-NOT-LEAK';
  for (const bad of [secretish, JSON.stringify({ ...key, type: 'authorized_user', secretish }), JSON.stringify({ ...key, private_key: secretish })]) {
    let msg = '';
    try { parseServiceAccountJson(bad); msg = '(読めてしまった)'; } catch (e) { msg = e.message; }
    ok(msg !== '(読めてしまった)', `鍵でない値を鍵として受け取った: ${bad.slice(0, 20)}…`);
    ok(!msg.includes(secretish), '読めないときの文言に値が混ざる');
  }

  // Search Console の batch：住所は本文に1回だけエンコードして入れる（URL には載らない）
  const site = 'https://www.example.com/';
  const req = { startDate: '2026-01-01', endDate: '2026-01-28', dimensions: ['page'], rowLimit: 5 };
  const built = buildSearchAnalyticsBatch(site, req);
  ok(built.body.includes('POST /webmasters/v3/sites/https%3A%2F%2Fwww.example.com%2F/searchAnalytics/query HTTP/1.1'),
    'batch の本文に住所が1回だけエンコードされて入っていない');
  ok(built.body.includes(JSON.stringify(req)), 'batch の本文に問い合わせの中身が入っていない');
  ok(built.contentType.includes(`boundary=${BATCH_BOUNDARY}`) && built.body.trimEnd().endsWith(`--${BATCH_BOUNDARY}--`),
    'batch の区切りが閉じていない');
  // 2026-10-12 に実際に返ってきた形（数字だけ変えたもの）
  const reply = (code, json) => [
    '--batch_abc', 'Content-Type: application/http', 'Content-ID: <response-q1>', '',
    `HTTP/1.1 ${code} X`, 'Content-Type: application/json; charset=UTF-8', 'Vary: Origin', '',
    json, '--batch_abc--', '',
  ].join('\r\n');
  const okData = (() => { try { return parseSearchAnalyticsBatch('multipart/mixed; boundary=batch_abc', reply(200, '{"rows":[{"keys":["https://www.example.com/"],"clicks":3}]}')); } catch { return null; } })();
  ok(okData?.rows?.[0]?.clicks === 3, 'batch の返事から答えを取り出せない');
  const failMsg = (code, json) => { try { parseSearchAnalyticsBatch('multipart/mixed; boundary=batch_abc', reply(code, json)); return '(止まらなかった)'; } catch (e) { return e.message; } };
  ok(/403/.test(failMsg(403, '{"error":{"code":403,"message":"no access"}}')) && /no access/.test(failMsg(403, '{"error":{"code":403,"message":"no access"}}')),
    'Google が断ったとき、番号と理由で止まらない');
  ok(/503/.test(failMsg(503, 'Service Unavailable')), '503 を毎朝の再試行が拾える文言で返さない');
  ok(failMsg(200, 'not json') !== '(止まらなかった)', '読めない答えを空の答えとして通した');
  ok(/区切り/.test((() => { try { parseSearchAnalyticsBatch('application/json', '{}'); return ''; } catch (e) { return e.message; } })()),
    'batch でない返事を答えとして通した');
  return errors;
}
