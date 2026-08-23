/**
 * audit_shop_images.mjs — 店舗サムネイルの「中身」を実測して、使い物にならない画像をnull化する
 *
 * 【なぜ必要か（2026-08-20）】
 * okabayashi報告「PCで新着店舗のスライダーを開いたら壊れていた／リンダスパも壊れた」。
 * 実測（ブラウザで全1,010件の画像をcanvas解析）した結果、原因は2つに分かれた。
 *
 *   ① 表示側の問題（大多数）
 *      画像は 2026-07-06 の一括リサイズで**全て最大600px**に縮小済みなのに、
 *      PCのヒーローは幅約1,700px ＝ **2.8倍に拡大**していた。
 *      さらに object-cover のため、横長のロゴ／キャンペーンバナー（600x285等）は
 *      上下を切り落とされ、文字の断片だけが巨大に表示されていた。
 *      → ShopDetailPage / Home の描画を「ぼかし背景＋object-contain」に変更して解決。
 *        **コード側の対処なので、このスクリプトの対象ではない。**
 *
 *   ② データ側の問題（48枚・54店舗）
 *      そもそも中身が無い画像。1x1、真っ白、単色。これは表示をどう工夫しても救えない。
 *      → image_url を null にして、頭文字プレースホルダ（LazyImage）に切り替える。
 *        「壊れた画像」より「意図した代替表示」のほうが常に良い。
 *
 * 【判定基準】（すべて実測値。URL名では判別できない＝R2移行で mig_<hash>.jpg に統一されているため）
 *   - 最大辺 < 64px            … アイコン以下。使えない
 *   - 標準偏差 < 10            … 単色・ほぼ無地
 *   - 平均輝度 > 235 かつ sd < 25 … ほぼ真っ白
 *   ※ 横長バナー(aspect>=2.2)や低解像度(<200px)は**null化しない**。
 *     描画側で contain 表示にしたので、切れずに正しく出る。消すと情報が減るだけ。
 *
 * 【実行】（Mac側。サンドボックスはSupabase/R2へ疎通できない）
 *   node scripts/maintenance/audit_shop_images.mjs            # dry-run（既定）
 *   node scripts/maintenance/audit_shop_images.mjs --live     # 実際にnull化
 *   node scripts/maintenance/audit_shop_images.mjs --json      # 判定結果をJSONで出力
 *
 * 【前提】sharp（2026-07-06に導入済み）と SUPABASE_SERVICE_ROLE_KEY
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const args = process.argv.slice(2);
const LIVE = args.includes('--live');
const AS_JSON = args.includes('--json');
const CONC = 8;

let sharp;
try { sharp = (await import('sharp')).default; }
catch { console.error('❌ sharp が必要です: npm i sharp'); process.exit(1); }

/** 画像を落として実測し、使用可否を判定する */
async function inspect(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { url, verdict: 'NG_FETCH', reason: `HTTP ${res.status}` };
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return { url, verdict: 'NG_TYPE', reason: `content-type=${ct}` };
    const buf = Buffer.from(await res.arrayBuffer());
    const img = sharp(buf);
    const meta = await img.metadata();
    const W = meta.width || 0, H = meta.height || 0;

    // 🐛 2026-08-20 の事故の原因と修正:
    //   sharp の `greyscale().stats()` は**アルファチャンネルを無視する**。
    //   「透明背景に単色のロゴ」というPNGは RGB が全ピクセル一定になるため sd=0 となり、
    //   中身のある正常なロゴが「単色」と誤判定されて112店舗ぶん消えた。
    //   実測: Silk のロゴ(800x400 透過PNG) → アルファ無視 mean=0/sd=0、
    //         白背景に合成 mean=240/sd=51（＝実際は中身がある）。
    //   → **必ず flatten で背景に合成してから測る**（＝人間が見る状態で判定する）。
    //   ⚠️ flatten を外さないこと。外すと同じ事故が再発する。
    const st = await img.clone().flatten({ background: '#ffffff' }).greyscale().stats();
    const ch = st.channels[0];
    const mean = ch.mean, sd = ch.stdev;

    if (Math.max(W, H) < 64) return { url, W, H, mean, sd, verdict: 'BLANK', reason: `極小(${W}x${H})` };
    if (sd < 10) return { url, W, H, mean, sd, verdict: 'BLANK', reason: `単色(sd=${sd.toFixed(1)})` };
    if (mean > 235 && sd < 25) return { url, W, H, mean, sd, verdict: 'BLANK', reason: `ほぼ白(mean=${mean.toFixed(0)}, sd=${sd.toFixed(1)})` };

    const aspect = W / H;
    const note = aspect >= 2.2 ? '横長バナー（描画側でcontain表示するのでOK）'
      : Math.max(W, H) < 200 ? '低解像度（同上）' : '';
    return { url, W, H, mean, sd, aspect: +aspect.toFixed(2), verdict: 'OK', reason: note };
  } catch (e) {
    return { url, verdict: 'NG_FETCH', reason: e.message.slice(0, 60) };
  }
}

