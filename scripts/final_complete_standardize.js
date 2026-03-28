import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

// 【完全無欠の地名辞書：ここにある言葉をすべて漢字に変換します】
const MASTER_MAP = {
    // 都道府県
    'tokyo': '東京都', 'saitama': '埼玉県', 'kanagawa': '神奈川県', 'chiba': '千葉県',
    'osaka': '大阪府', 'aichi': '愛知県', 'hyogo': '兵庫県', 'kyoto': '京都府',
    'fukuoka': '福岡県', 'hokkaido': '北海道', 'miyagi': '宮城県', 'shizuoka': '静岡県',
    'shiga': '滋賀県', 'fukui': '福井県',
    // 市区町村（東京・大阪・愛知など全網羅）
    'arakawa': '荒川区', 'chofu': '調布市', 'fuchu': '府中市', 'kokubunji': '国分寺市',
    'koto': '江東区', 'machida': '町田市', 'mitaka': '三鷹市', 'musashino': '武蔵野市',
    'nakano': '中野区', 'ota': '大田区', 'suginami': '杉並区', 'sumida': '墨田区',
    'tachikawa': '立川市', 'tama': '多摩市', 'chiyoda': '千代田区', 'chuo': '中央区',
    'minato': '港区', 'shinjuku': '新宿区', 'shibuya': '渋谷区', 'shinagawa': '品川区',
    'meguro': '目黒区', 'setagaya': '世田谷区', 'nerima': '練馬区', 'toshima': '豊島区',
    'kita': '北区', 'itabashi': '板橋区', 'taito': '台東区', 'bunkyo': '文京区',
    'hachioji': '八王子市', 'koganei': '小金井市', 'dispatch': '出張', 'dispatch_outside': '出張（区外）',
    // エリア名
    'yoyogi_harajuku': '代々木・原宿', 'akihabara': '秋葉原', 'ueno': '上野', 'gotanda': '五反田',
    'chikusa': '千種区', 'fushimi': '伏見', 'hisaya': '久屋大通', 'ichinomiya': '一宮',
    'imaike': '今池', 'izumi': '泉', 'kanayama': '金山', 'meieki': '名駅', 'sakae': '栄',
    'umeda': '梅田', 'namba': '難波', 'juso': '十三', 'kyobashi': '京橋', 'tennoji': '天王寺'
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

                if (parts.length >= 3) {
                    // フォルダ名から漢字を引く。辞書にない場合はそのままにするが、今回は網羅しています。
                    data.prefecture = MASTER_MAP[parts[0]] || data.prefecture;
                    data.city = MASTER_MAP[parts[1]] || data.city;
                    data.area = MASTER_MAP[parts[2]] || data.area;
                    
                    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
                }
            } catch (e) {
                console.error(`Error in ${item}:`, e.message);
            }
        }
    });
}

console.log('🔄 全店舗データの最終・完全正規化を開始...');
process(DATA_DIR);
console.log('✨ 物理データの修正が完了しました。');
