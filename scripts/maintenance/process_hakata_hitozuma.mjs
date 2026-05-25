/**
 * 博多人妻さん セラピスト登録スクリプト
 * hakatahitozuma.com / 博多店91名 + 久留米店35名 = 計126名
 * Claude in Chrome で取得したデータを使用（Firebase Storage 画像）
 * 実行: node scripts/maintenance/process_hakata_hitozuma.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const FB_BASE = 'https://firebasestorage.googleapis.com/v0/b/fulock-4f657.appspot.com/o/images%2FqEau5NgAYpykQcJHPVXP%2F';
const img = (key) => key ? `${FB_BASE}${key}?alt=media` : null;

// 全セラピストデータ（博多店91名 + 久留米店35名）
const THERAPISTS = [
  // === 博多店 91名 ===
  { name: '桃瀬夫人', imgUrl: img('cVNkZTAK6FArTRGP') },
  { name: '菊川夫人', imgUrl: img('8XTIfhIyW1L9W1Yb') },
  { name: '早乙女夫人', imgUrl: img('sEP4xlQqcXFdZ7iW') },
  { name: '島田夫人', imgUrl: img('FCCQZw91zn8FeUtg') },
  { name: '前田夫人', imgUrl: img('XH0E6LjcyMDKCb2Y') },
  { name: '五十嵐夫人', imgUrl: img('253v62dAPKbpH0ot') },
  { name: '吉岡夫人', imgUrl: img('KlYLQnpfEEiEyXFa') },
  { name: '平野夫人', imgUrl: img('uTBJs38KDzdBu0K2') },
  { name: '日野夫人', imgUrl: img('iNxNrNvVWypFEXI0') },
  { name: '久保田夫人', imgUrl: img('zlRhkoYwlKHiX7bG') },
  { name: '児島夫人', imgUrl: img('TPTCUw0xczdCIe0s') },
  { name: '梅崎夫人', imgUrl: img('GuwNmutg6p3AB02e') },
  { name: '有村夫人', imgUrl: img('kDWDB6zhVacCUcMN') },
  { name: '和久井夫人', imgUrl: img('ppdKMTRPysXuklD9') },
  { name: '城田夫人', imgUrl: img('l97dJeeXlfEVp04s') },
  { name: '三浦夫人', imgUrl: img('LURPcGLoTKMw6hP1') },
  { name: '戸田夫人', imgUrl: img('ZI5SQbvYzhNfAddZ') },
  { name: '森高夫人', imgUrl: img('y6UVG23NIDTibmCk') },
  { name: '織田夫人', imgUrl: img('jQpjwGajzFbVAurO') },
  { name: '片岡夫人', imgUrl: img('gpjyTSIFrJWBLtrs') },
  { name: '草刈夫人', imgUrl: img('tGnxD6MVS7qGEeSZ') },
  { name: '近藤夫人', imgUrl: img('zsNsfaECHZuFKFoD') },
  { name: '秋吉夫人', imgUrl: img('KDohWiSpraBjyBKz') },
  { name: '西田夫人', imgUrl: img('NAttZOxl2EZJXH9e') },
  { name: '姫乃夫人', imgUrl: img('RcZBFIlsx7Xs3x3o') },
  { name: '杉本夫人', imgUrl: img('tEQmTbGcrLcU0Xcr') },
  { name: '若菜夫人', imgUrl: img('ipNdG69be73uRaat') },
  { name: '美咲夫人', imgUrl: img('AKgu5QcuiKO7d3ke') },
  { name: '渡部夫人', imgUrl: img('ePV5eJO6Km5PSGxJ') },
  { name: '黒田夫人', imgUrl: img('Di4xSiNw2rUYe54D') },
  { name: '小川夫人', imgUrl: img('A1LyYGuCAcO3r1A9') },
  { name: '三原夫人', imgUrl: img('LY7ZrCJCbCVotfR9') },
  { name: '広末夫人', imgUrl: img('Pn7vsUvLcB6TA01h') },
  { name: '倉田夫人', imgUrl: img('XA4IGm78DZmN1cbQ') },
  { name: '長谷川夫人', imgUrl: img('QdIvdPkapeKSFhn0') },
  { name: '菅野夫人', imgUrl: img('Vp8GkHAJMhFg9yoE') },
  { name: '萩原夫人', imgUrl: img('cz6PEoipTOhgCWPr') },
  { name: '白石夫人', imgUrl: img('U5vM0rA4TukXhzcy') },
  { name: '米倉夫人', imgUrl: img('YxQeITky497lMHj3') },
  { name: '風見夫人', imgUrl: img('AkJSpYVzMW5b87Rr') },
  { name: '青山夫人', imgUrl: img('1uXxX9oHGv8GYQyE') },
  { name: '桜井夫人', imgUrl: img('azWMtWHNROiJaGCd') },
  { name: '河野夫人', imgUrl: img('csJAP01EdLexK0qc') },
  { name: '並木夫人', imgUrl: img('BzZqDQgwijK27I22') },
  { name: '松嶋夫人', imgUrl: img('A9VcgjUSCk4CU53e') },
  { name: '花咲夫人', imgUrl: img('EgdhtLKfmHTGJrUv') },
  { name: '椿夫人', imgUrl: img('kX136DJy8wkHENnk') },
  { name: '二階堂夫人', imgUrl: img('LHEHH9idN7i4yM30') },
  { name: '宇野夫人', imgUrl: img('VN4yzKFKXLD62trx') },
  { name: '雨音夫人', imgUrl: img('i9YBbic3aivOnWOy') },
  { name: '酒井夫人', imgUrl: img('dUV0loz6A0z2FYAd') },
  { name: '真木夫人', imgUrl: img('JHLBuH51OwmoGHfk') },
  { name: '長山夫人', imgUrl: img('7eVjTbUxWzO0d7MQ') },
  { name: '神田夫人', imgUrl: img('oEcXkXx4sEXcKvly') },
  { name: '飯田夫人', imgUrl: img('OHBfQCliYMMUk8yt') },
  { name: '山下夫人', imgUrl: img('jzuWb9kd3V4AwVac') },
  { name: '朝比奈夫人', imgUrl: img('9ahZdT5P3y99T7yO') },
  { name: '辻夫人', imgUrl: img('SA4XsovxVHyo8PVB') },
  { name: '辺見夫人', imgUrl: img('3QBVrq89Ns7gqlon') },
  { name: '麻央(四季)', imgUrl: img('LAZM8xkElR6NjQEI') },
  { name: '吉乃(四季)', imgUrl: img('SD3LqFLuGNebhyFr') },
  { name: '智子(四季)', imgUrl: img('Ubc2i8QPOTrHy7dU') },
  { name: '蘭(四季)', imgUrl: img('BUf1Rs6fasP06Jjy') },
  { name: '美代子(四季)', imgUrl: img('AiiRxAEH3qLdaaze') },
  { name: '弥生(四季)', imgUrl: img('WduFyck36TnyJCAa') },
  { name: '聖子(四季)', imgUrl: img('OfH5Erw4OPCNhipz') },
  { name: '幸子(四季)', imgUrl: img('PeVj2H2d1cMU5KHb') },
  { name: '桃子(四季)', imgUrl: img('Bd2REtvnY9c8pyyD') },
  { name: '敦子(四季)', imgUrl: img('IkNutE9sCam2aCeE') },
  { name: '由布子(四季)', imgUrl: img('FKGm2ZbBtCqbCCa5') },
  { name: '忍(四季)', imgUrl: img('g3xN3k3DDA2w6J6T') },
  { name: '彩(四季)', imgUrl: img('zKMmq2g9De7Z20GB') },
  { name: '冬乃(四季)', imgUrl: img('IGXlb2NXyM81fN1j') },
  { name: '景子(四季)', imgUrl: img('x6B3pAk0gVa6TsX4') },
  { name: '優香(四季)', imgUrl: img('ABt9UB2p49Sz3JZ4') },
  { name: '栞(四季)', imgUrl: img('DosDvTi0kR2ibUb0') },
  { name: '貴子(四季)', imgUrl: img('IdKZr88YwFV4mJOQ') },
  { name: '直美(四季)', imgUrl: img('jT9qbTnF5A5o3Ekr') },
  { name: '真理子(四季)', imgUrl: img('tkAe2IJIlUFmxj30') },
  { name: '真由美(四季)', imgUrl: img('VR7L3sI4BCjaLqrl') },
  { name: '明美(四季)', imgUrl: img('771a2bNReMrzfXyD') },
  { name: '恵美(四季)', imgUrl: img('tgjpQN5tpgOG8XHA') },
  { name: '凛子(四季)', imgUrl: img('EAv07rRmNCIaozrI') },
  { name: '紅(四季)', imgUrl: img('Hb5wYzlPVZrC8K1C') },
  { name: '朝子(四季)', imgUrl: img('sOWqtyszHlFbpqUr') },
  { name: '洋子(四季)', imgUrl: img('AS9VBKWwOx2qgEhl') },
  { name: '桜子(四季)', imgUrl: img('ozyBm1nxBNHt1XtO') },
  { name: '双葉(四季)', imgUrl: img('5nSqN059tPpAOuT0') },
  { name: '愛子(四季)', imgUrl: img('aeWjwlkIr5FQNerN') },
  { name: '梓(四季)', imgUrl: img('LNudEu3c0I5tm1Gf') },
  { name: '文(四季)', imgUrl: img('WSXwoOzL47zBYgRS') },
  // === 久留米店 35名 ===
  { name: '青(あお)夫人', imgUrl: img('uYKJS0EKjUoeNnOR') },
  { name: '菊川夫人_久留米', imgUrl: img('TuJ74UElmJMTdXNn') }, // 博多店と重複するためサフィックス付与
  { name: '佐野夫人', imgUrl: img('5reLuEkkXlLvPIYP') },
  { name: '奥村夫人', imgUrl: img('g6jTiQ5UJHI5DOYo') },
  { name: '七瀬夫人', imgUrl: img('GyNIhOBUjaIfFjq7') },
  { name: '華山夫人', imgUrl: img('QYlT849PSiVWweLP') },
  { name: '大沢夫人', imgUrl: img('rDV6bMixeQFIvryh') },
  { name: '春野夫人', imgUrl: img('PGArAuPqS0zWqOyp') },
  { name: '乙葉夫人', imgUrl: img('ct1QpewL8xyzSkQM') },
  { name: '増田夫人', imgUrl: img('4y6YICHTxpOoTIAE') },
  { name: '今井夫人', imgUrl: img('exgB7PDOJ1SGSB9x') },
  { name: '坂梨夫人', imgUrl: img('7FTzewnAfrawdnD8') },
  { name: '桃田夫人', imgUrl: img('pNjMLGTz56gPdyvk') },
  { name: '成瀬夫人', imgUrl: img('94IEss87UfFgrSEe') },
  { name: '望月夫人', imgUrl: img('bHkkLpyyWMZIdxy6') },
  { name: '近藤夫人_久留米', imgUrl: img('vwu1VypEZXGKs68P') }, // 博多店と重複するためサフィックス付与
  { name: '小柳夫人', imgUrl: img('h0vQFCaOG9iwoKXG') },
  { name: '菅野夫人_久留米', imgUrl: img('H7GCRMygFq14S4eD') }, // 博多店と重複するためサフィックス付与
  { name: '長谷川夫人_久留米', imgUrl: img('H6pCDwsp6YOhdcWL') }, // 博多店と重複するためサフィックス付与
  { name: '紺野夫人', imgUrl: img('fQKixQs1KlufopPG') },
  { name: '姫乃夫人_久留米', imgUrl: img('EO5oKykoHVGaGGLT') }, // 博多店と重複するためサフィックス付与
  { name: '夏目夫人', imgUrl: img('HCxoX04SNehpwFdE') },
  { name: '野亜夫人', imgUrl: img('CiDID7RTjM20xR7O') },
  { name: '椎名夫人', imgUrl: img('GtaptYf1dg5ISfU0') },
  { name: '山口夫人', imgUrl: img('Tvs13O8iIAzIpEhM') },
  { name: '綾瀬夫人', imgUrl: img('FSfM2oKI3Ot6x8X8') },
  { name: '宮崎夫人', imgUrl: img('DuhIBedcTcKU7BBk') },
  { name: '真木夫人_久留米', imgUrl: img('oQSaojW8UCyc7xZj') }, // 博多店と重複するためサフィックス付与
  { name: '三崎夫人', imgUrl: img('U8jXMQ5fTiBf9ZYX') },
  { name: '佐々木夫人', imgUrl: img('HN9LeDbTCZYDcIy4') },
  { name: '葉月夫人', imgUrl: img('HAXQKR9L9uO3PG0A') },
  { name: '南夫人', imgUrl: img('1g96gwDGGs7xGUKp') },
  { name: '伊東夫人', imgUrl: img('yDE3jx2NbbIQ8eVm') },
  { name: '目黒夫人', imgUrl: img('tFuI4OhTqgHQ45NS') },
  { name: '瀬戸夫人', imgUrl: img('5xunOkgP1FEmgaOb') },
];

// shop_id を website_url から取得
const { data: shops, error: shopErr } = await supabase
  .from('shops')
  .select('id, name')
  .filter('raw_data->>prefecture', 'eq', '福岡県')
  .ilike('website_url', '%hakatahitozuma%');

if (shopErr || !shops?.length) {
  console.error('❌ 博多人妻さん が見つかりません:', shopErr?.message);
  process.exit(1);
}

const shop = shops[0];
console.log(`✅ shop: ${shop.name} (${shop.id})`);
console.log(`登録予定: ${THERAPISTS.length}名`);
if (DRY_RUN) console.log('[DRY RUN モード]');

// 既存セラピスト確認
const { count: existing } = await supabase
  .from('therapists')
  .select('id', { count: 'exact', head: true })
  .eq('shop_id', shop.id);
console.log(`既存セラピスト数: ${existing}名`);

if (!DRY_RUN) {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const t of THERAPISTS) {
    const id = `${shop.id}_${t.name}`;
    const { error } = await supabase.from('therapists').upsert({
      id,
      shop_id: shop.id,
      name: t.name,
      image_url: t.imgUrl,
    }, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ ${t.name}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✅ ${t.name}`);
      inserted++;
    }
  }

  console.log(`\n完了: 挿入/更新 ${inserted}名, エラー ${errors}名`);
} else {
  console.log('\n[DRY] 以下を登録予定:');
  THERAPISTS.forEach((t, i) => console.log(`  [${i + 1}] ${t.name}`));
}
