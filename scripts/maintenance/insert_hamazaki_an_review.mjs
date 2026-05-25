/**
 * 浜崎あん（Silk）口コミ手動投稿
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) console.log('=== DRY RUN ===\n');

const SHOP_ID = 'tokyo_shibuya_silk';
const THERAPIST_NAME = '浜崎あん';

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
    cleanliness: 3.5,
    looks: 2,
    style: 2.5,
    service: 4.5,
    massage: 3.5,
    intimacy: 4.5,
  },
  content: `【入店】
行こうとしていた子が先約で埋まっていて、店員さんにおすすめされたのが浜崎あんさんでした。半ば流れで指名したんですが、これが当たりでした。場所は幡ヶ谷のマンションで、アクセスもそんなに悪くない。

【ご対面】
ドアを開けると小動物みたいな童顔の子が立っていました。愛想が良くてフランクで、初対面の緊張感が全くない。顔は可愛い系ですが、むちゃくちゃ可愛いかと言われるとそうでもない。その辺のカフェにいても特別目立つタイプではないけどBSでもない、という感じです。スタイルはふっくら系で、お尻が大きくて肉付きが良い。胸はCくらいで、スタイルの割にはもう少し欲しいかなとは思いました。

【施術】
最初はヘッドマッサージから20分ほど。その間も積極的に話しかけてきてくれます。仰向けになって足をやってもらう段階で、鼠蹊部の攻め方が普通のマッサージと変わらなかったのでちょっと期待値を下げました。ただリクエストしたら嫌な顔ひとつせずきわきわを攻めてきてくれました。四つん這いになった時点でお尻は触り放題で、乳首も噛んでくれました。直接も触ってくれて、追加次第でもっとあるとのこと。

【総評】
店員おすすめで半ば消去法の指名でしたが、予想以上に楽しめました。愛想が良くて話しやすく、こちらのリクエストにも柔軟に対応してくれます。120分衣装チェンジ込みで25000円は妥当だと思います。もっと顔が好みなら迷わずリピートするところですが、シルク全体でまだ試していない子もいるのでそちらも検討中です。`,
  tags: ['グラマー', '可愛い系', '20代前半', '健康的'],
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
