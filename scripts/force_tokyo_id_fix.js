import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');
const INDEX_OUTPUT = path.join(__dirname, '../src/data/index.js');

const TOKYO_AXIS = {
    'shinjuku': '新宿区', 'shibuya': '渋谷区', 'minato': '港区', 'chuo': '中央区', 'chiyoda': '千代田区',
    'adachi': '足立区', 'taito': '台東区', 'shinagawa': '品川区', 'meguro': '目黒区', 'setagaya': '世田谷区',
    'nerima': '練馬区', 'toshima': '豊島区', 'kita': '北区', 'arakawa': '荒川区', 'sumida': '墨田区',
    'koto': '江東区', 'nakano': '中野区', 'suginami': '杉並区', 'ota': '大田区', 'bunkyo': '文京区',
    'chofu': '調布市', 'fuchu': '府中市', 'machida': '町田市', 'mitaka': '三鷹市', 'musashino': '武蔵野市',
    'tachikawa': '立川市', 'tama': '多摩市', 'kokubunji': '国分寺市', 'hachioji': '八王子市', 'koganei': '小金井市',
    'itabashi': '板橋区', 'ebisu': '恵比寿', 'yoyogi_harajuku': '代々木・原宿', 'omotesando': '表参道'
};

function forceFix() {
    let allShops = {};
    let fixedCount = 0;

    function scan(dir) {
        fs.readdirSync(dir).forEach(item => {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                scan(fullPath);
            } else if (item.endsWith('.json')) {
                const relPath = path.relative(DATA_DIR, fullPath);
                const parts = relPath.split(path.sep);

                if (parts[0] === 'tokyo') {
                    let data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    
                    // 【重要】IDをフォルダ階層から強制生成（これでNO_IDを根絶する）
                    // 例: tokyo_shibuya_ebisu_aroma_blossom
                    const safeId = parts.join('_').replace('.json', '');
                    data.id = safeId;
                    
                    data.prefecture = '東京都';
                    data.city = TOKYO_AXIS[parts[1]] || parts[1];
                    data.area = (parts.length === 4) ? (TOKYO_AXIS[parts[2]] || parts[2]) : data.city;
                    
                    if (data.girls) {
                        data.therapists = data.girls;
                        delete data.girls;
                    }

                    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
                    allShops[data.id] = data;
                    fixedCount++;
                }
            }
        });
    }

    scan(DATA_DIR);
    fs.writeFileSync(INDEX_OUTPUT, `export const allShops = ${JSON.stringify(allShops, null, 2)};`);
    console.log(`\n✨ 東京エリア 462店舗のID強制付与が完了しました。`);
    console.log(`処理した店舗数: ${fixedCount}`);
    console.log(`登録されたユニークID数: ${Object.keys(allShops).length}\n`);
}

forceFix();
