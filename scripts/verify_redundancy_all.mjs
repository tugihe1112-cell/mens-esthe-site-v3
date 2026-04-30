import fs from 'fs';
import vm from 'vm';

function main() {
  const filePath = 'src/data/locations.js';
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replaceAll('export const ', 'var ').replaceAll('export let ', 'var ');

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInNewContext(code, sandbox);

  const wards = sandbox.WARDS || {};
  let found = false;

  console.log('🔍 locations.js 内に親子で名前が重複している箇所がないか最終確認します...');

  for (const [parent, children] of Object.entries(wards)) {
    if (Array.isArray(children)) {
      children.forEach(child => {
        // 親が「〜区」または「〜市」で、子がそれと完全に一致する場合
        if (parent === child && (parent.endsWith('区') || parent.endsWith('市'))) {
          console.log(`⚠️ 重複発見: [${parent}] の中に [${child}] がまだ残っています`);
          found = true;
        }
      });
    }
  }

  if (!found) {
    console.log('✅ 完璧です。全ての「区の中の区」「市の中の市」という重複は解消されました。');
  }
}

main();
