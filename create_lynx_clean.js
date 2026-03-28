const fs = require('fs');
const path = require('path');

// ==========================================
// 1. 設定：店舗情報と保存先（全13店舗）
// ==========================================
const shops = [
  { id: 990, name: "Lynx池袋店", dir: "public/data/tokyo/toshima/ikebukuro" },
  { id: 991, name: "Lynx新宿店", dir: "public/data/tokyo/shinjuku/shinjuku" },
  { id: 992, name: "Lynx高田馬場店", dir: "public/data/tokyo/shinjuku/takadanobaba" },
  { id: 993, name: "Lynx秋葉原店", dir: "public/data/tokyo/chiyoda/akihabara" },
  { id: 994, name: "Lynx五反田店", dir: "public/data/tokyo/shinagawa/gotanda" },
  { id: 995, name: "Lynx赤羽店", dir: "public/data/tokyo/kita/akabane" },
  { id: 996, name: "Lynx大宮店", dir: "public/data/saitama/saitama/omiya" },
  { id: 997, name: "Lynx川口店", dir: "public/data/saitama/kawaguchi/kawaguchi" },
  { id: 998, name: "Lynx松戸店", dir: "public/data/chiba/matsudo/matsudo" },
  { id: 999, name: "Lynx船橋店", dir: "public/data/chiba/funabashi/funabashi" },
  { id: 1000, name: "Lynx西船橋店", dir: "public/data/chiba/funabashi/nishifunabashi" },
  { id: 1001, name: "Lynx千葉店", dir: "public/data/chiba/chiba/chiba" },
  { id: 1002, name: "Lynx横浜関内店", dir: "public/data/kanagawa/yokohama/kannai" }
];

// ==========================================
// 2. 設定：店舗共通タグ（サービス内容）
// ==========================================
const shopTags = [
  "初回特典あり",
  "カード払いOK",
  "完全個室",
  "深夜営業",
  "QR決済可"
];

