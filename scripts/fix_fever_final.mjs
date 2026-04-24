import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  try {
    const realShopId = "tokyo_toshima_ikebukuro_fever";
    console.log(`🚀 ターゲット店舗: ${realShopId} を完全に修正します...`);

    // 1. 店舗の brand_id とロゴを確実にセット
    console.log('🔗 1. 店舗データに brand_id と ロゴURL を強制セット...');
    await fetch(`${url}/rest/v1/shops?id=eq.${realShopId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        brand_id: "fever",
        image_url: "https://esthe-fever.com/wp-content/themes/design01/img/common/logo.png" // FEVERのロゴ（仮）
      })
    });

    // 2. セラピスト全員を「本物の店舗ID」で再登録
    console.log('👩‍🔧 2. セラピストを本物の店舗IDで登録し直します...');
    
    // ※先ほどと同じ30名のデータです
    const therapists = [
      { name: "黒宮れいか", img: "https://esthe-fever.com/wp-content/uploads/2026/04/10315_20260412180912_600_800_0.jpg", age: "18", size: "T156" },
      { name: "上條るあ", img: "https://esthe-fever.com/wp-content/uploads/2026/04/10260_20260415015147_600_800_0.jpg", age: "29", size: "T167 / B95(G) / W60 / H90" },
      { name: "松田せりな", img: "https://esthe-fever.com/wp-content/uploads/2026/04/9801_20260412131406_600_800_0.jpg", age: "23", size: "T155 / B96(H) / W55 / H88" },
      { name: "橘かなで", img: "https://esthe-fever.com/wp-content/uploads/2026/04/9668_20260405222236_600_800_0.jpg", age: "20", size: "T158 / B85(D) / W55 / H84" },
      { name: "田村くるみ", img: "https://esthe-fever.com/wp-content/uploads/2026/04/9663_20260414200415_600_800_0.jpg", age: "26", size: "T159 / B84(C) / W55 / H83" },
      { name: "原田ひとみ", img: "https://esthe-fever.com/wp-content/uploads/2026/03/9419_20260410014717_600_800_0.jpg", age: "20", size: "T163 / B85(D) / W55 / H83" },
      { name: "本庄なお", img: "https://esthe-fever.com/wp-content/uploads/2026/03/9377_20260331095408_600_800_0.jpg", age: "18", size: "T150 / B85(D) / W55 / H83" },
      { name: "鈴原おと", img: "https://esthe-fever.com/wp-content/uploads/2026/03/9265_20260326234214_600_800_0.jpg", age: "21", size: "T152 / B85(D) / W55 / H83" },
      { name: "菊池まいか", img: "https://esthe-fever.com/wp-content/uploads/2026/03/8621_20260412145115_600_800_0.jpg", age: "18", size: "T157 / B84(C) / W57 / H86" },
      { name: "日向ひなた", img: "https://esthe-fever.com/wp-content/uploads/2026/03/8609_20260414131252_600_800_0.jpg", age: "20", size: "T160 / B84(C) / W57 / H86" },
      { name: "山田りお", img: "https://esthe-fever.com/wp-content/uploads/2026/03/8266_20260330020753_600_800_0.jpg", age: "20", size: "T154 / B88(E) / W57 / H86" },
      { name: "遠藤りあな", img: "https://esthe-fever.com/wp-content/uploads/2026/03/8083_20260326193716_600_800_0.jpg", age: "19", size: "T167 / B84(C) / W55 / H83" },
      { name: "水瀬ことり", img: "https://esthe-fever.com/wp-content/uploads/2026/03/7971_20260326193708_600_800_0.jpg", age: "20", size: "T160 / B94(G) / W55 / H87" },
      { name: "溝口はる", img: "https://esthe-fever.com/wp-content/uploads/2026/03/7804_20260326192207_600_800_0.jpg", age: "18", size: "T165 / B85(D) / W55 / H83" },
      { name: "天乃みこと", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1900_20260326191450_600_800_0.jpg", age: "18", size: "T154 / B95(G) / W55 / H88" },
      { name: "椛みれい", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1905_20260326192128_600_800_0.jpg", age: "18", size: "T160 / B93(F) / W56 / H90" },
      { name: "与田ここみ", img: "https://esthe-fever.com/wp-content/uploads/2026/01/2843_20260326191055_600_800_0.jpg", age: "20", size: "T149 / B88(E) / W57 / H88" },
      { name: "月島さな", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1853_20260329165430_600_800_0.jpg", age: "23", size: "T158 / B90(F) / W57 / H87" },
      { name: "葉月すず", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1815_20260410014653_600_800_0.jpg", age: "26", size: "T151 / B84(C) / W57 / H86" },
      { name: "瀬名はるか", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1806_20260408013544_600_800_0.jpg", age: "21", size: "T150 / B91(F) / W56 / H87" },
      { name: "後藤あんじゅ", img: "https://esthe-fever.com/wp-content/uploads/2026/03/7474_20260326193152_600_800_0.jpg", age: "30", size: "T160 / B95(G) / W56 / H88" },
      { name: "岡田みお", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1896_20260326191624_600_800_0.jpg", age: "27", size: "T152 / B87(E) / W57 / H88" },
      { name: "今井みなみ", img: "https://esthe-fever.com/wp-content/uploads/2026/01/3070_20260326193108_600_800_0.jpg", age: "20", size: "T153 / B96(H) / W55 / H88" },
      { name: "伊藤あおい", img: "https://esthe-fever.com/wp-content/uploads/2026/02/3990_20260326192018_600_800_0.jpg", age: "19", size: "T159 / B85(D) / W55 / H83" },
      { name: "桜庭すずか", img: "https://esthe-fever.com/wp-content/uploads/2026/02/4017_20260326192308_600_800_0.jpg", age: "19", size: "T146 / B92(G) / W55 / H88" },
      { name: "橋本にいな", img: "https://esthe-fever.com/wp-content/uploads/2026/03/7530_20260326192935_600_800_0.jpg", age: "18", size: "T158 / B84(C) / W57 / H86" },
      { name: "小芝すい", img: "https://esthe-fever.com/wp-content/uploads/2026/02/5824_20260326191758_600_800_0.jpg", age: "20", size: "T162 / B88(D) / W58 / H86" },
      { name: "田中のん", img: "https://esthe-fever.com/wp-content/uploads/2026/02/5509_20260326192407_600_800_0.jpg", age: "21", size: "T156 / B84(D) / W55 / H85" },
      { name: "椎名まゆ", img: "https://esthe-fever.com/wp-content/uploads/2026/02/6383_20260406011521_600_800_0.jpg", age: "18", size: "T148 / B88(E) / W57 / H86" },
      { name: "坂本まき", img: "https://esthe-fever.com/wp-content/uploads/2026/02/4716_20260411124658_600_800_0.jpg", age: "18", size: "T159 / B84(C) / W55 / H83" }
    ];

    let successCount = 0;
    for (const t of therapists) {
      const payload = {
        id: `${realShopId}_${t.name}`,
        shop_id: realShopId, // 👈 ここを本物の店舗IDにする
        name: t.name,
        image_url: t.img,
        raw_data: { age: t.age, size: t.size },
        is_active: true
      };

      const res = await fetch(`${url}/rest/v1/therapists`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(payload)
      });
      if(res.ok) successCount++;
    }

    console.log(`\n🎊 完了！ 本物の店舗ID (${realShopId}) に、${successCount}名のデータを直接紐付けました！`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
