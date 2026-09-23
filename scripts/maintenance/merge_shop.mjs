/**
 * merge_shop.mjs — 同じ店が2つの店舗レコードに分かれているのを1つにまとめる
 *
 * 使い方:
 *   node scripts/maintenance/merge_shop.mjs --file=<tsv>          （下見）
 *   node scripts/maintenance/merge_shop.mjs --file=<tsv> --apply  （実行）
 *
 * 【TSVの形式】1行1組。`#` で始まる行はコメント。3列目以降はメモ（読まない）。
 *   <消す店舗ID>\t<残す店舗ID>
 *   ⚠️ 1つのIDは1組にしか書けない（A→B と B→C のような連鎖や、同じ店を2回消す書き間違いを防ぐ）。
 *
 * 【なぜ必要か（2026-09-23 実測）】
 * 公式サイトのURLと最初のエリアが同じ店舗が21組あった。ほとんどが
 * **2026-03-04 の取り込みと 2026-06 の取り込みで同じ店が二重に入ったもの**。
 *   - 片方が系列に入っていない → **検索結果に同じ店が2枚並ぶ**（綱島の「Marine」×2）
 *   - 同じ系列 → **ブランドページのルーム一覧に同じ地名が2回出る**（AROMA EMERALD の恵比寿×2）
 * 口コミは全組0件＝今が一番安く直せる（両方に口コミが付き始めると付け替えが要る）。
 *
 * 🚩 片方を delete_shop.mjs で消すだけにしなかった理由:
 *   取り込み時期が3か月違うので、**片方にしか居ないセラピスト**がいる。
 *   消すだけだと、その人たちを口コミの宛先に選べなくなる。営業時間・料金が片方にしか無い組もある。
 *
 * 【1組ごとにやること】
 *  1. 残す側で**空の項目だけ**、消す側の値で埋める（下の SHOP_FIELDS / RAW_FIELDS）。
 *     ⚠️ 残す側に値がある項目は上書きしない（どちらが正しいかは機械には決められない）。
 *  2. 残す側が系列に入っておらず（空 or g_solo_）、消す側が系列に入っていれば、その系列に入れる。
 *  3. 消す側のセラピストのうち、残す側に**同じ名前（表記ゆれを除く）が居ない人**を残す側へ移す
 *     （shop_id の付け替え。行のidは変えない）。居る人は同じ人なので消す。
 *     消す側の中で同じ名前が2行以上あれば、在籍→最終確認日→写真の有無の順で1行だけ移す。
 *     名前の比較は normalizeTherapistName（表示側・merge_duplicate_therapists と同じもの。写しを作らない）。
 *  4. 消す側の店舗行を消す。
 *     🚩 therapists.shop_id は **ON DELETE CASCADE**。移す前に店舗を消すと、移すはずの人まで消える。
 *        必ず「移す → 残りを消す → 店舗を消す」の順。
 *
 * 【安全装置】（delete_shop / update_shop_location と同じ並び）
 *  1. 既定は**下見**。`--apply` が要る。
 *  2. 書き換える前に、両方の店舗行と消す側のセラピスト行を **JSONへ書き出す**（書けなければ1行も触らない）。
 *  3. 🚩 消す側の店舗・セラピストに**口コミが1件でも**、または掲示板のスレッド（raw_data.threads）が
 *     付いていたら**全部中止**。利用者が書いたものの付け替えはこの道具の範囲外。
 *  4. 存在しないID・消す側と残す側が同じ・1つのIDが2組に出る → 全部中止。
 *  5. サービスロールキーで接続し、書いた件数を予定と照合する（RLSで黙って失敗したのを成功と表示しない）。
 *
 * 【この道具がしないこと】
 *  - 店名は変えない（残す側の名前のまま）。変えるなら update_shop_name.mjs で、公式サイトを確かめてから。
 *  - 消した店舗のURL（/shops/<消したID>）は404になる。口コミ0件の店舗ページは noindex なので影響は小さい。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
// ⚠️ 名前の正規化は表示側と同じものを使う。写しを作ると片方だけ直したときにズレる。
import { normalizeTherapistName } from '../../src/utils/reviewIdentity.js';

/** 残す側が空のときだけ、消す側の値で埋める列 */
const SHOP_FIELDS = ['image_url', 'phone_number', 'business_hours', 'price_system', 'website_url', 'schedule_url'];
/**
 * raw_data の中で、残す側が空のときだけ埋める項目。
 * 所在地（検索に効く）と、画面が列の代わりに読んでいる項目（hours/price/websiteUrl/image）だけ。
 * ⚠️ threads は埋めない（上の安全装置3で、消す側に中身があれば中止する）。
 */
