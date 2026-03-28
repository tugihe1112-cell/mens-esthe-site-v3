import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data/tokyo');

function diagnose() {
    let totalFiles = 0;
    let invalidJson = [];
    let duplicateIds = {};
    let idMap = new Map();

    function scan(dir) {
        fs.readdirSync(dir).forEach(item => {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                scan(fullPath);
            } else if (item.endsWith('.json')) {
                totalFiles++;
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const data = JSON.parse(content);
                    const id = data.id || 'NO_ID';
                    
                    if (idMap.has(id)) {
                        if (!duplicateIds[id]) duplicateIds[id] = [idMap.get(id)];
                        duplicateIds[id].push(fullPath);
                    } else {
                        idMap.set(id, fullPath);
                    }
                } catch (e) {
                    invalidJson.push({ file: item, error: e.message });
                }
            }
        });
    }

    scan(DATA_DIR);

    console.log(`\n--- 東京エリア診断レポート ---`);
    console.log(`物理ファイル総数: ${totalFiles}`);
    console.log(`読み込み失敗 (壊れたJSON): ${invalidJson.length}`);
    invalidJson.forEach(err => console.log(`  ❌ ${err.file}: ${err.error}`));
    
    const duplicateCount = Object.keys(duplicateIds).length;
    console.log(`IDが重複している店舗数: ${duplicateCount}`);
    if (duplicateCount > 0) {
        console.log(`  ⚠️ 以下の店舗が同じIDを奪い合っています（これが消滅の主因です）`);
        Object.entries(duplicateIds).slice(0, 5).forEach(([id, files]) => {
            console.log(`  ID [${id}]:\n    ${files.join('\n    ')}`);
        });
    }
    console.log(`------------------------------\n`);
}

diagnose();
