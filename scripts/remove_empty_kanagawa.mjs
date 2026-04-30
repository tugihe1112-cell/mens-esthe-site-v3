import fs from 'fs';
import path from 'path';

async function main() {
  const targetFile = path.resolve('src/data/locations.js');
  
  if (!fs.existsSync(targetFile)) {
    console.log('⚠️ src/data/locations.js が見つかりません。');
    return;
  }

  try {
    let content = fs.readFileSync(targetFile, 'utf-8');
    const emptyAreas = ['伊勢佐木町', 'みなとみらい', '鶴見', '堀之内', '南町'];

    // 削除対象のエリア名（とそれに付随するカンマ）を置換して消し去る
    emptyAreas.forEach(area => {
      // "エリア名", または 'エリア名', などを柔軟にキャッチして削除
      const regex = new RegExp(`["']${area}["']\\s*,?\\s*`, 'g');
      content = content.replace(regex, '');
    });

    // 配列の最後にカンマが残ってしまった場合 (例: [..., "新横浜", ] ) の構文エラーを防止
    content = content.replace(/,\s*]/g, ']');

    fs.writeFileSync(targetFile, content);
    console.log('✅ src/data/locations.js の更新が完了しました！');
    console.log(`🗑️ 削除したエリア: ${emptyAreas.join(', ')}`);
    console.log('\n🎉 ブラウザをリロードして、メニューがスッキリしているか確認してください！');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}

main();
