/**
 * こころのゆりかご (kokoronoyurikago-osaka.site) セラピスト挿入
 * 3days CMS - getTodayFormatDate スタブ付きで eval
 * 実行: node scripts/insert/insert_kokoronoyurikago_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_umeda_kokoronoyurikago';
const BASE_URL = 'https://kokoronoyurikago-osaka.site';

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const fileName = `${therapistId}.${ext}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) { return null; }
}

console.log(`[${SHOP_ID}] こころのゆりかご`);

try {
  // トップページからdata.jsのURLを探す
  const topHtml = await (await fetch(`${BASE_URL}/index.html`, { headers: ua, signal: AbortSignal.timeout(12000) })).text();

  // data.js URL検索 (複数パターン)
  let dataJsUrl = null;
  const patterns = [
    /src=["']([^"']*data\.js[^"']*)["']/,
    /src=["']([^"']*\/js\/[^"']*\.js[^"']*)["']/,
  ];
  for (const p of patterns) {
    const m = topHtml.match(p);
    if (m) {
      dataJsUrl = m[1].startsWith('http') ? m[1] : new URL(m[1], BASE_URL).href;
      break;
    }
  }

  // セラピストページへのリンクも確認
  const $ = cheerio.load(topHtml);
  let therapistPageUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/therapist|cast|lady|staff|girl|セラピスト|在籍/i.test(href + text) && !therapistPageUrl) {
      try { therapistPageUrl = href.startsWith('http') ? href : new URL(href, BASE_URL).href; } catch {}
    }
  });

  console.log(`data.js URL: ${dataJsUrl || '(なし)'}`);
  console.log(`セラピストページ: ${therapistPageUrl || '(なし)'}`);

  let therapists = [];

  // --- 方法1: data.js を eval ---
  if (dataJsUrl) {
    try {
      const dataJs = await (await fetch(dataJsUrl, { headers: ua, signal: AbortSignal.timeout(10000) })).text();
      console.log(`data.js 先頭200文字: ${dataJs.slice(0, 200)}`);

      const evalResult = {};

      // カスタム関数スタブ (getTodayFormatDate 等)
      const stubs = `
        function getTodayFormatDate(sep) { return ''; }
        function getFormatDate(d, sep) { return ''; }
        function formatDate(d) { return ''; }
        function getNowDate() { return ''; }
        function getSchedule() { return []; }
        function getScheduleData() { return []; }
        function getToday() { return ''; }
        function todayString() { return ''; }
        function dateFormat() { return ''; }
        function currentDate() { return ''; }
      `;

      // 変数名を捕捉するため var/const/let をラップ
      const wrappedCode = dataJs.replace(
        /^(?:var|const|let)\s+(\w+)\s*=/,
        (_, varName) => `evalResult["${varName}"] =`
      );

      new Function('evalResult', stubs + wrappedCode)(evalResult);
      const parsed = Object.values(evalResult)[0];

      if (parsed && Array.isArray(parsed)) {
        console.log(`data.js: ${parsed.length}名`);
        therapists = parsed.map(t => ({
          name: (t.therapistName || t.name || t.castName || '').trim(),
          imgSrc: t.img1 || t.img || t.image || t.photo || '',
          age: t.age ? parseInt(t.age) : null,
          height: t.height ? parseInt(t.height) : null,
          cup: (t.threeSize || t.bust || t.cup || '').match(/([A-J])(?:CUP|カップ)?/i)?.[1]?.toUpperCase() || null,
        })).filter(t => t.name.length >= 1);
      } else {
        console.log('data.js: 配列でない or 空 →', JSON.stringify(parsed).slice(0, 100));
      }
    } catch (e) {
      console.log(`data.js eval エラー: ${e.message}`);
    }
  }

  // --- 方法2: セラピストページから HTML スクレイピング ---
  if (therapists.length === 0 && therapistPageUrl) {
    console.log('HTMLスクレイピングを試みます...');
    try {
      const tHtml = await (await fetch(therapistPageUrl, { headers: ua, signal: AbortSignal.timeout(12000) })).text();
      const $t = cheerio.load(tHtml);

      // 複数のセレクターを試す
      const selectors = [
        'div.item:has(img)',
        'div.cast-item:has(img)',
        'article.cast:has(img)',
        'li:has(img)',
        'div.therapist:has(img)',
      ];

      for (const sel of selectors) {
        $t(sel).each((_, el) => {
          const $el = $t(el);
          const img = $el.find('img').first();
          const imgSrc = img.attr('data-src') || img.attr('data-lazy-src') || img.attr('src') || '';
          const text = $el.text().replace(/\s+/g, ' ').trim();
          const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{2,6})?)\s*[（(](\d{2,3})[)）]/);
          if (!nameMatch) return;
          const name = nameMatch[1].trim();
          const age = parseInt(nameMatch[2]);
          const heightMatch = text.match(/(?:T|身長)[.．:：]?\s*(\d{3})/);
          const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);
          therapists.push({ name, imgSrc, age, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
        });
        if (therapists.length > 0) { console.log(`セレクター "${sel}": ${therapists.length}名`); break; }
      }
    } catch (e) {
      console.log(`HTMLスクレイピングエラー: ${e.message}`);
    }
  }

  // --- 方法3: トップページのHTMLから直接 ---
  if (therapists.length === 0) {
    console.log('トップページHTMLを解析...');
    const $top = cheerio.load(topHtml);
    $top('img').each((_, el) => {
      const $img = $top(el);
      const src = $img.attr('src') || '';
      const alt = $img.attr('alt') || '';
      if (!src.match(/\.(jpg|jpeg|png|webp)/i)) return;
      if (/logo|banner|icon|top|bg|btn|arrow/i.test(src + alt)) return;
      const parent = $img.closest('li, div, article').first();
      const text = parent.text().replace(/\s+/g, ' ').trim();
      const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯]{2,8})\s*[（(](\d{2,3})[)）]/);
      if (!nameMatch) return;
      therapists.push({
        name: nameMatch[1].trim(),
        imgSrc: src.startsWith('http') ? src : new URL(src, BASE_URL).href,
        age: parseInt(nameMatch[2]),
        height: null,
        cup: null,
      });
    });
    console.log(`トップページ: ${therapists.length}名`);
  }

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`\n取得合計: ${unique.length}名`);
  unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height}, ${t.cup}カップ)`));

  if (unique.length === 0) {
    console.log('❌ セラピストが取得できませんでした');
    process.exit(1);
  }

  let inserted = 0;
  for (const t of unique) {
    const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const imgUrl = t.imgSrc ? (t.imgSrc.startsWith('http') ? t.imgSrc : new URL(t.imgSrc, BASE_URL).href) : null;
    const storedUrl = imgUrl ? await uploadImage(imgUrl, therapistId) : null;
    const { error } = await supabase.from('therapists').upsert({
      id: therapistId, shop_id: SHOP_ID, name: t.name,
      age: t.age, height: t.height, cup: t.cup,
      image_url: storedUrl || imgUrl || null,
    });
    if (error) console.log(`  挿入エラー: ${error.message}`);
    else { inserted++; process.stdout.write('.'); }
  }
  console.log(`\n✅ ${inserted}名挿入完了`);

} catch (e) {
  console.log(`❌ ${e.message}`);
}
