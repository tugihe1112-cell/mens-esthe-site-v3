/**
 * relax tokyo（新橋）の店舗情報・セラピストを公式サイトの実データに置き換える
 *
 * 【なぜ必要か（2026-09-04 実測）】
 *   DBの website_url が `https://www.e-kimoti.net/` を指しており、
 *   在籍セラピスト36名が「あみ / ありす / あん / いのり…」というひらがな名で全員画像なしだった。
 *   公式サイト https://relax-tokyo.jp/ の実在籍（水原しずく / 西野さや …）と**1人も一致しない**。
 *   ＝ 別サイト由来のデータが載っていた。「新人」という名前のレコードまで混ざっていた。
 *
 * 【やること】
 *   1. shops の website_url / schedule_url を公式（relax-tokyo.jp）へ修正
 *   2. 口コミから参照されていない既存セラピストを削除（誤データの掃除）
 *   3. 公式の在籍30名を登録（画像はR2へ保存。⚠️ Supabase Storageは使わない → CLAUDE.md）
 *   4. 天音しおりだけは**既存IDを保持**して更新する（口コミ1件が therapist_id で参照しているため）
 *
 * 使い方: node scripts/maintenance/process_relax_tokyo.mjs [--live]
 *   既定は dry-run。--live で実際に更新する。
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '../lib/r2Upload.mjs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const LIVE = process.argv.includes('--live');
const SHOP_ID = 'tokyo_minato_shinbashi_relax_tokyo';
const SITE = 'https://relax-tokyo.jp';

// ⚠️ 既存の口コミ(owner_天音しおり_df3bceb7)が参照しているIDなので**変更してはいけない**。
//    公式表記は全角スペースだが、IDは登録時の半角スペースのまま維持する。
const AMANE_EXISTING_ID = `${SHOP_ID}_天音 しおり`;

// 公式 /therapist/ から実測（2026-09-04）。tid は画像URL /therapist_img/{tid}_1.{ext} の番号。
// tid が null の2名は公式にも写真が無い（名前のみ登録）。
const THERAPISTS = [
  { name: '水原しずく',   tid: 253, ext: 'webp', age: 29, height: 158 },
  { name: '西野さや',     tid: 252, ext: 'webp', age: 26, height: 158 },
  { name: '沢田まどか',   tid: 251, ext: 'webp', age: 28, height: 160 },
  { name: '柏木めぐみ',   tid: 199, ext: 'webp', age: 26, height: 159 },
  { name: '三上 あやの',  tid: 198, ext: 'webp', age: 28, height: 159 },
  { name: '泉らん',       tid: 197, ext: 'webp', age: 26, height: 157 },
  { name: '黒田りいさ',   tid: 240, ext: 'webp', age: 25, height: 147 },
  { name: '蒼井涼子',     tid: 234, ext: 'webp', age: 29, height: 157 },
  { name: '今井りの',     tid: 235, ext: 'webp', age: 27, height: 163 },
  { name: '立花なつみ',   tid: 194, ext: 'webp', age: null, height: 152 },
  { name: '多野しいな',   tid: 238, ext: 'webp', age: 27, height: 160 },
  { name: '小川つむぎ',   tid: 241, ext: 'webp', age: 25, height: 151 },
  { name: '綾城ももか',   tid: 237, ext: 'webp', age: 22, height: 155 },
  { name: '藤ゆりの',     tid: 196, ext: 'webp', age: 29, height: 163 },
  { name: '☆早乙女　リズ', tid: 67,  ext: 'webp', age: 26, height: 155 },
  { name: '白石ゆき',     tid: 231, ext: 'webp', age: 27, height: 160 },
  { name: '桃園れおな',   tid: 185, ext: 'webp', age: 28, height: 158 },
  { name: '凪りほ',       tid: 192, ext: 'webp', age: 26, height: 155 },
  { name: '天音　しおり', tid: 146, ext: 'webp', age: 29, height: 154, existingId: AMANE_EXISTING_ID },
  { name: '市原まいり',   tid: 228, ext: 'webp', age: 27, height: 158 },
  { name: '香椎あすか',   tid: 236, ext: 'webp', age: 27, height: 160 },
  { name: '日比谷まや',   tid: 208, ext: 'webp', age: 27, height: 154 },
  { name: '優木ふみ',     tid: 203, ext: 'webp', age: 27, height: 153 },
  { name: '新山ゆい',     tid: 13,  ext: 'webp', age: 28, height: 150 },
  { name: '椿　れな',     tid: 30,  ext: 'webp', age: 26, height: 160 },
  { name: '稲葉　さよ',   tid: 147, ext: 'webp', age: 30, height: 160 },
  { name: '新川るな',     tid: 250, ext: 'webp', age: 26, height: 148 },
  { name: '篠原あいり',   tid: 254, ext: 'jpg',  age: 27, height: 152 },
  { name: '神谷果歩',     tid: null, ext: null,  age: 27, height: 160 },
  { name: '橋本えりか',   tid: null, ext: null,  age: 21, height: 158 },
];

const norm = (s) => (s || '').replace(/[\s　☆★]/g, '');

async function main() {
  console.log(`\n=== relax tokyo 修復 ${LIVE ? '(本実行)' : '(DRY-RUN)'} ===\n`);

  // ── 1. 店舗情報の修正 ──
  const { data: shop } = await supabase.from('shops').select('id, name, website_url, schedule_url').eq('id', SHOP_ID).maybeSingle();
  if (!shop) { console.error(`❌ 店舗が見つからない: ${SHOP_ID}`); process.exit(1); }
  console.log(`店舗: ${shop.name}`);
  console.log(`  website_url: ${shop.website_url} → ${SITE}/`);
  console.log(`  schedule_url: ${shop.schedule_url} → ${SITE}/schedule/`);
  if (LIVE) {
    const { error } = await supabase.from('shops')
      .update({ website_url: `${SITE}/`, schedule_url: `${SITE}/schedule/` }).eq('id', SHOP_ID);
    if (error) throw new Error('shops更新失敗: ' + error.message);
    console.log('  ✅ 更新');
  }

  // ── 2. 誤データの掃除（口コミ参照があるものは絶対に消さない）──
  const { data: existing } = await supabase.from('therapists').select('id, name').eq('shop_id', SHOP_ID);
  const officialNames = new Set(THERAPISTS.map(t => norm(t.name)));
  const { data: refs } = await supabase.from('reviews').select('therapist_id').eq('shop_id', SHOP_ID);
  const referenced = new Set((refs || []).map(r => r.therapist_id));

  const toDelete = (existing || []).filter(t => !officialNames.has(norm(t.name)) && !referenced.has(t.id));
  const keptByRef = (existing || []).filter(t => !officialNames.has(norm(t.name)) && referenced.has(t.id));
  console.log(`\n既存 ${existing?.length || 0}名 / 公式在籍 ${THERAPISTS.length}名`);
  console.log(`  削除対象（公式に不在かつ口コミ参照なし）: ${toDelete.length}名`);
  if (toDelete.length) console.log(`    ${toDelete.map(t => t.name).join(', ')}`);
  if (keptByRef.length) console.log(`  ⚠️ 口コミ参照があるため保持: ${keptByRef.map(t => t.name).join(', ')}`);
  if (LIVE && toDelete.length) {
    const { error } = await supabase.from('therapists').delete().in('id', toDelete.map(t => t.id));
    if (error) throw new Error('削除失敗: ' + error.message);
    console.log('  ✅ 削除完了');
  }

  // ── 3. 公式在籍の登録 ──
  console.log(`\nセラピスト登録:`);
  let ok = 0, noimg = 0, fail = 0;
  for (const t of THERAPISTS) {
    const id = t.existingId || `${SHOP_ID}_${t.name}`;
    let imageUrl = null;

    if (t.tid) {
      const src = `${SITE}/therapist_img/${t.tid}_1.${t.ext}`;
      // ⚠️ Storageのキーは日本語名でなく元URL由来にする（同字数の名前で上書き衝突する事故が過去にあった）
      const key = `relaxtokyo_${t.tid}_1.${t.ext}`;
      if (LIVE) {
        try {
          imageUrl = await uploadImage(src, key, `${SITE}/therapist/`);
        } catch (e) {
          console.log(`  ⚠️ ${t.name}: 画像取得失敗 (${e.message}) → 画像なしで登録`);
        }
      } else {
        imageUrl = `(DRY) ${key}`;
      }
    }

    const row = {
      id, shop_id: SHOP_ID, name: t.name,
      age: t.age, height: t.height, is_active: true,
      ...(imageUrl && LIVE ? { image_url: imageUrl } : {}),
      ...(!t.tid ? { image_url: null } : {}),
    };

    if (LIVE) {
      const { error } = await supabase.from('therapists').upsert(row, { onConflict: 'id' });
      if (error) { console.log(`  ❌ ${t.name}: ${error.message}`); fail++; continue; }
    }
    if (t.tid) ok++; else noimg++;
    console.log(`  ${t.tid ? '📷' : '👤'} ${t.name}${t.existingId ? ' (既存ID保持=口コミ参照あり)' : ''}`);
  }

  // ── 4. 口コミ側の表示名を公式表記に揃える ──
  if (LIVE) {
    const { error } = await supabase.from('reviews')
      .update({ therapist_name: '天音　しおり' }).eq('therapist_id', AMANE_EXISTING_ID);
    if (error) console.log(`  ⚠️ 口コミの表示名更新に失敗: ${error.message}`);
    else console.log(`\n口コミの表示名を公式表記「天音　しおり」に統一`);
  }

  console.log(`\n=== 完了: 画像あり${ok} / 画像なし${noimg} / 失敗${fail} ===`);
  if (!LIVE) console.log('※ dry-run です。実行するには --live を付けてください。\n');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
