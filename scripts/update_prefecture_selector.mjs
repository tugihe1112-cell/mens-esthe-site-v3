import fs from 'fs';
import path from 'path';

const filePath = 'src/components/PrefectureSelector.jsx';

function main() {
  console.log('🏗️  PrefectureSelector.jsx を東京都専用の二層構造にアップデートします...');

  if (!fs.existsSync(filePath)) {
    console.error('❌ ファイルが見つかりません: ' + filePath);
    return;
  }

  // 二層構造の定義（ハードコード）
  const tokyoLayout = `
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

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 定義をコンポーネントの外（または冒頭）に挿入
  if (!content.includes('TOKYO_GROUPS')) {
    content = tokyoLayout + "\n" + content;
  }

  // 2. 東京都の場合のレンダリングロジックを挿入
  // 既存の map 処理の部分を探して、東京都分岐を追加します
  const cityLoopRegex = /\{\s*PREF_CITY_MAP\[selectedPrefecture\]\.map\(\s*city\s*=>\s*\(/;
  
  const customTokyoJSX = `{selectedPrefecture === "東京都" ? (
            <div className="space-y-6 w-full">
              {/* よく検索されるエリア */}
              <div>
                <div className="text-pink-500 font-bold mb-3 text-center">━━ よく検索されるエリア ━━</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {POPULAR_WARDS.map(city => (
                    <button
                      key={\`popular-\${city}\`}
                      onClick={() => handleCityClick(city)}
                      className="px-4 py-2 bg-slate-800 hover:bg-pink-600 text-white rounded-full transition-colors text-sm"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* エリアから探す */}
              <div>
                <div className="text-pink-500 font-bold mb-3 text-center">━━ エリアから探す ━━</div>
                <div className="space-y-4">
                  {TOKYO_GROUPS.map(group => (
                    <div key={group.label} className="flex flex-col md:flex-row items-center gap-2 border-b border-slate-800 pb-2 last:border-0">
                      <span className="text-slate-400 font-bold min-w-[60px]">【{group.label}】</span>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        {group.items.map(city => (
                          <button
                            key={\`group-\${group.label}-\${city}\`}
                            onClick={() => handleCityClick(city)}
                            className="text-slate-200 hover:text-pink-400 text-sm py-1 px-2"
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            PREF_CITY_MAP[selectedPrefecture].map(city => (` ;

  if (content.match(cityLoopRegex)) {
    content = content.replace(cityLoopRegex, customTokyoJSX);
    // 対応する閉じ括弧の調整
    content = content.replace(/\)\s*\)\s*\}/, ')))}');
  } else {
    console.error('❌ コンポーネント内のループ箇所を特定できませんでした。手動修正が必要です。');
    return;
  }

  fs.writeFileSync(filePath, content);
  console.log('✅ アップデート完了！');
}

main();
