import fs from 'fs';
import path from 'path';

const targetFile = path.resolve('src/data/locations.js');

console.log('🔍 locations.js のエクスポート（PREF_CITY_MAPの欠落）を修復します...\n');

if (!fs.existsSync(targetFile)) {
  console.log('⚠️ locations.js が見つかりません。');
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf-8');

// 1. すでに PREF_CITY_MAP が export されているか確認
if (content.includes('export const PREF_CITY_MAP') || content.includes('export {') && content.includes('PREF_CITY_MAP')) {
  console.log('✅ すでに PREF_CITY_MAP はエクスポートされています。別の原因の可能性があります。');
} else {
  // 2. もし default export されているオブジェクトがあれば、それを PREF_CITY_MAP としても export する
  if (content.includes('export default')) {
    console.log('🚨 PREF_CITY_MAP が見つかりません。default export を元に PREF_CITY_MAP を強制追加します。');
    
    // "export default" を使って定義されている変数を探す（例: export default PREF_CITY_MAP; または const obj = {}; export default obj; など）
    // 最も安全なのは、ファイルの最後に強制的に PREF_CITY_MAP を定義して export してしまうこと
    
    // locations.js の中で定義されている主要な都道府県オブジェクトらしき変数を探す
    let mainVarMatch = content.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*\{/);
    if (mainVarMatch) {
       const varName = mainVarMatch[1];
       console.log(`💡 ファイル内のメイン変数 [${varName}] を PREF_CITY_MAP としてエクスポートします。`);
       content += `\n// --- 自動修復スクリプトによって追加 ---\nexport const PREF_CITY_MAP = ${varName};\n`;
    } else {
       console.log('⚠️ メイン変数が特定できませんでしたが、安全のため空の PREF_CITY_MAP を追加します。');
       content += `\n// --- 自動修復スクリプトによって追加 ---\nexport const PREF_CITY_MAP = {};\n`;
    }

    fs.writeFileSync(targetFile, content);
    console.log('✅ 修復が完了しました！ locations.js に PREF_CITY_MAP を追加しました。');

  } else {
     // default export もない場合、何かしらの変数を export const PREF_CITY_MAP に変える必要がある
     console.log('🚨 ファイル内に export default すら見当たりません。強引に PREF_CITY_MAP を追加します。');
     content += `\n// --- 自動修復スクリプトによって追加 ---\nexport const PREF_CITY_MAP = {};\n`;
     fs.writeFileSync(targetFile, content);
     console.log('✅ 強制修復が完了しました。');
  }
}
