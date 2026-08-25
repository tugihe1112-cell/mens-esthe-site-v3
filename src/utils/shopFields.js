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
    const dupAt = out.findIndex((x) => sameLocality(x, s));
    if (dupAt >= 0) {
      // 「大阪 → 大阪市」のように情報量が多いほう（長いほう）を残す
      if (s.length > out[dupAt].length) out[dupAt] = s;
      continue;
    }
    out.push(s);
  }
  return out.join(' ');
}

/**
 * 「大阪市」と「大阪」のように、**市区町村の接尾辞が違うだけで同じ地名**か判定する。
 * ⚠️ 単なる部分一致で畳んではいけない。実データには
 *   「船橋 / 西船橋」「川崎 / 武蔵小杉」「横浜 / 関内」のように
 *   一方が他方を含んでいても**別の場所**という組み合わせが324店ぶんある。
 * そのため「前方一致 かつ 余りが 市/区/町/村/郡 のみ」に限定する（該当75店）。
 */
const CITY_SUFFIX_ONLY = /^[市区町村郡]+$/;
function sameLocality(a, b) {
  if (a === b) return true;
  if (a.startsWith(b) && CITY_SUFFIX_ONLY.test(a.slice(b.length))) return true;
  if (b.startsWith(a) && CITY_SUFFIX_ONLY.test(b.slice(a.length))) return true;
  return false;
}

/**
 * DBの生レコード → 画面が使う形（raw_data を展開しつつ、テーブル列で上書き）。
 *
 * 【なぜ1本化したか（2026-08-22）】
 * 同じ変換が DataContext.jsx と heroShops.js に**2つ**あり、しかも
 * ShopDetailPage は変換を通さず生レコード（`select=*`）をそのまま使っていた。
 * その結果、`shop.address` / `shop.city` / `shop.area` / `shop.prefecture` が
 * **全1,099店で常に undefined** になり、住所も市区も画面に出ていなかった
 * （DBには入っているのに）。＝「データが無い」のではなく「渡していなかった」。
 *
 * ⚠️ **rating / reviewCount は意図的に落とす。**
 * `raw_data.rating` は収集元サイトの評価で、当サイトの口コミに裏付けが無い。
 * 実測: ★>0 を持つ39店のうち **reviewCount は全店 0**。
 * これを表示すると「口コミ0件なのに★4.7」となり、
 * 「掲載料を受け取らないから辛口も載せる」という当サイト唯一の差別化を自ら壊す
 * （＝偽レビューサイトの典型的シグネチャ）。
 * 星は**必ず実際の口コミから算出**すること。ここで落としておけば事故は起こせない。
 */
const SHOP_TABLE_COLUMNS = [
  'id', 'group_id', 'name', 'image_url',
  'website_url', 'schedule_url', 'phone_number', 'business_hours', 'price_system',
];

export function shapeShopRow(row) {
  if (!row) return null;
  const raw = row.raw_data || {};
  const shaped = {
    ...raw,
    // raw_data.area が文字列でない場合（配列・オブジェクト等）は undefined に正規化
    area: typeof raw.area === 'string' ? raw.area : undefined,
  };
  // 収集元の評価は画面に出さない（上のコメント参照）
  delete shaped.rating;
  delete shaped.reviewCount;
  for (const k of SHOP_TABLE_COLUMNS) {
    if (k in row) shaped[k] = row[k];
  }
  // 既存コードに `shop.raw_data?.hours` のようなフォールバックがあるため参照は残す
  shaped.raw_data = raw;
  return shaped;
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
