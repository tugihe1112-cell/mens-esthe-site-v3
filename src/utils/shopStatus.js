/**
 * shopStatus.js — 「この店はまだ営業しているか」の唯一の判定と文言
 *
 * 【背景（2026-09-14）】
 * 外形監査で公式サイトが消えた店が見つかったが、**サイトが消えた＝閉店ではなかった**。
 * ドメインが消えていた18店を実際に調べたところ、15店は営業中でURLが変わっただけだった。
 * 一方で、本当に畳んだと思われる店（LOHAS金沢・Mirajour）も実在する。
 *
 * ⚠️ だから状態を2つに分ける。**一緒にしてはいけない。**
 *    - closed …………… 閉店が**確認できた**（公式の閉店告知・ポータルの閉店表示など）
 *    - 営業未確認 ……… サイトが消えた等で**確かめられない**だけ。閉店とは言い切れない
 *    「確認できない」を「閉店」と表示するのは、営業中の店に閉店の札を貼ることになる。
 *
 * ⚠️ どちらの場合も**店舗ページと口コミは残す**。消さない。
 *    利用者が書いた口コミは、店の都合で消してよいものではない。
 *    公開済みURLを殺さないという方針も、セラピストの退店表示と同じ。
 *
 * ⚠️ 帯が付いた店も**検索結果・エリア一覧に出したまま**にする（2026-09-14 利用者判断）。
 *    探して見つからないより、見つけたうえで状態が分かるほうがよい。
 *
 * データの持ち方: shops に状態の列がないため raw_data に持たせる
 * （セラピストの raw_data.archived と同じやり方）。
 *   raw_data.closed = true               … 閉店が確認できた
 *   raw_data.operation_unconfirmed = true … 営業が確認できない
 *   raw_data.status_note = '…'            … 根拠（任意。画面には出さず記録用）
 */

/** 閉店が確認できた店 */
export const CLOSED_LABEL = '閉店・掲載終了';
export const CLOSED_SHORT = '閉店';
export const CLOSED_NOTE =
  'この店舗は閉店（掲載終了）が確認できています。過去の口コミはそのまま残しています。';

/** 営業が確認できない店（閉店とは言い切れない） */
export const UNCONFIRMED_LABEL = '営業を確認できていません';
export const UNCONFIRMED_SHORT = '営業未確認';
export const UNCONFIRMED_NOTE =
  '公式サイトにつながらないため、現在も営業しているか確認できていません（移転・URL変更の可能性もあります）。過去の口コミはそのまま残しています。最新の情報は公式の案内でご確認ください。';

/** @returns {'closed'|'unconfirmed'|null} */
export function shopStatusOf(shop) {
  if (!shop) return null;
  const raw = shop.raw_data || {};
  if (shop.closed === true || raw.closed === true) return 'closed';
  if (shop.operationUnconfirmed === true || raw.operation_unconfirmed === true) return 'unconfirmed';
  return null;
}

/** 帯に出す文言。状態が無ければ null（呼び出し側は何も描かない）。 */
export function shopStatusText(shop) {
  const status = shopStatusOf(shop);
  if (status === 'closed') return { status, label: CLOSED_LABEL, short: CLOSED_SHORT, note: CLOSED_NOTE };
  if (status === 'unconfirmed') return { status, label: UNCONFIRMED_LABEL, short: UNCONFIRMED_SHORT, note: UNCONFIRMED_NOTE };
  return null;
}
