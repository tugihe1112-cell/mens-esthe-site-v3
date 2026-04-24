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

  console.log(`🚀 ローカルのフルデータを使って、全員分の写真とサイズをDBに上書きします...`);

  try {
    // 1. ローカルの完全な図鑑データを読み込む
    const therapistsRaw = JSON.parse(fs.readFileSync('public/data/therapists.json', 'utf8'));
    const allTherapists = Array.isArray(therapistsRaw) ? therapistsRaw : therapistsRaw.therapists;

    const targetShopIds = [
      'tokyo_shinagawa_gotanda_yuru_spa',
      'tokyo_setagaya_futakotamagawa_mens_esthe_group'
    ];

    for (const shopId of targetShopIds) {
      // その店舗の全キャストを抽出
      const casts = allTherapists.filter(t => t.shop_id === shopId || t.shopId === shopId || t.id.startsWith(shopId));
      console.log(`\n📝 ${shopId}: ${casts.length} 名のデータを整形・送信中...`);

      let successCount = 0;
      let errorCount = 0;

      for (const cast of casts) {
        // ① 画像URLの補完（httpがない場合はドメインを付与）
        let imgUrl = cast.image_url || cast.image || cast.img || cast.profile_image || "";
        if (imgUrl && !imgUrl.startsWith('http')) {
          const cleanImg = imgUrl.replace(/^\/+/, '');
          if (shopId.includes('yuru_spa')) {
            imgUrl = `https://yuru-spa.com/gotanda/therapist_img/${cleanImg}`;
          } else {
            imgUrl = `https://www.futakotamagawa-mens-esthe.com/wp-content/uploads/2026/04/${cleanImg}`;
          }
        }

        // ② サイズデータの最適化（フロントエンドがどの形式でも読めるように全部入りにする）
        const tVal = cast.T || (cast.raw_data && cast.raw_data.T) || "";
        const bVal = cast.B || (cast.raw_data && cast.raw_data.B) || "";
        const ageVal = cast.age || (cast.raw_data && cast.raw_data.age) || "";
        
        // 旧形式（Nocturne用）と新形式（T, B個別）の両方をセット
        const sizeStr = `T.${tVal || '-'} / B.${bVal || '-'}(-) / W.- / H.-`;

        const payload = {
          image_url: imgUrl,
          raw_data: {
            age: ageVal,
            size: sizeStr,
            T: tVal,
            B: bVal,
            W: cast.W || "",
            H: cast.H || "",
            sns: cast.sns || ""
          }
        };

        // ③ SupabaseにPATCH（変更部分のみ上書き）
        const res = await fetch(`${url}/rest/v1/therapists?id=eq.${cast.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          successCount++;
        } else {
          console.error(`❌ ${cast.name} の更新エラー:`, await res.text());
          errorCount++;
        }
      }
      console.log(`✅ 更新完了（成功: ${successCount}名 / 失敗: ${errorCount}名）`);
    }

    console.log(`\n🎉 すべてのデータ修正が完了しました！ブラウザをリロードしてください。`);

  } catch (e) {
    console.error("❌ エラーが発生しました:", e.message);
  }
}

run();
