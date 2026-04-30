import fs from 'fs';
import path from 'path';

function searchInDir(dir, keyword) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // node_modulesなどの不要なフォルダはスルー
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(searchInDir(filePath, keyword));
      }
    } else if (filePath.match(/\.(js|jsx|ts|tsx|json)$/)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes(keyword)) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(keyword)) {
            results.push({ file: filePath, line: index + 1, text: line.trim() });
          }
        });
      }
    }
  }
  return results;
}

async function main() {
  console.log('🔍 フロントエンドのソースコード全体から「渋谷」周辺のエリア定義を捜索します...\n');
  try {
    const srcPath = path.resolve('src');
    if (!fs.existsSync(srcPath)) {
      console.log('⚠️ srcフォルダが見つかりません。');
      return;
    }

    // すでに存在することが確定している「tokyo_shibuya_shibuya」や「tokyo_shibuya_ebisu」をヒントに探す
    const hits = searchInDir(srcPath, 'tokyo_shibuya');

    if (hits.length > 0) {
      console.log('✅ 以下のソースコードにエリア情報が直書きされています！\n');
      
      const files = [...new Set(hits.map(h => h.file))];
      files.forEach(file => {
        console.log(`📁 ファイル: ${file}`);
        // 最初の3行だけプレビュー表示
        hits.filter(h => h.file === file).slice(0, 3).forEach(h => {
          // 長すぎる行は省略
          const display = h.text.length > 80 ? h.text.substring(0, 80) + '...' : h.text;
          console.log(`   [${h.line}行目] ${display}`);
        });
        console.log('   --------------------------------------------------');
      });

      console.log('\n💡 結論: 上記のファイル（特に config や constants、AreaList といった名前のファイル）を開いてください。');
      console.log('そこに「渋谷」「恵比寿」などと並んでエリアが定義されているので、そこに「幡ヶ谷 (tokyo_shibuya_hatagaya)」を追加すれば解決します！');

    } else {
      console.log('⚠️ 検索しましたが、見つかりませんでした。');
    }
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
