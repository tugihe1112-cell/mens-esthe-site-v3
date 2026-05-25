/**
 * THE PREMIUM SPA 麻布十番・六本木 セラピスト写真修正
 * パターン: /data/staff/{id}/stf_{hash}.webp (background-image style)
 * 実行: node scripts/maintenance/fix_premium_spa_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://the-premiumspa.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const PREMIUM_DATA = [
  ['鳥山 あきら', `${BASE}/data/staff/416/stf_6a00b7ab686ff.webp`],
  ['北原 かのん', `${BASE}/data/staff/317/stf_6958d89cbd867.webp`],
  ['西野 ゆい', `${BASE}/data/staff/287/stf_695e48893c5ae.webp`],
  ['月島 なつき', `${BASE}/data/staff/177/stf_661f40e42178a.webp`],
  ['立花 あおい', `${BASE}/data/staff/23/stf_69c748d801238.webp`],
  ['如月 あつき', `${BASE}/data/staff/318/stf_69a79d0a3e658.webp`],
  ['愛月 えり', `${BASE}/data/staff/302/stf_685e9cbf1e999.webp`],
  ['桜 なみ', `${BASE}/data/staff/290/stf_67d7f35ac5763.webp`],
  ['蜜 れあ', `${BASE}/data/staff/320/stf_693191a3069e8.webp`],
  ['桃山 あい', `${BASE}/data/staff/323/stf_69bba13320bd3.webp`],
  ['港 える', `${BASE}/data/staff/397/stf_69cbbb8760e23.webp`],
  ['水川 みお', `${BASE}/data/staff/324/stf_6988b446caf7d.webp`],
  ['夜空 ゆり', `${BASE}/data/staff/244/stf_69dddd5e1f1ac.webp`],
  ['真白 ここ', `${BASE}/data/staff/172/stf_661f40d448b02.webp`],
  ['篠宮 さら', `${BASE}/data/staff/395/stf_69a8798964742.webp`],
  ['華月 りの', `${BASE}/data/staff/407/stf_69b7ef1df1250.webp`],
  ['朝比奈 こはる', `${BASE}/data/staff/304/stf_69bd3d0392c68.webp`],
  ['姫乃 みる', `${BASE}/data/staff/410/stf_69de3a000b4fb.webp`],
  ['天宮 れいか', `${BASE}/data/staff/299/stf_68ea8727cbc4f.webp`],
  ['桜井 蓮', `${BASE}/data/staff/167/stf_661f40c51b3ae.webp`],
  ['三上 ほの', `${BASE}/data/staff/143/stf_67b179325e674.webp`],
  ['氷室 かえで', `${BASE}/data/staff/403/stf_69ae874e854cf.webp`],
  ['愛咲 りあ', `${BASE}/data/staff/399/stf_69d4371542094.webp`],
  ['桜庭 みれい', `${BASE}/data/staff/414/stf_69f4721a11b73.webp`],
  ['花衣 れお', `${BASE}/data/staff/415/stf_69f5d72d104f1.webp`],
  ['夏崎 ひすい', `${BASE}/data/staff/303/stf_6958ddedf1ce1.webp`],
  ['泉 りえ', `${BASE}/data/staff/322/stf_69357dab61c02.webp`],
  ['徳川 るい', `${BASE}/data/staff/401/stf_69c2a91906394.webp`],
  ['萩原 きほ', `${BASE}/data/staff/398/stf_69819698e6cf3.webp`],
  ['風美 るる', `${BASE}/data/staff/240/stf_6958d8a87fbe3.webp`],
  ['水野 こころ', `${BASE}/data/staff/262/stf_66ec337004fd7.webp`],
  ['小野寺 ゆき', `${BASE}/data/staff/409/stf_69b7ef20e34d8.webp`],
  ['水原 るう', `${BASE}/data/staff/264/stf_690b63d48a6ce.webp`],
  ['朝倉 べに', `${BASE}/data/staff/305/stf_6881a2b6aae06.webp`],
  ['桜野 らら', `${BASE}/data/staff/406/stf_69b47a4592358.webp`],
  ['倉島 きょうこ', `${BASE}/data/staff/266/stf_6958ddf115f87.webp`],
  ['九条 れな', `${BASE}/data/staff/412/stf_6a015f0f4a714.webp`],
  ['楪 まりさ', `${BASE}/data/staff/402/stf_69a43897b8ab7.webp`],
  ['黒木 りさ', `${BASE}/data/staff/411/stf_69d37ad219389.webp`],
  ['畑 たまき', `${BASE}/data/staff/276/stf_67547e3739786.webp`],
  ['東條 なな', `${BASE}/data/staff/141/stf_698ebd61cd973.webp`],
  ['大谷 ひな', `${BASE}/data/staff/404/stf_69cd5577a11ba.webp`],
  ['渡辺 きょうか', `${BASE}/data/staff/405/stf_69ad92f6cb3b9.webp`],
  ['川村 れん', `${BASE}/data/staff/413/stf_69e351b82b6b7.webp`],
  ['辻 いちか', `${BASE}/data/staff/166/stf_685f8b9d5e920.webp`],
  ['天音 のの', `${BASE}/data/staff/298/stf_692134e3832dc.webp`],
  ['夜桜 ゆら', `${BASE}/data/staff/301/stf_69888d1dc4a47.webp`],
  ['西 ふうか', `${BASE}/data/staff/400/stf_69a982f40e99b.webp`],
  ['小鳥遊 みさ', `${BASE}/data/staff/319/stf_6950a06372fa9.webp`],
  ['絢瀬みずき', `${BASE}/data/staff/32/stf_661f41542d054.webp`],
  ['篠咲 いおり', `${BASE}/data/staff/118/stf_66e138dfd3e6a.webp`],
  ['天月 かれん', `${BASE}/data/staff/36/stf_66e138e3037e2.webp`],
  ['石川 らん', `${BASE}/data/staff/178/stf_661f40e734812.webp`],
  ['桐谷 みなみ', `${BASE}/data/staff/326/stf_694b4ae16ae33.webp`],
  ['杉本 しおり', `${BASE}/data/staff/258/stf_695515b8c45f1.webp`],
  ['宮本 あゆな', `${BASE}/data/staff/307/stf_68a2de040bffd.webp`],
  ['工藤 りい', `${BASE}/data/staff/311/stf_692121b61993a.webp`],
  ['白鳥 みこと', `${BASE}/data/staff/308/stf_68b14b8e7eb2c.webp`],
  ['東雲 あん', `${BASE}/data/staff/310/stf_68cd7c891838d.webp`],
  ['美月 せな', `${BASE}/data/staff/270/stf_69407cfdc1392.webp`],
  ['黒瀧 めみ', `${BASE}/data/staff/291/stf_68749904c2797.webp`],
  ['椿 ねね', `${BASE}/data/staff/297/stf_684861c34efe5.webp`],
  ['瀬上 れいな', `${BASE}/data/staff/286/stf_687062e705cc9.webp`],
  ['青木 よつば', `${BASE}/data/staff/293/stf_68feb5bb62825.webp`],
  ['田中 みな', `${BASE}/data/staff/249/stf_676d5d32959ed.webp`],
  ['一条 あや', `${BASE}/data/staff/254/stf_67fc051fce9c3.webp`],
  ['片瀬 ゆず', `${BASE}/data/staff/250/stf_67625cdf33c72.webp`],
  ['一ノ瀬 ゆめ', `${BASE}/data/staff/173/stf_661f40d764a65.webp`],
  ['道枝 ノア', `${BASE}/data/staff/170/stf_661f40ce22102.webp`],
  ['夏美 なつみ', `${BASE}/data/staff/275/stf_6755b1bade074.webp`],
  ['渋谷 えな', `${BASE}/data/staff/261/stf_66faa2be1193d.webp`],
  ['小峰 のぞみ', `${BASE}/data/staff/153/stf_66201ff6088b5.webp`],
  ['鳳 うらら', `${BASE}/data/staff/142/stf_661f409f9546d.webp`],
  ['星 あいか', `${BASE}/data/staff/253/stf_668667c4b48c5.webp`],
  ['本田 えみり', `${BASE}/data/staff/164/stf_661f40bb51436.webp`],
  ['菊池 ひなみ', `${BASE}/data/staff/179/stf_661f40ea544fe.webp`],
  ['七瀬 ゆあ', `${BASE}/data/staff/190/stf_661f410f87d8b.webp`],
  ['日向 はな', `${BASE}/data/staff/184/stf_661f40f969c39.webp`],
  ['黒沢 みりあ', `${BASE}/data/staff/185/stf_661f40fca0fdc.webp`],
  ['望月 まな', `${BASE}/data/staff/191/stf_661f411292523.webp`],
  ['妃 りか', `${BASE}/data/staff/218/stf_662ba9770588e.webp`],
  ['桃瀬 はるか', `${BASE}/data/staff/197/stf_661f412576f2d.webp`],
  ['柊 ふゆか', `${BASE}/data/staff/200/stf_661f412ece0e7.webp`],
  ['有栖 りこ', `${BASE}/data/staff/198/stf_661f41288ad7b.webp`],
  ['二ノ宮 もえ', `${BASE}/data/staff/201/stf_661f41321130e.webp`],
  ['楠 みう', `${BASE}/data/staff/205/stf_661fc7a9612bc.webp`],
  ['椿 あんな', `${BASE}/data/staff/202/stf_661f41352686a.webp`],
  ['桃乃木 もも', `${BASE}/data/staff/206/stf_661fc7ac7fd01.webp`],
  ['永瀬 もな', `${BASE}/data/staff/207/stf_661f41447f4c6.webp`],
  ['渚 りお', `${BASE}/data/staff/214/stf_661f41627f687.webp`],
  ['真島 ちゃみ', `${BASE}/data/staff/213/stf_661f415f447cf.webp`],
  ['南 えま', `${BASE}/data/staff/208/stf_668a8eb80d1f7.webp`],
  ['中村 あすか', `${BASE}/data/staff/210/stf_661f414d953c3.webp`],
  ['大倉 さいか', `${BASE}/data/staff/211/stf_661f41592c14d.webp`],
  ['三井 セイラ', `${BASE}/data/staff/209/stf_661f414abe553.webp`],
  ['神城 美奈', `${BASE}/data/staff/216/stf_66257a079f30a.webp`],
  ['花咲 ねね', `${BASE}/data/staff/217/stf_661f416b45003.webp`],
  ['板野 みゆう', `${BASE}/data/staff/219/stf_661f41715e815.webp`],
  ['椎名 ゆりか', `${BASE}/data/staff/220/stf_661f4174723b4.webp`],
  ['音羽 こころ', `${BASE}/data/staff/222/stf_661f417acca0e.webp`],
  ['恵南 みかな', `${BASE}/data/staff/224/stf_661f4180ee5ec.webp`],
  ['結城 れみ', `${BASE}/data/staff/225/stf_661f418409429.webp`],
  ['月白 みやび', `${BASE}/data/staff/227/stf_661f418a0458d.webp`],
  ['宝 ののん', `${BASE}/data/staff/226/stf_661f418743138.webp`],
  ['真琴 きき', `${BASE}/data/staff/280/stf_677bc326927e7.webp`],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const ext = imageUrl.endsWith('.webp') ? 'webp' : 'jpg';
    const contentType = ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-50)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

// 対象店舗をDBから取得
const { data: shops } = await supabase.from('shops')
  .select('id, name')
  .ilike('website_url', '%premiumspa%');

if (!shops || shops.length === 0) {
  console.log('THE PREMIUM SPA の店舗が見つかりません');
  process.exit(1);
}
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  console.log(`【THE PREMIUM SPA】 ${PREMIUM_DATA.length}名`);
  PREMIUM_DATA.slice(0, 5).forEach(([n, u]) => console.log(`  ${n} → ${u.slice(-50)}`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, imageUrl] of PREMIUM_DATA) {
  // 全店舗の中でこの名前のセラピストを検索
  const { data: therapists } = await supabase.from('therapists')
    .select('id, shop_id, image_url')
    .in('shop_id', shopIds)
    .eq('name', name);

  if (!therapists || therapists.length === 0) {
    process.stdout.write('?'); notFound++; continue;
  }

  // 画像なしのもののみ更新
  const nullOnes = therapists.filter(t => !t.image_url);
  if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }

  // 画像をアップロード（全店舗で共用）
  const staffId = imageUrl.match(/\/staff\/(\d+)\//)?.[1] || name;
  const ext = imageUrl.endsWith('.webp') ? 'webp' : 'jpg';
  const fileName = `premium_spa_${staffId}.${ext}`;
  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(100);

  // 該当する全therapistレコードを更新
  for (const t of nullOnes) {
    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl ?? null })
      .eq('id', t.id);
    if (error) { console.log(`\n❌ ${name} (${t.shop_id}): ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : 'n'); updated++; }
  }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / スキップ ${skipped}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
console.log('\n完了');
