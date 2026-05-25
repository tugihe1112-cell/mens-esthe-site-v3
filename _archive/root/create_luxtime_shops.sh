#!/bin/bash

# 基本情報
BASE_ID=60371
THERAPISTS_JSON='[
  {"id": "ibuki-remu", "name": "伊吹れむ", "age": 23, "height": 170, "bust": 82, "cup": "B", "waist": 54, "hip": 83},
  {"id": "shirousagi-yurano", "name": "白兎ゆらの", "age": 20, "height": 153, "bust": 83, "cup": "C", "waist": 55, "hip": 82},
  {"id": "murase-toa", "name": "村瀬とあ", "age": 23, "height": 153, "bust": 82, "cup": "B", "waist": 54, "hip": 80},
  {"id": "kinami-chika", "name": "木南ちか", "age": 19, "height": 160, "bust": 99, "cup": "H", "waist": 56, "hip": 85},
  {"id": "toyama-hime", "name": "遠山ひめ", "age": 23, "height": 155, "bust": 88, "cup": "F", "waist": 54, "hip": 83},
  {"id": "sakamoto-rara", "name": "坂本らら", "age": 20, "height": 164, "bust": 88, "cup": "F", "waist": 57, "hip": 85},
  {"id": "yamamoto-nana", "name": "山本なな", "age": 26, "height": 160, "bust": 89, "cup": "F", "waist": 56, "hip": 85},
  {"id": "akiba-sakura", "name": "秋葉さくら", "age": 27, "height": 164, "bust": 83, "cup": "C", "waist": 55, "hip": 80},
  {"id": "hitomi-mirai", "name": "瞳みらい", "age": 23, "height": 156, "bust": 83, "cup": "C", "waist": 54, "hip": 84},
  {"id": "momoi-niko", "name": "桃井にこ", "age": 20, "height": 170, "bust": 83, "cup": "C", "waist": 53, "hip": 82},
  {"id": "amamiya-rumi", "name": "雨宮るみ", "age": 22, "height": 155, "bust": 85, "cup": "D", "waist": 55, "hip": 85},
  {"id": "haruna-oboro", "name": "春奈おぼろ", "age": 21, "height": 163, "bust": 82, "cup": "B", "waist": 54, "hip": 81},
  {"id": "shirahama-rino", "name": "白浜りの", "age": 20, "height": 165, "bust": 99, "cup": "G", "waist": 56, "hip": 86},
  {"id": "narimiya-rin", "name": "成宮りん", "age": 20, "height": 160, "bust": 86, "cup": "E", "waist": 55, "hip": 84},
  {"id": "yuzuhara-moe", "name": "柚原もえ", "age": 23, "height": 153, "bust": 83, "cup": "C", "waist": 55, "hip": 84},
  {"id": "hanai-nagi", "name": "花井なぎ", "age": 26, "height": 160, "bust": 85, "cup": "D", "waist": 56, "hip": 86},
  {"id": "inugami-azuki", "name": "犬神あずき", "age": 25, "height": 148, "bust": 90, "cup": "F", "waist": 56, "hip": 85},
  {"id": "mizukawa-marin", "name": "水川まりん", "age": 26, "height": 160, "bust": 83, "cup": "C", "waist": 58, "hip": 86},
  {"id": "hasumi-fuuri", "name": "蓮水ふうり", "age": 23, "height": 163, "bust": 89, "cup": "F", "waist": 56, "hip": 84},
  {"id": "mukouzaka-mina", "name": "向坂みな", "age": 21, "height": 162, "bust": 88, "cup": "F", "waist": 57, "hip": 86},
  {"id": "suzukawa-koharu", "name": "鈴川こはる", "age": 21, "height": 153, "bust": 86, "cup": "E", "waist": 56, "hip": 84},
  {"id": "mochizuki-miku", "name": "望月みく", "age": 24, "height": 156, "bust": 86, "cup": "D", "waist": 56, "hip": 84},
  {"id": "takeuchi-nanao", "name": "竹内ななお", "age": 28, "height": 163, "bust": 83, "cup": "C", "waist": 56, "hip": 82},
  {"id": "kishi-nonoka", "name": "岸ののか", "age": 25, "height": 165, "bust": 83, "cup": "B", "waist": 53, "hip": 82},
  {"id": "nakagawa-ritsu", "name": "中川りつ", "age": 20, "height": 155, "bust": 88, "cup": "E", "waist": 57, "hip": 86},
  {"id": "takase-airi", "name": "高瀬あいり", "age": 22, "height": 163, "bust": 83, "cup": "C", "waist": 55, "hip": 84},
  {"id": "yuuki-mana", "name": "結城まな", "age": 23, "height": 160, "bust": 84, "cup": "D", "waist": 55, "hip": 83},
  {"id": "tsubakiya-chifuyu", "name": "椿谷ちふゆ", "age": 19, "height": 155, "bust": 84, "cup": "D", "waist": 55, "hip": 86},
  {"id": "arisu-noa", "name": "有栖のあ", "age": 24, "height": 148, "bust": 88, "cup": "E", "waist": 56, "hip": 84},
  {"id": "mogami-ayano", "name": "最上あやの", "age": 22, "height": 162, "bust": 84, "cup": "D", "waist": 56, "hip": 81},
  {"id": "himeno-chifuyu", "name": "姫野ちふゆ", "age": 18, "height": 157, "bust": 83, "cup": "C", "waist": 56, "hip": 84},
  {"id": "uehara-rei", "name": "上原れい", "age": 23, "height": 153, "bust": 83, "cup": "C", "waist": 56, "hip": 80},
  {"id": "tokita-madoka", "name": "常田まどか", "age": 21, "height": 168, "bust": 85, "cup": "D", "waist": 57, "hip": 86},
  {"id": "tsukimi-iori", "name": "月見いおり", "age": 22, "height": 156, "bust": 83, "cup": "C", "waist": 56, "hip": 81},
  {"id": "seina-yuuna", "name": "星奈ゆうな", "age": 20, "height": 156, "bust": 84, "cup": "D", "waist": 56, "hip": 81},
  {"id": "kugimiya-yuuka", "name": "釘宮ゆうか", "age": 24, "height": 148, "bust": 85, "cup": "D", "waist": 57, "hip": 83},
  {"id": "sanada-megumi", "name": "真田めぐみ", "age": 21, "height": 161, "bust": 83, "cup": "C", "waist": 56, "hip": 81},
  {"id": "tendo-shizuku", "name": "天道しずく", "age": 24, "height": 155, "bust": 84, "cup": "D", "waist": 56, "hip": 81},
  {"id": "kuramoto-kaho", "name": "倉本かほ", "age": 21, "height": 151, "bust": 83, "cup": "B", "waist": 56, "hip": 84},
  {"id": "katsuragi-erena", "name": "葛城えれな", "age": 19, "height": 151, "bust": 80, "cup": "B", "waist": 55, "hip": 80},
  {"id": "kagura-fuuka", "name": "神楽ふうか", "age": 26, "height": 170, "bust": 86, "cup": "E", "waist": 54, "hip": 84},
  {"id": "hayami-sena", "name": "速水せな", "age": 27, "height": 158, "bust": 87, "cup": "E", "waist": 56, "hip": 84},
  {"id": "yui-tsukika", "name": "由井つきか", "age": 21, "height": 165, "bust": 85, "cup": "E", "waist": 56, "hip": 85},
  {"id": "morimiya-mizuki", "name": "森宮みずき", "age": 22, "height": 155, "bust": 86, "cup": "E", "waist": 57, "hip": 86},
  {"id": "sakizono-mami", "name": "崎園まみ", "age": 21, "height": 151, "bust": 86, "cup": "E", "waist": 58, "hip": 84},
  {"id": "yukimi-kazuha", "name": "雪見かずは", "age": 26, "height": 155, "bust": 83, "cup": "C", "waist": 56, "hip": 80},
  {"id": "amano-rio", "name": "天乃りお", "age": 21, "height": 153, "bust": 84, "cup": "D", "waist": 57, "hip": 85},
  {"id": "momose-hiyori", "name": "桃瀬ひより", "age": 25, "height": 155, "bust": 86, "cup": "D", "waist": 54, "hip": 87},
  {"id": "fuyutsuki-misato", "name": "冬月みさと", "age": 25, "height": 165, "bust": 84, "cup": "C", "waist": 53, "hip": 85},
  {"id": "morii-fuyu", "name": "森井ふゆ", "age": 26, "height": 155, "bust": 84, "cup": "C", "waist": 54, "hip": 85},
  {"id": "yukimura-suzu", "name": "雪村すず", "age": 25, "height": 167, "bust": 84, "cup": "D", "waist": 55, "hip": 86},
  {"id": "kagami-eren", "name": "加賀美えれん", "age": 25, "height": 165, "bust": 86, "cup": "D", "waist": 54, "hip": 85},
  {"id": "hoshino-nanako", "name": "星野ななこ", "age": 27, "height": 149, "bust": 85, "cup": "C", "waist": 54, "hip": 85},
  {"id": "onodera-kayano", "name": "小野寺かやの", "age": 20, "height": 160, "bust": 85, "cup": "D", "waist": 54, "hip": 82},
  {"id": "miyasaka-ran", "name": "宮坂らん", "age": 28, "height": 157, "bust": 84, "cup": "D", "waist": 56, "hip": 83},
  {"id": "akiyama-serika", "name": "秋山せりか", "age": 25, "height": 155, "bust": 88, "cup": "E", "waist": 54, "hip": 85},
  {"id": "umino-sora", "name": "海野そら", "age": 28, "height": 159, "bust": 95, "cup": "H", "waist": 58, "hip": 86},
  {"id": "asai-riko", "name": "浅井りこ", "age": 26, "height": 160, "bust": 98, "cup": "H", "waist": 58, "hip": 86},
  {"id": "sekikawa-chie", "name": "関川ちえ", "age": 27, "height": 168, "bust": 85, "cup": "E", "waist": 57, "hip": 85},
  {"id": "shirasaka-yuina", "name": "白坂ゆいな", "age": 24, "height": 149, "bust": 90, "cup": "F", "waist": 57, "hip": 88},
  {"id": "sano-homare", "name": "佐野ほまれ", "age": 21, "height": 158, "bust": 86, "cup": "F", "waist": 57, "hip": 86},
  {"id": "ichijo-serina", "name": "一条せりな", "age": 22, "height": 150, "bust": 86, "cup": "E", "waist": 54, "hip": 78},
  {"id": "mizumoto-remi", "name": "水本れみ", "age": 24, "height": 158, "bust": 85, "cup": "E", "waist": 56, "hip": 85},
  {"id": "himemura-sachi", "name": "姫村さち", "age": 24, "height": 162, "bust": 85, "cup": "C", "waist": 56, "hip": 84},
  {"id": "niizuma-riri", "name": "新妻りり", "age": 28, "height": 155, "bust": 95, "cup": "H", "waist": 57, "hip": 84},
  {"id": "mizusawa-marina", "name": "水澤まりな", "age": 28, "height": 155, "bust": 84, "cup": "D", "waist": 56, "hip": 84},
  {"id": "momota-soyoka", "name": "百田そよか", "age": 25, "height": 162, "bust": 87, "cup": "E", "waist": 58, "hip": 85},
  {"id": "kaido-chinatsu", "name": "海堂ちなつ", "age": 24, "height": 165, "bust": 89, "cup": "F", "waist": 54, "hip": 84},
  {"id": "yagami-kanna", "name": "夜神かんな", "age": 27, "height": 160, "bust": 94, "cup": "H", "waist": 57, "hip": 85},
  {"id": "nanasei-uta", "name": "七星うた", "age": 22, "height": 155, "bust": 95, "cup": "G", "waist": 55, "hip": 86},
  {"id": "misumi-kanade", "name": "美澄かなで", "age": 28, "height": 158, "bust": 86, "cup": "E", "waist": 56, "hip": 85},
  {"id": "yozora-mizuki", "name": "夜空みづき", "age": 24, "height": 147, "bust": 86, "cup": "D", "waist": 55, "hip": 83},
  {"id": "ichinose-akari", "name": "一ノ瀬あかり", "age": 19, "height": 150, "bust": 95, "cup": "G", "waist": 56, "hip": 84},
  {"id": "masuda-nene", "name": "増田ねね", "age": 23, "height": 160, "bust": 86, "cup": "E", "waist": 55, "hip": 85},
  {"id": "mizuhara-kiko", "name": "水原きこ", "age": 25, "height": 161, "bust": 82, "cup": "B", "waist": 54, "hip": 84},
  {"id": "ikeda-reina", "name": "池田レイナ", "age": 24, "height": 153, "bust": 86, "cup": "E", "waist": 56, "hip": 87},
  {"id": "souda-aoha", "name": "宗田あおは", "age": 28, "height": 160, "bust": 93, "cup": "H", "waist": 58, "hip": 87},
  {"id": "misaki-kanon", "name": "美咲かのん", "age": 28, "height": 153, "bust": 85, "cup": "D", "waist": 57, "hip": 84},
  {"id": "setoguchi-mio", "name": "瀬戸口みお", "age": 22, "height": 153, "bust": 86, "cup": "E", "waist": 54, "hip": 85},
  {"id": "kiritani-minori", "name": "桐谷みのり", "age": 26, "height": 160, "bust": 84, "cup": "D", "waist": 56, "hip": 87},
  {"id": "mashiro-kotoha", "name": "真白ことは", "age": 23, "height": 155, "bust": 85, "cup": "D", "waist": 57, "hip": 85},
  {"id": "akimoto-meimi", "name": "秋元めいみ", "age": 22, "height": 157, "bust": 85, "cup": "E", "waist": 57, "hip": 83},
  {"id": "ando-rena", "name": "安藤れな", "age": 28, "height": 164, "bust": 82, "cup": "B", "waist": 54, "hip": 85},
  {"id": "toyama-kanae", "name": "遠山かなえ", "age": 26, "height": 162, "bust": 95, "cup": "H", "waist": 56, "hip": 85},
  {"id": "nakano-mei", "name": "中野めい", "age": 28, "height": 157, "bust": 86, "cup": "F", "waist": 54, "hip": 84},
  {"id": "fukami-reona", "name": "深見れおな", "age": 24, "height": 168, "bust": 99, "cup": "H", "waist": 58, "hip": 88},
  {"id": "miura-kotone", "name": "三浦ことね", "age": 21, "height": 156, "bust": 86, "cup": "D", "waist": 56, "hip": 84},
  {"id": "natsukawa-mao", "name": "夏川まお", "age": 21, "height": 155, "bust": 82, "cup": "B", "waist": 54, "hip": 83},
  {"id": "aonuma-mei", "name": "青沼めい", "age": 24, "height": 170, "bust": 83, "cup": "C", "waist": 54, "hip": 84},
  {"id": "usami-yukino", "name": "宇佐美ゆきの", "age": 19, "height": 156, "bust": 87, "cup": "E", "waist": 56, "hip": 84},
  {"id": "suzuki-makina", "name": "鈴木まきな", "age": 26, "height": 158, "bust": 86, "cup": "E", "waist": 54, "hip": 83},
  {"id": "sakurai-ayami", "name": "桜井あやみ", "age": 19, "height": 152, "bust": 86, "cup": "E", "waist": 58, "hip": 83},
  {"id": "hoshikawa-ai", "name": "星川あい", "age": 26, "height": 169, "bust": 88, "cup": "E", "waist": 59, "hip": 87},
  {"id": "hanamura-ichika", "name": "花村いちか", "age": 20, "height": 160, "bust": 89, "cup": "F", "waist": 55, "hip": 86},
  {"id": "kudo-neru", "name": "工藤ねる", "age": 22, "height": 150, "bust": 84, "cup": "D", "waist": 54, "hip": 82},
  {"id": "matsuyuki-rui", "name": "松雪るい", "age": 27, "height": 153, "bust": 87, "cup": "E", "waist": 56, "hip": 85},
  {"id": "kurokawa-nonoha", "name": "黒川ののは", "age": 21, "height": 158, "bust": 83, "cup": "C", "waist": 56, "hip": 83},
  {"id": "sawaki-momo", "name": "沢城もも", "age": 23, "height": 160, "bust": 86, "cup": "D", "waist": 55, "hip": 84},
  {"id": "endo-azusa", "name": "遠藤あずさ", "age": 26, "height": 155, "bust": 82, "cup": "B", "waist": 53, "hip": 83},
  {"id": "hirano-saki", "name": "平野さき", "age": 28, "height": 155, "bust": 84, "cup": "D", "waist": 55, "hip": 86},
  {"id": "wakamiya-nao", "name": "若宮なお", "age": 24, "height": 150, "bust": 85, "cup": "D", "waist": 54, "hip": 83},
  {"id": "mitani-haru", "name": "美谷はる", "age": 26, "height": 166, "bust": 84, "cup": "D", "waist": 55, "hip": 83},
  {"id": "murakami-miyu", "name": "村上みゆ", "age": 27, "height": 162, "bust": 88, "cup": "F", "waist": 57, "hip": 87},
  {"id": "karasawa-miwa", "name": "唐沢みわ", "age": 26, "height": 156, "bust": 83, "cup": "C", "waist": 56, "hip": 81},
  {"id": "tenshi-meru", "name": "天使める", "age": 22, "height": 158, "bust": 87, "cup": "E", "waist": 57, "hip": 84},
  {"id": "tachibana-yuria", "name": "橘ゆりあ", "age": 22, "height": 154, "bust": 99, "cup": "H", "waist": 54, "hip": 86},
  {"id": "kurosaki-yua", "name": "黒崎ゆあ", "age": 24, "height": 150, "bust": 84, "cup": "D", "waist": 56, "hip": 81},
  {"id": "hanasaki-himari", "name": "花咲ひまり", "age": 26, "height": 155, "bust": 90, "cup": "F", "waist": 55, "hip": 84},
  {"id": "sakuma-yuri", "name": "佐久間ゆり", "age": 28, "height": 155, "bust": 87, "cup": "F", "waist": 57, "hip": 86},
  {"id": "miyamoto-tsumugi", "name": "宮本つむぎ", "age": 20, "height": 164, "bust": 87, "cup": "F", "waist": 58, "hip": 86},
  {"id": "kimura-koyuki", "name": "木村こゆき", "age": 24, "height": 165, "bust": 83, "cup": "C", "waist": 56, "hip": 81},
  {"id": "yura-nono", "name": "由良のの", "age": 25, "height": 150, "bust": 86, "cup": "D", "waist": 55, "hip": 84}
]'

