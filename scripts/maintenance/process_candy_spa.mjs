/**
 * Candy Spa セラピスト登録
 * パターン: li.staff-name + background-image:url(/data/staff/{id}/stf_{hash}.{ext})
 * 実行: node scripts/maintenance/process_candy_spa.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://candy-s-candy.men-es.jp';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOP_ID = 'tokyo_dispatch_candy_spa';

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome から取得した126名（シークレット1名除外済み）
const CANDY_DATA = [
  ['桜乃 みこと',   `${BASE}/data/staff/354/stf_69ec7d8db5e0c.png`],
  ['桜庭 かんな',   `${BASE}/data/staff/350/stf_69dde1489bf72.png`],
  ['日向 こころ',   `${BASE}/data/staff/353/stf_69ec75272513d.png`],
  ['堀川 寧音',     `${BASE}/data/staff/359/stf_6a000e1c64a04.jpg`],
  ['蒼咲 レア',     `${BASE}/data/staff/357/stf_69fc70f1106cd.png`],
  ['白凪 ゆら',     `${BASE}/data/staff/347/stf_69c7973c4126c.png`],
  ['天使 まみ',     `${BASE}/data/staff/334/stf_69a6bb8e88886.png`],
  ['九条 しの',     `${BASE}/data/staff/358/stf_69f2f8693cce5.jpg`],
  ['服部 ひより',   `${BASE}/data/staff/312/stf_698d417a60b2e.jpg`],
  ['七海 かよ',     `${BASE}/data/staff/325/stf_69d089da7e77c.png`],
  ['桐谷 あかり',   `${BASE}/data/staff/333/stf_69a028c3ed066.png`],
  ['音絵 結衣',     `${BASE}/data/staff/335/stf_69df48c8712ec.png`],
  ['高橋 夢',       `${BASE}/data/staff/336/stf_69c22bb77e4bd.png`],
  ['篠宮 メイサ',   `${BASE}/data/staff/310/stf_6939015a3e75c.png`],
  ['鈴木 こと',     `${BASE}/data/staff/329/stf_6989b446eb065.png`],
  ['佐久間 春',     `${BASE}/data/staff/297/stf_69928fe1375a5.jpg`],
  ['神崎 れいな',   `${BASE}/data/staff/303/stf_6923fda718fe1.png`],
  ['音葉 みなみ',   `${BASE}/data/staff/306/stf_69f06606874c6.png`],
  ['成澤 玲奈',     `${BASE}/data/staff/301/stf_691fca669d1f9.jpg`],
  ['星宮 千鶴',     `${BASE}/data/staff/231/stf_68bfee13e491b.png`],
  ['海 アリス',     `${BASE}/data/staff/250/stf_69928be1ba324.jpg`],
  ['嬉野 あまね',   `${BASE}/data/staff/229/stf_69cf1a1363fa1.png`],
  ['蝶まみ',        `${BASE}/data/staff/245/stf_687c5c56558ef.png`],
  ['華神 らん',     `${BASE}/data/staff/349/stf_69d4cf6d03cf4.png`],
  ['桜庭 えな',     `${BASE}/data/staff/355/stf_69f19095032ea.png`],
  ['一ノ瀬 あの',   `${BASE}/data/staff/345/stf_69c7910fe088b.png`],
  ['木下 あおい',   `${BASE}/data/staff/341/stf_69ba706b59f02.png`],
  ['清水 奈々',     `${BASE}/data/staff/346/stf_69c79185cff24.png`],
  ['桜木 めい',     `${BASE}/data/staff/352/stf_69e4445e822e6.jpg`],
  ['五十嵐 あいり', `${BASE}/data/staff/339/stf_69b3ae86e5f7a.jpg`],
  ['優木 まゆみ',   `${BASE}/data/staff/344/stf_69c78a08c1a41.jpg`],
  ['天河 そら',     `${BASE}/data/staff/340/stf_69ba724a18451.jpg`],
  ['与田 ゆず',     `${BASE}/data/staff/338/stf_69b20e598194c.png`],
  ['黒木 あやの',   `${BASE}/data/staff/348/stf_69c89d11e33ad.png`],
  ['永瀬 れな',     `${BASE}/data/staff/319/stf_696c819e1becf.png`],
  ['白石 みらい',   `${BASE}/data/staff/251/stf_68e9d3fe3c60d.png`],
  ['並木 はな',     `${BASE}/data/staff/163/stf_68e9d6450dd39.png`],
  ['綾瀬 春奈',     `${BASE}/data/staff/125/stf_68e9d6b158454.png`],
  ['市乃 あんこ',   `${BASE}/data/staff/186/stf_67cbb88dae2c7.png`],
  ['優希 りおな',   `${BASE}/data/staff/180/stf_697dca062b83d.png`],
  ['月詠 一樺',     `${BASE}/data/staff/134/stf_68ef2589cf629.png`],
  ['七瀬 あいか',   `${BASE}/data/staff/311/stf_69421cd24560a.png`],
  ['望月 りお',     `${BASE}/data/staff/307/stf_69310f67694da.png`],
  ['三国 りか',     `${BASE}/data/staff/275/stf_69df02ddeadfd.jpg`],
  ['桜井 美月',     `${BASE}/data/staff/343/stf_69c334656d9cd.jpg`],
  ['一ノ瀬 えな',   `${BASE}/data/staff/337/stf_69b4a80937d5c.jpg`],
  ['白石 ユリ',     `${BASE}/data/staff/318/stf_6960c5c8bda7c.png`],
  ['星野 あかり',   `${BASE}/data/staff/285/stf_68e9e8fee7ce6.png`],
  ['早乙女 凛',     `${BASE}/data/staff/236/stf_6823ffc606a4d.png`],
  ['瀬川 りな',     `${BASE}/data/staff/323/stf_6978430c289fd.jpg`],
  ['夏目 さあや',   `${BASE}/data/staff/327/stf_697725833df8c.png`],
  ['桃瀬 乃々香',   `${BASE}/data/staff/304/stf_692bafd031b36.jpg`],
  ['楪 櫻子',       `${BASE}/data/staff/330/stf_6983d75588241.png`],
  ['月瀬 莉々菜',   `${BASE}/data/staff/313/stf_6944caad4fcb5.png`],
  ['千秋 藍',       `${BASE}/data/staff/277/stf_68e9d4d594603.png`],
  ['桃瀬 なるみ',   `${BASE}/data/staff/299/stf_69185dade98b0.png`],
  ['神崎 美穂',     `${BASE}/data/staff/291/stf_69058b49881b6.png`],
  ['有馬 かな',     `${BASE}/data/staff/321/stf_697055ea95ce2.png`],
  ['椿 ゆう',       `${BASE}/data/staff/289/stf_68fd620324af2.png`],
  ['桔梗 みなみ',   `${BASE}/data/staff/242/stf_682410184e635.png`],
  ['水城 碧',       `${BASE}/data/staff/292/stf_695f1e4cc7a0e.png`],
  ['丸井 咲',       `${BASE}/data/staff/279/stf_68e9d4fb5827d.png`],
  ['小華つき',      `${BASE}/data/staff/315/stf_6953d0fb9c816.png`],
  ['要 月',         `${BASE}/data/staff/298/stf_6923dcef59a5e.jpg`],
  ['美咲 ひなた',   `${BASE}/data/staff/284/stf_68e9d3e6046a0.png`],
  ['天使ひめか',    `${BASE}/data/staff/293/stf_69086adcc12b6.png`],
  ['北里 せいは',   `${BASE}/data/staff/309/stf_6933acc5c4590.png`],
  ['朝比奈 みお',   `${BASE}/data/staff/316/stf_694df65be3d2b.png`],
  ['花宮 りお',     `${BASE}/data/staff/283/stf_68df35d12ed9a.png`],
  ['宮脇 さり',     `${BASE}/data/staff/258/stf_68beaefb03eeb.png`],
  ['東堂 凛花',     `${BASE}/data/staff/290/stf_690190627e693.png`],
  ['天宮 光菜',     `${BASE}/data/staff/276/stf_68bff64170658.png`],
  ['篠原 美空',     `${BASE}/data/staff/270/stf_68c79ce26d3bc.png`],
  ['桜庭 みゆ',     `${BASE}/data/staff/264/stf_68b14e64b6d2e.png`],
  ['橘 紗耶',       `${BASE}/data/staff/266/stf_68e88cddaca85.png`],
  ['白間 のあ',     `${BASE}/data/staff/254/stf_685b85f54e765.png`],
  ['五十嵐 かすみ', `${BASE}/data/staff/226/stf_67c6608137f9f.png`],
  ['溝端 じゅんな', `${BASE}/data/staff/42/stf_66010adb65c89.png`],
  ['天音 花凛',     `${BASE}/data/staff/171/stf_66aa22bcee63c.png`],
  ['宮嶋 ひろみ',   `${BASE}/data/staff/71/stf_660112c11e563.png`],
  ['吉瀬 みのり',   `${BASE}/data/staff/199/stf_67302abfadeb1.png`],
  ['望月 ゆり',     `${BASE}/data/staff/147/stf_66dd1d0511856.png`],
  ['荒井さら',      `${BASE}/data/staff/219/stf_67db5815525a8.png`],
  ['菊川 みれい',   `${BASE}/data/staff/191/stf_6705e66aa1bfc.png`],
  ['卯月 りか',     `${BASE}/data/staff/175/stf_66aa27a79ebfd.png`],
  ['成瀬 あみ',     `${BASE}/data/staff/249/stf_68478922c11ef.png`],
  ['乙葉 かずは',   `${BASE}/data/staff/91/stf_660107bd6f1bc.png`],
  ['一ノ瀬 奈々',   `${BASE}/data/staff/97/stf_66010825459f1.png`],
  ['神谷 れいか',   `${BASE}/data/staff/129/stf_6601129e283ba.png`],
  ['河崎 舞奈',     `${BASE}/data/staff/280/stf_68d8d00b9ed4c.png`],
  ['有沢 りこ',     `${BASE}/data/staff/256/stf_685f49ae68567.png`],
  ['高橋 るな',     `${BASE}/data/staff/152/stf_662ddb2b0740c.png`],
  ['天野 みつき',   `${BASE}/data/staff/263/stf_6891741de4e62.png`],
  ['葉月 りり',     `${BASE}/data/staff/238/stf_681d783b3b9f4.png`],
  ['灰原 えみり',   `${BASE}/data/staff/259/stf_686790b7a9d61.jpg`],
  ['三吉 けい',     `${BASE}/data/staff/273/stf_68b91a728ea7c.png`],
  ['水川 結愛',     `${BASE}/data/staff/233/stf_680a16ae182d6.png`],
  ['東堂 あやの',   `${BASE}/data/staff/225/stf_6860a4ac42d13.png`],
  ['水月ましろ',    `${BASE}/data/staff/241/stf_681eb1b9e75c3.png`],
  ['七瀬 めい',     `${BASE}/data/staff/172/stf_66dd137ed4ba1.png`],
  ['花井 愛菜',     `${BASE}/data/staff/72/stf_66aa249d02798.png`],
  ['桜 ののか',     `${BASE}/data/staff/130/stf_6788637119ee1.png`],
  ['詠兎きき',      `${BASE}/data/staff/188/stf_66ef3bc1cb9b7.png`],
  ['立花 あおい',   `${BASE}/data/staff/195/stf_67199ed584056.png`],
  ['一色 結菜',     `${BASE}/data/staff/210/stf_676e0545478b1.png`],
  ['菊池真里亜',    `${BASE}/data/staff/193/stf_670c49211d0eb.png`],
  ['伊月 蘭',       `${BASE}/data/staff/223/stf_67c57a5d0b8a1.png`],
  ['吉川 ゆき',     `${BASE}/data/staff/117/stf_66011326456b2.png`],
  ['加茂琴子',      `${BASE}/data/staff/79/stf_6601075bc568f.png`],
  ['小川ゆい',      `${BASE}/data/staff/118/stf_65fff436ddae5.png`],
  ['長谷川 れん',   `${BASE}/data/staff/148/stf_6600f95db4880.png`],
  ['雪白 りおん',   `${BASE}/data/staff/187/stf_67885e2ab7a71.jpg`],
  ['一条 えま',     `${BASE}/data/staff/206/stf_6752561d5b296.png`],
  ['最上 えりか',   `${BASE}/data/staff/90/stf_6601030817eea.png`],
  ['三井 ゆう',     `${BASE}/data/staff/170/stf_66fb579b62b40.png`],
  ['桜井 ひより',   `${BASE}/data/staff/93/stf_66010814656a4.png`],
  ['市川 奏',       `${BASE}/data/staff/40/stf_66010c2bcaa20.png`],
  ['神崎 みなみ',   `${BASE}/data/staff/55/stf_66010412b0e4c.png`],
  ['五十嵐 まき',   `${BASE}/data/staff/181/stf_66fb93ea5bda7.png`],
  ['原 みのり',     `${BASE}/data/staff/127/stf_6601036655f8e.png`],
  ['和泉 紗夜',     `${BASE}/data/staff/239/stf_681c67534df45.png`],
  ['百華 める',     `${BASE}/data/staff/98/stf_660107778a9a2.png`],
  ['田中 もも',     `${BASE}/data/staff/141/stf_660102d6b25a0.png`],
  ['美山 ゆり',     `${BASE}/data/staff/208/stf_675bac2497995.jpg`],
  ['丘月花枝',      `${BASE}/data/staff/111/stf_6600fe256ff57.png`],
  ['佐々木 みるく', `${BASE}/data/staff/356/stf_69f2df630c3d2.jpg`],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const isPng = imageUrl.endsWith('.png');
    const contentType = isPng ? 'image/png' : 'image/jpeg';
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-50)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

if (DRY_RUN) {
  console.log(`【Candy Spa】 ${CANDY_DATA.length}名`);
  CANDY_DATA.slice(0, 8).forEach(([n, u]) => console.log(`  ${n} → ${u.slice(-50)}`));
  if (CANDY_DATA.length > 8) console.log(`  ... 他${CANDY_DATA.length - 8}名`);
  process.exit(0);
}

console.log(`\n=== ${SHOP_ID} (${CANDY_DATA.length}名) ===`);
let inserted = 0, skipped = 0, failed = 0;

for (const [name, imageUrl] of CANDY_DATA) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  // staff ID をファイル名に使用（例: staff/354/stf_xxx.png → candy_354_stf_xxx.png）
  const parts = imageUrl.split('/data/staff/')[1] || '';
  const filePart = parts.replace('/', '_').replace(/[^\w.-]/g, '_').slice(0, 60);
  const ext = imageUrl.endsWith('.png') ? 'png' : 'jpg';
  const fileName = `candy_${filePart}`;
  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(100);

  const { error } = await supabase.from('therapists').insert({
    id, shop_id: SHOP_ID, name, image_url: storageUrl ?? null,
  });
  if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : 'n'); inserted++; }
  await sleep(80);
}

console.log(`\n\n挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
console.log('\n完了');
