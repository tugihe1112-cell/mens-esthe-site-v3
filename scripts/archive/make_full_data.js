import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 1. セラピスト全データ (177名)
// ==========================================
const allThreads = [
  { id: 1, therapistName: "月音きょうか", tags: ["30歳", "156cm", "A型"], posts: [] },
  { id: 2, therapistName: "星宮ひかり", tags: ["37歳", "155cm", "A型"], posts: [] },
  { id: 3, therapistName: "小泉ゆき", tags: ["42歳", "160cm", "O型"], posts: [] },
  { id: 4, therapistName: "樋口さや", tags: ["43歳", "156cm", "O型"], posts: [] },
  { id: 5, therapistName: "西条ほのか", tags: ["40歳", "159cm", "O型"], posts: [] },
  { id: 6, therapistName: "田村あさみ", tags: ["30歳", "157cm", "O型"], posts: [] },
  { id: 7, therapistName: "光月みあ", tags: ["31歳", "158cm", "O型"], posts: [] },
  { id: 8, therapistName: "広田ちはる", tags: ["30歳", "157cm", "A型"], posts: [] },
  { id: 9, therapistName: "小林まりな", tags: ["42歳", "159cm", "O型"], posts: [] },
  { id: 10, therapistName: "愛野ここ", tags: ["37歳", "166cm", "AB型"], posts: [] },
  { id: 11, therapistName: "九条みな", tags: ["33歳", "160cm", "A型"], posts: [] },
  { id: 12, therapistName: "柊木ありす", tags: ["33歳", "160cm", "O型"], posts: [] },
  { id: 13, therapistName: "葉山みれい", tags: ["34歳", "152cm", "A型"], posts: [] },
  { id: 14, therapistName: "満島めい", tags: ["32歳", "162cm", "A型"], posts: [] },
  { id: 15, therapistName: "加藤なぎさ", tags: ["30歳", "157cm", "A型"], posts: [] },
  { id: 16, therapistName: "大城あずみ", tags: ["37歳", "162cm", "A型"], posts: [] },
  { id: 17, therapistName: "観月まな", tags: ["40歳", "158cm", "B型"], posts: [] },
  { id: 18, therapistName: "東條ゆい", tags: ["36歳", "156cm", "A型"], posts: [] },
  { id: 19, therapistName: "浅香らら", tags: ["36歳", "159cm", "A型"], posts: [] },
  { id: 20, therapistName: "内田もえ", tags: ["32歳", "161cm", "A型"], posts: [] },
  { id: 21, therapistName: "如月ゆな", tags: ["36歳", "172cm", "A型"], posts: [] },
  { id: 22, therapistName: "星ななみ", tags: ["33歳", "161cm", "B型"], posts: [] },
  { id: 23, therapistName: "日比谷まほ", tags: ["31歳", "156cm", "O型"], posts: [] },
  { id: 24, therapistName: "一ノ瀬あやめ", tags: ["30歳", "163cm", "B型"], posts: [] },
  { id: 25, therapistName: "黒崎えりか", tags: ["39歳", "175cm", "A型"], posts: [] },
  { id: 26, therapistName: "工藤みゆ", tags: ["31歳", "161cm", "A型"], posts: [] },
  { id: 27, therapistName: "雪野しずく", tags: ["35歳", "160cm", "O型"], posts: [] },
  { id: 28, therapistName: "平野るか", "tags: ["40歳", "150cm", "O型"], posts: [] },
  { id: 29, therapistName: "徳永ふうか", "tags: ["33歳", "157cm", "B型"], posts: [] },
  { id: 30, therapistName: "綾森ちか", "tags: ["33歳", "150cm", "A型"], posts: [] },
  { id: 31, therapistName: "月見もも", "tags: ["31歳", "157cm", "B型"], posts: [] },
  { id: 32, therapistName: "黒川あかり", "tags: ["34歳", "161cm", "A型"], posts: [] },
  { id: 33, therapistName: "相澤えり", "tags: ["36歳", "163cm", "A型"], posts: [] },
  { id: 34, therapistName: "高木わかな", "tags: ["40歳", "160cm", "O型"], posts: [] },
  { id: 35, therapistName: "三花えれな", "tags: ["30歳", "151cm", "O型"], posts: [] },
  { id: 36, therapistName: "神楽こころ", "tags: ["32歳", "163cm", "A型"], posts: [] },
  { id: 37, therapistName: "河合まゆか", "tags: ["37歳", "163cm", "O型"], posts: [] },
  { id: 38, therapistName: "水野みわ", "tags: ["30歳", "157cm", "O型"], posts: [] },
  { id: 39, therapistName: "夏樹とわ", "tags: ["38歳", "164cm", "A型"], posts: [] },
  { id: 40, therapistName: "西りのん", "tags: ["43歳", "162cm", "O型"], posts: [] },
  { id: 41, therapistName: "川瀬れいさ", "tags: ["34歳", "157cm", "A型"], posts: [] },
  { id: 42, therapistName: "椎名あずさ", "tags: ["30歳", "158cm", "O型"], posts: [] },
  { id: 43, therapistName: "岩谷えりな", "tags: ["36歳", "160cm", "O型"], posts: [] },
  { id: 44, therapistName: "七瀬つばさ", "tags: ["34歳", "170cm", "A型"], posts: [] },
  { id: 45, therapistName: "清水のぞみ", "tags: ["45歳", "156cm", "A型"], posts: [] },
  { id: 46, therapistName: "大島えみ", "tags: ["41歳", "158cm", "A型"], posts: [] },
  { id: 47, therapistName: "今井あんな", "tags: ["40歳", "164cm", "O型"], posts: [] },
  { id: 48, therapistName: "夏川くるみ", "tags: ["37歳", "156cm", "O型"], posts: [] },
  { id: 49, therapistName: "七海もあ", "tags: ["31歳", "156cm", "O型"], posts: [] },
  { id: 50, therapistName: "宮本りんか", "tags: ["41歳", "160cm", "B型"], posts: [] },
  { id: 51, therapistName: "野崎るな", "tags: ["39歳", "163cm", "A型"], posts: [] },
  { id: 52, therapistName: "篠崎せいら", "tags: ["30歳", "165cm", "A型"], posts: [] },
  { id: 53, therapistName: "久遠みかこ", "tags: ["30歳", "168cm", "B型"], posts: [] },
  { id: 54, therapistName: "白川れな", "tags: ["30歳", "165cm", "O型"], posts: [] },
  { id: 55, therapistName: "桜羽れいな", "tags: ["30歳", "163cm", "O型"], posts: [] },
  { id: 56, therapistName: "上川ほのか", "tags: ["43歳", "163cm", "A型"], posts: [] },
  { id: 57, therapistName: "大谷りん", "tags: ["36歳", "157cm", "O型"], posts: [] },
  { id: 58, therapistName: "白石あゆみ", "tags: ["34歳", "163cm", "AB型"], posts: [] },
  { id: 59, therapistName: "泉けい", "tags: ["43歳", "163cm", "B型"], posts: [] },
  { id: 60, therapistName: "三雲ゆかり", "tags: ["30歳", "158cm", "O型"], posts: [] },
  { id: 61, therapistName: "石原ちなつ", "tags: ["31歳", "158cm", "B型"], posts: [] },
  { id: 62, therapistName: "永瀬しほ", "tags: ["32歳", "165cm", "AB型"], posts: [] },
  { id: 63, therapistName: "大沢すみれ", "tags: ["42歳", "161cm", "O型"], posts: [] },
  { id: 64, therapistName: "吉田なるみ", "tags: ["30歳", "167cm", "A型"], posts: [] },
  { id: 65, therapistName: "桃瀬りの", "tags: ["32歳", "153cm", "O型"], posts: [] },
  { id: 66, therapistName: "藤野あきほ", "tags: ["31歳", "155cm", "A型"], posts: [] },
  { id: 67, therapistName: "土屋まゆみ", "tags: ["46歳", "159cm", "A型"], posts: [] },
  { id: 68, therapistName: "佐倉はる", "tags: ["32歳", "160cm", "O型"], posts: [] },
  { id: 69, therapistName: "倉木はるか", "tags: ["33歳", "168cm", "A型"], posts: [] },
  { id: 70, therapistName: "月野そら", "tags: ["41歳", "157cm", "O型"], posts: [] },
  { id: 71, therapistName: "木ノ下あいり", "tags: ["34歳", "162cm", "AB型"], posts: [] },
  { id: 72, therapistName: "我妻ゆり", "tags: ["37歳", "162cm", "O型"], posts: [] },
  { id: 73, therapistName: "来栖ななこ", "tags: ["37歳", "156cm", "A型"], posts: [] },
  { id: 74, therapistName: "三井くるみ", "tags: ["34歳", "161cm", "A型"], posts: [] },
  { id: 75, therapistName: "本城あいか", "tags: ["31歳", "156cm", "B型"], posts: [] },
  { id: 76, therapistName: "星みれな", "tags: ["42歳", "158cm", "O型"], posts: [] },
  { id: 77, therapistName: "坂井のあ", "tags: ["41歳", "156cm", "A型"], posts: [] },
  { id: 78, therapistName: "松原ほなみ", "tags: ["33歳", "157cm", "A型"], posts: [] },
  { id: 79, therapistName: "舞川なこ", "tags: ["36歳", "156cm", "O型"], posts: [] },
  { id: 80, therapistName: "北宮ゆうこ", "tags: ["33歳", "168cm", "A型"], posts: [] },
  { id: 81, therapistName: "桜井ゆり", "tags: ["35歳", "164cm", "B型"], posts: [] },
  { id: 82, therapistName: "秋月いろは", "tags: ["33歳", "152cm", "A型"], posts: [] },
  { id: 83, therapistName: "山田あん", "tags: ["34歳", "157cm", "O型"], posts: [] },
  { id: 84, therapistName: "宝来ゆずき", "tags: ["31歳", "168cm", "A型"], posts: [] },
  { id: 85, therapistName: "立川ゆい", "tags: ["35歳", "170cm", "O型"], posts: [] },
  { id: 86, therapistName: "小春ひより", "tags: ["36歳", "157cm", "A型"], posts: [] },
  { id: 87, therapistName: "小宮山いおり", "tags: ["30歳", "159cm", "A型"], posts: [] },
  { id: 88, therapistName: "樋口のどか", "tags: ["30歳", "165cm", "A型"], posts: [] },
  { id: 89, therapistName: "瀬奈ももえ", "tags: ["44歳", "161cm", "O型"], posts: [] },
  { id: 90, therapistName: "矢沢あかね", "tags: ["32歳", "158cm", "O型"], posts: [] },
  { id: 91, therapistName: "三上ゆうな", "tags: ["31歳", "159cm", "A型"], posts: [] },
  { id: 92, therapistName: "中条かれん", "tags: ["30歳", "165cm", "A型"], posts: [] },
  { id: 93, therapistName: "片瀬あおい", "tags: ["38歳", "170cm", "O型"], posts: [] },
  { id: 94, therapistName: "森咲えみり", "tags: ["33歳", "158cm", "A型"], posts: [] },
  { id: 95, therapistName: "深澤はるな", "tags: ["32歳", "153cm", "O型"], posts: [] },
  { id: 96, therapistName: "葉月かすみ", "tags: ["44歳", "152cm", "A型"], posts: [] },
  { id: 97, therapistName: "桜井さやか", "tags: ["40歳", "157cm", "O型"], posts: [] },
  { id: 98, therapistName: "染谷あやみ", "tags: ["30歳", "170cm", "A型"], posts: [] },
  { id: 99, therapistName: "畑中あんり", "tags: ["37歳", "164cm", "A型"], posts: [] },
  { id: 100, therapistName: "鷹宮しずか", "tags: ["32歳", "161cm", "B型"], posts: [] },
  { id: 101, therapistName: "笹木まり", "tags: ["33歳", "153cm", "A型"], posts: [] },
  { id: 102, therapistName: "滝口ありさ", "tags: ["35歳", "163cm", "A型"], posts: [] },
  { id: 103, therapistName: "竹石しおり", "tags: ["30歳", "163cm", "A型"], posts: [] },
  { id: 104, therapistName: "平井まお", "tags: ["32歳", "165cm", "B型"], posts: [] },
  { id: 105, therapistName: "白雪ゆま", "tags: ["30歳", "158cm", "A型"], posts: [] },
  { id: 106, therapistName: "相川りん", "tags: ["41歳", "164cm", "A型"], posts: [] },
  { id: 107, therapistName: "真田ゆあ", "tags: ["30歳", "154cm", "A型"], posts: [] },
  { id: 108, therapistName: "浅野りほ", "tags: ["30歳", "165cm", "B型"], posts: [] },
  { id: 109, therapistName: "真嶋りな", "tags: ["32歳", "155cm", "B型"], posts: [] },
  { id: 110, therapistName: "橘みさと", "tags: ["33歳", "150cm", "A型"], posts: [] },
  { id: 111, therapistName: "近藤えま", "tags: ["30歳", "164cm", "A型"], posts: [] },
  { id: 112, therapistName: "愛沢こう", "tags: ["30歳", "164cm", "A型"], posts: [] },
  { id: 113, therapistName: "寺崎ひより", "tags: ["34歳", "158cm", "A型"], posts: [] },
  { id: 114, therapistName: "麻生なな", "tags: ["40歳", "167cm", "O型"], posts: [] },
  { id: 115, therapistName: "広瀬みなみ", "tags: ["31歳", "158cm", "B型"], posts: [] },
  { id: 116, therapistName: "白咲ねね", "tags: ["34歳", "158cm", "O型"], posts: [] },
  { id: 117, therapistName: "高岡ゆき", "tags: ["39歳", "164cm", "O型"], posts: [] },
  { id: 118, therapistName: "福原あいみ", "tags: ["33歳", "166cm", "O型"], posts: [] },
  { id: 119, therapistName: "加美野きい", "tags: ["33歳", "159cm", "A型"], posts: [] },
  { id: 120, therapistName: "高倉みゆう", "tags: ["30歳", "168cm", "O型"], posts: [] },
  { id: 121, therapistName: "杉本らん", "tags: ["34歳", "170cm", "O型"], posts: [] },
  { id: 122, therapistName: "石井さな", "tags: ["32歳", "167cm", "B型"], posts: [] },
  { id: 123, therapistName: "綾野にいな", "tags: ["34歳", "160cm", "AB型"], posts: [] },
  { id: 124, therapistName: "野本りの", "tags: ["30歳", "167cm", "O型"], posts: [] },
  { id: 125, therapistName: "百瀬つきの", "tags: ["30歳", "157cm", "O型"], posts: [] },
  { id: 126, therapistName: "椿ゆりな", "tags: ["33歳", "160cm", "A型"], posts: [] },
  { id: 127, therapistName: "赤坂みのり", "tags: ["33歳", "176cm", "O型"], posts: [] },
  { id: 128, therapistName: "岸れいか", "tags: ["35歳", "156cm", "A型"], posts: [] },
  { id: 129, therapistName: "川原あやの", "tags: ["43歳", "170cm", "O型"], posts: [] },
  { id: 130, therapistName: "鶴城ななえ", "tags: ["30歳", "163cm", "A型"], posts: [] },
  { id: 131, therapistName: "竹内さゆり", "tags: ["45歳", "165cm", "AB型"], posts: [] },
  { id: 132, therapistName: "長富ともみ", "tags: ["35歳", "163cm", "O型"], posts: [] },
  { id: 133, therapistName: "香川なつき", "tags: ["30歳", "162cm", "A型"], posts: [] },
  { id: 134, therapistName: "瀬名みゆ", "tags: ["33歳", "163cm", "B型"], posts: [] },
  { id: 135, therapistName: "藤崎りこ", "tags: ["38歳", "155cm", "AB型"], posts: [] },
  { id: 136, therapistName: "西山みく", "tags: ["34歳", "158cm", "O型"], posts: [] },
  { id: 137, therapistName: "北川ゆうか", "tags: ["35歳", "165cm", "O型"], posts: [] },
  { id: 138, therapistName: "梨本めい", "tags: ["31歳", "161cm", "A型"], posts: [] },
  { id: 139, therapistName: "乙葉めぐみ", "tags: ["31歳", "165cm", "A型"], posts: [] },
  { id: 140, therapistName: "水沢さおり", "tags: ["36歳", "170cm", "O型"], posts: [] },
  { id: 141, therapistName: "栗山さくら", "tags: ["36歳", "154cm", "B型"], posts: [] },
  { id: 142, therapistName: "美月まいか", "tags: ["30歳", "166cm", "O型"], posts: [] },
  { id: 143, therapistName: "向井ひなた", "tags: ["40歳", "163cm", "A型"], posts: [] },
  { id: 144, therapistName: "奥山いちか", "tags: ["30歳", "157cm", "O型"], posts: [] },
  { id: 145, therapistName: "吉永まゆ", "tags: ["31歳", "158cm", "O型"], posts: [] },
  { id: 146, therapistName: "宝生しおん", "tags: ["37歳", "160cm", "O型"], posts: [] },
  { id: 147, therapistName: "春乃はな", "tags: ["42歳", "158cm", "A型"], posts: [] },
  { id: 148, therapistName: "香月りさ", "tags: ["38歳", "164cm", "B型"], posts: [] },
  { id: 149, therapistName: "松沢しの", "tags: ["37歳", "159cm", "AB型"], posts: [] },
  { id: 150, therapistName: "安仁屋うみ", "tags: ["39歳", "170cm", "B型"], posts: [] },
  { id: 151, therapistName: "白井りお", "tags: ["33歳", "165cm", "A型"], posts: [] },
  { id: 152, therapistName: "佐野つぐみ", "tags: ["37歳", "167cm", "A型"], posts: [] },
  { id: 153, therapistName: "高田みか", "tags: ["35歳", "158cm", "A型"], posts: [] },
  { id: 154, therapistName: "蒼井まや", "tags: ["31歳", "162cm", "O型"], posts: [] },
  { id: 155, therapistName: "麻実れお", "tags: ["33歳", "157cm", "A型"], posts: [] },
  { id: 156, therapistName: "川瀬しほ", "tags: ["33歳", "155cm", "A型"], posts: [] },
  { id: 157, therapistName: "望月まりあ", "tags: ["33歳", "160cm", "A型"], posts: [] },
  { id: 158, therapistName: "二宮かえで", "tags: ["30歳", "163cm", "A型"], posts: [] },
  { id: 159, therapistName: "高畠りかこ", "tags: ["33歳", "163cm", "B型"], posts: [] },
  { id: 160, therapistName: "森下ちとせ", "tags: ["35歳", "161cm", "A型"], posts: [] },
  { id: 161, therapistName: "北条りいさ", "tags: ["34歳", "167cm", "O型"], posts: [] },
  { id: 162, therapistName: "結城まい", "tags: ["30歳", "164cm", "A型"], posts: [] },
  { id: 163, therapistName: "高梨あやか", "tags: ["30歳", "160cm", "A型"], posts: [] },
  { id: 164, therapistName: "水谷あいり", "tags: ["30歳", "166cm", "A型"], posts: [] },
  { id: 165, therapistName: "青木たかこ", "tags: ["40歳", "167cm", "O型"], posts: [] },
  { id: 166, therapistName: "新美みな", "tags: ["30歳", "155cm", "B型"], posts: [] },
  { id: 167, therapistName: "春畑ゆめか", "tags: ["36歳", "160cm", "B型"], posts: [] },
  { id: 168, therapistName: "瀬戸みなみ", "tags: ["41歳", "161cm", "B型"], posts: [] },
  { id: 169, therapistName: "藤木れい", "tags: ["38歳", "160cm", "B型"], posts: [] },
  { id: 170, therapistName: "小山ゆわ", "tags: ["31歳", "159cm", "O型"], posts: [] },
  { id: 171, therapistName: "黒田ゆいか", "tags: ["36歳", "157cm", "A型"], posts: [] },
  { id: 172, therapistName: "白川ゆいこ", "tags: ["31歳", "160cm", "B型"], posts: [] },
  { id: 173, therapistName: "柏木ゆう", "tags: ["40歳", "160cm", "A型"], posts: [] },
  { id: 174, therapistName: "藤ちなつ", "tags: ["33歳", "160cm", "O型"], posts: [] },
  { id: 175, therapistName: "南あや", "tags: ["31歳", "163cm", "A型"], posts: [] },
  { id: 176, therapistName: "風間さら", "tags: ["43歳", "167cm", "B型"], posts: [] },
  { id: 177, therapistName: "酒井れな", "tags: ["33歳", "158cm", "O型"], posts: [] }
];

// ==========================================
// 2. 作成する店舗の設定
// ==========================================
const targets = [
    {
        path: 'public/data/tokyo/minato/azabujuban/linda_spa.json',
        id: 5001,
        city: '麻布十番',
        address: '東京都港区麻布十番 (最寄: 麻布十番駅)',
        shopName: 'Aroma Blossom (麻布十番店)'
    },
    {
        path: 'public/data/tokyo/meguro/nakameguro/linda_spa.json',
        id: 5002,
        city: '中目黒',
        address: '東京都目黒区上目黒 (最寄: 中目黒駅)',
        shopName: 'Aroma Blossom (中目黒店)'
    },
    {
        path: 'public/data/tokyo/shibuya/ebisu/linda_spa.json',
        id: 5003,
        city: '恵比寿',
        address: '東京都渋谷区恵比寿 (最寄: 恵比寿駅)',
        shopName: 'Aroma Blossom (恵比寿店)'
    },
    {
        path: 'public/data/tokyo/shinagawa/meguro/linda_spa.json',
        id: 5004,
        city: '目黒',
        address: '東京都品川区上大崎 (最寄: 目黒駅)',
        shopName: 'Aroma Blossom (目黒店)'
    },
    {
        path: 'public/data/tokyo/setagaya/sangenjaya/linda_spa.json',
        id: 5005,
        city: '三軒茶屋',
        address: '東京都世田谷区三軒茶屋 (最寄: 三軒茶屋駅)',
        shopName: 'Aroma Blossom (三軒茶屋店)'
    },
    {
        path: 'public/data/tokyo/minato/hiroo/aroma_blossom.json',
        id: 609,
        city: '広尾',
        address: '東京都港区南麻布 (最寄: 広尾駅)',
        shopName: 'Aroma Blossom (広尾店)'
    },
    {
        path: 'public/data/tokyo/minato/tamachi/aroma_blossom.json',
        id: 607,
        city: '田町',
        address: '東京都港区芝 (最寄: 田町駅・浜松町駅)',
        shopName: 'Aroma Blossom (田町店)'
    },
    {
        path: 'public/data/tokyo/shibuya/hiroo/aroma_blossom.json',
        id: 609,
        city: '広尾',
        address: '東京都渋谷区広尾 (最寄: 広尾駅)',
        shopName: 'Aroma Blossom (広尾店)'
    },
    // 他の店舗も同様に【】無しで記述
    {
        path: 'public/data/tokyo/shinagawa/osaki/aroma_blossom.json',
        id: 603,
        city: '大崎',
        address: '東京都品川区大崎',
        shopName: 'Aroma Blossom (大崎店)'
    },
    {
        path: 'public/data/tokyo/arakawa/nippori/aroma_blossom.json',
        id: 604,
        city: '日暮里',
        address: '東京都荒川区西日暮里',
        shopName: 'Aroma Blossom (日暮里店)'
    },
    {
        path: 'public/data/kanagawa/yokohama/shinyokohama/aroma_blossom.json',
        id: 605,
        city: '新横浜',
        address: '神奈川県横浜市港北区',
        shopName: 'Aroma Blossom (新横浜店)'
    }
];

// ==========================================
// 3. 実行処理
// ==========================================
console.log("🚀 データ作成を開始します...");

targets.forEach(target => {
    const fullPath = path.resolve(process.cwd(), target.path);
    const dir = path.dirname(fullPath);

    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 フォルダ作成: ${dir}`);
        }

        const uniqueThreads = allThreads.map((t, index) => ({
            ...t,
            id: Number(`${target.id}${String(index + 1).padStart(3, '0')}`),
            averageRating: 0,
            postCount: 0,
            averageDetailedRatings: {},
        }));

        const shopData = [{
            id: target.id,
            name: target.shopName,
            prefecture: target.path.includes('kanagawa') ? '神奈川県' : '東京都',
            city: target.city,
            region: '関東エリア',
            address: target.address,
            image: "/images/shops/aroma_blossom.jpg", // 画像パスはLINDA SPAもAroma Blossomも同じ画像を使っていますが、必要に応じて変更可
            rating: 4.5,
            reviewCount: 0,
            price: "90分 18,000円～",
            hours: "11:00～翌5:00 (受付 10:00～翌3:00)",
            isPremium: false,
            color: "from-pink-400 to-rose-600",
            tags: ["初回特典あり", "完全個室", "深夜営業"],
            websiteUrl: "http://linda-spa.com/",
            threads: uniqueThreads
        }];

        fs.writeFileSync(fullPath, JSON.stringify(shopData, null, 2), 'utf8');
        console.log(`✅ 作成完了: ${target.city} (${uniqueThreads.length}名)`);

    } catch (error) {
        console.error(`❌ エラー (${target.city}):`, error);
    }
});

console.log("🎉 全ファイルの作成が完了しました。サーバーを再起動してください。");