const fs = require('fs');
const pagePath = 'src/pages/PostReviewPage.jsx';

console.log('💉 Injecting TagSelector into PostReviewPage...');

try {
  let content = fs.readFileSync(pagePath, 'utf8');

  // 1. TagSelectorの表示用JSX (RatingセクションとStoryセクションの間に入れる)
  const tagSectionJSX = `
            {/* Tag Selection (Added) */}
            <section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
              <div className="flex justify-between items-end mb-4 border-b border-slate-800 pb-2">
                <div>
                  <h2 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Tags</h2>
                  <p className="text-slate-400 text-xs">セラピストの特徴を表すタグを選択してください</p>
                </div>
              </div>
              <TagSelector selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
            </section>
`;

  // 2. 挿入ポイントを探す: {/* Story */} というコメントの前
  if (!content.includes('<TagSelector')) {
    // "{/* Story */}" を目印にして、その直前に挿入
    if (content.includes('{/* Story */}')) {
      content = content.replace('{/* Story */}', `${tagSectionJSX}\n            {/* Story */}`);
      console.log('✅ UI inserted correctly before Story section.');
    } else if (content.includes('<section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 relative overflow-hidden">')) {
       // コメントがない場合の予備策: Storyセクションの開始タグの前
       const storyStart = '<section className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 relative overflow-hidden">';
       content = content.replace(storyStart, `${tagSectionJSX}\n${storyStart}`);
       console.log('✅ UI inserted correctly (fallback match).');
    }
  } else {
    console.log('ℹ️ TagSelector UI seems to be already present.');
  }

  // 3. stateの確認 (もしなければ追加)
  if (!content.includes('const [selectedTags, setSelectedTags]')) {
    const stateInsertPoint = /const \[selectedShopId, setSelectedShopId\] = useState\(null\);/;
    content = content.replace(stateInsertPoint, 'const [selectedShopId, setSelectedShopId] = useState(null);\n  const [selectedTags, setSelectedTags] = useState([]);');
    console.log('✅ State added.');
  }

  // 4. Submitデータへの追加
  if (!content.includes('tags: selectedTags')) {
    content = content.replace(/const submitData = \{/, 'const submitData = {\n      tags: selectedTags,');
    console.log('✅ Submit logic updated.');
  }

  fs.writeFileSync(pagePath, content);
  console.log('🎉 Tag functionality has been successfully injected!');

} catch (e) {
  console.error('❌ Error:', e);
}
