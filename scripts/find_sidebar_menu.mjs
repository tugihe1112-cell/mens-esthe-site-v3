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
  console.log('🔍 サイドバー（エリアメニュー）の定義ファイルを捜索します...\n');
  try {
    const srcPath = path.resolve('src');
    if (!fs.existsSync(srcPath)) throw new Error('srcフォルダが見つかりません。');

    // 画面に実在する「初台」「笹塚」「広尾」で検索をかける
    const hits = searchInDir(srcPath, ['初台', '笹塚', '広尾']);

    if (hits.length > 0) {
      console.log('✅ エリアメニューを定義しているファイルを発見しました！\n');
      const files = [...new Set(hits.map(h => h.file))];
      files.forEach(file => {
        console.log(`📁 ファイル: ${file}`);
        // 最初の数行をプレビュー
        hits.filter(h => h.file === file).slice(0, 5).forEach(h => {
          const display = h.text.length > 80 ? h.text.substring(0, 80) + '...' : h.text;
          console.log(`   [${h.line}行目] ${display}`);
        });
        console.log('   --------------------------------------------------');
      });
      
      console.log('\n💡 結論: 上記のファイルを開き、「笹塚」や「広尾」の並びに「幡ヶ谷」を追加してください！');
      console.log('（おそらく、id: "tokyo_shibuya_hatagaya", name: "幡ヶ谷" のような形式で追加することになります）');
    } else {
      console.log('⚠️ 見つかりませんでした。データがAPI経由で取得されている可能性があります。');
    }
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
