/**
 * 吉岡えみ（Silk）口コミ手動投稿
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) console.log('=== DRY RUN ===\n');

const SHOP_ID = 'tokyo_shibuya_silk';
const THERAPIST_NAME = '吉岡えみ';

const { data: therapist } = await supabase
  .from('therapists')
  .select('id')
  .eq('shop_id', SHOP_ID)
  .eq('name', THERAPIST_NAME)
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
    looks: 3.5,
    style: 4,
    service: 4,
    massage: 4,
    intimacy: 2.5,
  },
  content: `【入店】
仕事が早く終わった日に、前から気になってた子を指名してみました。エリアは幡ヶ谷。シルクは何度か使ったことがあって、店自体への信頼感はあります。部屋はこじんまりしたマンションの一室で清潔感あり。

【ご対面】
登場した瞬間、写真より落ち着いた雰囲気の子だなというのが第一印象です。ユニクロにいそうな黒髪・つけまつ毛系で、ギャルというほどではないけどちょっとその気がある。八重歯がチャームポイントです。顔で心臓が跳ね上がるタイプではないですが、実物を見てガッカリもしない。スレンダーで足が綺麗、胸はDくらいあります。

【施術】
マッサージはしっかりうまいです。裏→カエル足→四つん這い→表という流れで、無駄がない。四つん這いの時にTKBをコリコリしてくれるセラピストもいますが、この人はなでる形で、そこは物足りなかった。会話は自然で、話しかけてくれるし聞いてもくれる。聞いたらユニクロで働いてるとのこと。確かにいそうだなと思いました。

【総評】
せめてお尻だけでもと思って触ろうとしたんですが、かなりしっかり断られてちょっと怒ってました。ガードはかなり硬めです。ただそれで怒る気にもならないくらい、サバサバしていて後腐れがない。マッサージの質と会話のテンポは良くて、純粋にメンエスとして行くなら十分満足できます。シルク全体でいいセラピストが揃っているので、また別の子も試してみたいと思っています。`,
  tags: ['スレンダー', '可愛い系', '20代後半', 'ギャル系'],
  user_id: 'owner_manual',
  user_name: '常連',
};

console.log(`投稿内容:`);
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
