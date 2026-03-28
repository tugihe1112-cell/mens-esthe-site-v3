import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');
const INDEX_OUTPUT = path.join(__dirname, '../src/data/index.js');

// 東京に特化した正規化マップ
const TOKYO_MAP = {
    'shibuya': '渋谷区', 'shinjuku': '新宿区', 'minato': '港区', 'chuo': '中央区', 'chiyoda': '千代田区',
    'adachi': '足立区', 'taito': '台東区', 'shinagawa': '品川区', 'meguro': '目黒区', 'setagaya': '世田谷区',
    'nerima': '練馬区', 'toshima': '豊島区', 'kita': '北区', 'arakawa': '荒川区', 'sumida': '墨田区',
    'koto': '江東区', 'nakano': '中野区', 'suginami': '杉並区', 'ota': '大田区', 'bunkyo': '文京区',
    'chofu': '調布市', 'fuchu': '府中市', 'machida': '町田市', 'mitaka': '三鷹市', 'musashino': '武蔵野市',
    'tachikawa': '立川市', 'tama': '多摩市', 'kokubunji': '国分寺市', 'hachioji': '八王子市', 'koganei': '小金井市',
    'itabashi': '板橋区'
};

function repairTokyo() {
    let allShops = {};
    let count = 0;
    let duplicates = 0;

    function scan(dir) {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(item => {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                scan(fullPath);
            } else if (item.endsWith('.json')) {
                try {
                    let data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    const relPath = path.relative(DATA_DIR, fullPath);
                    const parts = relPath.split(path.sep);

                    // 東京のデータだけを処理
                    if (parts[0] === 'tokyo') {
                        data.prefecture = '東京都';
                        data.city = TOKYO_MAP[parts[1]] || data.city || parts[1];
                        data.area = (parts.length === 4) ? (TOKYO_MAP[parts[2]] || parts[2]) : data.city;
                        
                        // IDの重複チェック
                        if (allShops[data.id]) {
                            duplicates++;
                            // 重複している場合はIDをファイル名で上書きして強制的に別店舗にする
                            data.id = item.replace('.json', '');
                        }
                        
                        // girls -> therapists 変換
                        if (data.girls && !data.therapists) {
                            data.therapists = data.girls;
                            delete data.girls;
                        }

                        allShops[data.id] = data;
                        count++;
                    }
                } catch (e) {
                    console.error(`❌ パース失敗: ${item}`);
                }
            }
        });
    }

    console.log('🔍 東京フォルダの全数調査を開始...');
    scan(DATA_DIR);
    
    // index.js を更新
    fs.writeFileSync(INDEX_OUTPUT, `export const allShops = ${JSON.stringify(allShops, null, 2)};`);
    
    console.log(`-----------------------------------`);
    console.log(`✅ 調査・修正完了`);
    console.log(`対象ファイル数: ${count}`);
    console.log(`ID重複による修正数: ${duplicates}`);
    console.log(`最終登録店舗数: ${Object.keys(allShops).length}`);
}

repairTokyo();
