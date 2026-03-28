const fs = require('fs');
const path = 'src/pages/Home.jsx';

// =========================================================
// 1. 新しい検索ロジック (グループ化対応) を定義
// =========================================================
// ShopListPageで使ったグループ定義をここでも使えるように定数化して埋め込みます
const GROUP_DEFINITIONS = `
// --- エリアグループ定義 (Home検索用) ---
const AREA_GROUPS = [
  { region: "北海道・東北", prefs: ["北海道", "宮城県", "福島県"] },
  { region: "関東 (東京)", prefs: ["東京都"] },
  { region: "関東 (その他)", prefs: ["神奈川県", "埼玉県", "千葉県", "茨城県", "栃木県", "群馬県"] },
  { region: "中部・北陸", prefs: ["愛知県", "静岡県", "岐阜県", "長野県", "新潟県", "石川県", "福井県", "富山県"] },
  { region: "関西", prefs: ["大阪府", "京都府", "兵庫県", "滋賀県", "奈良県", "和歌山県"] },
  { region: "中国・四国", prefs: ["広島県", "岡山県", "愛媛県", "香川県"] },
  { region: "九州・沖縄", prefs: ["福岡県", "熊本県", "鹿児島県", "沖縄県"] }
];

// 東京の詳細エリアグループ
const TOKYO_GROUPS = [
  { title: "新宿・中野・杉並・吉祥寺", cities: ["新宿区", "中野区", "杉並区", "武蔵野市", "三鷹市"] },
  { title: "池袋・練馬・赤羽", cities: ["豊島区", "練馬区", "北区", "荒川区", "板橋区"] },
  { title: "渋谷・六本木・世田谷・品川", cities: ["港区", "渋谷区", "品川区", "目黒区", "世田谷区", "大田区"] },
  { title: "秋葉原・錦糸町・銀座・東京東部", cities: ["台東区", "中央区", "千代田区", "墨田区", "江東区", "足立区", "江戸川区", "葛飾区"] },
  { title: "その他 市部", cities: ["立川市", "八王子市", "町田市", "府中市", "調布市", "国分寺市", "小金井市", "多摩市"] }
];

// 神奈川の詳細エリアグループ
const KANAGAWA_GROUPS = [
  { title: "横浜・みなとみらい", cities: ["横浜市", "中区", "西区", "南区", "港北区", "関内", "桜木町", "新横浜"] },
  { title: "川崎・武蔵小杉", cities: ["川崎市", "川崎区", "幸区", "中原区", "武蔵小杉"] },
  { title: "県央・湘南・その他", cities: ["相模原市", "厚木市", "大和市", "藤沢市", "本厚木"] }
];

// 大阪の詳細エリアグループ
const OSAKA_GROUPS = [
  { title: "キタ (梅田・新大阪)", cities: ["北区", "梅田", "新大阪", "淀川区", "福島区"] },
  { title: "ミナミ (難波・心斎橋)", cities: ["中央区", "心斎橋", "難波", "浪速区", "天王寺区"] },
  { title: "その他", cities: ["堺市", "東大阪市", "吹田市", "豊中市", "枚方市", "谷町九丁目", "京橋", "十三"] }
];
`;

// =========================================================
// 2. useMemoロジックの書き換え (単純なSetからグループ化へ)
// =========================================================
const OLD_MEMO_LOGIC = /const prefectures = useMemo\(\(\) => \{[\s\S]*?\}, \[shops\]\);[\s\S]*?const cities = useMemo\(\(\) => \{[\s\S]*?\}, \[selectedPrefecture, shops\]\);/;

