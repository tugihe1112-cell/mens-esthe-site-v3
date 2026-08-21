export const STORY_SECTIONS = [
  { id: 'entrance', label: 'ENTRANCE', icon: '🚪', desc: '入店・受付', placeholder: 'お店の雰囲気や、受付の対応はいかがでしたか？（10文字以上）' },
  { id: 'meeting', label: 'MEETING', icon: '👀', desc: 'ご対面', placeholder: 'パネル写真との違いや、第一印象を教えてください。' },
  { id: 'session', label: 'SESSION', icon: '💆‍♀️', desc: '施術・接客', placeholder: 'マッサージの技術や、会話の盛り上がりはどうでしたか？' },
  { id: 'exit', label: 'CONCLUSION', icon: '✨', desc: '総評', placeholder: '満足度や、またリピートしたいか教えてください。（10文字以上）' },
];

// DBの story_sections と content はこの順序・整形規則で1対1に対応させる。
// 見出しは保存本文へ混ぜない。200/700字特典を、運営が生成した見出し文字で
// 水増ししないためである。
export const normalizeReviewStory = (story = {}) => Object.fromEntries(
  STORY_SECTIONS
    .map(({ id }) => [id, String(story?.[id] || '').trim()])
    .filter(([, text]) => text.length > 0)
);

export const composeReviewStoryContent = (story = {}) => STORY_SECTIONS
  .map(({ id }) => String(story?.[id] || '').trim())
  .filter(Boolean)
  .join('\n\n');