const RAW_FIELDS = ['prefecture', 'city', 'area', 'address', 'hours', 'price', 'websiteUrl', 'image'];
/** PostgREST の URL が長くなりすぎないように（日本語のIDは1文字9バイトに膨らむ） */
const CHUNK = 25;

const isBlank = (v) => v == null
  || (typeof v === 'string' && v.trim() === '')
  || (Array.isArray(v) && v.length === 0);
/** 複数ルームのブランドの系列に入っているか。g_solo_ は「その店だけ」の仮の系列 */
const inBrand = (groupId) => !isBlank(groupId) && !String(groupId).startsWith('g_solo_');

/** 同じ名前の行が消す側に複数あるとき、移す1行: 在籍 → 最終確認が新しい → 写真あり → 新しい → id */
const pickBest = (rows) => [...rows].sort((a, b) =>
  Number(a.is_active === false) - Number(b.is_active === false)
  || String(b.last_seen_at || '').localeCompare(String(a.last_seen_at || ''))
  || Number(isBlank(a.image_url)) - Number(isBlank(b.image_url))
  || String(b.created_at || '').localeCompare(String(a.created_at || ''))
  || String(a.id).localeCompare(String(b.id)))[0];

/**
 * 1組の計画（純粋関数。DBには触らない）
 * @returns {{ patch: object, filled: string[], move: object[], drop: object[] }}
 */
export function planMerge({ del, keep, delTherapists, keepTherapists }) {
  const patch = {};
  const filled = [];
  for (const f of SHOP_FIELDS) {
    if (isBlank(keep[f]) && !isBlank(del[f])) { patch[f] = del[f]; filled.push(f); }
  }
  const keepRaw = keep.raw_data && typeof keep.raw_data === 'object' && !Array.isArray(keep.raw_data) ? keep.raw_data : {};
  const delRaw = del.raw_data && typeof del.raw_data === 'object' && !Array.isArray(del.raw_data) ? del.raw_data : {};
  const raw = { ...keepRaw };
  for (const f of RAW_FIELDS) {
    if (isBlank(raw[f]) && !isBlank(delRaw[f])) { raw[f] = delRaw[f]; filled.push(`raw_data.${f}`); }
  }
  if (filled.some((f) => f.startsWith('raw_data.'))) patch.raw_data = raw;
  if (!inBrand(keep.group_id) && inBrand(del.group_id)) patch.group_id = del.group_id;

  const keepKeys = new Set((keepTherapists || []).map((t) => normalizeTherapistName(t.name)));
  const byKey = new Map();
  for (const t of delTherapists || []) {
    const k = normalizeTherapistName(t.name);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(t);
  }
  const move = [];
  for (const [k, rows] of byKey) {
    if (k === '' || keepKeys.has(k)) continue; // 名前が空の行は移さない／同じ人が残す側に居る
    move.push(pickBest(rows));
  }
  const moveIds = new Set(move.map((t) => t.id));
  const drop = (delTherapists || []).filter((t) => !moveIds.has(t.id));
  return { patch, filled, move, drop };
}

/** 掲示板のスレッドが付いているか（raw_data.threads が中身のある配列） */
export const hasThreads = (shop) => Array.isArray(shop?.raw_data?.threads) && shop.raw_data.threads.length > 0;

