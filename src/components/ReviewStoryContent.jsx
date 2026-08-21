import React from 'react';
import { STORY_SECTIONS } from '../features/reviews/reviewStory.mjs';

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
        {structuredSections.map((section) => (
          <section key={section.id} data-review-section={section.id}>
            {sectionHeading(section.desc)}
            <div className="whitespace-pre-wrap">{section.text}</div>
          </section>
        ))}
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

