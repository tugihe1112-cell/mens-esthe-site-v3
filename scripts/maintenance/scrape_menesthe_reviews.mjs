/**
 * men-esthe.jp からクチコミをスクレイピングしてSupabaseに投入
 * 実行: node scripts/maintenance/scrape_menesthe_reviews.mjs [--dry-run]
 *
 * TARGETS 配列に「men-esthe.jpのサロンID」と「自サイトのshop_id」を設定して実行。
 * プレミアム口コミ（モザイク）は自動スキップ。
 *
 * ※ 同一salonIdが複数shopIdに対応する場合（グループ店舗）は
 *   1回のフェッチで全店舗分を挿入する（重複フェッチ回避）。
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (isDryRun) console.log('=== DRY RUN ===\n');

// ============================================================
// スクレイピング対象: men-esthe.jpのサロンIDと自サイトのshop_idを対応付け
// 同一salonIdが複数行に分かれている場合 → フェッチは1回、全店舗に挿入
// ============================================================
const TARGETS = [
  // ★ Silk は既に挿入済み。再挿入したい場合はコメントアウトを外す
  // { salonId: '9416', shopId: 'tokyo_shibuya_silk', shopName: 'Silk (シルク)' },

  // THE PREMIUM SPA (麻布十番・六本木)
  { salonId: '7711', shopId: 'tokyo_minato_azabujuban_the_premium_spa', shopName: 'THE PREMIUM SPA (ザ・プレミアムスパ)' },
  { salonId: '7711', shopId: 'tokyo_minato_roppongi_the_premium_spa',   shopName: 'THE PREMIUM SPA (ザ・プレミアムスパ)' },

  // THE HALF (渋谷・五反田)
  { salonId: '8721', shopId: 'tokyo_shibuya_the_half',          shopName: 'THE HALF (ザ・ハーフ)' },
  { salonId: '8721', shopId: 'tokyo_shinagawa_gotanda_the_half', shopName: 'THE HALF' },

  // TIGER GATE (新橋・虎ノ門)
  { salonId: '1537', shopId: 'tokyo_minato_shinbashi_tiger_gate', shopName: 'TIGER GATE (タイガーゲート)' },
  { salonId: '1537', shopId: 'tokyo_minato_toranomon_tiger_gate', shopName: 'TIGER GATE (タイガーゲート)' },

  // Aroma Maison (秋葉原・銀座・新橋)
  { salonId: '295', shopId: 'tokyo_chiyoda_akihabara_aroma_maison', shopName: 'Aroma Maison (アロマメゾン 秋葉原店)' },
  { salonId: '295', shopId: 'tokyo_chuo_ginza_aroma_maison',        shopName: 'Aroma Maison (アロマメゾン 銀座店)' },
  { salonId: '295', shopId: 'tokyo_minato_shinbashi_aroma_maison',  shopName: 'Aroma Maison (アロマメゾン 新橋店)' },

  // Aroma Jewels (秋葉原・五反田・新宿各店)
  { salonId: '2670', shopId: 'tokyo_chiyoda_akihabara_aroma_jewels',         shopName: 'Aroma Jewels 秋葉原ルーム' },
  { salonId: '2670', shopId: 'tokyo_shinagawa_gotanda_aroma_jewels',          shopName: 'Aroma Jewels 五反田ルーム' },
  { salonId: '2670', shopId: 'tokyo_shinjuku_higashishinjuku_aroma_jewels',   shopName: 'Aroma Jewels 東新宿ルーム' },
  { salonId: '2670', shopId: 'tokyo_shinjuku_nishishinjuku_aroma_jewels',     shopName: 'Aroma Jewels 西新宿ルーム' },
  { salonId: '2670', shopId: 'tokyo_shinjuku_shinjuku_gyoen_aroma_jewels',    shopName: 'Aroma Jewels 新宿御苑ルーム' },
  { salonId: '2670', shopId: 'tokyo_shinjuku_shinjuku_sanchome_aroma_jewels', shopName: 'Aroma Jewels 新宿三丁目ルーム' },

  // AROMA more (銀座・六本木・歌舞伎町・池袋)
  { salonId: '886', shopId: 'tokyo_chuo_ginza_aromamore',         shopName: 'AROMA more (アロマモア)' },
  { salonId: '886', shopId: 'tokyo_minato_roppongi_aromamore',     shopName: 'AROMA more (アロマモア)' },
  { salonId: '886', shopId: 'tokyo_shinjuku_kabukicho_aromamore',  shopName: 'AROMA more (アロマモア)' },
  { salonId: '886', shopId: 'tokyo_toshima_ikebukuro_aromamore',   shopName: 'AROMA more (アロマモア)' },

  // メンズエステ恵比寿
  { salonId: '310', shopId: 'tokyo_shibuya_ebisu_mens_este_ebisu', shopName: 'メンズエステ恵比寿' },

  // Aroma Lunabelle (7店舗)
  { salonId: '14338', shopId: 'tokyo_chiyoda_akihabara_aroma_lunabelle_akihabara', shopName: 'Aroma Lunabelle (アロマルナベール秋葉原)' },
  { salonId: '14338', shopId: 'tokyo_minato_azabujuban_lunabelle',                 shopName: 'Aroma Lunabelle (麻布十番店)' },
  { salonId: '14338', shopId: 'tokyo_minato_shinbashi_lunabelle',                  shopName: 'Aroma Lunabelle (新橋店)' },
  { salonId: '14338', shopId: 'tokyo_shibuya_yoyogi_harajuku_lunabelle',           shopName: 'Aroma Lunabelle (代々木店)' },
  { salonId: '14338', shopId: 'tokyo_shinagawa_gotanda_lunabelle',                 shopName: 'Aroma Lunabelle (五反田店)' },
  { salonId: '14338', shopId: 'tokyo_shinjuku_shinjuku_lunabelle',                 shopName: 'Aroma Lunabelle (新宿店)' },
  { salonId: '14338', shopId: 'tokyo_toshima_ikebukuro_lunabelle',                 shopName: 'Aroma Lunabelle (池袋店)' },

  // THE★GIN / ザギン (5店舗)
  { salonId: '202', shopId: 'tokyo_chuo_ginza_the_gin',         shopName: 'THE★GIN (ザギン) 銀座店' },
  { salonId: '202', shopId: 'tokyo_chuo_kayabacho_the_gin',     shopName: 'THE★GIN (ザギン) 茅場町店' },
  { salonId: '202', shopId: 'tokyo_chuo_nihonbashi_the_gin',    shopName: 'THE★GIN (ザギン) 日本橋店' },
  { salonId: '202', shopId: 'tokyo_chuo_ningyocho_the_gin',     shopName: 'THE★GIN (ザギン) 人形町店' },
  { salonId: '202', shopId: 'tokyo_shinjuku_ichigaya_the_gin',  shopName: 'THE★GIN (ザギン) 市ヶ谷店' },

  // 竜宮城 旧百万石 (5店舗 + 沼津)
  { salonId: '9709', shopId: 'shizuoka_numazu_ryugujo',          shopName: '竜宮城 旧百万石 (沼津店)' },
  { salonId: '9709', shopId: 'tokyo_chuo_ginza_ryugujo',          shopName: '竜宮城 旧百万石 (銀座店)' },
  { salonId: '9709', shopId: 'tokyo_chuo_ningyocho_ryugujo',      shopName: '竜宮城 旧百万石 (人形町店)' },
  { salonId: '9709', shopId: 'tokyo_koto_monzennakacho_ryugujo',  shopName: '竜宮城 旧百万石 (門前仲町店)' },
  { salonId: '9709', shopId: 'tokyo_ota_kamata_ryugujo',          shopName: '竜宮城 旧百万石 (蒲田店)' },

  // LINDA SPA (5店舗)
  { salonId: '72', shopId: '60203',                        shopName: 'LINDA SPA (三軒茶屋店)' },
  { salonId: '72', shopId: '60235',                        shopName: 'LINDA SPA (目黒店)' },
  { salonId: '72', shopId: '60338',                        shopName: 'LINDA SPA (恵比寿店)' },
  { salonId: '72', shopId: 'tokyo_meguro_linda_spa',       shopName: 'LINDA SPA (中目黒店)' },
  { salonId: '72', shopId: 'tokyo_minato_azabujuban_linda_spa', shopName: 'LINDA SPA (リンダスパ)' },

  // Carinna / カリナ
  { salonId: '11447', shopId: 'tokyo_minato_azabujuban_carinna', shopName: 'Carinna (カリナ)' },
  { salonId: '11447', shopId: 'tokyo_shibuya_ebisu_carinna',     shopName: 'Carinna (カリナ)' },

  // BELLA SPA
  { salonId: '2575', shopId: '60345', shopName: 'BELLA SPA (ベラスパ)' },

  // Limited Spa
  { salonId: '1710', shopId: 'tokyo_shinjuku_higashishinjuku_limited_spa', shopName: 'Limited Spa (リミテッドスパ)' },
  { salonId: '1710', shopId: 'tokyo_shinjuku_okubo_limited_spa',           shopName: 'Limited Spa (リミテッドスパ)' },
  { salonId: '1710', shopId: 'tokyo_sumida_kinshicho_limited_spa',         shopName: 'Limited Spa (リミテッドスパ)' },

  // ANAICHI / アナイチ
  { salonId: '2197', shopId: 'tokyo_shibuya_anaichi', shopName: 'ANAICHI (アナイチ)' },

  // AROMA EMERALD (4店舗)
  { salonId: '9749', shopId: 'tokyo_minato_akasaka_emerald',    shopName: 'AROMA EMERALD (アロマエメラルド)' },
  { salonId: '9749', shopId: 'tokyo_minato_azabujuban_emerald', shopName: 'AROMA EMERALD (アロマエメラルド)' },
  { salonId: '9749', shopId: 'tokyo_shibuya_aroma_emerald',     shopName: 'AROMA EMERALD (アロマエメラルド)' },
  { salonId: '9749', shopId: 'tokyo_shibuya_ebisu_emerald',     shopName: 'AROMA EMERALD (アロマエメラルド)' },

  // サウダージ (3店舗)
  { salonId: '7427', shopId: 'tokyo_minato_azabujuban_saudade', shopName: 'サウダージ (旧リセット)' },
  { salonId: '7427', shopId: 'tokyo_shibuya_ebisu_saudade',     shopName: 'サウダージ (旧リセット)' },
  { salonId: '7427', shopId: 'tokyo_shibuya_sasazuka_saudade',  shopName: 'サウダージ (旧リセット)' },

  // ARIA / アリア
  { salonId: '3877', shopId: 'tokyo_minato_azabujuban_aria',   shopName: 'ARIA (アリア)' },
  { salonId: '3877', shopId: 'tokyo_shinagawa_shinagawa_aria', shopName: 'ARIA (アリア)' },

  // Tokyo Aroma Este (3店舗)
  { salonId: '1517', shopId: 'tokyo_chiyoda_iidabashi_tokyo_aroma_este',          shopName: 'Tokyo Aroma Este (東京アロマエステ) 飯田橋店' },
  { salonId: '1517', shopId: 'tokyo_shinjuku_higashishinjuku_tokyo_aroma_este',   shopName: 'Tokyo Aroma Este (東京アロマエステ) 東新宿店' },
  { salonId: '1517', shopId: 'tokyo_shinjuku_nishishinjuku_tokyo_aroma_este',     shopName: 'Tokyo Aroma Este (東京アロマエステ) 西新宿店' },

  // Love it / ラヴィット
  { salonId: '7632', shopId: 'tokyo_shibuya_love_it', shopName: 'Love it (ラヴィット)' },

  // ANNA / アンナ
  { salonId: '1247', shopId: 'tokyo_shinagawa_gotanda_anna', shopName: 'ANNA (アンナ)' },

  // Aroma ABC
  { salonId: '2593', shopId: 'tokyo_shinagawa_gotanda_aroma_abc', shopName: 'Aroma ABC (アロマABC)' },

  // ラグタイム lux time (7店舗)
  { salonId: '1442', shopId: 'tokyo_chiyoda_akihabara_luxtime',   shopName: 'ラグタイム lux time (秋葉原店)' },
  { salonId: '1442', shopId: 'tokyo_chiyoda_kanda_luxtime',       shopName: 'ラグタイム lux time (神田店)' },
  { salonId: '1442', shopId: 'tokyo_chuo_ginza_luxtime',          shopName: 'ラグタイム lux time (銀座店)' },
  { salonId: '1442', shopId: 'tokyo_minato_shinbashi_luxtime',    shopName: 'ラグタイム lux time (新橋店)' },
  { salonId: '1442', shopId: 'tokyo_shinagawa_gotanda_luxtime',   shopName: 'ラグタイム lux time (五反田店)' },
  { salonId: '1442', shopId: 'tokyo_sumida_kinshicho_luxtime',    shopName: 'ラグタイム lux time (錦糸町店)' },
  { salonId: '1442', shopId: 'tokyo_toshima_ikebukuro_luxtime',   shopName: 'ラグタイム lux time (池袋店)' },

  // ゆるスパ 五反田店
  { salonId: '9534', shopId: 'tokyo_shinagawa_gotanda_yuru_spa', shopName: 'ゆるスパ 五反田店' },

  // Rains Rapt / レインズラプト
  { salonId: '77', shopId: 'tokyo_shinagawa_gotanda_rains_rapt', shopName: 'Rains Rapt (レインズラプト)' },

  // エステの王様 (3店舗)
  { salonId: '13313', shopId: 'tokyo_shibuya_ebisu_esthe_king',     shopName: 'エステの王様' },
  { salonId: '13313', shopId: 'tokyo_shinagawa_gotanda_esthe_king', shopName: 'エステの王様' },
  { salonId: '13313', shopId: 'tokyo_shinagawa_shinagawa_esthe_king', shopName: 'エステの王様' },

  // むちむちお姉さん
  { salonId: '10216', shopId: 'tokyo_toshima_ikebukuro_muchimuchi_onesan', shopName: 'むちむちお姉さん' },

  // A5 SPA / エーゴスパ
  { salonId: '2798', shopId: 'tokyo_shibuya_shibuya_a5spa', shopName: 'A5 SPA (エーゴスパ)' },

  // カノネコ (2店舗)
  { salonId: '15206', shopId: 'tokyo_shinagawa_gotanda_kanoneko',  shopName: 'カノネコ (旧もしも彼女が黒猫だったら)' },
  { salonId: '15206', shopId: 'tokyo_shinagawa_shinagawa_kanoneko', shopName: 'カノネコ (旧もしも彼女が黒猫だったら)' },

  // DAHLIA / ダリア (5店舗)
  { salonId: '1401', shopId: 'tokyo_meguro_meguro_dahlia',    shopName: 'DAHLIA (ダリア)' },
  { salonId: '1401', shopId: 'tokyo_minato_tamachi_dahlia',   shopName: 'DAHLIA (ダリア)' },
  { salonId: '1401', shopId: 'tokyo_shibuya_ebisu_dahlia',    shopName: 'DAHLIA (ダリア)' },
  { salonId: '1401', shopId: 'tokyo_shinagawa_gotanda_dahlia', shopName: 'DAHLIA (ダリア)' },
  { salonId: '1401', shopId: 'tokyo_shinagawa_oimachi_dahlia', shopName: 'DAHLIA (ダリア)' },

  // Candy Spa (出張・渋谷)
  { salonId: '9056', shopId: 'tokyo_dispatch_candy_spa', shopName: 'Candy Spa (キャンディスパ)' },
  { salonId: '9056', shopId: 'tokyo_shibuya_candy_spa',  shopName: 'Candy Spa (キャンディスパ)' },
];

const BATCH_SIZE = 500;
const DELAY_MS = 1500; // リクエスト間隔（サーバー負荷軽減）

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const fetchPage = async (salonId, page) => {
  const url = page === 0
    ? `https://men-esthe.jp/salon.php?id=${salonId}`
    : `https://men-esthe.jp/salon.php?p=${page}&id=${salonId}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ja' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
};

// shopId/shopNameを仮値で渡し、後でmap()で差し替えるため第3・4引数は省略可
const parseReviews = (html) => {
  const $ = cheerio.load(html);
  const reviews = [];

  // 各口コミブロックを処理
  $('li[id^="kid-"], li a[name^="kid-"]').closest('li').each((_, el) => {
    // プレミアム口コミ（モザイク）はスキップ
    if ($(el).find('img[src*="premosaic"], img[src*="mosaic"]').length > 0) return;
    if ($(el).text().includes('プレミアム口コミ')) return;

    // セラピスト名（年齢・「さん」除去）
    const therapistRaw = $(el).find('h3 a').first().text().trim();
    const therapistName = therapistRaw.replace(/\s*\(\d+\).*$/, '').trim();

    // セラピストID（men-esthe.jp内部ID）
    const therapistHref = $(el).find('h3 a').first().attr('href') || '';
    const therapistSourceId = therapistHref.match(/id=(\d+)/)?.[1] || null;

    // 投稿者名
    const userRaw = $(el).find('a[href*="payingMemberPROFModal"]').last().text().trim();
    const userName = userRaw.replace(/さん$/, '').trim() || '匿名';

    // 点数（0〜100 → rating 1〜5に変換）
    const scoreText = $(el).text().match(/点数[：:]\s*(\d+)点/)?.[1];
    const score = scoreText ? parseInt(scoreText) : null;
    const rating = score ? Math.round((score / 100) * 5 * 10) / 10 : null;

    // 口コミ本文（ノイズ除去）
    const contentEl = $(el).find('p, .kuchikomi-content').last();
    let content = contentEl.length
      ? contentEl.text().trim()
      : $(el).clone()
          .find('h3, .star, a, img, script').remove().end()
          .text().replace(/\s+/g, ' ').trim();

    // ヘッダーノイズ除去: 「オススメ度: 点数: XX点 投稿者： 」→ここまで削除、本文はその直後
    content = content.replace(/^.*?投稿者[：:]\s*/s, '').trim();
    // フッターノイズ除去: 「Good:0人 Bad:0人 口コミ内容に違和感の...」
    content = content.replace(/\s*Good:\d+人.*$/s, '').trim();

    // 短すぎる・空はスキップ
    if (!content || content.length < 50) return;
    if (!therapistName) return;

    reviews.push({
      therapist_name: therapistName,
      therapist_id: therapistSourceId ? `menesthe_therapist_${therapistSourceId}` : null,
      user_name: userName,
      user_id: 'menesthe_import',
      rating,
      content,
    });
  });

  // ページネーションが次のページを持つか確認
  const hasNext = $('a[href*="salon.php?p="]').length > 0;
  return { reviews, hasNext };
};

