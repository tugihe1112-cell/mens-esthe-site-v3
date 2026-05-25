const fs = require('fs');
const path = require('path');

const DATA_ROOT = path.join(process.cwd(), 'public/data');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/index.js');

// ■ 地名変換マップ (完全版)
// 検出されたアルファベット地名を網羅
const CITY_MAP = {
  // === 今回検出された未変換・ミスの修正 ===
  'ichinomiyahon': '一宮本町',
  'ichinomiyamae': '一宮駅前',
  'isezaki': '伊勢佐木',
  'isezakicho': '伊勢佐木町',
  'kamiooka': '上大岡',
  'mukogaokayuen': '向ヶ丘遊園',
  'nishifunabashi': '西船橋', // アンダースコアなしに対応
  'nishi_funabashi': '西船橋', // 念のため両方入れておく
  'nogecho': '野毛町',
  'saitama-minami': 'さいたま市南区', // または南浦和
  'sakuragicho': '桜木町',
  'shinyurigaoka': '新百合ヶ丘', // yありに対応
  'shinurigaoka': '新百合ヶ丘', // 念のためyなしも維持
  'tsunashima': '綱島',
  // ====================================

  // 東京
  'chiyoda': '千代田区', 'chuo': '中央区', 'minato': '港区',
  'shinjuku': '新宿区', 'bunkyo': '文京区', 'taito': '台東区',
  'sumida': '墨田区', 'koto': '江東区', 'shinagawa': '品川区',
  'meguro': '目黒区', 'ota': '大田区', 'setagaya': '世田谷区',
  'shibuya': '渋谷区', 'nakano': '中野区', 'suginami': '杉並区',
  'toshima': '豊島区', 'kita': '北区', 'arakawa': '荒川区',
  'itabashi': '板橋区', 'nerima': '練馬区', 'adachi': '足立区',
  'katsushika': '葛飾区', 'edogawa': '江戸川区', 
  'hachioji': '八王子市', 'tachikawa': '立川市', 'musashino': '武蔵野市', 
  'mitaka': '三鷹市', 'fuchu': '府中市', 'machida': '町田市', 
  'kokubunji': '国分寺市', 'tama': '多摩市', 'chofu': '調布市',
  'nishitokyo': '西東京市',

  // 神奈川
  'yokohama': '横浜市', 'kawasaki': '川崎市', 'sagamihara': '相模原市',
  'yokosuka': '横須賀市', 'hiratsuka': '平塚市', 'kamakura': '鎌倉市',
  'fujisawa': '藤沢市', 'odawara': '小田原市', 'chigasaki': '茅ヶ崎市',
  'atsugi': '厚木市', 'yamato': '大和市', 'isehara': '伊勢原市',
  'ebina': '海老名市', 'zama': '座間市', 'minamiashigara': '南足柄市',
  'ayase': '綾瀬市', 'honatsugi': '本厚木', 'kannai': '関内',
  'shinyokohama': '新横浜', 'tsurumi': '鶴見', 'mizonokuchi': '溝の口',
  'musashikosugi': '武蔵小杉', 'noborito': '登戸', 'inadazutsumi': '稲田堤',
  'sagnamiono': '相模大野', 'totsuka': '戸塚', 'ofuna': '大船',

  // 埼玉
  'saitama': 'さいたま市', 'kawagoe': '川越市', 'kumagaya': '熊谷市',
  'kawaguchi': '川口市', 'gyoda': '行田市', 'chichibu': '秩父市',
  'tokorozawa': '所沢市', 'hanno': '飯能市', 'kazo': '加須市',
  'higashimatsuyama': '東松山市', 'kasukabe': '春日部市', 'sayama': '狭山市',
  'hanyu': '羽生市', 'konosu': '鴻巣市', 'fukaya': '深谷市',
  'ageo': '上尾市', 'soka': '草加市', 'koshigaya': '越谷市',
  'warabi': '蕨市', 'toda': '戸田市', 'iruma': '入間市',
  'asaka': '朝霞市', 'shiki': '志木市', 'wako': '和光市',
  'niiza': '新座市', 'kuki': '久喜市', 'kitamoto': '北本市',
  'yashio': '八潮市', 'fujimi': '富士見市', 'misato': '三郷市',
  'hasuda': '蓮田市', 'sakado': '坂戸市', 'satte': '幸手市',
  'tsurugashima': '鶴ヶ島市', 'hidaka': '日高市', 'yoshikawa': '吉川市',
  'fujimino': 'ふじみ野市', 'omiya': '大宮', 'urawa': '浦和',
  'minamiurawa': '南浦和', 'nishi_kawaguchi': '西川口',

  // 千葉
  'chiba': '千葉市', 'choshi': '銚子市', 'ichikawa': '市川市',
  'funabashi': '船橋市', 'tateyama': '館山市', 'kisarazu': '木更津市',
  'matsudo': '松戸市', 'noda': '野田市', 'mobara': '茂原市',
  'narita': '成田市', 'sakura': '佐倉市', 'togane': '東金市',
  'asahi': '旭市', 'narashino': '習志野市', 'kashiwa': '柏市',
  'katsuura': '勝浦市', 'ichihara': '市原市', 'nagareyama': '流山市',
  'yachiyo': '八千代市', 'abiko': '我孫子市', 'kamagaya': '鎌ケ谷市',
  'kimitsu': '君津市', 'futtsu': '富津市', 'urayasu': '浦安市',
  'yotsukaido': '四街道市', 'sodegaura': '袖ケ浦市', 'yachimata': '八街市',
  'inzai': '印西市', 'shiroi': '白井市', 'tomisato': '富里市',
  'minamiboso': '南房総市', 'sosa': '匝瑳市', 'katori': '香取市',
  'sanmu': '山武市', 'isumi': 'いすみ市', 'oamishirasato': '大網白里市',
  'tsudanuma': '津田沼',

  // 大阪
  'osaka': '大阪市', 'sakai': '堺市', 'kishiwada': '岸和田市',
  'toyonaka': '豊中市', 'ikeda': '池田市', 'suita': '吹田市',
  'izumiotsu': '泉大津市', 'takatsuki': '高槻市', 'kaizuka': '貝塚市',
  'hirakata': '枚方市', 'ibaraki': '茨木市', 'yao': '八尾市',
  'izumisano': '泉佐野市', 'tondabayashi': '富田林市', 'neyagawa': '寝屋川市',
  'kawachinagano': '河内長野市', 'matsubara': '松原市', 'daito': '大東市',
  'izumi': '和泉市', 'minoh': '箕面市', 'kashiwara': '柏原市',
  'habikino': '羽曳野市', 'kadoma': '門真市', 'settsu': '摂津市',
  'takaishi': '高石市', 'fujiidera': '藤井寺市', 'higashiosaka': '東大阪市',
  'sennan': '泉南市', 'shijonawate': '四條瑕市', 'katano': '交野市',
  'osakasayama': '大阪狭山市', 'hannan': '阪南市',
  'umeda': '梅田', 'kitashinchi': '北新地', 'minami': 'ミナミ',
  'shinsaibashi': '心斎橋', 'namba': '難波', 'nipponbashi': '日本橋',
  'uehonmachi': '上本町', 'tennoji': '天王寺', 'kyobashi': '京橋',
  'juso': '十三', 'shin_osaka': '新大阪', 'esaka': '江坂',
  'nagahoribashi': '長堀橋', 'nagahoribashi_matsuyamachi': '長堀橋・松屋町',

  // 兵庫
  'kobe': '神戸市', 'himeji': '姫路市', 'sannomiya': '三宮',
  'motomachi': '元町', 'asahidori': '旭通', 'kanocho': '加納町',
  'ninomiya': '二宮', 'nishinomiya': '西宮市', 'amagasaki': '尼崎市',
  'akashi': '明石市', 'kakogawa': '加古川市', 'takarazuka': '宝塚市',
  'itami': '伊丹市', 'kawanishi': '川西市', 'sanda': '三田市',
  'ashiya': '芦屋市', 'awaji': '淡路市',

  // 愛知
  'nagoya': '名古屋市', 'toyohashi': '豊橋市', 'okazaki': '岡崎市',
  'ichinomiya': '一宮市', 'seto': '瀬戸市', 'handa': '半田市',
  'kasugai': '春日井市', 'toyokawa': '豊川市', 'tsushima': '津島市',
  'hekinan': '碧南市', 'kariya': '刈谷市', 'toyota': '豊田市',
  'anjo': '安城市', 'nishio': '西尾市', 'gamagori': '蒲郡市',
  'inuyama': '犬山市', 'tokoname': '常滑市', 'konan': '江南市',
  'komaki': '小牧市', 'inazawa': '稲沢市', 'tokai': '東海市',
  'obu': '大府市', 'chita': '知多市', 'chiryu': '知立市',
  'owariasahi': '尾張旭市', 'takahama': '高浜市', 'iwakura': '岩倉市',
  'toyogen': '豊明市', 'nisshin': '日進市', 'tahara': '田原市',
  'aisai': '愛西市', 'kiyosu': '清須市', 'kitanagoya': '北名古屋市',
  'yatomi': '弥富市', 'miyoshi': 'みよし市', 'ama': 'あま市',
  'nagakute': '長久手市', 'sakae': '栄', 'nishiki': '錦',
  'kanayama': '金山', 'meieki': '名駅',

  // 北海道
  'sapporo': '札幌市', 'hakodate': '函館市', 'otaru': '小樽市',
  'asahikawa': '旭川市', 'muroran': '室蘭市', 'kushiro': '釧路市',
  'obihiro': '帯広市', 'kitami': '北見市', 'yubari': '夕張市',
  'iwamizawa': '岩見沢市', 'abashiri': '網走市', 'rumoi': '留萌市',
  'tomakomai': '苫小牧市', 'wakkanai': '稚内市', 'bibai': '美唄市',
  'ashibetsu': '芦別市', 'ebetsu': '江別市', 'akabira': '赤平市',
  'monbetsu': '紋別市', 'shibetsu': '士別市', 'nayoro': '名寄市',
  'mikasa': '三笠市', 'nemuro': '根室市', 'chitose': '千歳市',
  'takikawa': '滝川市', 'sunagawa': '砂川市', 'utashinai': '歌志内市',
  'fukagawa': '深川市', 'furano': '富良野市', 'noboribetsu': '登別市',
  'eniwa': '恵庭市', 'date': '伊達市', 'kitahiroshima': '北広島市',
  'ishikari': '石狩市', 'hokuto': '北斗市', 'susukino': 'すすきの',

  // 福岡
  'fukuoka': '福岡市', 'kitakyushu': '北九州市', 'omuta': '大牟田市',
  'kurume': '久留米市', 'nogata': '直方市', 'iizuka': '飯塚市',
  'tagawa': '田川市', 'yanagawa': '柳川市', 'yame': '八女市',
  'chikugo': '筑後市', 'okawa': '大川市', 'yukuhashi': '行橋市',
  'buzen': '豊前市', 'nakama': '中間市', 'ogori': '小郡市',
  'chikushino': '筑紫野市', 'kasuga': '春日市', 'onojo': '大野城市',
  'munakata': '宗像市', 'dazaifu': '太宰府市', 'koga': '古賀市',
  'fukutsu': '福津市', 'ukicha': 'うきは市', 'miyawaka': '宮若市',
  'kama': '嘉麻市', 'asakura': '朝倉市', 'miyama': 'みやま市',
  'itoshima': '糸島市', 'nakagawa': '那珂川市', 'hakata': '博多',
  'nakasu': '中洲', 'tenjin': '天神', 'kokura': '小倉'
};

