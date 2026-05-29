import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FormProvider, useFormContext, Controller } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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

const Step1_Select = ({ shops, shopTherapists, selectedShopId, setSelectedShopId, paramShopId, initCustomMode }) => {
  const { register, setValue, watch } = useFormContext();
  const selectedTherapistId = watch('therapistId');
  const therapistName = watch('therapistName');
  const [customMode, setCustomMode] = useState(initCustomMode || false);

  // コンボボックス用 state
  const selectedShopName = useMemo(() => shops.find(s => s.id === selectedShopId)?.name || '', [shops, selectedShopId]);
  const [shopInput, setShopInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const comboRef = useRef(null);

  // 選択済みの場合は入力欄を初期化
  useEffect(() => {
    if (selectedShopName) setShopInput(selectedShopName);
  }, [selectedShopName]);

  // 外クリックで候補を閉じる
  useEffect(() => {
    const handleClick = (e) => {
      if (comboRef.current && !comboRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = shopInput.trim().toLowerCase();
    if (!q) return shops.slice(0, 20); // 未入力時は先頭20件
    return shops.filter(s => s.name.toLowerCase().includes(q)).slice(0, 20);
  }, [shops, shopInput]);

  const handleShopSelect = (shop) => {
    setValue('shopId', shop.id);
    setSelectedShopId(shop.id);
    setShopInput(shop.name);
    setShowSuggestions(false);
    setValue('therapistId', null);
    setValue('therapistName', '');
    setCustomMode(false);
  };

  const handleShopInputChange = (e) => {
    setShopInput(e.target.value);
    setShowSuggestions(true);
    // 入力が変わったら選択をクリア
    if (selectedShopId) {
      setValue('shopId', '');
      setSelectedShopId('');
      setValue('therapistId', null);
      setValue('therapistName', '');
    }
  };

  const selectTherapist = (t) => {
    setValue('therapistId', t.id);
    setValue('therapistName', t.name);
    setCustomMode(false);
  };

  const selectNone = () => {
    setValue('therapistId', null);
    setValue('therapistName', '');
    setCustomMode(false);
  };

  const enterCustomMode = () => {
    setValue('therapistId', null);
    setValue('therapistName', '');
    setCustomMode(true);
  };

  const isNoneSelected = !selectedTherapistId && !customMode;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">TARGET</h2>
        <p className="text-slate-400 text-xs">誰のクチコミを書きますか？</p>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
        <label className="block text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest pl-1">STORE</label>

        {paramShopId ? (
          /* URLから来た場合は固定表示 */
          <div className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white font-bold opacity-80 cursor-not-allowed">
            {selectedShopName || '店舗が選択されています'}
          </div>
        ) : (
          /* コンボボックス */
          <div className="relative" ref={comboRef}>
            <input
              type="text"
              value={shopInput}
              onChange={handleShopInputChange}
              onFocus={() => setShowSuggestions(true)}
              placeholder="店舗名を入力して検索..."
              autoComplete="off"
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white font-bold focus:border-pink-500 transition outline-none placeholder:text-slate-600"
            />
            {/* 選択済みチェックマーク */}
            {selectedShopId && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400 text-sm font-bold">✓</div>
            )}
            {/* クリアボタン（入力中・未選択時） */}
            {shopInput && !selectedShopId && (
              <button
                type="button"
                onClick={() => { setShopInput(''); setShowSuggestions(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg leading-none"
              >×</button>
            )}

            {/* 候補ドロップダウン */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 top-full mt-1 w-full bg-slate-800 border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                {suggestions.map(shop => (
                  <li key={shop.id}>
                    <button
                      type="button"
                      onMouseDown={() => handleShopSelect(shop)}
                      className="w-full text-left px-4 py-3 text-sm text-white hover:bg-pink-600/30 transition truncate border-b border-white/5 last:border-0"
                    >
                      {shop.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {selectedShopId && (
        <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl animate-in fade-in duration-500">
          <label className="block text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest pl-1">THERAPIST</label>

          {customMode ? (
            /* カスタムモード: 入力欄のみ表示 */
            <div className="animate-in fade-in duration-300">
              <div className="relative">
                <input
                  type="text"
                  placeholder="セラピスト名を入力してください"
                  value={therapistName || ''}
                  onChange={(e) => setValue('therapistName', e.target.value)}
                  autoFocus
                  className="w-full bg-black/30 border border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-400 placeholder:text-slate-600 transition"
                />
                {therapistName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 text-xs font-bold">✓</div>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-2 pl-1">
                ※ 新人など、まだリストに登録されていないセラピストの名前を入力してください
              </p>
              <button
                type="button"
                onClick={() => { setCustomMode(false); setValue('therapistName', ''); }}
                className="mt-3 text-[11px] text-slate-500 hover:text-slate-300 transition underline"
              >
                ← リストから選ぶ
              </button>
            </div>
          ) : (
            /* 通常モード: 検索バー + セラピストカード一覧 */
            <TherapistGrid
              shopTherapists={shopTherapists}
              selectedTherapistId={selectedTherapistId}
              selectTherapist={selectTherapist}
              enterCustomMode={enterCustomMode}
            />
          )}
        </div>
      )}
    </div>
  );
};

/* セラピスト検索グリッド（検索バー + カード一覧） */
const TherapistGrid = ({ shopTherapists, selectedTherapistId, selectTherapist, enterCustomMode }) => {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase().replace(/[\s　]/g, '');
    if (!q) return shopTherapists;
    return shopTherapists.filter(t =>
      t.name.toLowerCase().replace(/[\s　]/g, '').includes(q)
    );
  }, [shopTherapists, filter]);

  return (
    <div>
      {/* 検索バー */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="セラピスト名で絞り込み..."
          className="w-full bg-black/30 border border-white/10 rounded-xl pl-8 pr-8 py-2.5 text-white text-sm outline-none focus:border-pink-500 transition placeholder:text-slate-600"
        />
        {filter && (
          <button
            type="button"
            onClick={() => setFilter('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg leading-none"
          >×</button>
        )}
      </div>

      {/* カードグリッド */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(t => (
          <button
            type="button"
            key={t.id}
            onClick={() => selectTherapist(t)}
            className={`p-2 rounded-2xl border flex flex-col items-center gap-2 transition active:scale-95 ${selectedTherapistId == t.id ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/30' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10">
              <LazyImage src={t.image_url || t.image} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] font-bold truncate w-full text-center">{t.name}</span>
          </button>
        ))}

        {/* リストにいないセラピスト */}
        <button
          type="button"
          onClick={enterCustomMode}
          className="p-4 rounded-2xl border border-dashed border-white/20 bg-black/20 text-slate-500 flex flex-col items-center justify-center gap-2 transition active:scale-95 hover:border-purple-500/50 hover:text-purple-400"
        >
          <span className="text-xl">✏️</span>
          <span className="text-[10px] font-bold leading-tight text-center">リストに{'\n'}いない</span>
        </button>
      </div>

      {filtered.length === 0 && filter && (
        <p className="text-center text-slate-500 text-sm py-4">「{filter}」に一致するセラピストが見つかりません</p>
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

const MIN_CHARS = 700;

const Step3_Story = () => {
  const { register, watch, formState: { errors } } = useFormContext();
  const story = watch('story') || {};
  const totalChars = Object.values(story).filter(Boolean).join('').length;
  const remaining = Math.max(0, MIN_CHARS - totalChars);
  const pct = Math.min(100, (totalChars / MIN_CHARS) * 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
       <div className="text-center">
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">STORY</h2>
        <p className="text-slate-400 text-xs">あなたの体験を日記のように記録しましょう</p>
      </div>

      {/* 文字数カウンター */}
      <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-bold">合計文字数</span>
          <span className={`text-sm font-black ${totalChars >= MIN_CHARS ? 'text-emerald-400' : 'text-slate-300'}`}>
            {totalChars} <span className="text-slate-600 font-normal">/ {MIN_CHARS}文字以上</span>
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${totalChars >= MIN_CHARS ? 'bg-emerald-500' : 'bg-gradient-to-r from-pink-500 to-purple-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {remaining > 0 && (
          <p className="text-[11px] text-slate-500 mt-1.5">あと {remaining} 文字書くと投稿できます</p>
        )}
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
  const { watch } = useFormContext();
  const therapistName = watch('therapistName');
  const therapistId = watch('therapistId');
  const therapistLabel = therapistName || (therapistId ? null : '指名なし');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">CONFIRM</h2>
        <p className="text-slate-400 text-xs">この内容で投稿しますか？</p>
      </div>

      <div className="bg-slate-900/50 p-8 rounded-3xl text-center border border-white/10">
        {therapistLabel && (
          <div className="mb-4 inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="text-slate-400 text-xs">対象セラピスト:</span>
            <span className="text-white text-sm font-bold">{therapistLabel}</span>
          </div>
        )}
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
  const [searchParams] = useSearchParams();
  const qsShopId = searchParams.get('shopId');
  const initCustomMode = searchParams.get('customMode') === 'true';
  const effectiveShopId = paramShopId || qsShopId;

  const { methods, isSubmitting, submitReview } = useReviewForm();
  const { shops, getTherapistsByShopId } = useShopData();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedShopId, setSelectedShopId] = useState(null);

  // ★ URLパラメータによる初期化 (Data Loadingを待機)
  useEffect(() => {
    if (effectiveShopId && shops.length > 0) {
      setSelectedShopId(effectiveShopId);
      methods.setValue('shopId', effectiveShopId);

      if (paramThreadId) {
        methods.setValue('therapistId', paramThreadId);
        setCurrentStep(2);
      }
    }
  }, [effectiveShopId, paramThreadId, shops, methods]);

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
      case 3: {
        const story = methods.getValues('story') || {};
        const totalChars = Object.values(story).filter(Boolean).join('').length;
        if (totalChars < 700) {
          toast.error(`あと${700 - totalChars}文字書いてください（合計700文字以上必要）`);
          return false;
        }
        isValid = await methods.trigger('story');
        break;
      }
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
      // 戻り先を動的に決定（カスタム名・指名なしは店舗ページへ）
      if (data.shopId && data.therapistId) {
        navigate(`/shops/${data.shopId}/threads/${data.therapistId}`);
      } else if (data.shopId) {
        navigate(`/search?shop=${encodeURIComponent(shops.find(s => s.id === data.shopId)?.name || '')}`);
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
                    paramShopId={effectiveShopId}
                    initCustomMode={initCustomMode}
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
