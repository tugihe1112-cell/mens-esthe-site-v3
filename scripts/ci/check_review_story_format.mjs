/**
 * 投稿画面の区分が保存時に失われる回帰を止める。
 * 2026-08-22、入力欄は分かれていたが content へ値だけを連結しており、
 * 実ユーザーの初投稿では区分見出しが一切表示されなかった。
 *
 * ⚠️ 2026-08-26: 区分が4→5に増えた（採点コメント ratings_note を追加）。
 *    ここで区分IDをベタ書きすると、区分を足すたびにCIだけが落ちる。
 *    **必ず定義元（reviewStory.mjs）から取る**こと。
 */
import fs from 'fs';
import assert from 'node:assert/strict';
import {
  STORY_SECTIONS,
  WRITABLE_STORY_SECTIONS,
  RATINGS_NOTE_ID,
  normalizeReviewStory,
  composeReviewStoryContent,
  countReviewStoryChars,
  buildRatingsNote,
  withRatingsNote,
} from '../../src/features/reviews/reviewStory.mjs';

const sample = {
  entrance: '  入店本文  ',
  meeting: '対面本文',
  session: '施術本文',
  afterglow: '保存してはいけない旧フィールド',
  exit: '総評本文',
};
const normalized = normalizeReviewStory(sample);

// 採点コメントが無い投稿では、従来どおり体験談4区分だけが残る
assert.deepEqual(Object.keys(normalized), WRITABLE_STORY_SECTIONS.map(({ id }) => id));
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
assert.equal(countReviewStoryChars({ entrance: ' A ', meeting: 'BB', exit: 'C' }), 4);
assert.equal(
  countReviewStoryChars({ entrance: 'A'.repeat(694), meeting: 'B'.repeat(6) }),
  700
);

// ── 採点コメント（2026-08-26 追加）─────────────────────────────────
// ⚠️ 体験談の各欄に**混ぜない**こと。混ぜると
//    「ドアを開けると写真より可愛かった。写真より可愛かった。」のように文章が破綻する。
{
  const ratings = { looks: 2, massage: 4 };
  const notes = { looks: '写真とは別人だった', massage: '強さの確認が丁寧' };
  const story = { entrance: '入店本文', exit: '総評本文' };
  const merged = withRatingsNote(story, ratings, notes);

  // 体験談の欄は一切書き換えられていない
  assert.equal(merged.entrance, '入店本文');
  assert.equal(merged.exit, '総評本文');

  // 採点コメントは独立した区分として、本文の最後に来る
  assert.equal(STORY_SECTIONS[STORY_SECTIONS.length - 1].id, RATINGS_NOTE_ID);
  assert.equal(
    composeReviewStoryContent(merged),
    `入店本文\n\n総評本文\n\n${buildRatingsNote(ratings, notes)}`
  );

  // 文字数に加算される（画面の表示とDBの判定を一致させるため）
  assert.equal(
    countReviewStoryChars(merged) - countReviewStoryChars(story),
    buildRatingsNote(ratings, notes).length
  );

  // 一言が無ければ区分ごと作らない（空の見出しを公開しない）
  assert.equal(withRatingsNote(story, ratings, {})[RATINGS_NOTE_ID], undefined);

  // 投稿画面の入力欄は体験談のぶんだけ（採点コメントの箱を出さない＝二重入力にしない）
  assert.equal(WRITABLE_STORY_SECTIONS.some((s) => s.id === RATINGS_NOTE_ID), false);
}

const read = (path) => fs.readFileSync(path, 'utf8');
const hook = read('src/features/reviews/hooks/useReviewForm.js');
const dataContext = read('src/contexts/DataContext.jsx');
const modernCard = read('src/components/ModernReviewCard.jsx');
const adminPage = read('src/pages/AdminPage.jsx');
const migration = read('supabase_migrations/14_review_story_sections.sql');
const lengthMigration = read('supabase_migrations/15_review_story_character_count.sql');

assert.match(hook, /story_sections:\s*storySections/);
assert.match(dataContext, /story_sections:/);
assert.match(modernCard, /storySections=\{review\.story_sections/);
assert.match(adminPage, /storySections=\{r\.story_sections/);
assert.match(migration, /compose_review_story_content\(story_sections\) = content/);
assert.match(migration, /VALIDATE CONSTRAINT reviews_story_sections_shape/);
assert.match(lengthMigration, /review_story_char_length\(NEW\.story_sections\)/);
assert.match(lengthMigration, /reviews_content_min_length/);

// 採点コメントのマイグレーション（24_）が、組み立て・字数・許可キーの3つを更新していること。
// ⚠️ どれか1つでも欠けると「画面では書けたのにDBが拒否」になる。
const ratingsNoteMigration = read('supabase_migrations/24_review_ratings_note.sql');
assert.match(ratingsNoteMigration, /compose_review_story_content[\s\S]*sections ->> 'ratings_note'/);
assert.match(ratingsNoteMigration, /review_story_char_length[\s\S]*sections ->> 'ratings_note'/);
assert.match(ratingsNoteMigration, /ARRAY\['entrance', 'meeting', 'session', 'exit', 'ratings_note'\]/);

console.log(`✅ 口コミ区分の保存・表示チェック OK（${STORY_SECTIONS.length}区分）`);