# 店舗情報配列
declare -A SHOPS
SHOPS[kanda]="神田:chiyoda:kanda:神田駅、秋葉原駅、錦糸町駅、銀座一丁目駅、新橋駅、五反田駅、池袋駅、東京区内"
SHOPS[ginza]="銀座:chuo:ginza:神田駅、秋葉原駅、錦糸町駅、銀座一丁目駅、新橋駅、五反田駅、池袋駅、東京区内"
SHOPS[shimbashi]="新橋:minato:shimbashi:神田駅、秋葉原駅、錦糸町駅、銀座一丁目駅、新橋駅、五反田駅、池袋駅、東京区内"
SHOPS[gotanda]="五反田:shinagawa:gotanda:神田駅、秋葉原駅、錦糸町駅、銀座一丁目駅、新橋駅、五反田駅、池袋駅、東京区内"
SHOPS[ikebukuro]="池袋:toshima:ikebukuro:神田駅、秋葉原駅、錦糸町駅、銀座一丁目駅、新橋駅、五反田駅、池袋駅、東京区内"
SHOPS[kinshicho]="錦糸町:sumida:kinshicho:神田駅、秋葉原駅、錦糸町駅、銀座一丁目駅、新橋駅、五反田駅、池袋駅、東京区内"
SHOPS[akihabara]="秋葉原:chiyoda:akihabara:神田駅、秋葉原駅、錦糸町駅、銀座一丁目駅、新橋駅、五反田駅、池袋駅、東京区内"

