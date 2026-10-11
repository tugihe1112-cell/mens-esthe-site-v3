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
      + '「ネットワークシークレット」に GCP access token (with Service Account Key) の鍵があり、許可するサイトが '
      + 'analyticsdata.googleapis.com・searchconsole.googleapis.com、スコープが analytics.readonly・webmasters.readonly か確かめてください');
    return undefined;
  }
  const { google } = await import('googleapis');
  return resolved.source === 'env'
    ? new google.auth.GoogleAuth({ credentials: resolved.credentials, scopes })
    : new google.auth.GoogleAuth({ keyFile: resolved.keyFile, scopes });
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
  return errors;
}
