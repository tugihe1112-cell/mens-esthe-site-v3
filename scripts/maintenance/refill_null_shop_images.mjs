/**
 * refill_null_shop_images.mjs — image_url が null の店舗サムネイルを再取得してR2に保存する
 *
 * 【なぜ必要か】
 * 2026-08-06時点で shops 1,098件のうち **133件が image_url = null**（約12%）＝カードがNO IMAGEになる。
 * 配信側は健全（残り965件はすべて workers.dev から HTTP 200 で返る）ので、原因は純粋にデータ欠損。
 * 欠損の主因は 2026-07-06 の外部URL→R2一括移行（migrate_external_images_to_r2.mjs）で、
 *   ・元サイトが落ちていて fetch failed → null 化
 *   ・相対URL（/pic/... 等）や プロトコル相対URL（//cdn...）を new URL() で解決できず → null 化
 * が起きたため。移行前は「外部URLをwsrv経由で表示」していたので**見えていた**＝ユーザー体感の
 * 「前はあった気がする」は正しい。
 *
 * 【このスクリプトがやること】
 * null店舗の website_url から og:image → twitter:image → apple-touch-icon → 大きめの<img> の順で
 * サムネイル候補を拾い、R2（shop-logos/ 接頭辞＝Workerの許可リスト内）へ保存して image_url を更新する。
 *
 * 【安全設計】
 *  - image_url が null の店舗しか触らない（既存の965件には一切影響しない）
 *  - --dry-run 既定なし: 明示的に --live を付けたときだけDBを更新する
 *  - ロゴ/アイコンっぽいURL（favicon・apple-touch-icon等）は LazyImage 側で NO IMAGE 扱いされるため、
 *    最後の手段としてのみ採用する（--allow-icon 指定時のみ）
 *  - 取得失敗は null のまま（NO IMAGEは正常な表示なので無理に埋めない）
 *
 * 実行:
 *   node scripts/maintenance/refill_null_shop_images.mjs            # dry-run（DB更新なし・件数だけ見る）
 *   node scripts/maintenance/refill_null_shop_images.mjs --live     # 本実行
 *   オプション: --limit=20（少数テスト） --concurrency=4 --allow-icon
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { uploadBuffer } from '../lib/r2Upload.mjs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const args = process.argv.slice(2);
const LIVE = args.includes('--live');
const ALLOW_ICON = args.includes('--allow-icon');
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || 0;
const CONC = Number((args.find((a) => a.startsWith('--concurrency=')) || '').split('=')[1]) || 4;

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// LazyImage の ICON_PATTERNS と同じ判定（ここで拾ってもフロントでNO IMAGEになるso無意味）
const ICON_PATTERNS = ['apple-touch-icon', '/shop_icon/', '/shop_logo/', 'favicon', 'h-logo', 'header_logo', 'visual-logo', 'cropped-logo', 'cropped-icon', 'cropped-favicon'];
const isIconUrl = (u) => !!u && ICON_PATTERNS.some((p) => u.toLowerCase().includes(p));

const abs = (u, base) => {
  if (!u) return null;
  try {
    if (u.startsWith('//')) return 'https:' + u;
    return new URL(u, base).href; // 相対URLもここで絶対化（前回の移行はこれをやらず null 化していた）
  } catch { return null; }
};

const pick = (html, re) => { const m = html.match(re); return m ? m[1] : null; };

async function findThumbnail(siteUrl) {
  const res = await fetch(siteUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const base = res.url || siteUrl;

  const candidates = [
    pick(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
    pick(html, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i),
    pick(html, /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i),
  ].map((u) => abs(u, base)).filter(Boolean);

  // og系が無ければ本文の大きめ画像（メインビジュアル狙い）
  if (!candidates.length) {
    const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
      .map((m) => abs(m[1], base))
      .filter((u) => u && /\.(jpe?g|png|webp)(\?|$)/i.test(u) && !/spacer|blank|1x1|pixel/i.test(u));
    candidates.push(...imgs.slice(0, 3));
  }

  // 最後の手段: apple-touch-icon 等（フロントでNO IMAGE扱いなので --allow-icon 指定時のみ）
  const icon = abs(pick(html, /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i), base);

  const good = candidates.find((u) => !isIconUrl(u));
  if (good) return good;
  if (ALLOW_ICON && (candidates[0] || icon)) return candidates[0] || icon;
  return null;
}

const sha1 = async (s) => {
  const { createHash } = await import('crypto');
  return createHash('sha1').update(s).digest('hex');
};

/**
 * 画像を取ってR2へ。共有の uploadImage は UA が 'Mozilla/5.0' だけで多くのCDNに弾かれ、
 * 初回実行では候補83件中29件が「R2アップ失敗」になった。ここでは
 *   ①フルのブラウザUA ②Referer有り→無しの2段リトライ ③長めのタイムアウト
 * で取得し、成功したバッファだけを uploadBuffer でR2に置く。
 */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
