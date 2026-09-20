import React from 'react';
import { TAG_CATEGORIES as TAG_SOURCE } from '../data/constants';

/**
 * TagFilterSidebar — 口コミに付いたタグで在籍セラピストを絞り込む列（D-001）
 *
 * 【これはオーナー確定デザイン。Claudeの判断で形を変えない】
 * decisions.md D-001: 「以前作った右にタグ・真ん中に写真の形式に戻して／このミス何回も起きてる」
 * ＝**左にタグの列、右にキャスト一覧**（SearchPageと同じ見え方）。タブUIは禁止。
 * ⚠️ 2026-09-20 オーナー確認: **左のままでよい**（実装が左、decisions.md本文も左。
 *    引用の「右」は当時の言い回しで、現物は左で合っているとの回答）。
 *
 * 【なぜ部品にしたか（2026-09-20）】
 * 9/15のD-014で多ルームの店舗ページを `/brands/:id` へ301したあと、
 * 9/19に「タグを移植した」と報告したが、**移植したのは機能だけで形を移していなかった**。
 * ブランドページは開閉ボタン1つになっており、**370店・全体の34%がこの列を失っていた**。
 * ⇒ 店舗ページとブランドページが**同じ部品**を描く形にして、二度と片方だけ古くならないようにする。
 *
 * ⚠️ **条件で出し分けない。** タグ件数が全て0でも、名簿が何人でも、常に出す。
 *    2026-08-21に「0件なら隠す」分岐が入り、口コミ0件の店だけ別レイアウトになって
 *    オーナーから4回同じ指摘を受けた。**分岐を作らないこと自体が再発防止**。
 */
const TAG_CATEGORIES = TAG_SOURCE.map((c) => ({ id: c.id, title: c.titleEn, tags: c.tags }));

export function TagFilterSidebar({
  tagCounts = {},
  selectedTags = [],
  onToggle,
  onClear,
  isOpen = false,
  onClose,
}) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="絞り込みを閉じる"
          onClick={onClose}
          className="fixed inset-0 z-[65] bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside className={`${isOpen ? 'fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-[70] block max-h-[78vh] overflow-y-auto rounded-3xl bg-slate-950 p-4 border border-white/10 shadow-2xl' : 'hidden'} lg:z-auto lg:block lg:max-h-none lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0 lg:border-0 lg:shadow-none space-y-4 lg:sticky lg:top-36 self-start`}>
        <div className="lg:hidden sticky top-0 -mx-1 -mt-1 mb-2 flex items-center justify-between rounded-2xl bg-slate-950/95 px-2 py-2 backdrop-blur">
          <div>
            <p className="text-sm font-black text-white">タグで絞り込む</p>
            <p className="text-xs text-slate-500">口コミに付いたタグから選べます</p>
          </div>
          <button onClick={onClose} className="min-w-11 min-h-11 rounded-full bg-slate-800 text-white text-xl" aria-label="閉じる">×</button>
        </div>
        {TAG_CATEGORIES.map((category) => (
          <div key={category.id} className="bg-slate-900/40 backdrop-blur rounded-2xl p-4 border border-white/5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
              {category.title}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {category.tags.map((tag) => {
                const count = tagCounts[tag] || 0;
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onToggle?.(tag)}
                    disabled={count === 0 && !isSelected}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-pink-600 border-pink-500 text-white'
                        : count === 0
                          ? 'bg-transparent border-slate-800 text-slate-700 cursor-not-allowed'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {tag} <span className="opacity-50">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {selectedTags.length > 0 && (
          <button onClick={onClear} className="w-full py-2 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition">
            絞り込みを解除
          </button>
        )}
      </aside>
    </>
  );
}

/** スマホでサイドバーを開くボタン。⚠️ こちらも条件で出し分けない（PCの列と同じ扱い）。 */
export function TagFilterButton({ selectedCount = 0, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="lg:hidden w-full min-h-11 mb-4 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-slate-300"
    >
      🔎 タグで絞り込む{selectedCount > 0 ? `（${selectedCount}）` : ''}
    </button>
  );
}
