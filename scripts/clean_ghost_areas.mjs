import fs from 'fs';
import path from 'path';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  console.log('🧹 `locations.js` からゴーストエリアを削除します...\n');

  // 1. ゴーストエリアのリストを読み込む
  const reportPath = path.resolve('ghost_areas_report.json');
  if (!fs.existsSync(reportPath)) {
    console.error('❌ ghost_areas_report.json が見つかりません。');
    return;
  }
  
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  // 先ほどの簡易パーサーで混入した記号等のゴミを除外して綺麗な配列にする
  const ghostAreas = report.ghostAreas.filter(a => 
    a && a.length > 1 && !a.includes('[') && !a.includes(']') && !a.includes('{') && !a.includes('}') && !a.includes('null')
  );

  // 2. locations.js の読み込みとバックアップ
  const filePath = path.resolve('src/data/locations.js');
  const backupPath = path.resolve('src/data/locations.js.bak');
  
  let content = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(backupPath, content);
  console.log('✅ 安全のためバックアップを作成しました: locations.js.bak\n');

  let removeCount = 0;

  // 3. ゴーストエリアの文字列をソースコードから削除
  ghostAreas.forEach(area => {
    const safeArea = escapeRegExp(area);
    
    // "エリア名", または "エリア名" (後ろのカンマや改行、スペースも巻き込んで消す正規表現)
    const regex = new RegExp(`['"]${safeArea}['"]\\s*,?\\s*\\n?`, 'g');
    
    if (content.match(regex)) {
      content = content.replace(regex, '');
      removeCount++;
      console.log(` - 🗑️ 削除完了: ${area}`);
    }
  });

  // 4. 配列の最後のカンマなどが不自然に残った場合の軽いお掃除 (例: `[ "A", ]` -> `[ "A" ]`)
  content = content.replace(/,\s*\]/g, '\n  ]');

  fs.writeFileSync(filePath, content);
  console.log(`\n🎉 完了！ 計 ${removeCount} 個の無駄な選択肢を locations.js から完全に削除しました。`);
}

main();
