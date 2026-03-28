import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

// 【確定した軸：地名辞書】
const MASTER_MAP = {
    'tokyo': '東京都', 'saitama': '埼玉県', 'kanagawa': '神奈川県', 'chiba': '千葉県',
    'shibuya': '渋谷区', 'shinjuku': '新宿区', 'minato': '港区', 'chuo': '中央区', 'chiyoda': '千代田区',
    'adachi': '足立区', 'taito': '台東区', 'shinagawa': '品川区', 'meguro': '目黒区',
    'setagaya': '世田谷区', 'nerima': '練馬区', 'toshima': '豊島区', 'kita': '北区',
    'arakawa': '荒川区', 'sumida': '墨田区', 'koto': '江東区', 'nakano': '中野区', 'suginami': '杉並区',
    'ota': '大田区', 'bunkyo': '文京区', 'chofu': '調布市', 'fuchu': '府中市', 'machida': '町田市',
    'mitaka': '三鷹市', 'musashino': '武蔵野市', 'tachikawa': '立川市', 'tama': '多摩市',
    'kokubunji': '国分寺市', 'hachioji': '八王子市', 'koganei': '小金井市',
    'dispatch': '出張', 'dispatch_outside': '出張（区外）',
    'yoyogi_harajuku': '代々木・原宿', 'akihabara': '秋葉原', 'ueno': '上野', 'gotanda': '五反田'
};

function standardize(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            standardize(fullPath);
        } else if (item.endsWith('.json')) {
            const relPath = path.relative(DATA_DIR, fullPath);
            const parts = relPath.split(path.sep);

            if (parts.length >= 3) {
                try {
                    let data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

                    // 1. フォルダ階層から「正解」を導き出す
                    const pref = MASTER_MAP[parts[0]] || parts[0];
                    const city = MASTER_MAP[parts[1]] || parts[1];
                    const area = MASTER_MAP[parts[2]] || parts[2];

                    // 2. データを物理的に上書き（型を「文字」に固定）
                    data.prefecture = pref;
                    data.city = city;
                    data.area = area;

                    // 3. 今後の口コミ集約用：brandId がなければ追加
                    if (!data.brandId) {
                        // ファイル名から拡張子を除いたものを暫定IDとする
                        data.brandId = item.replace('.json', ''); 
                    }

                    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
                    console.log(`✅ 正規化: ${pref} > ${city} > ${area} (${item})`);
                } catch (e) {
                    console.error(`❌ エラー (${item}):`, e.message);
                }
            }
        }
    });
}

console.log('🚀 全店舗データの「一斉清掃」を開始します...');
standardize(DATA_DIR);
console.log('✨ 全てのデータが「正解の軸」に整いました。');
