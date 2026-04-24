import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://aromacura0606.com';
const AREA_ID = 'tokyo_sumida_kinshicho'; // 正しい錦糸町エリア
const SHOP_ID = `${AREA_ID}_aroma_cura`; 
const GROUP_ID = 'g_aroma_cura'; 
const WRONG_SHOP_ID = 'saitama_saitama_omiya_aroma_cura'; // 誤って登録した大宮エリアのID

// ユーザーから提供されたHTMLデータ
const HTML_CONTENT = `
<div class="c-therapist-cards js-scrl-fade-up is-enabled">
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/564376/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="田中ももこ" alt="田中ももこ" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/8sh5y_20260405033710.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">田中ももこ</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/797637/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="星宮よぞら" alt="星宮よぞら" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/hb4tr_20260211140651.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">星宮よぞら</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/746491/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="影山れい" alt="影山れい" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_ccv51_20251010220911.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>24:00 ～ 29:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">影山れい</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/728444/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="森川みお" alt="森川みお" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_6ztr4_20250909001643.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>12:00 ～ 19:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">森川みお</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/844918/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="岡田みれい" alt="岡田みれい" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/45zjm_20260323221100.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">岡田みれい</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/846116/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="金子みみ" alt="金子みみ" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/bjgxy_20260327022520.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">金子みみ</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/864611/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="国見りの" alt="国見りの" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/6hwhh_20260420132457.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>24:00 ～ 29:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">国見りの</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/492995/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="猫橋 なお" alt="猫橋 なお" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/137cd_20250911162711.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>13:00 ～ 20:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">猫橋 なお</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/432488/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="山川 うみ" alt="山川 うみ" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_3e5hf_20251007181759.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>15:00 ～ 23:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">山川 うみ</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/735917/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="桜井りん" alt="桜井りん" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/2mrbn_20251020200259.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>12:00 ～ 19:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">桜井りん</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/455576/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="七星あいり" alt="七星あいり" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/bm81a_20251008160722.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>15:00 ～ 23:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">七星あいり</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/779064/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="妃ゆきな" alt="妃ゆきな" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_6u750_20251222183847.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">妃ゆきな</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/830746/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="日向みあ" alt="日向みあ" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/7js8a_20260301125203.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>20:00 ～ 29:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">日向みあ</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/822691/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="渡辺らら" alt="渡辺らら" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/cropped_img_c5qd6_20260215062556.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>20:00 ～ 29:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">渡辺らら</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/493160/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="花咲ちむ" alt="花咲ちむ" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/8p9qk_20250911154642.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">花咲ちむ</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/704924/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="白咲ゆめか" alt="白咲ゆめか" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/58g0e_20250911155836.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">白咲ゆめか</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/730469/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="立花 すみか" alt="立花 すみか" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_43cky_20250922020032.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">立花 すみか</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/717587/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="石神 さくら" alt="石神 さくら" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/9khae_20251002164448.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">石神 さくら</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/848674/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="三神さら" alt="三神さら" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/8i2v2_20260328162437.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">三神さら</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/497413/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="花星 さな" alt="花星 さな" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_c0s89_20251101094756.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">花星 さな</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/864783/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="小林ひな" alt="小林ひな" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/a13mw_20260420185514.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>10:00 ～ 14:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">小林ひな</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/855131/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="小野寺はな" alt="小野寺はな" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/81c8z_20260406221405.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">小野寺はな</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/854030/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="山本こはく" alt="山本こはく" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/5tt0u_20260405111220.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">山本こはく</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/831742/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="神崎しの" alt="神崎しの" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/f5epu_20260302225644.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">神崎しの</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/826126/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="相澤もあ" alt="相澤もあ" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/cropped_img_6b5j7_20260221170713.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">相澤もあ</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/823878/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="白川つる" alt="白川つる" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/cropped_img_7kay4_20260219214555.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">白川つる</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/806223/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="渋谷きょうか" alt="渋谷きょうか" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_dsxiw_20260121221248.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name"><span class="c-therapist-cards__new">NEW</span>渋谷きょうか</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/799879/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="一ノ瀬ことみ" alt="一ノ瀬ことみ" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_bjpfp_20260111175936.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">一ノ瀬ことみ</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/758177/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="琥珀かれん" alt="琥珀かれん" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_aow30_20251211221648.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">琥珀かれん</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/741093/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="桔梗とうか" alt="桔梗とうか" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_edu0z_20251001210720.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">桔梗とうか</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/709863/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="天野るな" alt="天野るな" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/2jp89_20250806031514.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">天野るな</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/708281/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="白石ほのか" alt="白石ほのか" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/88p5n_20250803201622.jpg?f=webp"></figure><span class="c-therapist-cards__details"><span class="c-therapist-cards__worktime"><i class="far fa-clock extra-bold"></i>22:30 ～ 27:00</span></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">白石ほのか</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/663934/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="井上 はるか" alt="井上 はるか" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/img_9qxav_20250923112900.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">井上 はるか</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/607879/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="加藤 ひかり" alt="加藤 ひかり" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/dz1by_20250305161122.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">加藤 ひかり</span></a></div>
<div class="c-therapist-cards__item"><a class="c-therapist-cards__link" href="/therapist/394922/"><span class="c-therapist-cards__attend">-</span><div class="c-therapist-cards__img-wrap"><figure class="c-therapist-cards__img"><img title="月乃ありさ" alt="月乃ありさ" src="https://img.estama.jp/shop_data/00000032316/cast/main/357x556/d3csb_20240115190412.jpg?f=webp"></figure><span class="c-therapist-cards__details"></span><i class="shape-diamond__right-triangle"></i></div><span class="c-therapist-cards__name">月乃ありさ</span></a></div>
</div>
`;

