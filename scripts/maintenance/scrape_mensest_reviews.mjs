/**
 * mens-est.jp からクチコミをスクレイピングしてSupabaseに投入
 * 実行: node scripts/maintenance/scrape_mensest_reviews.mjs [--dry-run]
 *
 * 事前準備:
 *   1. node scripts/debug/find_mensest_shop_slugs.mjs を実行
 *   2. 出力された TARGETS 配列をこのファイルの TARGETS に貼り付け
 *   3. node scripts/maintenance/scrape_mensest_reviews.mjs --dry-run で確認
 *   4. 本実行: node scripts/maintenance/scrape_mensest_reviews.mjs
 *   5. 書き直し: node scripts/maintenance/auto_rewrite_reviews.mjs
 *
 * HTML構造（mens-est.jp）:
 *   - 口コミ1件: li.cmt__item#review-id{N}
 *   - 評価: .usersReview-rating（1〜5、0.5刻み）
 *   - タイトル: h4.font-arial
 *   - 本文: .cmt__item--content-text
 *   - セラピスト名: a[href*="/girl/"] のテキスト1行目
 *   - 日付: .date-review（例: "2026/05/20(初めて利用)"）
 *   - ページネーション: /review/page2/, /review/page3/, ...
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
// ★ find_mensest_shop_slugs.mjs の出力をここに貼り付け
// ============================================================
const TARGETS = [
  { shopSlug: "20220711125643198157", shopIds: ["tokyo_shibuya_naomispa"], shopName: "NAOMI SPA (ナオミスパ)" },
  { shopSlug: "grand000", shopIds: ["tokyo_shibuya_yoyogi_harajuku_grand_gaia"], shopName: "グランドガイア (Grand Gaia)" },
  { shopSlug: "bellelily", shopIds: ["tokyo_shibuya_bellelily"], shopName: "Belle Lily (ベルリリィ)" },
  { shopSlug: "20201001131519", shopIds: ["tokyo_shibuya_sugar_spa"], shopName: "Sugar Spa (シュガースパ)" },
  { shopSlug: "20220711121016085095", shopIds: ["tokyo_shibuya_anaichi"], shopName: "ANAICHI (アナイチ)" },
  { shopSlug: "20210407143015296207", shopIds: ["tokyo_shibuya_shibuya_a5spa"], shopName: "A5 SPA (エーゴスパ)" },
  { shopSlug: "2020100113477", shopIds: ["tokyo_shinjuku_shinjuku_sanchome_aroma_tiamo"], shopName: "AROMA TIAMO (アロマティアーモ) 新宿三丁目店" },
  { shopSlug: "20250226132909738049", shopIds: ["tokyo_tachikawa_tachikawa_gladol-spa"], shopName: "ぐらどるスパ" },
  { shopSlug: "2020100113183", shopIds: ["tokyo_shibuya_omotesando_high_grande"], shopName: "HIGH GRANDE (ハイグランデ)" },
  { shopSlug: "antichi1", shopIds: ["tokyo_shibuya_anaichi"], shopName: "ANAICHI (アナイチ)" },
  { shopSlug: "jd0485", shopIds: ["tokyo_setagaya_shimokitazawa_jd_spa"], shopName: "JDスパ (女子大生エステ) 下北沢" },
  { shopSlug: "winning", shopIds: ["tokyo_setagaya_soshigaya_okura_winning_heaven"], shopName: "WINNING HEAVEN (ウイニングヘブン)" },
  { shopSlug: "20250311125906710421", shopIds: ["tokyo_setagaya_shimokitazawa_eren"], shopName: "EREN (エレン)" },
  { shopSlug: "20250226132521264583", shopIds: ["tokyo_tachikawa_tachikawa_gladol-spa"], shopName: "ぐらどるスパ" },
  { shopSlug: "20250116184255856894", shopIds: ["tokyo_dispatch_because"], shopName: "ビコーズ (旧リオン)" },
  { shopSlug: "20241204193025944283", shopIds: ["tokyo_setagaya_sakurashinmachi_tokyo_esthe_club"], shopName: "東京えすてクラブ" },
  { shopSlug: "20241204192541239430", shopIds: ["tokyo_setagaya_sangenjaya_authority"], shopName: "AUTHORITY (オーソリティ)" },
  { shopSlug: "20241204170844323256", shopIds: ["tokyo_shibuya_silk"], shopName: "Silk (シルク)" },
  { shopSlug: "20240816175050800215", shopIds: ["tokyo_setagaya_meidaimae_aroma_woo"], shopName: "Aroma Woo (アロマウー)" },
  { shopSlug: "20201001131654", shopIds: ["tokyo_setagaya_chitose_karasuyama_reve_spa"], shopName: "REVE SPA (レーヴスパ)" },
  { shopSlug: "2020100113702", shopIds: ["tokyo_shibuya_urasanes"], shopName: "UraSanEsu (ウラサネス)" },
  { shopSlug: "2020100113502", shopIds: ["tokyo_setagaya_sangenjaya_sanchabijin"], shopName: "三茶美人" },
  { shopSlug: "20201001132425", shopIds: ["tokyo_setagaya_meidaimae_annex"], shopName: "明大前ANNEX (アネックス)" },
  { shopSlug: "spareal3", shopIds: ["tokyo_shibuya_spareal"], shopName: "SPA Real (スパレアル)" },
  { shopSlug: "nomsp", shopIds: ["tokyo_shibuya_naomispa"], shopName: "NAOMI SPA (ナオミスパ)" },
  { shopSlug: "2020100113309", shopIds: ["tokyo_meguro_meguro_otona_kakurega"], shopName: "大人の隠れ家" },
  { shopSlug: "ebisu55", shopIds: ["tokyo_shibuya_ebisu_mens_este_ebisu"], shopName: "メンズエステ恵比寿" },
  { shopSlug: "20220712130203900010", shopIds: ["tokyo_shibuya_naomispa"], shopName: "NAOMI SPA (ナオミスパ)" },
  { shopSlug: "20201001131508", shopIds: ["tokyo_shinjuku_higashishinjuku_sweet_mist"], shopName: "Sweet Mist (スイートミスト) 東新宿店" },
  { shopSlug: "20201001131855", shopIds: ["tokyo_shibuya_granmatom"], shopName: "GRANMATOM (グランマトム)" },
  { shopSlug: "20250219145421372441", shopIds: ["tokyo_shibuya_ebisu_saudade"], shopName: "サウダージ (旧リセット)" },
  { shopSlug: "20250217133800382311", shopIds: ["tokyo_shinagawa_gotanda_aromalys"], shopName: "AromaLys (アロマリース)" },
  { shopSlug: "2020100113313", shopIds: ["tokyo_shibuya_ebisu_otonaspa"], shopName: "大人のやすらぎSPA (恵比寿店)" },
  { shopSlug: "20201001132400", shopIds: ["tokyo_shibuya_aroma_blanca"], shopName: "Aroma Blanca (アロマブランカ)" },
  { shopSlug: "20201001131792", shopIds: ["tokyo_shinjuku_natural_shinjukugyoen"], shopName: "NATURAL (新宿御苑店)" },
  { shopSlug: "2020100113769", shopIds: ["tokyo_meguro_linda_spa"], shopName: "LINDA SPA (中目黒店)" },
  { shopSlug: "ar0mam1ely", shopIds: ["tokyo_shibuya_aroma_miely"], shopName: "Aroma Miely (アロマミエリー)" },
  { shopSlug: "spareal2", shopIds: ["tokyo_shibuya_spareal"], shopName: "SPA Real (スパレアル)" },
  { shopSlug: "20201001132399", shopIds: ["tokyo_arakawa_nippori_aroma_blossom"], shopName: "Aroma Blossom (日暮里店)" },
  { shopSlug: "20201001132042", shopIds: ["tokyo_meguro_meguro_grace"], shopName: "GRACE (グレイス)" },
  { shopSlug: "20201001132286", shopIds: ["tokyo_meguro_nakameguro_bqins"], shopName: "B-QINS (ビークインズ) 中目黒" },
  { shopSlug: "20201001132401", shopIds: ["tokyo_shibuya_aroma_blanca"], shopName: "Aroma Blanca (アロマブランカ)" },
  { shopSlug: "20201001132419", shopIds: ["tokyo_shibuya_ebisu_aqua"], shopName: "AQUA (アクア)" },
  { shopSlug: "20241213154252115602", shopIds: ["tokyo_meguro_nakameguro_tenkai_no_spa"], shopName: "天界のスパ 中目黒" },
  { shopSlug: "2020100113771", shopIds: ["tokyo_meguro_linda_spa"], shopName: "LINDA SPA (中目黒店)" },
  { shopSlug: "20201001131280", shopIds: ["tokyo_meguro_meguro_everything"], shopName: "Everything" },
  { shopSlug: "20201001131283", shopIds: ["tokyo_shinjuku_takadanobaba_evergreen"], shopName: "everGreen" },
  { shopSlug: "20201001132284", shopIds: ["tokyo_meguro_nakameguro_bqins"], shopName: "B-QINS (ビークインズ) 中目黒" },
  { shopSlug: "jdspa0485", shopIds: ["tokyo_setagaya_shimokitazawa_jd_spa"], shopName: "JDスパ (女子大生エステ) 下北沢" },
  { shopSlug: "20250219145235843963", shopIds: ["tokyo_shibuya_ebisu_saudade"], shopName: "サウダージ (旧リセット)" },
  { shopSlug: "20241204194115215331", shopIds: ["tokyo_shinjuku_shinjuku_sanchome_queens_collection"], shopName: "QUEEN'S COLLECTION 新宿三丁目ルーム" },
  { shopSlug: "20201001132016", shopIds: ["tokyo_shibuya_hatagaya_hataesu"], shopName: "HaTaEsu (ハタエス)" },
  { shopSlug: "lereveikbkr", shopIds: ["tokyo_toshima_ikebukuro_le_reve_ck"], shopName: "ルレーヴ (Le Reve CK)" },
  { shopSlug: "fairyland", shopIds: ["tokyo_toshima_tokyo_fairy_land"], shopName: "Tokyo Fairy Land (東京フェアリーランド)" },
  { shopSlug: "menes7432", shopIds: ["tokyo_toshima_ikebukuro_tokyo_mensesthe"], shopName: "東京メンズエステ 池袋ルーム" },
  { shopSlug: "ikbkraromaresort", shopIds: ["tokyo_toshima_ikebukuro_aroma_resort"], shopName: "アロマリゾート (旧昭和倶楽部)" },
  { shopSlug: "2020100113479", shopIds: ["tokyo_shinjuku_shinjuku_sanchome_aroma_tiamo"], shopName: "AROMA TIAMO (アロマティアーモ) 新宿三丁目店" },
  { shopSlug: "20201001131265", shopIds: ["tokyo_toshima_ikebukuro_otonazyoshi"], shopName: "おとな女子" },
  { shopSlug: "20241205194734818836", shopIds: ["tokyo_toshima_ikebukuro_rex"], shopName: "Rex (レックス池袋店)" },
  { shopSlug: "20201001132444", shopIds: ["tokyo_toshima_ikebukuro_anemone"], shopName: "Anemone (アネモネ)" },
  { shopSlug: "2020100113299", shopIds: ["tokyo_shinjuku_kabukicho_fiorespa"], shopName: "FioreSpa (フィオーレスパ)" },
  { shopSlug: "20201001131791", shopIds: ["tokyo_shinjuku_natural_shinjukugyoen"], shopName: "NATURAL (新宿御苑店)" },
  { shopSlug: "lerevejj", shopIds: ["tokyo_toshima_ikebukuro_le_reve_ck"], shopName: "ルレーヴ (Le Reve CK)" },
  { shopSlug: "cozyakb", shopIds: ["tokyo_shinjuku_takadanobaba_cozy"], shopName: "Cozy（コーズィー）" },
  { shopSlug: "esthealice", shopIds: ["tokyo_kita_alice"], shopName: "Alice (アリス) 赤羽" },
  { shopSlug: "akabaneluxury", shopIds: ["tokyo_taito_ueno_ueno_luxury"], shopName: "ラグジュアリーグループ" },
  { shopSlug: "2020100113797", shopIds: ["tokyo_kita_lamp_akabane"], shopName: "らんぷ 赤羽店" },
  { shopSlug: "LeReve", shopIds: ["tokyo_toshima_ikebukuro_le_reve_ck"], shopName: "ルレーヴ (Le Reve CK)" },
  { shopSlug: "2020100113308", shopIds: ["tokyo_toshima_otsuka_amaryllis"], shopName: "アマリリス" },
  { shopSlug: "lerevenpr", shopIds: ["tokyo_toshima_ikebukuro_le_reve_ck"], shopName: "ルレーヴ (Le Reve CK)" },
  { shopSlug: "aro40nerima", shopIds: ["tokyo_nerima_nerima_around_forty"], shopName: "Araundoforty アラウンドフォーティー" },
  { shopSlug: "canneletky", shopIds: ["tokyo_nerima_nerima_cannele"], shopName: "Cannele (カヌレ)" },
  { shopSlug: "20201001131620", shopIds: ["tokyo_toshima_ikebukuro_salon_blanca"], shopName: "SALON BLANCA (サロンブランカ) 池袋店" },
  { shopSlug: "20201001132406", shopIds: ["tokyo_chuo_ginza_aroma_amour"], shopName: "AROMA AMOUR (銀座店)" },
  { shopSlug: "20201001132259", shopIds: ["tokyo_chuo_nihonbashi_berryz_spa"], shopName: "Berryz Spa (ベリーズスパ)" },
  { shopSlug: "2020100113227", shopIds: ["tokyo_chuo_nihonbashi_urekaji_nihonbashi"], shopName: "熟れた果実" },
  { shopSlug: "uenoluxury", shopIds: ["tokyo_taito_ueno_ueno_luxury"], shopName: "ラグジュアリーグループ" },
  { shopSlug: "2020100113441", shopIds: ["tokyo_taito_ueno_iyashi_annex"], shopName: "癒しの空間 Annex" },
  { shopSlug: "20201001131448", shopIds: ["tokyo_taito_ueno_ultimate_spa_ueno"], shopName: "ULTIMATE SPA (アルティメットスパ) 上野" },
  { shopSlug: "20241217132005363107", shopIds: ["tokyo_taito_ueno_tokyo_luxury"], shopName: "東京ラグジュアリー（旧ビジョスパ）" },
  { shopSlug: "hiran", shopIds: ["tokyo_chiyoda_akihabara_hiran_next"], shopName: "Hiran Next (平安NEXT)" },
  { shopSlug: "20201001132407", shopIds: ["tokyo_chuo_ginza_aroma_amour"], shopName: "AROMA AMOUR (銀座店)" },
  { shopSlug: "20250317194950436050", shopIds: ["tokyo_sumida_kinshicho_limited_spa"], shopName: "Limited Spa (リミテッドスパ)" },
  { shopSlug: "20250217143747829997", shopIds: ["tokyo_sumida_kinshicho_wife_collection"], shopName: "ワイフコレクション" },
  { shopSlug: "2020100113315", shopIds: ["tokyo_sumida_ryogoku_otonaspa_kutsurogi"], shopName: "大人スパ くつろぎ 両国" },
  { shopSlug: "2020100113792", shopIds: ["tokyo_adachi_ushida_ranpu_kitasenju"], shopName: "らんぷ 北千住" },
  { shopSlug: "20201001131339", shopIds: ["tokyo_adachi_takenotsuka_aroma_banker"], shopName: "Aroma BANKER (アロマバンカー)" },
  { shopSlug: "20250117144541736084", shopIds: ["tokyo_adachi_kitasenju_macherie"], shopName: "マシェリ" },
  { shopSlug: "thearoma", shopIds: ["tokyo_dispatch_the_aroma"], shopName: "ザ アロマ (The Aroma)" },
  { shopSlug: "20220712143803597370", shopIds: ["tokyo_shibuya_anaichi"], shopName: "ANAICHI (アナイチ)" },
  { shopSlug: "2020100113595", shopIds: ["tokyo_minato_tamachi_alba"], shopName: "アルバTOKYO (田町店)" },
  { shopSlug: "20201001132058", shopIds: ["tokyo_chuo_ginza_ginza_rich"], shopName: "Ginza Rich (銀座リッチ)" },
  { shopSlug: "20201001131503", shopIds: ["tokyo_shinjuku_higashishinjuku_sweet_mist"], shopName: "Sweet Mist (スイートミスト) 東新宿店" },
  { shopSlug: "20201001131332", shopIds: ["tokyo_chiyoda_akihabara_aroma_maison"], shopName: "Aroma Maison (アロマメゾン 秋葉原店)" },
  { shopSlug: "2020100113312", shopIds: ["tokyo_shibuya_ebisu_otonaspa"], shopName: "大人のやすらぎSPA (恵比寿店)" },
  { shopSlug: "angeaile", shopIds: ["tokyo_ota_kamata_angeaile"], shopName: "Anjuaile (アンジュエール)" },
  { shopSlug: "nocturnespa", shopIds: ["tokyo_ota_omori_nocturne"], shopName: "ノクターンスパ (Nocturne Spa)" },
  { shopSlug: "20201001131652", shopIds: ["tokyo_shinagawa_shinagawa_rhea"], shopName: "RHEA SPA (レアスパ)" },
  { shopSlug: "20201001131738", shopIds: ["tokyo_machida_machida_pepe_spa"], shopName: "Pepe Spa (ペペスパ) 町田" },
  { shopSlug: "20241210183827450043", shopIds: ["tokyo_ota_kamata_livspa"], shopName: "LIVSPA～リブスパ～ 蒲田" },
  { shopSlug: "20201001132418", shopIds: ["tokyo_shibuya_ebisu_aqua"], shopName: "AQUA (アクア)" },
  { shopSlug: "20220819141157129919", shopIds: ["tokyo_arakawa_nippori_aroma_blossom"], shopName: "Aroma Blossom (日暮里店)" },
  { shopSlug: "20210407122829027878", shopIds: ["tokyo_shinagawa_shinagawa_aria"], shopName: "ARIA (アリア)" },
  { shopSlug: "2020100113444", shopIds: ["tokyo_shinagawa_oimachi_showa_refresh"], shopName: "昭和リフレッシュ館" },
  { shopSlug: "2020100113470", shopIds: ["tokyo_dispatch_jukujo_tokyo"], shopName: "熟女東京" },
  { shopSlug: "2020100113692", shopIds: ["tokyo_dispatch_hananoame"], shopName: "花の雨リラクゼーション" },
  { shopSlug: "Loveitazabu", shopIds: ["tokyo_shibuya_love_it"], shopName: "Love it (ラヴィット)" },
  { shopSlug: "20201001131482", shopIds: ["tokyo_minato_azabujuban_the_esthe"], shopName: "THE ESTHE AZABU (ザ・エステアザブ)" },
  { shopSlug: "20250219145004560135", shopIds: ["tokyo_shibuya_ebisu_saudade"], shopName: "サウダージ (旧リセット)" },
  { shopSlug: "20250210150028430071", shopIds: ["tokyo_shinjuku_higashishinjuku_dejavu_tokyo"], shopName: "Dejavu TOKYO (デジャヴ東京) 東新宿店" },
  { shopSlug: "20250210123929177965", shopIds: ["tokyo_minato_azabujuban_the_premium_spa"], shopName: "THE PREMIUM SPA (ザ・プレミアムスパ)" },
  { shopSlug: "20250210123608244688", shopIds: ["tokyo_shibuya_ebisu_carinna"], shopName: "Carinna (カリナ)" },
  { shopSlug: "2020100113770", shopIds: ["tokyo_meguro_linda_spa"], shopName: "LINDA SPA (中目黒店)" },
  { shopSlug: "20201001131505", shopIds: ["tokyo_shinjuku_higashishinjuku_sweet_mist"], shopName: "Sweet Mist (スイートミスト) 東新宿店" },
  { shopSlug: "20201001131789", shopIds: ["tokyo_shinjuku_natural_shinjukugyoen"], shopName: "NATURAL (新宿御苑店)" },
  { shopSlug: "20201001131449", shopIds: ["tokyo_taito_ueno_ultimate_spa_ueno"], shopName: "ULTIMATE SPA (アルティメットスパ) 上野" },
  { shopSlug: "20201001131504", shopIds: ["tokyo_shinjuku_higashishinjuku_sweet_mist"], shopName: "Sweet Mist (スイートミスト) 東新宿店" },
  { shopSlug: "20201001132060", shopIds: ["tokyo_chuo_ginza_ginza_rich"], shopName: "Ginza Rich (銀座リッチ)" },
  { shopSlug: "meguroes", shopIds: ["tokyo_shinagawa_esthe_spa"], shopName: "Esthe Spa (エステスパ)" },
  { shopSlug: "20201228165916207377", shopIds: ["tokyo_shinagawa_gotanda_aroma_abc"], shopName: "Aroma ABC (アロマABC)" },
  { shopSlug: "20201001131664", shopIds: ["tokyo_minato_shinbashi_relax_tokyo"], shopName: "RELAX (リラックス)" },
  { shopSlug: "2020100113548", shopIds: ["tokyo_shinagawa_oimachi_dahlia"], shopName: "DAHLIA (ダリア)" },
  { shopSlug: "yshina00", shopIds: ["tokyo_shinagawa_gotanda_yuru_spa"], shopName: "ゆるスパ 五反田店" },
  { shopSlug: "20250217122120176739", shopIds: ["tokyo_shinagawa_shinagawa_esthe_king"], shopName: "エステの王様" },
  { shopSlug: "20201001131126", shopIds: ["tokyo_minato_shinbashi_tiger_gate"], shopName: "TIGER GATE (タイガーゲート)" },
  { shopSlug: "20201001132059", shopIds: ["tokyo_chuo_ginza_ginza_rich"], shopName: "Ginza Rich (銀座リッチ)" },
  { shopSlug: "20250226134101098526", shopIds: ["tokyo_tachikawa_tachikawa_gladol-spa"], shopName: "ぐらどるスパ" },
  { shopSlug: "2020100113866", shopIds: ["tokyo_hachioji_rere"], shopName: "RERE GROUP (リリグループ)" },
  { shopSlug: "disini1", shopIds: ["tokyo_tachikawa_disini"], shopName: "Disini (ディシニ)" },
  { shopSlug: "20250226132710677370", shopIds: ["tokyo_tachikawa_tachikawa_gladol-spa"], shopName: "ぐらどるスパ" },
  { shopSlug: "20250117161433275527", shopIds: ["tokyo_chuo_nihonbashi_urekaji_nihonbashi"], shopName: "熟れた果実" },
  { shopSlug: "20250117160719570678", shopIds: ["tokyo_tachikawa_morganite"], shopName: "MORGANITE (モルガナイト)" },
  { shopSlug: "2020100113833", shopIds: ["tokyo_fuchu_luxury_romance"], shopName: "Luxury Romance GROUP (ラグジュアリーロマンスグループ)" },
  { shopSlug: "20201001131083", shopIds: ["tokyo_tama_seisekisakuragaoka_trendy_spa"], shopName: "TRENDY SPA (聖蹟桜ヶ丘店)" },
  { shopSlug: "reremachi", shopIds: ["tokyo_hachioji_rere"], shopName: "RERE GROUP (リリグループ)" },
  { shopSlug: "20250226132306063928", shopIds: ["tokyo_tachikawa_tachikawa_gladol-spa"], shopName: "ぐらどるスパ" },
  { shopSlug: "20201001132299", shopIds: ["tokyo_hachioji_rere"], shopName: "RERE GROUP (リリグループ)" },
  { shopSlug: "2020100113832", shopIds: ["tokyo_fuchu_luxury_romance"], shopName: "Luxury Romance GROUP (ラグジュアリーロマンスグループ)" },
  { shopSlug: "aromaella1", shopIds: ["tokyo_chofu_aroma_ella"], shopName: "Aroma ELLA (アロマエラ 調布店)" },
  { shopSlug: "20250226133137704574", shopIds: ["tokyo_tachikawa_tachikawa_gladol-spa"], shopName: "ぐらどるスパ" },
  { shopSlug: "20241209165924486556", shopIds: ["tokyo_kokubunji_esthe_bijin_madam"], shopName: "エステ美人マダム 三鷹店" },
  { shopSlug: "20241209163824276314", shopIds: ["tokyo_kita_akabane_yorimichi"], shopName: "よりみち (Yorimichi) 赤羽" },
  { shopSlug: "20250226133938091639", shopIds: ["tokyo_tachikawa_tachikawa_gladol-spa"], shopName: "ぐらどるスパ" },
];

const DELAY_MS = 1500;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const fetchHtml = async (url) => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en;q=0.9',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
};

function parseReviewPage(html, shopSlug) {
  const $ = cheerio.load(html);
  const reviews = [];

  $('li.cmt__item').each((_, el) => {
    // reviewId（重複排除キー）
    const idAttr = $(el).attr('id') || '';
    const reviewId = idAttr.replace('review-id', '').trim();
    if (!reviewId) return;

    // 評価（1〜5、0.5刻み）
    const ratingText = $(el).find('.usersReview-rating').first().text().trim();
    const rating = ratingText ? parseFloat(ratingText) : null;
    if (!rating) return;

    // タイトルと本文
    const title = $(el).find('h4.font-arial').first().text().trim();
    const bodyHtml = $(el).find('.cmt__item--content-text').html() || '';
    const body = $(el).find('.cmt__item--content-text').text()
      .replace(/\s*\n\s*/g, '\n').trim();
    const content = (title ? `${title}\n\n${body}` : body).trim();
    if (!content || content.length < 20) return;

    // セラピスト名（リンクテキストの1行目）
    const therapistLink = $(el).find('a[href*="/girl/"]').first();
    const therapistRaw = therapistLink.text().trim();
    const therapistName = therapistRaw.split('\n')[0].trim().replace(/\s+/g, ' ');
    if (!therapistName) return;

    // 日付（"2026/05/20(初めて利用)" → "2026-05-20"）
    const dateRaw = $(el).find('.date-review').first().text().trim();
    const dm = dateRaw.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    const createdAt = dm ? `${dm[1]}-${dm[2]}-${dm[3]}T00:00:00+09:00` : null;

    reviews.push({ reviewId, rating, content, therapistName, createdAt });
  });

  // 次ページ存在判定: ページネーションに /page{n+1}/ リンクがあるか
  const hasNext = $('a[href*="/review/page"]').length > 0 && reviews.length > 0;

  return { reviews, hasNext };
}

