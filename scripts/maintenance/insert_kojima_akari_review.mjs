/**
 * 小嶋あかり（Silk）口コミ手動投稿
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) console.log('=== DRY RUN ===\n');

const SHOP_ID = 'tokyo_shibuya_silk';
const THERAPIST_NAME = '小嶋あかり';

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
  rating: 4.5,
  detailed_ratings: {
    cleanliness: 4,
    looks: 5,
    style: 5,
    service: 4.5,
    massage: 4,
    intimacy: 3.5,
  },
  content: `【入店】
たまたまその辺にいて、スマホで近くの店を探してLINEで予約しました。当日でもすんなり取れたのは良かった。場所は幡ヶ谷のワンルームで、清潔感があります。

【ご対面】
ドアを開けた瞬間、かなりの美人が出てきました。六本木のキャバクラにいてもおかしくない感じで、短めの茶髪で20代中盤くらい。ギャル系というか、いわゆる「いい女」オーラが出ています。顔でガッカリする人はまずいないと思います。

【施術】
後ろ→カエル足→四つん這い→表のオーソドックスな流れ。経験2年くらいと言っていましたが、マッサージは普通に上手くて、メンエスとしての要素と純粋なマッサージのバランスが良かったです。スタイルはくびれがあって細身、お尻は小さめ。胸はGカップくらいあると思うんですが、あの細さであのサイズは不自然なので個人的には豊胸を疑っています。胸を触ろうと何度かチャレンジしましたが完全に無理でした。ガードが固く、そこで豊胸説がさらに強くなりました。

【総評】
愛嬌が良くてサービスも良かった。顔もスタイルも文句なしで、密着もそれなりにしてくれます。胸に触れないのは残念ですが、それ以外の満足度は高い。Silkの中でもかなり上位の子だと思います。`,
  tags: ['巨乳', '美人系', 'ギャル系', '20代前半'],
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
