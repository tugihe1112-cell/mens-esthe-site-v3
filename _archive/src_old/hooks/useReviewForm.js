import { useState, useMemo, useEffect, useRef } from 'react';

export const STORY_SECTIONS = [
  { id: 'entrance', label: '🚪 お店に入った瞬間の印象や、受付での雰囲気', placeholder: 'ドアを開けた瞬間、どんな香りや音がしましたか？\n初めての場所での緊張感や、受付の方の対応で「ホッとした」瞬間があれば教えてください。', required: true },
  { id: 'meeting', label: '👩 セラピストと対面したときの第一印象', placeholder: 'パネル写真と比べてどうでしたか？\n「当たりだ！」と直感したポイントや、挨拶を交わした時の声のトーン、笑顔の印象はどうでしたか？', required: false },
  { id: 'session', label: '💆‍♀️ 施術中に感じたこと、会話、技術、空気感', placeholder: '施術中の「あ、そこ気持ちいい」と感じた瞬間や、会話の中で印象に残った言葉はありますか？\n部屋の照明やBGMなど、空間の居心地についても教えてください。', required: false },
  { id: 'afterglow', label: '✨ 施術が終わった後の余韻や、気持ちの変化', placeholder: 'シャワーを浴びている時や着替えている時、体や心はどんな状態でしたか？\n来る前と比べて、ストレスや疲れはどう変化しましたか？', required: false },
  { id: 'exit', label: '👟 お店を出るとき、どんな気持ちでしたか？', placeholder: 'お店を出て駅に向かう道中、何を考えていましたか？\n「また来月来よう」「次は違うコースにしよう」など、次回の再訪意欲について教えてください。', required: true }
];

export const useReviewForm = () => {
  const [storyInputs, setStoryInputs] = useState({ entrance: '', meeting: '', session: '', afterglow: '', exit: '' });
  const [detailedRatings, setDetailedRatings] = useState({ cleanliness: 3.0, looks: 3.0, style: 3.0, service: 3.0, massage: 3.0, intimacy: 3.0 });
  const previewRef = useRef(null);
  const hasScrolledRef = useRef(false);

  const totalCharCount = useMemo(() => Object.values(storyInputs).reduce((acc, t) => acc + t.trim().length, 0), [storyInputs]);
  
  const progress = useMemo(() => {
    const completed = Object.values(storyInputs).filter(v => v.trim().length > 10).length;
    return Math.min(100, Math.round((completed / STORY_SECTIONS.length) * 100));
  }, [storyInputs]);

  const calculatedRating = useMemo(() => {
    const values = Object.values(detailedRatings);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(avg * 2) / 2;
  }, [detailedRatings]);

  const combinedContent = useMemo(() => {
    return STORY_SECTIONS.map(s => storyInputs[s.id].trim()).filter(t => t.length > 0).join('\n\n');
  }, [storyInputs]);

  useEffect(() => {
    if (totalCharCount > 100 && !hasScrolledRef.current && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      hasScrolledRef.current = true;
    }
  }, [totalCharCount]);

  useEffect(() => {
    const handler = (e) => {
      if (totalCharCount > 10) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [totalCharCount]);

  return {
    storyInputs, setStoryInputs,
    detailedRatings, setDetailedRatings,
    totalCharCount, progress, calculatedRating, combinedContent,
    previewRef
  };
};
