import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldTag = '<img src={logoUrl} alt="Brand Logo" className="h-16 md:h-20 object-contain" />';
// w-auto（横幅は自動）を追加して、絶対に比率が崩れないようにする
const newTag = '<img src={logoUrl} alt="Brand Logo" className="h-16 md:h-20 w-auto object-contain" />';

if (content.includes(oldTag)) {
  content = content.replace(oldTag, newTag);
  fs.writeFileSync(filePath, content);
  console.log('✅ ロゴ画像の比率（アスペクト比）が崩れないように修正しました！');
} else {
  console.log('⚠️ 対象のコードが見つかりませんでした。');
}
