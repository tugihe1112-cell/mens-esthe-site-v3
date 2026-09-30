import React from 'react';
import { joinFields } from '../utils/shopFields';

/**
 * LocationLabel — ピンの図＋「○○」の所在地ラベル。
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
// 地図のピンは絵文字（📍）ではなく線の図にする（2026-09-30・デザインA案＝絵文字をやめる）。
// 絵文字は端末ごとに形と色が違い、朱1色の差し色から外れる。
const Pin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="mr-1 inline-block shrink-0 -translate-y-px align-middle text-pink-400">
    <path d="M12 21s-6-5.3-6-11a6 6 0 1 1 12 0c0 5.7-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" />
  </svg>
);

export default function LocationLabel({
  parts = [],
  className = '',
  prefix = 'pin',
  as: Tag = 'span',
  ...rest
}) {
  const text = joinFields(...parts);
  if (!text) return null;
  return (
    <Tag className={className} {...rest}>
      {prefix === 'pin' ? <Pin /> : (prefix ? `${prefix} ` : '')}{text}
    </Tag>
  );
}
