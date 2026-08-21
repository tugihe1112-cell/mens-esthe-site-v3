/**
 * 投稿画面の4区分が保存時に失われる回帰を止める。
 * 2026-08-22、入力欄は分かれていたが content へ値だけを連結しており、
 * 実ユーザーの初投稿では区分見出しが一切表示されなかった。
 */
import fs from 'fs';
import assert from 'node:assert/strict';
import {
  STORY_SECTIONS,
  normalizeReviewStory,
  composeReviewStoryContent,
} from '../../src/features/reviews/reviewStory.mjs';

const sample = {
  entrance: '  入店本文  ',
  meeting: '対面本文',
  session: '施術本文',
  afterglow: '保存してはいけない旧フィールド',
  exit: '総評本文',
};
const normalized = normalizeReviewStory(sample);

assert.deepEqual(Object.keys(normalized), STORY_SECTIONS.map(({ id }) => id));
assert.equal(normalized.entrance, '入店本文');
assert.equal(normalized.afterglow, undefined);
assert.equal(
  composeReviewStoryContent(normalized),
  '入店本文\n\n対面本文\n\n施術本文\n\n総評本文'
);
assert.equal(
  composeReviewStoryContent({ entrance: 'A', meeting: '', exit: 'C' }),
  'A\n\nC'
);

const read = (path) => fs.readFileSync(path, 'utf8');
const hook = read('src/features/reviews/hooks/useReviewForm.js');
const dataContext = read('src/contexts/DataContext.jsx');
const modernCard = read('src/components/ModernReviewCard.jsx');
const adminPage = read('src/pages/AdminPage.jsx');
const migration = read('supabase_migrations/14_review_story_sections.sql');

assert.match(hook, /story_sections:\s*storySections/);
assert.match(dataContext, /story_sections:/);
assert.match(modernCard, /storySections=\{review\.story_sections/);
assert.match(adminPage, /storySections=\{r\.story_sections/);
assert.match(migration, /compose_review_story_content\(story_sections\) = content/);
assert.match(migration, /VALIDATE CONSTRAINT reviews_story_sections_shape/);

console.log('✅ 口コミ4区分の保存・表示チェック OK');

