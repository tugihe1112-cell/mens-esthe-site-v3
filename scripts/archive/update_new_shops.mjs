import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  // 3店舗分のデータをまとめた配列
  const shopsData = [
    {
      searchKeywords: ['aroma glamour', 'アロマグラマー'],
      website_url: "https://aromaglamor.com/",
      schedule_url: "https://aromaglamor.com/schedule/",
      price_system: "【グラマーHEAVENコミコミコース】\n20,000円",
      casts: [
        { name: "あみ", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/cropped_img_62dqi_20260208170959.jpg?f=webp" },
        { name: "つむ", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/1ty28_20260314145033.jpg?f=webp" },
        { name: "ほの", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/cropped_img_njegf_20260208171315.jpg?f=webp" },
        { name: "れいか", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/cropped_img_1vq4c_20260208171156.jpg?f=webp" },
        { name: "なな", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/cropped_img_brtg2_20260208171026.jpg?f=webp" },
        { name: "うるり", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/2wiel_20260406033039.jpg?f=webp" },
        { name: "れな", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/cropped_img_ejxhr_20260208173211.jpg?f=webp" },
        { name: "すず", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/c400j_20260326021100.jpg?f=webp" },
        { name: "てん", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/f0xdx_20260315164302.jpg?f=webp" },
        { name: "あいる", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/cropped_img_24yvv_20260208171255.jpg?f=webp" },
        { name: "ちこ", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/cropped_img_3p3r6_20260208171341.jpg?f=webp" },
        { name: "りあな", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/cropped_img_1n31z_20260208171119.jpg?f=webp" },
        { name: "るな", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/76h3z_20260403112033.jpg?f=webp" },
        { name: "ゆま", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/cropped_img_9wocq_20260208171225.jpg?f=webp" },
        { name: "りりか", age: "-", size: "-", img: "https://img.estama.jp/shop_data/00000040482/cast/main/357x556/cropped_img_3mb1y_20260208171404.jpg?f=webp" }
      ]
    },
    {
      searchKeywords: ['mitsubachi', 'ミツバチ'],
      website_url: "https://mens-shinjuku.com/",
      schedule_url: "https://mens-shinjuku.com/schedule.html",
      price_system: "60分: 14,000円\n90分: 18,000円\n120分: 23,000円",
      casts: [
        { name: "ゆあ", age: "19", size: "Dカップ", img: "https://mens-shinjuku.com/data/staff/68/stf_69d2225b2221d.jpg" },
        { name: "あいら", age: "23", size: "Fカップ", img: "https://mens-shinjuku.com/data/staff/69/stf_69d130a42fff7.jpg" },
        { name: "いろ", age: "20", size: "Iカップ", img: "https://mens-shinjuku.com/data/staff/66/stf_69cbe750418a3.jpg" },
        { name: "さく", age: "23", size: "Cカップ", img: "https://mens-shinjuku.com/data/staff/61/stf_69ba46d2886c1.jpg" },
        { name: "もね", age: "22", size: "Cカップ", img: "https://mens-shinjuku.com/data/staff/59/stf_69a44d91c575f.jpg" },
        { name: "ゆうか", age: "26", size: "Fカップ", img: "https://mens-shinjuku.com/data/staff/65/stf_69cb313375730.jpg" },
        { name: "あかり", age: "24", size: "Eカップ", img: "https://mens-shinjuku.com/data/staff/67/stf_69c7d10c5b50f.jpg" },
        { name: "あみ", age: "25", size: "Hカップ", img: "https://mens-shinjuku.com/data/staff/60/stf_69cc6fa1a19f9.jpg" },
        { name: "つむぎ", age: "23", size: "Cカップ", img: "https://mens-shinjuku.com/data/staff/45/stf_6981682c3b60a.jpg" },
        { name: "にこ", age: "22", size: "Eカップ", img: "https://mens-shinjuku.com/data/staff/63/stf_69b6db1671f4e.jpg" },
        { name: "りさ", age: "19", size: "Hカップ", img: "https://mens-shinjuku.com/data/staff/21/stf_698168b772ba6.png" },
        { name: "ひなの", age: "25", size: "Eカップ", img: "https://mens-shinjuku.com/data/staff/51/stf_69904db562dd8.jpg" },
        { name: "うるは", age: "23", size: "Bカップ", img: "https://mens-shinjuku.com/data/staff/64/stf_69b9ef2e6bb04.jpg" },
        { name: "すみれ", age: "25", size: "Dカップ", img: "https://mens-shinjuku.com/data/staff/40/stf_69ba918b9985d.jpg" },
        { name: "さえ", age: "28", size: "Bカップ", img: "https://mens-shinjuku.com/data/staff/34/stf_69845c5a90b6c.jpg" },
        { name: "みつき", age: "32", size: "Dカップ", img: "https://mens-shinjuku.com/data/staff/39/stf_696b9edd3a755.jpg" },
        { name: "ほたる", age: "28", size: "Eカップ", img: "https://mens-shinjuku.com/data/staff/36/stf_697dfa13aea72.jpg" },
        { name: "りん", age: "21", size: "Gカップ", img: "https://mens-shinjuku.com/data/staff/24/stf_6957c656dfb30.jpg" },
        { name: "うみ", age: "24", size: "Cカップ", img: "https://mens-shinjuku.com/data/staff/47/stf_698f38faa777c.jpg" },
        { name: "あずさ", age: "27", size: "Eカップ", img: "https://mens-shinjuku.com/data/staff/20/stf_6980cf70eb7fb.jpg" },
        { name: "みどり", age: "25", size: "Dカップ", img: "https://mens-shinjuku.com/data/staff/17/stf_697dfa6102358.png" },
        { name: "まどか", age: "25", size: "Cカップ", img: "https://mens-shinjuku.com/data/staff/32/stf_69bbec0cdad16.jpg" },
        { name: "つばさ", age: "28", size: "Gカップ", img: "https://mens-shinjuku.com/data/staff/29/stf_695c48f716fcb.jpg" },
        { name: "みなみ", age: "22", size: "Fカップ", img: "https://mens-shinjuku.com/data/staff/49/stf_698a116f8a5d4.jpg" },
        { name: "まる", age: "25", size: "Dカップ", img: "https://mens-shinjuku.com/data/staff/52/stf_6992dd502df96.jpg" },
        { name: "ゆきめ", age: "28", size: "Cカップ", img: "https://mens-shinjuku.com/data/staff/31/stf_698a148be5f85.jpg" },
        { name: "しいな", age: "26", size: "Bカップ", img: "https://mens-shinjuku.com/data/staff/27/stf_698451a1dde63.jpg" },
        { name: "しおり", age: "24", size: "Fカップ", img: "https://mens-shinjuku.com/data/staff/41/stf_69bee93238bf4.jpg" },
        { name: "くるみ", age: "28", size: "Cカップ", img: "https://mens-shinjuku.com/data/staff/23/stf_6957c5f88432d.jpg" },
        { name: "あい", age: "24", size: "Dカップ", img: "https://mens-shinjuku.com/data/staff/14/stf_69be34e3450d4.jpg" },
        { name: "ゆき", age: "22", size: "Fカップ", img: "https://mens-shinjuku.com/data/staff/19/stf_6957b8653648b.jpg" },
        { name: "すずな", age: "27", size: "Gカップ", img: "https://mens-shinjuku.com/data/staff/16/stf_6957b38bcf58b.jpg" },
        { name: "みずき", age: "26", size: "Cカップ", img: "https://mens-shinjuku.com/data/staff/15/stf_6957b1436c167.jpg" },
        { name: "ゆめ", age: "22", size: "Gカップ", img: "https://mens-shinjuku.com/data/staff/28/stf_695c4894c2be7.jpg" },
        { name: "ゆりか", age: "20", size: "Bカップ", img: "https://mens-shinjuku.com/data/staff/44/stf_6974a28284ebc.jpg" },
        { name: "さらり", age: "26", size: "Cカップ", img: "https://mens-shinjuku.com/data/staff/22/stf_6957c58d12034.jpg" },
        { name: "おとは", age: "27", size: "Cカップ", img: "https://mens-shinjuku.com/data/staff/18/stf_6957b75bc1f0b.jpg" }
      ]
    },
    {
      searchKeywords: ['tokyopla', 'トキョプラ', 'ティープラス'],
      website_url: "https://tokyopla.com",
      schedule_url: "https://tokyopla.com/schedule",
      price_system: "70分仰向けのみコース: 16,000円\n90分コース: 18,000円\n120分コース: 23,000円",
      casts: [
        { name: "芹沢れお", age: "23", size: "T.163 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773903655_2375601.jpeg" },
        { name: "日野すみれ", age: "25", size: "T.160 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773088118_9435625.jpg" },
        { name: "白倉けい♦︎", age: "25", size: "T.154 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773295419_4698257.jpeg" },
        { name: "白瀬まりあ♦︎", age: "22", size: "T.152 / (C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1774970003_0360436.jpeg" },
        { name: "天宮るい♦︎", age: "25", size: "T.157 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1774620376_3089465.jpeg" },
        { name: "工藤ひな", age: "26", size: "T.152 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771227303_5544138.jpeg" },
        { name: "及川ゆりな♦︎", age: "28", size: "T.168 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1765981718_3129620.jpeg" },
        { name: "早坂みゆ", age: "18", size: "T.162 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1764065036_1289769.jpeg" },
        { name: "小鳥遊もね♦︎", age: "27", size: "T.153 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761477988_6412719.jpg" },
        { name: "小日向ちい♦︎", age: "24", size: "T.155 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1760039499_3827040.jpeg" },
        { name: "星乃りあん♦︎", age: "21", size: "T.158 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753018374_8297301.jpeg" },
        { name: "西野えま", age: "21", size: "T.168 / (B)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1766998067_0193041.jpeg" },
        { name: "速見ゆいか", age: "23", size: "T.152 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1754563735_7549202.jpg" },
        { name: "氷室いろは", age: "26", size: "T.165 / (H)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753018733_4947435.jpeg" },
        { name: "夢野ひまり", age: "24", size: "T.154 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753021008_5194385.jpeg" },
        { name: "一色ゆう♦︎", age: "27", size: "T.162 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753021996_7927973.jpeg" },
        { name: "有栖りこ♦︎", age: "22", size: "T.162 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753023927_8197833.jpeg" },
        { name: "桃木もな♦︎", age: "25", size: "T.168 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753022445_9630897.png" },
        { name: "佐野まや♦︎", age: "24", size: "T.154 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753025398_9626646.jpeg" },
        { name: "七沢かりん♦︎", age: "23", size: "T.151 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1757056913_2361076.jpeg" },
        { name: "白野すず♦︎", age: "20", size: "T.153 / (C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753025815_7590651.jpeg" },
        { name: "姫宮ののみ", age: "22", size: "T.150 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753026376_6950288.png" },
        { name: "水入まき♦︎", age: "27", size: "T.164 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753026733_7996181.png" },
        { name: "七森さつき♦︎", age: "24", size: "T.151 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753027041_1334490.jpeg" },
        { name: "朝日きき♦︎", age: "22", size: "T.154 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753027739_3847080.jpeg" },
        { name: "田中れみ♦︎", age: "27", size: "T.163 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753027810_8451947.png" },
        { name: "愛須める♦︎", age: "20", size: "T.152 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770304622_2921528.jpg" },
        { name: "池田あいな♦︎", age: "25", size: "T.156 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753028404_5351755.png" },
        { name: "森あかり♦︎", age: "25", size: "T.160 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753028673_6021322.jpeg" },
        { name: "長濱ももか♦︎", age: "26", size: "T.172 / (C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753952950_7533731.jpeg" },
        { name: "野々宮つかさ♦︎", age: "29", size: "T.165 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753029253_9365498.jpeg" },
        { name: "宮下くりす", age: "22", size: "T.160 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753016551_5403825.jpeg" },
        { name: "佐々木りんか♦︎", age: "24", size: "T.161 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753030564_9630862.jpeg" },
        { name: "千森かごめ♦︎", age: "23", size: "T.162 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753030855_4262401.jpeg" },
        { name: "可愛川あい♦︎", age: "24", size: "T.155 / (I)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753032103_6594005.jpeg" },
        { name: "河北ゆきな", age: "20", size: "T.157 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1757406561_0035877.jpeg" },
        { name: "栗原かな♦︎", age: "27", size: "T.160 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753033247_6327428.png" },
        { name: "天野にいな♦︎", age: "24", size: "T.157 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753033583_0671377.jpeg" },
        { name: "渚みおり♦︎", age: "28", size: "T.162 / (H)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1657715516_0025450.jpeg" },
        { name: "香椎ありす♦︎", age: "21", size: "T.164 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753034005_0812676.jpeg" },
        { name: "飯島ののあ", age: "21", size: "T.160 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753034930_8067984.png" },
        { name: "有坂みく♦︎", age: "24", size: "T.160 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1757665679_5410563.jpeg" },
        { name: "京本あや♦︎", age: "26", size: "T.169 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753035503_6624691.jpeg" },
        { name: "姫乃つぐみ♦︎", age: "25", size: "T.164 / (C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753035574_3426166.png" },
        { name: "桜井ひより♦︎", age: "28", size: "T.160 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753035740_2774620.png" },
        { name: "柚木らな♦︎", age: "27", size: "T.155 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753036101_8157109.jpeg" },
        { name: "愛内りな", age: "24", size: "T.148 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753036418_7832872.jpeg" },
        { name: "神谷はるか♦︎", age: "21", size: "T.158 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753036531_1956983.png" },
        { name: "水無月あむ♦︎", age: "20", size: "T.163 / (K)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753017088_8692474.jpeg" },
        { name: "宮川つばさ♦︎", age: "25", size: "T.155 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753031549_3535328.jpeg" },
        { name: "野尻さき", age: "26", size: "T.162 / (C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753036739_0239342.jpeg" },
        { name: "月城いと", age: "21", size: "T.155 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753036968_2333076.png" },
        { name: "滝沢あみ", age: "29", size: "T.160 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1653524800_1238350.jpg" },
        { name: "愛菜みり♦︎", age: "24", size: "T.158 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753036886_2107333.jpeg" },
        { name: "三柴わかな", age: "20", size: "T.155 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753025897_1403482.png" },
        { name: "真白あず", age: "26", size: "T.155 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753023040_1181881.jpeg" },
        { name: "桃園ももえ", age: "29", size: "T.163 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753038100_1690020.jpeg" },
        { name: "水瀬せな♦︎", age: "22", size: "T.160 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753032492_2598143.jpeg" },
        { name: "雪音かんな", age: "20", size: "T.152 / (C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753776765_9911718.png" },
        { name: "宮内ゆい♦︎", age: "25", size: "T.159 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753023706_3090787.jpeg" },
        { name: "奈月しおり", age: "26", size: "T.162 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753026291_6103658.jpeg" },
        { name: "三浦ひまり", age: "25", size: "T.160 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1757051752_1889157.jpeg" },
        { name: "月宮りあ", age: "24", size: "T.162 / (C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753038356_8847178.png" },
        { name: "足立れな♦︎", age: "28", size: "T.168 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753029564_1082980.jpeg" },
        { name: "水野のあ", age: "21", size: "T.151 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1758267943_3100052.jpeg" },
        { name: "武藤りの", age: "26", size: "T.168 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1755344523_8240961.jpeg" },
        { name: "香坂あいり♦︎", age: "24", size: "T.151 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753023327_5079675.jpeg" },
        { name: "翠月まう♦︎", age: "22", size: "T.153 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753034586_2578264.png" },
        { name: "八乙女さくら", age: "23", size: "T.162 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753019216_8449816.jpeg" },
        { name: "山口みほ♦︎", age: "23", size: "T.160 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753033469_1886387.jpeg" },
        { name: "三柴わかな.", age: "20", size: "T.155 / (G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1751369984_8759391.jpg" },
        { name: "速見ゆいか.", age: "23", size: "T.152 / (E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1760623262_7439270.jpeg" },
        { name: "武藤りの.", age: "26", size: "T.168 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1764308816_5076869.jpeg" },
        { name: "宮下くりす.", age: "22", size: "T.160 / (D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1765092326_2612051.jpeg" },
        { name: "早坂みゆ.", age: "18", size: "T.162 / (F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1766644197_6175229.jpeg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから対象の3店舗を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    for (const shopDef of shopsData) {
      console.log(`\n===========================================`);
      console.log(`▶ 処理開始: 【 ${shopDef.searchKeywords[0]} 】関連`);
      
      // 対象店舗（系列含む複数）を抽出
      const targetShops = allShops.filter(shop => {
        const n = shop.name.toLowerCase();
        return shopDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
      });

      if (targetShops.length === 0) {
        console.log(`⚠️ 店舗が見つかりませんでした。スキップします。`);
        continue;
      }

      for (const shop of targetShops) {
        console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        // 1. 店舗情報（HP、スケジュール、システム）の更新
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            website_url: shopDef.website_url,
            schedule_url: shopDef.schedule_url,
            price_system: shopDef.price_system
          })
        });

        if (patchRes.ok) {
          console.log(`   ✅ 店舗基本情報の更新完了`);
        } else {
          console.error(`   ❌ 店舗基本情報の更新失敗: ${patchRes.statusText}`);
        }

        // 2. キャストの更新
        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;

        // リスト内の重複キャストを排除
        const uniqueCasts = Array.from(new Map(shopDef.casts.map(c => [c.name, c])).values());

        for (const cast of uniqueCasts) {
          let cleanName = cast.name.replace(/[\s　]+/g, ''); 
          const rawData = { age: cast.age, size: cast.size };

          const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

          if (existing) {
            await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
              method: 'PATCH',
              headers: headers,
              body: JSON.stringify({ 
                image_url: cast.img,
                raw_data: rawData
              })
            });
            updateCount++;
          } else {
            const newId = `${shop.id}_${cleanName}`;
            await fetch(`${url}/rest/v1/therapists`, {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
              body: JSON.stringify({
                id: newId,
                shop_id: shop.id,
                name: cleanName,
                image_url: cast.img,
                raw_data: rawData
              })
            });
            insertCount++;
          }
        }
        console.log(`   🎉 キャスト設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
      }
    }
    
    console.log(`\n🎊 すべての店舗の更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
