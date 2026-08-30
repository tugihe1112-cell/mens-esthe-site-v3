/**
 * reviewStory.mjs — 口コミ本文の「区分」に関する唯一の定義元
 *
 * ⚠️ ここを変えたら **必ず** 以下も同時に更新すること。機械チェックあり
 *    （scripts/ci/check_review_story_sync.mjs がズレを検出してビルドを止める）。
 *    - supabase_migrations の compose_review_story_content / review_story_char_length /
 *      reviews_story_sections_shape（DB側の組み立て・字数・許可キー）
 *    - src/components/ReviewStoryContent.jsx（表示）
 *
 * DBの story_sections と content は、この順序・整形規則で1対1に対応する。
 */

/** 採点の6軸。⚠️ 投稿画面(Step2)の表示と、一言コメントの見出しはここだけで定義する */
export const RATING_AXES = [
  { id: 'looks', label: 'ルックス', icon: '💎', color: 'text-pink-400' },
  { id: 'style', label: 'スタイル', icon: '👙', color: 'text-purple-400' },
  { id: 'massage', label: '技術', icon: '💆‍♀️', color: 'text-blue-400' },
  { id: 'service', label: '接客', icon: '🥰', color: 'text-yellow-400' },
  { id: 'intimacy', label: '密着度', icon: '🔥', color: 'text-red-400' },
  { id: 'cleanliness', label: '清潔感', icon: '✨', color: 'text-emerald-400' },
];

/** 採点コメントを入れる区分のID（本文の最後に置く） */
export const RATINGS_NOTE_ID = 'ratings_note';

/**
 * 本文の区分。**配列の順序がそのまま本文の順序**になる。
 * generated:true は「ユーザーが直接打つ欄ではなく、他の入力から組み立てる区分」。
 * ⚠️ ratings_note は必ず最後に置く（体験談の流れを分断しないため）。
 */
export const STORY_SECTIONS = [
  { id: 'entrance', label: 'ENTRANCE', icon: '🚪', desc: '入店・受付', placeholder: 'お店の雰囲気や、受付の対応はいかがでしたか？（10文字以上）' },
  { id: 'meeting', label: 'MEETING', icon: '👀', desc: 'ご対面', placeholder: 'パネル写真との違いや、第一印象を教えてください。' },
  { id: 'session', label: 'SESSION', icon: '💆‍♀️', desc: '施術・接客', placeholder: 'マッサージの技術や、会話の盛り上がりはどうでしたか？' },
  { id: 'exit', label: 'CONCLUSION', icon: '✨', desc: '総評', placeholder: '満足度や、またリピートしたいか教えてください。（10文字以上）' },
  { id: RATINGS_NOTE_ID, label: 'SCORES', icon: '⭐', desc: '採点コメント', generated: true },
];

/** ユーザーが直接入力する区分だけ（Step3が描画する対象） */
export const WRITABLE_STORY_SECTIONS = STORY_SECTIONS.filter((s) => !s.generated);

/**
 * 採点の一言コメントを1つのテキストに組み立てる。
 *
 * 【なぜ本文に入れるのか（2026-08-26 オーナー判断）】
 * 「一言を書かせておいて文字数に数えないのは筋が通らない」。
 * ただし体験談の各欄に**混ぜてはいけない**（「ドアを開けると写真より可愛かった。
 * 写真より可愛かった。」のように文章が破綻する）。
 * → 独立した区分として**本文の最後にまとめて**置く。
 *
 * 出力例:
 *   ルックス（★2）写真とは別人だった
 *   技術（★4）強さの確認が丁寧だった
 *
 * ⚠️ 表示側は行単位でそのまま出す（区切り文字をパースしない）。
 *    利用者が任意の記号を打っても壊れないようにするため。
 */
export const buildRatingsNote = (ratings = {}, notes = {}) => RATING_AXES
  .map(({ id, label }) => {
    const text = String(notes?.[id] || '').trim();
    if (!text) return '';
    const score = Number(ratings?.[id]);
    return Number.isFinite(score) ? `${label}（★${score}）${text}` : `${label} ${text}`;
  })
  .filter(Boolean)
  .join('\n');

/**
 * 体験談 + 採点コメント を1つの story オブジェクトにまとめる。
 * ⚠️ **文字数カウント・バリデーション・保存の3箇所で必ずこれを通すこと。**
 *    別々に組み立てると「画面では200字なのにDBが拒否する」というズレが起きる
 *    （2026-08-26に列権限で同型の事故を起こしている）。
 */
export const withRatingsNote = (story = {}, ratings = {}, notes = {}) => {
  const note = buildRatingsNote(ratings, notes);
  const next = { ...story };
  if (note) next[RATINGS_NOTE_ID] = note;
  else delete next[RATINGS_NOTE_ID];
  return next;
};

export const normalizeReviewStory = (story = {}) => Object.fromEntries(
  STORY_SECTIONS
    .map(({ id }) => [id, String(story?.[id] || '').trim()])
    .filter(([, text]) => text.length > 0)
);

export const composeReviewStoryContent = (story = {}) => STORY_SECTIONS
  .map(({ id }) => String(story?.[id] || '').trim())
  .filter(Boolean)
  .join('\n\n');

// 区分間に自動挿入する空行は文字数特典へ含めない。
export const countReviewStoryChars = (story = {}) => STORY_SECTIONS
  .reduce((total, { id }) => total + String(story?.[id] || '').trim().length, 0);
