import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');
const INDEX_OUTPUT = path.join(__dirname, '../src/data/index.js');
const LOCATIONS_OUTPUT = path.join(__dirname, '../src/data/locations.js');

const TOKYO_AXIS = { 'kitasenju': '北千住', 'takenotsuka': '竹ノ塚', 'ushida': '牛田', 'adachi': '足立区' };

// 見出しのグループ定義
const TOKYO_GROUPS = {
    "--- 城東 ---": ["足立区", "葛飾区", "江戸川区", "墨田区", "江東区"],
    "--- 城南 ---": ["品川区", "大田区", "世田谷区", "目黒区"],
    "--- 城西 ---": ["新宿区", "渋谷区", "中野区", "杉並区"],
    "--- 城北 ---": ["豊島区", "北区", "板橋区", "練馬区", "文京区"],
    "--- 都心 ---": ["千代田区", "中央区", "港区"]
};

function generate() {
    let allShops = {};
    let locations = {};

    function scan(dir) {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(item => {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                scan(fullPath);
            } else if (item.endsWith('.json') && item !== 'shops.json') {
                let data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                
                // クリーニング：フォルダ名が混じらないよう city を補正
                if (data.city === "dispatch") return; // 不要なデータはスキップ

                const relPath = path.relative(DATA_DIR, fullPath);
                const parts = relPath.split(path.sep);

                data.threads = data.therapists || data.girls || data.threads || [];
                data.id = relPath.replace(/\//g, '_').replace('.json', '');

                if (relPath.startsWith('tokyo')) {
                    data.prefecture = "東京都";
                    data.city = TOKYO_AXIS[parts[1]] || data.city;
                    data.area = TOKYO_AXIS[parts[2]] || data.area;
                }

                allShops[data.id] = data;

                if (!locations[data.prefecture]) locations[data.prefecture] = new Set();
                locations[data.prefecture].add(data.city);
                if (!locations[data.city]) locations[data.city] = new Set();
                locations[data.city].add(data.area);
            }
        });
    }

    scan(DATA_DIR);

    const finalizedWards = {};
    Object.keys(locations).forEach(pref => {
        if (pref === "東京都") {
            const currentCities = Array.from(locations[pref]);
            let sortedCitiesWithHeaders = [];
            
            Object.entries(TOKYO_GROUPS).forEach(([header, wards]) => {
                const foundWards = wards.filter(w => currentCities.includes(w));
                if (foundWards.length > 0) {
                    sortedCitiesWithHeaders.push(header); 
                    sortedCitiesWithHeaders.push(...foundWards.sort()); 
                }
            });

            // 三鷹市や八王子市などは「その他」へ
            const otherCities = currentCities.filter(c => !Object.values(TOKYO_GROUPS).flat().includes(c) && c !== "東京都");
            if (otherCities.length > 0) {
                sortedCitiesWithHeaders.push("--- その他・市部 ---");
                sortedCitiesWithHeaders.push(...otherCities.sort());
            }
            finalizedWards[pref] = sortedCitiesWithHeaders;
        } else {
            finalizedWards[pref] = Array.from(locations[pref]).sort();
        }
    });

    fs.writeFileSync(INDEX_OUTPUT, `export const allShops = ${JSON.stringify(allShops, null, 2)};`);
    fs.writeFileSync(LOCATIONS_OUTPUT, `export const WARDS = ${JSON.stringify(finalizedWards, null, 2)};\nexport const LOCATION_DATA = WARDS;\nexport const REGIONS = ["東京都", "埼玉県", "千葉県", "神奈川県", "大阪府", "愛知県", "兵庫県", "京都府", "福岡県", "北海道", "宮城県", "静岡県", "滋賀県", "福井県"];\nexport const WARD_GROUPS = [];\nexport const groupedLocations = WARD_GROUPS;`);
    
    console.log(`✅ データ整理完了。「城東」「城南」などの目次を生成しました。`);
}
generate();
