import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 以前ハードコードしてしまった固定のUI部分を検索
const startIdx = content.indexOf('<div className="flex flex-col space-y-3 w-full">');
const endIdx = content.indexOf('</div>', content.indexOf('110分コース')) + 6;

// データベースの「コロン区切り（例: 90分:14,000円）」を自動で美しい2列に分ける動的UI
const newDynamicUI = `{shop?.price_system ? (
  <div className="flex flex-col space-y-3 w-full">
    {shop.price_system.split('\\n').map((line, idx) => {
      const parts = line.split(':');
      const time = parts[0];
      const price = parts[1] || '';
      return (
        <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
          <span className="text-slate-300">{time}</span>
          <span className="text-white font-bold tracking-wider">{price}</span>
        </div>
      );
    })}
  </div>
) : (
  <div className="text-slate-300">料金情報なし</div>
)}`;

if (startIdx !== -1 && content.includes('70分コース')) {
  const before = content.substring(0, startIdx);
  const after = content.substring(endIdx);
  fs.writeFileSync(filePath, before + newDynamicUI + after);
  console.log('✅ 料金表を「データベース連動型の動的UI」にアップグレードしました！');
} else {
  console.log('⚠️ 対象の固定UIが見つかりませんでした。');
}
