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
    // --- 1. 対象の「名前なし店舗」または「FEVER」を探す ---
    console.log('🔍 1. 対象となる店舗を検索中...');
    
    // まず「名前なし店舗」という名前で登録されているか、あるいはIDに ikebukuro や fever が含まれるかを探す
    let shopRes = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*名前なし*,name.ilike.*FEVER*,id.ilike.*fever*)&select=id,name`, { headers });
    let targetShops = await shopRes.json();
    
    if (!targetShops || targetShops.length === 0) {
       console.log('⚠️ 「名前なし」または「FEVER」の店舗が見つかりませんでした。もし「池袋店」など別の名前で登録されている場合は、スクリプトの検索条件を修正する必要があります。');
       // 念のため全店舗のIDを出力して確認できるようにする
       const allRes = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
       const all = await allRes.json();
       console.log('\n現在の全店舗一覧:');
       all.forEach(s => console.log(` - ID: ${s.id} / Name: ${s.name}`));
       return;
    }

    const shopIds = targetShops.map(s => s.id);
    console.log(`✅ ${shopIds.length}店舗を発見: ${shopIds.join(', ')}`);

    // --- 2. 店舗名、URL、料金システム、ブランドID を一括更新 ---
    console.log('\n🚀 2. 店舗情報を「FEVER」仕様に一括更新します...');
    for (const id of shopIds) {
      await fetch(`${url}/rest/v1/shops?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: "FEVER",
          schedule_url: "https://esthe-fever.com/schedule/",
          price_system: "60min 12,000yen\n90min 16,000yen\n120min 21,000yen",
          brand_id: "fever" // クチコミ吸収用
        })
      });
    }
    console.log('✅ 店舗情報の更新完了！');

    // --- 3. 全店舗へ「全く同じ30名のセラピスト」を一気にコピーして紐付ける ---
    console.log('\n👩‍🔧 3. 抽出した30名のセラピストデータを共通IDで登録します...');
    
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
      { name: "坂本まき", img: "https://esthe-fever.com/wp-content/uploads/2026/02/4716_20260411124658_600_800_0.jpg", age: "18", size: "T159 / B84(C) / W55 / H83" },
      { name: "本田もえ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1915_20260326190949_600_800_0.jpg", age: "21", size: "T158 / B94(H) / W58 / H88" },
      { name: "西野ゆめ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1865_20260326193519_600_800_0.jpg", age: "21", size: "T162 / B88(E) / W57 / H86" },
      { name: "綾波なな", img: "https://esthe-fever.com/wp-content/uploads/2026/01/3875_20260413022944_600_800_0.jpg", age: "22", size: "T156 / B84(D) / W55 / H84" },
      { name: "比嘉まりん", img: "https://esthe-fever.com/wp-content/uploads/2026/02/6237_20260326192912_600_800_0.jpg", age: "23", size: "T150 / B95(G) / W55 / H88" },
      { name: "矢澤ゆい", img: "https://esthe-fever.com/wp-content/uploads/2026/02/4001_20260326191923_600_800_0.jpg", age: "20", size: "T160 / B105(J) / W60 / H96" },
      { name: "永井ねる", img: "https://esthe-fever.com/wp-content/uploads/2026/02/6386_20260409004027_600_800_0.jpg", age: "23", size: "T160 / B84(C) / W57 / H86" },
      { name: "柏木きらら", img: "https://esthe-fever.com/wp-content/uploads/2026/01/3208_20260326192543_600_800_0.jpg", age: "21", size: "T165 / B84(D) / W55 / H84" },
      { name: "石川らん", img: "https://esthe-fever.com/wp-content/uploads/2026/03/7307_20260403233306_600_800_0.jpg", age: "23", size: "T162 / B84(D) / W56 / H83" },
      { name: "猫宮るん", img: "https://esthe-fever.com/wp-content/uploads/2026/03/7681_20260326192903_600_800_0.jpg", age: "20", size: "T158 / B85(D) / W55 / H83" },
      { name: "春野あんり", img: "https://esthe-fever.com/wp-content/uploads/2026/03/7658_20260326192359_600_800_0.jpg", age: "30", size: "T153 / B84 / W55 / H84" },
      { name: "一ノ瀬まお", img: "https://esthe-fever.com/wp-content/uploads/2026/03/7597_20260326192351_600_800_0.jpg", age: "18", size: "T160 / B102(I) / W60 / H96" },
      { name: "瀬戸ももか", img: "https://esthe-fever.com/wp-content/uploads/2026/02/6239_20260326193700_600_800_0.jpg", age: "20", size: "T158 / B102(I) / W60 / H96" },
      { name: "髙橋みあ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1808_20260326192820_600_800_0.jpg", age: "22", size: "T152 / B88(E) / W57 / H86" },
      { name: "神崎りん", img: "https://esthe-fever.com/wp-content/uploads/2026/01/3800_20260326192636_600_800_0.jpg", age: "24", size: "T160 / B84(D) / W56 / H83" },
      { name: "天使るな", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1903_20260326192328_600_800_0.jpg", age: "26", size: "T156 / B102(I) / W60 / H96" },
      { name: "一咲あい", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1843_20260326191400_600_800_0.jpg", age: "26", size: "T160 / B89(E) / W57 / H87" },
      { name: "桃木ももせ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1855_20260409182905_600_800_0.jpg", age: "22", size: "T169 / B93(F) / W58 / H89" },
      { name: "今宮けい", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1867_20260326191234_600_800_0.jpg", age: "23", size: "T155 / B84(C) / W57 / H86" },
      { name: "宮田あいな", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1892_20260329170505_600_800_0.jpg", age: "21", size: "T154 / B84(D) / W56 / H83" },
      { name: "白石みみ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1907_20260326192232_600_800_0.jpg", age: "25", size: "T161 / B84(D) / W56 / H83" },
      { name: "多田あきな", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1911_20260411005235_600_800_0.jpg", age: "19", size: "T152 / B85(D) / W55 / H83" },
      { name: "寺島はな", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1884_20260414205532_600_800_0.jpg", age: "23", size: "T165 / B85(D) / W56 / H85" },
      { name: "杉咲ねね", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1890_20260326191955_600_800_0.jpg", age: "23", size: "T160 / B88(E) / W57 / H86" },
      { name: "上田さくら", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1894_20260326192742_600_800_0.jpg", age: "20", size: "T162 / B90(F) / W56 / H87" },
      { name: "弥みさ", img: "https://esthe-fever.com/wp-content/uploads/2026/02/4798_20260326192150_600_800_0.jpg", age: "21", size: "T153 / B85(D) / W57 / H84" },
      { name: "牧野えりか", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1880_20260326191739_600_800_0.jpg", age: "20", size: "T162 / B88(E) / W57 / H86" },
      { name: "水無月れい", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1869_20260326191540_600_800_0.jpg", age: "21", size: "T151 / B84(C) / W55 / H83" },
      { name: "心花ゆあ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1857_20260413015609_600_800_0.jpg", age: "22", size: "T157 / B84(C) / W56 / H85" },
      { name: "白咲あずさ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1888_20260326191154_600_800_0.jpg", age: "22", size: "T160 / B81(A) / W53 / H79" },
      { name: "松本めぐみ", img: "https://esthe-fever.com/wp-content/uploads/2026/01/2846_20260411182324_600_800_0.jpg", age: "22", size: "T153 / B84(D) / W56 / H83" },
      { name: "山本その", img: "https://esthe-fever.com/wp-content/uploads/2026/01/3068_20260401124601_600_800_0.jpg", age: "20", size: "T158 / B88(E) / W58 / H87" },
      { name: "七瀬しおり", img: "https://esthe-fever.com/wp-content/uploads/2026/02/5816_20260403010826_600_800_0.jpg", age: "26", size: "T157 / B95(H) / W59 / H90" },
      { name: "雨宮なぎ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1813_20260326191655_600_800_0.jpg", age: "27", size: "T171 / B89(E) / W59 / H87" },
      { name: "花沢なつき", img: "https://esthe-fever.com/wp-content/uploads/2026/01/3044_20260326192605_600_800_0.jpg", age: "19", size: "T155 / B84(C) / W55 / H83" },
      { name: "朝妃りあ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1882_20260409174631_600_800_0.jpg", age: "20", size: "T156 / B88(E) / W58 / H87" },
      { name: "月宮めいか", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1873_20260326193038_600_800_0.jpg", age: "22", size: "T158 / B93(G) / W56 / H88" },
      { name: "宮崎わかば", img: "https://esthe-fever.com/wp-content/uploads/2026/02/5837_20260326193407_600_800_0.jpg", age: "25", size: "T160 / B85(C) / W58 / H86" },
      { name: "如月あみ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1863_20260326193244_600_800_0.jpg", age: "22", size: "T163 / B84(D) / W56 / H83" },
      { name: "佐々木りょう", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1859_20260326192041_600_800_0.jpg", age: "24", size: "T162 / B84(C) / W56 / H85" },
      { name: "中野あやか", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1849_20260326193617_600_800_0.jpg", age: "20", size: "T161 / B89(E) / W57 / H88" },
      { name: "愛咲かおる", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1847_20260326193308_600_800_0.jpg", age: "23", size: "T153 / B88(E) / W58 / H87" },
      { name: "結城しの", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1845_20260326192955_600_800_0.jpg", age: "21", size: "T158 / B88(E) / W57 / H86" },
      { name: "一条つばき", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1836_20260326192438_600_800_0.jpg", age: "22", size: "T155 / B90(F) / W55 / H87" },
      { name: "中原りりか", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1830_20260404022324_600_800_0.jpg", age: "21", size: "T164 / B88(E) / W58 / H87" },
      { name: "尾崎すみれ", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1828_20260326192104_600_800_0.jpg", age: "20", size: "T148 / B89(E) / W57 / H87" },
      { name: "佐藤ここな", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1819_20260409014406_600_800_0.jpg", age: "21", size: "T162 / B90(F) / W57 / H88" },
      { name: "斎藤じゅん", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1817_20260326192718_600_800_0.jpg", age: "34", size: "T158 / B85(D) / W57 / H86" },
      { name: "平野まい", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1803_20260326193639_600_800_0.jpg", age: "20", size: "T163 / B90(F) / W57 / H87" },
      { name: "綾瀬しおり", img: "https://esthe-fever.com/wp-content/uploads/2025/12/1851_20260326193555_600_800_0.jpg", age: "22", size: "T158 / B91(F) / W58 / H88" },
      { name: "久保ゆか", img: "https://esthe-fever.com/wp-content/uploads/2026/01/3814_20260326193345_600_800_0.jpg", age: "19", size: "T155 / B96(H) / W55 / H88" },
      { name: "体験入店", img: "https://esthe-fever.com/wp-content/uploads/2026/01/2824_20260326193236_600_800_0.jpg", age: "20", size: "T156(G)" }
    ];

    let successCount = 0;
    
    for (const t of therapists) {
      const payload = {
        id: `fever_${t.name}`,
        shop_id: "fever", // HANASPAと同様、ブランドIDで紐付ける
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

    console.log(`\n🎊 完璧です！ 対象の ${shopIds.length} 店舗を FEVER に変更し、全 ${successCount} 名のセラピストを共通登録しました！`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
