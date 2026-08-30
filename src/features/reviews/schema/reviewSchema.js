import { z } from 'zod';
export { STORY_SECTIONS, WRITABLE_STORY_SECTIONS, RATING_AXES } from '../reviewStory.mjs';
import { countReviewStoryChars, withRatingsNote, RATING_AXES as AXES } from '../reviewStory.mjs';

/** 採点コメント（任意）。1軸あたり120字まで */
const ratingNoteShape = Object.fromEntries(
  AXES.map(({ id }) => [id, z.string().trim().max(120).optional().default('')]),
);

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
  // 採点の一言コメント（任意）。本文の最後に「採点コメント」区分として入り、文字数にも数える。
  // ⚠️ 必須にしないこと。崖を1つ下げるつもりが6つ増える。
  ratingNotes: z.object(ratingNoteShape).partial().optional().default({}),
  tags: z.array(z.string()),
  story: z.object({
    entrance: z.string().min(1, { message: '入店の感想を入力してください' }),
    meeting: z.string().optional(),
    session: z.string().optional(),
    afterglow: z.string().optional(),
    exit: z.string().min(1, { message: '総評を入力してください' }),
    // 採点コメントから組み立てられる区分（ユーザーは直接編集しない）
    ratings_note: z.string().optional(),
  }),
})
  // ⚠️ 200字判定は story 単体ではなく **採点コメントを合成してから** 行う。
  //    ここを story 内の refine に戻すと ratingNotes が数に入らず、
  //    画面表示とDB制約（review_story_char_length）がズレて投稿が弾かれる。
  .refine(
    (data) => countReviewStoryChars(withRatingsNote(data.story, data.ratings, data.ratingNotes)) >= 200,
    { message: '口コミは合計200文字以上必要です', path: ['story'] },
  );
