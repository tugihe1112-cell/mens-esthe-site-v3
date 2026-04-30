import fs from 'fs';
import vm from 'vm';
import { execSync } from 'child_process';

function main() {
  const filePath = 'src/data/locations.js';
  fs.copyFileSync(filePath, `${filePath}.bak_final_${Date.now()}`);

  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replaceAll('export const ', 'var ').replaceAll('export let ', 'var ');

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInNewContext(code, sandbox);

  // 削除対象（親と同じ名前の「〜区」）
  const redundantKus = ['千種区', '目黒区', '中野区', '練馬区', '渋谷区', '品川区', '新宿区'];

  if (sandbox.WARDS) {
    for (const [parent, children] of Object.entries(sandbox.WARDS)) {
      if (Array.isArray(children)) {
        // 1. 重複した「区」を削除し、かつ「中野区」はDBに合わせて「中野」に置換
        let cleaned = children
          .map(child => child === '中野区' ? '中野' : child)
          .filter(child => !redundantKus.includes(child));
        
        sandbox.WARDS[parent] = Array.from(new Set(cleaned));
      }
    }
  }

  // データの書き出し
  let newCode = `export const WARDS = ${JSON.stringify(sandbox.WARDS, null, 2)};\n\n`;
  newCode += `export const REGIONS = ${JSON.stringify(sandbox.REGIONS, null, 2)};\n\n`;
  newCode += `export const REGION_MAP = ${JSON.stringify(sandbox.REGION_MAP, null, 2)};\n\n`;
  newCode += `export const PREF_CITY_MAP = ${JSON.stringify(sandbox.PREF_CITY_MAP, null, 2)};\n\n`;
  newCode += `export const LOCATION_DATA = WARDS;\nexport const WARD_GROUPS = [];\nexport const groupedLocations = WARD_GROUPS;\n`;

  fs.writeFileSync(filePath, newCode);
  console.log(`✅ locations.js の最終クリーンアップが完了しました。`);

  try {
    execSync(`node -c ${filePath}`);
    console.log(`✅ 構文チェック通過。`);
  } catch (e) {
    console.error(`❌ 構文チェック失敗。`);
  }
}

main();
