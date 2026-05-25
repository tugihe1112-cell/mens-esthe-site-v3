/**
 * Tigger ロゴ CSS 背景画像を探す
 * 実行: node scripts/debug/find_tigger_logo.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';

const SITE = 'https://tigger-esthe.com';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

  // トップページから CSS リンクを収集
  const topRes = await fetch(SITE, { headers: ua });
  const $ = cheerio.load(await topRes.text());

  const cssUrls = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href) cssUrls.push(href.startsWith('http') ? href : `${SITE}${href}`);
  });

  // <style> タグ内もチェック
  const inlineStyles = [];
  $('style').each((_, el) => inlineStyles.push($(el).text()));

  console.log(`CSS ファイル数: ${cssUrls.length}`);

  // 各 CSS ファイルから header2-container の background を探す
  let logoUrl = null;
  for (const cssUrl of cssUrls) {
    try {
      const cssRes = await fetch(cssUrl, { headers: ua });
      const css = await cssRes.text();

      // header2-container の background-image
      const m = css.match(/header2-container[^{]*\{[^}]*background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+)/);
      if (m) {
        logoUrl = m[1].startsWith('http') ? m[1] : `${SITE}${m[1]}`;
        console.log(`✅ ロゴ発見: ${logoUrl} (${cssUrl.slice(0, 80)})`);
        break;
      }

      // broader search for caskan or tigger images in CSS
      const imgMatches = [...css.matchAll(/url\(['"]?(https?:\/\/[^'")\s]+(?:logo|header|top)[^'")\s]*)/gi)];
      imgMatches.forEach(m2 => console.log(`  候補: ${m2[1]}`));
    } catch (e) {
      console.log(`  ❌ ${cssUrl.slice(0, 60)}: ${e.message}`);
    }
  }

  // inline style もチェック
  for (const style of inlineStyles) {
    const m = style.match(/header2-container[^{]*\{[^}]*background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+)/);
    if (m) {
      logoUrl = m[1].startsWith('http') ? m[1] : `${SITE}${m[1]}`;
      console.log(`✅ ロゴ発見（インライン）: ${logoUrl}`);
    }
  }

  if (!logoUrl) {
    console.log('\n❌ ロゴが見つかりませんでした');
    console.log('Chrome DevTools で .header2-container の background-image を確認してください');
    return;
  }

  // アップロード
  const imgRes = await fetch(logoUrl, { headers: ua });
  if (!imgRes.ok) { console.log(`ロゴ取得失敗: ${imgRes.status}`); return; }
  const blob = await imgRes.arrayBuffer();
  const ext = logoUrl.split('.').pop().split('?')[0] || 'png';
  const fileName = `kanagawa_kawasaki_tigger.${ext}`;
  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/shop-logos/${fileName}`, {
    method: 'POST',
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': `image/${ext === 'jpg' ? 'jpeg' : ext}`, 'x-upsert': 'true' },
    body: blob,
  });
  if (!uploadRes.ok) { console.log(`アップロード失敗: ${await uploadRes.text()}`); return; }

  const logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${fileName}`;
  console.log(`\nロゴアップロード ✅: ${logoPublicUrl}`);

  // 3店舗に設定
  const headers2 = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
  for (const shopId of ['kanagawa_kawasaki_mizonokuchi_jesse', 'kanagawa_kawasaki_musashikosugi_jesse', 'kanagawa_kawasaki_noborito_jesse']) {
    const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${shopId}`, {
      method: 'PATCH', headers: headers2, body: JSON.stringify({ image_url: logoPublicUrl }),
    });
    console.log(`  ${shopId}: ${r.ok ? '✅' : '❌'}`);
  }
}

run().catch(e => console.error('❌', e.message));
