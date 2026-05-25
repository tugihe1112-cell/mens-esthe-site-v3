/**
 * ゴールデン（中野）セラピスト登録
 * パターン: article.item > [style*="background-image"] + ⭐️名前⭐️テキスト
 * 画像: wp-content/uploads → Supabase Storage にアップ（ホットリンク保護あり）
 * 実行: node scripts/maintenance/process_golden_nakano.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://golden0508.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOP_ID = 'tokyo_nakano_golden';

if (DRY_RUN) console.log('[DRY RUN]\n');

const WP = BASE + '/wp-content/uploads/';

// Chrome から取得した58名データ
const GOLDEN_DATA = [
  ['おとは',  WP+'2025/06/059F2397-5EF3-401F-8DE6-5C167CF49775-520x520.jpeg'],
  ['もえ',    WP+'2026/04/BD9F73AE-086A-4315-9227-FF645D820CB7-520x520.jpeg'],
  ['あや',    WP+'2024/10/6EA20DD9-674F-4438-BC11-8176D17A89EA-520x520.jpeg'],
  ['みさき',  WP+'2026/04/D95F7E39-2E35-4D65-B1A7-0D0B6E11FA3A-520x520.jpeg'],
  ['あやか',  WP+'2026/04/C9DFF6D1-4EEC-4102-9513-EF87C1D7F1E6-520x520.jpeg'],
  ['さら',    WP+'2026/04/553D5FAB-911F-4606-AD4A-FF329C5370A8-520x520.jpeg'],
  ['らら',    WP+'2026/04/4928C01C-6883-4037-86F4-8BD225EC186D-520x520.jpeg'],
  ['めい',    WP+'2026/04/1A835B22-AC1D-4488-A28D-D3DECED2FB95-520x520.jpeg'],
  ['みく',    WP+'2025/02/64EDB790-E749-4B80-B3AC-92AAE8F3F092-520x520.jpeg'],
  ['かれん',  WP+'2026/03/FD86B4B0-B216-4D88-8C84-D2F53069EF30-520x520.jpeg'],
  ['みやび',  WP+'2026/02/5C18128A-3495-425A-B57D-D7C93A43A477-520x520.jpeg'],
  ['なぎさ',  WP+'2026/02/A1F4858C-6417-48D5-816B-076B8AC13398-520x520.jpeg'],
  ['しゅな',  WP+'2026/02/3ED9854C-0EB2-4245-A221-4F4146835A93-520x520.jpeg'],
  ['るな',    WP+'2026/01/BBDFA528-B618-4724-A3C4-A04E7D94CAEC-520x520.jpeg'],
  ['あいる',  WP+'2025/12/B84EB808-6866-4DA3-B330-97722A48D805-520x520.jpeg'],
  ['はるか',  WP+'2025/11/5334AF3A-7873-4D06-AA7E-57E615CDBEB0-520x520.jpeg'],
  ['ねね',    WP+'2025/11/A8DE228B-4947-4165-9C65-83E6079B87C8-520x520.jpeg'],
  ['ゆきの',  WP+'2025/09/81EED8D5-5E43-4F54-8664-3D66AF30FF41-520x520.jpeg'],
  ['ゆあ',    WP+'2025/08/93D0553F-9184-41F7-93D8-0D34211B561B-520x520.jpeg'],
  ['みるく',  WP+'2025/06/81052204-5BF1-4D0E-8957-82F2B2C17AA5-520x520.jpeg'],
  ['まゆ',    WP+'2025/05/10542E3B-69B2-48C3-8A9E-89405163E45D-520x520.jpeg'],
  ['ななみ',  WP+'2025/03/4AC1C9DB-4B65-4C45-81F5-05BED9828667-520x520.jpeg'],
  ['みゆ',    WP+'2025/03/7965BAB9-A3E8-4AB1-86F7-66A82FE33C05-520x520.jpeg'],
  ['るい',    WP+'2024/08/5F1392CE-F5F7-4EB0-B828-9FC21A72E27F-520x520.jpeg'],
  ['まな',    WP+'2024/03/312987B0-000A-4A41-AAE1-80D6B14D1030-520x520.jpeg'],
  ['いずみ',  WP+'2024/05/4D751038-F230-42C2-B430-BFB705079F26-520x520.jpeg'],
  ['あやね',  WP+'2024/03/CDA45166-6ABB-4512-AAC2-751CC880C253-520x520.jpeg'],
  ['こころ',  WP+'2024/06/37E4F77B-9DEC-4C0C-8D11-D64BA33DC623-520x520.jpeg'],
  ['ゆな',    WP+'2024/02/316C97CD-76E5-4AF9-9F83-0BD16D6382E8-520x520.jpeg'],
  ['ちあき',  WP+'2023/11/CA3A31CB-55BA-43EA-A0FD-533AC0513C13-520x520.jpeg'],
  ['ひかり',  WP+'2024/12/61A7BDD3-11A8-4070-8437-A6BA4D158552-520x520.jpeg'],
  ['すい',    WP+'2026/03/F6D2D008-86A9-430D-93D5-3776BAD5A65E-520x520.jpeg'],
  ['ひな',    WP+'2026/01/F637108D-9A03-4910-B94B-FB77EEC85D93-520x520.jpeg'],
  ['もね',    WP+'2025/06/22C2B0C6-F672-42E8-8ABC-BB8B059BD960-520x520.jpeg'],
  ['りな',    WP+'2024/07/746AB9CF-5E9A-407D-888F-E7D09F6D71EE-520x520.jpeg'],
  ['あくあ',  WP+'2025/07/F05431F9-6904-4430-86AE-29EAE8964416-520x520.jpeg'],
  ['ほのか',  WP+'2025/10/8E39D1B5-A45C-4DF8-A846-EE030ACB1E38-520x520.jpeg'],
  ['りの',    WP+'2025/11/FCF65D73-82CB-428B-ACF0-9B171268A119-520x520.jpeg'],
  ['ゆりあ',  WP+'2023/11/EA7643C9-847B-48F3-AD1F-EA25DA207A9E-520x520.jpeg'],
  ['れむ',    WP+'2025/06/2A5E19B6-88C4-4CA1-9A07-7FC7228CB302-520x520.jpeg'],
  ['むつき',  WP+'2024/11/11AD0E90-7FD2-4FB6-B906-9ED0235BD88C-520x520.jpeg'],
  ['なな',    WP+'2024/04/8CE08543-3B2B-4A44-B668-8F4136BBF178-520x520.jpeg'],
  ['ひめり',  WP+'2025/12/932B51C6-184D-4CFA-ABA0-B0571F6E4D97-520x520.jpeg'],
  ['ひめの',  WP+'2025/06/764C3157-5568-47C6-8B55-CEB05830DC8A-520x520.jpeg'],
  ['まどか',  WP+'2025/06/074F612F-CCD9-4297-89B0-36A4CA08F216-520x520.jpeg'],
  ['なみ',    WP+'2025/03/B1E21A6B-E83D-4038-8532-CD94387AD4F4-520x520.jpeg'],
  ['あすか',  WP+'2025/07/948CA95C-1E93-4C43-B075-F94A45447F6A-520x520.jpeg'],
  ['あやせ',  WP+'2025/07/358B6E35-9D2C-4977-9D39-21B813912DBA-520x520.jpeg'],
  ['しお',    WP+'2024/08/3697AA8A-051C-4280-A3F2-53C4A69548F8-520x520.jpeg'],
  ['さくら',  WP+'2025/10/593E62A5-D77E-4931-AA91-B4525038C2FB-520x520.jpeg'],
  ['りり',    WP+'2024/11/BF789182-6383-49C8-96C0-1401AC50CF70-520x520.jpeg'],
  ['いろは',  WP+'2025/01/C95C4BD4-63B0-4C99-B9AB-939AE5A59CCD-520x520.jpeg'],
  ['そら',    WP+'2024/06/E9A17B58-F268-428D-AB00-1E2EAE176672-520x520.jpeg'],
  ['うぃ',    WP+'2023/10/786F9114-3C5D-4636-974D-AC9F01D705F8-520x520.jpeg'],
  ['ましろ',  WP+'2024/06/EA0BAA6D-2CE0-44D6-AF2D-7006E7BE8F71-520x520.jpeg'],
  ['ひまり',  WP+'2024/12/9147618D-CE6A-48C3-9FAB-970636E200A8-520x520.jpeg'],
  ['きらら',  WP+'2024/11/BDF961E0-95E7-4C0A-8CBB-FAA1F3A8DAE5-520x520.jpeg'],
  ['もも',    WP+'2025/05/430F9735-07DF-4D69-94EB-25C1695B5BD4-520x520.jpeg'],
];

async function uploadImage(imageUrl, fileName) {
  try {
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
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

if (DRY_RUN) {
  console.log(`【ゴールデン（中野）】 ${GOLDEN_DATA.length}名`);
  GOLDEN_DATA.slice(0, 8).forEach(([n, u]) => console.log(`  ${n} → ${u.slice(-50)}`));
  if (GOLDEN_DATA.length > 8) console.log(`  ... 他${GOLDEN_DATA.length - 8}名`);
  process.exit(0);
}

console.log(`\n=== ${SHOP_ID} (${GOLDEN_DATA.length}名) ===`);
let inserted = 0, skipped = 0, failed = 0;

for (const [name, imageUrl] of GOLDEN_DATA) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  // wp-content UUID をファイル名に使用（衝突防止）
  const uuid = imageUrl.match(/([A-F0-9-]{36})-520x520/i)?.[1] || name;
  const fileName = `golden_${uuid}.jpg`;
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
