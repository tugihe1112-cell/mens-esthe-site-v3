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
    console.log("⏳ AROMA TIAMO と Rise～リゼ～ の店舗IDを取得中...");
    const shopRes = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*ティアモ*,name.ilike.*Rise*)&select=id,name`, { headers });
    const shops = await shopRes.json();

    const tiamoShops = shops.filter(s => s.name.includes("TIAMO") || s.name.includes("ティアモ"));
    const riseShops = shops.filter(s => s.name.includes("Rise") || s.name.includes("リゼ"));

    // ==========================================
    // 🌟 AROMA TIAMO (トップページから取得)
    // ==========================================
    if (tiamoShops.length > 0) {
      console.log("\n🌐 AROMA TIAMO の公式サイト(トップページ)から情報を取得中...");
      const response = await fetch('https://www.aroma-tiamo.com/');
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        let tiamoTherapists = [];

        $('.list-staff li').each((i, el) => {
          let name = $(el).find('.cinfo > a').text().trim();
          if (!name) return;
          name = name.split('(')[0].trim();

          const ageText = $(el).find('.p_profile').text();
          const ageMatch = ageText.match(/(\d+)\s*歳/);
          let ageValue = ageMatch ? parseInt(ageMatch[1], 10) : null;

          const styleAttr = $(el).find('.photo img').attr('style') || "";
          const bgMatch = styleAttr.match(/url\(['"]?(.*?)['"]?\)/);
          let image_url = bgMatch ? bgMatch[1] : "";

          if (image_url && !image_url.startsWith('http')) {
            image_url = `https://www.aroma-tiamo.com${image_url.startsWith('/') ? '' : '/'}${image_url}`;
          }

          if (name && image_url) {
            tiamoTherapists.push({ name, age: isNaN(ageValue) ? null : ageValue, image_url });
          }
        });

        console.log(`✅ AROMA TIAMO: ${tiamoTherapists.length}名のセラピストを抽出しました！`);

        for (const shop of tiamoShops) {
          if (tiamoTherapists.length === 0) continue;
          await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });
          const insertData = tiamoTherapists.map(t => ({
            name: t.name, age: t.age, image_url: t.image_url, shop_id: shop.id, id: `${shop.id}_${t.name}_${Math.random().toString(36).substr(2, 5)}`
          }));
          const res = await fetch(`${url}/rest/v1/therapists`, { method: 'POST', headers, body: JSON.stringify(insertData) });
          if (res.ok) console.log(`✅ ${shop.name} への投入完了！`);
        }
      }
    }

    // ==========================================
    // 🌟 Rise～リゼ～ (トップページから取得)
    // ==========================================
    if (riseShops.length > 0) {
      console.log("\n🌐 Rise～リゼ～ の公式サイト(トップページ)から情報を取得中...");
      const response = await fetch('https://rise-aroma.com/');
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        let riseTherapists = [];

        $('.staff').each((i, el) => {
          const name = $(el).find('p').text().trim();
          let image_url = $(el).find('img').attr('src') || "";
          
          if (image_url.startsWith('./')) {
            image_url = image_url.substring(1);
          }
          if (image_url && !image_url.startsWith('http')) {
            image_url = `https://rise-aroma.com${image_url}`;
          }

          if (name && image_url) {
            riseTherapists.push({ name, age: null, image_url });
          }
        });

        console.log(`✅ Rise～リゼ～: ${riseTherapists.length}名のセラピストを抽出しました！`);

        for (const shop of riseShops) {
          if (riseTherapists.length === 0) continue;
          await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });
          const insertData = riseTherapists.map(t => ({
            name: t.name, age: t.age, image_url: t.image_url, shop_id: shop.id, id: `${shop.id}_${t.name}_${Math.random().toString(36).substr(2, 5)}`
          }));
          const res = await fetch(`${url}/rest/v1/therapists`, { method: 'POST', headers, body: JSON.stringify(insertData) });
          if (res.ok) console.log(`✅ ${shop.name} への投入完了！`);
        }
      }
    }

    console.log("\n🎉 セラピスト画像の取得と投入が完全に完了しました！");
  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
