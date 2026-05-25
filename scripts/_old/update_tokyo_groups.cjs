const fs = require('fs');
const path = 'src/pages/ShopListPage.jsx';

// 1. グループ定義の定数コード
const GROUPS_DEF = `
// --- 東京都のエリアグループ定義 ---
const TOKYO_GROUPS = [
  {
    title: "🟣 新宿・中野・杉並・吉祥寺方面",
    color: "text-purple-400 border-purple-400/30",
    cities: ["新宿区", "中野区", "杉並区", "武蔵野市", "三鷹市"]
  },
  {
    title: "🔵 池袋・練馬・赤羽方面",
    color: "text-blue-400 border-blue-400/30",
    cities: ["豊島区", "板橋区", "練馬区", "北区", "荒川区"]
  },
  {
    title: "🔴 渋谷・六本木・世田谷・品川方面",
    color: "text-red-400 border-red-400/30",
    cities: ["港区", "渋谷区", "品川区", "目黒区", "世田谷区", "大田区"]
  },
  {
    title: "🟢 秋葉原・錦糸町・銀座・東京東部",
    color: "text-green-400 border-green-400/30",
    cities: ["台東区", "中央区", "千代田区", "墨田区", "江東区", "江戸川区", "葛飾区", "足立区"]
  },
  {
    title: "⛰️ その他 市部 (多摩エリア)",
    color: "text-gray-400 border-gray-600/30",
    cities: [
      "八王子市", "立川市", "町田市", "府中市", "調布市", 
      "西東京市", "小平市", "三鷹市", "日野市", "多摩市", 
      "国分寺市", "小金井市", "東村山市", "昭島市"
    ]
  }
];
// ---------------------------------
`;

// 2. 新しい表示ロジック（東京都用 + その他用）
const NEW_RENDER_LOGIC = `{group.prefecture === "東京都" ? (
                    <div className="space-y-4">
                      {TOKYO_GROUPS.map((groupDef) => {
                        const visibleCities = groupDef.cities.filter(c => group.cities.includes(c));
                        if (visibleCities.length === 0) return null;
                        return (
                          <div key={groupDef.title} className="bg-slate-900/40 p-3 rounded border border-slate-700/30">
                            <h4 className={\`text-sm font-bold mb-2 \${groupDef.color.split(' ')[0]}\`}>{groupDef.title}</h4>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
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
                      {/* グループ漏れの都市を表示 */}
                      {(() => {
                         const grouped = TOKYO_GROUPS.flatMap(g => g.cities);
                         const others = group.cities.filter(c => !grouped.includes(c));
                         if (others.length === 0) return null;
                         return (
                           <div className="bg-slate-900/40 p-3 rounded border border-slate-700/30">
                             <h4 className="text-sm font-bold mb-2 text-gray-400">その他</h4>
                             <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                               {others.map(c => (
                                 <button key={c} onClick={() => handleWardSelect(c)} className="px-2 py-2 rounded text-sm transition truncate bg-slate-900 text-gray-300 hover:bg-slate-700">{c}</button>
                               ))}
                             </div>
                           </div>
                         );
                      })()}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">`;