// ==========================================
// 3. データ：セラピスト生データ（最新版）
// ==========================================
const rawText = `
Name. 峯岸みらの
Age. 25歳 / height. 163cm
B.87cm(E)W.56cmH.84cm

Name. 雪野ねむ
Age. 19歳 / height. 156cm
B.88cm(F)W.54cmH.85cm

Name. 神田このみ
Age. 22歳 / height. 164cm
B.83cm(C)W.57cmH.82cm

Name. 星川つむぎ
Age. 24歳 / height. 148cm
B.90cm(G)W.57cmH.88cm

Name. 天使れい
Age. 20歳 / height. 159cm
B.86cm(E)W.56cmH.85cm

Name. 花咲あむ
Age. 18歳 / height. 157cm
B.86cm(E)W.56cmH.85cm

Name. 姫崎みに
Age. 19歳 / height. 148cm
B.88cm(F)W.57cmH.86cm

Name. 荒牧りりあ
Age. 18歳 / height. 150cm
B.84cm(C)W.53cmH.82cm

Name. 音羽すず
Age. 19歳 / height. 164cm
B.85cm(D)W.53cmH.83cm

Name. 萌木リリカ
Age. 19歳 / height. 145cm
B.102cm(K)W.60cmH.90cm

Name. 橘れいか
Age. 24歳 / height. 161cm
B.85cm(D)W.55cmH.83cm

Name. 南まき
Age. 21歳 / height. 157cm
B.87cm(E)W.55cmH.84cm

Name. 四乃森せな
Age. 21歳 / height. 168cm
B.85cm(D)W.55cmH.86cm

Name. 中野まいか
Age. 22歳 / height. 158cm
B.94cm(H)W.60cmH.89cm

Name. 有馬みお
Age. 22歳 / height. 163cm
B.86cm(E)W.56cmH.85cm

Name. 星乃宮あいり
Age. 20歳 / height. 157cm
B.94cm(H)W.58cmH.89cm

Name. 鳴海あお
Age. 23歳 / height. 156cm
B.95cm(I)W.58cmH.88cm

Name. 綾波ゆき
Age. 19歳 / height. 163cm
B.94cm(G)W.58cmH.87cm

Name. 永月ことり
Age. 19歳 / height. 158cm
B.93cm(G)W.58cmH.88cm

Name. 福岡みな
Age. 22歳 / height. 152cm
B.86cm(F)W.57cmH.84cm

Name. 結乃ゆの
Age. 21歳 / height. 148cm
B.88cm(E)W.56cmH.86cm

Name. 相見りこ
Age. 27歳 / height. 145cm
B.85cm(D)W.58cmH.84cm

Name. 春原ののん
Age. 23歳 / height. 161cm
B.91cm(G)W.56cmH.88cm

Name. 松本さり
Age. 23歳 / height. 161cm
B.86cm(D)W.58cmH.85cm

Name. 華宮りりな
Age. 20歳 / height. 158cm
B.89cm(F)W.57cmH.85cm

Name. 美咲めい
Age. 21歳 / height. 164cm
B.89cm(F)W.56cmH.88cm

Name. 大久保あい
Age. 20歳 / height. 157cm
B.89cm(F)W.59cmH.86cm

Name. 姫川ユイ
Age. 29歳 / height. 155cm
B.89cm(F)W.56cmH.86cm

Name. 天音かるあ
Age. 25歳 / height. 160cm
B.99cm(I)W.59cmH.90cm

Name. 桃井ひな
Age. 20歳 / height. 154cm
B.85cm(D)W.54cmH.86cm

Name. 柏木みる
Age. 21歳 / height. 160cm
B.85cm(E)W.54cmH.83cm

Name. 早瀬るか
Age. 20歳 / height. 165cm
B.89cm(F)W.58cmH.86cm

Name. 一条ゆりさ
Age. 24歳 / height. 168cm
B.88cm(F)W.57cmH.86cm

Name. 宇野のぞみ
Age. 23歳 / height. 160cm
B.91cm(G)W.59cmH.87cm

Name. 雪乃ちあ
Age. 18歳 / height. 157cm
B.87cm(F)W.57cmH.88cm

Name. 音嶋りな
Age. 22歳 / height. 158cm
B.99cm(H)W.59cmH.88cm

Name. 恋瀬るん
Age. 19歳 / height. 160cm
B.83cm(C)W.54cmH.85cm

Name. 姫乃らむ
Age. 20歳 / height. 153cm
B.88cm(E)W.56cmH.83cm

Name. 藤森はる
Age. 20歳 / height. 153cm
B.89cm(F)W.57cmH.86cm

Name. 中条こころ
Age. 21歳 / height. 158cm
B.90cm(F)W.57cmH.88cm

Name. 大咲まみ
Age. 25歳 / height. 154cm
B.93cm(G)W.59cmH.90cm

Name. 葉月ゆあ
Age. 21歳 / height. 158cm
B.85cm(E)W.57cmH.84cm

Name. 藤原はづき
Age. 23歳 / height. 156cm
B.84cm(D)W.55cmH.86cm

Name. 浅倉こと
Age. 25歳 / height. 156cm
B.88cm(F)W.58cmH.87cm

Name. 暁美ほむら
Age. 20歳 / height. 154cm
B.97cm(H)W.59cmH.87cm

Name. 長岡ゆな
Age. 22歳 / height. 160cm
B.88cm(F)W.57cmH.87cm

Name. 秋山ゆう
Age. 22歳 / height. 155cm
B.86cm(E)W.57cmH.87cm

Name. 小金沢くるす
Age. 21歳 / height. 155cm
B.88cm(F)W.57cmH.86cm

Name. 明日香らら
Age. 22歳 / height. 153cm
B.84cm(C)W.57cmH.85cm

Name. 谷口ひかり
Age. 20歳 / height. 152cm
B.94cm(G)W.62cmH.84cm

Name. 高嶋かれん
Age. 20歳 / height. 166cm
B.86cm(E)W.57cmH.84cm

Name. 音海えな
Age. 22歳 / height. 165cm
B.85cm(D)W.56cmH.86cm

Name. 琥珀りり
Age. 20歳 / height. 154cm
B.85cm(D)W.56cmH.86cm

Name. 花村かなん
Age. 20歳 / height. 155cm
B.85cm(D)W.56cmH.84cm

Name. 有栖ゆずな
Age. 21歳 / height. 155cm
B.91cm(G)W.57cmH.86cm

Name. 花園あかり
Age. 18歳 / height. 153cm
B.88cm(F)W.58cmH.89cm

Name. 愛原いろは
Age. 20歳 / height. 163cm
B.88cm(F)W.59cmH.89cm

Name. 猫塚なつは
Age. 23歳 / height. 150cm
B.88cm(F)W.58cmH.86cm

Name. 海風はんな
Age. 23歳 / height. 162cm
B.85cm(D)W.55cmH.87cm

Name. 神園みゆ
Age. 19歳 / height. 166cm
B.88cm(F)W.57cmH.87cm

Name. 森咲あん
Age. 21歳 / height. 158cm
B.86cm(E)W.54cmH.85cm

Name. 小鳥遊りん
Age. 23歳 / height. 156cm
B.83cm(B)W.56cmH.82cm

Name. 月乃あやか
Age. 24歳 / height. 154cm
B.85cm(D)W.57cmH.84cm

Name. 音無おんぷ
Age. 20歳 / height. 156cm
B.96cm(H)W.59cmH.90cm

Name. 天月なぎ
Age. 23歳 / height. 157cm
B.86cm(D)W.56cmH.84cm

Name. 高橋なぎさ
Age. 18歳 / height. 155cm
B.85cm(D)W.54cmH.87cm

Name. 青羽ひより
Age. 20歳 / height. 166cm
B.85cm(D)W.55cmH.87cm

Name. 桐谷めいな
Age. 22歳 / height. 152cm
B.88cm(E)W.55cmH.86cm

Name. 夢野れな
Age. 24歳 / height. 155cm
B.96cm(I)W.57cmH.89cm

Name. 神楽木らら
Age. 21歳 / height. 163cm
B.88cm(F)W.57cmH.87cm

Name. 相沢あも
Age. 23歳 / height. 152cm
B.102cm(H)W.60cmH.90cm

Name. 花咲もえ
Age. 20歳 / height. 144cm
B.95cm(I)W.55cmH.84cm

Name. 葉月むぎ
Age. 21歳 / height. 155cm
B.87cm(F)W.57cmH.85cm

Name. 宮野さくら
Age. 24歳 / height. 153cm
B.86cm(E)W.58cmH.88cm

Name. 神崎なな
Age. 22歳 / height. 163cm
B.88cm(F)W.55cmH.83cm

Name. 河北なつき
Age. 22歳 / height. 162cm
B.83cm(C)W.56cmH.82cm

Name. 夢咲あむ
Age. 19歳 / height. 157cm
B.85cm(F)W.56cmH.84cm

Name. 志田みみ
Age. 21歳 / height. 158cm
B.84cm(D)W.56cmH.83cm

Name. 堀北ゆいな
Age. 19歳 / height. 153cm
B.86cm(E)W.58cmH.87cm

Name. 白鳥みらい
Age. 20歳 / height. 164cm
B.92cm(G)W.57cmH.85cm

Name. 四宮えな
Age. 20歳 / height. 155cm
B.85cm(D)W.56cmH.87cm

Name. 氷室れいか
Age. 18歳 / height. 165cm
B.82cm(C)W.57cmH.81cm

Name. 星乃みく
Age. 22歳 / height. 154cm
B.83cm(B)W.56cmH.82cm

Name. 夏目ましろ
Age. 25歳 / height. 166cm
B.88cm(F)W.59cmH.87cm

Name. 桜庭あんな
Age. 22歳 / height. 151cm
B.84cm(C)W.56cmH.83cm

Name. 蓮井さき
Age. 22歳 / height. 163cm
B.87cm(E)W.58cmH.86cm

Name. 岩崎せな
Age. 20歳 / height. 157cm
B.86cm(E)W.58cmH.87cm

Name. 内永るい
Age. 20歳 / height. 164cm
B.86cm(E)W.57cmH.87cm

Name. 結木やや
Age. 22歳 / height. 160cm
B.86cm(E)W.57cmH.85cm

Name. 大道寺ともよ
Age. 25歳 / height. 165cm
B.86cm(E)W.58cmH.88cm

Name. 大谷はな
Age. 21歳 / height. 158cm
B.85cm(E)W.57cmH.84cm

Name. 水嶋かんな
Age. 23歳 / height. 155cm
B.84cm(D)W.57cmH.83cm

Name. 佐々木りか
Age. 23歳 / height. 158cm
B.85cm(D)W.57cmH.84cm

Name. 流川しおん
Age. 25歳 / height. 160cm
B.85cm(D)W.58cmH.86cm

Name. 名城さな
Age. 19歳 / height. 170cm
B.86cm(E)W.57cmH.88cm

Name. 桃井ひまり
Age. 22歳 / height. 156cm
B.86cm(E)W.57cmH.85cm

Name. 白咲まあり
Age. 20歳 / height. 150cm
B.86cm(E)W.56cmH.87cm

Name. 上条りこ
Age. 21歳 / height. 155cm
B.88cm(F)W.58cmH.86cm

Name. 真白まみあ
Age. 20歳 / height. 158cm
B.86cm(E)W.57cmH.88cm

Name. 森永ぷりん
Age. 20歳 / height. 168cm
B.103cm(J)W.60cmH.94cm

Name. 羽田さら
Age. 21歳 / height. 161cm
B.85cm(D)W.57cmH.84cm

Name. 伊藤さき
Age. 22歳 / height. 154cm
B.83cm(B)W.54cmH.85cm

Name. 小倉りあ
Age. 20歳 / height. 167cm
B.84cm(D)W.57cmH.83cm

Name. 水原まいか
Age. 20歳 / height. 158cm
B.84cm(D)W.55cmH.83cm

Name. 姫乃つき
Age. 23歳 / height. 155cm
B.87cm(E)W.57cmH.86cm

Name. 京本あんず
Age. 23歳 / height. 165cm
B.84cm(D)W.58cmH.83cm

Name. 白銀ゆりか
Age. 18歳 / height. 162cm
B.94cm(H)W.57cmH.87cm

Name. 杉野ひまわり
Age. 18歳 / height. 157cm
B.85cm(E)W.56cmH.82cm

Name. 森川るか
Age. 21歳 / height. 162cm
B.84cm(D)W.57cmH.83cm

Name. 桃川ことり
Age. 18歳 / height. 156cm
B.83cm(C)W.56cmH.82cm

Name. 月島りと
Age. 21歳 / height. 150cm
B.99cm(I)W.60cmH.89cm

Name. 海瀬るり
Age. 20歳 / height. 163cm
B.84cm(C)W.56cmH.87cm

Name. 月本ゆゆ
Age. 22歳 / height. 157cm
B.88cm(F)W.56cmH.85cm

Name. 愛田りな
Age. 23歳 / height. 145cm
B.85cm(D)W.57cmH.84cm

Name. 椎名りゆ
Age. 21歳 / height. 164cm
B.82cm(C)W.57cmH.81cm

Name. 火野れい
Age. 23歳 / height. 157cm
B.88cm(F)W.55cmH.86cm

Name. 有馬れみ
Age. 22歳 / height. 154cm
B.93cm(G)W.57cmH.88cm

Name. 雪村あまね
Age. 18歳 / height. 160cm
B.84cm(D)W.57cmH.83cm

Name. 姫咲ふゆか
Age. 20歳 / height. 162cm
B.92cm(G)W.58cmH.86cm

Name. 白石ゆいか
Age. 23歳 / height. 150cm
B.83cm(C)W.56cmH.82cm

Name. 一色かのん
Age. 20歳 / height. 155cm
B.84cm(C)W.56cmH.82cm

Name. 猫瀬みり
Age. 20歳 / height. 150cm
B.85cm(D)W.57cmH.84cm

Name. 椿りの
Age. 23歳 / height. 163cm
B.84cm(D)W.56cmH.83cm

Name. 葵みう
Age. 18歳 / height. 165cm
B.83cm(C)W.54cmH.86cm

Name. 夏希まお
Age. 21歳 / height. 159cm
B.90cm(F)W.57cmH.88cm

Name. 深田じゅり
Age. 21歳 / height. 163cm
B.87cm(D)W.58cmH.86cm

Name. 長浜もえ
Age. 23歳 / height. 163cm
B.95cm(H)W.58cmH.87cm

Name. 石辺めい
Age. 22歳 / height. 148cm
B.89cm(F)W.59cmH.86cm

Name. 橘さな
Age. 23歳 / height. 167cm
B.87cm(E)W.58cmH.86cm

Name. 星あいり
Age. 23歳 / height. 149cm
B.86cm(E)W.55cmH.85cm

Name. 姫宮そら
Age. 22歳 / height. 162cm
B.82cm(B)W.54cmH.85cm

Name. 朝葉うみ
Age. 25歳 / height. 156cm
B.100cm(I)W.57cmH.85cm

Name. 夢見れあ
Age. 27歳 / height. 164cm
B.92cm(G)W.60cmH.89cm

Name. 斉藤るん
Age. 18歳 / height. 158cm
B.91cm(F)W.55cmH.75cm

Name. 岸川める
Age. 24歳 / height. 152cm
B.84cm(D)W.57cmH.83cm

Name. 桜野ねこ
Age. 19歳 / height. 157cm
B.87cm(E)W.58cmH.85cm

Name. 水瀬のあ
Age. 20歳 / height. 157cm
B.83cm(C)W.57cmH.82cm

Name. 天元もなか
Age. 22歳 / height. 155cm
B.88cm(F)W.57cmH.89cm

Name. 音瀬すう
Age. 20歳 / height. 168cm
B.92cm(G)W.57cmH.88cm

Name. 美郷ゆうあ
Age. 20歳 / height. 160cm
B.83cm(C)W.56cmH.84cm

Name. 白石なこ
Age. 20歳 / height. 158cm
B.83cm(C)W.57cmH.82cm

Name. 黒澤ゆずは
Age. 22歳 / height. 155cm
B.86cm(F)W.57cmH.85cm

Name. 稲葉みな
Age. 22歳 / height. 148cm
B.82cm(B)W.52cmH.83cm

Name. 野口さや
Age. 20歳 / height. 164cm
B.88cm(F)W.58cmH.84cm

Name. 藤崎えりさ
Age. 30歳 / height. 170cm
B.92cm(G)W.57cmH.88cm

Name. 関あかね
Age. 22歳 / height. 163cm
B.88cm(E)W.55cmH.82cm

Name. 半田ゆな
Age. 22歳 / height. 161cm
B.89cm(F)W.56cmH.84cm

Name. 前原しおり
Age. 23歳 / height. 152cm
B.87cm(E)W.57cmH.85cm

Name. 関口あみな
Age. 22歳 / height. 163cm
B.88cm(F)W.57cmH.86cm

Name. 中島みかな
Age. 19歳 / height. 157cm
B.86cm(E)W.58cmH.86cm

Name. 姫乃りん
Age. 19歳 / height. 155cm
B.84cm(C)W.54cmH.87cm

Name. 桐谷みれい
Age. 26歳 / height. 160cm
B.91cm(G)W.57cmH.88cm

Name. 宮本りこ
Age. 22歳 / height. 160cm
B.90cm(F)W.58cmH.86cm

Name. 苺みあ
Age. 18歳 / height. 148cm
B.82cm(B)W.57cmH.86cm

Name. 香山ねむり
Age. 22歳 / height. 157cm
B.92cm(G)W.59cmH.86cm

Name. 槙野ゆき
Age. 23歳 / height. 150cm
B.89cm(F)W.58cmH.86cm

Name. 星名れのん
Age. 20歳 / height. 157cm
B.86cm(E)W.57cmH.88cm

Name. 井上らむ
Age. 19歳 / height. 163cm
B.93cm(G)W.58cmH.86cm

Name. 藤堂みれい
Age. 19歳 / height. 166cm
B.85cm(D)W.58cmH.87cm

Name. 東あくあ
Age. 20歳 / height. 156cm
B.88cm(F)W.57cmH.87cm

Name. 園田りや
Age. 22歳 / height. 158cm
B.85cm(E)W.57cmH.84cm

Name. 柊木なずな
Age. 23歳 / height. 154cm
B.96cm(G)W.59cmH.87cm

Name. 中山たまご
Age. 21歳 / height. 147cm
B.90cm(F)W.57cmH.85cm

Name. 藤原みゆか
Age. 21歳 / height. 159cm
B.84cm(D)W.57cmH.83cm

Name. 桃倉あめ
Age. 18歳 / height. 157cm
B.84cm(C)W.54cmH.87cm

Name. 花織ことの
Age. 19歳 / height. 157cm
B.84cm(C)W.54cmH.86cm

Name. 植村みずき
Age. 22歳 / height. 158cm
B.86cm(E)W.57cmH.89cm

Name. 伊藤ゆうな
Age. 24歳 / height. 162cm
B.93cm(G)W.58cmH.88cm

Name. 一条るり
Age. 18歳 / height. 166cm
B.83cm(C)W.57cmH.82cm

Name. 暁月みやび
Age. 19歳 / height. 150cm
B.86cm(E)W.57cmH.85cm

Name. 綾瀬ゆめか
Age. 18歳 / height. 148cm
B.88cm(F)W.54cmH.86cm

Name. 海月うい
Age. 20歳 / height. 160cm
B.82cm(B)W.53cmH.83cm

Name. 滝本ゆきか
Age. 22歳 / height. 153cm
B.82cm(B)W.56cmH.81cm

Name. 白雪まい
Age. 21歳 / height. 159cm
B.87cm(E)W.57cmH.89cm

Name. 中嶋みり
Age. 20歳 / height. 158cm
B.88cm(F)W.57cmH.86cm

Name. 黒崎てぃな
Age. 20歳 / height. 158cm
B.92cm(G)W.57cmH.88cm

Name. 一色ゆうか
Age. 18歳 / height. 158cm
B.83cm(C)W.57cmH.82cm

Name. 中川くれは
Age. 20歳 / height. 148cm
B.88cm(F)W.57cmH.89cm

Name. 式波あおい
Age. 23歳 / height. 155cm
B.102cm(I)W.57cmH.88cm

Name. 天使しの
Age. 18歳 / height. 158cm
B.85cm(E)W.55cmH.84cm

Name. 宝鐘れむ
Age. 18歳 / height. 158cm
B.95cm(H)W.58cmH.87cm

Name. 加藤みなみ
Age. 22歳 / height. 158cm
B.85cm(D)W.57cmH.84cm

Name. 天神えま
Age. 20歳 / height. 152cm
B.85cm(D)W.55cmH.87cm

Name. 七瀬かずは
Age. 23歳 / height. 153cm
B.99cm(H)W.59cmH.87cm

Name. 春花ひなの
Age. 18歳 / height. 164cm
B.85cm(D)W.58cmH.84cm

Name. 成瀬もな
Age. 21歳 / height. 160cm
B.87cm(E)W.58cmH.86cm

Name. 七星うた
Age. 22歳 / height. 166cm
B.87cm(D)W.54cmH.85cm

Name. 川口みくる
Age. 23歳 / height. 158cm
B.85cm(D)W.59cmH.84cm

Name. 丸山ゆい
Age. 22歳 / height. 158cm
B.101cm(K)W.58cmH.95cm

Name. 涼森ねね
Age. 22歳 / height. 155cm
B.88cm(E)W.59cmH.86cm

Name. 桜井あや
Age. 22歳 / height. 176cm
B.86cm(C)W.60cmH.88cm

Name. 最上かなで
Age. 22歳 / height. 159cm
B.85cm(D)W.57cmH.84cm

Name. 目黒ゆら
Age. 22歳 / height. 161cm
B.88cm(F)W.56cmH.86cm

Name. 楪らいむ
Age. 21歳 / height. 154cm
B.100cm(J)W.59cmH.94cm

Name. 双葉ゆに
Age. 21歳 / height. 162cm
B.87cm(E)W.54cmH.85cm

Name. 伊吹あいる
Age. 20歳 / height. 163cm
B.85cm(C)W.55cmH.86cm

Name. 野間ゆきな
Age. 21歳 / height. 157cm
B.85cm(D)W.56cmH.86cm

Name. 愛葉えり
Age. 23歳 / height. 162cm
B.90cm(G)W.62cmH.89cm

Name. 大内にこ
Age. 21歳 / height. 163cm
B.87cm(F)W.52cmH.85cm

Name. 本田ふわり
Age. 20歳 / height. 166cm
B.96cm(H)W.59cmH.91cm

Name. 青田みのり
Age. 22歳 / height. 165cm
B.86cm(E)W.56cmH.87cm

Name. 小澤ことは
Age. 20歳 / height. 155cm
B.88cm(F)W.57cmH.85cm

Name. 西園寺うらら
Age. 23歳 / height. 175cm
B.83cm(D)W.57cmH.82cm

Name. 安野ありか
Age. 21歳 / height. 157cm
B.82cm(B)W.55cmH.86cm

Name. 猫宮ひなこ
Age. 22歳 / height. 158cm
B.92cm(G)W.58cmH.90cm

Name. 姫野みあ
Age. 19歳 / height. 160cm
B.91cm(G)W.55cmH.87cm

Name. 雪城ほのか
Age. 20歳 / height. 164cm
B.91cm(F)W.54cmH.86cm

Name. 新田りり
Age. 18歳 / height. 163cm
B.85cm(D)W.58cmH.86cm

Name. 月城まな
Age. 24歳 / height. 165cm
B.88cm(F)W.58cmH.85cm

Name. 中村こはる
Age. 18歳 / height. 156cm
B.82cm(C)W.57cmH.81cm

Name. 夏目にの
Age. 20歳 / height. 150cm
B.81cm(B)W.56cmH.80cm

Name. 西野あやみ
Age. 22歳 / height. 154cm
B.90cm(F)W.57cmH.88cm

Name. 水月さい
Age. 23歳 / height. 162cm
B.83cm(C)W.58cmH.82cm

Name. 徳島ゆず
Age. 23歳 / height. 149cm
B.90cm(G)W.56cmH.88cm

Name. 一ノ瀬まゆ
Age. 21歳 / height. 165cm
B.90cm(F)W.57cmH.85cm

Name. 野々原ちか
Age. 21歳 / height. 153cm
B.82cm(B)W.56cmH.84cm

Name. 日向ほの
Age. 23歳 / height. 156cm
B.87cm(D)W.58cmH.83cm

Name. 水野るな
Age. 24歳 / height. 159cm
B.83cm(C)W.56cmH.82cm

Name. 吉川もか
Age. 24歳 / height. 160cm
B.89cm(F)W.58cmH.85cm

Name. 桜ここ
Age. 18歳 / height. 164cm
B.85cm(D)W.58cmH.86cm

Name. 如月あすか
Age. 23歳 / height. 158cm
B.83cm(C)W.57cmH.87cm

Name. 海野みお
Age. 20歳 / height. 161cm
B.90cm(G)W.58cmH.85cm

Name. 浦瀬もも
Age. 22歳 / height. 150cm
B.92cm(G)W.58cmH.88cm

Name. 坂田みなみ
Age. 22歳 / height. 159cm
B.85cm(D)W.56cmH.88cm

Name. 荻野まなみ
Age. 20歳 / height. 152cm
B.91cm(F)W.57cmH.89cm
`;

