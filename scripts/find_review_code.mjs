import fs from 'fs';

['src/contexts/DataContext.jsx', 'src/pages/ShopDetailPage.jsx'].forEach(file => {
  // ! を使わずに false と比較することで zsh のエラーを完全に回避します
  if (fs.existsSync(file) === false) return; 
  
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (l.includes('reviews.filter') || (l.includes('getReviews') && l.includes('='))) {
      console.log('\n📄 [' + file + '] 該当箇所:');
      console.log(lines.slice(Math.max(0, i-3), Math.min(lines.length, i+8)).join('\n'));
    }
  });
});