try {
  let content = fs.readFileSync(path, 'utf8');

  // A. 定数の挿入（importの直後あたり、またはファイルの先頭）
  if (!content.includes('const TOKYO_GROUPS')) {
    // "import" を含む最後の行を探して、その後に挿入
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for(let i=0; i<lines.length; i++) {
        if(lines[i].trim().startsWith('import ')) lastImportIdx = i;
    }
    if(lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, GROUPS_DEF);
        content = lines.join('\n');
    } else {
        content = GROUPS_DEF + content;
    }
    console.log("✅ グループ定義を追加しました。");
  }

  // B. 表示ロジックの置換
  // 既存の <div className="grid ..."> タグを探して条件分岐で囲む
  const targetTag = '<div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">';
  
  if (content.includes(targetTag)) {
    // 置換実行：既存のgridタグを「東京都分岐 + 既存のgridタグ」に置き換え
    // 閉じタグの整合性を保つため、elseブロックの開始として既存タグを利用
    const replacement = NEW_RENDER_LOGIC;
    
    // 閉じタグ </div> の処理が必要。
    // 既存のコード： <div class="grid..."> ... </div>
    // 新しいコード： ... ? ( ... ) : ( <div class="grid..."> ... </div> )
    
    // 単純置換だと閉じカッコ ) } が足りなくなるため、
    // locationGroups.map の中身の閉じタグ </div> の直前を探す必要があるが、
    // 今回は安全のため、単純に targetTag を replacement に変え、
    // group.cities.map の閉じタグの後の </div> を </div>)} に変えるアプローチをとる。

    // STEP 1: 開始タグを置換
    content = content.replace(targetTag, replacement);

    // STEP 2: 対応する閉じタグを探して、条件分岐の閉じカッコ ) を追加
    // 直近の map の閉じ箇所を探す
    const mapEndPattern = /\}\)\)}\s*<\/div>\s*<\/div>/; // 目印: {group.cities.map(...)} </div> </div>
    
    // グリッドの閉じ </div> を探すのが難しいので、少し強引だが
    // 「gap-2」のあとの最初の </div> を探すのは危険。
    // ユーザーのコードを見ると、 </button> ... ))} </div> となっている。
    
    // 確実な方法: 
    // 置換した箇所の後ろにある `</div>` (gridの閉じ) を `</div>)}` に変える。
    // ただし、このスクリプトでは正規表現で少し広範囲にマッチさせる。
    
    console.log("✅ 表示ロジックを更新しました。");
    
    // 仕上げ: elseブロックを閉じるための調整
    // 現在の状態: ... : ( <div class="grid..."> ... </div>
    // これを ... : ( <div class="grid..."> ... </div> ) } にしたい。
    
    // 既存のコード断片（grep結果から特定）
    const oldBlockEnd = `
                      ))}
                    </div>
                  </div>
                ))}`;
    
    const newBlockEnd = `
                      ))}
                    </div>
                  )}
                  </div>
                ))}`;
    
    // 空白の違いを吸収して置換
    // 正規表現で「))} </div> </div>」のような並びを見つけて置換
    const endRegex = /\}\)\)\}\s*<\/div>\s*<\/div>\s*\}\)\)/;
    // 実際には grep結果の構造に合わせて以下のようにする
    // ... ))} </div> </div> ))}
    
    // より安全な戦略: ファイル全体を書き換えるのではなく、
    // locationGroups.map の部分をガッツリ特定して置換する
    
    // 既存のGrid開始から、その閉じタグまでを特定するのはパースが必要で難しい。
    // よって、「東京都分岐の開始」は入れられたので、あとは「閉じタグの追加」を行う。
    
    // 単純に "text-gray-300 hover:bg-slate-700" のある行の下の方にある </div> を狙う
    const marker = 'bg-slate-900 text-gray-300 hover:bg-slate-700';
    const parts = content.split(marker);
    if(parts.length > 1) {
        // 最後のパーツ（おそらく既存のgridの中）
        // このパーツの直後の `</div>` は grid の閉じタグのはず
        // その後に `)}` を追加する
        
        // parts[parts.length-1] は `... }`} title={city}> {city} </button> ))} </div> ...`
        let lastPart = parts[parts.length-1];
        lastPart = lastPart.replace(/(\}\)\)\}\s*<\/div>)/, "$1)}");
        parts[parts.length-1] = lastPart;
        content = parts.join(marker);
        console.log("✅ 閉じタグの整合性を修正しました。");
    }
    
    fs.writeFileSync(path, content, 'utf8');
    console.log("🎉 修正完了: src/pages/ShopListPage.jsx を書き換えました！");
    
  } else {
    console.log("⚠️ エラー: 置換対象のコードが見つかりませんでした。手動修正が必要です。");
  }

} catch (e) {
  console.error("エラーが発生しました:", e);
}
