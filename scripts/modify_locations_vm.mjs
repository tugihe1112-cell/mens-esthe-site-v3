import fs from 'fs';
import vm from 'vm';
import { execSync } from 'child_process';

function main() {
  const filePath = 'src/data/locations.js';
  
  // 1. バックアップの作成
  const backupPath = `${filePath}.bak_${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`✅ バックアップを作成しました: ${backupPath}`);

  // 2. ファイル読み込みと変数の置換 (export const -> var)
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

  // 4. 対象キーの削除
  if (sandbox.WARDS) {
    delete sandbox.WARDS["未設定"];
    delete sandbox.WARDS["長堀橋・松屋町"];
    delete sandbox.WARDS["都下・その他"];
  }

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
  console.log(`✅ locations.js を更新しました。`);

  // 7. 構文チェック
  try {
    execSync(`node -c ${filePath}`);
    console.log(`✅ 構文チェック (node -c) を通過しました。`);
  } catch (e) {
    console.error(`❌ 構文チェックに失敗しました。ファイルをバックアップから復元してください。`);
  }
}

main();
