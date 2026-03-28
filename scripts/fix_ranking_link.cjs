const fs = require('fs');
const path = 'src/pages/Home.jsx';

console.log('🎨 Making Ranking Link visible...');

try {
  let content = fs.readFileSync(path, 'utf8');

  // 目立たない古いリンクの定義（grepで見えたもの）
  const oldLink = /<Link to="\/ranking" className="text-xs text-slate-400.*?ランキングを見る<\/Link>/;

  // 新しい黄金のボタンデザイン
  const newButton = `
            <Link to="/ranking" className="flex items-center gap-2 bg-slate-800 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-full text-xs font-bold hover:bg-yellow-500/10 hover:scale-105 transition shadow-lg shadow-yellow-900/20">
              <span className="text-base">🏆</span> ランキングを見る
            </Link>
  `;

  if (oldLink.test(content)) {
    content = content.replace(oldLink, newButton);
    fs.writeFileSync(path, content);
    console.log('✅ Ranking button is now GOLD and VISIBLE!');
  } else {
    console.log('⚠️ Could not find the old link pattern. It might be already changed.');
  }

} catch (e) {
  console.error('❌ Error:', e);
}
