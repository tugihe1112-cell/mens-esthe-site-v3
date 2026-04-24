import fs from 'fs';

const content = fs.readFileSync('src/pages/ShopDetailPage.jsx', 'utf8');
const lines = content.split('\n');

console.log('🔍 クチコミフェッチの周辺コードを抽出します...');

lines.forEach((line, i) => {
  // 'reviews' という文字列が含まれ、かつ supabase か fetch が近くにある行を探す
  if (line.includes('reviews') && (line.includes('supabase') || line.includes('from') || line.includes('eq'))) {
    console.log(`\n📍 L${i + 1}: ${line.trim()}`);
    console.log('--------------------------------------------------');
    console.log(lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 10)).join('\n'));
    console.log('--------------------------------------------------');
  }
});
