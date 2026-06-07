/**
 * Lynx (リンクス) 池袋・五反田 登録スクリプト
 * Chrome DOM抽出データをハードコード済み
 *
 * 実行:
 *   node scripts/maintenance/process_lynx.mjs --dry-run
 *   node scripts/maintenance/process_lynx.mjs
 *   node scripts/maintenance/process_lynx.mjs --shop ikebukuro
 *   node scripts/maintenance/process_lynx.mjs --shop gotanda
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();

// ===== Lynx 池袋 =====
const IKEBUKURO_SHOP = {
  id: 'tokyo_toshima_ikebukuro_lynx',
  name: 'Lynx (リンクス) 池袋店',
  website_url: 'https://esthe-lynx-ikebukuro.com/',
  schedule_url: 'https://esthe-lynx-ikebukuro.com/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '池袋' },
};

// 池袋 109名 (data-src属性から取得)
// 画像URL: https://admin.esthe-lynx-ikebukuro.com/photos/{imgFile}
const IKEBUKURO_THERAPISTS = [
  { name: '藤代ばんび',  id: 1464, f: '1464-20260528062343.png' },
  { name: '星咲きら',    id: 1462, f: '1462-20260531075038.jpg' },
  { name: '星野みく',    id: 1461, f: '1461-20260529052934.jpg' },
  { name: '月本ゆゆ',    id: 1458, f: '1458-20260523072434.png' },
  { name: '鮎川ひかる',  id: 1451, f: '1451-20260518093239.png' },
  { name: '桃乃ひとみ',  id: 1450, f: '1450-20260506064449.jpg' },
  { name: '西山ののか',  id: 1447, f: '1447-20260515030253.jpg' },
  { name: '白波ひなの',  id: 1449, f: '1449-20260503024459.jpg' },
  { name: '竹内みらい',  id: 1443, f: '1443-20260430023323.jpg' },
  { name: '猫羽みみり',  id: 1441, f: '1441-20260502023156.jpg' },
  { name: '姫宮りん',    id: 1439, f: '1439-20260420100200.jpg' },
  { name: '夢乃あむ',    id: 1436, f: '1436-20260509100826.jpg' },
  { name: '大空のぞみ',  id: 1429, f: '1429-20260430011848.jpg' },
  { name: '和実うた',    id: 1410, f: '' },
  { name: '吉田せいな',  id: 1425, f: '1425-20260409074945.jpg' },
  { name: '神咲さき',    id: 1424, f: '1424-20260408065645.jpg' },
  { name: '井上きほ',    id: 1423, f: '1423-20260429063201.jpg' },
  { name: '最上れな',    id: 1422, f: '1422-20260429062433.jpg' },
  { name: '神楽のあ',    id: 1420, f: '' },
  { name: '一条えりな',  id: 1419, f: '1419-20260429064733.jpg' },
  { name: '福本りむ',    id: 1417, f: '' },
  { name: '佐藤おさき',  id: 1416, f: '1416-20260331051913.jpg' },
  { name: '雪乃ゆな',    id: 1415, f: '' },
  { name: '高野めろん',  id: 1413, f: '1413-20260326065550.jpg' },
  { name: '伊藤りな',    id: 1412, f: '1412-20260414041916.jpg' },
  { name: '小春ゆみ',    id: 1411, f: '1411-20260324070953.jpg' },
  { name: '甘宮める',    id: 1407, f: '1407-20260320100816.jpg' },
  { name: '藤田ことね',  id: 1406, f: '1406-20260318093251.jpg' },
  { name: '天川らな',    id: 1405, f: '1405-20260318014327.jpg' },
  { name: '羽月れん',    id: 1396, f: '1396-20260418062516.jpg' },
  { name: '神楽ひめか',  id: 1393, f: '' },
  { name: '百瀬こなん',  id: 1392, f: '' },
  { name: '立花あい',    id: 1391, f: '1391-20260226042610.jpg' },
  { name: '結城さくな',  id: 1381, f: '1381-20260412111408.jpg' },
  { name: '春風たまき',  id: 1385, f: '1385-20260301034543.jpg' },
  { name: '朝比奈みずき', id: 1376, f: '1376-20260226033805.jpg' },
  { name: '高村あおい',  id: 1372, f: '1372-20260213045218.jpg' },
  { name: '秋月ことね',  id: 1371, f: '1371-20260213040611.jpg' },
  { name: '天羽りこ',    id: 1370, f: '1370-20260213062618.jpg' },
  { name: '月宮のあ',    id: 1363, f: '1363-20260130070519.jpg' },
  { name: '結城あすな',  id: 1358, f: '1358-20260123022921.jpg' },
  { name: '藤見ひめ',    id: 1354, f: '1354-20260109045459.jpg' },
  { name: '瀬奈ゆゆ',    id: 1353, f: '1353-20260108071203.jpg' },
  { name: '七海ゆん',    id: 1351, f: '1351-20260107063504.jpg' },
  { name: '雪野ねむ',    id: 1348, f: '1348-20260104111453.jpg' },
  { name: '星川つむぎ',  id: 1346, f: '1346-20260102083152.jpg' },
  { name: '荒牧りりあ',  id: 1333, f: '1333-20251218103948.jpg' },
  { name: '橘れいか',    id: 1341, f: '1341-20260419014657.jpg' },
  { name: '南まき',      id: 1340, f: '1340-20251222063936.jpg' },
  { name: '中野まいか',  id: 1338, f: '1338-20251221063613.jpg' },
  { name: '鳴海あお',    id: 1337, f: '1337-20251219083512.jpg' },
  { name: '永月ことり',  id: 1334, f: '1334-20260113055347.jpg' },
  { name: '福岡みな',    id: 1330, f: '1330-20251212052521.jpg' },
  { name: '相見りこ',    id: 1324, f: '1324-20251104022714.jpg' },
  { name: '春原ののん',  id: 1323, f: '1323-20251103043004.jpg' },
  { name: '松本さり',    id: 1322, f: '1322-20251020025510.jpg' },
  { name: '華宮りりな',  id: 1321, f: '1321-20260510014256.jpg' },
  { name: '大久保あい',  id: 1318, f: '1318-20251021075530.jpg' },
  { name: '早瀬るか',    id: 1311, f: '1311-20250924115620.jpg' },
  { name: '一条ゆりさ',  id: 1310, f: '1310-20251120030647.jpg' },
  { name: '宇野のぞみ',  id: 1307, f: '1307-20250920022705.jpg' },
  { name: '音嶋りな',    id: 1305, f: '1305-20250919032548.jpg' },
  { name: '恋瀬るん',    id: 1304, f: '1304-20250918064104.jpg' },
  { name: '藤森はる',    id: 1301, f: '1301-20250914062903.jpg' },
  { name: '大咲まみ',    id: 1299, f: '1299-20250929042355.jpg' },
  { name: '葉月ゆあ',    id: 1298, f: '1298-20250904051638.jpg' },
  { name: '藤原はづき',  id: 1296, f: '1296-20250915023655.jpg' },
  { name: '浅倉こと',    id: 1295, f: '1295-20250917121105.jpg' },
  { name: '暁美ほむら',  id: 1294, f: '1294-20250901044806.jpg' },
  { name: '明日香らら',  id: 1290, f: '1290-20250825050315.jpg' },
  { name: '谷口ひかり',  id: 1289, f: '1289-20250823030537.jpg' },
  { name: '花園あかり',  id: 1281, f: '1281-20250814034728.jpg' },
  { name: '猫塚なつは',  id: 1278, f: '1278-20250816123603.jpg' },
  { name: '海風はんな',  id: 1277, f: '1277-20251114082406.jpg' },
  { name: '神園みゆ',    id: 1276, f: '1276-20250807034508.jpg' },
  { name: '森咲あん',    id: 1274, f: '1274-20250903012724.jpg' },
  { name: '小鳥遊りん',  id: 1273, f: '1273-20250829015942.jpg' },
  { name: '月乃あやか',  id: 1271, f: '1271-20250725111155.jpg' },
  { name: '高橋なぎさ',  id: 1268, f: '1268-20250718012143.jpg' },
  { name: '相沢あも',    id: 1262, f: '' },
  { name: '宮野さくら',  id: 1256, f: '1256-20250628085421.jpg' },
  { name: '氷室れいか',  id: 1241, f: '1241-20250613053829.jpg' },
  { name: '夏目ましろ',  id: 1239, f: '1239-20250906013231.jpg' },
  { name: '佐々木りか',  id: 1222, f: '1222-20250714034502.jpg' },
  { name: '白咲まあり',  id: 1213, f: '1213-20250601022424.jpg' },
  { name: '森永ぷりん',  id: 1208, f: '1208-20251203095844.jpg' },
  { name: '羽田さら',    id: 1207, f: '1207-20250623040101.jpg' },
  { name: '水原まいか',  id: 1200, f: '1200-20250427062444.jpg' },
  { name: '海瀬るり',    id: 1189, f: '1189-20250415085031.jpg' },
  { name: '火野れい',    id: 1183, f: '' },
  { name: '姫咲ふゆか',  id: 1178, f: '1178-20250514075304.jpg' },
  { name: '長浜もえ',    id: 1163, f: '1163-20250318035703.jpg' },
  { name: '石辺めい',    id: 1162, f: '1162-20250609032412.jpg' },
  { name: '前原しおり',  id: 1113, f: '1113-20260115095029.jpg' },
  { name: '関口あみな',  id: 1109, f: '' },
  { name: '香山ねむり',  id: 1095, f: '1095-20251008060434.jpg' },
  { name: '藤原みゆか',  id: 1070, f: '1070-20241114102935.jpg' },
  { name: '加藤みなみ',  id: 985,  f: '985-20260123051228.jpg' },
  { name: '成瀬もな',    id: 930,  f: '930-20251009115806.jpg' },
  { name: '丸山ゆい',    id: 915,  f: '915-20260430123341.jpg' },
  { name: '目黒ゆら',    id: 890,  f: '890-20260429075313.jpg' },
  { name: '双葉ゆに',    id: 855,  f: '855-20250608042259.jpg' },
  { name: '青田みのり',  id: 810,  f: '810-20250608040114.jpg' },
  { name: '猫宮ひなこ',  id: 715,  f: '715-20231105011217.jpg' },
  { name: '西野あやみ',  id: 605,  f: '605-20250625024223.jpg' },
  { name: '一ノ瀬まゆ',  id: 568,  f: '568-20250607022519.jpg' },
  { name: '野々原ちか',  id: 566,  f: '566-20250809123619.jpg' },
  { name: '如月あすか',  id: 277,  f: '277-20241219034138.jpg' },
  { name: '浦瀬もも',    id: 74,   f: '74-20250607020611.jpg' },
].map(t => ({ ...t, imgUrl: t.f ? `https://admin.esthe-lynx-ikebukuro.com/photos/${t.f}` : null }));

// ===== Lynx 五反田 =====
const GOTANDA_SHOP = {
  id: 'tokyo_shinagawa_gotanda_lynx',
  name: 'Lynx (リンクス) 五反田店',
  website_url: 'https://esthe-lynx-gotanda.com/',
  schedule_url: 'https://esthe-lynx-gotanda.com/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '五反田' },
};

// 五反田 103名（ノイズ2件除去済み：「新人セラピスト」「千反田みよ＆神楽みな」）
const GOTANDA_THERAPISTS = [
  { name: '月城ひめの',  id: 494, f: '494-20260530064230.jpg' },
  { name: '西野もも',    id: 493, f: '493-20260526031340.jpg' },
  { name: '椎名あめ',    id: 492, f: '492-20260517043114.jpg' },
  { name: '愛咲かれん',  id: 491, f: '491-20260514014028.jpg' },
  { name: '天乃みみ',    id: 490, f: '490-20260507032006.jpg' },
  { name: '星野ルカ',    id: 489, f: '489-20260503094836.jpg' },
  { name: '東村くるみ',  id: 488, f: '488-20260528092742.jpg' },
  { name: '今井こはく',  id: 487, f: '487-20260427123527.jpg' },
  { name: '菅井ゆき',    id: 486, f: '486-20260501053611.jpg' },
  { name: '佐藤めい',    id: 485, f: '485-20260427095202.jpg' },
  { name: '宮内なぎさ',  id: 484, f: '484-20260404041650.jpg' },
  { name: '真野りか',    id: 483, f: '' },
  { name: '小泉かなた',  id: 482, f: '482-20260405010736.jpg' },
  { name: '七瀬りり',    id: 481, f: '481-20260503072358.jpg' },
  { name: '高野めろん',  id: 480, f: '480-20260314061556.jpg' },
  { name: '川口ゆあ',    id: 479, f: '479-20260308051138.jpg' },
  { name: '如月れみ',    id: 478, f: '478-20260304121328.jpg' },
  { name: '瀬戸あや',    id: 477, f: '477-20260226114721.jpg' },
  { name: '黒崎りこ',    id: 476, f: '476-20260215082339.jpg' },
  { name: '綾瀬しずく',  id: 475, f: '475-20260212040439.jpg' },
  { name: '篠崎さやか',  id: 473, f: '473-20260123045732.jpg' },
  { name: '九条ここな',  id: 469, f: '' },
  { name: '月島りんか',  id: 468, f: '468-20260105103935.jpg' },
  { name: '白雪ましろ',  id: 467, f: '467-20260304123410.jpg' },
  { name: '早乙女らん',  id: 465, f: '465-20251213084812.jpg' },
  { name: '高村あおい',  id: 464, f: '464-20251208023154.jpg' },
  { name: '長峰すみれ',  id: 462, f: '462-20251202060732.jpg' },
  { name: '月乃まゆ',    id: 461, f: '461-20251203123154.jpg' },
  { name: '一ノ瀬れん',  id: 460, f: '460-20260329070533.jpg' },
  { name: '七瀬みに',    id: 459, f: '459-20251121015235.jpg' },
  { name: 'はまち',      id: 457, f: '457-20251104095729.jpg' },
  { name: '天使みあり',  id: 456, f: '456-20251103055752.jpg' },
  { name: '瀬戸あん',    id: 453, f: '453-20251027015128.jpg' },
  { name: '白石ゆか',    id: 450, f: '450-20251017072256.jpg' },
  { name: '柚月るか',    id: 449, f: '449-20251017085440.jpg' },
  { name: '琴吹きらり',  id: 447, f: '447-20251012070139.jpg' },
  { name: '星奈のあ',    id: 383, f: '383-20250529041930.jpg' },
  { name: '有村ありさ',  id: 435, f: '435-20250630022615.jpg' },
  { name: '式波あおい',  id: 424, f: '424-20250612095823.jpg' },
  { name: '松本あいか',  id: 415, f: '415-20250601010113.jpg' },
  { name: '野々原ちか',  id: 51,  f: '51-20250130124007.jpg' },
  { name: '愛澤かのん',  id: 409, f: '409-20250515020114.jpg' },
  { name: '桃瀬れな',    id: 406, f: '406-20250513055144.jpg' },
  { name: '星こよみ',    id: 405, f: '405-20250514030419.jpg' },
  { name: '佐藤はるな',  id: 403, f: '403-20250509022929.jpg' },
  { name: '宝鐘れむ',    id: 283, f: '283-20241229125705.jpg' },
  { name: '姫咲あんな',  id: 400, f: '400-20250501015523.jpg' },
  { name: '宮崎かほ',    id: 207, f: '207-20250409055317.jpg' },
  { name: '五条まゆ',    id: 394, f: '394-20250419014132.jpg' },
  { name: '野間ゆきな',  id: 399, f: '399-20250427052303.jpg' },
  { name: '月島るね',    id: 396, f: '396-20250425124746.jpg' },
  { name: '愛田えみり',  id: 96,  f: '96-20241229125945.jpg' },
  { name: '木下サラ',    id: 388, f: '388-20250409064115.jpg' },
  { name: '花咲なな',    id: 393, f: '393-20250418054437.jpg' },
  { name: '夢咲さくら',  id: 395, f: '395-20250421032930.jpg' },
  { name: '西宮しおり',  id: 401, f: '401-20260122065554.jpg' },
  { name: '藤木ゆの',    id: 387, f: '387-20250405011203.jpg' },
  { name: '月川みさと',  id: 363, f: '363-20250311072859.jpg' },
  { name: '西るか',      id: 376, f: '376-20250316074818.jpg' },
  { name: '仲里まなみ',  id: 359, f: '359-20250713105533.jpg' },
  { name: '西園寺桜',    id: 78,  f: '78-20241229125351.jpg' },
  { name: '桃瀬ひなみ',  id: 392, f: '392-20250415022720.jpg' },
  { name: '海月うい',    id: 391, f: '391-20250414061928.jpg' },
  { name: '紅らんな',    id: 164, f: '164-20241229010027.jpg' },
  { name: '花村くるみ',  id: 244, f: '244-20241229125826.jpg' },
  { name: '水瀬ここあ',  id: 402, f: '402-20250501061558.jpg' },
  { name: '羽野ふうな',  id: 390, f: '390-20250410014125.jpg' },
  { name: '北川らら',    id: 384, f: '384-20250329050731.jpg' },
  { name: '朝比奈もも',  id: 389, f: '389-20250409055323.jpg' },
  { name: '佐藤さおり',  id: 361, f: '361-20250311072151.jpg' },
  { name: '風沢ありす',  id: 382, f: '382-20250325071004.jpg' },
  { name: '湊つむぎ',    id: 372, f: '372-20250311025848.jpg' },
  { name: '天音みゆ',    id: 373, f: '373-20250311015508.jpg' },
  { name: '野口さや',    id: 366, f: '366-20250311072143.jpg' },
  { name: '斎宮りの',    id: 257, f: '257-20250114014355.jpg' },
  { name: '川村るい',    id: 354, f: '354-20250123063114.jpg' },
  { name: '黒澤ゆずは',  id: 369, f: '369-20250221054310.jpg' },
  { name: '愛川もね',    id: 365, f: '365-20250212042157.jpg' },
  { name: '春花ひなの',  id: 336, f: '336-20241229125758.jpg' },
  { name: '中条あみ',    id: 249, f: '249-20250812083903.jpg' },
  { name: 'あまねみさ',  id: 68,  f: '68-20241229125655.jpg' },
  { name: '天音らら',    id: 282, f: '282-20241229125729.jpg' },
  { name: '中嶋みり',    id: 240, f: '240-20241229010008.jpg' },
  { name: '佐々木れな',  id: 12,  f: '12-20230625015551.jpg' },
].map(t => ({ ...t, imgUrl: t.f ? `https://admin.esthe-lynx-gotanda.com/photos/${t.f}` : null }));

// ===== 共通処理 =====
async function uploadImage(imgUrl, storageKey, referer) {
  try {
    const res = await fetch(imgUrl, { headers: { Referer: referer, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${storageKey}.jpg`, buffer, { contentType, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${storageKey}.jpg`);
    return data.publicUrl;
  } catch { return null; }
}

async function registerShop(shopData) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${shopData.name}`); return; }
  const { error } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ Shop: ${shopData.id}`);
}

async function registerTherapists(shopId, therapists, prefix, referer) {
  let inserted = 0, skipped = 0, errors = 0;
  for (const t of therapists) {
    const therapistId = `${shopId}_${t.name}`;
    const { data: existing } = await supabase.from('therapists').select('id,image_url').eq('id', therapistId).single();
    if (existing?.image_url) { process.stdout.write('='); skipped++; continue; }

    let storageUrl = null;
    if (t.imgUrl) {
      const key = `${prefix}_${t.id}`;
      storageUrl = DRY_RUN ? t.imgUrl : await uploadImage(t.imgUrl, key, referer);
    }
    const record = { id: therapistId, shop_id: shopId, name: t.name, image_url: storageUrl };
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${t.name}:`, error.message); errors++; }
      else { process.stdout.write(storageUrl ? '+' : 'n'); inserted++; }
    } else {
      process.stdout.write(t.imgUrl ? '+' : 'n'); inserted++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\n挿入: ${inserted} / スキップ: ${skipped} / エラー: ${errors}`);
}

async function main() {
  console.log(`=== Lynx 池袋・五反田 登録スクリプト (DRY_RUN=${DRY_RUN}) ===\n`);
  const runIkebukuro = !shopArg || shopArg === 'ikebukuro';
  const runGotanda   = !shopArg || shopArg === 'gotanda';

  if (runIkebukuro) {
    console.log(`--- Lynx 池袋 ${IKEBUKURO_THERAPISTS.length}名 ---`);
    await registerShop(IKEBUKURO_SHOP);
    await registerTherapists(IKEBUKURO_SHOP.id, IKEBUKURO_THERAPISTS, 'lynxike', 'https://esthe-lynx-ikebukuro.com');
  }
  if (runGotanda) {
    console.log(`\n--- Lynx 五反田 ${GOTANDA_THERAPISTS.length}名 ---`);
    await registerShop(GOTANDA_SHOP);
    await registerTherapists(GOTANDA_SHOP.id, GOTANDA_THERAPISTS, 'lynxgot', 'https://esthe-lynx-gotanda.com');
  }
}

main().catch(console.error);
