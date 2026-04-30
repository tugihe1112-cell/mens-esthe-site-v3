import fs from 'fs';

const filePath = 'src/components/PrefectureSelector.jsx';

function main() {
  console.log('✨ PrefectureSelector.jsx にリッチなUI（発光チップ・カルーセル等）を適用します...');

  // バックアップ作成
  fs.copyFileSync(filePath, `${filePath}.bak_ui_v2_${Date.now()}`);

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. データ定義のアップデート（アイコン、店舗数、カラークラスを追加）
  const newTokyoDataStr = `
const POPULAR_WARDS = [
  { name: "新宿区", count: 42, icon: "🏙️" },
  { name: "渋谷区", count: 38, icon: "✨" },
  { name: "港区", count: 35, icon: "🍸" },
  { name: "豊島区", count: 24, icon: "🦉" },
  { name: "千代田区", count: 18, icon: "🏢" },
  { name: "中央区", count: 15, icon: "🍣" }
];
const TOKYO_GROUPS = [
  { label: "城東", items: ["墨田区", "江東区", "足立区", "荒川区", "台東区"], colorClass: "border-blue-500 text-blue-400" },
  { label: "城南", items: ["世田谷区", "品川区", "大田区", "目黒区"], colorClass: "border-emerald-500 text-emerald-400" },
  { label: "城西", items: ["中野区", "新宿区", "杉並区", "渋谷区"], colorClass: "border-purple-500 text-purple-400" },
  { label: "城北", items: ["北区", "練馬区", "豊島区"], colorClass: "border-yellow-500 text-yellow-400" },
  { label: "都心", items: ["中央区", "千代田区", "港区"], colorClass: "border-pink-500 text-pink-400" },
  { label: "市部", items: ["三鷹市", "八王子市", "調布市", "立川市", "国分寺市", "小金井市", "府中市", "武蔵野市", "多摩市", "23区出張"], colorClass: "border-slate-500 text-slate-400" }
];
`;

  // 既存のPOPULAR_WARDS定義を置換
  const dataStart = content.indexOf('const POPULAR_WARDS');
  const dataEnd = content.indexOf('export default function PrefectureSelector');
  if (dataStart !== -1 && dataEnd !== -1) {
    content = content.substring(0, dataStart) + newTokyoDataStr + content.substring(dataEnd);
  } else {
    console.error('❌ データ定義の置換箇所が見つかりませんでした。');
    return;
  }

  // 2. UI部分のアップデート
  const newUIStr = `{/* 3階層目: 市区町村 */}
                      {isPrefOpen && pref === "東京都" ? (
                        <div className="p-4 bg-slate-900 rounded-b-xl border-t border-slate-700">
                          
                          {/* ①＆④: よく検索されるエリア (ピルバッジ＆カルーセル) */}
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-slate-300 text-xs font-bold tracking-widest">よく検索されるエリア</span>
                              <div className="h-[1px] flex-grow bg-gradient-to-r from-pink-500/50 to-transparent"></div>
                            </div>
                            {/* スクロールバー非表示用のインラインスタイル付きコンテナ */}
                            <div className="flex overflow-x-auto pb-3 gap-3 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                              <style>{\`.snap-x::-webkit-scrollbar { display: none; }\`}</style>
                              {POPULAR_WARDS.map(ward => (
                                <button
                                  key={\`popular-\${ward.name}\`}
                                  onClick={() => toggleCity(ward.name)}
                                  className={\`flex-shrink-0 snap-start flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border \${
                                    activeCity === ward.name 
                                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.8)] scale-105 border-pink-300' 
                                      : 'bg-gradient-to-r from-slate-800 to-slate-800 hover:from-pink-900/30 hover:to-purple-900/30 border-slate-700 text-slate-200 shadow-md hover:shadow-[0_0_10px_rgba(236,72,153,0.4)] hover:border-pink-500/50'
                                  }\`}
                                >
                                  <span className="text-sm">{ward.icon}</span>
                                  <span className="font-bold text-sm tracking-wider">{ward.name}</span>
                                  <span className="bg-black/50 text-[10px] px-2 py-0.5 rounded-full text-slate-300 border border-white/10">{ward.count}件</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* ②＆③: エリアから探す (カラーバー＆チップ型グローボタン) */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-slate-300 text-xs font-bold tracking-widest">エリアから探す</span>
                              <div className="h-[1px] flex-grow bg-gradient-to-r from-pink-500/50 to-transparent"></div>
                            </div>
                            <div className="space-y-4">
                              {TOKYO_GROUPS.map(group => (
                                <div key={group.label} className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-4">
                                  {/* ② カラーバー */}
                                  <div className={\`flex items-center gap-2 min-w-[50px] pt-1.5 border-l-4 pl-2 \${group.colorClass}\`}>
                                    <span className="text-xs font-bold tracking-widest">{group.label}</span>
                                  </div>
                                  {/* ③ チップ型ボタン */}
                                  <div className="flex flex-wrap gap-2 flex-grow">
                                    {group.items.map(city => (
                                      <button
                                        key={\`group-\${group.label}-\${city}\`}
                                        onClick={() => toggleCity(city)}
                                        className={\`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border \${
                                          activeCity === city 
                                            ? 'bg-pink-600 border-pink-400 text-white shadow-[0_0_12px_rgba(236,72,153,0.8)] scale-105' 
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-pink-500 hover:bg-slate-800 hover:shadow-[0_0_8px_rgba(236,72,153,0.6)]'
                                        }\`}
                                      >
                                        {city}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* ⑤ 選択された区の中身 (発光エフェクト追加) */}
                          {activeCity && WARDS[activeCity] && (
                             <div className="mt-6 p-4 bg-slate-900/90 rounded-xl border border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.15)] relative overflow-hidden">
                               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500"></div>
                               <div className="text-pink-400 text-sm font-bold mb-3 flex items-center gap-2">
                                 <span className="animate-pulse">📍</span> {activeCity}のエリア
                               </div>
                               <div className="flex flex-wrap gap-2">
                                 <Link to={\`/shops?q=\${pref} \${activeCity}\`} className="bg-pink-500/20 hover:bg-pink-500/40 border border-pink-500/30 text-pink-300 text-[11px] px-3 py-1.5 rounded-md transition-colors">
                                   ✨ {activeCity}すべて
                                 </Link>
                                 {WARDS[activeCity].map((area) => (
                                   <Link key={area} to={\`/shops?q=\${pref} \${area}\`} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-[11px] px-3 py-1.5 rounded-md transition-all">
                                     {area}
                                   </Link>
                                 ))}
                               </div>
                             </div>
                          )}
                        </div>
                      ) : isPrefOpen && (`;

  const uiStart = content.indexOf('{/* 3階層目: 市区町村 */}');
  const uiEnd = content.indexOf(') : isPrefOpen && (');
  
  if (uiStart !== -1 && uiEnd !== -1) {
    // 既存のUIブロックを置き換え
    content = content.substring(0, uiStart) + newUIStr + content.substring(uiEnd + 19);
  } else {
    console.error('❌ UIブロックの置換箇所が見つかりませんでした。');
    return;
  }

  fs.writeFileSync(filePath, content);
  console.log('🎉 アニメーション＆カルーセル付きの究極UIアップデートが完了しました！');
}

main();
