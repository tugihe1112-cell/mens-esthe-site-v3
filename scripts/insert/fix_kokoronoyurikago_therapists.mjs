/**
 * こころのゆりかご 修正版
 * therapists.html ページから直接スクレイピング
 * data.js の shopData オブジェクト内のセラピスト配列も探索
 * 実行: node scripts/insert/fix_kokoronoyurikago_therapists.mjs
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

console.log(`[${SHOP_ID}] こころのゆりかご 修正版`);

let therapists = [];

// ========== 方法1: data.js の shopData 内を探索 ==========
try {
  const dataJsUrl = `${BASE_URL}/assets/js/data.js`;
  const dataJs = await (await fetch(dataJsUrl, { headers: ua, signal: AbortSignal.timeout(10000) })).text();
  console.log('data.js 先頭400文字:', dataJs.slice(0, 400));

  // shopData の中身全体を eval で取得
  const evalResult = {};
  const stubs = `
    function getTodayFormatDate(sep) { return '2024-01-01'; }
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

  try {
    // shopData を evalResult に入れる
    const wrappedCode = dataJs
      .replace(/^const\s+\w+\s*=\s*[^;]+;\s*/m, '') // curentDate 宣言を除去
      .replace(/^var\s+(shopData)\s*=/, (_, v) => `evalResult["${v}"] =`)
      .replace(/^const\s+(\w+)\s*=/, (_, v) => `evalResult["${v}"] =`);

    new Function('evalResult', stubs + wrappedCode)(evalResult);
    const shopData = evalResult['shopData'];
    console.log('shopData keys:', shopData ? Object.keys(shopData).join(', ') : 'null');

    if (shopData) {
      // shopData 内の配列を再帰的に探索
      function findArrays(obj, depth = 0) {
        if (depth > 5) return [];
        if (Array.isArray(obj)) return [obj];
        if (typeof obj !== 'object' || !obj) return [];
        const result = [];
        for (const v of Object.values(obj)) {
          result.push(...findArrays(v, depth + 1));
        }
        return result;
      }

      const arrays = findArrays(shopData);
      console.log(`shopData内配列: ${arrays.length}件`);
      for (const arr of arrays) {
        if (arr.length < 2) continue;
        const first = arr[0];
        // セラピストっぽいプロパティを持つか確認
        const keys = Object.keys(first || {});
        console.log(`  配列[${arr.length}] keys: ${keys.join(', ')}`);
        if (keys.some(k => /name|therapist|cast|girl|セラピ/i.test(k))) {
          console.log('  → セラピスト配列の可能性！');
          for (const t of arr) {
            const name = (t.therapistName || t.name || t.castName || t.gal_name || '').trim();
            if (!name) continue;
            const imgSrc = t.img1 || t.img || t.image || t.photo || '';
            const fullSrc = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, BASE_URL).href) : '';
            therapists.push({
              name, imgSrc: fullSrc,
              age: t.age ? parseInt(t.age) : null,
              height: t.height ? parseInt(t.height) : null,
              cup: (t.threeSize || t.bust || t.cup || '').match(/([A-J])(?:CUP|カップ)?/i)?.[1]?.toUpperCase() || null,
            });
          }
        }
      }
    }
  } catch (e) {
    console.log('shopData eval エラー:', e.message);
  }

  // データが取れなかった場合、data.js内を正規表現で直接パース
  if (therapists.length === 0) {
    console.log('正規表現パースを試みます...');
    // therapistName: "xxx" パターン
    const nameMatches = [...dataJs.matchAll(/therapistName\s*:\s*["']([^"']{1,20})["']/g)];
    const imgMatches = [...dataJs.matchAll(/img1\s*:\s*["']([^"']{1,200})["']/g)];
    const ageMatches = [...dataJs.matchAll(/age\s*:\s*["']?(\d{2,3})["']?/g)];
    const heightMatches = [...dataJs.matchAll(/height\s*:\s*["']?(\d{3})["']?/g)];
    console.log(`therapistName: ${nameMatches.length}件, img1: ${imgMatches.length}件`);
    for (let i = 0; i < nameMatches.length; i++) {
      const name = nameMatches[i][1];
      const imgSrc = imgMatches[i]?.[1] || '';
      const fullSrc = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, BASE_URL).href) : '';
      therapists.push({
        name, imgSrc: fullSrc,
        age: ageMatches[i] ? parseInt(ageMatches[i][1]) : null,
        height: heightMatches[i] ? parseInt(heightMatches[i][1]) : null,
        cup: null,
      });
    }
  }
} catch (e) {
  console.log('data.js 取得エラー:', e.message);
}

// ========== 方法2: therapists.html ページから HTML スクレイピング ==========
if (therapists.length === 0) {
  console.log('\ntherapists.html スクレイピングを試みます...');
  const candidateUrls = [
    `${BASE_URL}/therapists.html`,
    `${BASE_URL}/therapist.html`,
    `${BASE_URL}/cast.html`,
    `${BASE_URL}/lady.html`,
    `${BASE_URL}/staff.html`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
      if (!res.ok) { console.log(`  ${url} → ${res.status}`); continue; }
      const html = await res.text();
      const $ = cheerio.load(html);
      console.log(`  ${url} → ${res.status}, img: $('img').length`);

      // 全 img を収集
      $('img').each((_, el) => {
        const $img = $(el);
        const src = $img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('src') || '';
        if (!src.match(/\.(jpg|jpeg|png|webp)/i)) return;
        if (/logo|banner|icon|bg|btn/i.test(src)) return;

        const alt = $img.attr('alt') || '';
        const parent = $img.closest('li, div, article, section').first();
        const text = parent.text().replace(/\s+/g, ' ').trim();
        const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/)
          || alt.match(/([ぁ-んァ-ヾ一-龯]{2,8})/);
        if (!nameMatch) return;
        const name = nameMatch[1].trim();
        if (name.length < 2) return;

        const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
        const heightMatch = text.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
        const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);
        const fullSrc = src.startsWith('http') ? src : new URL(src, BASE_URL).href;
        therapists.push({
          name, imgSrc: fullSrc,
          age: ageMatch ? parseInt(ageMatch[1]) : null,
          height: heightMatch ? parseInt(heightMatch[1]) : null,
          cup: cupMatch?.[1]?.toUpperCase() || null,
        });
      });

      if (therapists.length > 0) { console.log(`  → ${therapists.length}名`); break; }

      // 画像がなければテキストから名前を抽出
      const nameMatches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8})\s*[（(](\d{2,3})[)）]/g)];
      console.log(`  テキスト名前候補: ${nameMatches.length}件`);
      if (nameMatches.length > 0) {
        console.log('  サンプル:', nameMatches.slice(0, 5).map(m => `${m[1]}(${m[2]})`).join(', '));
        for (const m of nameMatches) {
          const name = m[1];
          if (/プレミアム|セラピー|コース|ルーム|キャンペーン/.test(name)) continue;
          const idx = html.indexOf(m[0]);
          const ctx = html.slice(Math.max(0, idx - 100), idx + 200);
          const heightMatch = ctx.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || ctx.match(/(\d{3})\s*cm/i);
          therapists.push({ name, imgSrc: '', age: parseInt(m[2]), height: heightMatch ? parseInt(heightMatch[1]) : null, cup: null });
        }
        break;
      }
    } catch (e) {
      console.log(`  ${url} → エラー: ${e.message}`);
    }
  }
}

// ========== 挿入 ==========
const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
console.log(`\n取得合計: ${unique.length}名`);
unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height})`));

if (unique.length === 0) {
  console.log('❌ セラピストが取得できませんでした');
  process.exit(1);
}

let inserted = 0;
for (const t of unique) {
  const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
  const imgUrl = t.imgSrc || null;
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
