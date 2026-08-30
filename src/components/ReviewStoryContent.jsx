import React from 'react';
import { STORY_SECTIONS, RATINGS_NOTE_ID } from '../features/reviews/reviewStory.mjs';

const sectionHeading = (label) => (
  <div className="mb-2 mt-4 flex items-center gap-2 first:mt-0" data-review-section-heading>
    <span aria-hidden="true" className="text-xs text-pink-400">›</span>
    <span className="text-xs font-black tracking-wide text-slate-300">{label}</span>
  </div>
);

/**
 * 新規投稿は storySections の構造を使い、入力時と同じ4区分で表示する。
 * 既存口コミは content 内の【見出し】を従来どおり解釈する。
 */
export default function ReviewStoryContent({ content = '', storySections, className = '', ...props }) {
  const structuredSections = storySections && typeof storySections === 'object' && !Array.isArray(storySections)
    ? STORY_SECTIONS
      .map((section) => ({ ...section, text: String(storySections[section.id] || '').trim() }))
      .filter((section) => section.text)
    : [];

  if (structuredSections.length > 0) {
    return (
      <div className={className} {...props}>
        {structuredSections.map((section) => {
          // 採点コメントは体験談の流れとは別物なので、区切って一覧で見せる。
          // ⚠️ 行はそのまま出す（区切り文字をパースしない）。
          //    利用者が任意の記号を打っても壊れないようにするため。
          if (section.id === RATINGS_NOTE_ID) {
            const lines = section.text.split('\n').map((l) => l.trim()).filter(Boolean);
            return (
              <section key={section.id} data-review-section={section.id} className="mt-5 border-t border-white/10 pt-3">
                {sectionHeading(section.desc)}
                <ul className="space-y-1">
                  {lines.map((line, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
                      <span aria-hidden="true" className="text-pink-400 shrink-0">・</span>
                      <span className="whitespace-pre-wrap">{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          return (
            <section key={section.id} data-review-section={section.id}>
              {sectionHeading(section.desc)}
              <div className="whitespace-pre-wrap">{section.text}</div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      {String(content || '').split('\n').map((line, index) => {
        if (line.includes('【') && line.includes('】')) {
          return (
            <React.Fragment key={index}>
              {sectionHeading(line.replace(/[【】]/g, ''))}
            </React.Fragment>
          );
        }
        return <span key={index}>{line}{'\n'}</span>;
      })}
    </div>
  );
}

