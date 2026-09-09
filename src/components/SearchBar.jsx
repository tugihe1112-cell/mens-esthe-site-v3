import React, { useState } from 'react';
import { useNavigate } from '../compat/router';

// ⚠️ DESIGN.md U02-4/5:
//   ・入力と検索ボタンは**同じ行**。高さ48px、ボタン幅はスマホ72px・PC96px、間隔8px。
//   ・入力は `min-width:0`（flex の中で縮まないと、ボタンが画面外へ押し出される）。
//   ・検索欄は**常時ラベル**を持つ。placeholder はラベルの代わりにならない
//     （入力を始めた瞬間に消えるので、何を入れる欄か分からなくなる）。
//   ・Enterでも検索できる（form の submit のままにする）。
//   ・モード変更で入力値を消す現行仕様は、この見た目変更で変えない。
export default function SearchBar() {
  const [shopInput, setShopInput] = useState('');
  const [castInput, setCastInput] = useState('');
  const [mobileMode, setMobileMode] = useState('shop');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (shopInput.trim()) params.set('shop', shopInput.trim());
    if (castInput.trim()) params.set('cast', castInput.trim());
    navigate(`/search?${params.toString()}`);
  };

  const fieldClass =
    'w-full min-w-0 rounded-xl border border-white/10 bg-white/10 px-3.5 text-white placeholder-slate-400 transition focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500';
  const fieldStyle = { height: '48px', fontSize: '16px', fontWeight: 700 };
  const submitClass =
    'shrink-0 rounded-xl bg-[#be185d] font-black text-white transition hover:bg-[#9d174d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 active:scale-[0.98]';

  return (
    <form onSubmit={handleSearch}>
      {/* スマホは検索対象を切り替えて入力欄を1つだけ表示。2欄縦積みで
          ファーストビューを使い切っていた問題を解消する。PCは従来どおりAND検索。 */}
      <div className="sm:hidden">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/20 p-1" role="group" aria-label="検索対象">
          {[
            { key: 'shop', label: '店舗・エリア' },
            { key: 'cast', label: 'セラピスト' },
          ].map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => {
                setMobileMode(mode.key);
                if (mode.key === 'shop') setCastInput('');
                else setShopInput('');
              }}
              aria-pressed={mobileMode === mode.key}
              className={`min-h-11 rounded-lg font-black transition ${
                mobileMode === mode.key ? 'bg-white text-slate-950 shadow' : 'text-slate-300'
              }`}
              style={{ fontSize: '13px' }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <label htmlFor="home-search-mobile" className="ui-label mt-3 block">
          {mobileMode === 'shop' ? '店舗名・エリア' : 'セラピスト名'}
        </label>
        <div className="mt-1.5 flex items-stretch gap-2">
          <input
            id="home-search-mobile"
            type="search"
            value={mobileMode === 'shop' ? shopInput : castInput}
            onChange={(e) => (mobileMode === 'shop' ? setShopInput(e.target.value) : setCastInput(e.target.value))}
            placeholder={mobileMode === 'shop' ? '例）新宿' : '例）観月せな'}
            className={fieldClass}
            style={fieldStyle}
          />
          <button type="submit" className={submitClass} style={{ height: '48px', width: '72px', fontSize: '14px' }}>
            検索
          </button>
        </div>
      </div>

      <div className="hidden sm:flex sm:items-end sm:gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="home-search-shop" className="ui-label block">店舗名・エリア</label>
          <input
            id="home-search-shop"
            type="search"
            value={shopInput}
            onChange={(e) => setShopInput(e.target.value)}
            placeholder="例）新宿"
            className={`${fieldClass} mt-1.5`}
            style={fieldStyle}
          />
        </div>

        <div className="min-w-0 flex-1">
          <label htmlFor="home-search-cast" className="ui-label block">セラピスト名</label>
          <input
            id="home-search-cast"
            type="search"
            value={castInput}
            onChange={(e) => setCastInput(e.target.value)}
            placeholder="例）観月せな"
            className={`${fieldClass} mt-1.5`}
            style={fieldStyle}
          />
        </div>

        <button type="submit" className={submitClass} style={{ height: '48px', width: '96px', fontSize: '14px' }}>
          検索
        </button>
      </div>
    </form>
  );
}
