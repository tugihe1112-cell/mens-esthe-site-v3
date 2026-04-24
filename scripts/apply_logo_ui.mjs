import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. ロゴ画像のURLを店舗ID（またはブランドID）から判定するロジックをコンポーネント内に追加
const logicTarget = "const isFavorite = shop ? favorites.includes(shop.id) : false;";
const logoLogic = `
  const isFavorite = shop ? favorites.includes(shop.id) : false;

  // 🌟 店舗IDからロゴ画像を判定するロジック
  let logoUrl = null;
  if (shopId?.includes('yuruspa') || shop?.brand_id === 'yuruspa') {
    logoUrl = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/yuruspa.png';
  } else if (shopId?.includes('mens_esthe_group') || shopId?.includes('menes_group') || shop?.brand_id === 'mens_esthe_group') {
    logoUrl = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/menesgroup.png';
  }
`;

if (content.includes(logicTarget) && !content.includes('logoUrl =')) {
  content = content.replace(logicTarget, logoLogic.trim());
}

// 2. 画面のヘッダー部分（店舗名の上など）にロゴ画像を表示するUIを注入
// h1タグや店舗名を表示している部分を探して、その直前にimgタグを差し込みます
if (content.includes('<h1') && !content.includes('<img src={logoUrl}')) {
  content = content.replace(
    /(<h1[^>]*>)/, 
    `{logoUrl && (<div className="mb-4 flex justify-center"><img src={logoUrl} alt="Brand Logo" className="h-16 md:h-20 object-contain" /></div>)}\n              $1`
  );
  fs.writeFileSync(filePath, content);
  console.log('✅ 店舗詳細画面にロゴ画像（yuruspa / menesgroup）の表示ロジックを注入しました！');
} else {
  console.log('⚠️ 自動置換に失敗しました。ファイル構造を確認してください。');
}
