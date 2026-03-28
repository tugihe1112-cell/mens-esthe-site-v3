import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');
const INDEX_OUTPUT = path.join(__dirname, '../src/data/index.js');

// 【東京・詳細エリア完全辞書：あなたのfind結果から全て抽出しました】
const TOKYO_AXIS = {
    'shinjuku': '新宿区', 'shibuya': '渋谷区', 'minato': '港区', 'chuo': '中央区', 'chiyoda': '千代田区',
    'adachi': '足立区', 'taito': '台東区', 'shinagawa': '品川区', 'meguro': '目黒区', 'setagaya': '世田谷区',
    'nerima': '練馬区', 'toshima': '豊島区', 'kita': '北区', 'arakawa': '荒川区', 'sumida': '墨田区',
    'koto': '江東区', 'nakano': '中野区', 'suginami': '杉並区', 'ota': '大田区', 'bunkyo': '文京区',
    'chofu': '調布市', 'fuchu': '府中市', 'machida': '町田市', 'mitaka': '三鷹市', 'musashino': '武蔵野市',
    'tachikawa': '立川市', 'tama': '多摩市', 'kokubunji': '国分寺市', 'hachioji': '八王子市', 'koganei': '小金井市',
    'itabashi': '板橋区',
    // 3つ目のフィルター用（詳細地名）
    'toritsudaigaku': '都立大学', 'ryougoku': '両国', 'kinshicho': '錦糸町', 'koenji': '高円寺', 'ogikubo': '荻窪',
    'meidaimae': '明大前', 'shimokitazawa': '下北沢', 'sangenjaya': '三軒茶屋', 'komazawa_daigaku': '駒沢大学',
    'kyodo': '経堂', 'futakotamagawa': '二子玉川', 'sakurashinmachi': '桜新町', 'soshigaya_okura': '祖師ヶ谷大蔵',
    'chitose_karasuyama': '千歳烏山', 'soshigaya': '祖師谷', 'azabujuban': '麻布十番', 'roppongi': '六本木',
    'akabanebashi': '赤羽橋', 'akasaka': '赤坂', 'nishiazabu': '西麻布', 'hamamatsucho': '浜松町', 'shimbashi': '新橋',
    'shinbashi': '新橋', 'nakameguro': '中目黒', 'hiroo': '広尾', 'tamachi': '田町', 'toranomon': '虎ノ門',
    'nippori': '日暮里', 'jiyugaoka': '自由が丘', 'yutenji': '祐天寺', 'gakugei_daigaku': '学芸大学',
    '23wards': '23区内', 'oizumigakuen': '大泉学園', 'ushida': '牛田', 'kitasenju': '北千住',
    'takenotsuka': '竹の塚', 'oimachi': '大井町', 'osaki': '大崎', 'musashikoyama': '武蔵小山',
    'gotanda': '五反田', 'seisekisakuragaoka': '聖蹟桜ヶ丘', 'tamacenter': '多摩センター',
    'ningyocho': '人形町', 'ginza': '銀座', 'kayabacho': '茅場町', 'nihonbashi': '日本橋',
    'yotsuya': '四ツ谷', 'akihabara': '秋葉原', 'iidabashi': '飯田橋', 'jimbocho': '神保町',
    'kanda': '神田', 'kudanshita': '九段下', 'iwamotocho': '岩本町', 'monzennakacho': '門前仲町',
    'kameido': '亀戸', 'kichijoji': '吉祥寺', 'kamata': '蒲田', 'omori': '大森', 'shinokubo': '新大久保',
    'shinjuku_gyoen': '新宿御苑', 'okubo': '大久保', 'yotsuya_sanchome': '四谷三丁目', 'ichigaya': '市ヶ谷',
    'takadanobaba': '高田馬場', 'higashishinjuku': '東新宿', 'kagurazaka': '神楽坂', 'kabukicho': '歌舞伎町',
    'shinjuku_sanchome': '新宿三丁目', 'shinjuku': '新宿', 'nishishinjuku': '西新宿', 'wakamatsu_kawada': '若松河田',
    'ikebukuro': '池袋', 'otsuka': '大塚', 'sugamo': '巣鴨', 'ueno': '上野', 'asakusabashi': '浅草橋',
    'yoyogi_harajuku': '代々木・原宿', 'hatsudai': '初台', 'hatagaya': '幡ヶ谷', 'omotesando': '表参道',
    'sasazuka': '笹塚', 'musashikoganei': '武蔵小金井', 'nakanosakaue': '中野坂上', 'outside_23wards': '23区外',
    'bubaigawara': '分倍河原', 'ebisu': '恵比寿', 'ryogoku': '両国', 'akabane': '赤羽'
};

function fixTokyo() {
    // 1. まず現在の全店舗データを読み込む
    const indexContent = fs.readFileSync(INDEX_OUTPUT, 'utf8');
    const match = indexContent.match(/export const allShops = (\{[\s\S]*\});/);
    let allShops = match ? JSON.parse(match[1]) : {};

    function scan(dir) {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(item => {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                scan(fullPath);
            } else if (item.endsWith('.json')) {
                const relPath = path.relative(DATA_DIR, fullPath);
                const parts = relPath.split(path.sep);

                if (parts[0] === 'tokyo') {
                    let data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    
                    // IDを「フォルダ名_ファイル名」でユニークに固定 (462店舗全てを救う)
                    data.id = parts.join('_').replace('.json', '');
                    
                    data.prefecture = '東京都';
                    data.city = TOKYO_AXIS[parts[1]] || data.city || parts[1];
                    data.area = (parts.length === 4) ? (TOKYO_AXIS[parts[2]] || parts[2]) : data.city;
                    
                    // ラベル統一
                    if (data.girls && !data.therapists) {
                        data.therapists = data.girls;
                        delete data.girls;
                    }

                    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
                    allShops[data.id] = data;
                }
            }
        });
    }

    scan(DATA_DIR);
    fs.writeFileSync(INDEX_OUTPUT, `export const allShops = ${JSON.stringify(allShops, null, 2)};`);
}

console.log('🧹 東京エリア 462店舗の「軸固定」を開始...');
fixTokyo();
console.log('✅ 東京の物理データとインデックスの修正が完了しました。');
