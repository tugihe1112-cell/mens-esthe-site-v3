import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewSchema } from '../schema/reviewSchema';
import { normalizeReviewStory, composeReviewStoryContent } from '../reviewStory.mjs';
import { useShopData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const useReviewForm = () => {
  const { addReview } = useShopData();
  // ⚠️ 2026-08-12 重大バグ修正: ここは `useAppContext()` の user を見ていた。
  //    AppContext の user は **localStorage(`mens_esthe_user`) ベースの旧実装**で、
  //    LoginPage は Supabase Auth（useAuth().signIn）でログインするだけで
  //    AppContext.login() を呼ばないため、**この user は永遠に null** だった。
  //    結果、PostReviewPage の `if (!user)` が常に成立し、
  //    ログイン済みでも投稿しようとするとログイン画面へ送られる **無限ループ**になっていた。
  //    ＝**実ユーザーは一度も口コミを投稿できていない**（本番の reviews に
  //      UUID形式の user_id が0件であることと一致）。W2Rが回らなかった真因。
  //    認証は Supabase Auth に一本化する。
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フォームの状態管理 (React Hook Form)
  const methods = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      shopId: '',
      therapistId: null,
      therapistName: '',
      ratings: { cleanliness: 3, looks: 3, style: 3, service: 3, massage: 3, intimacy: 3 },
      tags: [],
      story: { entrance: '', meeting: '', session: '', afterglow: '', exit: '' },
    },
    mode: 'onChange',
  });

  const { watch, formState: { isDirty } } = methods;

  // 離脱防止アラート
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const submitReview = async (data) => {
    setIsSubmitting(true);
    try {
      // 入力時の「入店・ご対面・施術・総評」を構造として残す。
      // contentには本文だけを入れ、生成見出しで200/700字特典を水増ししない。
      const storySections = normalizeReviewStory(data.story);
      const combinedContent = composeReviewStoryContent(storySections);
      const totalScore = (Object.values(data.ratings).reduce((a, b) => a + b, 0) / 6).toFixed(1);

      const submitData = {
        shop_id: data.shopId,
        therapist_id: data.therapistId || null,
        therapist_name: data.therapistName || null,
        // ⚠️ 絶対にメールアドレスを表示名にしない。
        //    旧実装は `user?.name || user?.email` で、Supabase の user は .name を持たないため
        //    **投稿者名として本人のメールアドレスが公開される**ところだった（個人情報漏洩）。
        //    表示名は user_metadata のみを見て、無ければ「名無しさん」にする。
        user_name:
          user?.user_metadata?.display_name
          || user?.user_metadata?.name
          || user?.user_metadata?.user_name
          || '名無しさん',
        // 未ログインならここには来ない（PostReviewPage 側でログインへ誘導）が、
        // 万一 null のまま送るとRLSに弾かれるので明示的に空にしておく。
        user_id: user?.id || null,
        rating: parseFloat(totalScore),
        detailed_ratings: data.ratings,
        tags: data.tags,
        content: combinedContent,
        story_sections: storySections,
      };

      if (addReview) {
        const reviewId = await addReview(submitData);
        return { success: true, reviewId };
      } else {
        throw new Error('保存機能が見つかりません');
      }
    } catch (error) {
      console.error(error);
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { methods, isSubmitting, submitReview, user };
};