async function main() {
  // 全店舗（PostgRESTのmax-rows=1000に当たるのでページングする）
  const shops = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('shops').select('id, name, image_url').order('id').range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    shops.push(...data);
    if (data.length < 1000) break;
  }
  const withImg = shops.filter((s) => s.image_url);
  console.error(`店舗 ${shops.length}件（画像あり ${withImg.length}／なし ${shops.length - withImg.length}）`);

  // 同一URLを複数店舗が共有しているのでURL単位で1回だけ解析
  const byUrl = new Map();
  for (const s of withImg) {
    if (!byUrl.has(s.image_url)) byUrl.set(s.image_url, []);
    byUrl.get(s.image_url).push(s);
  }
  const urls = [...byUrl.keys()];
  console.error(`ユニーク画像 ${urls.length}枚を実測します…`);

  const results = [];
  for (let i = 0; i < urls.length; i += CONC) {
    results.push(...await Promise.all(urls.slice(i, i + CONC).map(inspect)));
    if (!AS_JSON && i % 200 === 0) console.error(`  ${Math.min(i + CONC, urls.length)}/${urls.length}`);
  }

  const bad = results.filter((r) => r.verdict !== 'OK');
  const blanks = results.filter((r) => r.verdict === 'BLANK');
  const fetchNg = results.filter((r) => r.verdict.startsWith('NG'));

  if (AS_JSON) { console.log(JSON.stringify(results, null, 1)); return; }

  console.log(`\n=== 判定 ===`);
  console.log(`  OK          ${results.length - bad.length}枚`);
  console.log(`  🔴 BLANK    ${blanks.length}枚（中身が無い → null化対象）`);
  console.log(`  ⚠️ 取得失敗  ${fetchNg.length}枚（配信されていない → null化対象）`);
  const banner = results.filter((r) => r.verdict === 'OK' && r.aspect >= 2.2).length;
  const small = results.filter((r) => r.verdict === 'OK' && Math.max(r.W, r.H) < 200).length;
  console.log(`  （参考）横長バナー ${banner}枚・低解像度 ${small}枚 … 描画側でcontain表示するため**対象外**`);

  const targets = [...blanks, ...fetchNg];
  const targetShops = targets.flatMap((r) => byUrl.get(r.url));
  console.log(`\n=== null化する店舗 ${targetShops.length}件 ===`);
  for (const r of targets) {
    for (const s of byUrl.get(r.url)) console.log(`  ${s.id.padEnd(46)} ${(s.name || '').slice(0, 22).padEnd(24)} ${r.reason}`);
  }

  if (!LIVE) { console.log(`\n（dry-run）実行するには --live を付けてください`); return; }

  // 🛑 安全弁①: 想定を大きく超える件数なら止める。
  //    2026-08-20 の事故では、ブラウザ実測48枚に対しsharpが90枚を返していた。
  //    この乖離の時点で止まるべきだった（＝バグを疑うべきだった）。
  const ratio = targetShops.length / withImg.length;
  if (ratio > 0.08) {
    console.error(`\n🛑 中止: null化対象が ${targetShops.length}/${withImg.length}件（${(ratio * 100).toFixed(1)}%）と多すぎます。`);
    console.error('   判定バグの可能性が高いので、実行せず判定条件を見直してください。');
    console.error('   意図的に大量削除する場合のみ --force を付けてください。');
    if (!args.includes('--force')) process.exit(1);
  }

  // 🛑 安全弁②: 破壊的更新の前に必ずバックアップを書く。
  //    初版はこれが無く、消したあと戻せない状態だった（ブラウザに残っていたのは僥倖）。
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const backupPath = `shop_image_url_backup_${stamp}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(
    withImg.map((s) => ({ id: s.id, name: s.name, image_url: s.image_url })), null, 1
  ));
  console.log(`\n💾 バックアップを書き出しました: ${backupPath}（${withImg.length}件）`);
  console.log(`   戻す場合: node scripts/maintenance/restore_shop_images.mjs --file=${backupPath} --live`);

  let ok = 0;
  for (const s of targetShops) {
    const { error } = await supabase.from('shops').update({ image_url: null }).eq('id', s.id);
    if (error) console.error(`  ❌ ${s.id}: ${error.message}`);
    else ok++;
  }
  console.log(`\n✅ ${ok}/${targetShops.length}件を null化しました（頭文字プレースホルダ表示に切り替わります）`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
