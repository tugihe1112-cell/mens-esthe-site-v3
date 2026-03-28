const fs = require('fs');
const path = 'src/pages/ShopListPage.jsx';

// ==========================================
// 1. 追加するグループ定義 (神奈川・大阪・埼玉・愛知)
// ==========================================
const NEW_CONSTANTS = `
// --- 神奈川県のエリアグループ定義 (データの実態に合わせて分類) ---
const KANAGAWA_GROUPS = [
  {
    title: "🔵 横浜・みなとみらい・県央",
    color: "text-blue-400 border-blue-400/30",
    cities: [
      "横浜市", "横浜エリア", "新横浜", "厚木市", "厚木市・横浜市・渋谷区", 
      "大田区・藤沢市", "関内", "伊勢佐木町", "桜木町"
    ]
  },
  {
    title: "🟣 川崎・武蔵小杉・鶴見",
    color: "text-purple-400 border-purple-400/30",
    cities: [
      "川崎市", "川崎エリア", "川崎・武蔵小杉エリア", "武蔵小杉", 
      "川崎市・調布市・世田谷区", "三鷹市・川崎市・国分寺市・府中市・調布市"
    ]
  },
  {
    title: "🟢 広域・出張・その他",
    color: "text-green-400 border-green-400/30",
    cities: [
      "関東エリア", "関東・東海エリア", "府中市・相模原市", 
      "調布市・世田谷区・相模原市", "相模原市", "町田市"
    ]
  }
];

// --- 大阪府のエリアグループ定義 (将来用) ---
const OSAKA_GROUPS = [
  {
    title: "🔵 キタ (梅田・新大阪)",
    color: "text-blue-400 border-blue-400/30",
    cities: ["大阪市北区", "北区", "梅田", "新大阪", "淀川区", "東淀川区", "福島区"]
  },
  {
    title: "🔴 ミナミ (難波・心斎橋)",
    color: "text-red-400 border-red-400/30",
    cities: ["大阪市中央区", "中央区", "心斎橋", "難波", "浪速区", "天王寺区"]
  },
  {
    title: "⛰️ その他・広域",
    color: "text-gray-400 border-gray-600/30",
    cities: ["堺市", "東大阪市", "豊中市", "吹田市", "枚方市"]
  }
];

// --- 埼玉・愛知 (簡易版) ---
const SAITAMA_GROUPS = [
  { title: "🔴 大宮・さいたま市", color: "text-red-400 border-red-400/30", cities: ["さいたま市", "大宮区", "大宮"] },
  { title: "�� 川口・県南", color: "text-blue-400 border-blue-400/30", cities: ["川口市", "西川口", "蕨市"] }
];
const AICHI_GROUPS = [
  { title: "🔴 名古屋・栄", color: "text-red-400 border-red-400/30", cities: ["名古屋市", "中区", "栄", "錦"] }
];
`;

