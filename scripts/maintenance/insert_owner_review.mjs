// 汎用 owner口コミ投入スクリプト（Tier 1-2：店ごとの insert_xxx_review.mjs を一本化）
// 使い方: node scripts/maintenance/insert_owner_review.mjs <review.json> [--dry-run]
//   JSONは単一オブジェクト or 配列。1ファイルで複数店・複数セラピストを一括投入できる。
//   機能: therapist_id自動解決 / therapist未登録ならname-only登録 / 重複チェック / 字数&タグ検証 / --dry-run
//   テンプレ: scripts/maintenance/_owner_review_template.json
//
// ⚠️ 露骨表現・名指し実店舗の本番断定は ng-rules 通り「事前に人間が置換済み」であること。
//    このスクリプトは投入の機械化だけを担う（内容の法務/ng判断はしない）。
import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
// ⚠️ INSERTは必ず service role（anon keyはRLSでサイレント無効 → ng-rules.md）
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const jsonPath = args.find(a => !a.startsWith('--'));
if (!jsonPath) { console.error('使い方: node scripts/maintenance/insert_owner_review.mjs <review.json> [--dry-run]'); process.exit(1); }

// UIの正式タグ（SearchPageの絞り込みと完全一致・lessons.md必須事項）。この外は自動除去。
const ALLOWED_TAGS = new Set([
  'スレンダー', 'グラマー', '巨乳', '美脚', '小柄', '高身長',
  '可愛い系', '美人系', '清楚系', 'ギャル系', 'お姉さん系',
  '10代', '20代前半', '20代後半', '30代', '40代',
  '色白', '健康的', 'ベテラン', '外国人', '新人',
]);
const RATING_KEYS = ['cleanliness', 'looks', 'style', 'service', 'massage', 'intimacy'];

const normName = (s) => (s || '').replace(/[\s　]/g, '');

async function resolveTherapist(shopId, nameHint) {
  // 店内から ilike 検索でDB正式名・id区切りの揺れを吸収（lessons.md：therapist_idはハードコードせずDB解決）
  const { data: rows, error } = await supabase
    .from('therapists').select('id, name, shop_id').eq('shop_id', shopId).ilike('name', `%${nameHint}%`);
  if (error) throw new Error('therapist検索失敗: ' + error.message);
  const exact = (rows || []).find(r => normName(r.name) === normName(nameHint));
  return exact || (rows || [])[0] || null;
}

async function ensureTherapist(shopId, nameHint) {
  const t = await resolveTherapist(shopId, nameHint);
  if (t) return { id: t.id, name: t.name, created: false };
  const tid = `${shopId}_${nameHint}`;
  if (DRY) return { id: tid, name: nameHint, created: 'dry' };
  const { error } = await supabase.from('therapists').insert({ id: tid, shop_id: shopId, name: nameHint, image_url: null });
  if (error) throw new Error('therapist作成失敗: ' + error.message);
  return { id: tid, name: nameHint, created: true };
}

function validate(r) {
  const errs = [];
  if (!r.shop_id) errs.push('shop_id必須');
  if (!r.therapist_name) errs.push('therapist_name必須');
  if (!r.content || typeof r.content !== 'string') errs.push('content必須');
  if (!r.detailed_ratings) errs.push('detailed_ratings必須');
  else for (const k of RATING_KEYS) {
    const v = r.detailed_ratings[k];
    if (!(Number.isInteger(v) && v >= 1 && v <= 5)) errs.push(`detailed_ratings.${k}は1〜5の整数`);
  }
  if (!Array.isArray(r.tags) || r.tags.length === 0) errs.push('tags必須（配列）');
  return errs;
}

async function processOne(r, i) {
  const label = `[${i + 1}] ${r.shop_id} / ${r.therapist_name}`;
  console.log(label);
  const errs = validate(r);
  if (errs.length) { console.log(`  ❌ 検証NG: ${errs.join(' / ')}`); return 'skip'; }

  const goodTags = r.tags.filter(t => ALLOWED_TAGS.has(t));
  const badTags = r.tags.filter(t => !ALLOWED_TAGS.has(t));
  if (badTags.length) console.log(`  ⚠️ UI非存在タグを除去: ${badTags.join(', ')}`);
  if (!goodTags.length) { console.log('  ❌ 有効タグが0件 → スキップ'); return 'skip'; }

  const len = r.content.replace(/\s/g, '').length;
  console.log(`  字数 ${len} ${len >= 700 ? '✅700+' : len >= 200 ? '△200+(700未満=閲覧ボーナス弱)' : '⚠️200未満'}`);

  const rating = (typeof r.rating === 'number')
    ? r.rating
    : Math.round((RATING_KEYS.reduce((a, k) => a + r.detailed_ratings[k], 0) / 6) * 10) / 10;

  // id: 明示があればそれ、無ければ therapist名+本文ハッシュで決定的生成（再実行で重複しない・同一人物に複数可）
  const hash = crypto.createHash('sha1').update(r.content).digest('hex').slice(0, 8);
  const id = r.id || `owner_${normName(r.therapist_name)}_${hash}`;

  const { data: ex } = await supabase.from('reviews').select('id').eq('id', id).maybeSingle();
  if (ex) { console.log(`  ⏭ 既に存在(${id}) → スキップ`); return 'skip'; }

  const th = await ensureTherapist(r.shop_id, r.therapist_name);
  console.log(`  therapist: ${th.id} / "${th.name}" ${th.created === true ? '(新規作成)' : th.created === 'dry' ? '(DRY:作成予定)' : '(既存)'}`);

  const review = {
    id, shop_id: r.shop_id,
    therapist_id: th.id, therapist_name: th.name,
    user_id: 'owner_manual', user_name: r.user_name || '常連',
    rating, course: r.course || null,
    detailed_ratings: r.detailed_ratings, tags: goodTags,
    is_public: true, content: r.content,
  };

  if (DRY) { console.log(`  [DRY] 挿入予定 id=${id} rating=${rating} tags=[${goodTags.join(',')}]`); return 'skip'; }
  const { data, error } = await supabase.from('reviews').insert(review).select();
  if (error) { console.log(`  ❌ 挿入失敗: ${error.message}`); return 'fail'; }
  console.log(`  ✅ 挿入完了 id=${data[0].id}`);
  console.log(`     索引URL: https://www.mens-esthe-map.jp/shops/${r.shop_id}/threads/${th.id}`);
  return 'ins';
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const list = Array.isArray(raw) ? raw : [raw];
  console.log(`=== owner口コミ投入 (${DRY ? 'DRY-RUN' : '本番'}) : ${list.length}件 ===`);
  console.log('⚠️ 露骨表現/名指し本番断定は ng-rules 通り事前に人間が置換済みであること\n');
  const tally = { ins: 0, skip: 0, fail: 0 };
  for (let i = 0; i < list.length; i++) tally[await processOne(list[i], i)]++;
  console.log(`\n=== 完了: 挿入${tally.ins} / スキップ${tally.skip} / 失敗${tally.fail} ===`);
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
