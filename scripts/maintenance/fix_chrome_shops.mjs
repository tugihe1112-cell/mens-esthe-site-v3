/**
 * Chrome経由で取得したデータを登録
 * Pink Lady(25名) / Madame Relax(36名)
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);
const BUCKET = 'therapist-images';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function uploadImage(url, key, referer) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.split('?')[0].split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
    const storageKey = `${key}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storageKey, buf, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true,
    });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(storageKey).data.publicUrl;
  } catch { return null; }
}

const SHOPS = [
  {
    shopId: 'saitama_urawa_pink_lady',
    referer: 'https://pink-lady.men-es.jp/',
    therapists: [
      { name: 'さゆり', url: 'https://pink-lady.men-es.jp/data/staff/20/stf_6898771eb5038.png' },
      { name: 'ゆめ', url: 'https://pink-lady.men-es.jp/data/staff/73/stf_68d8948224eb8.jpg' },
      { name: 'ふじこ', url: 'https://pink-lady.men-es.jp/data/staff/65/stf_680097ce0f7a8.jpg' },
      { name: 'まりや', url: 'https://pink-lady.men-es.jp/data/staff/48/stf_65b4f79085c2a.png' },
      { name: 'あやの', url: 'https://pink-lady.men-es.jp/data/staff/22/stf_6119d9ec45696.jpg' },
      { name: 'みつり', url: 'https://pink-lady.men-es.jp/data/staff/79/stf_68fee0e90a75f.png' },
      { name: 'れい', url: 'https://pink-lady.men-es.jp/data/staff/61/stf_675a78d2157f2.jpg' },
      { name: 'みお', url: 'https://pink-lady.men-es.jp/data/staff/55/stf_6852492239b00.jpg' },
      { name: 'みなみ', url: 'https://pink-lady.men-es.jp/data/staff/35/stf_629046351d31f.png' },
      { name: 'ちか', url: 'https://pink-lady.men-es.jp/data/staff/59/stf_68107eb29406d.jpg' },
      { name: 'ちづる', url: 'https://pink-lady.men-es.jp/data/staff/78/stf_68fc9ddce142f.jpg' },
      { name: 'つかさ', url: 'https://pink-lady.men-es.jp/data/staff/76/stf_6904a51860547.jpg' },
      { name: 'ゆいか', url: 'https://pink-lady.men-es.jp/data/staff/36/stf_62c3cc022dacb.png' },
      { name: 'まどか', url: 'https://pink-lady.men-es.jp/data/staff/29/stf_619342001cc78.jpg' },
      { name: 'かすみ', url: 'https://pink-lady.men-es.jp/data/staff/57/stf_674167b3b28fb.jpg' },
      { name: 'のりか', url: 'https://pink-lady.men-es.jp/data/staff/81/stf_69489efe2db32.png' },
      { name: 'はる', url: 'https://pink-lady.men-es.jp/data/staff/56/stf_66f654c5e0360.jpg' },
      { name: 'ななお', url: 'https://pink-lady.men-es.jp/data/staff/52/stf_66540097d6a35.png' },
      { name: 'ねね', url: 'https://pink-lady.men-es.jp/data/staff/82/stf_695b33adb6a00.png' },
      { name: 'このみ', url: 'https://pink-lady.men-es.jp/data/staff/70/stf_67f49dd5f0808.png' },
      { name: 'ももか', url: 'https://pink-lady.men-es.jp/data/staff/49/stf_65ca1f64db999.png' },
      { name: 'かえで', url: 'https://pink-lady.men-es.jp/data/staff/47/stf_65ab2933f3279.jpg' },
      { name: 'さつき', url: 'https://pink-lady.men-es.jp/data/staff/21/stf_6113a9a167aa2.jpg' },
      { name: 'ゆき', url: 'https://pink-lady.men-es.jp/data/staff/30/stf_61a5b5fb0c844.jpg' },
      { name: 'あきな', url: 'https://pink-lady.men-es.jp/data/staff/72/stf_6886d1e7ca50d.png' },
    ],
  },
  {
    shopId: 'chiba_chiba_madame_relax',
    referer: 'https://www.madame-relax.com/chiba/',
    therapists: [
      { name: '石田 さとみ', url: 'https://www.madame-relax.com/chiba/cast/img/1-1.jpg' },
      { name: '本田 はるか', url: 'https://www.madame-relax.com/chiba/cast/img/16-1.jpg' },
      { name: '神無月 りこ', url: 'https://www.madame-relax.com/chiba/cast/img/17-1.jpg' },
      { name: '若槻 なぎさ', url: 'https://www.madame-relax.com/chiba/cast/img/22-1.jpg' },
      { name: '橘 あおい', url: 'https://www.madame-relax.com/chiba/cast/img/30-1.jpg' },
      { name: '水沢 かれん', url: 'https://www.madame-relax.com/chiba/cast/img/58-1.jpg' },
      { name: '川口 あすか', url: 'https://www.madame-relax.com/chiba/cast/img/74-1.jpg' },
      { name: '田中 みお', url: 'https://www.madame-relax.com/chiba/cast/img/82-1.jpg' },
      { name: '尾崎 ななせ', url: 'https://www.madame-relax.com/chiba/cast/img/81-1.jpg' },
      { name: '滝沢 かんな', url: 'https://www.madame-relax.com/chiba/cast/img/80-1.jpg' },
      { name: '西田 みなみ', url: 'https://www.madame-relax.com/chiba/cast/img/78-1.jpg' },
      { name: '森 ゆうか', url: 'https://www.madame-relax.com/chiba/cast/img/77-1.jpg' },
      { name: '森咲 すみれ', url: 'https://www.madame-relax.com/chiba/cast/img/76-1.jpg' },
      { name: '星野 ゆきな', url: 'https://www.madame-relax.com/chiba/cast/img/75-1.jpg' },
      { name: '水野 まこ', url: 'https://www.madame-relax.com/chiba/cast/img/73-1.jpg' },
      { name: '青山 かすみ', url: 'https://www.madame-relax.com/chiba/cast/img/70-1.jpg' },
      { name: '凪しをん', url: 'https://www.madame-relax.com/chiba/cast/img/68-1.jpg' },
      { name: '上原 あみ', url: 'https://www.madame-relax.com/chiba/cast/img/62-1.jpg' },
      { name: '真木 かえで', url: 'https://www.madame-relax.com/chiba/cast/img/61-1.jpg' },
      { name: '杉澤 れいな', url: 'https://www.madame-relax.com/chiba/cast/img/51-1.jpg' },
      { name: '緒方 せりな', url: 'https://www.madame-relax.com/chiba/cast/img/67-1.jpg' },
      { name: '桧山 るか', url: 'https://www.madame-relax.com/chiba/cast/img/66-1.jpg' },
      { name: '常盤 みほ', url: 'https://www.madame-relax.com/chiba/cast/img/32-1.jpg' },
      { name: '望月 ゆみ', url: 'https://www.madame-relax.com/chiba/cast/img/64-1.jpg' },
      { name: '藤崎 りさ', url: 'https://www.madame-relax.com/chiba/cast/img/43-1.jpg' },
      { name: '武藤 あやな', url: 'https://www.madame-relax.com/chiba/cast/img/33-1.jpg' },
      { name: '佐倉 えりか', url: 'https://www.madame-relax.com/chiba/cast/img/24-1.jpg' },
      { name: '林 かな', url: 'https://www.madame-relax.com/chiba/cast/img/54-1.jpg' },
      { name: '松嶋 れいか', url: 'https://www.madame-relax.com/chiba/cast/img/19-1.jpg' },
      { name: '椿 めい', url: 'https://www.madame-relax.com/chiba/cast/img/25-1.jpg' },
      { name: '一ノ瀬 みき', url: 'https://www.madame-relax.com/chiba/cast/img/2-1.jpg' },
      { name: '桃井 さつき', url: 'https://www.madame-relax.com/chiba/cast/img/20-1.jpg' },
      { name: '鈴木 こころ', url: 'https://www.madame-relax.com/chiba/cast/img/60-1.jpg' },
      { name: '杉原 ありす', url: 'https://www.madame-relax.com/chiba/cast/img/35-1.jpg' },
      { name: '神田 さなえ', url: 'https://www.madame-relax.com/chiba/cast/img/29-1.jpg' },
      { name: '加藤 えり', url: 'https://www.madame-relax.com/chiba/cast/img/45-1.jpg' },
    ],
  },
];

async function main() {
  let total = 0;
  for (const shop of SHOPS) {
    console.log(`\n[${shop.shopId}] ${shop.therapists.length}名`);
    const { data: existing } = await supabase.from('therapists').select('name').eq('shop_id', shop.shopId);
    const existingNames = new Set(existing?.map(t => t.name.replace(/[\s　]/g, '')) || []);
    let inserted = 0;
    for (const t of shop.therapists) {
      if (existingNames.has(t.name.replace(/[\s　]/g, ''))) { process.stdout.write('s'); continue; }
      const storageKey = `${shop.shopId}_${t.name}`.replace(/[^\w-]/g, '_');
      const imageUrl = await uploadImage(t.url, storageKey, shop.referer);
      await sleep(200);
      const { error } = await supabase.from('therapists').insert({
        id: `${shop.shopId}_${t.name}`,
        shop_id: shop.shopId,
        name: t.name,
        image_url: imageUrl,
      });
      if (!error || error.code === '23505') { process.stdout.write(imageUrl ? '+' : 'n'); inserted++; }
      else process.stdout.write('E');
    }
    console.log(`\n  登録: ${inserted}名`);
    total += inserted;
  }
  console.log(`\n完了: 合計${total}名登録`);
}

main();