async function main() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    console.error('❌ .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY がありません');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const args = process.argv.slice(2);
  const APPLY = args.includes('--apply');
  const FILE = (args.find((a) => a.startsWith('--file=')) || '').slice('--file='.length);
  if (!FILE) {
    console.log('使い方: node scripts/maintenance/merge_shop.mjs --file=<tsv> [--apply]');
    console.log('  TSV: <消す店舗ID>\\t<残す店舗ID>（3列目以降はメモ。# で始まる行はコメント）');
    process.exit(1);
  }

  // ── TSV ──
  const problems = [];
  const pairs = [];
  fs.readFileSync(FILE, 'utf-8').split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const [delId = '', keepId = ''] = line.split('\t').map((s) => s.trim());
    if (!delId || !keepId) { problems.push(`${i + 1}行目: 列が足りません（<消す>\\t<残す>）`); return; }
    if (delId === keepId) { problems.push(`${i + 1}行目: 消す側と残す側が同じです（${delId}）`); return; }
    pairs.push({ line: i + 1, delId, keepId });
  });
  const seen = new Map();
  for (const p of pairs) {
    for (const id of [p.delId, p.keepId]) {
      if (seen.has(id)) problems.push(`${p.line}行目: ${id} が ${seen.get(id)}行目にも出ています（1つのIDは1組だけ）`);
      else seen.set(id, p.line);
    }
  }

  const fetchTherapists = async (shopId) => {
    const out = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from('therapists').select('*')
        .eq('shop_id', shopId).order('id').range(from, from + 999);
      if (error) throw error;
      out.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return out;
  };

  // ── 下見 ──
  const plans = [];
  for (const p of pairs) {
    const [dRes, kRes] = await Promise.all([
      supabase.from('shops').select('*').eq('id', p.delId).maybeSingle(),
      supabase.from('shops').select('*').eq('id', p.keepId).maybeSingle(),
    ]);
    if (dRes.error) throw dRes.error;
    if (kRes.error) throw kRes.error;
    if (!dRes.data) { problems.push(`${p.line}行目: 消す側が見つかりません（${p.delId}）`); continue; }
    if (!kRes.data) { problems.push(`${p.line}行目: 残す側が見つかりません（${p.keepId}）`); continue; }
    const del = dRes.data;
    const keep = kRes.data;
    const [delTherapists, keepTherapists] = await Promise.all([fetchTherapists(del.id), fetchTherapists(keep.id)]);

    // 🚩 利用者が書いたもの（口コミ・掲示板）が消す側に付いていたら扱わない
    const { count: shopReviews, error: rErr } = await supabase
      .from('reviews').select('id', { count: 'exact', head: true }).eq('shop_id', del.id);
    if (rErr) throw rErr;
    let therapistReviews = 0;
    const delIds = delTherapists.map((t) => t.id);
    for (let i = 0; i < delIds.length; i += CHUNK) {
      const { count, error } = await supabase
        .from('reviews').select('id', { count: 'exact', head: true }).in('therapist_id', delIds.slice(i, i + CHUNK));
      if (error) throw error;
      therapistReviews += count || 0;
    }
    if ((shopReviews || 0) + therapistReviews > 0) {
      problems.push(`${p.line}行目: 消す側（${del.id}）に口コミが付いています（店舗 ${shopReviews || 0}件・セラピスト ${therapistReviews}件）。この道具では扱いません。`);
      continue;
    }
    if (hasThreads(del)) {
      problems.push(`${p.line}行目: 消す側（${del.id}）に掲示板のスレッドが ${del.raw_data.threads.length}件あります。この道具では扱いません。`);
      continue;
    }

    const plan = planMerge({ del, keep, delTherapists, keepTherapists });
    plans.push({ line: p.line, del, keep, delTherapists, keepCount: keepTherapists.length, ...plan });
  }

  let totalMove = 0;
  let totalDrop = 0;
  for (const pl of plans) {
    totalMove += pl.move.length;
    totalDrop += pl.drop.length;
    console.log(`\n■ ${pl.line}行目  消す: ${pl.del.name} [${pl.del.id}]`);
    console.log(`           残す: ${pl.keep.name} [${pl.keep.id}]`);
    console.log(`   セラピスト: 消す側 ${pl.delTherapists.length}人 → 移す ${pl.move.length}人・同じ人なので消す ${pl.drop.length}人（残す側 ${pl.keepCount}人 → ${pl.keepCount + pl.move.length}人）`);
    if (pl.filled.length) console.log(`   空だった項目を埋める: ${pl.filled.join(', ')}`);
    if (pl.patch.group_id) console.log(`   系列に入れる: ${pl.keep.group_id || '（なし）'} → ${pl.patch.group_id}`);
    if (pl.move.length) {
      console.log(`   移す人: ${pl.move.slice(0, 12).map((t) => t.name).join('、')}${pl.move.length > 12 ? ` …ほか${pl.move.length - 12}人` : ''}`);
    }
  }
  console.log(`\n--- ${plans.length}組: 消す店舗 ${plans.length}件・移すセラピスト ${totalMove}人・消すセラピスト（重複）${totalDrop}人 ---`);
  if (problems.length > 0) {
    for (const m of problems) console.error(`❌ ${m}`);
    console.error(`❌ ${problems.length}件で問題がありました。1件でも問題があれば1組も実行しません。`);
    process.exit(1);
  }
  if (plans.length === 0) { console.log('まとめるものがありません。'); process.exit(0); }
  if (!APPLY) {
    console.log('これは下見です。実行するには --apply を付けてください。');
    console.log('⚠️ 消した店舗は元に戻せません（バックアップJSONからの手作業の復元になります）。');
    process.exit(0);
  }

  // ── 実行 ──
  const BACKUP_DIR = 'outputs/merged-shops';
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backup = path.join(BACKUP_DIR, `merge-shop-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backup, JSON.stringify(plans.map((pl) => ({
    deleted_shop: pl.del,
    keep_shop_before: pl.keep,
    deleted_shop_therapists: pl.delTherapists,
    moved_therapist_ids: pl.move.map((t) => t.id),
    dropped_therapist_ids: pl.drop.map((t) => t.id),
    keep_shop_patch: pl.patch,
  })), null, 2), 'utf8');
  console.log(`📦 バックアップ: ${backup}`);

  const fail = (msg) => {
    console.error(`❌ ${msg}`);
    console.error(`   ここで止めました。ここまでに済んだ組はそのまま、残りは手つかずです。元の状態は ${backup} にあります。`);
    process.exit(1);
  };

  for (const pl of plans) {
    const tag = `${pl.del.id} → ${pl.keep.id}`;
    // 1-2. 残す側の空欄・系列
    if (Object.keys(pl.patch).length > 0) {
      const { data, error } = await supabase.from('shops').update(pl.patch).eq('id', pl.keep.id).select('id');
      if (error) fail(`残す側の更新に失敗: ${tag} ${error.message}`);
      if ((data || []).length !== 1) fail(`残す側の更新が ${data?.length ?? 0}件でした（1件のはず）: ${tag}`);
    }
    // 3. 移す（🚩 店舗を消す前に。shop_id は ON DELETE CASCADE）
    const ids = pl.move.map((t) => t.id);
    let moved = 0;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const { data, error } = await supabase.from('therapists')
        .update({ shop_id: pl.keep.id }).in('id', ids.slice(i, i + CHUNK)).eq('shop_id', pl.del.id).select('id');
      if (error) fail(`セラピストの付け替えに失敗: ${tag} ${error.message}`);
      moved += (data || []).length;
    }
    if (moved !== ids.length) fail(`移した人数が予定と違います: ${tag} 予定 ${ids.length}人・実際 ${moved}人`);
    // 残りは残す側と同じ人
    const { error: e1, count: c1 } = await supabase.from('therapists').delete({ count: 'exact' }).eq('shop_id', pl.del.id);
    if (e1) fail(`重複セラピストの削除に失敗: ${tag} ${e1.message}`);
    if (c1 !== pl.drop.length) fail(`消したセラピストの数が予定と違います: ${tag} 予定 ${pl.drop.length}人・実際 ${c1}人`);
    // 4. 店舗
    const { error: e2, count: c2 } = await supabase.from('shops').delete({ count: 'exact' }).eq('id', pl.del.id);
    if (e2) fail(`店舗の削除に失敗: ${tag} ${e2.message}`);
    if (c2 !== 1) fail(`店舗の削除が ${c2}件でした（1件のはず）: ${tag}`);
    console.log(`✅ ${tag}（移した ${moved}人・重複を消した ${c1}人${pl.filled.length ? `・埋めた ${pl.filled.join(', ')}` : ''}${pl.patch.group_id ? `・系列 ${pl.patch.group_id}` : ''}）`);
  }
  console.log('\n※ 実行後: 検索（地名）とブランドページで、同じ店が2枚・同じ地名が2回出ていないか確認してください。');
}

// 直接実行されたときだけ動かす（planMerge を検査から読み込めるように）
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