const NEW_MEMO_LOGIC = `
  // 都道府県リスト (データが存在するものだけを抽出し、地方ごとにグループ化)
  const groupedPrefectures = useMemo(() => {
    const existingPrefs = new Set(shops.map(s => s.prefecture));
    
    return AREA_GROUPS.map(group => ({
      region: group.region,
      prefs: group.prefs.filter(p => existingPrefs.has(p))
    })).filter(group => group.prefs.length > 0);
  }, [shops]);

  // その他の都道府県 (グループ定義外)
  const otherPrefectures = useMemo(() => {
    const defined = new Set(AREA_GROUPS.flatMap(g => g.prefs));
    const existing = [...new Set(shops.map(s => s.prefecture))];
    return existing.filter(p => !defined.has(p)).sort();
  }, [shops]);

  // 詳細エリア (選択された都道府県に応じてグループ化して返す)
  const groupedCities = useMemo(() => {
    if (!selectedPrefecture) return [];
    
    // データ上の全エリアを取得
    const prefShops = shops.filter(s => s.prefecture === selectedPrefecture);
    const existingCities = new Set();
    prefShops.forEach(s => {
       if (s.city) existingCities.add(s.city);
       if (s.area && !Array.isArray(s.area)) existingCities.add(s.area);
    });
    const cityList = Array.from(existingCities);

    // グループ定義を選択
    let targetGroups = [];
    if (selectedPrefecture === "東京都") targetGroups = TOKYO_GROUPS;
    else if (selectedPrefecture === "神奈川県") targetGroups = KANAGAWA_GROUPS;
    else if (selectedPrefecture === "大阪府") targetGroups = OSAKA_GROUPS;

    // 定義がある場合: グループごとに分類
    if (targetGroups.length > 0) {
      const groups = targetGroups.map(g => ({
        title: g.title,
        cities: g.cities.filter(c => cityList.includes(c))
      })).filter(g => g.cities.length > 0);

      // グループに入らなかった「その他」
      const grouped = new Set(groups.flatMap(g => g.cities));
      const others = cityList.filter(c => !grouped.has(c)).sort();
      
      if (others.length > 0) {
        groups.push({ title: "その他エリア", cities: others });
      }
      return groups; // [{title: "新宿...", cities: [...]}, ...] の形
    }

    // 定義がない県: そのままリスト (グループなし)
    return [{ title: "エリア一覧", cities: cityList.sort() }];
  }, [selectedPrefecture, shops]);`;

// =========================================================
// 3. 表示部分 (JSX) の書き換え
// =========================================================
// 都道府県のselect
const OLD_PREF_JSX = /<select\s+value=\{selectedPrefecture\}[\s\S]*?\{prefectures\.map\(\(pref\) => \([\s\S]*?<\/select>/;
const NEW_PREF_JSX = `<select
                  value={selectedPrefecture}
                  onChange={handlePrefectureChange}
                  className="w-full p-3 rounded bg-slate-700 border border-slate-600 text-white text-sm md:text-base focus:border-pink-500 focus:outline-none transition"
                >
                  <option value="">都道府県を選択</option>
                  
                  {/* 地方別グループ表示 */}
                  {groupedPrefectures.map(group => (
                    <optgroup key={group.region} label={group.region}>
                      {group.prefs.map(pref => (
                        <option key={pref} value={pref}>{pref}</option>
                      ))}
                    </optgroup>
                  ))}
                  
                  {/* 定義外の都道府県 */}
                  {otherPrefectures.length > 0 && (
                    <optgroup label="その他">
                      {otherPrefectures.map(pref => (
                        <option key={pref} value={pref}>{pref}</option>
                      ))}
                    </optgroup>
                  )}
                </select>`;

// 地域のselect
const OLD_CITY_JSX = /<select\s+value=\{selectedCity\}[\s\S]*?\{cities\.map\(\(city\) => \([\s\S]*?<\/select>/;
const NEW_CITY_JSX = `<select
                  value={selectedCity}
                  onChange={handleCityChange}
                  disabled={!selectedPrefecture}
                  className="w-full p-3 rounded bg-slate-700 border border-slate-600 text-white text-sm md:text-base focus:border-pink-500 focus:outline-none disabled:opacity-50 transition"
                >
                  <option value="">地域を選択</option>
                  
                  {/* エリアグループ表示 */}
                  {groupedCities.map((group, idx) => (
                    <optgroup key={group.title || idx} label={group.title}>
                      {group.cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>`;


// =========================================================
// ファイル更新処理
// =========================================================
try {
  let content = fs.readFileSync(path, 'utf8');

  // 1. 定義を追加 (importsの下あたり)
  if (!content.includes('const AREA_GROUPS')) {
    content = content.replace('export default function Home() {', GROUP_DEFINITIONS + '\nexport default function Home() {');
  }

  // 2. ロジック置換
  if (OLD_MEMO_LOGIC.test(content)) {
    content = content.replace(OLD_MEMO_LOGIC, NEW_MEMO_LOGIC);
    console.log("✅ ロジック部分をグループ化対応版に更新しました。");
  }

  // 3. JSX置換 (Prefecture)
  if (OLD_PREF_JSX.test(content)) {
    content = content.replace(OLD_PREF_JSX, NEW_PREF_JSX);
    console.log("✅ 都道府県の選択ボックスを更新しました (地方ごとの見出し追加)。");
  }

  // 4. JSX置換 (City)
  if (OLD_CITY_JSX.test(content)) {
    content = content.replace(OLD_CITY_JSX, NEW_CITY_JSX);
    console.log("✅ 地域の選択ボックスを更新しました (エリアグループ対応)。");
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log("🎉 更新完了！ Home.jsx の検索フォームが最新仕様になりました。");

} catch (e) {
  console.error("エラーが発生しました:", e);
}
