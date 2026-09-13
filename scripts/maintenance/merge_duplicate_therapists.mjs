/**
 * merge_duplicate_therapists.mjs — 同じ店に二重に入っている同一人物の行をまとめる
 *
 * 【なぜ必要か（2026-09-13）】
 * 同じ店の中に、同じ人が2行ずつ入っている組が952組あった。原因は取り込み時の表記ゆれ。
 *
 *     似鳥 芹香   → tokyo_..._zexterior_似鳥_芹香   （新しい取り込み。年齢・身長あり）
 *     似鳥芹香    → tokyo_..._zexterior_似鳥芹香    （古い取り込み。情報が薄い）
 *
 * 利用者から見ると、検索結果に同じ人が2枚並ぶ。写真が違うので別人にも見える。
 *
 * ⚠️ **系列店をまたぐ同名の行は重複ではない。** 「渋谷で検索したときに引っかかる」ために
 *    必要な別レコードなので、**絶対にまとめない**。この道具は `shop_id` が同じ行だけを扱う。
 *
 * 【残す行の決め方】
 *  1. 口コミが付いている行があれば**それを残す**（複数あればいちばん多い行）
 *  2. 次に**情報が埋まっている行**を残す（年齢・身長・カップ・スリーサイズ・写真）
 *     実測では、新しい取り込み（名前にスペースあり）のほうが情報が多い
 *  3. それでも並んだら is_active → last_seen_at → created_at → id の順で決める（毎回同じ結果になるように）
 *  4. 残す行に欠けている項目は、消す行から**埋めてから**消す（情報を落とさない）
 *  5. 消す行に付いた口コミは、残す行へ**付け替えてから**消す
 *
 * 【安全装置】
 *  1. 既定は下見(dry-run)。実際に書き換えるには `--apply` が要る
 *  2. 消す前に、全対象行をJSONへ書き出す（元に戻せる）
 *  3. shop_id が違う行は候補にすら入れない
 *  4. 口コミの付け替えに失敗したら、その組は**消さずに飛ばす**
 *  5. `--limit=N` で少数だけ試せる
 *
 * ⚠️ 消した行のURLは404になる。これらは口コミ0件の薄いページなので影響は小さいが、
 *    人単位URLへの統合をやるときは、この分もリダイレクト表に入れること。
 *
 * 実行:
 *   node scripts/maintenance/merge_duplicate_therapists.mjs              # 下見（全件）
 *   node scripts/maintenance/merge_duplicate_therapists.mjs --limit=5    # 5組だけ下見
 *   node scripts/maintenance/merge_duplicate_therapists.mjs --limit=5 --apply
 *   node scripts/maintenance/merge_duplicate_therapists.mjs --apply      # 本番
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
// ⚠️ 名前の正規化は**表示側と同じもの**を使う。ここに写しを作ると、
//    片方だけ直したときに「まとめる集合」と「口コミを合流させる集合」がズレる。
import { normalizeTherapistName } from '../../src/utils/reviewIdentity.js';

function env(key) {
  if (process.env[key]) return process.env[key];
  try {
    const source = fs.readFileSync('.env', 'utf8');
    return source.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
  } catch {
    return '';
  }
}

const supabaseUrl = env('VITE_SUPABASE_URL');
const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabaseのサーバー接続情報がありません（.env の VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0);
const BACKUP_DIR = 'outputs/merged-therapists';

/** 表示側と同一の正規化（src/utils/reviewIdentity.js から読み込む。写しを作らない） */
const normalize = normalizeTherapistName;

/** ⚠️ PostgRESTはサーバー側 max-rows(既定1000) が優先する。.limit() では全件取れない。 */
async function fetchAll(table, columns) {
  const out = [];
  const step = 1000;
  for (let from = 0; ; from += step) {
    const { data, error } = await supabase.from(table).select(columns).order('id').range(from, from + step - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < step) break;
  }
  return out;
}

const FILL_FIELDS = ['image_url', 'profile_image', 'age', 'height', 'cup', 'three_size', 'bust', 'waist', 'hip', 'raw_data'];
const filled = (t) => FILL_FIELDS.reduce((n, f) => n + (t?.[f] == null || t[f] === '' ? 0 : 1), 0);

/** 残す行を決める。毎回同じ結果になること（ランダム・Setの順序に頼らない）。 */
function pickSurvivor(rows, reviewCountById) {
  return [...rows].sort((a, b) => {
    const ra = reviewCountById.get(String(a.id)) || 0;
    const rb = reviewCountById.get(String(b.id)) || 0;
    if (ra !== rb) return rb - ra;                       // 口コミが多い行
    const fa = filled(a); const fb = filled(b);
    if (fa !== fb) return fb - fa;                       // 情報が埋まっている行
    if (!!a.is_active !== !!b.is_active) return a.is_active ? -1 : 1;
    const la = String(a.last_seen_at || ''); const lb = String(b.last_seen_at || '');
    if (la !== lb) return lb.localeCompare(la);          // 新しく見かけた行
    const ca = String(a.created_at || ''); const cb = String(b.created_at || '');
    if (ca !== cb) return cb.localeCompare(ca);
    return String(a.id).localeCompare(String(b.id));
  })[0];
}

