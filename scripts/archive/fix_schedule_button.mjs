import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

// 既存の「出勤情報」の<a>タグ全体（推測ロジックが含まれている部分）を正規表現で狙い撃ちします
const targetRegex = /<a\s+href=\{cloudShop\?\.raw_data\?\.schedule_url[\s\S]*?出勤情報<\/div><\/div><\/a>/;

// 新しいコード：箱（schedule_url）に値がある時だけ<a>タグを丸ごと表示する
const newCode = `{cloudShop?.schedule_url && (
              <a href={cloudShop.schedule_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 transition group shadow-lg">
                <span className="text-xl opacity-60 group-hover:opacity-100 transition">📅</span>
                <div className="text-left flex-1">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Schedule</div>
                  <div className="text-xs font-bold text-slate-200 tracking-wide group-hover:text-green-400 transition">出勤情報</div>
                </div>
              </a>
            )}`;

if (code.match(targetRegex)) {
  code = code.replace(targetRegex, newCode);
  fs.writeFileSync(filePath, code);
  console.log("✅ 修正完了！推測によるURL生成を完全に削除し、正しい箱にデータがある時だけボタンを表示する安全なロジックに差し替えました。");
} else {
  console.log("❌ 置換対象のコードが見つかりませんでした。");
}
