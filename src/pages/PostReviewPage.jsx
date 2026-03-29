import React, { useState, useMemo, useEffect } from 'react';
import { FormProvider, useFormContext, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useReviewForm } from '../features/reviews/hooks/useReviewForm';
import { STORY_SECTIONS } from '../features/reviews/schema/reviewSchema';
import { ProgressBar } from '../components/ui/ProgressBar';
import { RatingSlider } from '../components/ui/RatingSlider';
import Header from '../components/Header.jsx';
import LazyImage from '../components/LazyImage.jsx';
import TagSelector from '../components/TagSelector.jsx';
import { useShopData } from '../contexts/DataContext.jsx';

// --- Step Components ---

const Step1_Select = ({ shops, shopTherapists, selectedShopId, setSelectedShopId, paramShopId }) => {
  const { register, setValue, watch } = useFormContext();
  const selectedTherapistId = watch('therapistId');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">TARGET</h2>
        <p className="text-slate-400 text-xs">誰のクチコミを書きますか？</p>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
        <label className="block text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest pl-1">STORE</label>
        <div className="relative">
          <select 
            {...register('shopId')}
            value={selectedShopId || ''}
            disabled={!!paramShopId} // URLからIDが来ている場合は操作不可にする
            style={paramShopId ? { opacity: 1, backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'not-allowed' } : {}} // 制御されたコンポーネントにする
            onChange={(e) => {
              const newId = e.target.value;
              setValue('shopId', newId);
              setSelectedShopId(newId);
              setValue('therapistId', null); // 店舗が変わったらセラピストリセット
            }}
            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white font-bold appearance-none focus:border-pink-500 transition outline-none" 
          >
            <option value="">店舗を選択</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
        </div>
      </div>

      {selectedShopId && (
        <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl animate-in fade-in duration-500">
          <label className="block text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest pl-1">THERAPIST</label>
          {shopTherapists.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
               <button 
                 type="button"
                 onClick={() => setValue('therapistId', null)} 
                 className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition active:scale-95 ${!selectedTherapistId ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/30' : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5'}`}
               >
                 <span className="text-xl">😶</span>
                 <span className="text-[10px] font-bold">指名なし</span>
               </button>
               {shopTherapists.map(t => (
                 <button 
                   type="button"
                   key={t.id} 
                   onClick={() => setValue('therapistId', t.id)} 
                   className={`p-2 rounded-2xl border flex flex-col items-center gap-2 transition active:scale-95 ${selectedTherapistId == t.id ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/30' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}
                 >
                   <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10"><LazyImage src={t.image_url || t.image} alt={t.name} className="w-full h-full object-cover" /></div>
                   <span className="text-[10px] font-bold truncate w-full">{t.name}</span>
                 </button>
               ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">セラピストデータがありません</div>
          )}
        </div>
      )}
    </div>
  );
};

const Step2_Rating = () => {
  const { control, watch, setValue } = useFormContext();
  const ratings = watch('ratings');
  const tags = watch('tags');
  
  const RATING_CONFIG = [
    { id: 'looks', label: 'ルックス', icon: '💎', color: 'text-pink-400' },
    { id: 'style', label: 'スタイル', icon: '👙', color: 'text-purple-400' },
    { id: 'massage', label: '技術', icon: '💆‍♀️', color: 'text-blue-400' },
    { id: 'service', label: '接客', icon: '🥰', color: 'text-yellow-400' },
    { id: 'intimacy', label: '密着度', icon: '🔥', color: 'text-red-400' },
    { id: 'cleanliness', label: '清潔感', icon: '✨', color: 'text-emerald-400' },
  ];

  const totalScore = (Object.values(ratings).reduce((a, b) => a + b, 0) / 6).toFixed(1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center relative">
         <div className="w-24 h-24 mx-auto bg-slate-900/80 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-2xl mb-4 relative z-10">
            <span className={`text-4xl font-black ${totalScore >= 4.5 ? 'text-pink-500' : totalScore >= 3.0 ? 'text-white' : 'text-slate-400'}`}>
              {totalScore}
            </span>
         </div>
         <h2 className="text-2xl font-black text-white tracking-tight mb-2">SCORING</h2>
         <p className="text-slate-400 text-xs">スライダーを動かして採点してください</p>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl space-y-8">
        {RATING_CONFIG.map((item) => (
          <Controller
            key={item.id}
            name={`ratings.${item.id}`}
            control={control}
            render={({ field }) => (
              <RatingSlider 
                label={item.label} 
                icon={item.icon} 
                value={field.value} 
                colorClass={item.color} 
                onChange={field.onChange} 
              />
            )}
          />
        ))}
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
        <label className="block text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest pl-1">TAGS (Optional)</label>
        <TagSelector selectedTags={tags} setSelectedTags={(newTags) => setValue('tags', newTags)} />
      </div>
    </div>
  );
};

