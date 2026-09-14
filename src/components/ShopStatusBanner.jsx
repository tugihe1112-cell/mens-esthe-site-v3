/**
 * ShopStatusBanner — 閉店・営業未確認の帯とバッジ
 *
 * ⚠️ 文言と判定は src/utils/shopStatus.js にしかない。ここで文字列を書かない。
 *    書くと、片方だけ直したときに画面ごとに違うことを言い始める。
 */
import React from 'react';
import { shopStatusText } from '../utils/shopStatus.js';

const TONE = {
  closed: 'bg-slate-700 text-white border-slate-500',
  unconfirmed: 'bg-amber-600/90 text-white border-amber-400/60',
};

/** 一覧カード用の小さな札 */
export function ShopStatusChip({ shop, className = '' }) {
  const s = shopStatusText(shop);
  if (!s) return null;
  return (
    <span
      data-role="shop-status-chip"
      className={`inline-block px-2 py-0.5 rounded-md border text-xs font-bold ${TONE[s.status]} ${className}`}
    >
      {s.short}
    </span>
  );
}

/** 店舗ページ用の帯（説明つき） */
export default function ShopStatusBanner({ shop, className = '' }) {
  const s = shopStatusText(shop);
  if (!s) return null;
  return (
    <div
      data-role="shop-status-banner"
      className={`rounded-xl border px-4 py-3 ${TONE[s.status]} ${className}`}
    >
      <p className="text-sm font-black">{s.label}</p>
      <p className="text-xs mt-1 leading-relaxed opacity-95">{s.note}</p>
    </div>
  );
}
