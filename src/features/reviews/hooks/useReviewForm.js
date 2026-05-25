import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewSchema } from '../schema/reviewSchema';
import { useShopData } from '../../../contexts/DataContext';
import { useAppContext } from '../../../context/AppContext';
import { toast } from 'react-hot-toast';

export const useReviewForm = () => {
  const { addReview } = useShopData();
  const { user } = useAppContext();
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
      // データの整形
      const combinedContent = Object.values(data.story).filter(t => t && t.trim().length > 0).join('\n\n');
      const totalScore = (Object.values(data.ratings).reduce((a, b) => a + b, 0) / 6).toFixed(1);

      const submitData = {
        shop_id: data.shopId,
        therapist_id: data.therapistId || null,
        therapist_name: data.therapistName || null,
        user_name: user?.name || user?.email || '名無しさん',
        user_id: user?.id || 'anonymous',
        rating: parseFloat(totalScore),
        detailed_ratings: data.ratings,
        tags: data.tags,
        content: combinedContent,
      };

      if (addReview) {
        await addReview(submitData);
        return { success: true };
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

  return { methods, isSubmitting, submitReview };
};
