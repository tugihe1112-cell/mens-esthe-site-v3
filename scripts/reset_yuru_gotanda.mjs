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
  const preferHeaders = { ...headers, 'Prefer': 'resolution=merge-duplicates' };

  const shopId = 'tokyo_shinagawa_gotanda_yuru_spa';

  console.log(`🧹 1. 間違った五反田店のキャスト（90名）をSupabaseから一度すべて削除します...`);
  await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}`, {
    method: 'DELETE',
    headers: headers
  });

  console.log(`✨ 2. HTML通りの「正しい27名」の完璧なデータを登録します...`);

  // HTMLから抽出した全く間違いのない27名のデータ
  const yuruRaw = `胡桃もえ,24,162,,213_1.webp,twitter:@mo11595\n小林えま,21,150,NEW,217_1.webp,\n七瀬りさ,,166,NEW,219_1.webp,\n黒田りいさ,25,147,,212_1.webp,twitter:@riisa_2510\n泉まお,29,163,,176_1.webp,twitter:@mao_yurusup\n桜井まりな,27,160,,46_1.webp,twitter:@yuru_marina\n荒木ゆうみ,33,163,,188_1.webp,twitter:@yu__ru__y\n優木りの,27,163,,214_1.webp,\n蒼井涼子,30,157,,211_1.webp,twitter:@ryoko6786\n真白つむぎ,26,166,,203_1.webp,twitter:@JbxQoiLZnd1581\n美山りりか,24,154,,207_1.webp,twitter:@yurumiyama\n別府ゆい,29,155,,210_1.webp,twitter:@tt8nfiooaa19062\n南はな,32,153,,199_1.webp,twitter:@yuru_minami_sub\n常磐あみ,27,158,,156_1.webp,twitter:@amiyuruspa\n諸星ラム,24,164,,190_1.webp,twitter:@yurumoroboshi\n宝生かなえ,,,,196_1.webp,twitter:@kanaev_v4\n桃瀬のあ,24,160,,195_1.webp,twitter:@mms_yrsp\n蜜川かりん,26,152,,67e3486d07fe5_1.webp,twitter:@yurusupa_karin\n篠原あい,27,160,,157_1.webp,twitter:@yuru_shino\n相原みほ,28,152,,173_1.webp,twitter:@AiharaMiho_\n月葉なぎ,21,160,,161_1.webp,twitter:@yurusupa_nagi\n女神らん,30,160,,136_1.webp,twitter:@yuruspa_ran\n小桜ゆうり,27,149,,166_1.webp,twitter:@koSakuraYuyuri\n如月りよ,28,157,,205_1.webp,twitter:@riyo__esthe\n松雪ひめの,24,169,,215_1.webp,twitter:@matsuyukihimeno\n宮瀬くるみ,,,,,\n水瀬れいら,22,,,,`;

  const newTherapistIds = [];
  let successCount = 0;

  const lines = yuruRaw.trim().split('\n');
  for (const line of lines) {
    const [name, age, T, tags, img, sns] = line.split(',');
    const cleanName = name.replace(/[\s　]+/g, '');
    const castId = `${shopId}_${cleanName}`;
    newTherapistIds.push(castId);

    const sizeStr = T ? `T.${T} / B.-(-) / W.- / H.-` : "";
    const payload = {
      id: castId,
      shop_id: shopId,
      name: cleanName,
      image_url: img ? `https://yuru-spa.com/gotanda/therapist_img/${img}` : "",
      raw_data: { age: age || "", size: sizeStr, T: T || "", sns: sns || "" }
    };

    const res = await fetch(`${url}/rest/v1/therapists`, {
      method: 'POST',
      headers: preferHeaders,
      body: JSON.stringify(payload)
    });
    if (res.ok) successCount++;
  }

  console.log(`🔗 3. 店舗データ (shops) の在籍リストを、この正しい27名に紐付け直します...`);
  await fetch(`${url}/rest/v1/shops?id=eq.${shopId}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify({ therapists: newTherapistIds })
  });

  console.log(`\n🎉 リセット＆修復完了！（登録成功: ${successCount}名）`);
  console.log(`👉 ブラウザをリロードして、「ゆるスパ 五反田店」を確認してください！`);
}

run();
