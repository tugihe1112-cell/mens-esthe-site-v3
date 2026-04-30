import fs from 'fs';

const filePath = 'src/components/PrefectureSelector.jsx';

function main() {
  console.log('🏗️  PrefectureSelector.jsx を東京都専用UIにアップデートします...');

  // バックアップ作成
  fs.copyFileSync(filePath, `${filePath}.bak_ui_${Date.now()}`);

  let content = fs.readFileSync(filePath, 'utf8');

  // 東京都専用のハードコードデータ
  const tokyoDataStr = `
const POPULAR_WARDS = ["新宿区", "渋谷区", "港区", "豊島区", "千代田区", "中央区"];
const TOKYO_GROUPS = [
  { label: "城東", items: ["墨田区", "江東区", "足立区", "荒川区", "台東区"] },
  { label: "城南", items: ["世田谷区", "品川区", "大田区", "目黒区"] },
  { label: "城西", items: ["中野区", "新宿区", "杉並区", "渋谷区"] },
  { label: "城北", items: ["北区", "練馬区", "豊島区"] },
  { label: "都心", items: ["中央区", "千代田区", "港区"] },
  { label: "市部", items: ["三鷹市", "八王子市", "調布市", "立川市", "国分寺市", "小金井市", "府中市", "武蔵野市", "多摩市", "23区出張"] }
];
`;

  if (!content.includes('TOKYO_GROUPS')) {
    content = content.replace('export default function PrefectureSelector', tokyoDataStr + '\nexport default function PrefectureSelector');
  }

  // 既存の「3階層目: 市区町村」の表示ロジックを探す
  const targetRegex = /\{\/\* 3階層目: 市区町村 \(新宿区\) \*\/\}\s*\{isPrefOpen && \(\s*<div className="p-3 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-2">\s*\{cities\.map\(\(city\) => \{/;

  if (!content.match(targetRegex)) {
    console.error('❌ 置換ターゲットが見つかりません。');
    return;
  }

  // 東京都用のカスタムUIと、それ以外の県用の従来UIを出し分けるコード
  const customUI = `{/* 3階層目: 市区町村 */}
                      {isPrefOpen && pref === "東京都" ? (
                        <div className="p-4 bg-slate-900 rounded-b-xl border-t border-slate-700">
                          {/* よく検索されるエリア */}
                          <div className="mb-6">
                            <div className="text-pink-500 text-xs font-bold mb-3 text-center tracking-widest">━━ よく検索されるエリア ━━</div>
                            <div className="flex flex-wrap justify-center gap-2">
                              {POPULAR_WARDS.map(city => (
                                <button
                                  key={\`popular-\${city}\`}
                                  onClick={() => toggleCity(city)}
                                  className={\`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border \${activeCity === city ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-pink-500/50'}\`}
                                >
                                  {city}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* エリアから探す */}
                          <div>
                            <div className="text-pink-500 text-xs font-bold mb-3 text-center tracking-widest">━━ エリアから探す ━━</div>
                            <div className="space-y-3">
                              {TOKYO_GROUPS.map(group => (
                                <div key={group.label} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 border-b border-white/5 pb-2 last:border-0">
                                  <span className="text-slate-400 text-xs font-bold min-w-[40px] pt-1">【{group.label}】</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {group.items.map(city => (
                                      <button
                                        key={\`group-\${group.label}-\${city}\`}
                                        onClick={() => toggleCity(city)}
                                        className={\`px-2 py-1 rounded text-[11px] transition-colors \${activeCity === city ? 'bg-pink-500/20 text-pink-300' : 'text-slate-300 hover:text-white hover:bg-white/5'}\`}
                                      >
                                        {city}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* 東京都で選択された区の中身（小エリア）を表示する領域 */}
                          {activeCity && WARDS[activeCity] && (
                             <div className="mt-4 p-3 bg-black/30 rounded-lg border border-pink-500/20">
                               <div className="text-pink-400 text-xs font-bold mb-2">📍 {activeCity}のエリア</div>
                               <div className="flex flex-col gap-1">
                                 <Link to={\`/shops?q=\${pref} \${activeCity}\`} className="text-[11px] text-white hover:text-pink-300 py-1">
                                   👉 {activeCity}すべて
                                 </Link>
                                 {WARDS[activeCity].map((area) => (
                                   <Link key={area} to={\`/shops?q=\${pref} \${area}\`} className="text-[11px] text-slate-400 hover:text-white py-0.5 pl-2 border-l border-white/10">
                                     - {area}
                                   </Link>
                                 ))}
                               </div>
                             </div>
                          )}
                        </div>
                      ) : isPrefOpen && (
                        <div className="p-3 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {cities.map((city) => {`;

  content = content.replace(targetRegex, customUI);

  fs.writeFileSync(filePath, content);
  console.log('✅ 東京都専用のUIアップデートが完了しました！');
}

main();
