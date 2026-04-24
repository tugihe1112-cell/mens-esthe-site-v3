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

  const shopsData = [
    {
      searchKeywords: ['aromantic', 'アロマンティック'],
      website_url: "https://aromantic.tokyo",
      schedule_url: "https://aromantic.tokyo/schedule",
      price_system: "90分 19,000円\n120分 25,000円\n150分 33,000円\n180分 43,000円\n200分 51,000円\n220分 60,000円\n240分 70,000円\n270分 85,000円\n300分 106,000円",
      casts: [
        { name: "あいな", age: "25", size: "T.162 / B.-(G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1749097756_7529747.jpg" },
        { name: "あおい", age: "23", size: "T.155 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775395382_4147016.jpeg" },
        { name: "あすか", age: "26", size: "T.165 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1738939387_8308671.jpeg" },
        { name: "あみか", age: "27", size: "T.167 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773771985_7546260.jpeg" },
        { name: "あやか", age: "28", size: "T.- / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1716802236_6726123.jpg" },
        { name: "あやめ", age: "22", size: "T.152 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1752549382_0710000.jpg" },
        { name: "ありさ", age: "21", size: "T.154 / B.-(G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1760933145_1341008.jpg" },
        { name: "あん", age: "21", size: "T.155 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1749694704_6222905.jpg" },
        { name: "いおり", age: "20", size: "T.164 / B.-(B)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1751809347_5285600.jpeg" },
        { name: "いろは", age: "22", size: "T.158 / B.-(G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747903396_6166269.jpg" },
        { name: "えな", age: "23", size: "T.164 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775097981_1131707.jpg" },
        { name: "えりい", age: "24", size: "T.155 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761444734_7053217.jpeg" },
        { name: "えりか", age: "25", size: "T.158 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1716802093_8237226.jpg" },
        { name: "おと", age: "24", size: "T.160 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1763012697_8577834.jpg" },
        { name: "かな", age: "20", size: "T.160 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1769164755_6808641.jpg" },
        { name: "かなめ", age: "23", size: "T.152 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1769594678_8259941.jpg" },
        { name: "かれん", age: "26", size: "T.163 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1766228015_5201572.jpg" },
        { name: "くるみ", age: "23", size: "T.157 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1765102377_4665138.jpeg" },
        { name: "ここ", age: "26", size: "T.164 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761444395_6848375.jpeg" },
        { name: "こころ", age: "21", size: "T.170 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1737346433_0421728.jpg" },
        { name: "さくら", age: "29", size: "T.150 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1728724914_4886550.jpg" },
        { name: "さつき", age: "25", size: "T.158 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1763957996_9355388.jpg" },
        { name: "さな", age: "23", size: "T.161 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1743604532_7434402.jpg" },
        { name: "さや", age: "22", size: "T.155 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1751963981_7756742.jpeg" },
        { name: "さら", age: "24", size: "T.165 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1737177217_0099787.jpeg" },
        { name: "さんご", age: "22", size: "T.163 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1768464801_4959873.jpg" },
        { name: "しおり", age: "26", size: "T.162 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775097951_1498413.jpg" },
        { name: "しゅうか", age: "22", size: "T.160 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1749298807_2648996.jpeg" },
        { name: "すい", age: "20", size: "T.160 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1765852480_2258057.jpg" },
        { name: "すみれ", age: "26", size: "T.168 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1729655044_6670624.jpeg" },
        { name: "せりな", age: "21", size: "T.150 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1748499484_8667133.jpg" },
        { name: "そら", age: "21", size: "T.158 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770098432_7691365.jpeg" },
        { name: "ちひろ", age: "23", size: "T.165 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747761832_8321502.jpeg" },
        { name: "なぎさ", age: "23", size: "T.157 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1750763081_5070834.jpeg" },
        { name: "なつみ", age: "28", size: "T.165 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770190982_9547661.jpeg" },
        { name: "ななせ", age: "25", size: "T.157 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775097967_3273548.jpg" },
        { name: "ななみ", age: "23", size: "T.164 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775098023_4790472.jpg" },
        { name: "のあ", age: "22", size: "T.161 / B.-(G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1746377096_2738640.jpg" },
        { name: "のぞみ", age: "22", size: "T.164 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1772988584_1178609.jpeg" },
        { name: "はな", age: "24", size: "T.164 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1759854036_9381840.jpg" },
        { name: "ひびき", age: "24", size: "T.150 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775371091_0195293.jpeg" },
        { name: "ひめか", age: "22", size: "T.160 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1774352277_0845047.jpg" },
        { name: "ふう", age: "24", size: "T.163 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1759567564_3423505.jpeg" },
        { name: "ふゆこ", age: "23", size: "T.159 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775098004_8145280.jpg" },
        { name: "ましろ", age: "23", size: "T.160 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761739101_8144421.jpeg" },
        { name: "まや", age: "22", size: "T.155 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747632747_2578147.jpg" },
        { name: "まりん", age: "25", size: "T.155 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1772692450_4941113.jpeg" },
        { name: "みあ", age: "21", size: "T.160 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1756750232_4045263.jpeg" },
        { name: "みいな", age: "24", size: "T.156 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1750049941_8984424.jpg" },
        { name: "みこと", age: "29", size: "T.170 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770720234_2937160.jpg" },
        { name: "みさ", age: "22", size: "T.160 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747644516_5517794.jpg" },
        { name: "みさと", age: "23", size: "T.155 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1740743174_8504858.jpg" },
        { name: "みつき", age: "26", size: "T.153 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773924658_4318563.jpg" },
        { name: "みな", age: "23", size: "T.151 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1766294359_5030023.jpeg" },
        { name: "みなみ", age: "21", size: "T.162 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1763665928_8536546.jpeg" },
        { name: "みほ", age: "20", size: "T.152 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1719033487_5342909.jpeg" },
        { name: "みゆ", age: "25", size: "T.152 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770696606_4527438.jpg" },
        { name: "もね", age: "22", size: "T.160 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1774376245_2617013.jpg" },
        { name: "もも", age: "20", size: "T.156 / B.-(G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1745849316_0895270.jpeg" },
        { name: "ゆあ", age: "22", size: "T.152 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775097989_8045429.jpg" },
        { name: "ゆい", age: "22", size: "T.160 / B.-(G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1741494631_7892154.jpg" },
        { name: "ゆうこ", age: "26", size: "T.153 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761903238_6665197.jpg" },
        { name: "ゆき", age: "23", size: "T.158 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775239577_6912068.jpg" },
        { name: "ゆず", age: "22", size: "T.166 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1716802663_1535126.jpg" },
        { name: "ゆな", age: "25", size: "T.157 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1765852502_1117734.jpg" },
        { name: "ゆみ", age: "23", size: "T.164 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1724051168_7526516.jpg" },
        { name: "ゆめ", age: "23", size: "T.155 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771301685_7274135.jpg" },
        { name: "ゆら", age: "22", size: "T.168 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1768229793_7641366.jpg" },
        { name: "ゆり", age: "25", size: "T.163 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1716802284_6993093.jpg" },
        { name: "ゆりあ", age: "24", size: "T.163 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1772985117_8861357.jpeg" },
        { name: "ゆりか", age: "26", size: "T.158 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753803399_0175204.jpg" },
        { name: "らな", age: "20", size: "T.170 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1748407468_8577902.jpeg" },
        { name: "らら", age: "25", size: "T.165 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1763635186_1079965.jpeg" },
        { name: "らん", age: "22", size: "T.162 / B.-(G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1751522758_8683314.jpg" },
        { name: "りあ", age: "24", size: "T.160 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1756521052_9532380.jpeg" },
        { name: "りか", age: "22", size: "T.155 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1752081142_9355309.jpeg" },
        { name: "りこ", age: "24", size: "T.159 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1762322686_6527286.jpeg" },
        { name: "りほ", age: "20", size: "T.155 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775097996_0720201.jpg" },
        { name: "りょう", age: "20", size: "T.160 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1716995829_7569732.jpeg" },
        { name: "りりか", age: "23", size: "T.160 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775098011_4522208.jpg" },
        { name: "りん", age: "20", size: "T.160 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1738639418_4598359.jpg" },
        { name: "るな", age: "22", size: "T.165 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773041323_1515934.jpg" },
        { name: "れい", age: "26", size: "T.157 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1762187267_9501269.jpeg" },
        { name: "れいか", age: "20", size: "T.153 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747024948_9295504.jpg" },
        { name: "れいな", age: "22", size: "T.152 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1757793874_3750864.jpeg" },
        { name: "れな", age: "21", size: "T.154 / B.-(C)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1744369259_1032981.jpeg" },
        { name: "れんか", age: "25", size: "T.153 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1752304506_3551715.jpg" },
        { name: "わかな", age: "21", size: "T.163 / B.-(H)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775542003_3023131.jpeg" }
      ]
    },
    {
      searchKeywords: ['zexterior', 'ゼクステリア'],
      website_url: "https://zexterior-aroma.com/",
      schedule_url: "https://zexterior-aroma.com/schedule.php",
      price_system: "90min ¥19,000\n120min ¥24,000\n150min ¥29,000",
      casts: [
        { name: "青山 桜", age: "26", size: "T.148 / Cup.I", img: "https://zexterior-aroma.com/images_staff/198/082909335065.jpeg" },
        { name: "河合 千鶴", age: "27", size: "T.162 / Cup.D", img: "https://zexterior-aroma.com/images_staff/190/091214570295.jpeg" },
        { name: "冴島 きょうか", age: "26", size: "T.160 / Cup.F", img: "https://zexterior-aroma.com/images_staff/214/090118370952.jpeg" },
        { name: "藤咲 舞", age: "28", size: "T.165 / Cup.G", img: "https://zexterior-aroma.com/images_staff/218/092205465389.jpeg" },
        { name: "花里 のん", age: "30", size: "T.158 / Cup.H", img: "https://zexterior-aroma.com/images_staff/228/021620431716.jpeg" },
        { name: "桃川 理亜", age: "28", size: "T.161 / Cup.G", img: "https://zexterior-aroma.com/images_staff/113/022114101060.jpeg" },
        { name: "宮野 桃", age: "32", size: "T.160 / Cup.G", img: "https://zexterior-aroma.com/images_staff/118/022113470169.jpeg" },
        { name: "一条 カレン", age: "25", size: "T.158 / Cup.H", img: "https://zexterior-aroma.com/images_staff/203/033020395837.jpeg" },
        { name: "稲森 莉子", age: "26", size: "T.153 / Cup.E", img: "https://zexterior-aroma.com/images_staff/204/083021501490.jpeg" },
        { name: "似鳥 芹香", age: "29", size: "T.161 / Cup.G", img: "https://zexterior-aroma.com/images_staff/187/022409540823.jpeg" },
        { name: "香山 里香", age: "30", size: "T.162 / Cup.I", img: "https://zexterior-aroma.com/images_staff/173/09051325388.jpeg" },
        { name: "村岡 美咲", age: "25", size: "T.168 / Cup.I", img: "https://zexterior-aroma.com/images_staff/161/092613542123.jpeg" },
        { name: "瑞樹 なつ", age: "30", size: "T.164 / Cup.F", img: "https://zexterior-aroma.com/images_staff/151/08281936429.jpeg" },
        { name: "咲良 ゆり", age: "30", size: "T.165 / Cup.C", img: "https://zexterior-aroma.com/images_staff/222/120318461956.jpeg" },
        { name: "小川 菜々子", age: "26", size: "T.156 / Cup.D", img: "https://zexterior-aroma.com/images_staff/233/040313402284.jpeg" },
        { name: "百瀬 柚奈", age: "29", size: "T.163 / Cup.F", img: "https://zexterior-aroma.com/images_staff/230/030317524058.jpeg" },
        { name: "皐月 杏奈", age: "26", size: "T.160 / Cup.E", img: "https://zexterior-aroma.com/images_staff/207/091108035877.jpeg" },
        { name: "夏目 沙也加", age: "32", size: "T.160 / Cup.E", img: "https://zexterior-aroma.com/images_staff/150/120122483316.jpeg" },
        { name: "月詠 茉都香", age: "30", size: "T.165 / Cup.F", img: "https://zexterior-aroma.com/images_staff/179/091110252124.jpeg" },
        { name: "天海 亜來", age: "30", size: "T.159 / Cup.F", img: "https://zexterior-aroma.com/images_staff/117/090712421980.jpeg" },
        { name: "社 しおり", age: "29", size: "T.153 / Cup.E", img: "https://zexterior-aroma.com/images_staff/232/032210181163.jpeg" },
        { name: "神野 沙也加", age: "26", size: "T.166 / Cup.E", img: "https://zexterior-aroma.com/images_staff/181/100614410612.jpeg" },
        { name: "神薙 雫", age: "28", size: "T.153 / Cup.F", img: "https://zexterior-aroma.com/images_staff/216/092106220178.jpeg" },
        { name: "荒木 絵里", age: "30", size: "T.159 / Cup.E", img: "https://zexterior-aroma.com/images/no_image.jpg" },
        { name: "桜河 恋春", age: "28", size: "T.173 / Cup.I", img: "https://zexterior-aroma.com/images_staff/227/020316081026.jpeg" },
        { name: "千秋 世奈", age: "27", size: "T.154 / Cup.C", img: "https://zexterior-aroma.com/images_staff/197/101512152857.jpeg" },
        { name: "輝夜 純連", age: "28", size: "T.152 / Cup.E", img: "https://zexterior-aroma.com/images_staff/107/092216140260.jpeg" },
        { name: "早乙女 夜狐", age: "24", size: "T.149 / Cup.F", img: "https://zexterior-aroma.com/images_staff/201/090112565024.jpeg" },
        { name: "東条 百華", age: "33", size: "T.160 / Cup.F", img: "https://zexterior-aroma.com/images_staff/104/012716171685.jpeg" },
        { name: "高橋 真帆", age: "-", size: "T.163 / Cup.F", img: "https://zexterior-aroma.com/images_staff/226/020117182460.jpeg" },
        { name: "早川 ゆき", age: "26", size: "T.160 / Cup.E", img: "https://zexterior-aroma.com/images_staff/188/03171454577.jpeg" },
        { name: "七瀬 凛々", age: "32", size: "T.160 / Cup.H", img: "https://zexterior-aroma.com/images_staff/223/120914401762.jpeg" },
        { name: "桜井 梨花", age: "27", size: "T.164 / Cup.D", img: "https://zexterior-aroma.com/images_staff/112/090814132765.jpeg" },
        { name: "楠木 芽依", age: "22", size: "T.147 / Cup.F", img: "https://zexterior-aroma.com/images_staff/95/021514455312.jpeg" },
        { name: "楪 れい", age: "28", size: "T.156 / Cup.G", img: "https://zexterior-aroma.com/images_staff/178/083117303958.jpeg" },
        { name: "柏木 ひより", age: "28", size: "T.153 / Cup.F", img: "https://zexterior-aroma.com/images_staff/208/083016132232.jpeg" },
        { name: "姫乃 澪", age: "27", size: "T.154 / Cup.D", img: "https://zexterior-aroma.com/images_staff/143/092913100394.jpeg" },
        { name: "峰山 結衣", age: "27", size: "T.168 / Cup.G", img: "https://zexterior-aroma.com/images_staff/115/083020033538.jpeg" },
        { name: "橘 花奈", age: "29", size: "T.152 / Cup.E", img: "https://zexterior-aroma.com/images_staff/183/120611355281.jpeg" },
        { name: "波多野 莉奈", age: "34", size: "T.157 / Cup.F", img: "https://zexterior-aroma.com/images_staff/206/090111481931.jpeg" },
        { name: "渚 弥生", age: "25", size: "T.161 / Cup.D", img: "https://zexterior-aroma.com/images_staff/144/112321114473.jpeg" },
        { name: "星崎 菜衣", age: "24", size: "T.157 / Cup.E", img: "https://zexterior-aroma.com/images_staff/174/100621593515.jpeg" },
        { name: "神楽 梨緒", age: "26", size: "T.150 / Cup.F", img: "https://zexterior-aroma.com/images_staff/229/022513095884.jpeg" },
        { name: "天使 姫華", age: "31", size: "T.170 / Cup.B", img: "https://zexterior-aroma.com/images_staff/196/11092337134.jpeg" },
        { name: "長谷川 真央", age: "29", size: "T.158 / Cup.H", img: "https://zexterior-aroma.com/images_staff/192/013111573963.jpeg" },
        { name: "杉原 成美", age: "22", size: "T.157 / Cup.D", img: "https://zexterior-aroma.com/images_staff/136/092213140538.jpeg" },
        { name: "ひろか", age: "26", size: "T.162 / Cup.G", img: "https://zexterior-aroma.com/images/no_image.jpg" },
        { name: "坂井 都", age: "23", size: "T.162 / Cup.G", img: "https://zexterior-aroma.com/images/no_image.jpg" },
        { name: "皇名 飛鳥", age: "26", size: "T.163 / Cup.G", img: "https://zexterior-aroma.com/images/no_image.jpg" },
        { name: "二宮 萌沙", age: "27", size: "T.160 / Cup.D", img: "https://zexterior-aroma.com/images/no_image.jpg" },
        { name: "久宝 由奈", age: "25", size: "T.160 / Cup.G", img: "https://zexterior-aroma.com/images/no_image.jpg" },
        { name: "蒼井 瑠菜", age: "26", size: "T.156 / Cup.D", img: "https://zexterior-aroma.com/images/no_image.jpg" },
        { name: "にこる", age: "31", size: "T.150 / Cup.F", img: "https://zexterior-aroma.com/images/no_image.jpg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから対象の2店舗を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    for (const shopDef of shopsData) {
      console.log(`\n===========================================`);
      console.log(`▶ 処理開始: 【 ${shopDef.searchKeywords[0]} 】関連`);
      
      const targetShops = allShops.filter(shop => {
        const n = shop.name.toLowerCase();
        return shopDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
      });

      if (targetShops.length === 0) {
        console.log(`⚠️ 店舗が見つかりませんでした。スキップします。`);
        continue;
      }

      for (const shop of targetShops) {
        console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            website_url: shopDef.website_url,
            schedule_url: shopDef.schedule_url,
            price_system: shopDef.price_system
          })
        });

        if (patchRes.ok) {
          console.log(`   ✅ 店舗基本情報の更新完了`);
        } else {
          console.error(`   ❌ 店舗基本情報の更新失敗: ${patchRes.statusText}`);
        }

        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;

        const uniqueCasts = Array.from(new Map(shopDef.casts.map(c => [c.name, c])).values());

        for (const cast of uniqueCasts) {
          let cleanName = cast.name.replace(/[\s　]+/g, ''); 
          const rawData = { age: cast.age, size: cast.size };

          const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

          if (existing) {
            await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
              method: 'PATCH',
              headers: headers,
              body: JSON.stringify({ 
                image_url: cast.img,
                raw_data: rawData
              })
            });
            updateCount++;
          } else {
            const newId = `${shop.id}_${cleanName}`;
            await fetch(`${url}/rest/v1/therapists`, {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
              body: JSON.stringify({
                id: newId,
                shop_id: shop.id,
                name: cleanName,
                image_url: cast.img,
                raw_data: rawData
              })
            });
            insertCount++;
          }
        }
        console.log(`   🎉 キャスト設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
      }
    }
    
    console.log(`\n🎊 すべての店舗の更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