SHOP_ID=$BASE_ID

for area_key in kanda ginza shimbashi gotanda ikebukuro kinshicho akihabara; do
  IFS=':' read -r area_jp ward area_en station <<< "${SHOPS[$area_key]}"
  
  echo "Creating: $area_jp (ID: $SHOP_ID)"
  
  # セラピストIDにプレフィックスを追加
  THERAPISTS_WITH_PREFIX=$(echo "$THERAPISTS_JSON" | jq --arg prefix "$SHOP_ID-" 'map(.id = ($prefix + .id))')
  
  # JSONファイル作成
  cat > "public/data/tokyo/$ward/$area_en/luxtime_${area_en}.json" << JSONEOF
{
  "id": $SHOP_ID,
  "name": "Lux Time (ラグタイム)",
  "prefecture": "東京都",
  "city": "$(case $ward in
    chiyoda) echo "千代田区";;
    chuo) echo "中央区";;
    minato) echo "港区";;
    shinagawa) echo "品川区";;
    toshima) echo "豊島区";;
    sumida) echo "墨田区";;
  esac)",
  "area": "$area_jp",
  "address": "東京都内各エリア（$area_jp）",
  "image": "/images/shops/no_image.jpg",
  "rating": 0,
  "reviewCount": 0,
  "price": "90分18,000円～",
  "hours": "11:00～5:00",
  "isPremium": false,
  "tags": ["日本人", "一般ルーム", "出張", "初回特典", "カード払いOK", "深夜営業"],
  "websiteUrl": "https://www.mensesthe-luxtime.jp/",
  "nearestStation": "$station",
  "description": "60分14,000円 / 90分18,000円 / 120分23,000円 / 150分29,000円 / 180分35,000円 / オールあおむけコース70分20,000円 / 延長30分8,000円",
  "threads": [],
  "therapists": $THERAPISTS_WITH_PREFIX
}
JSONEOF

  SHOP_ID=$((SHOP_ID + 1))
done

echo "✅ 7店舗のJSONファイル作成完了"
