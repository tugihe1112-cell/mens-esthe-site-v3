const fs = require('fs-extra');
const path = require('path');

const THERAPISTS_FILE = path.join(__dirname, '../src/data/therapists.json');
const SHOP_ID = "tokyo_chuo_ginza_aromamore"; // AROMA moreメインID

// 頂いた生データ (名前, 年齢, スリーサイズ)
const rawData = `
早坂みれい(21歳)
158cmB:85(D)W:56H:86
加護まい(26歳)
154cmB:85(D)W:55H:86
神谷みさき(26歳)
155cmB:85(E)W:54H:82
白花ゆか(25歳)
153cmB:90(G)W:60H:88
黒姫れな(25歳)
158cmB:87(D)W:60H:87
花籠りま(23歳)
150cmB:84(C)W:57H:86
早見ちはる(22歳)
160cmB:86(E)W:56H:86
寿まい(29歳)
163cmB:87(E)W:57H:88
加賀美ゆり(29歳)
168cmB:87(F)W:57H:86
南雲みさと(24歳)
160cmB:85(C)W:57H:83
天真ゆい(20歳)
160cmB:86(F)W:56H:83
楠みゆう(19歳)
160cmB:86(E)W:56H:83
藤原みお(24歳)
154cmB:85(D)W:55H:83
浜辺さな(21歳)
158cmB:83(D)W:55H:82
泉ふう(22歳)
157cmB:84(D)W:54H:83
白羽せいら(23歳)
162cmB:88(G)W:57H:86
椛りり(19歳)
155cmB:85(E)W:57H:84
一期ゆめ(24歳)
165cmB:87(F)W:56H:85
緋色れい(26歳)
162cmB:83(E)W:56H:83
倉木ひな(20歳)
154cmB:85(E)W:56H:83
椿すず(26歳)
153cmB:83(D)W:56H:85
心愛える(24歳)
153cmB:83(D)W:56H:85
藤咲まい(18歳)
165cmB:87(F)W:56H:86
白石るな(21歳)
160cmB:83(C)W:56H:85
愛川めぐ(24歳)
160cmB:86(E)W:56H:85
櫻ななお(25歳)
163cmB:82(D)W:53H:80
茜まり(25歳)
164cmB:87(F)W:57H:86
高岡みれい(25歳)
166cmB:85(D)W:57H:85
朝比奈まお(22歳)
158cmB:88(G)W:58H:88
如月すい(21歳)
160cmB:83(C)W:54H:82
早乙女もえか(20歳)
163cmB:83(D)W:55H:83
桃愛りこ(27歳)
168cmB:86(E)W:56H:85
美咲あいか(29歳)
160cmB:85(E)W:55H:83
春咲ななせ(24歳)
165cmB:93(G)W:58H:88
音海あんな(25歳)
158cmB:83(D)W:55H:83
道枝みう(25歳)
160cmB:85(F)W:54H:83
江端るの(26歳)
160cmB:83(C)W:55H:83
阿達れむ(20歳)
157cmB:87(F)W:57H:85
姫花まな(26歳)
155cmB:85(E)W:57H:86
神楽みく(20歳)
151cmB:82(C)W:55H:83
雫まや(18歳)
155cmB:83(C)W:55H:82
夏目まどか(19歳)
163cmB:82(D)W:55H:83
神乃みらん(22歳)
157cmB:86(E)W:56H:85
二階堂らん(20歳)
158cmB:88(G)W:57H:88
丹後ゆら(26歳)
158cmB:88(G)W:57H:88
森さとみ(23歳)
160cmB:84(D)W:55H:83
四ノ森あきね(23歳)
155cmB:83(C)W:55H:82
西園寺りあ(26歳)
155cmB:85(D)W:55H:83
要のん(23歳)
157cmB:83(D)W:55H:82
吉川しおり(27歳)
163cmB:87(F)W:58H:86
麻美りん(20歳)
156cmB:85(E)W:55H:86
神崎あや(24歳)
158cmB:85(E)W:56H:85
神宮れいか(26歳)
160cmB:87(F)W:56H:84
桜井ゆめか(20歳)
154cmB:85(E)W:55H:82
天乃そら(23歳)
155cmB:91(H)W:57H:84
乙女みいな(21歳)
163cmB:86(F)W:55H:83
黒崎みな(23歳)
160cmB:88(G)W:57H:85
嬉野そよか(26歳)
157cmB:83(D)W:54H:82
月城ひびき(25歳)
154cmB:85(E)W:54H:83
望月みゆ(25歳)
156cmB:84(D)W:54H:85
夏乃うた(19歳)
165cmB:85(D)W:55H:86
白鳥みなも(26歳)
158cmB:85(E)W:56H:84
四葉かなの(23歳)
160cmB:86(F)W:56H:84
天童えま(19歳)
152cmB:83(C)W:56H:83
新垣ひかり(21歳)
160cmB:82(D)W:54H:80
水瀬はるか(26歳)
151cmB:86(G)W:56H:84
二葉まい(28歳)
170cmB:85(D)W:56H:85
月乃ありす(23歳)
158cmB:86(E)W:57H:85
瑞原しょうこ(26歳)
159cmB:88(G)W:56H:84
虹野ゆめ(23歳)
150cmB:84(D)W:55H:83
愛須りか(22歳)
168cmB:85(F)W:56H:86
瀬名かえで(24歳)
165cmB:85(E)W:56H:83
白雪めい(22歳)
162cmB:88(G)W:57H:86
綾瀬ねね(28歳)
163cmB:85(D)W:56H:84
加瀬あおい(21歳)
154cmB:86(F)W:56H:83
日向れもん(24歳)
165cmB:85(E)W:54H:85
日南いろは(24歳)
150cmB:83(C)W:55H:82
芹沢えみり(24歳)
158cmB:86(E)W:57H:85
有栖るな(22歳)
151cmB:85(F)W:54H:83
光月みさ(23歳)
153cmB:83(D)W:54H:81
百瀬りりあ(21歳)
151cmB:86(F)W:55H:84
東城ゆか(23歳)
150cmB:88(G)W:57H:88
来栖りお(24歳)
155cmB:86(G)W:56H:84
有馬ゆあ(24歳)
164cmB:84(D)W:57H:87
上原もも(21歳)
150cmB:83(D)W:57H:86
夏美ゆあ(21歳)
158cmB:84(E)W:54H:83
風花あん(20歳)
160cmB:83(D)W:56H:83
立花るい(24歳)
154cmB:83(D)W:55H:81
花井みお(24歳)
153cmB:84(E)W:56H:83
琥珀たお(22歳)
154cmB:84(C)W:55H:83
七瀬とあ(23歳)
160cmB:84(C)W:55H:81
柚木りさ(19歳)
153cmB:83(C)W:55H:83
美鈴おとは(24歳)
150cmB:83(E)W:56H:83
愛瀬のの(19歳)
153cmB:85(D)W:56H:83
桜下さら(22歳)
150cmB:84(D)W:56H:83
卯月なこ(26歳)
159cmB:100(J)W:60H:90
天使かのん(20歳)
165cmB:96(H)W:55H:87
深田ゆきの(22歳)
158cmB:84(C)W:54H:83
愛沢かぐや(25歳)
156cmB:87(F)W:55H:82
南あずさ(23歳)
151cmB:86(F)W:55H:83
広末みさ(24歳)
158cmB:87(F)W:56H:84
玉響くれあ(28歳)
158cmB:96(G)W:66H:93
観月ゆり(28歳)
157cmB:83(C)W:56H:82
星空ありさ(23歳)
166cmB:79(B)W:54H:81
胡桃のあ(23歳)
156cmB:87(G)W:56H:85
楪らむ(23歳)
158cmB:87(F)W:56H:85
夢かなの(23歳)
166cmB:93(G)W:59H:90
橘みこと(23歳)
158cmB:85(E)W:56H:83
桜木きき(25歳)
153cmB:86(E)W:56H:84
橋本れな(20歳)
158cmB:88(G)W:56H:86
葵りんか(22歳)
157cmB:83(D)W:56H:83
結城ゆめ(20歳)
157cmB:93(H)W:57H:86
天音みゆ(26歳)
163cmB:86(E)W:56H:85
川口ゆうこ(20歳)
157cmB:88(F)W:56H:86
常盤るか(20歳)
150cmB:93(H)W:56H:88
水城はな(25歳)
158cmB:88(G)W:59H:87
葉月りな(26歳)
155cmB:86(E)W:56H:86
一宮ゆい(24歳)
154cmB:86(E)W:56H:85
桐谷れいな(20歳)
153cmB:86(E)W:56H:84
環みお(23歳)
155cmB:82(C)W:55H:83
本城まゆ(21歳)
156cmB:90(G)W:58H:86
南野ここみ(25歳)
168cmB:85(E)W:58H:86
一条えま(25歳)
160cmB:87(F)W:56H:85
八千草あやめ(25歳)
161cmB:93(H)W:57H:89
有栖川かれん(24歳)
165cmB:93(G)W:60H:89
香坂ゆずは(24歳)
150cmB:85(E)W:55H:83
有村りお(28歳)
159cmB:86(E)W:55H:83
`;

