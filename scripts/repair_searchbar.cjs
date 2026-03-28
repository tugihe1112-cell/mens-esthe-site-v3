const fs = require('fs');
const path = 'src/components/SearchBar.jsx';

console.log('🚑 Repairing SearchBar.jsx ...');

try {
  let content = fs.readFileSync(path, 'utf8');

  // 1. 重複したimportを整理
  content = content.replace(
    "import { Link } from 'react-router-dom';\nimport React", 
    "import React"
  );

  // 2. 壊れた onChange 部分を修復（ゴミを取り除く）
  // 誤って挿入された div ブロックを消して、元の onChange 処理だけに戻す
  const brokenCodePattern = /onChange=\{(e) =>\s*<div.*?\<\/div>\s*\{/s;
  
  if (brokenCodePattern.test(content)) {
    content = content.replace(brokenCodePattern, "onChange={(e) => {");
    console.log('✅ Fixed broken onChange handler.');
  }

  // 3. 正しい位置（フォームの下）にリンクを追加
  const linkCode = `
      <div className="mt-2 flex justify-end px-2">
        <Link to="/tag-search" className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors bg-slate-900/50 px-2 py-1 rounded-full border border-pink-500/30">
          <span>🔍</span> こだわりタグ検索はこちら
        </Link>
      </div>`;

  // 既にリンクがあるか確認し、なければ追加
  if (!content.includes('こだわりタグ検索はこちら')) {
    content = content.replace('</form>', `</form>\n${linkCode}`);
    console.log('✅ Added Tag Search link in the correct position.');
  } else {
      // 既にあるコードが壊れていた場合、上のステップ2で消えているはずなので、
      // ここで再度追加する必要があるかもしれないが、
      // 正規表現でマッチした部分には "こだわり..." の文字が含まれているため、
      // ステップ2で消えたなら includes は false になるはず。
      //念のため、ステップ2実行後の content で再チェック
      if (!content.includes('こだわりタグ検索はこちら')) {
         content = content.replace('</form>', `</form>\n${linkCode}`);
         console.log('✅ Re-added Tag Search link properly.');
      }
  }

  fs.writeFileSync(path, content);
  console.log('🎉 SearchBar.jsx is now fixed and linked!');

} catch (e) {
  console.error('❌ Error:', e);
}
