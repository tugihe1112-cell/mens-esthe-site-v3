import React from 'react';

/**
 * 線のアイコン（2026-09-30・デザインA案「夜の文芸誌」）。
 *
 * 【なぜ】絵文字（🏢💬📍✨…）は端末ごとに形と色が違い、朱1色の差し色から外れる。
 *   しかも「何のサイトか」を安っぽく見せる。同じ意味の線の図に置き換える。
 * ⚠️ 飾りなので読み上げない（aria-hidden）。意味が要るときは隣に文字を置く。
 * ⚠️ 色は currentColor＝置いた場所の文字色に従う。
 */
const PATHS = {
  search: <><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></>,
  pen: <path d="M4 20l4-1 11-11-3-3L5 16z" />,
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  shop: <><path d="M4 10v10h16V10" /><path d="M3 10l2-6h14l2 6" /><path d="M9 20v-6h6v6" /></>,
  person: <><circle cx="12" cy="8" r="4" /><path d="M5 20c1-4 4-6 7-6s6 2 7 6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c3 3 3 15 0 18" /><path d="M12 3c-3 3-3 15 0 18" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z" />,
  lock: <><rect x="5" y="11" width="14" height="10" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  check: <path d="M5 12l5 5L20 7" />,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v5" /><path d="M12 18h.01" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" /><path d="M3 7l9 6 9-6" /></>,
  star: <path d="M12 3l2.8 6 6.2.5-4.8 4.1 1.6 6.4L12 16.6 6.2 20l1.6-6.4L3 9.5 9.2 9z" />,
  chat: <path d="M5 5h14v10H9l-4 4z" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  save: <><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7V3" /><path d="M8 21v-7h8v7" /></>,
  pin: <><path d="M12 21s-6-5.3-6-11a6 6 0 1 1 12 0c0 5.7-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /><path d="M3 12H1" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  unlock: <><rect x="5" y="11" width="14" height="10" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></>,
  send: <path d="M4 12l16-8-6 16-2-7z" />,
};

export default function LineIcon({ name, size = 16, className = '', strokeWidth = 1.8, filled = false }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`inline-block shrink-0 ${className}`}
    >
      {d}
    </svg>
  );
}
