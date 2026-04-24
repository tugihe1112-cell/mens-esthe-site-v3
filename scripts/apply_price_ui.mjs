import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// お客様が見つけてくださった犯人のコード
const targetString = "{cloudShop?.price_system || shop?.price_system || shop?.raw_data?.price || '料金情報なし'}";

// 画像のイメージに合わせて、コース名と料金が左右に綺麗に並ぶUI
const newUI = `
<div className="flex flex-col space-y-3 w-full">
  <div className="flex justify-between items-center"><span className="text-slate-300">70分コース</span><span className="text-white font-bold tracking-wider">14,000円</span></div>
  <div className="flex justify-between items-center"><span className="text-slate-300">90分コース</span><span className="text-white font-bold tracking-wider">18,000円</span></div>
  <div className="flex justify-between items-center"><span className="text-slate-300">110分コース</span><span className="text-white font-bold tracking-wider">22,000円</span></div>
</div>
`.trim();

if (content.includes(targetString)) {
  content = content.replace(targetString, newUI);
  // 少し余白を整えるために親のddタグのクラスも微調整（whitespace-pre-wrapを外す）
  content = content.replace(
    'className="text-sm md:text-base text-white whitespace-pre-wrap leading-loose font-medium bg-slate-800/50 p-4 rounded-xl border border-white/5"',
    'className="text-sm md:text-base text-white w-full bg-slate-800/50 p-4 rounded-xl border border-white/5"'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ 料金表をご指定の3コース（70分/90分/110分）のデザインに書き換えました！');
} else {
  console.log('⚠️ 対象のコードが見つかりません。自動置換に失敗しました。');
}
