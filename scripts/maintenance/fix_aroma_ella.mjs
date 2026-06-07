/**
 * Aroma ELLA セラピスト登録修正スクリプト (30名)
 * 動的取得が失敗したため、Chrome収集データをハードコード
 *
 * 実行:
 *   node scripts/maintenance/fix_aroma_ella.mjs --dry-run
 *   node scripts/maintenance/fix_aroma_ella.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const SHOP_ID = 'tokyo_mitaka_mitaka_aroma_ella';
const S3 = 'https://aromaella-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/';

const THERAPISTS = [
  ['南せり',   '139', 'b7a5be44-5703-446e-8e44-e48bda2f6401.jpg'],
  ['百瀬きこ', '138', '8cb0b587-5663-4d68-9db5-9bca73ce61fb.jpg'],
  ['藍川しずく','137', 'c20f67cf-8fd0-465e-8bc7-bd166ba3fd6a.jpg'],
  ['浅香じゅり','134', '0d30bfe9-a09f-44e0-8cea-271a9a2a0c4b.jpg'],
  ['青葉りんか','117', 'fbd0bef7-de54-41cc-b6ec-82b61bafbebb.jpg'],
  ['葵ゆず',   '46',  '437bc345-5800-4d9b-b4dd-968c8d604743.jpg'],
  ['綾瀬ゆり', '130', 'ca00e8f3-4cc2-4c1d-a6d8-a061e1e520ff.jpg'],
  ['渚',       '93',  '48af3079-d7c8-406e-aa64-d5e564837bc1.jpg'],
  ['白河みく', '136', 'd0803531-7b8a-44b5-9ab2-87850f9e0fe0.jpg'],
  ['稲田りお', '90',  '4e9b2ed1-f5a1-41ec-bdcc-0f7c91d48977.jpg'],
  ['阿部まいか','127', '1a514509-fba4-4d62-9743-3368212c9268.jpg'],
  ['林みう',   '122', 'd3f6bcfe-7e45-4165-bb4d-211426607c11.jpg'],
  ['新田ゆな', '129', 'abeee647-6c5e-4cf8-8c26-1c4e2ece61e4.jpg'],
  ['佐伯ふゆか','133', '19a29639-ad61-4c2d-bf8e-0e98123cd48f.jpg'],
  ['白咲みさ', '53',  '72f9de7d-533c-437a-8ad8-bd0b3219eaed.jpg'],
  ['七瀬ひなの','113', '8656bece-6ec9-48ec-bbbd-89dc16dae93b.jpg'],
  ['瑞木',     '105', 'a7753da9-888e-444a-b04c-63507620cbe6.jpg'],
  ['佐久間まい','132', 'a750a388-b5a7-49e5-8289-9d83bc1b61bb.jpg'],
  ['南里あいか','49',  '3cf0d95f-29c7-4e22-be00-5d42664cf770.jpg'],
  ['島風のあ', '59',  '85154eb2-af20-49e8-b14f-536b68bb7614.jpg'],
  ['望月あかね','75',  '25f7ad68-28c5-4e1c-87f0-279b75575241.jpg'],
  ['来栖',     '107', 'cfcf35c0-bcc6-40aa-992f-e01adbbda5c2.jpg'],
  ['美里',     '109', 'd56fd5c3-4a68-4e59-be64-67ff85f83d41.jpg'],
  ['宇佐美',   '97',  'db76adf0-5f3d-4dcc-b528-3e2ef4542949.jpg'],
  ['金澄りん', '79',  '93562c04-3881-4a54-81fa-36660546ca8b.jpg'],
  ['月森まお', '121', 'c101e438-84ac-4cf3-ab27-4414cf6a92c0.jpg'],
  ['金城ののな','111', '6a7d4202-bed8-4c02-a885-a5c770606f38.jpg'],
  ['山下ゆずき','87',  'c9dc2b87-9f10-4035-b679-1533b076d007.jpg'],
  ['美澄ゆい', '128', 'fda90a24-1148-437e-b76f-eb3fa39e23b5.jpg'],
  ['美波',     null,  null],
].map(([name, imgId, file]) => ({
  name,
  src: imgId ? `${S3}${imgId}/${file}` : null,
  key: imgId ? `ella_${imgId}` : null,
}));

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function main() {
  console.log(`=== Aroma ELLA ${THERAPISTS.length}名 (DRY_RUN=${DRY_RUN}) ===`);
  let ins = 0, skp = 0, err = 0;
  for (const t of THERAPISTS) {
    const tid = `${SHOP_ID}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = (!DRY_RUN && t.src && t.key)
      ? await uploadImage(t.src, t.key)
      : (DRY_RUN && t.src ? '(preview)' : null);
    if (DRY_RUN) { process.stdout.write(url ? '+' : 'n'); ins++; continue; }
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: SHOP_ID, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { err++; process.stdout.write('x'); }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n挿入:${ins} スキップ:${skp} エラー:${err}`);
}
main().catch(console.error);
