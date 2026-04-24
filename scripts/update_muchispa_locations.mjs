import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  let locData = fs.readFileSync(locFile, 'utf8');
  let isUpdated = false;

  // 1. さいたま市の「南浦和」を追加
  const saitamaRegex = /"さいたま市":\s*\[(.*?)\]/;
  const saitamaMatch = locData.match(saitamaRegex);
  if (saitamaMatch && !saitamaMatch[1].includes('"南浦和"')) {
    locData = locData.replace(saitamaRegex, `"さいたま市": [$1, "南浦和"]`);
    console.log('✅ さいたま市に「南浦和」を追加しました。');
    isUpdated = true;
  } else {
    console.log('⚠️ さいたま市に「南浦和」は既に追加されています（または見つかりません）。');
  }

  // 2. 東京都の配列に「足立区」を追加
  const tokyoRegex = /"東京都":\s*\[(.*?)\]/;
  const tokyoMatch = locData.match(tokyoRegex);
  if (tokyoMatch && !tokyoMatch[1].includes('"足立区"')) {
    locData = locData.replace(tokyoRegex, `"東京都": [$1, "足立区"]`);
    console.log('✅ 東京都に「足立区」を追加しました。');
    isUpdated = true;
  } else {
    console.log('⚠️ 東京都に「足立区」は既に追加されています（または見つかりません）。');
  }

  // 3. 足立区のエリアマッピング「北千住」を追加
  if (!locData.includes('"足立区":')) {
    // 墨田区の行の次に追加する
    const sumidaRegex = /"墨田区":\s*\[.*?\]\,?\n/;
    if (sumidaRegex.test(locData)) {
      locData = locData.replace(sumidaRegex, match => `${match}  "足立区": ["北千住"],\n`);
      console.log('✅ 足立区（北千住）のマッピングを追加しました。');
      isUpdated = true;
    } else {
      console.log('❌ 挿入ポイント（墨田区）が見つかりませんでした。');
    }
  } else {
    console.log('⚠️ 足立区のマッピングは既に存在します。');
  }

  if (isUpdated) {
    fs.writeFileSync(locFile, locData);
    console.log('🎉 locations.js の更新が完了しました！');
  } else {
    console.log('👉 locations.js の更新は不要でした。');
  }

} catch (err) {
  console.error('❌ ファイルの更新に失敗しました:', err.message);
}
