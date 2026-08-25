import React from 'react';
import { joinFields } from '../utils/shopFields';

/**
 * LocationLabel — 「📍 ○○」の所在地ラベル。
 *
 * ⚠️ **中身が無いときは何も描画しない（null を返す）**のが唯一の存在理由。
 *    以前は各ページが `📍 {shop.address}` と直書きしていたため、
 *    住所を持たない614店（全体の56%）で「📍」だけが宙に浮いていた。
 *
 * 使い方:
 *   <LocationLabel parts={[shop.prefecture, shop.city]} className="text-xs" />
 *   → 両方空なら span ごと出ない。片方だけでも出る。重複（埼玉県 埼玉県）は自動で畳まれる。
 *
 * 呼び出し側で `{x && <LocationLabel .../>}` と書く必要はない（二重ガードは不要）。
 */
export default function LocationLabel({
  parts = [],
  className = '',
  prefix = '📍',
  as: Tag = 'span',
  ...rest
}) {
  const text = joinFields(...parts);
  if (!text) return null;
  return (
    <Tag className={className} {...rest}>
      {prefix ? `${prefix} ` : ''}{text}
    </Tag>
  );
}
