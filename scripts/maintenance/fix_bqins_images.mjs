/**
 * BQ-INS 写真修正
 * data/staff/{staffId}/1.jpg → bqins_staff_{staffId}.jpg でStorage保存
 */
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim();
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'));
const BUCKET = 'therapist-images';
const DRY_RUN = process.argv.includes('--dry-run');

const SHOP_IDS = ['tokyo_meguro_jiyugaoka_bqins', 'tokyo_meguro_nakameguro_bqins', 'tokyo_setagaya_sangenjaya_bqins'];

// サイトから name → {staffId, url} を取得
async function scrapeTherapists() {
  const res = await fetch('http://bqins.jp/therapist/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
  });
  const $ = cheerio.load(await res.text());
  const map = {};
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = ($(el).attr('alt') || '').trim();
    if (!src.includes('/data/staff/') || !alt) return;
    const staffId = src.match(/\/staff\/(\d+)\//)?.[1];
    if (staffId && alt && !alt.includes('★') && !alt.includes('セール')) {
      // 名前を正規化（新人☆・プレフィックス・割引対象外などを除去してマッチング用）
      const normName = alt.replace(/^(新人☆|大型新人☆)/, '').replace(/[※★☆].*/,'').trim();
      map[alt] = { staffId, url: `http://bqins.jp/data/staff/${staffId}/1.jpg`, normName };
    }
  });
  return map;
}

async function uploadImage(url, storageFileName) {
  const res = await fetch(url, {
    headers: { 'Referer': 'http://bqins.jp/', 'User-Agent': 'Mozilla/5.0' }
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(storageFileName, buffer, {
    contentType: 'image/jpeg', upsert: true
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(storageFileName).data.publicUrl;
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== 本実行 ===');

  // サイトからスクレイプ
  console.log('サイトからキャスト情報取得中...');
  const siteMap = await scrapeTherapists();
  console.log(`サイト取得: ${Object.keys(siteMap).length}件\n`);

  // DB から全BQ-INSセラピスト取得
  const { data: therapists } = await supabase.from('therapists')
    .select('id, name, shop_id, image_url')
    .in('shop_id', SHOP_IDS);

  let ok = 0, fail = 0, skip = 0;
  const uploaded = {}; // staffId → publicUrl（同じ画像を複数店舗に使いまわし）

  for (const t of therapists) {
    // 名前でマッチング（完全一致→正規化一致）
    let matched = siteMap[t.name];
    if (!matched) {
      const normT = t.name.replace(/^(新人☆|大型新人☆)/, '').replace(/[※★☆].*/,'').trim();
      matched = Object.values(siteMap).find(v => v.normName === normT);
    }
    if (!matched) {
      console.log(`? ${t.shop_id} / ${t.name} → マッチなし`);
      skip++;
      continue;
    }

    const storageFileName = `bqins_staff_${matched.staffId}.jpg`;
    if (DRY_RUN) {
      console.log(`[DRY] ${t.name} → ${storageFileName}`);
      continue;
    }

    try {
      let publicUrl = uploaded[matched.staffId];
      if (!publicUrl) {
        publicUrl = await uploadImage(matched.url, storageFileName);
        uploaded[matched.staffId] = publicUrl;
      }
      await supabase.from('therapists').update({ image_url: publicUrl }).eq('id', t.id);
      console.log(`✅ ${t.name} (${t.shop_id})`);
      ok++;
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.log(`❌ ${t.name}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\n完了: ${ok}件成功 / ${fail}件失敗 / ${skip}件マッチなし`);
}

main();