console.log('🔄 データ台帳再構築（全エリア対応 ＋ 地名日本語補正 v2）...');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.json') && file !== 'shops_backup.json') {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

try {
  if (!fs.existsSync(DATA_ROOT)) {
    throw new Error(`ディレクトリが見つかりません: ${DATA_ROOT}`);
  }
  const allFiles = getAllFiles(DATA_ROOT);
  const shops = {};
  let count = 0;

  console.log(`�� スキャン対象: ${DATA_ROOT}`);

  allFiles.forEach(filePath => {
    const relativePath = path.relative(DATA_ROOT, filePath);
    const pathParts = relativePath.split(path.sep);
    
    // ID生成
    const fileName = path.basename(filePath, '.json');
    const idParts = [...pathParts];
    idParts.pop();
    idParts.push(fileName);
    const newId = idParts.join('_');

    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const jsonContent = JSON.parse(rawData);

      if (!jsonContent.groupId && jsonContent.id) {
        jsonContent.groupId = jsonContent.id;
      }
      jsonContent.id = newId;

      const cityFolder = pathParts[1]; 

      // 優先的にフォルダ名で補正
      if (CITY_MAP[cityFolder]) {
        jsonContent.city = CITY_MAP[cityFolder];
      } 
      // JSONの中身がローマ字で、かつ辞書にある場合
      else if (CITY_MAP[jsonContent.city]) {
        jsonContent.city = CITY_MAP[jsonContent.city];
      }

      if (!jsonContent.ward && jsonContent.city) {
        jsonContent.ward = jsonContent.city;
      }

      shops[newId] = jsonContent;
      count++;
    } catch (e) {
      console.error(`⚠️ エラー: ${filePath}`, e);
    }
  });

  const fileContent = `// このファイルは自動生成されました
// 最終更新: ${new Date().toLocaleString()}

export const allShops = ${JSON.stringify(shops, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, fileContent);

  console.log('--------------------------------------------------');
  console.log(`✅ 完了: ${count} 件処理しました。`);
  console.log('👉 残っていたローマ字地名（shinyurigaoka, nishifunabashi等）を全て補正しました。');
  console.log('--------------------------------------------------');

} catch (err) {
  console.error('❌ エラーが発生しました:', err);
}
