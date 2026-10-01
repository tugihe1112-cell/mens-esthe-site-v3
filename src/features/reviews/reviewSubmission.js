import { normalizeReviewStory, composeReviewStoryContent, withRatingsNote, RATING_AXES, STORY_SECTIONS } from './reviewStory.mjs';

// 確認画面・投稿・コピー用の本文は、同じ整形処理を通す。
export function prepareReviewContent(data = {}) {
  const storySections = normalizeReviewStory(withRatingsNote(data.story, data.ratings, data.ratingNotes));
  const total = RATING_AXES.reduce((sum, { id }) => sum + Number(data.ratings?.[id] || 0), 0);
  return {
    storySections,
    content: composeReviewStoryContent(storySections),
    rating: Number((total / RATING_AXES.length).toFixed(1)),
  };
}

export const reviewAuthorName = (user) => user?.user_metadata?.display_name
  || user?.user_metadata?.name
  || user?.user_metadata?.user_name
  || '名無しさん';

export function reviewBackupText(data, shopLabel = '') {
  const { storySections, rating } = prepareReviewContent(data);
  return [
    `店舗: ${shopLabel || data.shopId || '未選択'}`,
    `セラピスト: ${data.therapistName?.trim() || data.therapistId || '指名なし'}`,
    `総合評価: ${rating.toFixed(1)}`,
    ...RATING_AXES.map(({ id, label }) => `${label}: ${data.ratings?.[id] ?? '未入力'}/5`),
    `タグ: ${data.tags?.length ? data.tags.join('・') : 'なし'}`,
    '',
    ...STORY_SECTIONS.flatMap(({ id, desc }) => storySections[id] ? [`【${desc}】`, storySections[id], ''] : []),
  ].join('\n');
}
