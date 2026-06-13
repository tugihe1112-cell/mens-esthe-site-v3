/**
 * fix_chrome_found_images.mjs
 * Chrome で手動確認して見つけた画像を一括適用する
 * node scripts/maintenance/fix_chrome_found_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const UPDATES = [
  {
    shop_id: 'kanagawa_atsugi_aroma_guild',
    image_url: 'https://www.atsugi-aroma-guild.com/images/mc_1_1_2273.jpg?06',
    note: '厚木アロマギルド → キャスト写真 (bg CSS から取得)',
  },
  {
    shop_id: 'osaka_shinsosaka_彼女ん家',
    image_url: 'https://kanojonti.com/upload/back_image/29.jpg',
    note: '彼女ん家 → 背景画像 (esthe-zukan バナーを修正)',
  },
  {
    // みるくSPA: website_url も milk-spa.com → milkspa-a.com に修正
    shop_id: 'osaka_shinsosaka_みるくspa',
    image_url: 'https://milkspa-a.com/images/store/c205219a05b3adb840793c8b27b12ab3729d1d25/5bdaaeb43dd9364f309081ea88263cf2e5486cf0.jpg?1781298837',
    website_url: 'https://milkspa-a.com/',
    note: 'みるくSPA → 正しいURL(milkspa-a.com)に修正 + 店舗写真を設定',
  },
];

console.log(`${isDryRun ? '[DRY RUN] ' : ''}Chrome確認分 ${UPDATES.length}件更新\n`);

let updated = 0;

for (const entry of UPDATES) {
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name, website_url, image_url')
    .eq('id', entry.shop_id);

  if (!shops?.length) {
    console.log(`⚠️  shop_id not found: ${entry.shop_id}`);
    continue;
  }

  for (const shop of shops) {
    console.log(`📸 ${shop.name} (${shop.id})`);
    console.log(`   画像: ${shop.image_url || '(null)'} → ${entry.image_url}`);
    if (entry.website_url) {
      console.log(`   URL:  ${shop.website_url} → ${entry.website_url}`);
    }
    console.log(`   備考: ${entry.note}`);

    if (!isDryRun) {
      const patch = { image_url: entry.image_url };
      if (entry.website_url) patch.website_url = entry.website_url;
      const { error } = await supabase.from('shops').update(patch).eq('id', shop.id);
      if (error) console.log(`   ❌ ${error.message}`);
      else { console.log(`   ✅ 更新完了`); updated++; }
    } else {
      updated++;
    }
    console.log();
  }
}

console.log(`完了: ${updated}件更新`);
console.log(`\n--- 残りサイトダウン確認済み (画像取得不可) ---`);
const down = [
  'Eren 5店舗 (eren.tokyo → me404)',
  'ビコーズ (ms-because.tokyo → me404)',
  'Deep Chill (deep-chill.info → me404)',
  'FLYING SPA (flyingspa.jp → 2026/5/31 閉店)',
  'AROMA CASTLE / Pattaya Resort / 今日子の姉妹 / Anela Spa → ドメイン失効',
  'キューピット / HotLand → サイトダウン',
  'Karlovy / ZEPHYR / 天界のスパ中目黒 (tennesu.com) → SSL エラー',
  'Melty Aroma (crayonsite) / 昼顔 → 404',
  'Riz → 403',
  'RESORT (resort-h.net) → SSL エラー',
  'bulan (ameblo) / Room one → 画像なし',
];
down.forEach(d => console.log(`  ⚫ ${d}`));
