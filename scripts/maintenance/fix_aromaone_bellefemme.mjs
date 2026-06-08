/**
 * Aroma one 名前修正 + belle femme セラピスト登録
 * - Aroma one: 「ふわりの画像」→「ふわり」サフィックス除去
 * - belle femme: estama CDN (cast/main) パターンで再取得
 * 実行: node scripts/maintenance/fix_aromaone_bellefemme.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ===== PART 1: Aroma one 名前修正 =====
console.log('=== PART 1: Aroma one 名前修正 ===\n');

const AROMA_ONE_ID = 'osaka_nippombashi_aromaoneアロマワン';

const { data: aromaTherapists } = await supabase
  .from('therapists')
  .select('id, name')
  .eq('shop_id', AROMA_ONE_ID)
  .ilike('name', '%の画像');

console.log(`「の画像」付きレコード: ${aromaTherapists?.length || 0}件`);

if (aromaTherapists?.length) {
  for (const t of aromaTherapists) {
    const fixedName = t.name.replace(/の画像$/, '').trim();
    // 既存の正しい名前のレコードが存在するか確認
    const { data: existing } = await supabase
      .from('therapists')
      .select('id')
      .eq('shop_id', AROMA_ONE_ID)
      .eq('name', fixedName)
      .neq('id', t.id);

    if (existing?.length) {
      // 重複するので削除
      console.log(`  重複削除: "${t.name}" (正しい"${fixedName}"が存在)`);
      if (!DRY_RUN) {
        await supabase.from('therapists').delete().eq('id', t.id);
      }
    } else {
      // 名前を修正、IDも更新
      const newId = `${AROMA_ONE_ID}_${fixedName}`;
      console.log(`  修正: "${t.name}" → "${fixedName}"`);
      if (!DRY_RUN) {
        // 新しいIDで挿入してから古いものを削除
        const { data: origFull } = await supabase.from('therapists').select('*').eq('id', t.id).single();
        if (origFull) {
          const { error: insErr } = await supabase.from('therapists').insert({
            ...origFull, id: newId, name: fixedName
          });
          if (!insErr) {
            await supabase.from('therapists').delete().eq('id', t.id);
            process.stdout.write('✓');
          } else {
            // ID重複の場合は名前だけ更新
            await supabase.from('therapists').update({ name: fixedName }).eq('id', t.id);
            process.stdout.write('u');
          }
        }
      }
    }
  }
  process.stdout.write('\n');
  console.log(`  完了\n`);
}

// ===== PART 2: belle femme 登録 =====
console.log('=== PART 2: belle femme 登録 ===\n');

const BELLE_FEMME_URL = 'https://osaka-bellefemme.com/top';
const BELLE_FEMME_DOMAIN = 'osaka-bellefemme.com';

const { data: bfShops } = await supabase.from('shops').select('id,name').ilike('website_url', `%${BELLE_FEMME_DOMAIN}%`);
if (!bfShops?.length) {
  console.log('belle femme shop not found');
} else {
  const shopId = bfShops[0].id;
  console.log(`shop_id: ${shopId}`);

  const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
  if (count > 0) {
    console.log(`既存 ${count}件あり → スキップ`);
  } else {
    // belle femme は estama CDN (img.estama.jp/cast/main) パターン
    const cleanBase = BELLE_FEMME_URL.replace(/\/top$/, '');
    const urls = [cleanBase + '/', cleanBase + '/top', BELLE_FEMME_URL];
    let results = [];
    const seen = new Set();

    for (const url of urls) {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      $('img[src*="cast/main"], img[src*="cast/thumb"], img[src*="cast/"]').each((_, el) => {
        const src = $(el).attr('src') || '';
        if (src.includes('/100x100/') || src.includes('noimage')) return;
        const alt = $(el).attr('alt') || '';
        let name = alt.trim();
        name = name.replace(/^[^\)）]*[\)）]\s*/, '').trim(); // "belle femme(ベルファーム)" prefix
        const parts = name.split(/\s+/);
        name = parts[parts.length - 1];
        name = name.replace(/\(\d+\)$/, '').replace(/（\d+）$/, '').replace(/さん$/, '').trim();
        if (!name || name.length > 15) return;
        if (!/[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(name)) return;
        if (/出勤|速報|体験入店|イベント|求人/i.test(name)) return;
        if (seen.has(name)) return;
        seen.add(name);
        const imgUrl = src.startsWith('http') ? src.split('?')[0] : `${cleanBase}${src.split('?')[0]}`;
        results.push({ name, rawImgUrl: imgUrl });
      });

      if (results.length > 0) { console.log(`  URL: ${url} → ${results.length}名`); break; }
    }

    if (results.length === 0) {
      console.log('  ⚠️ 取得できず（JS描画の可能性 → Chrome必要）');
    } else {
      results.slice(0, 5).forEach(t => console.log(`  ${t.name}  ${t.rawImgUrl?.slice(0, 65)}`));
      if (!DRY_RUN) {
        let added = 0;
        for (const t of results) {
          let imageUrl = null;
          if (t.rawImgUrl) {
            try {
              const imgRes = await fetch(t.rawImgUrl.split('?')[0], { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
              if (imgRes.ok) {
                const buf = Buffer.from(await imgRes.arrayBuffer());
                const ext = t.rawImgUrl.split('.').pop().toLowerCase().replace(/[^a-z]/g,'') || 'jpg';
                const fileBase = t.rawImgUrl.split('/').pop().replace(/[^a-z0-9._]/gi,'_').slice(0,40);
                const key = `bellefemme_${fileBase}.${ext === 'jpg' ? 'jpg' : ext}`;
                const { error } = await supabase.storage.from('therapist-images').upload(key, buf, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
                if (!error) {
                  const { data } = supabase.storage.from('therapist-images').getPublicUrl(key);
                  imageUrl = data.publicUrl;
                }
              }
            } catch {}
          }
          const { error } = await supabase.from('therapists').insert({
            id: `${shopId}_${t.name}`, shop_id: shopId, name: t.name, image_url: imageUrl
          });
          if (!error) { added++; process.stdout.write('.'); }
        }
        process.stdout.write('\n');
        console.log(`  ✅ 登録: ${added}名`);
      }
    }
  }
}
