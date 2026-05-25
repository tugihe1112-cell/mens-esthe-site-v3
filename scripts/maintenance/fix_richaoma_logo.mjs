import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const SHOP_ID = 'aichi_sakae_rich_aroma';
const BASE = 'https://www.richaroma.nagoya';

// トップページからロゴを探す
const res = await fetch(BASE, { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

// ロゴ候補
let logoUrl = '';
$('img').each((_,el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  if (!logoUrl && /logo|Logo|brand/i.test(src + alt) && /\.(jpg|jpeg|png|webp)/i.test(src)) {
    logoUrl = src.startsWith('http') ? src : new URL(src, BASE).href;
  }
});

// フォールバック: 最初の画像
if (!logoUrl) {
  const firstImg = $('img').filter((_,el) => {
    const s = $(el).attr('src') || '';
    return /\.(jpg|jpeg|png|webp)/i.test(s);
  }).first().attr('src') || '';
  if (firstImg) logoUrl = firstImg.startsWith('http') ? firstImg : new URL(firstImg, BASE).href;
}

console.log(`ロゴURL: ${logoUrl}`);

if (logoUrl) {
  const imgRes = await fetch(logoUrl, { headers: ua });
  const ct = imgRes.headers.get('content-type') || '';
  const buf = Buffer.from(await imgRes.arrayBuffer());
  console.log(`画像: ${ct}, ${buf.length}bytes`);
  if (ct.startsWith('image/') && buf.length > 512) {
    const ext = (logoUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'png').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from('shop-logos')
      .upload(`${SHOP_ID}.${safeExt}`, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) {
      // Storage失敗 → 直接URLをセット
      const { error: dbErr } = await supabase.from('shops').update({ image_url: logoUrl }).eq('id', SHOP_ID);
      console.log(dbErr ? `❌ DB更新失敗` : `✅ 直接URL設定: ${logoUrl}`);
    } else {
      const publicUrl = supabase.storage.from('shop-logos').getPublicUrl(`${SHOP_ID}.${safeExt}`).data.publicUrl;
      const { error: dbErr } = await supabase.from('shops').update({ image_url: publicUrl }).eq('id', SHOP_ID);
      console.log(dbErr ? `❌ DB更新失敗` : `✅ shop画像修正: ${publicUrl.slice(0,60)}`);
    }
  }
} else {
  console.log('❌ ロゴ画像が見つかりません');
  // nullに戻す
  await supabase.from('shops').update({ image_url: null }).eq('id', SHOP_ID);
}