// ==========================================
// 2. 新しい表示ロジック (全県対応版)
// ==========================================
const RENDER_LOGIC = `
              {/* 2. 都道府県ごとの全エリアリスト (データ駆動・グループ化対応) */}
              <div className="space-y-6">
                {locationGroups.map((group) => {
                  // 都道府県ごとに使用するグループ定義を選択
                  let targetGroups = null;
                  if (group.prefecture === "東京都") targetGroups = TOKYO_GROUPS;
                  else if (group.prefecture === "神奈川県") targetGroups = KANAGAWA_GROUPS;
                  else if (group.prefecture === "大阪府") targetGroups = OSAKA_GROUPS;
                  else if (group.prefecture === "埼玉県") targetGroups = SAITAMA_GROUPS;
                  else if (group.prefecture === "愛知県") targetGroups = AICHI_GROUPS;

                  return (
                    <div key={group.prefecture} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <h3 className="text-gray-300 font-bold mb-3 border-l-4 border-blue-500 pl-3">
                        {group.prefecture}
                      </h3>
                      
                      {targetGroups ? (
                        /* === グループ定義がある都道府県 === */
                        <div className="space-y-4">
                          {targetGroups.map((groupDef) => {
                            // そのグループに含まれる都市を抽出
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
                                      title={city}
                                    >
                                      {city}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* 定義漏れ（その他）エリアを表示 */}
                          {(() => {
                             const grouped = targetGroups.flatMap(g => g.cities);
                             const others = group.cities.filter(c => !grouped.includes(c));
                             if (others.length === 0) return null;
                             return (
                               <div className="bg-slate-900/40 p-3 rounded border border-slate-700/30">
                                 <h4 className="text-sm font-bold mb-2 text-gray-400">その他・未分類</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                   {others.map(c => (
                                     <button key={c} onClick={() => handleWardSelect(c)} className="px-2 py-2 rounded text-sm transition truncate bg-slate-900 text-gray-300 hover:bg-slate-700" title={c}>{c}</button>
                                   ))}
                                 </div>
                               </div>
                             );
                          })()}
                        </div>
                      ) : (
                        /* === 定義がない都道府県（北海道など）は今まで通り === */
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
                  );
                })}
              </div>
`;

try {
  let content = fs.readFileSync(path, 'utf8');

  // 1. 定数の追加（TOKYO_GROUPSの下に追加）
  if (!content.includes('const KANAGAWA_GROUPS')) {
    // TOKYO_GROUPSの定義の終わり（];）を探して、その後に挿入
    const tokyoEndIndex = content.indexOf('];', content.indexOf('const TOKYO_GROUPS'));
    if (tokyoEndIndex !== -1) {
       content = content.slice(0, tokyoEndIndex + 2) + "\n" + NEW_CONSTANTS + content.slice(tokyoEndIndex + 2);
       console.log("✅ グループ定義(神奈川・大阪など)を追加しました。");
    } else {
       // 見つからなければimportの下あたりに追加
       content = NEW_CONSTANTS + content; 
       console.log("⚠️ TOKYO_GROUPSが見つかりませんでしたが、先頭に定義を追加しました。");
    }
  }

  // 2. 表示ロジックの置換 (前回のコードブロックをターゲットにする)
  // マーカーを使ってごっそり入れ替える
  const startMarker = '{/* 2. 都道府県ごとの全エリアリスト (データ駆動) */}'; // 前回修正したマーカー
  // もし前回の修正でマーカーが変わっている可能性も考慮し、広めに探す
  
  // 正規表現で「{/* 2. ... */}」から「{/* 全エリアボタン */}」の手前までを取得
  const regex = /\{\/\* 2\. 都道府県ごとの全エリアリスト.*?\*\/\}.*?\{\/\* 全エリアボタン \*\/\}/s;
  
  // マーカーそのものを含めて置換する
  // RENDER_LOGIC は {/* 2... */} から始まっているのでOK
  // ただし末尾の {/* 全エリアボタン */} は残す必要がある
  
  if (regex.test(content)) {
     // マッチした部分を置き換えるが、末尾のマーカー「{/* 全エリアボタン */}」は消えてしまうので、
     // RENDER_LOGICの後ろに追加しておく必要があるか確認。
     // RENDER_LOGIC の末尾にはマーカーを含めていない。
     // したがって、replaceの第2引数で調整する。
     
     content = content.replace(regex, (match) => {
        // matchは置換対象全体。
        // RENDER_LOGIC + "\n              {/* 全エリアボタン */}"
        return RENDER_LOGIC + "\n\n              {/* 全エリアボタン */}";
     });
     
     fs.writeFileSync(path, content, 'utf8');
     console.log("🎉 全都道府県対応版にアップデート完了！");
  } else {
     console.log("❌ 置換場所が見つかりませんでした。前回の修正箇所を確認してください。");
  }

} catch (e) {
  console.error("エラー:", e);
}
