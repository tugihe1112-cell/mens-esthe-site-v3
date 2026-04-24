import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  let locData = fs.readFileSync(locFile, 'utf8');
  let isUpdated = false;

  // 1. 「東京都」の配列に "八王子市", "調布市", "町田市" を追加
  const tokyoRegex = /"東京都":\s*\[(.*?)\]/;
  const tokyoMatch = locData.match(tokyoRegex);
  if (tokyoMatch) {
    let currentTokyoAreas = tokyoMatch[1];
    const newAreas = ['"八王子市"', '"調布市"', '"町田市"'];
    
    newAreas.forEach(area => {
      if (!currentTokyoAreas.includes(area)) {
        currentTokyoAreas += `, ${area}`;
        isUpdated = true;
      }
    });

    if (isUpdated) {
      locData = locData.replace(tokyoRegex, `"東京都": [${currentTokyoAreas}]`);
      console.log('✅ 東京都に「八王子市」「調布市」「町田市」を追加しました。');
    }
  }

  // 2. 個別のマッピングを追加
  const addMapping = (city, area) => {
    if (!locData.includes(`"${city}":`)) {
      // 挿入場所を雑に areas オブジェクトの終わり付近にする
      const areasEndRegex = /\};\s*export/m;
      if(areasEndRegex.test(locData)){
          locData = locData.replace(areasEndRegex, `  "${city}": ["${area}"],\n}; \nexport`);
          console.log(`✅ 「${city}」のマッピングを追加しました。`);
          isUpdated = true;
      }
    }
  };

  addMapping('八王子市', '八王子');
  addMapping('調布市', '調布');
  addMapping('町田市', '町田');

  if (isUpdated) {
    fs.writeFileSync(locFile, locData);
    console.log('🎉 locations.js の更新が完了しました！');
  } else {
    console.log('👉 locations.js の更新は不要でした。');
  }

} catch (err) {
  console.error('❌ ファイルの更新に失敗しました:', err.message);
}
