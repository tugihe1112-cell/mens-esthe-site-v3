import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');

const MASTER_MAP = {
    // 都道府県
    'tokyo': '東京都', 'saitama': '埼玉県', 'kanagawa': '神奈川県', 'chiba': '千葉県', 'osaka': '大阪府', 'aichi': '愛知県', 'hyogo': '兵庫県', 'kyoto': '京都府', 'fukuoka': '福岡県', 'hokkaido': '北海道', 'miyagi': '宮城県', 'shizuoka': '静岡県', 'shiga': '滋賀県', 'fukui': '福井県',
    // 区・市・エリア
    'chiyoda': '千代田区', 'chuo': '中央区', 'minato': '港区', 'shinjuku': '新宿区', 'shibuya': '渋谷区', 'shinagawa': '品川区', 'meguro': '目黒区', 'ota': '大田区', 'setagaya': '世田谷区', 'sumida': '墨田区', 'koto': '江東区', 'arakawa': '荒川区', 'adachi': '足立区', 'toshima': '豊島区', 'kita': '北区', 'nerima': '練馬区', 'suginami': '杉並区', 'nakano': '中野区', 'taito': '台東区', 'bunkyo': '文京区', 'chofu': '調布市', 'fuchu': '府中市', 'machida': '町田市', 'mitaka': '三鷹市', 'musashino': '武蔵野市', 'tachikawa': '立川市', 'tama': '多摩市', 'kokubunji': '国分寺市', 'hachioji': '八王子市', 'koganei': '小金井市', 'dispatch': '出張', 'dispatch_outside': '出張（区外）',
    'ebisu': '恵比寿', 'omotesando': '表参道', 'harajuku': '原宿', 'yoyogi_harajuku': '代々木・原宿', 'hatagaya': '幡ヶ谷', 'hatsudai': '初台', 'sasazuka': '笹塚', 'akihabara': '秋葉原', 'ueno': '上野', 'gotanda': '五反田', 'kabukicho': '歌舞伎町', 'takadanobaba': '高田馬場', 'kagurazaka': '神楽坂', 'shinjuku_gyoen': '新宿御苑', 'kitasenju': '北千住', 'nippori': '日暮里', 'ginza': '銀座', 'akabane': '赤羽', 'ikebukuro': '池袋', 'sangenjaya': '三軒茶屋', 'shimokitazawa': '下北沢', 'roppongi': '六本木', 'azabujuban': '麻布十番', 'shimbashi': '新橋', 'shinbashi': '新橋', 'akasaka': '赤坂', 'nishiazabu': '西麻布', 'hamamatsucho': '浜松町', 'nakameguro': '中目黒', 'hiroo': '広尾', 'tamachi': '田町', 'toranomon': '虎ノ門', 'ningyocho': '人形町', 'kayabacho': '茅場町', 'nihonbashi': '日本橋', 'yotsuya': '四ツ谷', 'iidabashi': '飯田橋', 'jimbocho': '神保町', 'kanda': '神田', 'kudanshita': '九段下', 'iwamotocho': '岩本町', 'monzennakacho': '門前仲町', 'kameido': '亀戸', 'kichijoji': '吉祥寺', 'kamata': '蒲田', 'omori': '大森', 'shinokubo': '新大久保', 'okubo': '大久保', 'yotsuya_sanchome': '四谷三丁目', 'ichigaya': '市ヶ谷', 'higashishinjuku': '東新宿', 'shinjuku_sanchome': '新宿三丁目', 'nishishinjuku': '西新宿', 'wakamatsu_kawada': '若松河田', 'otsuka': '大塚', 'sugamo': '巣鴨', 'asakusabashi': '浅草橋', 'musashikoganei': '武蔵小金井', 'nakanosakaue': '中野坂上', 'jiyugaoka': '自由が丘', 'yutenji': '祐天寺', 'toritsudaigaku': '都立大学', 'gakugei_daigaku': '学芸大学',
    'umeda': '梅田', 'namba': '難波', 'juso': '十三', 'kyobashi': '京橋', 'tennoji': '天王寺', 'shinsaibashi': '心斎橋', 'nipponbashi': '日本橋', 'doyama': '堂山', 'kitahama': '北浜', 'nishinakajima': '西中島', 'higashimikuni': '東三国', 'nagahoribashi': '長堀橋', 'suita': '吹田', 'sakaisujihonmachi': '堺筋本町', 'esaka': '江坂', 'awaza': '阿波座', 'matsuyamachi': '松屋町', 'takatsuki': '高槻', 'sakaihigashi': '堺東', 'shinosaka': '新大阪', 'sakuragawa': '桜川', 'temmabashi': '天満橋', 'minamisenba': '南船場', 'kitashinchi': '北新地', 'tanimachi9': '谷町九丁目', 'higobashi': '肥後橋', 'minamimorimachi': '南森町',
    'sakae': '栄', 'meieki': '名駅', 'kanayama': '金山', 'fushimi': '伏見', 'chikusa': '千種区', 'hisaya': '久屋大通', 'imaike': '今池', 'shinsakae': '新栄', 'osu': '大須', 'yabacho': '矢場町', 'tsurumai': '鶴舞', 'takaoka': '高岡', 'izumi': '泉', 'ichinomiya': '一宮', 'noritake': '則武', 'kariya': '刈谷', 'nishiki': '錦', 'nagono': '那古野', 'marunouchi_nagoya': '丸の内', 'meiekiminami': '名駅南', 'kokusai_center': '国際センター', 'gifu': '岐阜', 'nagoya': '名古屋',
    'sannomiya': '三宮', 'kobe': '神戸', 'himeji': '姫路', 'hakata': '博多', 'kokura': '小倉', 'kurume': '久留米', 'sendai': '仙台', 'asabu': '麻生', 'tsuruga': '敦賀', 'mishima': '三島', 'numazu': '沼津', 'otsu_station': '大津駅', 'kusatsu': '草津', 'hikone': '彦根', 'kyoto_station': '京都駅', 'shijo_nishinotoin': '四条西洞院', 'kyoto_omiya': '大宮', 'nijo': '二条', 'senbon_sanjo': '千本三条'
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

                // 階層に基づいた厳密な判定
                // parts[0]: 都道府県
                // parts[1]: 市区町村
                // parts.length === 4 なら parts[2] が詳細エリア
                // parts.length === 3 なら parts[1] をエリアとしても扱う
                const prefRaw = parts[0];
                const cityRaw = parts[1];
                const areaRaw = (parts.length === 4) ? parts[2] : cityRaw;

                data.prefecture = MASTER_MAP[prefRaw] || prefRaw;
                data.city = MASTER_MAP[cityRaw] || cityRaw;
                data.area = MASTER_MAP[areaRaw] || areaRaw;
                
                // brandId付与（未付与の場合のみ）
                if (!data.brandId) data.brandId = item.replace('.json', '');

                fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
            } catch (e) {}
        }
    });
}

console.log('🔄 完全調査に基づいた最終正規化を実行中...');
process(DATA_DIR);
console.log('✨ 全データの物理的な「漢字固定」が完了しました。');
