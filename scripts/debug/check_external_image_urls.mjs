/**
 * check_external_image_urls.mjs — 画像URLの棚卸し
 *
 * therapists/shops の image_url を「R2 / null / 外部CDN」に分類し、
 * 外部をドメイン別に件数集計する。→ R2再移行バッチ(migrate_external_images_to_r2.mjs)の規模と対象を確定する。
 *
 * 実行: node scripts/debug/check_external_image_urls.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const R2 = ['.r2.dev', 'r2.cloudflarestorage.com'];
const isR2 = (u) => R2.some((d) => u.includes(d));
const domainOf = (u) => { try { return new URL(u).hostname; } catch { return '(不正URL)'; } };

async function scan(table) {
  let rNull = 0, rR2 = 0, rExt = 0;
  const extByDomain = {};
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select('image_url').range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    for (const row of data) {
      const u = (row.image_url || '').trim();
      if (!u) { rNull++; continue; }
      if (isR2(u)) { rR2++; continue; }
      rExt++;
      const d = domainOf(u);
      extByDomain[d] = (extByDomain[d] || 0) + 1;
    }
    if (data.length < PAGE) break;
  }
  return { rNull, rR2, rExt, extByDomain };
}

async function main() {
  for (const table of ['therapists', 'shops']) {
    const { rNull, rR2, rExt, extByDomain } = await scan(table);
    const total = rNull + rR2 + rExt;
    console.log(`\n=== ${table} (計${total}) ===`);
    console.log(`  R2   : ${rR2}`);
    console.log(`  null : ${rNull}`);
    console.log(`  外部 : ${rExt}`);
    if (rExt > 0) {
      console.log(`  ── 外部ドメイン別（多い順）──`);
      Object.entries(extByDomain).sort((a, b) => b[1] - a[1]).slice(0, 25)
        .forEach(([d, n]) => console.log(`    ${String(n).padStart(6)}  ${d}`));
    }
  }
  console.log('\n👉 「外部」がwsrv経由で遅い/失敗している対象。migrate_external_images_to_r2.mjs でR2へ移す（取得不可はnull化）。\n');
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
