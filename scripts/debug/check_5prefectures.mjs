/**
 * 5県（新潟・石川・岡山・熊本・沖縄）の shop 登録状況確認
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const PREFECTURES = {
  新潟: [
    { name: 'あろまえすて＠新潟', url: 'http://www.at-aroma-niigata.com/' },
    { name: 'ナチュラルリフレ', url: 'https://naturalrefre-niigata.com/' },
    { name: 'ザ・プレミアムスパ', url: 'https://estama.jp/shop/38462/' },
    { name: 'アリュール', url: 'https://niigataaromaallure.weebly.com' },
    { name: 'ベイビーズブレス', url: 'https://babys-br.com/' },
    { name: 'マイロ', url: 'http://www.myiro-niigata.com/' },
    { name: '愛ぃ撫', url: 'https://niigata-ai-bu.com/' },
    { name: 'ルメア', url: 'https://estama.jp/shop/47578/' },
    { name: 'ティラミス', url: 'https://estama.jp/shop/49229/' },
    { name: 'マドンナグレイス', url: 'https://madonna-grace.com/' },
    { name: 'セルティック', url: 'https://celtic-niigata.com/' },
    { name: 'リノア', url: 'https://estama.jp/shop/48295/' },
    { name: 'ふたりきりSPA', url: 'https://nagaoka-futarikiri-spa.com' },
    { name: '猫時計', url: 'http://www.relax-nekokichi.net/' },
  ],
  石川: [
    { name: 'ラッシュハッシュ', url: 'https://lush-and-hush.com/' },
    { name: 'アロマベル 金沢', url: 'https://aromabelle-esthe.com/' },
    { name: '螢屋 金沢店', url: 'https://www.hotaruya.net/kanazawa/' },
    { name: 'エメ', url: 'https://aimer-kanazawa.com/' },
    { name: 'MODAN SPA 金沢', url: 'https://modan-spa-kanazawa.com/' },
    { name: 'ルナーリア', url: 'http://lunaria0505.esthe-hp.com/' },
    { name: 'アールリッツ', url: 'https://r-ritz.com/' },
    { name: '秘書の薫り', url: 'https://knz-hisho.com/' },
    { name: 'いざよい', url: 'https://izayoi-esthe.com/' },
    { name: '美人百花', url: 'https://bijin7771.estama.jp/' },
    { name: 'マリージョア 金沢', url: 'https://mary-geoise.com/' },
    { name: 'ユーフォリア', url: 'https://euforia-kanazawa.com/' },
    { name: 'よりそい', url: 'https://yorisoi-kanazawa.com/' },
  ],
  岡山: [
    { name: '倉敷Roman', url: 'https://kurashiki-roman.com/' },
    { name: 'ミセス美オーラ 岡山', url: 'https://mrs-viaura-okayama.com' },
    { name: 'ガーデン', url: 'https://garden-okayama.com/' },
    { name: 'バニーオカヤマ', url: 'https://bunny-okayama.com/' },
    { name: 'アミティエ', url: 'https://estama.jp/shop/39923/' },
    { name: 'プレステージ', url: 'https://www.prestige-okayama.info/' },
    { name: 'VIP SPA', url: 'https://estama.jp/shop/43455/' },
    { name: 'プレジール 岡山', url: 'https://plaisir-okayama.com/' },
    { name: 'ゼロ', url: 'https://estama.jp/shop/39790/' },
    { name: 'マダムハンド倉敷', url: 'https://madam-hand.com/' },
    { name: 'アラジン', url: 'https://aladdin-esthe.com' },
    { name: 'ホワイトローズ', url: 'https://estama.jp/shop/42964/' },
    { name: 'アリエル 岡山', url: 'https://31561.b8.estama.jp/' },
    { name: 'ハーレムファースト', url: 'https://harem1st-2021.com/' },
  ],
  熊本: [
    { name: 'フラワー 熊本', url: 'https://www.esthe-flower.net/' },
    { name: 'スウィーティー', url: 'https://www.sweeeety.com/' },
    { name: 'プラプラアロマ', url: 'https://www.pulapulaaroma.com/' },
    { name: 'パレット', url: 'https://palette2022.com/' },
    { name: 'コンフィデンス', url: 'https://confidence-k.weebly.com/' },
    { name: 'ノンフィクションスパ', url: 'https://nonfiction-spa.com/' },
    { name: 'リセット 熊本', url: 'https://www.mens-reset.com/' },
    { name: 'ジュエル', url: 'https://aroma-jewel-kumamoto.com/' },
    { name: 'エムアンドアール', url: 'http://massarelax.com/' },
    { name: 'アマリリス', url: 'https://lilyte-official.com/' },
    { name: 'ワン', url: 'https://mensesthe-one.com/' },
    { name: 'ルネージュ', url: 'https://reneeige.com/' },
    { name: 'ルマージュ熊本', url: 'https://le-marge.jp/' },
    { name: 'アンネフェ', url: 'https://eneffet.net/' },
  ],
  沖縄: [
    { name: 'ブルーリズ', url: 'https://est-blueliz.com/' },
    { name: 'ピアノ（旧キスミー）', url: 'https://estama.jp/shop/34953/' },
    { name: '美らエス', url: 'https://churaesu01.men-este.net/' },
    { name: 'ウォーターゲート', url: 'https://ichigo151515.com/' },
    { name: '雅 in NAHA', url: 'https://miyavi-in-naha.com' },
    { name: 'ユルモア', url: 'https://yurumore.jp/' },
    { name: 'モアモア', url: 'https://moremore-esthe.jp/' },
    { name: 'クラブ ウルトラ', url: 'https://club-ultra.com' },
  ],
};

function normDomain(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch { return url; }
}

async function main() {
  // Fetch all shops with website_url
  const { data: allShops } = await supabase
    .from('shops')
    .select('id, name, website_url, raw_data')
    .not('website_url', 'is', null);

  const shopsByDomain = new Map();
  for (const s of allShops || []) {
    if (s.website_url) {
      const d = normDomain(s.website_url);
      shopsByDomain.set(d, s);
    }
  }

  for (const [pref, shops] of Object.entries(PREFECTURES)) {
    console.log(`\n===== ${pref}県 =====`);
    let registered = 0, missing = 0;
    for (const shop of shops) {
      const d = normDomain(shop.url);
      const existing = shopsByDomain.get(d);
      if (existing) {
        const { data: therapists } = await supabase
          .from('therapists')
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', existing.id);
        const count = therapists === null ? '?' : 0;
        // Get count
        const { count: tcount } = await supabase
          .from('therapists')
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', existing.id);
        console.log(`  ✅ ${shop.name} → ${existing.id} (${tcount ?? '?'}名)`);
        registered++;
      } else {
        console.log(`  ❌ ${shop.name} (${d})`);
        missing++;
      }
    }
    console.log(`  [${registered}登録済 / ${missing}未登録]`);
  }
}

main().catch(console.error);