async function run() {
  console.log('セラピストと口コミを取得中…');
  const [therapists, reviews] = await Promise.all([
    fetchAll('therapists', 'id, shop_id, name, image_url, profile_image, is_active, last_seen_at, created_at, age, height, cup, three_size, bust, waist, hip, raw_data'),
    fetchAll('reviews', 'id, therapist_id'),
  ]);
  const reviewCountById = new Map();
  for (const r of reviews) {
    if (!r.therapist_id) continue;
    const k = String(r.therapist_id);
    reviewCountById.set(k, (reviewCountById.get(k) || 0) + 1);
  }
  console.log(`セラピスト ${therapists.length}行 / 口コミ ${reviews.length}件`);

  // ⚠️ 鍵に shop_id を必ず含める。含めないと系列店の別レコードまで巻き込む。
  const groups = new Map();
  for (const t of therapists) {
    const key = `${t.shop_id}::${normalize(t.name)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  let targets = [...groups.values()].filter((rows) => rows.length > 1);
  targets.sort((a, b) => String(a[0].id).localeCompare(String(b[0].id)));
  if (LIMIT > 0) targets = targets.slice(0, LIMIT);

  const plans = [];
  for (const rows of targets) {
    if (new Set(rows.map((r) => r.shop_id)).size !== 1) {
      console.error(`❌ 想定外: shop_id が混ざっています（${rows.map((r) => r.id).join(' / ')}）。中止します。`);
      process.exit(1);
    }
    const keep = pickSurvivor(rows, reviewCountById);
    const drop = rows.filter((r) => String(r.id) !== String(keep.id));
    const patch = {};
    for (const f of FILL_FIELDS) {
      if (keep[f] != null && keep[f] !== '') continue;
      const donor = drop.find((d) => d[f] != null && d[f] !== '');
      if (donor) patch[f] = donor[f];
    }
    const movingReviews = drop.reduce((n, d) => n + (reviewCountById.get(String(d.id)) || 0), 0);
    plans.push({ keep, drop, patch, movingReviews });
  }

  console.log(`\n重複グループ ${plans.length}組 / 消す行 ${plans.reduce((n, p) => n + p.drop.length, 0)}行`);
  console.log(`付け替える口コミ ${plans.reduce((n, p) => n + p.movingReviews, 0)}件`);
  for (const p of plans.slice(0, 10)) {
    console.log(`\n■ ${p.keep.name} [${p.keep.shop_id}]`);
    console.log(`   残す: ${p.keep.id}  (情報${filled(p.keep)}項目 / 口コミ${reviewCountById.get(String(p.keep.id)) || 0}件)`);
    for (const d of p.drop) console.log(`   消す: ${d.id}  (情報${filled(d)}項目 / 口コミ${reviewCountById.get(String(d.id)) || 0}件)`);
    if (Object.keys(p.patch).length) console.log(`   補完: ${Object.keys(p.patch).join(', ')}`);
  }
  if (plans.length > 10) console.log(`\n…ほか ${plans.length - 10}組`);

  if (!APPLY) {
    console.log('\nこれは下見です。実行するには --apply を付けてください。');
    console.log('⚠️ まず --limit=5 --apply で少数を試し、サイトで見てから全件を流すことを勧めます。');
    return;
  }
  if (plans.length === 0) { console.log('\n対象がありません。'); return; }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `merge-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(plans, null, 2));
  console.log(`\n📦 バックアップ: ${backupPath}`);

  let merged = 0; let skipped = 0;
  for (const p of plans) {
    try {
      if (Object.keys(p.patch).length) {
        const { error } = await supabase.from('therapists').update(p.patch).eq('id', p.keep.id);
        if (error) throw error;
      }
      for (const d of p.drop) {
        if ((reviewCountById.get(String(d.id)) || 0) > 0) {
          // ⚠️ 口コミの付け替えが失敗したまま行を消すと、口コミが宛先を失う。必ず先に。
          const { error } = await supabase.from('reviews').update({ therapist_id: p.keep.id }).eq('therapist_id', d.id);
          if (error) throw error;
        }
        const { error: delError } = await supabase.from('therapists').delete().eq('id', d.id);
        if (delError) throw delError;
      }
      merged += 1;
      if (merged % 50 === 0) console.log(`  …${merged}/${plans.length}`);
    } catch (e) {
      skipped += 1;
      console.error(`❌ 飛ばしました: ${p.keep.name} [${p.keep.shop_id}] — ${e.message}`);
    }
  }
  console.log(`\n✅ 統合 ${merged}組 / 飛ばし ${skipped}組`);
  console.log('※ 消した行のURLは404になります（いずれも口コミ0件の薄いページ）。');
}

run().catch((e) => { console.error('❌', e); process.exit(1); });
