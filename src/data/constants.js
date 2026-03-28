// src/data/constants.js
// コンバージョン最大化のためのタグ設計

export const TAG_CATEGORIES = [
  {
    id: 'body',
    title: '■体型',
    subtitle: 'まずは好みのスタイルから探す',
    tags: ['スレンダー', 'グラマー', '巨乳', '美脚', '小柄', '高身長']
  },
  {
    id: 'vibe',
    title: '■雰囲気',
    subtitle: '一緒に過ごす時間をイメージ',
    tags: ['可愛い系', '美人系', '清楚系', 'ギャル系', 'お姉さん系']
  },
  {
    id: 'age',
    title: '■年代',
    subtitle: '年齢層で絞り込む',
    tags: ['10代', '20代前半', '20代後半', '30代', '40代']
  },
  {
    id: 'attribute',
    title: '■属性',
    subtitle: 'その他のこだわり',
    tags: ['色白', '健康的', 'ベテラン', '外国人']
  }
];

// 全タグのフラット配列（ロジック計算用）
export const AVAILABLE_TAGS = TAG_CATEGORIES.flatMap(cat => cat.tags);
