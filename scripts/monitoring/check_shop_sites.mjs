/**
 * check_shop_sites.mjs — 掲載店舗の公式URLが「まだその店のものか」を機械で確かめる
 *
 * 【なぜ必要か（2026-09-09に実際に見つけた）】
 * 秋葉原の `Hiran Next (平安NEXT)` は、公式URL `akihabara-hiran.com` が
 * **別ブランド `aden-esthe.com`「ADEN（アデン）」へリダイレクト**していた。
 * 店名ごと変わっているのに、当サイトは旧店名と旧URLを掲載し続けていた。
 * F07で入れた「公式サイトで出勤を確認」ボタンは、別名の店へ利用者を送っていたことになる。
 * 同じ日、`Mirajour` は公式サイトに**閉店の告知**が出ていた。
 *
 * 【この検査が見るもの】
 *  (a) 別ホストへのリダイレクト … 改名・売却・ブランド統合の最も強い信号
 *  (b) 4xx/5xx・DNS失敗・タイムアウト … 閉店やドメイン失効の可能性
 *  (c) 同一ホスト内のリダイレクト … 正常（http→https、/top 付与など）。報告するが問題ではない。
 *
 * ⚠️ この検査は**判定材料を出すだけ**で、DBを一切変更しない。
 *    リダイレクト＝閉店とは限らない（一時的な移転・CDN・国別振り分けもある）。
 *    最後は公式サイトを人が見て決める。**推測で店名や所在地を書き換えない。**
 * ⚠️ 常時のCIゲートにはしない（外部サイトの都合で永久に赤くなる）。
 *    `npm run` から手動で回すか、必要なら別途スケジュール実行する。
 *
 * 実行: node scripts/monitoring/check_shop_sites.mjs
 *   LIMIT=50 だけ試す / CONCURRENCY=4 / TIMEOUT_MS=12000 で調整できる
 *   --verify … `fetch` で問題が出たURLだけ、**本物のブラウザ（puppeteer）でもう一度**開く
 *
 * 【この道具で言い切れること／言い切れないこと（2026-09-13 実測）】
 *   言い切れる … `dns_missing`（NSが引けない＝ドメインが登録されていない）
 *   言い切れない … 403 / 401 / タイムアウト / ERR_ABORTED / 証明書エラー
 *     → **生きているサイトでも普通に出る**。403の7店も証明書の19店も営業中だった。
 *     → これらを根拠に店を消さない。
 *
 * ⚠️ `--verify` を付けずに出た結果だけで店舗を消さないこと。
 *    `fetch` の失敗は「相手が Node からのアクセスを拒んだ」だけのこともある。
 *    ブラウザで NXDOMAIN（ドメインが存在しない）まで確認できて初めて「閉店の疑いが濃い」と言える。
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import dnsp from 'dns/promises';

function env(key) {
  if (process.env[key]) return process.env[key];
  try {
    const source = fs.readFileSync('.env', 'utf8');
    return source.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
  } catch {
    return '';
  }
}

const supabaseUrl = env('VITE_SUPABASE_URL');
const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabaseのサーバー接続情報がありません（.env の VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CONCURRENCY = Number(process.env.CONCURRENCY || 5);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 12000);
const LIMIT = Number(process.env.LIMIT || 0);
const VERIFY = process.argv.includes('--verify');
const OUT_PATH = process.env.OUT || 'outputs/shop-site-audit.json';

/** ⚠️ PostgRESTはサーバー側 max-rows(既定1000) が優先する。
 *    `.limit(5000)` は効かない（2026-08-05にサイトマップが98店欠落した原因）。必ずページングする。 */
