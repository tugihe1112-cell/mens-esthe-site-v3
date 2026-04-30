import fs from 'fs';
import * as cheerio from 'cheerio';

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
    console.log("⏳ AROMA TIAMOの店舗IDを取得中...");
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*ティアモ*&select=id,name`, { headers });
    const tiamoShops = await shopRes.json();

    if (!tiamoShops || tiamoShops.length === 0) {
      console.log("❌ 店舗が見つかりませんでした。");
      return;
    }

    console.log("🌐 いただいたHTMLデータからセラピスト情報を解析中...");

    // 岡林さんからいただいたHTMLデータを直接埋め込み（確実な抽出のため）
    const rawHtml = `
      <ul class="list-staff">
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2686/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2686.jpeg)" class="img-fluid" alt="深田かすみさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2686/">深田かすみ</a><div class="p_profile">22歳 <span class="sizeC">T</span>.157<br> <span class="sizeC">B</span>.87(F) <span class="sizeC">W</span>.55 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2721/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2721.jpeg)" class="img-fluid" alt="水城なぎさ(みずしろさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2721/">水城なぎさ(みずしろ</a><div class="p_profile">25歳 <span class="sizeC">T</span>.152<br> <span class="sizeC">B</span>.83(D) <span class="sizeC">W</span>.55 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/551/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_551.jpeg)" class="img-fluid" alt="月野つぐみさんの写真"></a><div class="cinfo"><a href="/profile/_uid/551/">月野つぐみ</a><div class="p_profile">27歳 <span class="sizeC">T</span>.160<br> <span class="sizeC">B</span>.87(F) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2650/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2650.jpeg)" class="img-fluid" alt="小倉さやかさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2650/">小倉さやか</a><div class="p_profile">24歳 <span class="sizeC">T</span>.153<br> <span class="sizeC">B</span>.90(G) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.86</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2740/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2740.jpeg)" class="img-fluid" alt="白石ゆんさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2740/">白石ゆん</a><div class="p_profile">24歳 <span class="sizeC">T</span>.160<br> <span class="sizeC">B</span>.85(E) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2461/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2461.jpeg)" class="img-fluid" alt="瀬尾みづきさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2461/">瀬尾みづき</a><div class="p_profile">23歳 <span class="sizeC">T</span>.159<br> <span class="sizeC">B</span>.86(E) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3466/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3466.jpeg)" class="img-fluid" alt="夜空うたさんの写真"></a><div class="cinfo"><a href="/profile/_uid/3466/">夜空うた</a><div class="p_profile">26歳 <span class="sizeC">T</span>.162<br> <span class="sizeC">B</span>.84(E) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4066/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4066.jpeg)" class="img-fluid" alt="山口つばめさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4066/">山口つばめ</a><div class="p_profile">22歳 <span class="sizeC">T</span>.160<br> <span class="sizeC">B</span>.88(F) <span class="sizeC">W</span>.58 <span class="sizeC">H</span>.86</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3898/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3898.jpeg)" class="img-fluid" alt="春風つくしさんの写真"></a><div class="cinfo"><a href="/profile/_uid/3898/">春風つくし</a><div class="p_profile">23歳 <span class="sizeC">T</span>.155<br> <span class="sizeC">B</span>.83(D) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/1410/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_1410.jpeg)" class="img-fluid" alt="大塚ななみさんの写真"></a><div class="cinfo"><a href="/profile/_uid/1410/">大塚ななみ</a><div class="p_profile">24歳 <span class="sizeC">T</span>.154<br> <span class="sizeC">B</span>.83(D) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/502/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_502.jpeg)" class="img-fluid" alt="藤嶋なつみさんの写真"></a><div class="cinfo"><a href="/profile/_uid/502/">藤嶋なつみ</a><div class="p_profile">25歳 <span class="sizeC">T</span>.154<br> <span class="sizeC">B</span>.92(H) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.85</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3065/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3065.jpeg)" class="img-fluid" alt="紗倉ゆい(さくら)さんの写真"></a><div class="cinfo"><a href="/profile/_uid/3065/">紗倉ゆい(さくら)</a><div class="p_profile">23歳 <span class="sizeC">T</span>.154<br> <span class="sizeC">B</span>.84(E) <span class="sizeC">W</span>.55 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3374/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3374.jpeg)" class="img-fluid" alt="五十嵐なおさんの写真"></a><div class="cinfo"><a href="/profile/_uid/3374/">五十嵐なお</a><div class="p_profile">24歳 <span class="sizeC">T</span>.158<br> <span class="sizeC">B</span>.84(E) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4061/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4061.jpeg)" class="img-fluid" alt="石井りずさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4061/">石井りず</a><div class="p_profile">25歳 <span class="sizeC">T</span>.163<br> <span class="sizeC">B</span>.84(D) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4123/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4123.jpeg)" class="img-fluid" alt="芦田はなさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4123/">芦田はな</a><div class="p_profile">23歳 <span class="sizeC">T</span>.155<br> <span class="sizeC">B</span>.86(F) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.85</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4164/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4164.jpeg)" class="img-fluid" alt="白雪いおりさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4164/">白雪いおり</a><div class="p_profile">20歳 <span class="sizeC">T</span>.162<br> <span class="sizeC">B</span>.83(D) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3066/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3066.jpeg)" class="img-fluid" alt="相澤れなさんの写真"></a><div class="cinfo"><a href="/profile/_uid/3066/">相澤れな</a><div class="p_profile">26歳 <span class="sizeC">T</span>.166<br> <span class="sizeC">B</span>.86(F) <span class="sizeC">W</span>.55 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4075/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4075.jpeg)" class="img-fluid" alt="華咲めぐさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4075/">華咲めぐ</a><div class="p_profile">25歳 <span class="sizeC">T</span>.163<br> <span class="sizeC">B</span>.85(C) <span class="sizeC">W</span>.58 <span class="sizeC">H</span>.86</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4078/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4078.png)" class="img-fluid" alt="市川くるみさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4078/">市川くるみ</a><div class="p_profile">24歳 <span class="sizeC">T</span>.160<br> <span class="sizeC">B</span>.88(F) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.85</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4081/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4081.png)" class="img-fluid" alt="椿あやめさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4081/">椿あやめ</a><div class="p_profile">23歳 <span class="sizeC">T</span>.148<br> <span class="sizeC">B</span>.88(E) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4082/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4082.png)" class="img-fluid" alt="佐倉みこさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4082/">佐倉みこ</a><div class="p_profile">24歳 <span class="sizeC">T</span>.154<br> <span class="sizeC">B</span>.83(C) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4084/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4084.jpeg)" class="img-fluid" alt="北川ゆりさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4084/">北川ゆり</a><div class="p_profile">23歳 <span class="sizeC">T</span>.166<br> <span class="sizeC">B</span>.88(F) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3867/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3867.jpeg)" class="img-fluid" alt="河合つかささんの写真"></a><div class="cinfo"><a href="/profile/_uid/3867/">河合つかさ</a><div class="p_profile">23歳 <span class="sizeC">T</span>.171<br> <span class="sizeC">B</span>.83(C) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4092/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4092.jpeg)" class="img-fluid" alt="西園寺りんさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4092/">西園寺りん</a><div class="p_profile">25歳 <span class="sizeC">T</span>.148<br> <span class="sizeC">B</span>.90(H) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.88</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2084/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2084.jpeg)" class="img-fluid" alt="向井りょうさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2084/">向井りょう</a><div class="p_profile">24歳 <span class="sizeC">T</span>.160<br> <span class="sizeC">B</span>.97(I) <span class="sizeC">W</span>.59 <span class="sizeC">H</span>.86</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3083/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3083.jpeg)" class="img-fluid" alt="宮下りほさんの写真"></a><div class="cinfo"><a href="/profile/_uid/3083/">宮下りほ</a><div class="p_profile">24歳 <span class="sizeC">T</span>.168<br> <span class="sizeC">B</span>.84(E) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2683/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2683.jpeg)" class="img-fluid" alt="蒼井るなさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2683/">蒼井るな</a><div class="p_profile">25歳 <span class="sizeC">T</span>.162<br> <span class="sizeC">B</span>.88(F) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4095/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4095.jpeg)" class="img-fluid" alt="雪平こゆきさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4095/">雪平こゆき</a><div class="p_profile">26歳 <span class="sizeC">T</span>.159<br> <span class="sizeC">B</span>.85(D) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.87</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4113/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4113.jpeg)" class="img-fluid" alt="東堂あやさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4113/">東堂あや</a><div class="p_profile">26歳 <span class="sizeC">T</span>.158<br> <span class="sizeC">B</span>.84(D) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4155/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4155.jpeg)" class="img-fluid" alt="朝倉ゆらさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4155/">朝倉ゆら</a><div class="p_profile">20歳 <span class="sizeC">T</span>.162<br> <span class="sizeC">B</span>.98(I) <span class="sizeC">W</span>.58 <span class="sizeC">H</span>.86</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3208/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3208.jpeg)" class="img-fluid" alt="新島こころ(にいじまさんの写真"></a><div class="cinfo"><a href="/profile/_uid/3208/">新島こころ(にいじま</a><div class="p_profile">25歳 <span class="sizeC">T</span>.166<br> <span class="sizeC">B</span>.84(D) <span class="sizeC">W</span>.55 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4127/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4127.jpeg)" class="img-fluid" alt="南りんさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4127/">南りん</a><div class="p_profile">22歳 <span class="sizeC">T</span>.150<br> <span class="sizeC">B</span>.88(F) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.85</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4097/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4097.jpeg)" class="img-fluid" alt="松嶋ななさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4097/">松嶋なな</a><div class="p_profile">25歳 <span class="sizeC">T</span>.155<br> <span class="sizeC">B</span>.85(D) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.87</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4089/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4089.jpeg)" class="img-fluid" alt="沢尻こころさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4089/">沢尻こころ</a><div class="p_profile">21歳 <span class="sizeC">T</span>.160<br> <span class="sizeC">B</span>.86(D) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.87</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4058/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4058.jpeg)" class="img-fluid" alt="橘かれんさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4058/">橘かれん</a><div class="p_profile">23歳 <span class="sizeC">T</span>.157<br> <span class="sizeC">B</span>.84(E) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4144/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4144.jpeg)" class="img-fluid" alt="西さおりさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4144/">西さおり</a><div class="p_profile">22歳 <span class="sizeC">T</span>.152<br> <span class="sizeC">B</span>.90(G) <span class="sizeC">W</span>.58 <span class="sizeC">H</span>.85</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2208/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2208.jpeg)" class="img-fluid" alt="神田みくさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2208/">神田みく</a><div class="p_profile">20歳 <span class="sizeC">T</span>.160<br> <span class="sizeC">B</span>.92(G) <span class="sizeC">W</span>.58 <span class="sizeC">H</span>.85</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3830/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3830.jpeg)" class="img-fluid" alt="花咲ももさんの写真"></a><div class="cinfo"><a href="/profile/_uid/3830/">花咲もも</a><div class="p_profile">22歳 <span class="sizeC">T</span>.155<br> <span class="sizeC">B</span>.87(F) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3784/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3784.jpeg)" class="img-fluid" alt="姫乃あんさんの写真"></a><div class="cinfo"><a href="/profile/_uid/3784/">姫乃あん</a><div class="p_profile">22歳 <span class="sizeC">T</span>.160<br> <span class="sizeC">B</span>.84(E) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3728/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3728.jpeg)" class="img-fluid" alt="高坂みな(タカサカ)さんの写真"></a><div class="cinfo"><a href="/profile/_uid/3728/">高坂みな(タカサカ)</a><div class="p_profile">21歳 <span class="sizeC">T</span>.152<br> <span class="sizeC">B</span>.85(E) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3835/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3835.jpeg)" class="img-fluid" alt="永瀬みおさんの写真"></a><div class="cinfo"><a href="/profile/_uid/3835/">永瀬みお</a><div class="p_profile">21歳 <span class="sizeC">T</span>.163<br> <span class="sizeC">B</span>.84(D) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4099/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4099.jpeg)" class="img-fluid" alt="広瀬ももさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4099/">広瀬もも</a><div class="p_profile">21歳 <span class="sizeC">T</span>.166<br> <span class="sizeC">B</span>.92(H) <span class="sizeC">W</span>.59 <span class="sizeC">H</span>.90</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4139/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4139.jpeg)" class="img-fluid" alt="天使そら(あまつか)さんの写真"></a><div class="cinfo"><a href="/profile/_uid/4139/">天使そら(あまつか)</a><div class="p_profile">24歳 <span class="sizeC">T</span>.164<br> <span class="sizeC">B</span>.83(D) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2460/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2460.jpeg)" class="img-fluid" alt="伊藤みきさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2460/">伊藤みき</a><div class="p_profile">25歳 <span class="sizeC">T</span>.158<br> <span class="sizeC">B</span>.82(C) <span class="sizeC">W</span>.55 <span class="sizeC">H</span>.80</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4118/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4118.jpeg)" class="img-fluid" alt="湊しゅうか(みなと)さんの写真"></a><div class="cinfo"><a href="/profile/_uid/4118/">湊しゅうか(みなと)</a><div class="p_profile">24歳 <span class="sizeC">T</span>.158<br> <span class="sizeC">B</span>.87(E) <span class="sizeC">W</span>.58 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/3332/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_3332.jpeg)" class="img-fluid" alt="吉川あずささんの写真"></a><div class="cinfo"><a href="/profile/_uid/3332/">吉川あずさ</a><div class="p_profile">25歳 <span class="sizeC">T</span>.156<br> <span class="sizeC">B</span>.89(G) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2120/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2120.jpeg)" class="img-fluid" alt="知念あんなさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2120/">知念あんな</a><div class="p_profile">27歳 <span class="sizeC">T</span>.160<br> <span class="sizeC">B</span>.90(G) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/1846/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_1846.jpeg)" class="img-fluid" alt="桜井はなさんの写真"></a><div class="cinfo"><a href="/profile/_uid/1846/">桜井はな</a><div class="p_profile">23歳 <span class="sizeC">T</span>.153<br> <span class="sizeC">B</span>.83(C) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4120/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4120.jpeg)" class="img-fluid" alt="藤咲ななさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4120/">藤咲なな</a><div class="p_profile">23歳 <span class="sizeC">T</span>.168<br> <span class="sizeC">B</span>.89(G) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.86</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/2949/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_2949.jpeg)" class="img-fluid" alt="松村みおさんの写真"></a><div class="cinfo"><a href="/profile/_uid/2949/">松村みお</a><div class="p_profile">22歳 <span class="sizeC">T</span>.154<br> <span class="sizeC">B</span>.92(H) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4187/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4187.jpeg)" class="img-fluid" alt="月島きらりさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4187/">月島きらり</a><div class="p_profile">21歳 <span class="sizeC">T</span>.155<br> <span class="sizeC">B</span>.84(D) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4182/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4182.jpeg)" class="img-fluid" alt="雨名みる(あめな)さんの写真"></a><div class="cinfo"><a href="/profile/_uid/4182/">雨名みる(あめな)</a><div class="p_profile">23歳 <span class="sizeC">T</span>.159<br> <span class="sizeC">B</span>.83(D) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4180/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4180.jpeg)" class="img-fluid" alt="若松コウさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4180/">若松コウ</a><div class="p_profile">24歳 <span class="sizeC">T</span>.167<br> <span class="sizeC">B</span>.84(D) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4185/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4185.jpeg)" class="img-fluid" alt="桐谷りんかさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4185/">桐谷りんか</a><div class="p_profile">20歳 <span class="sizeC">T</span>.164<br> <span class="sizeC">B</span>.84(D) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.82</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4220/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4220.jpeg)" class="img-fluid" alt="優木かえでさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4220/">優木かえで</a><div class="p_profile">26歳 <span class="sizeC">T</span>.164<br> <span class="sizeC">B</span>.84(E) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4227/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4227.jpeg)" class="img-fluid" alt="糸賀もも(いとが)さんの写真"></a><div class="cinfo"><a href="/profile/_uid/4227/">糸賀もも(いとが)</a><div class="p_profile">19歳 <span class="sizeC">T</span>.164<br> <span class="sizeC">B</span>.89(G) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.85</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4236/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4236.jpeg)" class="img-fluid" alt="宮野りおさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4236/">宮野りお</a><div class="p_profile">21歳 <span class="sizeC">T</span>.155<br> <span class="sizeC">B</span>.85(E) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4247/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4247.jpeg)" class="img-fluid" alt="京野りたさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4247/">京野りた</a><div class="p_profile">24歳 <span class="sizeC">T</span>.157<br> <span class="sizeC">B</span>.85(E) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.83</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4248/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4248.jpeg)" class="img-fluid" alt="森永なりもさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4248/">森永なりも</a><div class="p_profile">24歳 <span class="sizeC">T</span>.155<br> <span class="sizeC">B</span>.86(E) <span class="sizeC">W</span>.57 <span class="sizeC">H</span>.84</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4265/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4265.jpeg)" class="img-fluid" alt="百瀬ひより(ももせ)さんの写真"></a><div class="cinfo"><a href="/profile/_uid/4265/">百瀬ひより(ももせ)</a><div class="p_profile">25歳 <span class="sizeC">T</span>.155<br> <span class="sizeC">B</span>.87(D) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.88</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4275/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4275.jpeg)" class="img-fluid" alt="水谷みおさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4275/">水谷みお</a><div class="p_profile">25歳 <span class="sizeC">T</span>.161<br> <span class="sizeC">B</span>.90(G) <span class="sizeC">W</span>.58 <span class="sizeC">H</span>.85</div></div></div></div></li>
        <li class="col-6 col-md-3 col-sm-4"><div class="item"><div class="photo"><a href="/profile/_uid/4279/"><img src="/asset/img/spacer300x450.png" style="background-image: url(/images/ml_11_1_4279.jpeg)" class="img-fluid" alt="瀬戸つむぎさんの写真"></a><div class="cinfo"><a href="/profile/_uid/4279/">瀬戸つむぎ</a><div class="p_profile">26歳 <span class="sizeC">T</span>.156<br> <span class="sizeC">B</span>.82(C) <span class="sizeC">W</span>.56 <span class="sizeC">H</span>.81</div></div></div></div></li>
      </ul>
    `;

    const $ = cheerio.load(rawHtml);
    let bestTherapists = [];

    $('.list-staff li').each((i, el) => {
      // 名前の抽出
      let name = $(el).find('.cinfo a').first().text().trim();
      if (!name) return;
      name = name.split('(')[0].trim(); // カッコを除去

      // プロフィール文字列の抽出 (例: "22歳 T.157 B.87(F) W.55 H.83")
      const profileText = $(el).find('.p_profile').text();
      
      // 年齢
      const ageMatch = profileText.match(/(\d+)歳/);
      let ageValue = ageMatch ? parseInt(ageMatch[1], 10) : null;

      // 身長 (T)
      const tMatch = profileText.match(/T\.(\d+)/);
      let heightValue = tMatch ? parseInt(tMatch[1], 10) : null;

      // バストとカップ数 (B.87(F))
      const bMatch = profileText.match(/B\.(\d+)(?:\(([A-Z])\))?/);
      let bustValue = bMatch ? parseInt(bMatch[1], 10) : null;
      let cupValue = bMatch && bMatch[2] ? bMatch[2] : null;

      // ウエスト (W)
      const wMatch = profileText.match(/W\.(\d+)/);
      let waistValue = wMatch ? parseInt(wMatch[1], 10) : null;

      // ヒップ (H)
      const hMatch = profileText.match(/H\.(\d+)/);
      let hipValue = hMatch ? parseInt(hMatch[1], 10) : null;

      // 画像URLの抽出
      const styleAttr = $(el).find('.photo img').attr('style') || "";
      const bgMatch = styleAttr.match(/url\(['"]?(.*?)['"]?\)/);
      let image_url = bgMatch ? bgMatch[1] : "";

      if (image_url && !image_url.startsWith('http')) {
        image_url = `https://www.aroma-tiamo.com${image_url.startsWith('/') ? '' : '/'}${image_url}`;
      }

      if (name && image_url && !image_url.includes('spacer')) {
        bestTherapists.push({ 
          name, 
          age: ageValue, 
          height: heightValue,
          bust: bustValue,
          cup: cupValue,
          waist: waistValue,
          hip: hipValue,
          image_url 
        });
      }
    });

    console.log(`✅ ${bestTherapists.length}名のセラピストの詳細データを抽出しました！`);

    for (const shop of tiamoShops) {
      if (bestTherapists.length === 0) break;
      console.log(`\n⏳ ${shop.name} へデータを投入中...`);
      
      // 既存データの削除
      await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });
      
      // データ送信形式の整形
      const insertData = bestTherapists.map(t => ({
        name: t.name, 
        age: t.age, 
        height: t.height,
        bust: t.bust,
        cup: t.cup,
        waist: t.waist,
        hip: t.hip,
        image_url: t.image_url, 
        shop_id: shop.id, 
        id: `${shop.id}_${t.name}_${Math.random().toString(36).substr(2, 5)}`
      }));

      const res = await fetch(`${url}/rest/v1/therapists`, { method: 'POST', headers, body: JSON.stringify(insertData) });
      
      if (res.ok) {
        console.log(`✅ ${shop.name} への投入完了！`);
      } else {
        const errText = await res.text();
        console.error(`❌ 投入失敗: ${errText}`);
        if (errText.includes('PGRST205') || errText.includes('column')) {
          console.log(`\n⚠️ データベース（therapistsテーブル）に「height」「bust」「cup」「waist」「hip」のいずれかのカラムが存在しないため弾かれました！`);
        }
      }
    }

    console.log("\n🎉 AROMA TIAMOの完全版キャストデータの処理が完了しました！");
  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
