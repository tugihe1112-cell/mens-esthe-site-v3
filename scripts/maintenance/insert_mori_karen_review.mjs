/**
 * もりかれん（Silk）口コミ手動投稿
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) console.log('=== DRY RUN ===\n');

const SHOP_ID = 'tokyo_shibuya_silk';
const THERAPIST_NAME = 'もりかれん';

// therapist_id を取得
const { data: therapist } = await supabase
  .from('therapists')
  .select('id')
  .eq('shop_id', SHOP_ID)
  .ilike('name', THERAPIST_NAME)
  .single();

const therapistId = therapist?.id ?? `${SHOP_ID}_${THERAPIST_NAME}`;
console.log(`therapist_id: ${therapistId}`);

const review = {
  id: `manual_${SHOP_ID}_${THERAPIST_NAME}_${Date.now()}`,
  shop_id: SHOP_ID,
  therapist_id: therapistId,
  therapist_name: THERAPIST_NAME,
  rating: 3.5,
  detailed_ratings: {
    cleanliness: 4,
    looks: 3,
    style: 4,
    service: 2.5,
    massage: 4,
    intimacy: 3,
  },
  content: `【入店】
家から近くて深夜もやってるんで、気が向いたときにLINEで予約してふらっと行く感じです。ワンルームの部屋で、こじんまりしてるけど整理されてて清潔感はあります。特にゴージャスな感じはないけど、それが逆に落ち着く。受付とかも変に緊張感なく、サクッと案内してもらえます。

【ご対面】
写真通りの子でした。ただ実物は写真よりもっと童顔というか、華やかさはあまりない印象。ブスとかじゃないし普通に可愛いんですけど、絶世の美女という感じでもない。スリムな体型で身長は女性の平均くらい。全体的に地味めというか、清楚系という言葉が近いかもしれない。口紅がちょっと濃いのだけ個人的には気になりました。顔のイメージと少し合ってない感じがして。

【施術】
裏→カエル足→四つん這い→表というオーソドックスな流れ。マッサージはふつうにうまいし、メンエスとしての流儀もちゃんとわかってる人です。手際が良くて無駄がない。四つん這いのときにパンツをずらされてお尻丸見えになったのはちょっと新鮮でした。本人は完全に業務的にやってましたが、それはそれで良かった。密着はマニュアル通りで特別何かあるわけじゃないけど、平均的なメンエスとして普通に満足できます。

【総評】
こちらから話しかけないと自分からは喋ってくれないタイプですが、返事はイヤイヤという感じでもなく普通に会話は成立します。文系っぽくて芸術が好きみたいで、そういう話をするとちゃんと乗ってくれる。会話のこなれた感じとか施術の手際から、この業界に相当長くいるんだろうなというのは伝わります。愛想が特別いいわけでもないし、機械的にこなしてる感じは正直あります。ただそれが嫌いじゃない人もいると思うし、近所にあって深夜も使えるんでまた行くと思います。`,
  tags: ['スレンダー', '可愛い系', '清楚系', 'ベテラン'],
  user_id: 'owner_manual',
  user_name: '常連',
};

console.log(`\n投稿内容:`);
console.log(`  セラピスト: ${review.therapist_name}`);
console.log(`  評価: ${review.rating}`);
console.log(`  タグ: ${review.tags.join(', ')}`);
console.log(`  文字数: ${review.content.length}字`);

if (isDryRun) {
  console.log('\n(dry-run) 実際には投稿しません');
  process.exit(0);
}

const { error } = await supabase.from('reviews').insert(review);

if (error) {
  console.error(`❌ 失敗: ${error.message}`);
} else {
  console.log(`\n✅ 投稿完了`);
}