async function fetchImageBuffer(imageUrl, referer) {
  // 認証情報入りURL（例 https://user@host/...）は fetch が構築できないので除外
  try { const u = new URL(imageUrl); if (u.username || u.password) return null; } catch { return null; }

  const attempts = [
    { 'User-Agent': UA, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8', ...(referer ? { Referer: referer } : {}) },
    { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' }, // Referer無しで再試行（Referer拒否のサイト対策）
  ];
  for (const headers of attempts) {
    try {
      const res = await fetch(imageUrl, { headers, redirect: 'follow', signal: AbortSignal.timeout(25000) });
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 512) continue; // 1x1やエラーページを除外
      if (ct && !/^image\//i.test(ct)) continue;
      return { buf, ct: ct || null };
    } catch { /* 次の試行へ */ }
  }
  return null;
}

async function main() {
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, website_url')
    .is('image_url', null)
    .order('id');
  if (error) { console.error('❌ 取得失敗:', error.message); process.exit(1); }

  const targets = (shops || []).filter((s) => s.website_url && /^https?:\/\//.test(s.website_url));
  const list = LIMIT ? targets.slice(0, LIMIT) : targets;

  console.log(`=== 店舗サムネイル再取得 ===`);
  console.log(`image_url=null: ${shops.length}件 / うちwebsite_urlあり: ${targets.length}件 / 今回対象: ${list.length}件`);
  console.log(LIVE ? '⚠️ LIVE モード（DBを更新します）\n' : '🔍 dry-run（DBは更新しません。--live で本実行）\n');

  let ok = 0, ng = 0;
  for (let i = 0; i < list.length; i += CONC) {
    const chunk = list.slice(i, i + CONC);
    await Promise.all(chunk.map(async (shop) => {
      try {
        const found = await findThumbnail(shop.website_url);
        if (!found) { ng++; console.log(`  -  ${shop.name}: 候補なし`); return; }
        if (!LIVE) { ok++; console.log(`  ✓  ${shop.name}: ${found.slice(0, 90)}`); return; }

        const got = await fetchImageBuffer(found, shop.website_url);
        if (!got) { ng++; console.log(`  ✗  ${shop.name}: 画像取得失敗 ${found.slice(0, 60)}`); return; }
        const key = `shop_${(await sha1(found)).slice(0, 16)}${(found.match(/\.(jpe?g|png|webp)/i) || ['.jpg'])[0]}`;
        const newUrl = await uploadBuffer(got.buf, key, got.ct, 'shop-logos');
        if (!newUrl) { ng++; console.log(`  ✗  ${shop.name}: R2アップ失敗`); return; }
        const { error: uErr } = await supabase.from('shops').update({ image_url: newUrl }).eq('id', shop.id);
        if (uErr) { ng++; console.log(`  ✗  ${shop.name}: DB更新失敗 ${uErr.message}`); return; }
        ok++; console.log(`  ✅ ${shop.name}: 更新`);
      } catch (e) {
        ng++; console.log(`  ✗  ${shop.name}: ${String(e.message).slice(0, 60)}`);
      }
    }));
  }

  console.log(`\n結果: 成功 ${ok} / 失敗・候補なし ${ng}`);
  console.log(ng ? '※ 失敗分は元サイトのダウン/閉店が主因。null のまま＝NO IMAGE表示が正しい挙動です。' : '');
}
main().catch((e) => { console.error('❌', e); process.exit(1); });
