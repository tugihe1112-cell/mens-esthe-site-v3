import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FormProvider, useFormContext, Controller } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from '../compat/router';
import { Toaster, toast } from 'react-hot-toast';
import { useReviewForm } from '../features/reviews/hooks/useReviewForm';
import { STORY_SECTIONS } from '../features/reviews/schema/reviewSchema';
import { ProgressBar } from '../components/ui/ProgressBar';
import { RatingSlider } from '../components/ui/RatingSlider';
import Header from '../components/Header.jsx';
import LazyImage from '../components/LazyImage.jsx';
import TagSelector from '../components/TagSelector.jsx';
import { useShopData } from '../contexts/DataContext.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { trackEvent } from '../utils/analytics';

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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <SeoHead title="口コミを投稿" noindex />
      <div>
        <h2 className="text-xl font-black text-white tracking-tight mb-1">店舗・セラピストを選択</h2>
        <p className="text-slate-500 text-sm">口コミを書く店舗とセラピストを選んでください</p>
      </div>

      <div className="bg-slate-900 p-5 rounded-2xl border border-white/5 shadow-xl">
        <label className="block text-xs font-bold text-slate-400 mb-3 pl-1">店舗名</label>

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
        <div className="bg-slate-900 p-5 rounded-2xl border border-white/5 shadow-xl animate-in fade-in duration-500">
          <label className="block text-xs font-bold text-slate-400 mb-4 pl-1">セラピスト</label>

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
         <h2 className="text-xl font-black text-white tracking-tight mb-1">採点</h2>
         <p className="text-slate-500 text-sm">スライダーを動かして採点してください</p>
      </div>

      <div className="bg-slate-900 p-5 rounded-2xl border border-white/5 shadow-xl space-y-8">
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

const MIN_CHARS = 200;   // 投稿の最低ライン（崖を下げて投稿率UP）
const BONUS_CHARS = 700; // これ以上で閲覧日数ボーナス（7日）。長文を誘導

// セクション別の書き出しヒント（空白恐怖の解消）
const STORY_HINTS = {
  entrance: ['立地・行きやすさ', '内装・清潔感', '香り・音・第一印象'],
  meeting: ['写真との差', '見た目の印象', '会話・気遣い'],
  session: ['技術の丁寧さ', '強弱・時間配分', '要望への対応'],
  exit: ['満足度', 'どんな人向き', 'また行きたいか'],
};

