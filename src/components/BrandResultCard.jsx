import { shopHref } from '../utils/brandGroups.js';
import React, { useState } from 'react';
import { Link } from '../compat/router';
import LazyImage from './LazyImage';
import { getDisplayName } from '../utils/shopHelpers';
import LocationLabel from './LocationLabel.jsx';

export default function BrandResultCard({ summary, shops, roomCounts = null }) {
  const [isOpen, setIsOpen] = useState(false);

  // 🚩 並べるのは**このブランドの全ルーム**（summary.rooms）。
  //    `shops` は一覧表示用に**重複排除済み**で、ブランドにつき1行しか残っていない。
  //    それを渡していたので「店舗をすべて見る ▼」を開いても**1枚しか出なかった**
  //    （2026-09-20、本番で確認。見出しは「3店舗 展開中」なのに中身は1枚）。
  const rooms = (summary?.rooms?.length ? summary.rooms : shops) || [];

  // 代表画像がない場合のフォールバック
  const heroImage = summary.representativeImage || rooms[0]?.image_url || rooms[0]?.image;

  // 🚩 このブランドの行き先は1つ。判定は増やさず shopHref に任せる
  //    （多ルームなら /brands/<group_id>、単独店なら /shops/<id>）。
  const brandHref = rooms.length ? shopHref(rooms[0], roomCounts) : null;

  return (
    <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-pink-500/30 shadow-2xl shadow-pink-900/20 mb-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative h-48 md:h-64">
        {/* 背景画像 */}
        <LazyImage 
          src={heroImage} 
          alt={summary.brandName} 
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
        
        {/* ブランド情報 */}
        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
          <div className="flex items-end justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-pink-600 text-white text-[10px] font-bold rounded-full mb-2 shadow-lg shadow-pink-600/40">
                系列ブランド
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight shadow-black drop-shadow-md">
                {summary.brandName}
              </h2>
              <p className="text-slate-300 text-sm mt-1 font-medium">
                <span className="text-pink-400 font-bold">{summary.shopCount}店舗</span> 展開中
                {/* ⚠️ 在籍人数は**店舗行からは数えられない**（セラピストを持っていないので必ず0になる）。
                       「総勢0名」は根拠のない数字を画面に出すのと同じ（D-010）。数えられないものは出さない。
                       人数を出せるのはブランドページだけ（SSRが人単位で数えている）。 */}
                {Number(summary.therapistCount) > 0 && (
                  <>
                    <span className="mx-2 opacity-50">|</span>
                    総勢 <span className="text-pink-400 font-bold">{summary.therapistCount}名</span> のセラピスト
                  </>
                )}
              </p>
            </div>
            
            {/* 展開ボタン (PC用) */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full font-bold transition backdrop-blur-md"
            >
              {isOpen ? '店舗リストを閉じる' : '店舗一覧を表示'}
              <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* スマホ用展開ボタン */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-full py-4 text-center text-sm font-bold text-slate-300 border-t border-white/5 bg-white/5 active:bg-white/10 transition"
      >
        {isOpen ? '閉じる ▲' : '店舗をすべて見る ▼'}
      </button>

      {/* 展開される店舗リスト */}
      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 p-6' : 'grid-rows-[0fr] opacity-0 p-0'}`}>
        <div className="overflow-hidden">
          {/* 🚩 入口は**1つ**にする（2026-09-20 オーナー決定）。
                 D-014 で多ルームの店舗ページはブランドページへ301するので、
                 ルームを1つずつリンクにすると**3つ選べるように見えて行き先は全部同じ**になる。
                 「大森」を押した人は大森のページに行くつもりで押している。
              ⚠️ ここを消すだけにしてはいけない。このカードは**他にリンクを持っていない**ので、
                 リンクを全部外すと検索結果から一歩も進めない行き止まりになる。 */}
          {brandHref && (
            <Link
              to={brandHref}
              className="inline-flex items-center gap-2 mb-4 bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm px-5 py-2.5 rounded-full transition"
            >
              {summary.brandName}のページを見る →
            </Link>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ⚠️ ルームは「どこにあるか」の表示。リンクにしない（ブランドページのルーム欄と同じ判断）。 */}
            {rooms.map((shop) => (
              <div
                key={shop.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-white/5"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm truncate">{getDisplayName(shop.name, shop)}</h3>
                  {/* 🚩 地名は area から。県と市区だけだと**3ルームが全部「東京都 大田区」**になり、
                         どれが大森でどれが蒲田か分からない（2026-09-20、店名を揃えた結果そうなった）。
                         ルーム欄の存在理由は「どこにあるか」なので、ここが潰れると欄ごと無意味になる。 */}
                  <LocationLabel
                    as="p"
                    className="text-slate-500 text-xs truncate"
                    parts={[Array.isArray(shop.area) ? shop.area[0] : shop.area, shop.prefecture, shop.city]}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
