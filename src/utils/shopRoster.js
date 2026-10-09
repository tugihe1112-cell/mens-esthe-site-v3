/**
 * 店舗ページの在籍一覧を、サーバー（SSR）で HTML に載せるための整形。
 *
 * 🚩 2026-10-09: 以前は在籍一覧をブラウザだけが取りに行っていたので、
 *    最初の HTML では「全 0 人／在籍セラピスト情報はありません」になっていた
 *    （人にはすぐ埋まって見えるが、Google が読む HTML には在籍者が1人も居ない）。
 *
 * ⚠️ 画面（ShopDetailPage の therapists）と**同じ順番・同じ畳み方**にすること。
 *    ずれると、ブラウザが読み込み終わった瞬間にカードが並び替わる・人数が変わる。
 *      1. 退店マーク（is_active === false）は出さない
 *      2. 写真ありを先頭へ（並び替えは安定。元の順は id 昇順＝サーバーと画面で同じ問い合わせ順）
 *      3. normalizeTherapistName で同じ人を1人に畳む（先勝ち）
 *
 * ⚠️ 返す行は画面が使う項目だけ。raw_data は載せない（1行で数KB・HTMLが膨れる）。
 */
import { normalizeTherapistName } from './reviewIdentity.js';

/** HTML に焼く人数。画面の最初の表示件数（INITIAL_DISPLAY_COUNT）と同じ。 */
export const SHOP_ROSTER_SSR_LIMIT = 12;

/** 在籍一覧の問い合わせで取る列。画面のカードが使う項目だけ。 */
export const SHOP_ROSTER_COLUMNS = 'id, shop_id, name, image_url, age, height, cup, is_active';

const hasImage = (t) => Boolean(String(t?.image_url ?? t?.image ?? '').trim());

/** 画面と同じ順・同じ畳み方の在籍一覧（全員）。 */
export function orderShopRoster(rows) {
  const ordered = (Array.isArray(rows) ? rows : [])
    .filter((t) => t && t.is_active !== false)
    .sort((a, b) => Number(hasImage(b)) - Number(hasImage(a)));
  const seen = new Set();
  return ordered.filter((t) => {
    const key = normalizeTherapistName(t.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** SSR の props にする形：先頭 limit 人と、畳んだあとの全人数。 */
export function buildShopRosterProps(rows, limit = SHOP_ROSTER_SSR_LIMIT) {
  const all = orderShopRoster(rows);
  return {
    roster: all.slice(0, limit).map((t) => ({
      id: t.id,
      shop_id: t.shop_id ?? null,
      name: t.name || '',
      image_url: t.image_url || null,
      age: t.age ?? null,
      height: t.height ?? null,
      cup: t.cup ?? null,
      is_active: t.is_active ?? null,
    })),
    total: all.length,
  };
}

/**
 * 在籍カードに出す身長（cm）。出さないときは null。
 *
 * 🚩 2026-10-09: カードは `t.tall` を読んでいたが、DB の列は `height`＝**身長が一度も出ていなかった**
 *    （在籍 57,850 人中 3,341 人が身長を持っている）。
 * ⚠️ 130〜200cm の外は出さない。DB には 254（人ではない行「各部屋の清掃・除菌済み」）や 105 が入っている。
 *    根拠の怪しい数字を画面に出さない（D-010 と同じ考え方）。
 */
export function therapistHeight(t) {
  const v = Number(t?.height ?? t?.tall);
  return Number.isFinite(v) && v >= 130 && v <= 200 ? Math.round(v) : null;
}
