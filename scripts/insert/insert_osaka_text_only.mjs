/**
 * 大阪テキストのみ店舗 一括挿入 (画像なし)
 * ミセスムーンR / うさぎのお部屋 / ミセスの子守唄
 * 実行: node scripts/insert/insert_osaka_text_only.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// ============================================================
// ミセスムーンR (moonr.jp) - "みさき(35) モデル系" 形式
// ============================================================
async function processMoonR() {
  const shopId = 'osaka_tanimachi9_mrs_moonr';
  const url = 'https://www.moonr.jp/gals/';
  const res = await fetch(url, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  $('li').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    // "みさき(35)" または "れいな(38)" パターン
    const m = text.match(/^(?:NEW\s+)?(?:次回|本日|オススメ)?[\s\S]*?([ぁ-んァ-ヾ一-龯]{2,8})\s*[（(](\d{2,3})[)）]/);
    if (!m) return;
    const name = m[1].trim();
    const age = parseInt(m[2]);
    if (name.length < 2 || /NEW|次回|本日|オススメ|予約|スケジュール/.test(name)) return;
    const heightMatch = text.match(/T[．.:]?\s*(\d{3})/);
    therapists.push({ name, age, height: heightMatch ? parseInt(heightMatch[1]) : null });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`[ミセスムーンR] ${unique.length}名`);
  let inserted = 0;
  for (const t of unique) {
    const id = `${shopId}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const { error } = await supabase.from('therapists').upsert({ id, shop_id: shopId, name: t.name, age: t.age, height: t.height });
    if (!error) inserted++;
  }
  console.log(`  ✅ ${inserted}名挿入`);
}

// ============================================================
// うさぎのお部屋 (bunny-room.com) - "西宮ゆめ Age.20 Tall.160" 形式
// ============================================================
async function processBunnyRoom() {
  const shopId = 'osaka_umeda_bunny_room';
  const url = 'https://bunny-room.com/staff.php';
  const res = await fetch(url, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  $('li, tr, div').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    // "西宮ゆめ Age.20 Tall.160" パターン
    const nameMatch = text.match(/^([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{2,6})?)\s+Age/);
    if (!nameMatch) return;
    const name = nameMatch[1].trim();
    const ageMatch = text.match(/Age[.．]?\s*(\d{2,3})/);
    const heightMatch = text.match(/Tall[.．]?\s*(\d{3})/);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);
    therapists.push({
      name,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch?.[1]?.toUpperCase() || null,
    });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`[うさぎのお部屋] ${unique.length}名`);
  let inserted = 0;
  for (const t of unique) {
    const id = `${shopId}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const { error } = await supabase.from('therapists').upsert({ id, shop_id: shopId, name: t.name, age: t.age, height: t.height, cup: t.cup });
    if (!error) inserted++;
  }
  console.log(`  ✅ ${inserted}名挿入`);
}

// ============================================================
// ミセスの子守唄 (mrs-komoriuta.com) - "椿來【つばき】(55) T.150" 形式
// ============================================================
async function processKomoriuta() {
  const shopId = 'osaka_shinosaka_komoriuta';
  const url = 'https://mrs-komoriuta.com/list/';
  const res = await fetch(url, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  $('li').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    // "椿來【つばき】(55) T.150" パターン
    // 名前: 漢字部分【ふりがな】または漢字のみ
    const nameAgeMatch = text.match(/([ぁ-んァ-ヾ一-龯]{1,6}(?:【[ぁ-ん]{2,6}】)?)\s*[（(](\d{2,3})[)）]/);
    if (!nameAgeMatch) return;
    const name = nameAgeMatch[1].replace(/【[^】]+】/, '').trim() || nameAgeMatch[1].trim();
    const age = parseInt(nameAgeMatch[2]);
    if (!name || name.length < 1) return;

    const heightMatch = text.match(/T[.．]\s*(\d{3})/);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);
    therapists.push({
      name,
      age,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch?.[1]?.toUpperCase() || null,
    });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`[ミセスの子守唄] ${unique.length}名`);
  let inserted = 0;
  for (const t of unique) {
    const id = `${shopId}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const { error } = await supabase.from('therapists').upsert({ id, shop_id: shopId, name: t.name, age: t.age, height: t.height, cup: t.cup });
    if (!error) inserted++;
  }
  console.log(`  ✅ ${inserted}名挿入`);
}

// ============================================================
// LIRICA OSAKA (lirica-osaka.com) - "小松いろは(21)" 形式 (umihey CMS)
// ============================================================
async function processLirica() {
  const shopId = 'osaka_umeda_lirica';
  const url = 'https://lirica-osaka.com/cast/';
  const res = await fetch(url, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  $('li').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    // "小松いろは(21)" パターン
    const m = text.match(/([ぁ-んァ-ヾ一-龯a-zA-Z]{2,10}(?:[\s　][ぁ-んァ-ヾ一-龯]{2,6})?)\s*[（(](\d{2,3})[)）]/);
    if (!m) return;
    const name = m[1].trim();
    const age = parseInt(m[2]);
    if (!name || name.length < 2 || /NEW|SNS|本日|次回|指名|予約/.test(name)) return;
    const heightMatch = text.match(/T[．.:]?\s*(\d{3})/);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);
    therapists.push({ name, age, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`[LIRICA OSAKA] ${unique.length}名`);
  let inserted = 0;
  for (const t of unique) {
    const id = `${shopId}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const { error } = await supabase.from('therapists').upsert({ id, shop_id: shopId, name: t.name, age: t.age, height: t.height, cup: t.cup });
    if (!error) inserted++;
  }
  console.log(`  ✅ ${inserted}名挿入`);
}

async function run() {
  await processMoonR();
  await processBunnyRoom();
  await processKomoriuta();
  await processLirica();
  console.log('\n完了');
}
run().catch(e => console.error('❌', e.message));