async function main() {
  console.log('🚀 「Aroma Cura」の錦糸町エリアへの再登録を開始します...\n');

  try {
    // 1. 大宮エリアのデータを削除
    console.log(`🗑️ 誤って登録した大宮エリアのデータを削除中...`);
    await supabase.from('therapists').delete().eq('shop_id', WRONG_SHOP_ID);
    await supabase.from('shops').delete().eq('id', WRONG_SHOP_ID);
    console.log(`✅ 大宮エリアのデータ削除完了\n`);

    // 2. 錦糸町エリアとして店舗登録
    console.log('🏪 錦糸町エリアとして店舗データを登録中...');
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'Aroma Cura (アロマクラ)',
      area_id: AREA_ID, // tokyo_sumida_kinshicho
      group_id: GROUP_ID, 
      schedule_url: 'https://aromacura0606.com/schedule/',
      website_url: 'https://aromacura0606.com/',
      business_hours: '営業時間要確認', 
      price_system: '60分 16,000円～',
      image_url: 'https://placehold.jp/2ecc71/ffffff/400x300.png?text=Aroma+Cura',
      raw_data: {
        prefecture: '東京都',
        city: '墨田区',
        area: '錦糸町',
        address: '東京都墨田区錦糸町エリア',
        system: [
          {
            courseName: '基本コース',
            description: '画像から読み取った料金です',
            prices: [
              { time: '60min', price: '16,000円' },
              { time: '75min', price: '17,000円' },
              { time: '90min', price: '19,000円' },
              { time: '120min', price: '24,000円' },
              { time: '150min', price: '29,000円' },
              { time: '180min', price: '35,000円' }
            ]
          }
        ]
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報（ID: ${SHOP_ID}）を登録しました。\n`);

    // 3. セラピストの抽出と登録
    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.c-therapist-cards__item');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      let rawName = item.find('.c-therapist-cards__name').text().trim();
      if (!rawName) return;

      const isNew = rawName.includes('NEW') || item.find('.c-therapist-cards__new').length > 0;
      let cleanName = rawName.replace(/NEW/g, '').replace(/\s+/g, ' ').trim();
      
      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      const imageUrl = item.find('img').attr('src') || '';
      const workTime = item.find('.c-therapist-cards__worktime').text().trim();
      let fullBio = '';
      if (workTime) {
          fullBio = `本日の出勤: ${workTime}`;
      }

      const tags = [];
      if(isNew) tags.push('新人');

      newTherapists.push({
        id: `${SHOP_ID}_${finalNameId}`,
        shop_id: SHOP_ID,
        name: cleanName, 
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: tags,
          bio: fullBio,
          original_name: rawName
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。`);

    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「Aroma Cura」が錦糸町エリアにフル登録されました。`);
    console.log('ブラウザの「錦糸町」でスーパーリロードしてご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
