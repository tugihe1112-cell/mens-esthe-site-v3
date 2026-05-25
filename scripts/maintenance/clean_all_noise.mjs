/**
 * DB全体のノイズセラピスト一括クリーンアップ
 * 実行: node scripts/maintenance/clean_all_noise.mjs [--dry-run] [--area=osaka]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const AREA = args.find(a => a.startsWith('--area='))?.split('=')[1] || null;

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// ===== ノイズ判定ルール =====

// 名前ノイズワード
const NOISE_NAME = /はこちら|一覧|登録|予約|お知らせ|ランキング|エステ|アロマ|セラピー|メンズ|スパ|サロン|コース|キャンペーン|マッサージ|リラクゼーション|料金|求人|募集|公式|ポリシー|プライバシー|体入|体験入店|見習い|情報サイト|ナビ$|まとめ|メディア|部長|キャバ|パブ|ポータル|専門サイト|ページトップ|トップへ|マニアックス|割引情報|割引|紹介|バナー|コチラ|こちら|サイト|ナビ|スタッフ募集|リクルート|ご紹介|メンエス|メンズエス|団体|営業時間|出勤情報|イベント|トップ$|^トップ|アクセス|お問い合わせ|情報$|^情報|スケジュール|スタッフ|フォト/i;

// 画像URLノイズパターン
const NOISE_IMAGE = /relaxjob|menesth-job|mens\.bz\/wp-content|fuzoku-job|esthe-r\.com\/images\/user|no_image|noimage|kirei1212|recruit|banner|bnr\.|\/bnr|_bnr|menesth\.jp\/assets|livedoor\.blog/i;

function isNoiseName(name) {
  if (!name) return true;
  if (/\t/.test(name)) return true;                           // タブ文字混入
  if (name.length > 12) return true;                          // 長すぎる
  if (name.length < 2) return true;                           // 短すぎる
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return true;          // 日本語なし
  if (NOISE_NAME.test(name)) return true;                     // ノイズワード
  if (/^【.*】$/.test(name)) return true;                     // 【...】だけ
  if (/^[☆★◆◇♪♦♣♠♥❤🔔\s]+$/.test(name)) return true;   // 記号だけ
  return false;
}

function isNoiseImage(imageUrl) {
  if (!imageUrl) return false;
  return NOISE_IMAGE.test(imageUrl);
}

// ===== セラピスト取得（ページネーション対応）=====
console.log(`ノイズクリーンアップ開始${DRY_RUN ? ' [DRY RUN]' : ''}${AREA ? ` [area=${AREA}]` : ''}`);

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

let allTherapists = [];
let offset = 0;
while (true) {
  let url = `${supabaseUrl}/rest/v1/therapists?select=id,name,shop_id,image_url&limit=1000&offset=${offset}&order=shop_id`;
  if (AREA) url += `&shop_id=like.${AREA}_*`;
  const r = await fetch(url, { headers: h });
  const page = await r.json();
  if (!Array.isArray(page) || page.length === 0) break;
  allTherapists.push(...page);
  if (page.length < 1000) break;
  offset += 1000;
}

console.log(`取得: ${allTherapists.length}件\n`);

// ===== ノイズ判定 =====
const noiseByReason = {
  tooLong: [],
  tooShort: [],
  noJapanese: [],
  noiseWord: [],
  brackets: [],
  symbolOnly: [],
  noiseImage: [],
};

const toDelete = [];

for (const t of allTherapists) {
  const reasons = [];

  if (!t.name || t.name.length < 2) reasons.push('tooShort');
  else if (t.name.length > 12) reasons.push('tooLong');
  else if (!/[ぁ-んァ-ヾ一-龯]/.test(t.name)) reasons.push('noJapanese');
  else if (/^【.*】$/.test(t.name)) reasons.push('brackets');
  else if (/^[☆★◆◇♪♦♣♠♥❤🔔\s]+$/.test(t.name)) reasons.push('symbolOnly');
  else if (NOISE_NAME.test(t.name)) reasons.push('noiseWord');

  if (isNoiseImage(t.image_url)) reasons.push('noiseImage');

  if (reasons.length > 0) {
    toDelete.push({ ...t, reasons });
    reasons.forEach(r => noiseByReason[r]?.push(t));
  }
}

// ===== レポート =====
console.log(`ノイズ検出: ${toDelete.length}件`);
Object.entries(noiseByReason).forEach(([reason, list]) => {
  if (list.length > 0) console.log(`  ${reason}: ${list.length}件`);
});

if (toDelete.length > 0) {
  console.log('\n--- 削除対象サンプル（最初の20件）---');
  toDelete.slice(0, 20).forEach(t =>
    console.log(`  [${t.shop_id}] "${t.name}" → ${t.reasons.join(', ')}`)
  );
  if (toDelete.length > 20) console.log(`  ... 他 ${toDelete.length - 20}件`);
}

if (DRY_RUN) {
  console.log('\n[DRY RUN] 削除は行いません');
  process.exit(0);
}

// ===== 削除実行 =====
if (toDelete.length === 0) {
  console.log('\nノイズなし ✅');
  process.exit(0);
}

console.log('\n削除中...');
let deleted = 0;
const ids = toDelete.map(t => t.id);

// バッチ削除（50件ずつ）
for (let i = 0; i < ids.length; i += 50) {
  const batch = ids.slice(i, i + 50);
  const { error } = await supabase.from('therapists').delete().in('id', batch);
  if (error) console.log(`  ⚠️ バッチ削除エラー: ${error.message}`);
  else deleted += batch.length;
  process.stdout.write('.');
}

console.log(`\n✅ 削除完了: ${deleted}件`);
