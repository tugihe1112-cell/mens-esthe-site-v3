const fs = require('fs');
const filePath = 'src/contexts/DataContext.jsx';

console.log('🚑 Starting Emergency Repair...');

try {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 壊れたState宣言を直す
  // 誤爆した箇所: "version, \n    addReview // 👈 Logic Enabled, setVersion]" 
  // 修正後: "version, setVersion]"
  const brokenStatePattern = /version,\s+addReview \/\/ 👈 Logic Enabled,\s+setVersion\]/;
  
  if (brokenStatePattern.test(content)) {
    content = content.replace(brokenStatePattern, 'version, setVersion]');
    console.log('✅ Fixed broken useState declaration.');
  } else {
    console.log('ℹ️ useState declaration seems fine or already fixed.');
  }

  // 2. 正しい場所 (valueオブジェクト) に addReview を追加する
  // value = { ... } の中に追加する
  if (!content.includes('addReview // 👈 Exposed')) {
    content = content.replace(
      /const value = \{([\s\S]*?)\};/,
      (match, body) => {
        // すでにaddReviewが含まれていれば何もしない
        if (body.includes('addReview')) return match;
        // valueオブジェクトの末尾に追加
        return `const value = {${body},\n    addReview // 👈 Exposed\n  };`;
      }
    );
    console.log('✅ Added addReview to value object correctly.');
  }

  fs.writeFileSync(filePath, content);
  console.log('🎉 Repair Complete!');

} catch (e) {
  console.error('❌ Error:', e);
}
