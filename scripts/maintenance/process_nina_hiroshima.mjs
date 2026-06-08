/**
 * salon.do.ni-na セラピスト登録 (広島1位)
 * 77名 / es-pack.jp CDN パターン
 * 実行: node scripts/maintenance/process_nina_hiroshima.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const CDN_BASE = 'https://img.es-pack.jp/shop/nina/images/';

// name: rawName from page (姓-読み- 形式), file: CDN filename
// displayName: rawName.split(/[-‐]/)[0] で姓のみ抽出
const RAW_DATA = [
  { raw: '湯木-ゆのき-',       file: '177923382838320900.png' },
  { raw: '真北-まきた-',       file: '177771860262628100.jpg' },
  { raw: '滝沢-たきざわ-',     file: '177607000385654300.jpg' },
  { raw: '有馬-ありま-',       file: '177787870842449400.jpg' },
  { raw: '真嶋-まじま-',       file: '177545733915913500.jpg' },
  { raw: '未来-みらい-',       file: '175069303135075600.jpg' },
  { raw: '安住-あずみ-',       file: '171714026115263900.jpg' },
  { raw: '双葉-ふたば-',       file: '153853285016984300.jpg' },
  { raw: '矢吹-やぶき-',       file: '174097687395569300.jpg' },
  { raw: '峰城-みねしろ-',     file: '171947128855206100.jpg' },
  { raw: 'かすみ',             file: '176906830262836200.jpg' },
  { raw: '古賀-こが-',         file: '175220982401784500.jpg' },
  { raw: '夏井-なつい-',       file: '171950086875119400.jpg' },
  { raw: '佐野-さの-',         file: '175938203619142700.jpg' },
  { raw: '金城-かねしろ-',     file: '171945432740290200.jpg' },
  { raw: '星河-ほしかわ-',     file: '174780534687735100.jpg' },
  { raw: '長谷川-はせがわ-',   file: '171947734293876200.jpg' },
  { raw: '小春-こはる-',       file: '153870169038050600.jpg' },
  { raw: '恋花‐れんか‐',      file: '177469716638459700.jpg' },
  { raw: '菜々-なな-',         file: '177923472639524900.jpg' },
  { raw: '桃木-ももき-',       file: '169526304292636500.jpg' },
  { raw: '彩葉-いろは-',       file: '176310329263068000.jpg' },
  { raw: '弥生-やよい-',       file: '176766986402588900.jpg' },
  { raw: '要-かなめ-',         file: '176611276414498400.jpg' },
  { raw: '深山-みやま-',       file: '177598338099996800.jpg' },
  { raw: '七瀬-ななせ-',       file: '152333199143893900.jpg' },
  { raw: '宮坂-みやさか-',     file: '178092244805645900.jpg' },
  { raw: '丸岡-まるおか-',     file: '171099831963088200.jpg' },
  { raw: '美月-みつき-',       file: '174061922302464000.jpg' },
  { raw: '愛瀬-あいせ-',       file: '169156503693015700.jpg' },
  { raw: '姫野-ひめの-',       file: '172731926713575900.jpg' },
  { raw: '華森-はなもり-',     file: '176379267293445700.jpg' },
  { raw: '一ノ瀬-いちのせ-',   file: '170893612305482200.jpg' },
  { raw: '東条-とうじょう-',   file: '172948826665431100.jpg' },
  { raw: '早瀬-はやせ-',       file: '177371668481233000.jpg' },
  { raw: '里帆-りほ-',         file: '177233309756363200.jpg' },
  { raw: '芳乃-よしの-',       file: '177923435113230800.jpg' },
  { raw: '二宮-にのみや-',     file: '177923456568113800.jpg' },
  { raw: '愛沢-あいざわ-',     file: '177923441765736500.jpg' },
  { raw: '君島-きみじま-',     file: '177923439067182500.jpg' },
  { raw: '名月-なつき-',       file: '157563721124997400.jpg' },
  { raw: '新垣-あらがき-',     file: '177923447796271600.jpg' },
  { raw: '夏爽-なつさわ-',     file: '177039529452985400.jpg' },
  { raw: '美里-みさと-',       file: '170962026182682200.jpg' },
  { raw: '杉本-すぎもと-',     file: '172370899215901100.jpg' },
  { raw: '犬飼-いぬかい-',     file: '176974071187614800.jpg' },
  { raw: '一条-いちじょう-',   file: '177923444898633400.jpg' },
  { raw: '椎名-しいな-',       file: '153870117088914000.jpg' },
  { raw: '桃原-ももはら-',     file: '176000444827706000.jpg' },
  { raw: '白間-しろま-',       file: '167324092227237500.jpg' },
  { raw: '小田切-おだぎり-',   file: '167694263580086200.jpg' },
  { raw: '吉岡-よしおか-',     file: '174408526181112600.jpg' },
  { raw: '渡辺-わたなべ-',     file: '176570055581129900.jpg' },
  { raw: '穂村-ほむら-',       file: '176396279403626200.jpg' },
  { raw: '神楽-かぐら-',       file: '171474371510372400.jpg' },
  { raw: '三上-みかみ-',       file: '176563194064476400.jpg' },
  { raw: '香坂-こうさか-',     file: '176334030328379600.jpg' },
  { raw: '小柴-こしば-',       file: '177923390726506700.png' },
  { raw: '浜辺-はまべ-',       file: '177923451650075700.jpg' },
  { raw: '葉月-はづき-',       file: '177923454161728000.jpg' },
  { raw: '国重-くにしげ-',     file: '177923458597933300.jpg' },
  { raw: '野々宮-ののみや-',   file: '171842484871974900.jpg' },
  { raw: '平井-ひらい-',       file: '175081807277937000.jpg' },
  { raw: '高畑-たかはた-',     file: '175644420796960400.jpg' },
  { raw: '広瀬-ひろせ-',       file: '172776221616991000.jpg' },
  { raw: '琴乃-ことの-',       file: '166814091779378900.jpg' },
  { raw: '天宮-あまみや-',     file: '173590533218196400.jpg' },
  { raw: '菊間-きくま-',       file: '167806677502389600.jpg' },
  { raw: '宝生-ほうしょう-',   file: '174937098003084700.jpg' },
  { raw: '宇野-うの-',         file: '176623411370661800.jpg' },
  { raw: '稲葉-いなば-',       file: '177923461510535900.jpg' },
  { raw: '末廣-すえひろ-',     file: '177923476268278000.jpg' },
  { raw: '優木-ゆうき-',       file: '177923464409034400.jpg' },
  { raw: '早乙女-さおとめ-',   file: '177923470669343100.jpg' },
  { raw: '真広-まひろ-',       file: '177923478613382600.jpg' },
  { raw: '美園-みその-',       file: '177923481087806200.jpg' },
  { raw: '佐倉-さくら-',       file: '177923483939809600.jpg' },
];

// 姓-読み- → 姓 のみ抽出
function displayName(raw) {
  return raw.split(/[-‐]/)[0].trim();
}

async function uploadImage(file) {
  const numericId = file.replace(/\.[^.]+$/, '');
  const ext = file.split('.').pop();
  const storageKey = `nina_${numericId}.${ext}`;
  const imgUrl = `${CDN_BASE}${file}`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://salon-do-ni-na.com/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`  ✗ 画像取得失敗 ${file} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: ct, upsert: true,
    });
    if (error) { console.log(`  ✗ Storage失敗 ${file}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) {
    console.log(`  ✗ エラー ${file}: ${e.message}`);
    return null;
  }
}

const { data: shopData } = await supabase
  .from('shops')
  .select('id,name')
  .ilike('website_url', '%salon-do-ni-na.com%');
if (!shopData?.length) { console.error('salon.do.ni-na shop not found in DB'); process.exit(1); }
const shopId = shopData[0].id;
console.log(`shop_id: ${shopId}`);
console.log(`shop_name: ${shopData[0].name}`);

const { count } = await supabase
  .from('therapists')
  .select('id', { count: 'exact' })
  .eq('shop_id', shopId);
console.log(`既存: ${count}件\n`);

if (count > 0 && !process.argv.includes('--force')) {
  console.log('既登録あり。--force で再実行');
  process.exit(0);
}

const THERAPISTS = RAW_DATA.map(d => ({ name: displayName(d.raw), file: d.file }));
if (DRY_RUN) {
  THERAPISTS.forEach(t => console.log(`  [dry] ${t.name} <- ${CDN_BASE}${t.file}`));
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
  process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  const imageUrl = await uploadImage(t.file);
  const { error } = await supabase.from('therapists').insert({
    id: `${shopId}_${t.name}`,
    shop_id: shopId,
    name: t.name,
    image_url: imageUrl,
  });
  if (!error) { added++; process.stdout.write(imageUrl ? '.' : 'n'); }
  else { failed++; console.log(`\n  ! insert失敗 ${t.name}: ${error.message}`); }
  await new Promise(r => setTimeout(r, 300));
}
process.stdout.write('\n');
console.log(`\n✅ 登録: ${added}名 / 失敗: ${failed}名`);
