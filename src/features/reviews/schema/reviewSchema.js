import { z } from 'zod';

export const STORY_SECTIONS = [
  { id: 'entrance', label: 'ENTRANCE', icon: '🚪', desc: '入店・受付', placeholder: 'お店の雰囲気や、受付の対応はいかがでしたか？（10文字以上）' },
  { id: 'meeting', label: 'MEETING', icon: '👀', desc: 'ご対面', placeholder: 'パネル写真との違いや、第一印象を教えてください。' },
  { id: 'session', label: 'SESSION', icon: '💆‍♀️', desc: '施術・接客', placeholder: 'マッサージの技術や、会話の盛り上がりはどうでしたか？' },
  { id: 'exit', label: 'CONCLUSION', icon: '✨', desc: '総評', placeholder: '満足度や、またリピートしたいか教えてください。（10文字以上）' }
];

export const reviewSchema = z.object({
  shopId: z.string().min(1, { message: '店舗を選択してください' }),
  therapistId: z.string().nullable(),
  // ⚠️ 2026-08-12 追加（重大バグ修正）:
  //    ここに therapistName が無かった。Zod の z.object() は**スキーマに無いキーを
  //    parse 結果から削除する**ため、フォームで setValue('therapistName', ...) しても
  //    handleSubmit 後の data.therapistName は消えていた。
  //    reviews.therapist_name 列は nullable なので **エラーにならず静かに NULL で保存**され、
  //    さらに set_first_review_public() は therapist_name が空だと初回公開しないため、
  //    「投稿は成功するがセラピスト名が無く、しかも公開もされない」状態になっていた。
  therapistName: z.string().trim().max(100).optional().default(''),
  ratings: z.object({
    cleanliness: z.number().min(1).max(5),
    looks: z.number().min(1).max(5),
    style: z.number().min(1).max(5),
    service: z.number().min(1).max(5),
    massage: z.number().min(1).max(5),
    intimacy: z.number().min(1).max(5),
  }),
  tags: z.array(z.string()),
  story: z.object({
    entrance: z.string().min(1, { message: '入店の感想を入力してください' }),
    meeting: z.string().optional(),
    session: z.string().optional(),
    afterglow: z.string().optional(),
    exit: z.string().min(1, { message: '総評を入力してください' }),
  }).refine((data) => {
    const total = Object.values(data).filter(Boolean).join('').length;
    return total >= 200;
  }, { message: '口コミは合計200文字以上必要です' }),
});
