import fs from 'fs';
import vm from 'vm';
import { execSync } from 'child_process';

function main() {
  const filePath = 'src/data/locations.js';
  
  // 1. バックアップ
  const backupPath = `${filePath}.bak_dirty_${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`✅ バックアップを作成しました: ${backupPath}`);

  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replaceAll('export const ', 'var ');
  code = code.replaceAll('export let ', 'var ');

  // 2. VMで実行
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInNewContext(code, sandbox);

  // 3. ローマ字 -> 日本語の変換辞書
  const renameMap = {
    'ginza': '銀座',
    'fuchu': '府中',
    'gakugei_daigaku': '学芸大学',
    'jiyugaoka': '自由が丘',
    'nakameguro': '中目黒',
    'toritsudaigaku': '都立大学',
    'akabanebashi': '赤羽橋',
    'akasaka': '赤坂',
    'azabujuban': '麻布十番',
    'hamamatsucho': '浜松町',
    'nishiazabu': '西麻布',
    'roppongi': '六本木',
    'shinbashi': '新橋',
    'tamachi': '田町',
    'toranomon': '虎ノ門',
    'tsuruga': '敦賀',
    '23wards': '23区出張'
  };

  // ゴミとして削除する「区」のリスト（中野区は実データがあるので残す）
  const ghostKus = ['千種区', '目黒区', '練馬区', '渋谷区', '品川区', '新宿区'];

  // 4. WARDSのデータをクリーニング
  if (sandbox.WARDS) {
    for (const [parent, children] of Object.entries(sandbox.WARDS)) {
      if (Array.isArray(children)) {
        // マッピングで変換し、親と同じ名前のゴースト区を除外
        let cleanedArray = children.map(child => renameMap[child] || child);
        cleanedArray = cleanedArray.filter(child => {
          // 親が「目黒区」で、子が「目黒区」の場合、ghostKusに含まれていれば削除
          if (child === parent && ghostKus.includes(child)) return false;
          return true;
        });

        // 変換した結果「学芸大学」などが重複する可能性があるのでSetで一意にする
        sandbox.WARDS[parent] = Array.from(new Set(cleanedArray));
      }
    }
  }

  // 5. 書き戻し処理
  let newCode = `export const WARDS = ${JSON.stringify(sandbox.WARDS, null, 2)};\n\n`;
  newCode += `export const REGIONS = ${JSON.stringify(sandbox.REGIONS, null, 2)};\n\n`;
  newCode += `export const REGION_MAP = ${JSON.stringify(sandbox.REGION_MAP, null, 2)};\n\n`;
  newCode += `export const PREF_CITY_MAP = ${JSON.stringify(sandbox.PREF_CITY_MAP, null, 2)};\n\n`;
  newCode += `export const LOCATION_DATA = WARDS;\n`;
  newCode += `export const WARD_GROUPS = [];\n`;
  newCode += `export const groupedLocations = WARD_GROUPS;\n`;

  fs.writeFileSync(filePath, newCode);
  console.log(`✅ locations.js のローマ字と重複エリアを綺麗に修復しました。`);

  try {
    execSync(`node -c ${filePath}`);
    console.log(`✅ 構文チェック通過。アプリをリロードして確認してください！`);
  } catch (e) {
    console.error(`❌ 構文チェック失敗。`);
  }
}

main();
