/**
 * 白石せいな（Silk）口コミ手動投稿
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) console.log('=== DRY RUN ===\n');

const SHOP_ID = 'tokyo_shibuya_silk';
const THERAPIST_NAME = '白石せいな';

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
    service: 4,
    massage: 5,
    intimacy: 5,
  },
  content: `【入店】
写真を見て一目惚れに近い感覚で予約しました。ワンルームの清潔な部屋で、特に違和感なくスムーズに案内してもらえます。

【ご対面】
とにかく美人。港区OLみたいな大人っぽい雰囲気で、いい女感を全面に出しているタイプです。HPでは20代中盤の設定になっていますが、実際は32〜33くらいじゃないかと思います。ただそれが全然マイナスじゃなくて、むしろその年齢感が魅力になっている。童顔好きや外国人顔好き以外で顔にガッカリする人はほぼいないと思います。

【施術】
背面→カエル足→四つん這い→表のオーソドックスな流れですが、技術はかなり上級者です。四つん這いのタイミングで金玉を直でいじってくれていた気がして、あまりにびっくりして興奮しすぎてしまいました。自分でもこれは何を刺激されているんだと疑ったくらい。最後は自分の股に胸を挟む体勢で鼠蹊部をマッサージしてくれました。スタイルも最高で、細いのにおっぱいはFカップくらいあって、1万でそれを揉ませてくれます。乳首もピンクで絵に描いたような綺麗さ。

【総評】
気さくで会話慣れしているんですが、気が強くてはっきりしているタイプです。嫌なものは嫌とはっきり言いそうな、なんなら弁護士立てて訴えてきそうな雰囲気すらある。それが怖いというよりむしろ一本筋が通ってる感じでカッコいい。ルックス・スタイル・技術、全部揃っていて4.5の評価は妥当だと思います。またいきます。`,
  tags: ['巨乳', '美人系', 'スレンダー', 'お姉さん系', 'ベテラン'],
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
