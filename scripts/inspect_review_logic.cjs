const fs = require('fs');

const filesToCheck = [
  'src/pages/PostReviewPage.jsx',
  'src/features/reviews/hooks/useReviewForm.js',
  'src/hooks/useReviewForm.js' // 念のため両方のパスを確認
];

console.log("🔍 クチコミ投稿機能のコードを解析中...\n");

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`\n📄 File: ${filePath}`);
    console.log("---------------------------------------------------");
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 関連しそうな部分だけ抜粋して表示
    const lines = content.split('\n');
    let isHit = false;
    
    lines.forEach((line, index) => {
      // useParams, location, useEffect, shopId, threadId などのキーワード周辺を表示
      if (
        line.includes('useParams') || 
        line.includes('useLocation') || 
        line.includes('useEffect') || 
        line.includes('setShop') || 
        line.includes('setTherapist') ||
        line.includes('initial')
      ) {
        console.log(`${index + 1}: ${line.trim()}`);
        isHit = true;
      }
    });

    if (!isHit) {
      console.log("   (関連するキーワードは見つかりませんでした)");
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});
