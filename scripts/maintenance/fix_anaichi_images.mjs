/**
 * ANAICHI セラピスト画像修正（nullのものをアップロード）
 * 実行: node scripts/maintenance/fix_anaichi_images.mjs --dry-run
 *       node scripts/maintenance/fix_anaichi_images.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://www.anaichi-este.com';
const SHOP_ID = 'tokyo_setagaya_sangenjaya_anaichi';

// uid→名前マップ
const UID_MAP = new Map([
  ['8806','南野 いおり'], ['10676','城ヶ崎 まこ'], ['10518','有村 のぞみ'],
  ['10452','佐々木 あずさ'], ['7145','初音 カレン'], ['7729','綾瀬 ゆうな'],
  ['7879','紫藤 まよ'], ['8051','早見 なな'], ['9311','美谷 ほのか'],
  ['8283','鳥谷 けい'], ['7134','朝比奈 まり'], ['6652','美馬 かのん'],
  ['10725','小嶋 かな'], ['10691','黒川 さあや'], ['10643','黒沢 あすか'],
  ['10407','瀬戸 まりん'], ['10521','夏目 あみる'], ['10524','国枝 めりか'],
  ['10344','中森 ふゆき'], ['10222','桜庭 しき'], ['9856','稲森 みずな'],
  ['10032','吉岡 ねね'], ['10604','夢野 なつか'], ['10143','白浜 らいか'],
  ['7427','成瀬 くるみ'], ['8783','穂坂 あゆな'], ['9891','中谷 らん'],
  ['9797','水野 みか'], ['9983','細川 れいあ'], ['10029','永山 あん'],
  ['7842','藤森 みづき'], ['6999','白鳥 めぐみ'], ['9208','星野 のあ'],
  ['8365','天海 ケイ'], ['10296','高岡 さえ'], ['9784','西岡 せあら'],
  ['8779','如月 あお'], ['6788','麻丘 ひまり'], ['9909','乃木坂 めい'],
  ['10157','月本 みつき'], ['9874','神木 のん'], ['9781','唐沢 いぶ'],
  ['9562','神代 せあ'], ['8115','今永 ゆの'], ['10746','水嶋 しほ'],
  ['10715','花沢 えな'], ['10712','氷織 ちぎり'], ['10709','伊丹 あかり'],
  ['10706','赤石 ゆりね'], ['10682','石原 さとみ'], ['10670','日向 ひまわり'],
  ['10673','辻 なつめ'], ['10703','橘 あんな'], ['10598','百瀬 まりあ'],
  ['10655','西野 ゆう'], ['10557','菊間 ひびき'], ['10542','片瀬 まりか'],
  ['10601','七瀬 みな'], ['10697','櫻井 りこ'], ['10527','日奈森 まこ'],
  ['10515','滝沢 けい'], ['10485','鮎川 れい'], ['10467','神宮寺 みく'],
  ['10482','白雪 ゆあ'], ['10548','笹本 さらん'], ['10440','藤 ももか'],
  ['10737','海堂 ふみ'], ['10734','内藤 ゆいか'], ['10731','三木 こはる'],
  ['10728','永瀬 あきほ'], ['10724','花宮 りな'], ['10721','蒼井 しずく'],
  ['10718','赤星 セシル'], ['10212','時東 せれな'], ['10559','神吉 あけみ'],
  ['10202','相葉 ことの'], ['10175','近本 うらら'], ['10646','嘉藤 あい'],
  ['10051','宮下 まりな'], ['10413','愛月 まゆ'], ['9212','桜木 ひなこ'],
  ['10562','三津奈 まゆ'], ['10240','門倉 いより'], ['10035','寿 りん'],
  ['10216','九条 らん'], ['10160','大石 るみな'], ['9988','羽賀 あゆむ'],
  ['7001','木村 まな'], ['8623','新海 もなこ'], ['9750','松川 きくよ'],
  ['9492','佐久間 ひゆか'], ['9920','秋吉 ここは'], ['9145','安藤 みね'],
  ['10009','小湊 みやび'], ['10247','清瀬 ひめり'], ['9998','里美 れん'],
  ['8739','倉本 りか'], ['8639','南雲 ひより'], ['8295','海星 みちる'],
  ['6832','美神 れい'], ['8381','最上 ゆあ'], ['8187','優木 さら'],
  ['7676','森山 はんな'], ['6885','松本 まりか'], ['8400','花野井 きほ'],
  ['6976','花村 れん'], ['6911','菊川 りあん'], ['9307','吉澤 うみか'],
  ['7046','雨宮 うゆ'], ['7262','篠田 さやか'], ['7512','新垣 のあ'],
  ['8353','高木 めいさ'], ['7027','今宮 るるか'], ['7024','椎名 みわ'],
  ['8456','真白 みそら'], ['9895','山田 らん'], ['9721','織原 かのん'],
  ['10244','朝日 みくる'], ['5805','柏木 まゆか'], ['10243','大空 せりな'],
  ['6270','杉咲 もも'], ['9932','牧瀬 ゆうな'], ['9758','相川 みいな'],
  ['9377','星谷 ありす'], ['7238','沙月 めい'], ['9810','日高 みらい'],
  ['9421','北田 このは'], ['7101','平瀬 ちほ'], ['8012','宮本 あんり'],
  ['7011','綾波 りお'], ['9131','観月 あやめ'], ['8425','松中 いちか'],
  ['9106','梅沢 はる'], ['6751','前園 さやの'], ['8357','大森 あやめ'],
  ['7828','桐山 さな'], ['8045','竹内 ほなみ'], ['8136','姫野 このみ'],
  ['6988','江藤 かすみ'], ['6996','眞鍋 しおり'], ['7266','一条 まりん'],
  ['8958','冬月 せり'], ['8844','四ノ宮 いろは'],
]);

// DBからnull画像のセラピストを取得
const { data: nullTherapists } = await supabase
  .from('therapists')
  .select('id, name, image_url')
  .eq('shop_id', SHOP_ID)
  .is('image_url', null);

console.log(`null画像: ${nullTherapists?.length}名 (DRY_RUN=${DRY_RUN})\n`);

async function uploadImage(imgUrl, key) {
  const res = await fetch(imgUrl, {
    headers: { 'Referer': BASE + '/', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const storageKey = `${key}.png`;
  const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, { contentType: 'image/png', upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('therapist-images').getPublicUrl(storageKey);
  return data.publicUrl;
}

let upd = 0, skip = 0, err = 0;
for (const t of nullTherapists || []) {
  // 名前からuidを逆引き
  const uid = [...UID_MAP.entries()].find(([, n]) => n === t.name)?.[0];
  if (!uid) { console.log(`? uid不明: ${t.name}`); err++; continue; }

  if (DRY_RUN) { console.log(`[DRY] ${t.name} → uid:${uid}`); continue; }

  try {
    const imgUrl = `${BASE}/images/ml_11_1_${uid}.png`;
    const url = await uploadImage(imgUrl, `anaichi_${uid}`);
    const { error: updErr } = await supabase.from('therapists').update({ image_url: url }).eq('id', t.id);
    if (updErr) throw new Error(updErr.message);
    process.stdout.write('+'); upd++;
  } catch (e) {
    process.stdout.write('!');
    if (err < 3) console.error(`\n  ${t.name}: ${e.message}`);
    err++;
  }
  await new Promise(r => setTimeout(r, 300));
}

console.log(`\n\n=== 完了 ===`);
console.log(`更新: ${upd} / スキップ: ${skip} / エラー: ${err}`);
