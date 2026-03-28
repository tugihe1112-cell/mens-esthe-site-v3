const fs = require('fs');
const path = 'src/pages/Home.jsx';

console.log('🏠 Adding Tag Search Banner to Home.jsx ...');

try {
  let content = fs.readFileSync(path, 'utf8');

  // 1. Link のインポートを確認
  if (!content.includes('import { Link')) {
    content = content.replace("import React", "import { Link } from 'react-router-dom';\nimport React");
  }

  // 2. ボタンのデザイン (目立つバナー形式)
  const bannerCode = `
      {/* --- 🏷 タグ検索への誘導バナー (Added) --- */}
      <div className="px-4 mt-6 mb-2">
        <Link to="/tag-search" className="block w-full bg-gradient-to-r from-pink-900/40 to-purple-900/40 border border-pink-500/30 rounded-2xl p-4 flex items-center justify-between hover:bg-pink-900/60 transition group shadow-lg shadow-pink-900/10">
          <div className="flex items-center gap-4">
            <div className="bg-pink-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition">
              🔍
            </div>
            <div>
              <h3 className="text-white font-bold text-sm md:text-base group-hover:text-pink-300 transition">こだわり条件・タグで探す</h3>
              <p className="text-[10px] md:text-xs text-slate-400">「スレンダー」「20代」「ギャル系」など</p>
            </div>
          </div>
          <div className="text-slate-500 group-hover:translate-x-1 transition">
            →
          </div>
        </Link>
      </div>
      {/* ------------------------------------------- */}
  `;

  // 3. 挿入場所を探す
  // ヘッダーの下、コンテンツの始まりあたりに入れたい
  // <div className="min-h-screen... > の直後や、最初のコンテナの始まりを探す
  
  if (!content.includes('/tag-search')) {
    // Headerコンポーネントの下、または pt-20 (padding-top) があるあたりの下に入れるのが安全
    // もしくは単純に、最初の <div> の中、Headerの次あたり
    
    if (content.includes('<Header />')) {
      content = content.replace('<Header />', `<Header />\n${bannerCode}`);
      console.log('✅ Inserted banner after <Header />');
    } else {
      // Headerが見つからない場合の予備策 (returnの直後のdivの中)
      const returnRegex = /return \(\s*<div.*?>/s;
      content = content.replace(returnRegex, (match) => `${match}\n<div className="pt-20"></div>\n${bannerCode}`); // pt-20はヘッダー被り防止用ダミー
      console.log('✅ Inserted banner at the top of content.');
    }
    
    fs.writeFileSync(path, content);
    console.log('🎉 Home page updated with Tag Search Banner!');
  } else {
    console.log('ℹ️ Tag Search link already exists in Home.jsx.');
  }

} catch (e) {
  console.error('❌ Error:', e);
}
