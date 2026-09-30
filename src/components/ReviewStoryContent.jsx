import React from 'react';
import { STORY_SECTIONS, RATINGS_NOTE_ID } from '../features/reviews/reviewStory.mjs';

// 区分の番号は定義の並び（01 入店・受付 … 05 採点コメント）で固定する。
// 書かれていない区分があっても番号を詰めない＝どの口コミでも「02 はご対面」と読める。
const sectionNo = (id) => String(STORY_SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, '0');

const Heading = ({ no, label }) => (
  <span className="flex items-baseline gap-2.5" data-review-section-heading>
    {no && <span aria-hidden="true" className="font-numeral text-[15px] text-pink-500">{no}</span>}
    <span className="font-mincho text-[17px] font-bold text-slate-100">{label}</span>
  </span>
);

const SECTION_BOX = 'border-t border-slate-800 first:border-t-0';

/**
 * 口コミ本文。新規投稿は storySections の構造（入力時と同じ区分）で、雑誌の記事のように
 * 番号と見出しを付けて組む（2026-09-30・デザインA案）。既存口コミは content 内の【見出し】を解釈する。
 *
 * @param collapseIds   畳んでおく区分（例: ['entrance','session']）。本文はHTMLに入ったまま
 *                      （<details> の中＝検索エンジンにも読まれる・D-013）。
 * @param onSectionOpen 利用者が畳まれた区分を開いたとき（計測用）
 */
export default function ReviewStoryContent({
  content = '',
  storySections,
  className = '',
  collapseIds = [],
  onSectionOpen,
  ...props
}) {
  const structuredSections = storySections && typeof storySections === 'object' && !Array.isArray(storySections)
    ? STORY_SECTIONS
      .map((section) => ({ ...section, text: String(storySections[section.id] || '').trim() }))
      .filter((section) => section.text)
    : [];

  if (structuredSections.length > 0) {
    // 開いている区分が1つも無くなる畳み方はしない（全部が「開く」だけの口コミにしない）
    const anyOpen = structuredSections.some((s) => !collapseIds.includes(s.id));
    const collapsed = (id) => anyOpen && collapseIds.includes(id);

    return (
      <div className={className} {...props}>
        {structuredSections.map((section) => {
          const no = sectionNo(section.id);
          // 採点コメントは体験談の流れとは別物なので、一覧で見せる。
          // ⚠️ 行はそのまま出す（区切り文字をパースしない）。
          //    利用者が任意の記号を打っても壊れないようにするため。
          const body = section.id === RATINGS_NOTE_ID ? (
            <ul className="space-y-1.5">
              {section.text.split('\n').map((l) => l.trim()).filter(Boolean).map((line, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
                  <span aria-hidden="true" className="shrink-0 text-pink-400">・</span>
                  <span className="whitespace-pre-wrap">{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="whitespace-pre-wrap">{section.text}</div>
          );

          if (collapsed(section.id)) {
            return (
              <details key={section.id} data-review-section={section.id} className={`group ${SECTION_BOX}`}>
                <summary
                  className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden"
                  onClick={(e) => { if (!e.currentTarget.parentElement?.open) onSectionOpen?.(section.id); }}
                >
                  <Heading no={no} label={section.desc} />
                  <span className="shrink-0 font-sans text-xs text-slate-400">
                    <span className="group-open:hidden">開く</span>
                    <span className="hidden group-open:inline">閉じる</span>
                  </span>
                </summary>
                <div className="pb-5">{body}</div>
              </details>
            );
          }
          return (
            <section key={section.id} data-review-section={section.id} className={`${SECTION_BOX} py-5 first:pt-0`}>
              <div className="mb-2.5"><Heading no={no} label={section.desc} /></div>
              {body}
            </section>
          );
        })}
      </div>
    );
  }

  let legacyNo = 0;
  return (
    <div className={className} {...props}>
      {String(content || '').split('\n').map((line, index) => {
        if (line.includes('【') && line.includes('】')) {
          legacyNo += 1;
          return (
            <span key={index} className="mb-2 mt-5 block first:mt-0">
              <Heading no={String(legacyNo).padStart(2, '0')} label={line.replace(/[【】]/g, '')} />
            </span>
          );
        }
        return <span key={index}>{line}{'\n'}</span>;
      })}
    </div>
  );
}