const Step3_Story = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
       <div className="text-center">
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">STORY</h2>
        <p className="text-slate-400 text-xs">あなたの体験を日記のように記録しましょう</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-[2rem] p-6 border border-white/5 shadow-2xl relative">
          <div className="absolute top-8 bottom-8 left-[27px] w-0.5 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500 opacity-30"></div>
          
          {STORY_SECTIONS.map((section) => (
            <div key={section.id} className="relative pl-10 mb-8 last:mb-0 group">
              <div className="absolute top-0 left-0 w-3.5 h-3.5 rounded-full border-2 bg-slate-900 border-slate-700 z-10"></div>
              
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold text-pink-400 tracking-widest">{section.label}</span>
                <span className="text-slate-500 text-[10px]">{section.desc}</span>
              </div>
              
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all">
                <textarea 
                  {...register(`story.${section.id}`)}
                  placeholder={section.placeholder}
                  className="w-full bg-transparent border-none p-0 text-white placeholder-slate-600 focus:ring-0 outline-none resize-none leading-relaxed text-base min-h-[60px]"
                  rows={2}
                />
              </div>
              {errors.story?.[section.id] && (
                <p className="text-red-400 text-xs mt-1 ml-1">{errors.story[section.id].message}</p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

const Step4_Confirm = ({ isSubmitting }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">CONFIRM</h2>
        <p className="text-slate-400 text-xs">この内容で投稿しますか？</p>
      </div>

      <div className="bg-slate-900/50 p-8 rounded-3xl text-center border border-white/10">
        <p className="text-slate-300 mb-4">内容を確認して、問題なければ投稿してください。</p>
        <p className="text-xs text-slate-500">※投稿後の修正はできません。</p>
      </div>

      <button 
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-2xl font-black text-lg text-white bg-gradient-to-r from-pink-600 to-purple-600 shadow-xl shadow-pink-900/40 hover:scale-[1.02] hover:shadow-pink-900/60 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Posting...</span>
          </>
        ) : (
          <>
            <span>🚀</span> 投稿を完了する
          </>
        )}
      </button>
    </div>
  );
};

// --- Main Page Component ---

const TOTAL_STEPS = 4;

export default function PostReviewPage() {
  const navigate = useNavigate();
  const { shopId: paramShopId, threadId: paramThreadId } = useParams();
  
  const { methods, isSubmitting, submitReview } = useReviewForm();
  const { shops, getTherapistsByShopId } = useShopData();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedShopId, setSelectedShopId] = useState(null);

  // ★ URLパラメータによる初期化 (Data Loadingを待機)
  useEffect(() => {
    if (paramShopId && shops.length > 0) {
      setSelectedShopId(paramShopId);
      methods.setValue('shopId', paramShopId);
      
      if (paramThreadId) {
        methods.setValue('therapistId', paramThreadId);
        // パラメータがある場合でも、ユーザーに確認させるためStep1から表示するが、
        // もし即評価に行かせたいなら setCurrentStep(2) にする
        setCurrentStep(2); 
      }
    }
  }, [paramShopId, paramThreadId, shops, methods]);

  // Shop Data Logic
  const [shopTherapists, setShopTherapists] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchTherapists = async () => {
      if (!selectedShopId) {
        if (isMounted) setShopTherapists([]);
        return;
      }

      // 🚨 共有データ(Context)は文字列しか返さないバグがあるため無視！
      // 常にSupabaseから直接「写真・名前入り」の完全なオブジェクトを取得する
      try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        
        const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
        const res = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${selectedShopId}&select=*`, { headers });
        const data = await res.json();
        
        if (data && data.length > 0 && isMounted) {
          setShopTherapists(data);
        } else if (isMounted) {
          setShopTherapists([]);
        }
      } catch (e) {
        console.error("セラピスト取得エラー:", e);
      }
    };
    fetchTherapists();
    return () => { isMounted = false; };
  }, [selectedShopId]);

  const validateStep = async () => {
    let isValid = false;
    switch (currentStep) {
      case 1: isValid = await methods.trigger('shopId'); break;
      case 2: isValid = await methods.trigger(['ratings', 'tags']); break;
      case 3: isValid = await methods.trigger('story'); break;
      case 4: isValid = true; break;
    }
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid) {
      setCurrentStep((p) => Math.min(TOTAL_STEPS, p + 1));
      window.scrollTo(0, 0);
    } else {
      toast.error('入力内容を確認してください');
    }
  };

  const prevStep = () => setCurrentStep((p) => Math.max(1, p - 1));

  const onSubmit = async (data) => {
    const result = await submitReview(data);
    if (result.success) {
      toast.success('クチコミを投稿しました！');
      // 戻り先を動的に決定
      if (data.shopId && data.therapistId) {
        navigate(`/shops/${data.shopId}/threads/${data.therapistId}`);
      } else if (data.shopId) {
        navigate(`/shops/${data.shopId}`);
      } else {
        navigate('/');
      }
    } else {
      toast.error('投稿に失敗しました');
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
        <Toaster position="top-center" />
        <Header />
        <div className="pt-24 pb-32">
          <ProgressBar current={currentStep} total={TOTAL_STEPS} />

          <div className="max-w-2xl mx-auto px-4">
              {/* Nav Header */}
              <div className="flex items-center justify-between mb-8">
                <button 
                  type="button"
                  onClick={currentStep > 1 ? prevStep : () => navigate(-1)} 
                  className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 transition"
                >
                  <span>←</span> {currentStep > 1 ? 'BACK' : 'CANCEL'}
                </button>
                <span className="text-slate-600 font-black text-[10px] uppercase tracking-[0.2em]">
                  Step {currentStep} / {TOTAL_STEPS}
                </span>
              </div>

              <form onSubmit={methods.handleSubmit(onSubmit)} className="min-h-[60vh]">
                {currentStep === 1 && (
                  <Step1_Select 
                    shops={shops} 
                    shopTherapists={shopTherapists} 
                    selectedShopId={selectedShopId} 
                    setSelectedShopId={setSelectedShopId}
                    paramShopId={paramShopId} 
                  />
                )}
                {currentStep === 2 && <Step2_Rating />}
                {currentStep === 3 && <Step3_Story />}
                {currentStep === 4 && <Step4_Confirm isSubmitting={isSubmitting} />}
              </form>
              
              {/* Footer Nav */}
              {currentStep < 4 && (
                <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-50 flex justify-center pointer-events-none">
                  <button 
                    type="button"
                    onClick={nextStep}
                    className="pointer-events-auto w-full max-w-md py-4 rounded-2xl font-black text-lg shadow-xl bg-white text-slate-900 hover:bg-slate-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    NEXT STEP <span>→</span>
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
