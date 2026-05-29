import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const LOGO_URL = 'https://tokyoaroma.jp/wp-content/uploads/2023/12/girl-2554687_1280-1.jpg';

// スライダーに使う飯田橋店のみ更新、他2店舗は元の画像に戻す
const REVERT_URL = 'https://tokyoaroma.jp/wp-content/uploads/2023/12/logo.png.webp';
const UPDATES = [
  { id: 'tokyo_chiyoda_iidabashi_tokyo_aroma_este',          image_url: LOGO_URL },
  { id: 'tokyo_shinjuku_higashishinjuku_tokyo_aroma_este',   image_url: REVERT_URL },
  { id: 'tokyo_shinjuku_nishishinjuku_tokyo_aroma_este',     image_url: REVERT_URL },
];

console.log('更新内容:');
for (const u of UPDATES) console.log(`  ${u.id}\n  → ${u.image_url}`);

const dryRun = process.argv.includes('--dry-run');
if (dryRun) { console.log('\n--dry-run: 更新しません'); process.exit(0); }

for (const u of UPDATES) {
  const { error: upErr } = await supabase.from('shops').update({ image_url: u.image_url }).eq('id', u.id);
  if (upErr) { console.error(u.id, upErr); }
}

if (upErr) { console.error(upErr); process.exit(1); }
console.log(`\n✅ ${ids.length}件のimage_urlを更新しました`);
