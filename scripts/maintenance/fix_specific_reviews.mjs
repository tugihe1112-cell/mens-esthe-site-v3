/**
 * 特定口コミの手動修正スクリプト
 * 元サイトと照合して特定されやすい口コミを個別に書き直す
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const FIXES = [
  {
    id: 'menesthe_9416_0_1779065215297',
    therapist_name: '永井 さつき',
    content: `【入店】
休日に予定がぽっかり空き、せっかくだからとネットで評判の良い店を探して予約しました。初訪問でしたが、受付から案内まで非常に丁寧で、清潔感のある内装に好印象を受けました。過去に別エリアで何度か利用経験がありますが、こちらは雰囲気が落ち着いていて居心地よく感じました。

【ご対面】
指名したセラピストは、20代後半と思われる落ち着いた雰囲気の女性でした。スレンダーながらバランスの良いスタイルで、写真以上に実物の印象が良かったです。昼間は別の仕事をしているとのことで、接客に業界慣れした感じがなく、それがかえって好感でした。話題も豊富で、施術中の会話が弾みました。

【施術】
90分のコースを選択し、料金は諸々込みで2万円弱。うつ伏せからスタートし、丁寧なリンパケアが続きます。マッサージ技術は確かで、力加減も絶妙でした。仰向けに移ってからはキワどい部位へのアプローチもありましたが、距離感は一貫して明確に保たれており、特別なサービスを期待する雰囲気ではありませんでした。健全な施術として非常に完成度が高いと感じました。

【総評】
セラピストとしてのスペックは申し分なく、ルックス・スタイル・技術のどれも高水準です。ただ、施術の健全さを求める方には最高の選択ですが、それ以上を期待すると物足りなさを感じるかもしれません。また近くに来る機会があれば再訪を検討したいと思います。`,
    rating: 3.8,
    detailed_ratings: { cleanliness: 4, looks: 4, style: 5, service: 4, massage: 4, intimacy: 2 },
    tags: ['スレンダー', '可愛い系', '20代後半', '清楚系'],
  },
];

const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) console.log('=== DRY RUN ===\n');

for (const fix of FIXES) {
  console.log(`🔧 ${fix.therapist_name} (${fix.id})`);
  console.log(`   content preview: ${fix.content.slice(0, 60)}...`);

  if (isDryRun) { console.log('   ✅ (dry-run)\n'); continue; }

  const { error } = await supabase
    .from('reviews')
    .update({
      content: fix.content,
      rating: fix.rating,
      detailed_ratings: fix.detailed_ratings,
      tags: fix.tags,
    })
    .eq('id', fix.id);

  if (error) {
    console.error(`   ❌ 失敗: ${error.message}`);
  } else {
    console.log(`   ✅ 更新完了\n`);
  }
}

console.log('完了');