// ==========================================
// 4. 処理：データを解析して配列化
// ==========================================
function parseTherapists(text) {
  // 空行で区切ってブロックにする
  const blocks = text.split(/\n\s*\n/);
  const therapists = [];

  blocks.forEach(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;

    let name, age, height, measurements;
    // タグは今回は空にする指示なので無視

    lines.forEach(line => {
      // Nameの行
      if (line.includes('Name.')) {
        name = line.replace('Name.', '').trim();
      }
      // Age / Heightの行
      else if (line.includes('Age.')) {
        const parts = line.split('/');
        // 数字だけ抜き出す
        const agePart = parts[0] || '';
        const heightPart = parts[1] || '';
        age = parseInt(agePart.replace(/[^0-9]/g, '')) || 20;
        height = parseInt(heightPart.replace(/[^0-9]/g, '')) || 160;
      }
      // スリーサイズの行
      else if (line.includes('B.') || (line.includes('B') && line.includes('W'))) {
        // 余計なスペースなどを削除
        measurements = line.replace('B.', 'B')
                           .replace(/cm/g, '')
                           .replace(/\s/g, '');
      }
    });

    // 名前さえあれば登録
    if (name) {
      therapists.push({
        n: name,
        a: age,
        h: height,
        m: measurements || 'B- W- H-'
      });
    }
  });
  return therapists;
}

