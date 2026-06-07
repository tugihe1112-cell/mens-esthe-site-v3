/**
 * ANAICHI (あないち) 6ルーム + 143名 登録スクリプト
 * CMS: ml_11_1_{uid}.png (背景画像パターン)
 * エリア: 三軒茶屋・中目黒・渋谷・恵比寿・銀座・麻布十番
 *
 * 実行:
 *   node scripts/maintenance/process_anaichi.mjs --dry-run
 *   node scripts/maintenance/process_anaichi.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://www.anaichi-este.com';
const GROUP_ID = 'g_brand_anaichi';
const SHOP_IMAGE = 'https://i.gyazo.com/43319dda885f37212cbf4198134640be.png';

const SHOPS = [
  { id: 'tokyo_setagaya_sangenjaya_anaichi', name: 'ANAICHI (三軒茶屋ルーム)', area: '三軒茶屋' },
  { id: 'tokyo_meguro_nakameguro_anaichi',   name: 'ANAICHI (中目黒ルーム)',   area: '中目黒' },
  { id: 'tokyo_shibuya_shibuya_anaichi',     name: 'ANAICHI (渋谷ルーム)',     area: '渋谷' },
  { id: 'tokyo_shibuya_ebisu_anaichi',       name: 'ANAICHI (恵比寿ルーム)',   area: '恵比寿' },
  { id: 'tokyo_chuo_ginza_anaichi',          name: 'ANAICHI (銀座ルーム)',     area: '銀座' },
  { id: 'tokyo_minato_azabujuban_anaichi',   name: 'ANAICHI (麻布十番ルーム)', area: '麻布十番' },
].map(s => ({
  ...s,
  group_id: GROUP_ID,
  website_url: 'https://www.anaichi-este.com/',
  schedule_url: 'https://www.anaichi-este.com/schedule/',
  image_url: SHOP_IMAGE,
  raw_data: { prefecture: '東京都', area: s.area },
}));

// Chrome経由で取得した全143名（2026-06-06）
// 全ルーム共通で三軒茶屋（代表）に登録
const THERAPISTS_RAW = [
  ['南野 いおり', '8806'], ['城ヶ崎 まこ', '10676'], ['有村 のぞみ', '10518'],
  ['佐々木 あずさ', '10452'], ['初音 カレン', '7145'], ['綾瀬 ゆうな', '7729'],
  ['紫藤 まよ', '7879'], ['早見 なな', '8051'], ['美谷 ほのか', '9311'],
  ['鳥谷 けい', '8283'], ['朝比奈 まり', '7134'], ['美馬 かのん', '6652'],
  ['小嶋 かな', '10725'], ['黒川 さあや', '10691'], ['黒沢 あすか', '10643'],
  ['瀬戸 まりん', '10407'], ['夏目 あみる', '10521'], ['国枝 めりか', '10524'],
  ['中森 ふゆき', '10344'], ['桜庭 しき', '10222'], ['稲森 みずな', '9856'],
  ['吉岡 ねね', '10032'], ['夢野 なつか', '10604'], ['白浜 らいか', '10143'],
  ['成瀬 くるみ', '7427'], ['穂坂 あゆな', '8783'], ['中谷 らん', '9891'],
  ['水野 みか', '9797'], ['細川 れいあ', '9983'], ['永山 あん', '10029'],
  ['藤森 みづき', '7842'], ['白鳥 めぐみ', '6999'], ['星野 のあ', '9208'],
  ['天海 ケイ', '8365'], ['高岡 さえ', '10296'], ['西岡 せあら', '9784'],
  ['如月 あお', '8779'], ['麻丘 ひまり', '6788'], ['乃木坂 めい', '9909'],
  ['月本 みつき', '10157'], ['神木 のん', '9874'], ['唐沢 いぶ', '9781'],
  ['神代 せあ', '9562'], ['今永 ゆの', '8115'], ['水嶋 しほ', '10746'],
  ['花沢 えな', '10715'], ['氷織 ちぎり', '10712'], ['伊丹 あかり', '10709'],
  ['赤石 ゆりね', '10706'], ['石原 さとみ', '10682'], ['日向 ひまわり', '10670'],
  ['辻 なつめ', '10673'], ['橘 あんな', '10703'], ['百瀬 まりあ', '10598'],
  ['西野 ゆう', '10655'], ['菊間 ひびき', '10557'], ['片瀬 まりか', '10542'],
  ['七瀬 みな', '10601'], ['櫻井 りこ', '10697'], ['日奈森 まこ', '10527'],
  ['滝沢 けい', '10515'], ['鮎川 れい', '10485'], ['神宮寺 みく', '10467'],
  ['白雪 ゆあ', '10482'], ['笹本 さらん', '10548'], ['藤 ももか', '10440'],
  ['海堂 ふみ', '10737'], ['内藤 ゆいか', '10734'], ['三木 こはる', '10731'],
  ['永瀬 あきほ', '10728'], ['花宮 りな', '10724'], ['蒼井 しずく', '10721'],
  ['赤星 セシル', '10718'], ['時東 せれな', '10212'], ['神吉 あけみ', '10559'],
  ['相葉 ことの', '10202'], ['近本 うらら', '10175'], ['嘉藤 あい', '10646'],
  ['宮下 まりな', '10051'], ['愛月 まゆ', '10413'], ['桜木 ひなこ', '9212'],
  ['三津奈 まゆ', '10562'], ['門倉 いより', '10240'], ['寿 りん', '10035'],
  ['九条 らん', '10216'], ['大石 るみな', '10160'], ['羽賀 あゆむ', '9988'],
  ['木村 まな', '7001'], ['新海 もなこ', '8623'], ['松川 きくよ', '9750'],
  ['佐久間 ひゆか', '9492'], ['秋吉 ここは', '9920'], ['安藤 みね', '9145'],
  ['小湊 みやび', '10009'], ['清瀬 ひめり', '10247'], ['里美 れん', '9998'],
  ['倉本 りか', '8739'], ['南雲 ひより', '8639'], ['海星 みちる', '8295'],
  ['美神 れい', '6832'], ['最上 ゆあ', '8381'], ['優木 さら', '8187'],
  ['森山 はんな', '7676'], ['松本 まりか', '6885'], ['花野井 きほ', '8400'],
  ['花村 れん', '6976'], ['菊川 りあん', '6911'], ['吉澤 うみか', '9307'],
  ['雨宮 うゆ', '7046'], ['篠田 さやか', '7262'], ['新垣 のあ', '7512'],
  ['高木 めいさ', '8353'], ['今宮 るるか', '7027'], ['椎名 みわ', '7024'],
  ['真白 みそら', '8456'], ['山田 らん', '9895'], ['織原 かのん', '9721'],
  ['朝日 みくる', '10244'], ['柏木 まゆか', '5805'], ['大空 せりな', '10243'],
  ['杉咲 もも', '6270'], ['牧瀬 ゆうな', '9932'], ['相川 みいな', '9758'],
  ['星谷 ありす', '9377'], ['沙月 めい', '7238'], ['日高 みらい', '9810'],
  ['北田 このは', '9421'], ['平瀬 ちほ', '7101'], ['宮本 あんり', '8012'],
  ['綾波 りお', '7011'], ['観月 あやめ', '9131'], ['松中 いちか', '8425'],
  ['梅沢 はる', '9106'], ['前園 さやの', '6751'], ['大森 あやめ', '8357'],
  ['桐山 さな', '7828'], ['竹内 ほなみ', '8045'], ['姫野 このみ', '8136'],
  ['江藤 かすみ', '6988'], ['眞鍋 しおり', '6996'], ['一条 まりん', '7266'],
  ['冬月 せり', '8958'], ['四ノ宮 いろは', '8844'],
];

const MAIN_SHOP_ID = 'tokyo_setagaya_sangenjaya_anaichi';

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, {
      headers: { 'Referer': BASE + '/', 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const storageKey = `${key}.${ext}`;
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(storageKey);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function main() {
  console.log(`=== ANAICHI 登録 (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`店舗: ${SHOPS.length}ルーム / セラピスト: ${THERAPISTS_RAW.length}名\n`);

  if (DRY_RUN) {
    SHOPS.forEach(s => console.log(`[DRY] Shop: ${s.name}`));
    console.log(`[DRY] Therapists: ${THERAPISTS_RAW.length}名（${MAIN_SHOP_ID} に登録）`);
    return;
  }

  // 全ショップ登録
  for (const shop of SHOPS) {
    const { error } = await supabase.from('shops').upsert(shop, { onConflict: 'id' });
    if (error) console.error(`✗ ${shop.name}: ${error.message}`);
    else console.log(`✅ ${shop.id}`);
  }

  // セラピスト登録（代表店舗に一括）
  console.log(`\nセラピスト登録中...`);
  let ins = 0, skp = 0, err = 0;
  for (const [name, uid] of THERAPISTS_RAW) {
    const normName = name.replace(/\s+/g, ' ').trim();
    const tid = `${MAIN_SHOP_ID}_${normName}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    const imgUrl = `${BASE}/images/ml_11_1_${uid}.png`;
    const url = await uploadImage(imgUrl, `anaichi_${uid}`);

    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: MAIN_SHOP_ID, name: normName, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { console.error(`\n✗ ${normName}: ${error.message}`); err++; }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n\n=== 完了 ===`);
  console.log(`挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}
main().catch(console.error);
