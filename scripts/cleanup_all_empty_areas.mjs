import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🚀 千葉・埼玉・大阪の「空っぽエリア」を locations.js から一括削除します...\n');
  const targetFile = path.resolve('src/data/locations.js');
  
  if (!fs.existsSync(targetFile)) {
    console.log('⚠️ src/data/locations.js が見つかりません。');
    return;
  }

  try {
    let content = fs.readFileSync(targetFile, 'utf-8');

    // 削除対象の「空っぽエリア」リスト
    const emptyAreas = [
      '栄町', '富士見', '松戸市', '市川市', // 千葉
      '川口市', '越谷市',                  // 埼玉
      '北新地', '難波', '京橋', '天王寺', '西中島南方' // 大阪
    ];

    // 1. 配列内の要素（例: "栄町", ）を削除
    emptyAreas.forEach(area => {
      // ダブルクォート、シングルクォート両対応。カンマとスペースも巻き込んで消す
      const regex = new RegExp(`["']${area}["']\\s*,?\\s*`, 'g');
      content = content.replace(regex, '');
    });

    // 2. 配列の最後にカンマが残る構文エラーを防ぐ（例: ["千葉", ] -> ["千葉"]）
    content = content.replace(/,\s*]/g, ']');
    
    // 3. 空っぽになった配列を持つ行そのものを削除 (例: "松戸市": [],)
    // 今回は親の県定義（"千葉県": [...]）から「松戸市」などを消す処理を上で行ったので、子の行は残っていても画面に出ませんが、念のため綺麗にします。
    const lines = content.split('\n');
    const cleanedLines = lines.filter(line => {
       // "XXX": [] のように空になった定義行は削除
       return !line.match(/"[^"]+"\s*:\s*\[\s*\]\s*,?/);
    });

    fs.writeFileSync(targetFile, cleanedLines.join('\n'));
    console.log('✅ src/data/locations.js の更新とクリーニングが完了しました！');
    console.log(`🗑️ 削除した地名: \n${emptyAreas.join(', ')}`);
    console.log('\n🎉 ブラウザをリロードして、各県のメニューから空っぽの選択肢が消えているか確認してください！');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}

main();
