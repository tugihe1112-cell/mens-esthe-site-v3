/**
 * schedule_url が未設定の54店舗に一括設定
 * --dry-run で確認してから実行
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// ── 確定済み: shop_id → schedule_url ──────────────────────────────────
const CONFIRMED = {
  // CREST SPA TOKYO（2店舗）
  'tokyo_kita_crest_spa_tokyo':     'https://crestspa-tokyo.com/schedule',
  'tokyo_tachikawa_crest_spa_tokyo': 'https://crestspa-tokyo.com/schedule',

  // 竜宮城（3店舗）
  'shizuoka_numazu_ryugujo':                 'https://esthe-ryugujo.com/schedule/',
  'tokyo_koto_monzennakacho_ryugujo':        'https://esthe-ryugujo.com/schedule/',
  'tokyo_ota_kamata_ryugujo':                'https://esthe-ryugujo.com/schedule/',

  // Chocolate（2店舗）
  'tokyo_shinjuku_chocolate_shinjuku':       'https://www.aroma-chocolate.com/schedule/',
  'tokyo_shibuya_aroma_chocolate_tokyo':     'https://www.aroma-chocolate.com/schedule/',

  // GRACE（2店舗）
  'tokyo_meguro_nakameguro_grace':           'https://grace-meguro.com/schedule',
  'tokyo_meguro_meguro_grace':               'https://grace-meguro.com/schedule',

  // doigt de fee（2店舗）
  'tokyo_meguro_jiyugaoka_doigt_de_fee':     'https://exe-fee.com/schedule/',
  'tokyo_ota_kamata_doigt_de_fee':           'https://exe-fee.com/schedule/',

  // EDEL AZABU（2店舗）
  'tokyo_minato_azabujuban_edel':            'https://edel-azabu.com/schedule/',
  'tokyo_minato_tamachi_edel':               'https://edel-azabu.com/schedule/',

  // ロンド（2店舗）
  'tokyo_chiyoda_kudanshita_rondo':          'https://ginza-kiwami.com/schedule.php',
  'tokyo_chuo_ginza_rondo':                  'https://ginza-kiwami.com/schedule.php',

  // Kobe Eslino（2店舗）
  '1189_1':                                  'https://eslino-kobe.com/schedule',
  '1189_2':                                  'https://eslino-kobe.com/schedule',

  // Weal（秋葉原）
  'tokyo_chiyoda_akihabara_weal':            'https://weal-esthe.com/schedule/',

  // Assouplir（秋葉原）
  'tokyo_chiyoda_akihabara_assouplir':       'https://assouplir.tokyo/schedule',

  // AROMA AMOUR（銀座）
  'tokyo_chuo_ginza_aroma_amour':            'https://www.akiba-amour.com/schedule/',

  // らんぷ（北千住）
  'tokyo_adachi_ushida_ranpu_kitasenju':     'https://www.senju-lamp.com/schedule.html',

  // むちすぱルーム（南浦和）
  'muchispa_minamiurawa':                    'https://muchispa-room.com/schedule.html',

  // SEACRET ROOM ひまわり
  '1076':                                    'https://sr-himawari.com/schedule/',

  // パターン検出で確認済み
  'osaka_umeda_orenoie':                     'http://ore-no-ie.com/schedule/',
  'osaka_umeda_majimespa':                   'https://majime-spa.com/schedule.html',  // ← 実際はmajime-spaのshop_idに要注意
  'tokyo_meguro_watashi_ouchi':              'https://ouchi-esute.com/schedule/',
  'kanagawa_kawasaki_rire':                  'https://rire-kawasaki.com/cast/',
  'tokyo_meguro_meguro_organic_spa':         'https://organicspa.jp/schedule/',   // 要確認
  'miyagi_sendai_pulunt':                    'https://pulunt.net/s/',
  'miyagi_sendai_platonic_spa':              'https://platonic-spa.com/s/',
  'fukuoka_kurume_mothers':                  'https://mothers-hakata.com/s/',
  'fukuoka_hakata_hakatahitozuma':           'https://hakatahitozuma.com/schedule/',
  'tokyo_dispatch_hananoame':               'https://hananoame.com/s/',
  'tokyo_meguro_meguro_otona_kakurega':      'https://otonakakurega.com/schedule/',
  'tokyo_nakano_golden':                     'https://golden0508.com/schedule/',
  'tokyo_toshima_ikebukuro_cachette':        'https://cachette-ikebukuro.com/schedule/',
  'tokyo_suginami_ogikubo_a-laise':          'https://a-laise-sk.com/schedule/',
  'osaka_shinsaibashi_skit':                 'http://www.aromade-skit.com/schedule/',
};

// ── 手動確認が必要なもの（わかっているものだけ）─────────────────────
// RERE GROUP は shop_id から店舗パスを推測
const RERE_MAP = {
  'tokyo_machida_rere':     'https://www.rere-group.com/machida/',
  'tokyo_hachioji_rere':    'https://www.rere-group.com/hachioji/',
};

// AROMA more は店舗ページが個別 → 一旦トップ
const AROMA_MORE_MAP = {
  'tokyo_chuo_ginza_aromamore':           'https://aromamore.tokyo/ginza/',
  'tokyo_minato_roppongi_aromamore':      'https://aromamore.tokyo/roppongi/',
  'tokyo_toshima_ikebukuro_aromamore':    'https://aromamore.tokyo/ikebukuro/',
  'tokyo_shinjuku_kabukicho_aromamore':   'https://aromamore.tokyo/kabukicho/',
};

const ALL_UPDATES = { ...CONFIRMED, ...RERE_MAP, ...AROMA_MORE_MAP };

// shop_idが正確かDBと照合
const { data: shops } = await supabase
  .from('shops')
  .select('id, name, schedule_url')
  .is('schedule_url', null);

const shopMap = Object.fromEntries((shops || []).map(s => [s.id, s]));

let hitCount = 0, missCount = 0;

console.log(`${isDryRun ? '[DRY RUN] ' : ''}schedule_url 一括設定\n`);

for (const [shopId, scheduleUrl] of Object.entries(ALL_UPDATES)) {
  const shop = shopMap[shopId];
  if (!shop) {
    console.log(`⚠️  ID不明またはすでに設定済み: ${shopId}`);
    missCount++;
    continue;
  }

  console.log(`${isDryRun ? '[DRY]' : '✅'} ${shop.name}`);
  console.log(`     → ${scheduleUrl}`);

  if (!isDryRun) {
    const { error } = await supabase
      .from('shops')
      .update({ schedule_url: scheduleUrl })
      .eq('id', shopId);
    if (error) console.error(`   ERROR: ${error.message}`);
  }
  hitCount++;
}

console.log(`\n合計: ${hitCount}件更新${isDryRun ? '(dry-run)' : ''}, ${missCount}件スキップ`);

// 残りの未設定
const remaining = (shops || []).filter(s => !ALL_UPDATES[s.id]);
if (remaining.length) {
  console.log(`\n── 今回対象外（手動確認が必要）: ${remaining.length}件 ──`);
  remaining.forEach(s => console.log(`  - ${s.id} | ${s.name}`));
}