const therapistsList = parseTherapists(rawText);

// ==========================================
// 5. 処理：全店舗にデータを書き込み
// ==========================================
shops.forEach(shop => {
  // 念のためフォルダ作成
  if (!fs.existsSync(shop.dir)){
    fs.mkdirSync(shop.dir, { recursive: true });
  }

  // セラピストリストをJSON形式に変換
  const threads = therapistsList.map((t, idx) => {
    // IDを店舗ごとにユニークにする
    const threadId = shop.id * 1000 + (idx + 1);
    
    return {
      id: threadId,
      therapistName: t.n,
      age: t.a,
      height: t.h,
      measurements: t.m,
      shopName: shop.name,
      tags: [], // ★指示通りタグは空
      image: "/images/therapists/placeholder.jpg",
      rating: 0,
      reviewCount: 0,
      averageRating: 0,
      averageDetailedRatings: {
        cleanliness: 0, appearance: 0, style: 0,
        service: 0, skill: 0, intensity: 0
      },
      posts: []
    };
  });

  // ファイルの中身を組み立て
  const data = {
    id: shop.id,
    name: "メンズエステ " + shop.name,
    area: shop.name.replace("Lynx", "").replace("店", ""),
    tags: shopTags, // ★店舗タグ（サービス内容）は入れる
    system: {
      standard: [
        { time: "90分", price: "17,600円" },
        { time: "120分", price: "24,200円" },
        { time: "150分", price: "30,800円" }
      ],
      special: [
        { name: "いきなりリンパコース 70分", price: "19,800円" },
        { name: "いきなりリンパコース 100分", price: "28,600円" },
        { name: "いきなりリンパコース 130分", price: "37,400円" }
      ]
    },
    threads: threads
  };

  // ファイル書き込み
  fs.writeFileSync(path.join(shop.dir, "lynx.json"), JSON.stringify(data, null, 2));
  console.log(`作成完了: ${shop.name} (${threads.length}名)`);
});
