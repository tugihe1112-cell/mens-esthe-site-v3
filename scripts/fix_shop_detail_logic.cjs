const fs = require('fs');
const filePath = 'src/pages/ShopDetailPage.jsx';

console.log('🔍 Auditing ShopDetailPage.jsx for Architecture Compliance...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  let fixed = false;

  // 1. Contextから getTherapistsByShopId を取り出しているか確認
  if (!content.includes('getTherapistsByShopId')) {
    console.log('⚠️ Violation Found: Page is not using relational lookup.');
    
    // useShopData() の呼び出し部分に getTherapistsByShopId を追加
    content = content.replace(
      /const \{([^}]+)\} = useShopData\(\);/,
      (match, existing) => {
        if (existing.includes('getTherapistsByShopId')) return match;
        return `const {${existing}, getTherapistsByShopId} = useShopData();`;
      }
    );
    console.log('✅ Fix 1: Imported getTherapistsByShopId from Context.');
    fixed = true;
  }

  // 2. セラピストの取得方法を修正
  // ❌ 間違い: const displayedTherapists = shop.therapists || [];
  // ⭕️ 正解:   const displayedTherapists = getTherapistsByShopId(shopId);
  
  const oldPattern = /const\s+(\w+)\s*=\s*shop\.therapists\s*\|\|\s*\[\];/;
  const oldPattern2 = /const\s+(\w+)\s*=\s*shop\?\.therapists\s*\|\|\s*\[\];/;
  
  // パターンマッチで修正
  if (oldPattern.test(content) || oldPattern2.test(content)) {
    console.log('⚠️ Violation Found: Page is looking for nested data (shop.therapists).');
    
    content = content.replace(oldPattern, 'const $1 = getTherapistsByShopId(shop.id);');
    content = content.replace(oldPattern2, 'const $1 = getTherapistsByShopId(shop.id);');
    
    console.log('✅ Fix 2: Updated to use relational lookup (getTherapistsByShopId).');
    fixed = true;
  } else {
    // もし上記パターンで見つからない場合、手動で探すためのログを出す
    if (!content.includes('getTherapistsByShopId(shop.id)') && !content.includes('getTherapistsByShopId(id)')) {
       console.log('❓ Warning: Could not auto-fix the variable assignment. Please check the logic below:');
       // "const therapists =" などの行を表示
       const lines = content.split('\n');
       lines.forEach((line, i) => {
         if (line.includes('therapists') && line.includes('=')) console.log(`   Line ${i+1}: ${line.trim()}`);
       });
    }
  }

  if (fixed) {
    fs.writeFileSync(filePath, content);
    console.log('🎉 ShopDetailPage.jsx has been updated to follow the Architecture Guide.');
  } else {
    console.log('ℹ️ No automatic fixes applied. The file might already be correct or needs manual check.');
  }

} catch (e) {
  console.error('❌ Error:', e);
}
