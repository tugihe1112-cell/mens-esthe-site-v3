/**
 * 千葉・埼玉 未登録人気店 一括shop登録
 * mens-mg.com ランキングTOP5（未登録分）を登録
 * og:image を取得して image_url も同時設定
 *
 * 実行: node scripts/maintenance/process_chiba_saitama_shops.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const og = $('meta[property="og:image"]').attr('content')
      || $('meta[name="twitter:image"]').attr('content')
      || $('link[rel="apple-touch-icon"]').attr('href')
      || null;
    // 相対URLを絶対URLに変換
    if (og && og.startsWith('/')) {
      const base = new URL(url);
      return `${base.protocol}//${base.host}${og}`;
    }
    return og;
  } catch { return null; }
}

// 登録する店舗リスト
const SHOPS = [
  // ===== 千葉エリア =====
  {
    id: 'chiba_chiba_spa_dream',
    name: 'SPA DREAM ～スパドリーム～',
    website_url: 'https://spa-dream.com/',
    pref: '千葉県', area: '千葉',
  },
  {
    id: 'chiba_chiba_madame_relax',
    name: 'Madame Relax ～マダムリラックス～',
    website_url: 'https://www.madame-relax.com/chiba/',
    pref: '千葉県', area: '千葉',
  },
  {
    id: 'chiba_chiba_body_spa',
    name: 'Body Spa ～ボディスパ～ 千葉本店',
    website_url: 'https://www.bodyspa2008.com/chiba',
    pref: '千葉県', area: '千葉',
  },
  {
    id: 'chiba_chiba_suhada_spa',
    name: 'SUHADA SPA ～すはだスパ～ 千葉店',
    website_url: 'https://suhadaspa.vsw.jp/chiba/',
    pref: '千葉県', area: '千葉',
  },

  // ===== 松戸エリア =====
  {
    id: 'chiba_matsudo_rose',
    name: 'Rose ～ローズ～',
    website_url: 'https://esthetic-rose.com/',
    pref: '千葉県', area: '松戸',
  },
  {
    id: 'chiba_matsudo_aroma_mrs',
    name: 'Aroma Mrs. ～アロマな女性たち～',
    website_url: 'https://aromamrs.com/',
    pref: '千葉県', area: '松戸',
  },
  {
    id: 'chiba_matsudo_himitsu_no_tobira',
    name: '秘密の扉',
    website_url: 'https://matsudo-mensesthe.com/',
    pref: '千葉県', area: '松戸',
  },
  {
    id: 'chiba_matsudo_paradise_spa',
    name: 'Paradise Spa ～パラダイススパ～',
    website_url: 'https://paradise-spa.info/',
    pref: '千葉県', area: '松戸',
  },
  {
    id: 'chiba_matsudo_lovers',
    name: 'Lovers ～ラバーズ～',
    website_url: 'https://lovers-matsudo.com/',
    pref: '千葉県', area: '松戸',
  },

  // ===== 柏エリア =====
  {
    id: 'chiba_kashiwa_suhada_spa',
    name: 'SUHADA SPA ～すはだスパ～ 柏店',
    website_url: 'https://suhadaspa.vsw.jp/kashiwa/',
    pref: '千葉県', area: '柏',
  },
  {
    id: 'chiba_kashiwa_m_labo_spa',
    name: 'M Labo Spa ～エムラボスパ～ 柏ルーム',
    website_url: 'https://mlabospa.vsw.jp/kashiwa/',
    pref: '千葉県', area: '柏',
  },
  {
    id: 'chiba_kashiwa_bijo_spa',
    name: '美女SPA',
    website_url: 'https://bijo-spa.com/',
    pref: '千葉県', area: '柏',
  },
  {
    id: 'chiba_kashiwa_eden_spa',
    name: 'Eden Spa ～エデンスパ～',
    website_url: 'https://eden-spa.net/',
    pref: '千葉県', area: '柏',
  },

  // ===== 大宮エリア =====
  {
    id: 'saitama_omiya_mrs_eternity',
    name: 'MrsEternity ～ミセスエタニティ～',
    website_url: 'https://salon-eternity.com/',
    pref: '埼玉県', area: '大宮',
  },
  {
    id: 'saitama_omiya_ace',
    name: 'ACE ～エース～',
    website_url: 'https://omiya-mens-este.net/',
    pref: '埼玉県', area: '大宮',
  },
  {
    id: 'saitama_omiya_aroma_castle',
    name: 'AROMA CASTLE ～アロマキャッスル～',
    website_url: 'https://aroma-castle.jp/',
    pref: '埼玉県', area: '大宮',
  },

  // ===== 浦和エリア =====
  {
    id: 'saitama_urawa_mitsu_no_yasuragi',
    name: '蜜の安らぎ',
    website_url: 'http://www.mitsu-no-yasuragi.com/',
    pref: '埼玉県', area: '浦和',
  },
  {
    id: 'saitama_urawa_kurenai',
    name: '紅 -KURENAI-',
    website_url: 'https://urawa-kurenai.com/',
    pref: '埼玉県', area: '浦和',
  },
  {
    id: 'saitama_urawa_aroma_chiaful',
    name: 'AROMA CHIAFUL ～アロマチアフル～',
    website_url: 'https://aroma-chiaful.com/',
    pref: '埼玉県', area: '浦和',
  },
  {
    id: 'saitama_urawa_romeo',
    name: 'ROMEO ～ロメオ～',
    website_url: 'https://aromaspa-romeo.com/',
    pref: '埼玉県', area: '浦和',
  },
  {
    id: 'saitama_urawa_pink_lady',
    name: 'Pink Lady ～ピンクレディー～',
    website_url: 'https://pink-lady.men-es.jp/',
    pref: '埼玉県', area: '浦和',
  },

  // ===== 川口・蕨エリア =====
  {
    id: 'saitama_warabi_otona_no_teishajou',
    name: '大人の停車場',
    website_url: 'https://otei.ug11pm.com/',
    pref: '埼玉県', area: '川口・蕨',
  },
  {
    id: 'saitama_warabi_magokoro_spa',
    name: 'まごころスパ',
    website_url: 'https://magokoro-spa.com/',
    pref: '埼玉県', area: '川口・蕨',
  },
  {
    id: 'saitama_kawaguchi_pattaya_resort',
    name: 'Pattaya Resort ～パタヤリゾート～',
    website_url: 'https://www.pattaya-resort.jp/',
    pref: '埼玉県', area: '川口・蕨',
  },
  {
    id: 'saitama_warabi_sukitto_spa',
    name: 'スキっとSPA',
    website_url: 'https://sukitto-spa.com/',
    pref: '埼玉県', area: '川口・蕨',
  },

  // ===== 越谷・春日部エリア =====
  {
    id: 'saitama_koshigaya_aroma_liberty',
    name: 'Aroma Liberty ～アロマリバティー～',
    website_url: 'https://aromaliberty.com/',
    pref: '埼玉県', area: '越谷・春日部',
  },
  {
    id: 'saitama_koshigaya_boku_no_esthe',
    name: 'ぼくのエステ 越谷ルーム',
    website_url: 'https://boku-este.jp/',
    pref: '埼玉県', area: '越谷・春日部',
  },
  {
    id: 'saitama_koshigaya_laugh_tale',
    name: 'Laugh Tale ～ラフテル～',
    website_url: 'https://www.laugh-tale.net/',
    pref: '埼玉県', area: '越谷・春日部',
  },
  {
    id: 'saitama_koshigaya_red_ribbon',
    name: 'Red Ribbon ～レッドリボン～ 越谷ルーム',
    website_url: 'https://redribbon-koshigaya.com/',
    pref: '埼玉県', area: '越谷・春日部',
  },
  {
    id: 'saitama_kasukabe_kyoko_no_shimai',
    name: '今日子の姉妹 春日部店',
    website_url: 'https://kyoko-no-shimai.com/',
    pref: '埼玉県', area: '春日部',
  },

  // ===== 川越エリア =====
  {
    id: 'saitama_kawagoe_nature',
    name: 'Nature ～ナチュレ～',
    website_url: 'https://www.nature-esthetic.com/',
    pref: '埼玉県', area: '川越',
  },
  {
    id: 'saitama_kawagoe_otona_neverland',
    name: '大人のNEVERLAND ～大人のネバーランド～',
    website_url: 'https://otona-neverland.net/',
    pref: '埼玉県', area: '川越',
  },
  {
    id: 'saitama_kawagoe_king',
    name: 'KING ～キング～',
    website_url: 'https://www.kawagoe2024king.com/',
    pref: '埼玉県', area: '川越',
  },
  {
    id: 'saitama_kawagoe_re_fle_spa',
    name: 'Re:Fle Spa ～リフレスパ～',
    website_url: 'https://www.re-fre-spa.com/',
    pref: '埼玉県', area: '川越',
  },
  {
    id: 'saitama_kawagoe_lamp',
    name: 'らんぷ 川越店',
    website_url: 'https://kawagoe.senju-lamp.com/',
    pref: '埼玉県', area: '川越',
  },
  {
    id: 'saitama_kawagoe_anela_spa',
    name: 'Anela Spa ～アネラスパ～',
    website_url: 'https://anela-spa.com/',
    pref: '埼玉県', area: '川越',
  },

  // ===== 所沢エリア =====
  {
    id: 'saitama_tokorozawa_miyako',
    name: '都 -miyako-',
    website_url: 'https://miyakospa.com/',
    pref: '埼玉県', area: '所沢',
  },
  {
    id: 'saitama_tokorozawa_pause_grande',
    name: 'Pause Grande ～パウゼ グランデ～',
    website_url: 'https://www.tokorozawa-pause.net/',
    pref: '埼玉県', area: '所沢',
  },
  {
    id: 'saitama_tokorozawa_audition',
    name: '所沢オーディション',
    website_url: 'https://tokorozawa-audition.com/',
    pref: '埼玉県', area: '所沢',
  },
  {
    id: 'saitama_tokorozawa_bariano',
    name: 'Bariano ～バリアーノ～',
    website_url: 'https://es-balian-tokorozawa.com/',
    pref: '埼玉県', area: '所沢',
  },
  {
    id: 'saitama_tokorozawa_third_place',
    name: 'THIRD PLACE ～サードプレイス～',
    website_url: 'https://tokorozawa.salon-thirdplace.com/',
    pref: '埼玉県', area: '所沢',
  },
  {
    id: 'saitama_tokorozawa_lamp',
    name: 'らんぷ 所沢店',
    website_url: 'https://tokorozawa.senju-lamp.com/',
    pref: '埼玉県', area: '所沢',
  },
];

async function main() {
  console.log(`\n${DRY_RUN ? '[DRY-RUN] ' : ''}千葉・埼玉 shop登録開始 (${SHOPS.length}件)\n`);

  // 既存shop IDを確認
  const { data: existing } = await supabase.from('shops').select('id');
  const existingIds = new Set(existing?.map(s => s.id) || []);

  let registered = 0, skipped = 0, errors = 0;

  for (const shop of SHOPS) {
    if (existingIds.has(shop.id)) {
      console.log(`  スキップ（既存）: ${shop.name}`);
      skipped++;
      continue;
    }

    // og:image取得
    process.stdout.write(`  [${shop.area}] ${shop.name} ... `);
    const imageUrl = await getOgImage(shop.website_url);
    await sleep(500);

    const shopData = {
      id: shop.id,
      name: shop.name,
      website_url: shop.website_url,
      image_url: imageUrl,
      raw_data: {
        prefecture: shop.pref,
        area: shop.area,
      },
    };

    if (DRY_RUN) {
      console.log(`image=${imageUrl ? '✅' : '❌なし'}`);
      console.log(`    → ${JSON.stringify(shopData).substring(0, 100)}`);
      registered++;
      continue;
    }

    const { error } = await supabase.from('shops').insert(shopData);
    if (error) {
      console.log(`❌ ${error.message}`);
      errors++;
    } else {
      console.log(`✅ image=${imageUrl ? 'あり' : 'なし'}`);
      registered++;
    }
  }

  console.log(`\n完了: 登録${registered}件 / スキップ${skipped}件 / エラー${errors}件`);
  console.log('\nCLAUDE.md更新: 千葉・埼玉 全エリアshop登録完了');
}

main();