const main = async () => {
  console.log('📜 Processing Real Therapist Data...');

  // データ解析
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const newTherapists = [];
  
  let currentTherapist = null;

  lines.forEach(line => {
    // パターン1: 名前(年齢)  例: 早坂みれい(21歳)
    const nameMatch = line.match(/^(.+?)\((\d+)歳\)$/);
    if (nameMatch) {
      // 前の人がいれば保存
      if (currentTherapist) newTherapists.push(currentTherapist);

      // 新しい人作成
      currentTherapist = {
        name: nameMatch[1],
        age: parseInt(nameMatch[2]),
        shop_id: SHOP_ID,
        // IDは後で一括付与（重複防止）
      };
      return;
    }

    // パターン2: スリーサイズ  例: 158cmB:85(D)W:56H:86
    // 数値は2桁以上、カップはアルファベット
    const statsMatch = line.match(/^(\d+)cmB:(\d+)\(([A-Z]+)\)W:(\d+)H:(\d+)$/);
    if (statsMatch && currentTherapist) {
      currentTherapist.T = statsMatch[1];
      currentTherapist.B = `${statsMatch[2]}(${statsMatch[3]})`; // 85(D)
      currentTherapist.cup = statsMatch[3]; // D
      currentTherapist.W = statsMatch[4];
      currentTherapist.H = statsMatch[5];
      // 画像パスはプレースホルダー
      currentTherapist.image = `/images/therapists/aromamore_real_${newTherapists.length + 1}.jpg`;
      return;
    }

    // それ以外の行（場所や出勤情報）は無視
  });
  
  // 最後の一人を追加
  if (currentTherapist) newTherapists.push(currentTherapist);

  console.log(`🔍 Parsed ${newTherapists.length} real therapists.`);

  // 既存データ読み込み
  const currentData = await fs.readJson(THERAPISTS_FILE);
  
  // ID付与してマージ
  newTherapists.forEach((t, index) => {
    t.id = `aromamore_real_${String(index + 1).padStart(3, '0')}`;
  });

  // 既存のリストに追加（既存の aromamore_real_ 系があれば置き換え、なければ追加）
  // 今回は単純に追加します
  const finalData = [...currentData, ...newTherapists];

  // 保存
  await fs.writeJson(THERAPISTS_FILE, finalData, { spaces: 2 });
  console.log('💾 Saved to src/data/therapists.json');
  console.log('⚠️ Please run "npm run migrate" to apply changes.');
};

main();
