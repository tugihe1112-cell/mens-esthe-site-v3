/**
 * Pure White 全修正
 * 1. 旧ID (1186_1/2/3) 削除
 * 2. kyoto_senbon_sanjo_pure_white の city/area を 千本三条 に修正
 * 3. セラピスト画像を外部URL→Supabase Storage に再アップロード
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// 1. 旧ID削除
// ============================================================
console.log('=== 1. 旧ID削除 (1186_1/2/3) ===');
for (const id of ['1186_1', '1186_2', '1186_3']) {
  const { data } = await supabase.from('shops').select('id').eq('id', id).maybeSingle();
  if (!data) { console.log(`  スキップ(存在しない): ${id}`); continue; }
  await supabase.from('therapists').delete().eq('shop_id', id);
  const { error } = await supabase.from('shops').delete().eq('id', id);
  console.log(error ? `  ❌ ${id}: ${error.message}` : `  ✅ 削除: ${id}`);
}

// ============================================================
// 2. city/area 修正
// ============================================================
console.log('\n=== 2. city/area 修正 (二条 → 千本三条) ===');
const PW_ID = 'kyoto_senbon_sanjo_pure_white';
const { data: shop } = await supabase.from('shops').select('raw_data').eq('id', PW_ID).single();
const updated = { ...shop.raw_data, city: '千本三条', area: '千本三条' };
const { error: cityErr } = await supabase.from('shops').update({ raw_data: updated }).eq('id', PW_ID);
console.log(cityErr ? `  ❌ ${cityErr.message}` : `  ✅ city/area → 千本三条`);

// ============================================================
// 3. セラピスト画像 Storage 再アップロード
// ============================================================
console.log('\n=== 3. セラピスト画像 Storage 再アップロード ===');
const { data: therapists } = await supabase.from('therapists')
  .select('id,name,image_url')
  .eq('shop_id', PW_ID);

console.log(`  対象: ${therapists?.length}名`);
let ok = 0, fail = 0, skip = 0;

for (const t of (therapists || [])) {
  if (!t.image_url) { skip++; continue; }

  // すでにStorageにある場合はスキップ
  if (t.image_url.includes('supabase.co/storage')) { skip++; continue; }

  try {
    const res = await fetch(t.image_url, {
      headers: { ...ua, 'Referer': 'https://purewhite-aroma.com/' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { fail++; process.stdout.write('x'); continue; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) { fail++; process.stdout.write('x'); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) { fail++; process.stdout.write('x'); continue; }

    const ext = 'jpg';
    const fileName = `${t.id.replace(/[^\w-]/g, '_')}.${ext}`;
    const { error: upErr } = await supabase.storage.from('therapist-images')
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });

    if (upErr) {
      // Storage失敗時はReferer付きURLをそのまま保持（変更なし）
      fail++;
      process.stdout.write('s');
    } else {
      const publicUrl = supabase.storage.from('therapist-images').getPublicUrl(fileName).data.publicUrl;
      const { error: dbErr } = await supabase.from('therapists').update({ image_url: publicUrl }).eq('id', t.id);
      if (dbErr) { fail++; process.stdout.write('e'); }
      else { ok++; process.stdout.write('.'); }
    }
  } catch {
    fail++;
    process.stdout.write('x');
  }
  await sleep(100);
}

console.log(`\n  ✅ 成功: ${ok}名, ❌ 失敗: ${fail}名, ⏭ スキップ: ${skip}名`);

// 最終確認
const { data: after } = await supabase.from('shops').select('raw_data,image_url').eq('id', PW_ID).single();
const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', PW_ID).not('image_url', 'is', null);
console.log(`\n=== 最終確認 ===`);
console.log(`  city: ${after?.raw_data?.city}`);
console.log(`  shop image_url: ${after?.image_url ? '✅' : '❌'}`);
console.log(`  画像ありセラピスト: ${count}名`);
console.log('\n完了');
