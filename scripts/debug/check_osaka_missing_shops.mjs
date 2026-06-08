/**
 * 大阪 未登録店舗チェックスクリプト
 * mens-mg.comランキングとDBを比較して未登録店舗を特定
 * 実行: node scripts/debug/check_osaka_missing_shops.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// mens-mg.comから取得した大阪全エリアランキング（117店舗）
const RANKING = [
  // 梅田
  {area:'梅田', name:'Beauty and Beast', url:'https://beauty-and-beast.net'},
  {area:'梅田', name:'MUFUFU HITOHADA center', url:'https://mufufu-hitohada-center.com'},
  {area:'梅田', name:'Darlin Premium', url:'https://darlin-premium.com'},
  {area:'梅田', name:'MUFUFU FOOTCARE Center', url:'https://mufufu-foot-care-center.com'},
  {area:'梅田', name:'BELCHIC', url:'https://belchic.net'},
  {area:'梅田', name:'Eden Spa', url:'https://eden-spa.jp'},
  {area:'梅田', name:'Richesse Spa', url:'https://richesse-spa.com'},
  {area:'梅田', name:'マダムと紳士 梅田ルーム', url:'https://madam-and-gentleman.com'},
  {area:'梅田', name:'打上花火 梅田ルーム', url:'https://uchiagemenseste.jp'},
  {area:'梅田', name:'小悪魔Alice', url:'https://koakuma-alice.com'},
  {area:'梅田', name:'Pershia', url:'https://pershia.jp'},
  {area:'梅田', name:'LANCOM', url:'https://lancom.jp'},
  {area:'梅田', name:'ばする～む', url:'https://bath-room.jp'},
  {area:'梅田', name:'Deep Chill', url:'https://deep-chill.info'},
  {area:'梅田', name:'秘宝殿 梅田ルーム', url:'https://hihouden.net'},
  // 日本橋・難波
  {area:'日本橋・難波', name:'C.r.e.a.m', url:'https://cream-osaka.com'},
  {area:'日本橋・難波', name:'ミセス美オーラ', url:'https://mrs-viaura.com'},
  {area:'日本橋・難波', name:'当たりSPA', url:'https://atarispa.com'},
  {area:'日本橋・難波', name:'belle femme', url:'https://osaka-bellefemme.com'},
  {area:'日本橋・難波', name:'Aroma one', url:'https://esthe-aromaone.com'},
  {area:'日本橋・難波', name:'Naniwajoshi', url:'https://naniwajoshi.com'},
  {area:'日本橋・難波', name:'DIABLO', url:'https://diablo-osaka.com'},
  {area:'日本橋・難波', name:'VISCONTI', url:'https://menseste.jp'},
  // 堺筋本町
  {area:'堺筋本町', name:'美魔女セラピー', url:'https://amaou-therapi.jp'},
  {area:'堺筋本町', name:'Piady', url:'https://piady-osaka.com'},
  {area:'堺筋本町', name:'SPALOT.Mrs 堺筋本町', url:'https://spalot-mrs.com'},
  {area:'堺筋本町', name:'綺麗なサロン', url:'https://kirei1212.livedoor.blog'},
  {area:'堺筋本町', name:'SECRET ROOM ひまわり', url:'https://sr-himawari.com'},
  {area:'堺筋本町', name:'和いふらいん', url:'https://wife-line.com'},
  {area:'堺筋本町', name:'TAMANEGI 堺筋本町', url:'https://tamanegiman.com'},
  {area:'堺筋本町', name:'感謝 堺筋本町', url:'https://kansya-osaka.com'},
  {area:'堺筋本町', name:'FLYING SPA', url:'https://flyingspa.jp'},
  {area:'堺筋本町', name:'ぷちどり～む', url:'https://petitpetit-dream.com'},
  // 心斎橋・長堀橋
  {area:'心斎橋・長堀橋', name:'GION Mrs', url:'https://gion-mrs.com'},
  {area:'心斎橋・長堀橋', name:'大阪余白', url:'https://osaka-yohaku.com'},
  {area:'心斎橋・長堀橋', name:'Fantasy Spa', url:'https://fantasy-spa.com'},
  {area:'心斎橋・長堀橋', name:'frog spa', url:'https://frog-spa.com'},
  {area:'心斎橋・長堀橋', name:'madam spa', url:'https://madam-spa.net'},
  {area:'心斎橋・長堀橋', name:'sari sari', url:'https://sarisari.jp'},
  {area:'心斎橋・長堀橋', name:'Aromade skit', url:'https://aromade-skit.com'},
  // 京橋・南森町
  {area:'京橋・南森町', name:'bulan', url:'https://relaxgarden.jimdofree.com'},
  {area:'京橋・南森町', name:'Mrs.Mermaid 京橋', url:'https://seven-luck-spa.com'},
  {area:'京橋・南森町', name:'Fu-ryu 京橋', url:'https://relafull.jp'},
  {area:'京橋・南森町', name:'BELLO SAVON', url:'https://aromadebnmbi.jimdofree.com'},
  {area:'京橋・南森町', name:'Reluman', url:'https://ainakondou.wordpress.com'},
  {area:'京橋・南森町', name:'BESTSTAR', url:'https://flower-osaka.jimdofree.com'},
  {area:'京橋・南森町', name:'美魔女セラピー 天満橋店', url:'https://amaou-therapi.jp'},
  {area:'京橋・南森町', name:'Mrs.AUBE SPA 天六', url:'https://kakurega-iyashi.com'},
  // 谷町
  {area:'谷町', name:'SPA Mona', url:'https://spa-mona.net'},
  {area:'谷町', name:'アヌSPA', url:'https://anuspa.com'},
  {area:'谷町', name:'FIRST CLASS 谷九', url:'https://firstclass-tanikunarua.com'},
  {area:'谷町', name:'Wife Therapy', url:'https://wife-therapy.com'},
  {area:'谷町', name:'One Class', url:'https://one-class-osaka.com'},
  {area:'谷町', name:'Aroma Rose', url:'https://aroma-rose-osaka.com'},
  {area:'谷町', name:'ぽっちゃりエステ つつみ', url:'https://potchari-tsutumi.com'},
  {area:'谷町', name:'ALYO 谷九', url:'https://alyo.net'},
  {area:'谷町', name:'Femme Fatale 谷九', url:'https://femme-fatale-osaka.com'},
  // 新大阪
  {area:'新大阪', name:'Mrs.AUBE SPA 新大阪', url:'https://kakurega-iyashi.com'},
  {area:'新大阪', name:'Naniwajoshi 新大阪', url:'https://naniwajoshi.com'},
  {area:'新大阪', name:'AZ', url:'https://az-spa.net'},
  {area:'新大阪', name:'ROSA', url:'https://rosa-osaka.com'},
  {area:'新大阪', name:'ITADAKI SPA', url:'https://itadaki-spa.com'},
  {area:'新大阪', name:'One Rose', url:'https://one-rose.net'},
  {area:'新大阪', name:'Aroma Angel', url:'https://aromaangel-osaka.com'},
  {area:'新大阪', name:'STARLIGHT', url:'https://starlight-osaka.com'},
  // 堺東・岸和田
  {area:'堺東・岸和田', name:'Mrs Beauty Line', url:'https://mrsbeautyline.com'},
];

// DB から大阪の全shop取得
console.log('DBから大阪店舗を取得中...');
const { data: dbShops } = await supabase
  .from('shops')
  .select('id, name, website_url')
  .eq('raw_data->>prefecture', '大阪府');

console.log(`DB大阪店舗数: ${dbShops?.length || 0}件\n`);

// ドメイン抽出関数
const normDomain = url => url?.replace(/https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase() || '';

const dbDomains = new Set((dbShops || []).map(s => normDomain(s.website_url)));
const dbNames = (dbShops || []).map(s => s.name.toLowerCase());

// 未登録チェック
const missing = [];
const existing = [];

for (const shop of RANKING) {
  const domain = normDomain(shop.url);
  const inDB = dbDomains.has(domain) || dbNames.some(n => n.includes(shop.name.toLowerCase().slice(0, 5)));
  if (inDB) {
    existing.push(shop);
  } else {
    missing.push(shop);
  }
}

console.log(`=== 未登録店舗 (${missing.length}件) ===`);
const byArea = {};
for (const s of missing) {
  if (!byArea[s.area]) byArea[s.area] = [];
  byArea[s.area].push(`  - ${s.name} (${s.url})`);
}
for (const [area, shops] of Object.entries(byArea)) {
  console.log(`\n【${area}】`);
  shops.forEach(s => console.log(s));
}

console.log(`\n=== 登録済み (${existing.length}件) ===`);
console.log(existing.map(s => `  ✓ ${s.name}`).join('\n'));
