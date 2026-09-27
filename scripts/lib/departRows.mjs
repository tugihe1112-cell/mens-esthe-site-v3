/**
 * departRows.mjs — 名簿の照合で「公式にいない」と判定した人の扱い（D-016・2026-09-27 オーナー決定）
 *
 *  - 口コミが付いている人 … 消さない。is_active=false（個別ページに「現在は在籍一覧にありません」の帯）
 *  - それ以外の人           … 行を消す（書く前に全項目をJSONへ保存してから）
 *
 * 「口コミが付いている」＝ reviews.therapist_id がその行を指す、または同じ店で同じ名前（空白・全角半角を無視）の口コミがある。
 * 口コミは therapist_id が無い古いものもあるので、名前でも守る。
 *
 * 2026-09-26 までに退店扱いにした行はこの部品の対象外（そのまま残す＝オーナー「これからの分だけ」）。
 */
import fs from 'node:fs';

const flat = (s) => String(s || '').normalize('NFKC').replace(/[\s　]/g, '').toLowerCase();

/** 口コミが付いている人を見分けるための鍵を読む */
export async function loadReviewedKeys(supabase) {
  const ids = new Set(); const shopNames = new Set();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('reviews').select('therapist_id,shop_id,therapist_name').range(from, from + 999);
    if (error) throw new Error(`口コミを読めません: ${error.message}`);
    for (const r of data) {
      if (r.therapist_id) ids.add(r.therapist_id);
      if (r.shop_id && r.therapist_name) shopNames.add(`${r.shop_id}::${flat(r.therapist_name)}`);
    }
    if (data.length < 1000) break;
  }
  return { ids, shopNames };
}

/** 退店と判定した行を「帯で残す（口コミあり）」と「消す」に分ける。行には id・shop_id・name が要る */
export function splitDeparting(rows, reviewed) {
  const mark = []; const remove = [];
  for (const r of rows) {
    if (!r.shop_id) throw new Error(`shop_id の無い行は分けられません: ${r.id}`);
    const hasReview = reviewed.ids.has(r.id) || reviewed.shopNames.has(`${r.shop_id}::${flat(r.name)}`);
    (hasReview ? mark : remove).push(r);
  }
  return { mark, remove };
}

/**
 * 分けて書く。消す行は全項目を backupPath に保存してから消す。保存できなければ何も書かない。
 * @returns {{ mark: object[], remove: object[] }}
 */
export async function applyDeparture(supabase, rows, reviewed, backupPath) {
  const { mark, remove } = splitDeparting(rows, reviewed);
  const full = [];
  for (let k = 0; k < remove.length; k += 40) {
    const { data, error } = await supabase.from('therapists').select('*').in('id', remove.slice(k, k + 40).map((r) => r.id));
    if (error) throw new Error(`消す行を読み直せません: ${error.message}`);
    full.push(...data);
  }
  if (full.length !== remove.length) throw new Error(`消す行を読み直せません（${full.length}/${remove.length}）`);
  fs.writeFileSync(backupPath, JSON.stringify({ at: new Date().toISOString(), deleted: full, marked: mark.map((r) => ({ id: r.id, is_active: r.is_active ?? null })) }, null, 1));
  for (let k = 0; k < mark.length; k += 40) {
    const { error } = await supabase.from('therapists').update({ is_active: false }).in('id', mark.slice(k, k + 40).map((r) => r.id));
    if (error) throw new Error(`退店扱い（口コミあり）を書けません: ${error.message}（バックアップ: ${backupPath}）`);
  }
  for (let k = 0; k < remove.length; k += 40) {
    const { error } = await supabase.from('therapists').delete().in('id', remove.slice(k, k + 40).map((r) => r.id));
    if (error) throw new Error(`退店の人を消せません: ${error.message}（バックアップ: ${backupPath}）`);
  }
  return { mark, remove };
}

/** DB に触る前に走らせる自己診断 */
export function selfTestDepartRows() {
  const reviewed = { ids: new Set(['s1_あや']), shopNames: new Set(['s2::ももか']) };
  const { mark, remove } = splitDeparting([
    { id: 's1_あや', shop_id: 's1', name: 'あや' },          // 口コミの therapist_id が指す → 残す
    { id: 's2_x', shop_id: 's2', name: 'も も か' },         // 同じ店・同じ名前の口コミ → 残す（空白は無視）
    { id: 's3_ももか', shop_id: 's3', name: 'ももか' },      // 別の店の同じ名前 → 消す
    { id: 's1_りな', shop_id: 's1', name: 'りな' },          // 口コミなし → 消す
  ], reviewed);
  const got = `${mark.map((r) => r.id).join(',')}|${remove.map((r) => r.id).join(',')}`;
  const want = 's1_あや,s2_x|s3_ももか,s1_りな';
  if (got !== want) throw new Error(`departRows の自己診断に失敗: ${got}（期待 ${want}）`);
  let threw = false;
  try { splitDeparting([{ id: 'x', name: 'x' }], reviewed); } catch { threw = true; }
  if (!threw) throw new Error('departRows の自己診断に失敗: shop_id の無い行を通した');
}
