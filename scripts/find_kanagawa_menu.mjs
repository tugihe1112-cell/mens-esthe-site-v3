import fs from 'fs';
import path from 'path';

function searchInDir(dir, keywords) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(file)) {
        results = results.concat(searchInDir(filePath, keywords));
      }
    } else if (filePath.match(/\.(js|jsx|ts|tsx|json)$/)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 今回特定した空っぽのエリア名で検索をかける
      const hasKeyword = keywords.some(kw => content.includes(kw));
      
      if (hasKeyword) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (keywords.some(kw => line.includes(kw))) {
            results.push({ file: filePath, line: index + 1, text: line.trim() });
          }
        });
      }
    }
  }
  return results;
}

async function main() {
  console.log('🔍 神奈川のエリアメニューが定義されているファイルを捜索します...\n');
  try {
    const srcPath = path.resolve('src');
    if (!fs.existsSync(srcPath)) throw new Error('srcフォルダが見つかりません。');

    const emptyAreas = ['伊勢佐木町', 'みなとみらい', '鶴見', '堀之内', '南町'];
    const hits = searchInDir(srcPath, emptyAreas);

    if (hits.length > 0) {
      console.log('✅ 以下のソースコードに神奈川のメニューが直書きされています！\n');
      const files = [...new Set(hits.map(h => h.file))];
      files.forEach(file => {
        console.log(`📁 ファイル: ${file}`);
        hits.filter(h => h.file === file).slice(0, 5).forEach(h => {
          const display = h.text.length > 80 ? h.text.substring(0, 80) + '...' : h.text;
          console.log(`   [${h.line}行目] ${display}`);
        });
        console.log('   --------------------------------------------------');
      });
      
      console.log('\n💡 結論: 上記のファイルを開き、該当するエリアのコードをコメントアウト（または削除）すれば、メニューから綺麗に消えます！');
    } else {
      console.log('⚠️ 検索しましたが、見つかりませんでした。別の設定ファイルやDBから動的に生成されている可能性があります。');
    }
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
