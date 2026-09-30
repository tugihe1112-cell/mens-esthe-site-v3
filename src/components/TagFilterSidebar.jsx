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
// 見出しは日本語（「■体型」の記号は外す）。英語の見出しは読む人の役に立たない（2026-09-30・デザインA案）
const TAG_CATEGORIES = TAG_SOURCE.map((c) => ({ id: c.id, title: String(c.title || c.titleEn).replace(/^■/, ''), tags: c.tags }));

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
      <aside
        aria-label="タグで絞り込む"
        className={`${isOpen ? 'fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-[70] block max-h-[78vh] overflow-y-auto rounded-sm bg-slate-950 p-5 border border-slate-700 shadow-2xl' : 'hidden'} lg:z-auto lg:block lg:max-h-none lg:overflow-visible lg:bg-transparent lg:p-0 lg:border-0 lg:shadow-none space-y-5 lg:sticky lg:top-36 self-start`}
      >
        <div className="sticky top-0 -mx-1 -mt-1 flex items-center justify-between bg-slate-950/95 px-1 py-1 backdrop-blur lg:static lg:m-0 lg:bg-transparent lg:p-0">
          <h2 className="font-mincho text-lg font-bold text-slate-50">タグで絞り込む</h2>
          <button onClick={onClose} className="min-w-11 min-h-11 rounded-sm border border-slate-700 text-slate-200 text-xl lg:hidden" aria-label="閉じる">×</button>
        </div>
        {TAG_CATEGORIES.map((category) => (
          <div key={category.id} className="space-y-2">
            <h3 className="text-[11px] tracking-[0.16em] text-slate-400">{category.title}</h3>
            <div className="flex flex-wrap gap-1.5">
              {category.tags.map((tag) => {
                const count = tagCounts[tag] || 0;
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onToggle?.(tag)}
                    disabled={count === 0 && !isSelected}
                    aria-pressed={isSelected}
                    className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs transition ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500 font-bold text-slate-950'
                        : count === 0
                          ? 'cursor-not-allowed border-dashed border-slate-800 text-slate-600'
                          : 'border-slate-700 text-slate-100 hover:border-pink-500/60'
                    }`}
                  >
                    {tag}<span className={isSelected ? '' : 'text-slate-400'}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-[11px] leading-relaxed text-slate-400">タグは口コミを書いた人が付けたもの。数字は付いた口コミの件数です。</p>
        {selectedTags.length > 0 && (
          <button onClick={onClear} className="w-full min-h-11 rounded-sm border border-slate-700 text-xs font-bold text-slate-200 transition hover:border-slate-500">
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
      className="lg:hidden inline-flex w-full min-h-11 mb-4 items-center justify-center gap-2 rounded-sm border border-slate-700 text-xs font-bold text-slate-200"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
      タグで絞り込む{selectedCount > 0 ? `（${selectedCount}）` : ''}
    </button>
  );
}
