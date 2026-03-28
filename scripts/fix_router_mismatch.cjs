const fs = require('fs');
const path = require('path');

// ファイルパス（環境に合わせて調整される可能性があります）
const appPath = fs.existsSync('src/App.jsx') ? 'src/App.jsx' : (fs.existsSync('src/App.tsx') ? 'src/App.tsx' : 'src/routes/AppRoutes.jsx');
const pagePath = 'src/pages/ShopDetailPage.jsx';

console.log('🔗 Checking Router <-> Page Connection...');

try {
  // 1. App.jsx (ルーター定義) を確認
  if (fs.existsSync(appPath)) {
    let appContent = fs.readFileSync(appPath, 'utf8');
    
    // ルート定義を探す: path="/shops/:???"
    const routeRegex = /path=["']\/shops\/:(\w+)["']/;
    const match = appContent.match(routeRegex);
    
    if (match) {
      const paramName = match[1];
      console.log(`📡 Router defines param as: ":${paramName}"`);
      
      // ルール違反 (:id) なら (:shopId) に直す
      if (paramName === 'id') {
        console.log('⚠️ Violation: Router uses generic ":id". Fixing to ":shopId"...');
        appContent = appContent.replace(routeRegex, 'path="/shops/:shopId"');
        fs.writeFileSync(appPath, appContent);
        console.log('✅ App.jsx updated.');
      }
    } else {
      console.log('❓ Could not find route definition in App.jsx. Skipping router fix.');
    }
  }

  // 2. ShopDetailPage.jsx (受け取り側) を確認
  if (fs.existsSync(pagePath)) {
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    
    // useParamsの受け取り方を確認
    // 悪い例: const { id } = useParams();
    // 良い例: const { shopId } = useParams();
    
    if (pageContent.includes('const { id } = useParams')) {
      console.log('⚠️ Violation: Page requests "id". Fixing to "shopId"...');
      pageContent = pageContent.replace('const { id } = useParams', 'const { shopId } = useParams');
      
      // 変数名の置換 (id -> shopId)
      // ただし shop.id と混同しないように注意深く置換
      // シンプルに getTherapistsByShopId(id) -> getTherapistsByShopId(shopId) を狙い撃ち
      pageContent = pageContent.replace(/getTherapistsByShopId\(id\)/g, 'getTherapistsByShopId(shopId)');
      
      fs.writeFileSync(pagePath, pageContent);
      console.log('✅ ShopDetailPage.jsx updated.');
    } else if (pageContent.includes('const { shopId } = useParams')) {
      console.log('✅ Page is correctly requesting "shopId".');
    } else {
      console.log('❓ Page uses unknown params structure.');
    }
  }

  console.log('🎉 Connection Audit Complete.');

} catch (e) {
  console.error('❌ Error:', e);
}