// ============================================================
// メイン処理: salonIdでグルーピングして重複フェッチを回避
// ============================================================
let totalInserted = 0;
let totalSkipped = 0;

// salonId → [shopTargets] にグルーピング
const grouped = {};
for (const t of TARGETS) {
  if (!grouped[t.salonId]) grouped[t.salonId] = [];
  grouped[t.salonId].push(t);
}

for (const [salonId, shopTargets] of Object.entries(grouped)) {
  const shopNames = shopTargets.map(t => t.shopName).join(' / ');
  console.log(`\n【${shopNames}】(salonId=${salonId}, ${shopTargets.length}店舗)`);

  // ページを全件フェッチ（1回のみ）
  const rawReviews = [];
  let page = 0;
  while (true) {
    try {
      console.log(`  p=${page} フェッチ中...`);
      const html = await fetchPage(salonId, page);
      const { reviews, hasNext } = parseReviews(html);
      console.log(`  → ${reviews.length}件取得（プレミアム除く）`);
      rawReviews.push(...reviews);

      if (!hasNext || reviews.length === 0) break;
      page++;
      await sleep(DELAY_MS);
    } catch (e) {
      console.error(`  ❌ p=${page} エラー:`, e.message);
      break;
    }
  }

  console.log(`  合計 ${rawReviews.length}件 取得`);
  if (rawReviews.length === 0) continue;

  if (isDryRun) {
    console.log('\n[DRY RUN] サンプル（最初の2件）:');
    rawReviews.slice(0, 2).forEach(r => console.log(JSON.stringify({
      ...r, shop_id: shopTargets[0].shopId, shop_name: shopTargets[0].shopName,
    }, null, 2)));
    continue;
  }

  // 各店舗に同じ口コミを挿入（IDはsalonId + shopId + インデックスで一意化）
  for (const shopTarget of shopTargets) {
    const withIds = rawReviews.map((r, i) => ({
      id: `menesthe_${salonId}_${shopTarget.shopId}_${i}`,
      shop_id: shopTarget.shopId,
      shop_name: shopTarget.shopName,
      ...r,
    }));

    // バッチ投入
    for (let i = 0; i < withIds.length; i += BATCH_SIZE) {
      const batch = withIds.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('reviews').insert(batch);
      if (error) {
        console.error(`  ❌ ${shopTarget.shopId} バッチエラー:`, error.message);
      } else {
        totalInserted += batch.length;
        console.log(`  ✅ ${shopTarget.shopId}: ${batch.length}件挿入 (累計${totalInserted}件)`);
      }
    }
  }
}

console.log(`\n完了: ${totalInserted}件成功 / ${totalSkipped}件スキップ`);