// ============================================================
// メイン処理
// ============================================================
let totalInserted = 0;

for (const target of TARGETS) {
  const { shopSlug, shopIds, shopName } = target;
  console.log(`\n【${shopName}】(slug=${shopSlug}, ${shopIds.length}店舗)`);

  // 全ページを取得
  const allReviews = [];
  let page = 1;
  while (true) {
    const url = page === 1
      ? `https://mens-est.jp/shop/${shopSlug}/review/`
      : `https://mens-est.jp/shop/${shopSlug}/review/page${page}/`;

    try {
      console.log(`  page${page} 取得中...`);
      const html = await fetchHtml(url);
      const { reviews, hasNext } = parseReviewPage(html, shopSlug);
      console.log(`  → ${reviews.length}件`);
      allReviews.push(...reviews);

      if (!hasNext || reviews.length === 0) break;
      page++;
      await sleep(DELAY_MS);
    } catch (e) {
      console.error(`  ❌ page${page} エラー:`, e.message);
      break;
    }
  }

  console.log(`  合計 ${allReviews.length}件`);
  if (allReviews.length === 0) continue;

  if (isDryRun) {
    console.log('[DRY RUN] サンプル（最初の2件）:');
    allReviews.slice(0, 2).forEach(r => console.log(JSON.stringify(r, null, 2)));
    continue;
  }

  // 各shopIdに挿入（グループ店舗対応: 同じ口コミを全店舗に入れる）
  for (const shopId of shopIds) {
    const toInsert = allReviews.map(r => ({
      id: `mensest_${shopSlug}_${r.reviewId}`,
      shop_id: shopId,
      therapist_name: r.therapistName,
      therapist_id: `mensest_${shopSlug}_${r.therapistName.replace(/\s+/g, '_')}`,
      content: r.content,
      rating: r.rating,
      user_id: 'menesthe_import', // auto_rewrite_reviews.mjs で書き直し対象になるよう共通user_idを使用
      user_name: 'mensest_user',
      created_at: r.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('reviews').upsert(toInsert, {
      onConflict: 'id',
      ignoreDuplicates: true,
    });
    if (error) {
      console.error(`  ❌ ${shopId}:`, error.message);
    } else {
      totalInserted += toInsert.length;
      console.log(`  ✅ ${shopId}: ${toInsert.length}件挿入 (累計${totalInserted}件)`);
    }
  }

  await sleep(DELAY_MS);
}

console.log(`\n完了: ${totalInserted}件挿入`);
if (!isDryRun && totalInserted > 0) {
  console.log('\n次のステップ:');
  console.log('  node scripts/maintenance/auto_rewrite_reviews.mjs --dry-run');
  console.log('  node scripts/maintenance/auto_rewrite_reviews.mjs');
}
