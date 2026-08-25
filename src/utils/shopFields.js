/**
 * shopFields.js — 店舗データの「欠損フィールド」を画面に漏らさないための共通処理
 *
 * 【なぜ必要か（2026-08-22 の実測）】
 * 掲載1,099店のうち、
 *   住所なし        614店（56%）
 *   市区+エリアなし  65店
 *   電話なし      1,092店（99%）
 *   営業時間なし    615店（56%）
 *   最寄駅なし      764店（70%）
 * ＝ 半数以上の店舗で「ラベルだけあって中身が無い」状態になり得る。
 * にもかかわらず、各ページが `📍 {shop.address}` のように **無条件で描画** していたため、
 * 本番で「📍だけが浮いている」「空のピンクの箱が出る」表示が全店舗規模で発生していた。
 *
 * 【設計方針】
 * 出し分けを各ファイルに書くと、必ずどこかが書き漏れる（実際に7ファイルで同じミスをしていた）。
 * → **「中身が無ければ null を返す」関数と部品をここに一本化**し、呼び出し側では条件分岐を書かない。
 * ⚠️ ここを迂回して `📍 {shop.xxx}` を直書きすると CI が落ちる
 *    （scripts/ci/check_design_decisions.mjs の D-009）。
 */

/**
 * 値を「表示できる文字列」に正規化する。表示できないものは空文字を返す。
 * - 配列は先頭要素を使う（raw_data.area は配列のことがある）
 * - 文字列 'undefined' / 'null' / 'NaN' もデータ由来のゴミなので空扱い
 *   （実際に店舗SEOのdescriptionへ「undefined」が出力される事故があった）
 */
export function cleanField(v) {
  const raw = Array.isArray(v) ? v[0] : v;
  if (raw === null || raw === undefined) return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (s === 'undefined' || s === 'null' || s === 'NaN') return '';
  return s;
}

/**
 * 複数フィールドを連結する。空のものは捨て、**同じ値の重複も畳む**。
 * 重複を畳むのは「埼玉県 埼玉県」「渋谷 渋谷」のように
 * prefecture と city に同じ値が入っている店舗が実在するため。
 * すべて空なら空文字を返す（＝呼び出し側は何も描画しない）。
 */
export function joinFields(...parts) {
  const out = [];
  for (const p of parts) {
    const s = cleanField(p);
    if (!s) continue;
    if (out.includes(s)) continue;
    out.push(s);
  }
  return out.join(' ');
}

/** 店舗の所在地表示（詳細な住所を優先し、無ければ 都道府県/市区/エリア にフォールバック） */
export function shopLocationText(shop) {
  if (!shop) return '';
  const address = cleanField(shop.address ?? shop.raw_data?.address);
  if (address) return address;
  return joinFields(
    shop.prefecture ?? shop.raw_data?.prefecture,
    shop.city ?? shop.raw_data?.city,
    shop.area ?? shop.raw_data?.area,
  );
}
