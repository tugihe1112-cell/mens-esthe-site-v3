const fs = require('fs');
const path = 'src/pages/ShopListPage.jsx';

// === 1. 正しいコードブロック（ここを埋め込みます） ===
const CORRECT_BLOCK = `
              {/* 2. 都道府県ごとの全エリアリスト (データ駆動) */}
              <div className="space-y-6">
                {locationGroups.map((group) => (
                  <div key={group.prefecture} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <h3 className="text-gray-300 font-bold mb-3 border-l-4 border-blue-500 pl-3">
                      {group.prefecture}
                    </h3>
                    
                    {group.prefecture === "東京都" ? (
                      /* === 東京都：グループ分け表示 === */
                      <div className="space-y-4">
                        {TOKYO_GROUPS.map((groupDef) => {
                          const visibleCities = groupDef.cities.filter(c => group.cities.includes(c));
                          if (visibleCities.length === 0) return null;
                          return (
                            <div key={groupDef.title} className="bg-slate-900/40 p-3 rounded border border-slate-700/30">
                              <h4 className={\`text-sm font-bold mb-2 \${groupDef.color.split(' ')[0]}\`}>
                                {groupDef.title}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {visibleCities.map((city) => (
                                  <button
                                    key={city}
                                    onClick={() => handleWardSelect(city)}
                                    className={\`px-2 py-2 rounded text-sm transition truncate \${
                                      selectedWard === city 
                                        ? "bg-blue-600 text-white font-bold" 
                                        : "bg-slate-900 text-gray-300 hover:bg-slate-700"
                                    }\`}
                                  >
                                    {city}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* グループ定義漏れの「その他」エリアがあれば表示 */}
                        {(() => {
                           const grouped = TOKYO_GROUPS.flatMap(g => g.cities);
                           const others = group.cities.filter(c => !grouped.includes(c));
                           if (others.length === 0) return null;
                           return (
                             <div className="bg-slate-900/40 p-3 rounded border border-slate-700/30">
                               <h4 className="text-sm font-bold mb-2 text-gray-400">その他</h4>
                               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                 {others.map(c => (
                                   <button key={c} onClick={() => handleWardSelect(c)} className="px-2 py-2 rounded text-sm transition truncate bg-slate-900 text-gray-300 hover:bg-slate-700">{c}</button>
                                 ))}
                               </div>
                             </div>
                           );
                        })()}
                      </div>
                    ) : (
                      /* === 東京都以外：今まで通りのグリッド表示 === */
                      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {group.cities.map((city) => (
                          <button
                            key={city}
                            onClick={() => handleWardSelect(city)}
                            className={\`px-2 py-2 rounded text-sm transition truncate \${
                              selectedWard === city 
                                ? "bg-blue-600 text-white font-bold" 
                                : "bg-slate-900 text-gray-300 hover:bg-slate-700"
                            }\`}
                            title={city}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
`;

// === 2. ファイルを読み込んで置換実行 ===
try {
  let content = fs.readFileSync(path, 'utf8');

  // 置換の目印になるマーカー（前回のgrep結果から特定）
  const startMarker = '{/* 2. 都道府県ごとの全エリアリスト (データ駆動) */}';
  const endMarker = '{/* 全エリアボタン */}';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    // マーカー間の古いコードをごっそり削除して、正しいコードを入れる
    const newContent = content.substring(0, startIndex) + 
                       CORRECT_BLOCK + 
                       "\n              " + // インデント調整
                       content.substring(endIndex);
    
    fs.writeFileSync(path, newContent, 'utf8');
    console.log("🎉 修復完了！ Syntax Error は解消されたはずです。");
  } else {
    console.log("⚠️ マーカーが見つかりませんでした。手動チェックが必要です。");
    console.log("Start found:", startIndex !== -1);
    console.log("End found:", endIndex !== -1);
  }

} catch (e) {
  console.error("エラー:", e);
}
