import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const BUCKET = 'therapist-images';

// 日本語ファイル名のためStorage keyエラーになった4名 → ASCII keyで再登録
const FIXES = [
  { name: '結城なの', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2024/03/結城なの3.jpg',   storageKey: 'futarikiri_yukino3.jpg'   },
  { name: '今井きい', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2024/03/今井きい1.jpg',  storageKey: 'futarikiri_imai1.jpg'     },
  { name: '櫻りい',   imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2026/03/櫻りい1.jpg',    storageKey: 'futarikiri_sakura1.jpg'   },
  { name: '皆川める', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2026/05/皆川１.jpg',    storageKey: 'futarikiri_minagawa1.jpg' },
];

const SHOP_ID = 'nagano_matsumoto_futarikiri_spa';
const REFERER = 'https://futarikiri-spa.com/';

async function uploadImage(imgUrl, storageKey) {
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': REFERER },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.error(`  fetch ${res.status}: ${imgUrl}`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || 'image/jpeg';
    const { error } = await supabase.storage.from(BUCKET).upload(storageKey, buf, { contentType: ct, upsert: true });
    if (error) { console.error('  Storage error:', error.message); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(storageKey).data.publicUrl;
  } catch (e) {
    console.error('  Error:', e.message);
    return null;
  }
}

for (const t of FIXES) {
  console.log(`${t.name}:`);
  const imageUrl = await uploadImage(t.imgUrl, t.storageKey);
  if (imageUrl) {
    const { error } = await supabase.from('therapists')
      .update({ image_url: imageUrl })
      .eq('id', `${SHOP_ID}_${t.name}`);
    console.log(`  ${error ? '❌ ' + error.message : '✅ ' + imageUrl}`);
  } else {
    console.log('  ⚠️ upload失敗');
  }
}
