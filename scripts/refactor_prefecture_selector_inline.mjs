import fs from 'fs';

const filePath = 'src/components/PrefectureSelector.jsx';

function main() {
  console.log('🔄 PrefectureSelector.jsx をインライン展開形式にリファクタリングします...');

  // バックアップ作成
  fs.copyFileSync(filePath, `${filePath}.bak_inline_${Date.now()}`);

  let content = fs.readFileSync(filePath, 'utf8');

  // --- 1. 小エリアパネルを生成する共通部品（コードの共通化） ---
  const areaPanelCode = `
  const AreaPanel = ({ city, pref, areas }) => (
    <div className="mt-4 w-full bg-gradient-to-r from-pink-950/60 to-purple-950/60 rounded-xl border-t-2 border-pink-500 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className="p-4">
        <div className="text-pink-400 text-sm font-bold mb-4 flex items-center gap-2">
          <span className="animate-pulse">📍</span> {city}のエリア
        </div>
        <div className="flex flex-wrap gap-2">
          <Link 
            to={\`/shops?q=\${pref} \${city}\`} 
            className="bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg shadow-lg transition-all active:scale-95"
          >
            ✨ {city}すべて
          </Link>
          {areas.map((area) => (
            <Link 
              key={area} 
              to={\`/shops?q=\${pref} \${area}\`} 
              className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-pink-500 text-slate-300 hover:text-white text-[11px] px-3 py-2 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(236,72,153,0.4)]"
            >
              {area}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
  `;

  // コンポーネント定義の直前にヘルパーを挿入
  if (!content.includes('const AreaPanel')) {
     content = content.replace('export default function PrefectureSelector', areaPanelCode + '\nexport default function PrefectureSelector');
  }

  // --- 2. 東京都用UIの置換 (インライン展開対応) ---
  const newTokyoUI = `{/* 3階層目: 市区町村 */}
                      {isPrefOpen && pref === "東京都" ? (
                        <div className="p-4 bg-slate-900 rounded-b-xl border-t border-slate-700">
                          
                          {/* ① よく検索されるエリア */}
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-slate-300 text-xs font-bold tracking-widest">よく検索されるエリア</span>
                              <div className="h-[1px] flex-grow bg-gradient-to-r from-pink-500/50 to-transparent"></div>
                            </div>
                            <div className="flex overflow-x-auto pb-3 gap-3 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                              <style>{\`.snap-x::-webkit-scrollbar { display: none; }\`}</style>
                              {POPULAR_WARDS.map(ward => (
                                <button
                                  key={\`popular-\${ward.name}\`}
                                  onClick={() => toggleCity(ward.name)}
                                  className={\`flex-shrink-0 snap-start flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border \${
                                    activeCity === ward.name 
                                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.8)] scale-105 border-pink-300' 
                                      : 'bg-gradient-to-r from-slate-800 to-slate-800 border-slate-700 text-slate-200'
                                  }\`}
                                >
                                  <span className="text-sm">{ward.icon}</span>
                                  <span className="font-bold text-sm tracking-wider">{ward.name}</span>
                                  <span className="bg-black/50 text-[10px] px-2 py-0.5 rounded-full text-slate-300 border border-white/10">{ward.count}件</span>
                                </button>
                              ))}
                            </div>
                            {/* 【新規】よく検索されるエリアが選択された場合のインライン展開 */}
                            {activeCity && POPULAR_WARDS.some(w => w.name === activeCity) && (
                              <AreaPanel city={activeCity} pref={pref} areas={WARDS[activeCity] || []} />
                            )}
                          </div>

                          {/* ② エリアから探す */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-slate-300 text-xs font-bold tracking-widest">エリアから探す</span>
                              <div className="h-[1px] flex-grow bg-gradient-to-r from-pink-500/50 to-transparent"></div>
                            </div>
                            <div className="space-y-4">
                              {TOKYO_GROUPS.map(group => (
                                <div key={group.label}>
                                  <div className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-4">
                                    <div className={\`flex items-center gap-2 min-w-[50px] pt-1.5 border-l-4 pl-2 \${group.colorClass}\`}>
                                      <span className="text-xs font-bold tracking-widest">{group.label}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 flex-grow">
                                      {group.items.map(city => (
                                        <button
                                          key={\`group-\${group.label}-\${city}\`}
                                          onClick={() => toggleCity(city)}
                                          className={\`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border \${
                                            activeCity === city 
                                              ? 'bg-pink-600 border-pink-400 text-white shadow-[0_0_12px_rgba(236,72,153,0.8)]' 
                                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-pink-500'
                                          }\`}
                                        >
                                          {city}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  {/* 【新規】このグループ内のエリアが選択された場合のインライン展開 */}
                                  {activeCity && group.items.includes(activeCity) && (
                                    <AreaPanel city={activeCity} pref={pref} areas={WARDS[activeCity] || []} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : isPrefOpen && (`;

  const uiStart = content.indexOf('{/* 3階層目: 市区町村 */}');
  const uiEnd = content.indexOf(') : isPrefOpen && (');
  
  if (uiStart !== -1 && uiEnd !== -1) {
    content = content.substring(0, uiStart) + newTokyoUI + content.substring(uiEnd + 19);
  }

  // --- 3. 東京都以外の通常県UIもインラインのスタイルを統一 ---
  // 既存の {isCityOpen && areas.length > 0 && ( ... )} の部分を置換
  const standardAreaPanelRegex = /\{isCityOpen && areas\.length > 0 && \(\s*<div className="mt-2 ml-2 pl-2 border-l border-pink-500\/30 flex flex-col gap-1">[\s\S]*?<\/div>\s*\)\}/;
  
  const newStandardUI = `{isCityOpen && (
                                    <div className="col-span-full mt-2">
                                      <AreaPanel city={city} pref={pref} areas={areas} />
                                    </div>
                                  )}`;
  
  content = content.replace(standardAreaPanelRegex, newStandardUI);

  fs.writeFileSync(filePath, content);
  console.log('🎉 インライン展開形式へのリファクタリングが完了しました！');
}

main();
