/**
 * Chrome経由で取得した画像URLでShopサムネイルを更新
 * 実行: node scripts/maintenance/fix_shop_images_chrome.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('🔍 DRY-RUN モード\n');

// website_url → 取得した画像URL のマップ
// SKIPは除外済み
const URL_IMAGE_MAP = {
  // --- Berryz / HaTaEsu ---
  'http://berryzspa.net':          'https://berryzspa.net/wp-content/uploads/2025/07/24564709_m_p-1.jpg',
  'http://hataesu.com':            'https://urasanesu.com/img/logo.jpg',

  // --- WINNING HEAVEN ---
  'https://www.winning-heaven.com': 'https://www.winning-heaven.com/images/up_100_2_0_1772537117.png',

  // --- Aroma Lunabelle (7店舗) ---
  'https://aroma-lunabelle.com':   'https://aroma-lunabelle.com/ogimage.jpg',

  // --- ONE ROOM (5店舗) ---
  'https://www.oneroom-shinjyuku.com': 'https://www.oneroom-shinjyuku.com/images/up_100_3_0_1612146697.jpg',

  // --- ラグジュアリーグループ (6店舗) ---
  'https://luxury-gp.com':         'https://luxury-gp.com/wp-content/uploads/2026/05/IMG_3543.jpeg',

  // --- Limited Spa (6店舗) ---
  'https://limited-spa.com':       'https://limited-spa.com/images/apple-touch-icon.png',

  // --- コル・カロリ (4店舗) ---
  'https://cor-caroli.net':        'https://cor-caroli.net/wp-content/uploads/2026/04/IMG_8231-e1776093564753.jpeg',

  // --- THE★GIN (5店舗) ---
  'https://za-gin.com':            'https://za-gin.com/wp-content/uploads/%E6%A5%A0%E6%9C%A8%E3%82%8A%E3%81%952-600x600.jpg',

  // --- REVE SPA (3店舗) ---
  'https://revespa.net':           'https://revespa.net/images/gokueki.jpg',

  // --- Cozy (2店舗) ---
  'https://cozy-esthetic.com':     'https://cozy-esthetic.com/images/main1.jpg',

  // --- らんぷ各店 ---
  'https://www.senju-lamp.com':    'https://files.re-db.com/file/693d3c802a97e.png',
  'https://a.senju-lamp.com':      'https://files.re-db.com/file/5e47e0f99b319.jpg',
  'https://omiya.senju-lamp.com':  'https://files.re-db.com/file/640d023897b77.png',
  'https://kysm.senju-lamp.com':   'https://files.re-db.com/file/5e47f40cc038e.jpg',

  // --- First 新宿 ---
  'https://esthe-first.com':       'https://esthe-first.com/photo/upload/original/upload_0_0_60c0c2f122e6a.png',

  // --- Rise～リゼ～ (4店舗) ---
  'http://rise-aroma.com':         'https://rise-aroma.com/img/top.png',

  // --- AROMA AMOUR (2店舗) ---
  'http://www.akiba-amour.com':    'https://www.akiba-amour.com/images/up_100_3_0_1731322991.jpg',

  // --- LUANA 柏 ---
  'https://aroma-luana.com':       'https://aroma-luana.com/images/logo.png',

  // --- Luxury Romance GROUP (2店舗) ---
  'https://luxury-romance.net':    'https://luxury-romance.net/topimg/img/2-1.jpg',

  // --- Aroma Maison (3店舗) ---
  'https://www.aromamaison.tokyo': 'https://www.aromamaison.tokyo/images/up_100_6_0_1750839516.jpg',

  // --- AQUA (3店舗) ---
  'https://www.nakameguro-aqua.com': 'https://www.nakameguro-aqua.com/wp-content/uploads/2018/04/600_800_01-139-300x400.jpg',

  // --- WEST TOKYO (2店舗) ---
  'https://esthe-westtokyo.com':   'https://esthe-westtokyo.com/manage/image/up/20250306132344_6920404449_shop_slide_banner_img_url_0_w1200xh600.jpg',

  // --- milk tea ---
  'http://osakamilktea.com':       'https://osakamilktea.com/images/logo.png',

  // --- Sugar Spa ---
  'http://www.sugar-spa.net':      'http://www.sugar-spa.net/images/mt_10_1_2160.jpeg',

  // --- Aroma ABC ---
  'https://a-abc.tokyo':           'https://a-abc.tokyo/tenpo_img/699c7fa6df2a0.webp',

  // --- AROMA EMERALD (4店舗) ---
  'https://a-emerald.com':         'https://a-emerald.com/wp-content/uploads/2026/05/804fc78370eeaba1454a58f2dcfee2e6.jpg',

  // --- MORGANITE ---
  'https://a-morganite.com':       'https://a-morganite.com/wp-content/uploads/2026/02/50c580fac1483e0e65dffb985d71f67d.jpg',

  // --- ミセスあまおうセラピ ---
  'https://amaou-therapi.jp':      'https://img.o-pack.jp/shop/amaou/images/174663390875523300.jpg',

  // --- アマリリス ---
  'https://amaryllis.ap1hp.com':   'https://aroma-tsushin.com/__admin/img_hp/head_1_4431_1561642865124215.jpg',

  // --- 明大前ANNEX ---
  'https://aroma-annex.com':       'https://aroma-tsushin.com/__admin/img_hp/head_1_3996_1537847083836263.jpg',

  // --- Aroma BANKER ---
  'https://aroma-banker.com':      'https://aroma-banker.com/img/slide01.jpg',

  // --- 美吟 船橋 ---
  'https://aroma-bigin.net':       'https://aroma-tsushin.com/__admin/img_hp/head_1_3649_1682647127465643.jpg',

  // --- ベッドオブローゼス ---
  'https://bed-of-roses.site/index.html': 'https://bed-of-roses.site/assets/img/icon180-2.png',

  // --- C.r.e.a.m ---
  'https://cream-osaka.com':       'https://cream-osaka.com/img/head_img_catch_01.png',

  // --- DSP ---
  'https://dsp-osaka.net':         'https://dsp-osaka.net/img/icon/apple_touch_icon.png',

  // --- Ginza Rich ---
  'https://ginza-rich.work':       'https://ginza-rich.work/img/renewal.jpg',

  // --- GOAT ---
  'https://goat-osaka.com':        'https://goat-osaka.com/upload/banner/19.jpg',

  // --- ゴールデン ---
  'https://golden0508.com':        'https://golden0508.com/wp-content/uploads/2025/05/92E42963-0399-4A6A-A8B5-A9AA870521CC.jpeg',

  // --- 玉楼 ---
  'https://gyokurou.com':          'https://gyokurou.com/wp-content/themes/gyokuro/images/top.jpg',

  // --- アプローチ 川崎 ---
  'https://kawasakia.beautycloud.co.jp': 'https://files.re-db.com/file/6933f7d280819.jpg',

  // --- よりみち (3店舗) ---
  'https://kichijoji-igokochi.com': 'https://kichijoji-igokochi.com/upFu8/1000295/official/officialConf/logo/img/headerLogo.png',

  // --- セレブスパプレミアム ---
  'https://kitashinchiceleb.com':  'https://kitashinchiceleb.com/images/store/7341ff97145e2c20db2ac3b143887c8757e4f60a/f6622579d65bcfb5e172f3120a2646a3914cca7c.jpg',

  // --- 小悪魔スパトウキョウ (4店舗) ---
  'https://mens-esthe-aroma.site/index.html': 'https://mens-esthe-aroma.site/assets/favicon/apple-touch-icon.png',

  // --- ミセス美オーラ ---
  'https://mrs-viaura.com':        'https://mrs-viaura.com/img/base/twitter_img1.webp',

  // --- ピーチネクスト (2店舗) ---
  'https://peach-next.com':        'https://peach-next.com/upFu8/1004152/official/officialConf/logoresponsive/img/logo1.png',

  // --- ささやき ---
  'https://sasayaki-esthe.com':    'https://sasayaki-esthe.com/upFu8/1005326/official/officialConf/logoresponsive/img/logo1.png',

  // --- SEACRET ROOM ひまわり ---
  'https://sr-himawari.com':       'https://sr-himawari.com/upload/back_image/41.png',

  // --- タマネギ 大阪 ---
  'https://tamanegiman.com':       'https://tamanegiman.com/img/gallery/top_img/53.png',

  // --- アロマリゾート ---
  'https://tokyo-aroma-world.jp':  'https://tokyo-aroma-world.jp/upload/back_image/65.png',

  // --- Tororich ---
  'https://www.tororich.net':      'https://www.tororich.net/images/up_100_3_0_1583406062.gif',

  // --- TRENDY SPA (3店舗) ---
  'https://www.trendy-spa.com':    'https://www.trendy-spa.com/images/toppic22.jpg',

  // --- ワイフコレクション ---
  'https://www.wife-collection.com': 'https://www.wife-collection.com/data/event/1770f79c2217771100325fb8f97bc0c7.jpg',

  // --- ゆりかご FC名古屋 ---
  'https://www.yurikago-nagoya.com': 'https://www.yurikago-nagoya.com/userImgShop/sraiderCoverMaster/19/w950.jpg',

  // --- ゆるスパ ---
  'https://yuru-spa.com/gotanda':  'https://yuru-spa.com/gotanda/tenpo_img/6892360225797.gif',
  'https://yuru-spa.com/yokohama': 'https://yuru-spa.com/yokohama/tenpo_img/6892360225797.gif',

  // --- Anemone ---
  'https://www.ane-mones.net':     'https://www.ane-mones.net/images/up_100_5_0_1766663927.jpg',

  // --- Natural Organic Spa ---
  'https://www.naturalorganicspa-sjk.com': 'https://www.naturalorganicspa-sjk.com/img/common/logo.png',

  // --- AUTHORITY (2店舗) ---
  'https://www.me-authority.com':  'https://www.me-authority.com/images/up_100_7_0_1619472061.jpg',

  // --- メンズエステ妻 浦和 ---
  'https://www.mensesthe-duma.com': 'https://www.mensesthe-duma.com/images/up_100_2_0_1769068497.jpg',

  // --- Rains Rapt ---
  'https://www.rainsrapt.com':     'https://www.rainsrapt.com/images/up_100_3_0_1580651218.jpg',

  // --- Regis ---
  'https://www.salon-regis.com/omiya': 'https://www.salon-regis.com/omiya/images/toppic_1.jpg',

  // --- everGreen ---
  'https://www.ever-green.tokyo':  'https://www.ever-green.tokyo/images/up_100_3_0_1670768128.jpg',

  // --- RELAX ---
  'https://www.e-kimoti.net':      'https://www.e-kimoti.net/img/logo_small.png',
};

// Supabase Storageのベース
const STORAGE_ORIGIN = getEnv('VITE_SUPABASE_URL') + '/storage';

// website_url を正規化（末尾スラッシュ除去）
const norm = (url) => (url || '').replace(/\/$/, '');

async function main() {
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name, image_url, website_url');

  // Storageのままの店舗のみ対象
  const targets = shops.filter(s => s.image_url && s.image_url.includes(STORAGE_ORIGIN) && s.website_url);

  let updated = 0, skipped = 0, notFound = 0;

  for (const shop of targets) {
    const key = norm(shop.website_url);
    const newImg = URL_IMAGE_MAP[key];

    if (!newImg) {
      notFound++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`✅ [${shop.name}]\n   ${newImg.slice(0, 80)}...`);
      updated++;
      continue;
    }

    const { error } = await supabase
      .from('shops')
      .update({ image_url: newImg })
      .eq('id', shop.id);

    if (error) {
      console.log(`  ⚠️  更新失敗: ${shop.name} - ${error.message}`);
    } else {
      console.log(`✅ ${shop.name}`);
      updated++;
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`✅ 更新: ${updated}件`);
  console.log(`⏭ マップ未登録: ${notFound}件`);
  if (DRY_RUN) console.log('\n本実行は --dry-run なしで。');
}

main().catch(console.error);
