const fs = require('fs');
const path = 'src/components/SearchBar.jsx';

console.log('🔗 Adding link to SearchBar...');

try {
  let content = fs.readFileSync(path, 'utf8');

  // Linkコンポーネントのimport確認
  if (!content.includes('import { Link')) {
    content = content.replace("import React", "import React"); // ダミー
    content = "import { Link } from 'react-router-dom';\n" + content;
  }

  // 検索ボタンの下あたりにリンクを追加
  // キーワード入力欄の下、または横に追加したい
  if (!content.includes('/tag-search')) {
    // 閉じタグの直前に入れる
    const insertPoint = /<\/div>\s*\)\s*;\s*}/; // コンポーネントの最後
    // 簡易的に、return (...) の中の最後の </div> の手前を探すのは難しいので
    // "Placeholder" を目印にする
    
    // 既存のコードを読み解くのが難しいため、
    // 安全策として「検索入力欄の下」にテキストリンクを追加する置換を行う
    
    const inputAreaRegex = /(<input[^>]*>)/;
    const linkButton = `
      $1
      <div className="mt-3 flex justify-end">
        <Link to="/tag-search" className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors">
          <span>🔍</span> こだわりタグ検索はこちら
        </Link>
      </div>
    `;
    
    if (inputAreaRegex.test(content)) {
        content = content.replace(inputAreaRegex, linkButton);
        fs.writeFileSync(path, content);
        console.log('✅ Link added to SearchBar.');
    } else {
        console.log('⚠️ Could not find input tag in SearchBar. Skipped.');
    }
  } else {
    console.log('ℹ️ Link already exists.');
  }

} catch (e) {
  console.log('Skipping SearchBar update (File might differ).', e.message);
}
