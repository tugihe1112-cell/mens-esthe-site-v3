/**
 * Aromaria (アロマリア) 札幌 - セラピスト45名登録
 * WordPress wp-content/uploads から画像URL取得
 *
 * 実行: node scripts/maintenance/process_aromaria_sapporo.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const SHOP_ID = 'hokkaido_sapporo_sapporo_aromaria';
const BASE_URL = 'https://www.aroma-ria.com';

// セラピスト名リスト（掲載順）
const THERAPIST_NAMES = [
  'あん', 'ねね', 'えり', 'ひな', 'せな', 'いおり', 'もあ', 'しほ',
  'いずみ', 'りん', 'うらら', 'りこ', 'のあ', 'るみ', 'まみ', 'ひまり',
  'みく', 'まりな', 'くう', 'ゆみ', 'うみ', 'ちか', 'あずさ', 'ことね',
  'あすか', 'あいり', 'もえ', 'こはる', 'まなみ', 'ひなた', 'りか',
  'かえで', 'めい', 'さや', 'あおい', 'しおん', 'しおり', 'ゆり', 'みゆ',
  'ゆうか', 'りりこ', 'かなえ', 'もも', 'ゆめ', 'すず'
];

async function main() {
  console.log(`💆 Aromaria セラピスト登録${DRY_RUN ? ' [DRY RUN]' : ''}`);

  // /cast/ ページを取得
  console.log('  Fetching https://www.aroma-ria.com/cast/ ...');
  const res = await fetch(`${BASE_URL}/cast/`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // 画像マップを構築: name → image_url
  // WordPress: .therapist .col-xs-6 セレクタ、img[src*="wp-content/uploads"]
  const imageMap = {};

  // セラピスト一覧セクションから名前と画像を取得
  $('.therapist .col-xs-6, .cast-list .cast-item, .member-list .member, article').each((_, el) => {
    const img = $(el).find('img[src*="wp-content"]').first();
    if (!img.length) return;

    let src = img.attr('src') || '';
    // サムネイルサイズを除去: -300x450 → なし
    src = src.replace(/-\d+x\d+\.(jpg|jpeg|png|webp)/i, '.$1');
    src = src.replace(/-scaled\.(jpg|jpeg|png|webp)/i, '.$1');
    if (!src.startsWith('http')) src = `${BASE_URL}${src}`;

    const alt = img.attr('alt') || '';
    const name = alt.trim().replace(/\s+セラピスト.*$/, '').replace(/さんの写真$/, '').trim();
    if (name && /[ぁ-んァ-ヾ]/.test(name)) {
      imageMap[name] = src;
    }
  });

  // altから取れなかった場合はwp-contentの全画像を名前順に対応付け
  if (Object.keys(imageMap).length < 5) {
    console.log('  アルタナティブ: 全wp-content画像をリスト順に対応付け');
    const imgs = [];
    $('img[src*="wp-content/uploads"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src.includes('no-image') || src.includes('logo') || src.includes('banner')) return;
      // -scaled や サムネイルを除去
      const normalized = src
        .replace(/-\d+x\d+\.(jpg|jpeg|png|webp)/i, '.$1')
        .replace(/-scaled\.(jpg|jpeg|png|webp)/i, '.$1');
      if (!imgs.includes(normalized)) imgs.push(normalized);
    });

    THERAPIST_NAMES.forEach((name, i) => {
      if (imgs[i]) imageMap[name] = imgs[i];
    });
  }

  console.log(`  画像マップ: ${Object.keys(imageMap).length}件`);

  // 既存レコード確認
  const { data: existing } = await supabase
    .from('therapists')
    .select('id')
    .eq('shop_id', SHOP_ID);
  const existingIds = new Set((existing || []).map(r => r.id));

  let inserted = 0, skipped = 0, errors = 0;

  for (const name of THERAPIST_NAMES) {
    const id = `${SHOP_ID}_${name}`;
    if (existingIds.has(id)) { skipped++; continue; }

    const image_url = imageMap[name] || null;

    if (DRY_RUN) {
      console.log(`  [DRY] + ${name} ${image_url ? '✓' : '(名前のみ)'}`);
      inserted++;
      continue;
    }

    const { error } = await supabase.from('therapists').insert({
      id,
      shop_id: SHOP_ID,
      name,
      image_url
    });
    if (error) {
      if (error.code === '23505') skipped++;
      else { console.error(`  ❌ ${name}:`, error.message); errors++; }
    } else {
      inserted++;
    }
  }

  console.log(`✅ Aromaria: +${inserted} skip=${skipped} err=${errors}`);
  if (Object.keys(imageMap).length < THERAPIST_NAMES.length) {
    console.log(`  ⚠️ 画像未取得: ${THERAPIST_NAMES.filter(n => !imageMap[n]).join(', ')}`);
  }
}

main().catch(console.error);