const Step3_Story = () => {
  const { register, watch, formState: { errors } } = useFormContext();
  const story = watch('story') || {};
  const totalChars = Object.values(story).filter(Boolean).join('').length;
  const pct = Math.min(100, (totalChars / BONUS_CHARS) * 100); // 700字をゴールにした達成率
  const reached200 = totalChars >= MIN_CHARS;
  const reached700 = totalChars >= BONUS_CHARS;
  const meterColor = reached700 ? 'bg-emerald-500' : reached200 ? 'bg-amber-500' : 'bg-gradient-to-r from-pink-500 to-purple-500';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
       <div className="text-center">
        <h2 className="text-xl font-black text-white tracking-tight mb-1">体験談を書く</h2>
        <p className="text-slate-500 text-sm">あなたの体験を日記のように記録しましょう</p>
      </div>

      {/* 達成メーター（0→200字=3日→700字=7日の2段ゴール。しきい値通過でマイルストーンが点灯） */}
      <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs text-slate-400 font-bold">合計文字数</span>
          <span className={`text-lg font-black ${reached700 ? 'text-emerald-400' : reached200 ? 'text-amber-400' : 'text-white'}`}>
            {totalChars}<span className="text-xs text-slate-500 font-bold"> 文字</span>
          </span>
        </div>
        {/* 2段メーター（200と700にマイルストーン線） */}
        <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${meterColor}`} style={{ width: `${pct}%` }} />
          <div className="absolute top-0 bottom-0 w-0.5 bg-slate-950/70" style={{ left: `${(MIN_CHARS / BONUS_CHARS) * 100}%` }} />
        </div>
        {/* マイルストーン2つ（通過で色が点く＝完走のご褒美を可視化） */}
        <div className="flex gap-2 mt-2">
          <span className={`flex-1 text-center text-[11px] font-bold rounded-lg py-1 border transition ${reached200 ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' : 'bg-white/5 text-slate-500 border-white/5'}`}>
            {reached200 ? '✅ 200字・3日分確定！' : `200字で3日（あと${MIN_CHARS - totalChars}）`}
          </span>
          <span className={`flex-1 text-center text-[11px] font-bold rounded-lg py-1 border transition ${reached700 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'bg-white/5 text-slate-500 border-white/5'}`}>
            {reached700 ? '🎉 700字・7日分確定！' : `700字で7日（あと${Math.max(0, BONUS_CHARS - totalChars)}）`}
          </span>
        </div>
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
              {STORY_HINTS[section.id] && (
                <div className="flex flex-wrap gap-1.5 mt-2 pl-1">
                  <span className="text-[10px] text-slate-600 self-center">💡 例:</span>
                  {STORY_HINTS[section.id].map(h => (
                    <span key={h} className="text-[10px] text-slate-500 bg-white/5 border border-white/5 rounded-full px-2 py-0.5">{h}</span>
                  ))}
                </div>
              )}
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
        <h2 className="text-xl font-black text-white tracking-tight mb-1">投稿内容の確認</h2>
        <p className="text-slate-500 text-sm">この内容で投稿しますか？</p>
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

// ゲスト投稿の下書き保存（sessionStorage→localStorageに変更）
// 新規登録のメール確認で別タブに遷移しても下書きが生き残るようにlocalStorageを使う。
// 保存日時を値に持たせ、24時間を過ぎた下書きは破棄する。
const DRAFT_KEY = 'reviewDraft';
const DRAFT_TTL = 24 * 60 * 60 * 1000; // 24h
function saveDraft(data) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), data })); } catch { /* noop */ }
}
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.savedAt || (Date.now() - obj.savedAt) > DRAFT_TTL) { localStorage.removeItem(DRAFT_KEY); return null; }
    return obj.data || null;
  } catch { return null; }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* 旧sessionStorage版の掃除 */ }
}

