import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

const MASTER_MAP = {
    'tokyo': '東京都', 'saitama': '埼玉県', 'kanagawa': '神奈川県', 'chiba': '千葉県', 'osaka': '大阪府', 'aichi': '愛知県', 'hyogo': '兵庫県', 'kyoto': '京都府', 'fukuoka': '福岡県', 'hokkaido': '北海道', 'miyagi': '宮城県', 'shizuoka': '静岡県', 'shiga': '滋賀県', 'fukui': '福井県',
    'shibuya': '渋谷区', 'shinjuku': '新宿区', 'minato': '港区', 'chuo': '中央区', 'chiyoda': '千代田区', 'adachi': '足立区', 'taito': '台東区', 'shinagawa': '品川区', 'meguro': '目黒区', 'setagaya': '世田谷区', 'nerima': '練馬区', 'toshima': '豊島区', 'kita': '北区', 'arakawa': '荒川区', 'sumida': '墨田区', 'koto': '江東区', 'nakano': '中野区', 'suginami': '杉並区', 'ota': '大田区', 'bunkyo': '文京区', 'chofu': '調布市', 'fuchu': '府中市', 'machida': '町田市', 'mitaka': '三鷹市', 'musashino': '武蔵野市', 'tachikawa': '立川市', 'tama': '多摩市', 'kokubunji': '国分寺市', 'hachioji': '八王子市', 'koganei': '小金井市', 'itabashi': '板橋区',
    'ebisu': '恵比寿', 'yoyogi_harajuku': '代々木・原宿', 'omotesando': '表参道', 'roppongi': '六本木', 'azabujuban': '麻布十番', 'kabukicho': '歌舞伎町', 'akihabara': '秋葉原', 'ueno': '上野', 'ginza': '銀座', 'ikebukuro': '池袋', 'kitasenju': '北千住', 'umeda': '梅田', 'namba': '難波', 'juso': '十三', 'kyobashi': '京橋', 'tennoji': '天王寺', 'sakae': '栄', 'meieki': '名駅', 'kanayama': '金山', 'fushimi': '伏見', 'chikusa': '千種区'
};

function process(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(item => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            process(fullPath);
        } else if (item.endsWith('.json')) {
            try {
                let data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                const relPath = path.relative(DATA_DIR, fullPath);
                const parts = relPath.split(path.sep);

                // 1. 地名の軸を矯正
                data.prefecture = MASTER_MAP[parts[0]] || data.prefecture;
                data.city = MASTER_MAP[parts[1]] || data.city;
                data.area = (parts.length === 4) ? (MASTER_MAP[parts[2]] || parts[2]) : (MASTER_MAP[parts[1]] || parts[1]);

                // 2. セラピストのラベルを「girls」から「therapists」に強制変換 (軸の統一)
                if (data.girls && !data.therapists) {
                    data.therapists = data.girls;
                    delete data.girls;
                    console.log(`🔧 ラベル修正: ${item} (girls -> therapists)`);
                }

                if (!data.brandId) data.brandId = item.replace('.json', '');

                fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
            } catch (e) {}
        }
    });
}

process(DATA_DIR);
console.log('✨ 地名とラベル名の全店舗一斉正規化が完了しました。');
