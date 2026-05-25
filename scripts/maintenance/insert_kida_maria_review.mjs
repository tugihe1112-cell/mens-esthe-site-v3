/**
 * 木田まりあ（Silk）口コミ手動投稿
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) console.log('=== DRY RUN ===\n');

const SHOP_ID = 'tokyo_shibuya_silk';
const THERAPIST_NAME = '木田まりあ';

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
  rating: 4.0,
  detailed_ratings: {
    cleanliness: 4,
    looks: 4.5,
    style: 5,
    service: 4.5,
    massage: 3.5,
    intimacy: 3,
  },
  content: `【入店】
HPを見てミステリアスで妖艶な雰囲気に惹かれて予約しました。幡ヶ谷のワンルームで、清潔感があります。LINEで簡単に予約できました。

【ご対面】
時間になってドアを開けると、妖艶なお姉さんを勝手に想像していたんですが、実際に出てきたのは普通に綺麗で愛嬌のある女性でした。あたりだなとすぐに思いました。童顔で丸顔、クラスにいたらトップクラスにかわいい部類だと思います。港区OLでも通用しそうな顔立ち。そして目が行くのはやっぱりおっぱいで、タワワな谷間が視界に入ってきます。自然な感じで豊胸ではなさそうで、細い体にあのサイズはかなりポイント高いです。

【施術】
裏→カエル足→四つん這い→表のオーソドックスな流れ。特別なことはないですが普通に上手いです。乳首はあまり積極的に攻めてこないタイプで、そこはちょっと物足りない。プラスのサービスをお願いしてみましたが「何回通っても無理」とのことで完全に断られました。ただハグはしてくれて、最後に股間を胸で挟むような体勢があって、それが今回一番の密着でした。

【総評】
接客態度はかなり良くて、お釣りのお札の数え方がサービス業経験者のそれだったので、どこかで接客の仕事をしていたんだろうなと思いました。ルックスもスタイルも文句なしで、サービス面に期待しすぎなければ十分満足できます。またいきます。`,
  tags: ['巨乳', '可愛い系', '20代後半', 'ベテラン'],
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