async function fetchAllShops() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('shops')
      .select('id, name, website_url')
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // ⚠️ HEADを拒否するサイトが多いのでGETで取り、本文は読まずに捨てる。
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'mens-esthe-map-site-audit/1.0 (+https://www.mens-esthe-map.jp)' },
    });
    try { await res.body?.cancel(); } catch { /* 本文は使わない */ }
    return { status: res.status, finalUrl: res.url || url };
  } catch (e) {
    return { status: 0, finalUrl: '', error: String(e?.name === 'AbortError' ? 'timeout' : (e?.message || e)).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

function classify(original, result) {
  if (result.status === 0) return 'unreachable';
  if (result.status >= 500) return 'server_error';
  if (result.status >= 400) return 'not_found';
  const from = hostOf(original);
  const to = hostOf(result.finalUrl);
  if (from && to && from !== to) return 'redirect_other_host';
  return 'ok';
}

/** ⚠️ Chromeの失敗理由を分ける。ここを一緒くたにすると「閉店の確証」が消える。
 *  ERR_NAME_NOT_RESOLVED …… 名前が引けない＝ドメインが消えている（閉店の確証に最も近い）
 *  ERR_CERT_* / ERR_SSL_* …… 証明書の設定不備。**サイトは生きている**ことが多い
 *  ERR_BLOCKED_BY_CLIENT … 手元のブラウザ拡張が遮断しただけ。相手は無関係
 */
function verdictFromBrowserError(message) {
  const m = String(message || '');
  if (/ERR_NAME_NOT_RESOLVED|ERR_NAME_RESOLUTION_FAILED|NXDOMAIN/.test(m)) return 'dns_missing';
  if (/ERR_BLOCKED_BY_CLIENT/.test(m)) return 'blocked_by_extension';
  if (/ERR_CERT|ERR_SSL/.test(m)) return 'cert_error';
  if (/ERR_CONNECTION|ERR_ADDRESS|ERR_TIMED_OUT|Navigation timeout/.test(m)) return 'unreachable';
  return 'browser_error';
}

async function main() {
  const shops = await fetchAllShops();
  const withUrl = shops.filter((s) => (s.website_url || '').trim());
  const noUrl = shops.length - withUrl.length;

  // 同じURLを共有する系列店はまとめて1回だけ叩く（相手サイトへの負荷を増やさない）
  const byUrl = new Map();
  for (const s of withUrl) {
    const key = s.website_url.trim();
    if (!byUrl.has(key)) byUrl.set(key, []);
    byUrl.get(key).push({ id: s.id, name: s.name });
  }
  let urls = [...byUrl.keys()];
  if (LIMIT > 0) urls = urls.slice(0, LIMIT);

  console.log(`掲載 ${shops.length}店（URLあり ${withUrl.length} / URLなし ${noUrl}）→ 実際に確認するURL ${urls.length}件`);

  const results = [];
  let done = 0;
  const queue = [...urls];
  const worker = async () => {
    for (;;) {
      const url = queue.shift();
      if (!url) return;
      const r = await probe(url);
      const verdict = classify(url, r);
      results.push({ url, verdict, status: r.status, finalUrl: r.finalUrl, error: r.error, shops: byUrl.get(url) });
      done += 1;
      if (done % 50 === 0) console.log(`  …${done}/${urls.length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // ── 第1.5段: 名前が引けるかを見る（ここだけが信用できる） ──────────────
  // ⚠️ 2026-09-13: 利用者から「richaroma.nagoya は普通に見られる」と指摘を受けた。
  //    HTTPの結果（403・401・タイムアウト・ERR_ABORTED）は**生きているサイトでも出る**。
  //    実際、口コミのある3店まで「問題あり」に並んでいた。
  //    一方 DNS は相手の都合でも拡張の都合でも変わらない。
  //      NSも引けない → ドメインが登録されていない＝サイトは存在しない（確証）
  //      NSはあるがAが無い → ドメインは持っている。移転途中のこともある（確証ではない）
  //    **閉店の判断はこの段だけを根拠にする。HTTPの結果は参考に留める。**
  await Promise.all(results.map(async (r) => {
    let host = '';
    try { host = new URL(r.url).hostname; } catch { r.dns = { state: 'bad_url' }; return; }
    try {
      const a = await dnsp.resolve4(host);
      r.dns = { state: 'alive', detail: a[0] };
    } catch (e) {
      try {
        const ns = await dnsp.resolveNs(host.replace(/^www\./, ''));
        r.dns = { state: 'no_a_record', detail: ns.join(',') };
      } catch {
        r.dns = { state: 'domain_gone', detail: e.code };
      }
    }
  }));
  const goneCount = results.filter((r) => r.dns?.state === 'domain_gone').length;
  console.log(`\n--- 名前解決: ドメインが存在しない ${goneCount}件 / Aレコードなし ${results.filter((r) => r.dns?.state === 'no_a_record').length}件 ---`);

  // ── 第2段: 問題が出たURLを本物のブラウザで開き直す ──────────────────
  // ⚠️ Node の fetch が失敗しても、相手がUAで弾いているだけのことがある。
  //    ここで NXDOMAIN まで確認できたものだけを「ドメインが消えている」と言い切る。
  if (VERIFY) {
    const targets = results.filter((r) => r.verdict !== 'ok');
    console.log(`\n--- ブラウザで再確認: ${targets.length}件 ---`);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    for (const r of targets) {
      const page = await browser.newPage();
      try {
        const resp = await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        const info = await page.evaluate(() => ({
          href: location.href,
          title: document.title.slice(0, 80),
          text: document.body ? document.body.innerText.replace(/\s+/g, ' ').slice(0, 120) : '',
        }));
        r.browser = { status: resp ? resp.status() : null, ...info };
        // Chromeのエラーページ（DNS失敗など）は chrome-error:// になる
        r.browserVerdict = info.href.startsWith('chrome-error')
          ? verdictFromBrowserError(info.text)
          : classify(r.url, { status: r.browser.status || 200, finalUrl: info.href });
      } catch (e) {
        r.browser = { error: String(e.message).slice(0, 100) };
        // ⚠️ 2026-09-13: ここで全部 browser_error にしていたため、
        //    **唯一の閉店の証拠である ERR_NAME_NOT_RESOLVED が他の失敗に埋もれていた**。
        //    Chromeのエラーコードで分ける。証明書エラーや拡張のブロックは閉店ではない。
        r.browserVerdict = verdictFromBrowserError(e.message);
      } finally {
        await page.close();
      }
      console.log(`  ${r.browserVerdict.padEnd(20)} ${r.url}  ${r.browser?.title || r.browser?.error || ''}`);
    }
    await browser.close();
  }

  // ⚠️ 2026-09-09: --verify を回したのに、最後の集計が1段目(fetch)の判定のままだった。
  //    実測では **21店が「接続できない」と出ていて実際は営業中**（Lynx 11店を含む）。
  //    ブラウザで確認できたなら**そちらを正**とする。1段目の判定だけで店を消さない。
  //    ただし blocked_by_extension は**手元の拡張が遮断しただけで相手を何も見ていない**。
  //    これを採用すると `me404.po-tal.net`（ドメイン失効の受け皿）へ飛んでいる証拠が消える。
  //    ブラウザが何も分からなかった場合は1段目の判定を残す。
  const BROWSER_LEARNED_NOTHING = new Set(['blocked_by_extension']);
  const finalVerdict = (r) => {
    // DNSが最優先。相手のbot対策にも手元の拡張にも左右されないため。
    if (r.dns?.state === 'domain_gone') return 'dns_missing';
    if (r.dns?.state === 'no_a_record') return 'dns_no_a';
    // ここから先は**すべて参考値**。生きているサイトでも出る。
    return VERIFY && r.browserVerdict && !BROWSER_LEARNED_NOTHING.has(r.browserVerdict)
      ? r.browserVerdict
      : r.verdict;
  };

  const counts = {};
  for (const r of results) counts[finalVerdict(r)] = (counts[finalVerdict(r)] || 0) + 1;

  if (VERIFY) {
    const rescued = results.filter((r) => r.verdict !== 'ok' && r.browserVerdict === 'ok');
    if (rescued.length) {
      console.log(`\n✅ 1段目では問題に見えたが、ブラウザでは正常だったURL: ${rescued.length}件（${rescued.reduce((a, r) => a + r.shops.length, 0)}店）`);
      console.log('   これらは**消してはいけない**。fetchの失敗＝閉店ではない。');
      for (const r of rescued) console.log(`   ${r.url}  → ${r.browser?.title || ''}`);
    }
  }

  const problems = results
    .filter((r) => finalVerdict(r) !== 'ok')
    .sort((a, b) => finalVerdict(a).localeCompare(finalVerdict(b)));

  fs.mkdirSync(OUT_PATH.replace(/\/[^/]+$/, ''), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify({ checkedAt: new Date().toISOString(), counts, results }, null, 2));

  console.log('\n=== 集計 ===');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);

  // ⚠️ --verify で出る判定（dns_missing / browser_error）も必ず一覧に出す。
  //    ここに載せ忘れると、**唯一の確証である dns_missing が件数だけで中身が見えない**ことになる。
  const label = {
    dns_missing: '🔴 ドメインが登録されていない（NSも引けない／閉店の確証に最も近い）',
    dns_no_a: '🟠 ドメインはあるがAレコードが無い（保有はしている。移転途中の可能性）',
    cert_error: '証明書の不備（サイト自体は生きていることが多い＝閉店ではない）',
    blocked_by_extension: '手元のブラウザ拡張が遮断しただけ（相手のサイトとは無関係）',
    redirect_other_host: '別ホストへリダイレクト（改名・統合の可能性）',
    not_found: '4xx（ページが無い）',
    server_error: '5xx（相手サーバーの異常）',
    unreachable: '接続できない（DNS失敗・タイムアウト等）',
    browser_error: '⚠️ ブラウザでも開けなかった（証明書エラー・拒否など／閉店とは限らない）',
  };
  const KINDS = ['dns_missing', 'dns_no_a', 'redirect_other_host', 'not_found', 'server_error', 'unreachable', 'cert_error', 'blocked_by_extension', 'browser_error'];
  for (const kind of KINDS) {
    const list = problems.filter((p) => finalVerdict(p) === kind);
    if (list.length === 0) continue;
    console.log(`\n--- ${label[kind]}：${list.length}件 ---`);
    for (const p of list.slice(0, 60)) {
      const names = p.shops.map((s) => `${s.name}(${s.id})`).join(' / ');
      // ブラウザ判定を採用した行は、fetch段の古い理由ではなく**ブラウザで見えたもの**を出す
      const usedBrowser = VERIFY && p.browserVerdict;
      const detail = usedBrowser
        ? (p.browser?.href || p.browser?.error || `HTTP ${p.browser?.status}`)
        : (p.finalUrl || p.error || `HTTP ${p.status}`);
      console.log(`  ${p.url}`);
      console.log(`    → ${detail}${usedBrowser && p.browser?.title ? `  「${p.browser.title}」` : ''}`);
      console.log(`    店舗: ${names}`);
    }
    if (list.length > 60) console.log(`  …ほか ${list.length - 60}件（詳細は ${OUT_PATH}）`);
  }

  // 取りこぼし検知：上のKINDSに無い判定が出たら黙って消えないよう警告する
  const unlisted = problems.filter((p) => !KINDS.includes(finalVerdict(p)));
  if (unlisted.length) {
    console.log(`\n--- 未分類の判定：${unlisted.length}件（labelに追記が必要） ---`);
    for (const p of unlisted.slice(0, 30)) console.log(`  ${finalVerdict(p)}  ${p.url}`);
  }

  console.log(`\n📄 全結果: ${OUT_PATH}`);
  console.log('⚠️ この結果はそのまま修正値にしない。公式サイトを見て、店名・所在地を人が確定させること。');
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
