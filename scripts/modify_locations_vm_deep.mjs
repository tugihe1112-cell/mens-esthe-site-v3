import fs from 'fs';
import vm from 'vm';
import { execSync } from 'child_process';

function main() {
  const filePath = 'src/data/locations.js';
  
  // 1. バックアップの作成
  const backupPath = `${filePath}.bak_${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`✅ バックアップを作成しました: ${backupPath}`);

  // 2. ファイル読み込みと変数の置換
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replaceAll('export const ', 'var ');
  code = code.replaceAll('export let ', 'var ');

  // 3. VMサンドボックス内で実行
  const sandbox = {};
  vm.createContext(sandbox);
  try {
    vm.runInNewContext(code, sandbox);
  } catch (e) {
    console.error('❌ VMでの実行中にエラーが発生しました:', e);
    return;
  }

  // --- 😈 最強のディープクリーン関数 ---
  const targets = ["未設定", "長堀橋・松屋町", "都下・その他"];
  
  function deepClean(obj) {
    if (Array.isArray(obj)) {
      // 配列の中からターゲット文字列を削除 (後ろからループして安全にsplice)
      for (let i = obj.length - 1; i >= 0; i--) {
        if (targets.includes(obj[i])) {
          obj.splice(i, 1);
        } else if (typeof obj[i] === 'object' && obj[i] !== null) {
          deepClean(obj[i]);
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      // オブジェクトのキーからターゲットを削除
      for (const key of Object.keys(obj)) {
        if (targets.includes(key)) {
          delete obj[key];
        } else {
          deepClean(obj[key]);
        }
      }
    }
  }

  // 4. 全ての主要データに対してディープクリーンを実行
  deepClean(sandbox.WARDS);
  deepClean(sandbox.REGIONS);
  deepClean(sandbox.REGION_MAP);
  deepClean(sandbox.PREF_CITY_MAP);

  // 5. コードの再構築
  let newCode = `export const WARDS = ${JSON.stringify(sandbox.WARDS, null, 2)};\n\n`;
  newCode += `export const REGIONS = ${JSON.stringify(sandbox.REGIONS, null, 2)};\n\n`;
  newCode += `export const REGION_MAP = ${JSON.stringify(sandbox.REGION_MAP, null, 2)};\n\n`;
  newCode += `export const PREF_CITY_MAP = ${JSON.stringify(sandbox.PREF_CITY_MAP, null, 2)};\n\n`;
  newCode += `export const LOCATION_DATA = WARDS;\n`;
  newCode += `export const WARD_GROUPS = [];\n`;
  newCode += `export const groupedLocations = WARD_GROUPS;\n`;

  // 6. ファイルへの書き込み
  fs.writeFileSync(filePath, newCode);
  console.log(`✅ locations.js を更新しました（キー・配列要素から完全抹消）。`);

  // 7. 構文チェック
  try {
    execSync(`node -c ${filePath}`);
    console.log(`✅ 構文チェック (node -c) を通過しました。`);
  } catch (e) {
    console.error(`❌ 構文チェックに失敗しました。ファイルをバックアップから復元してください。`);
  }
}

main();