export default function PostReviewPage() {
  const navigate = useNavigate();
  const { shopId: paramShopId, threadId: paramThreadId } = useParams();
  const [searchParams] = useSearchParams();
  const qsShopId = searchParams.get('shopId');
  const initCustomMode = searchParams.get('customMode') === 'true';
  const effectiveShopId = paramShopId || qsShopId;

  const { methods, isSubmitting, submitReview, user } = useReviewForm();
  const { shops, getTherapistsByShopId } = useShopData();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [completed, setCompleted] = useState(null); // B-3: 投稿後体験 { grantedDays, reviewLink, chars }

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

  // 下書き復元（公開時ログインの往復から戻ってきた時・別タブのメール確認を跨いでも生存）
  useEffect(() => {
    const data = loadDraft();
    if (!data) return;
    methods.reset(data);
    if (data.shopId) setSelectedShopId(data.shopId);
    setCurrentStep(4); // 確認ステップへ
    toast.success('下書きを復元しました。投稿を完了してください', { duration: 4000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回マウントのみ

  // 測定: 投稿フロー開始（Step1到達）— A系改修の投稿ファネル比較用
  useEffect(() => { trackEvent('begin_review'); }, []);

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
        const url = process.env.VITE_SUPABASE_URL;
        const key = process.env.VITE_SUPABASE_ANON_KEY;
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
        if (totalChars < MIN_CHARS) {
          toast.error(`あと${MIN_CHARS - totalChars}文字書いてください（合計${MIN_CHARS}文字以上で投稿OK）`);
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
    // 未ログインなら下書きを保存してログインへ（書いてから公開時ログイン）
    if (!user) {
      saveDraft(data);
      toast('ログイン / 無料登録で投稿が完了します 🔑', { duration: 4000 });
      navigate('/login', { state: { redirect: '/post-review' } });
      return;
    }
    const result = await submitReview(data);
    if (result.success) {
      clearDraft();
      const len = Object.values(data.story || {}).filter(Boolean).join('').length;
      const grantedDays = len >= 700 ? 7 : 3;
      trackEvent('complete_review', { chars: len, granted_days: grantedDays });

      // 管理者へメール通知（失敗しても投稿は成功扱い）
      const shopName = shops.find(s => s.id === data.shopId)?.name || '';
      fetch('/api/notify-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          therapistName: data.therapistName || null,
          userName: data.userName || null,
          rating: data.rating || null,
          content: Object.values(data.story || {}).filter(Boolean).join('\n\n'),
        }),
      }).catch(() => {}); // エラーは無視

      // B-3 投稿後体験: 即リダイレクトせず完了画面を表示（付与日数・自分の口コミへのリンク・通知の案内）
      const reviewLink = (data.shopId && data.therapistId)
        ? `/shops/${data.shopId}/threads/${data.therapistId}`
        : (data.shopId ? `/search?shop=${encodeURIComponent(shopName)}` : '/');
      setCompleted({ grantedDays, reviewLink, chars: len });
      window.scrollTo(0, 0);
    } else {
      toast.error('投稿に失敗しました');
    }
  };

  // B-3: 投稿完了画面（付与日数・自分の口コミへのリンク・週次通知の案内）
  if (completed) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
        <Toaster position="top-center" />
        <Header />
        <div className="pt-24 pb-32 px-4">
          <div className="max-w-md mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-3xl mb-5 shadow-xl shadow-pink-900/40">🎉</div>
            <h1 className="text-2xl font-black text-white mb-2">投稿ありがとうございます！</h1>
            <p className="text-slate-400 text-sm mb-6">あなたの体験談が投稿されました。</p>

            {/* 付与された閲覧日数 */}
            <div className="bg-gradient-to-br from-purple-900/50 to-slate-900 border border-purple-500/25 rounded-2xl p-6 mb-4">
              <div className="text-[11px] font-bold text-purple-300 tracking-widest mb-1">閲覧権が付与されました</div>
              <div className="text-4xl font-black text-white leading-none mb-1">{completed.grantedDays}<span className="text-lg ml-1">日間</span></div>
              <p className="text-[11px] text-slate-400 mt-2">
                {completed.chars >= 700
                  ? '700文字以上の投稿で7日間の閲覧権を付与しました。'
                  : `200文字以上で3日間を付与。あと${Math.max(0, 700 - completed.chars)}文字書くと次回は7日間になります。`}
              </p>
            </div>

            {/* 週次メール通知の案内（B-3・リテンション） */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
              <span className="text-xl shrink-0">📬</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                あなたの口コミが読まれると、<b className="text-slate-200">「今週◯回読まれました」</b>と週次メールでお知らせします。誰かの役に立った実感が届きます。
              </p>
            </div>

            {/* 自分の口コミへのリンク＋回遊 */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate(completed.reviewLink)}
                className="w-full py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg hover:scale-[1.02] transition active:scale-95"
              >
                投稿した口コミを見る →
              </button>
              <button
                type="button"
                onClick={() => navigate('/popular-reviews')}
                className="w-full py-3 rounded-2xl font-bold text-slate-200 bg-slate-900 border border-white/10 hover:border-pink-500/40 transition"
              >
                みんなの口コミを読む
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <span>←</span> {currentStep > 1 ? '戻る' : 'キャンセル'}
                </button>
                <span className="text-slate-500 font-bold text-xs">
                  {currentStep} / {TOTAL_STEPS} ステップ
                  {currentStep < TOTAL_STEPS && <span className="text-pink-400 ml-1.5">あと{TOTAL_STEPS - currentStep}ステップで完了</span>}
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
                    次へ進む <span>→</span>
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
