import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetFile = path.join(__dirname, '../src/data/locations.js');

try {
  let data = fs.readFileSync(targetFile, 'utf8');

  // "築地" と "月島" を文字列から安全に削除（カンマも考慮）
  data = data.replace(/['"]築地['"]\s*,\s*/g, '')
             .replace(/,\s*['"]築地['"]/g, '')
             .replace(/['"]築地['"]/g, '');
             
  data = data.replace(/['"]月島['"]\s*,\s*/g, '')
             .replace(/,\s*['"]月島['"]/g, '')
             .replace(/['"]月島['"]/g, '');

  fs.writeFileSync(targetFile, data, 'utf8');
  console.log('✅ src/data/locations.js から「築地」と「月島」を削除しました！');
} catch (err) {
  console.error('❌ エラーが発生しました:', err);
}
