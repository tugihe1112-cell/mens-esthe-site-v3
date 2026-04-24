import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
if (fs.existsSync(filePath)) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  console.log('🔍 現在の ShopDetailPage.jsx の画像呼び出し部分を確認します...\n');

  lines.forEach((line, i) => {
    // LazyImage や img タグを使っている行を抽出
    if (line.includes('<LazyImage') || line.includes('<img')) {
      // コメントアウトされている行は除外
      if (!line.trim().startsWith('//')) {
        console.log(`[行 ${i + 1}]: ${line.trim()}`);
      }
    }
  });
} else {
  console.log('⚠️ ShopDetailPage.jsx が見つかりません。');
}
