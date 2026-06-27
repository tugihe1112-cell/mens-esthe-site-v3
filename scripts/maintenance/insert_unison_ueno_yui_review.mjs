import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
// ⚠️ INSERTは必ず service role（anon keyはRLSでサイレント無効 → ng-rules.md）
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const DRY = process.argv.includes('--dry-run');

const content = `【入店】
予約はいつも通りLINEで。当日に指定されたのは最寄り駅から歩いて15分ほどのルームで、道がやや分かりにくく少し迷った。複数エリアを展開していて在籍も多く、料金の安さが売りの系列。ただ正直、ここはプロフィール写真の"作り込み"が強い印象があって、開けてみるまで分からない、半分は運任せのつもりで向かった。部屋自体は値段相応で、シャワーも問題なく、清潔感で困ることはなかった。

【ご対面】
ドアを開けて最初に思ったのは「やっぱり写真とは結構違うな」ということ。顔の加工は今どき当たり前として割り切れるが、スタイルやサイズ感まで盛られていると、会った瞬間の落差はどうしても大きく感じてしまう。体型はぽっちゃり寄り。ただしバストのボリュームは写真通りで、ここは確かに強みだと思う。だから「とにかく胸の大きさが正義、ほかの要素は問わない」という人には、むしろ刺さるタイプ。会話は気さくで人当たりが良く、人柄そのものに不満はなかった。

【施術】
選んだのは一番短いコース。オプションを追加すると最後まで対応してくれるとのことで、合計でだいたい2万円ほど。シャワーのあとに施術スタート。流れはうつ伏せ→仰向け→カエル足→四つん這いと、ごく一般的な構成だった。マッサージは率直に言って無骨で、丁寧さや強弱の妙、ほぐしの技術といった部分はあまり感じられなかった。終盤のオプション対応も、良くも悪くも流れ作業的で、"特別な時間を過ごしている"という高揚感は薄め。淡々と手順を消化していく印象だった。

【総評】
人柄は良いので接客面で不快な思いをすることはない。一方で、写真と実物のギャップ・施術の素朴さ・密着の事務的な空気が重なって、「また指名したい」とまでは思えなかったのが正直なところ。バスト重視で、価格の安さとボリュームに割り切って楽しめる人には十分選択肢になるが、ルックスのイメージ通りを期待したり、ドキドキ感や確かな技術を求める人には少しハードルがある。期待値を上げすぎず、運試しくらいの気持ちで臨むのが合っていると感じた一回だった。`;

const review = {
  id: 'owner_unison_spa_ueno_yui_1',
  shop_id: 'kanagawa_sagamihara_unison_spa',          // 表示120@9位のSEOページ。g_brand_unison_spaで全店共有
  therapist_id: 'kanagawa_sagamihara_unison_spa_上野ゆい',
  therapist_name: '上野　ゆい',                          // DB正式名（全角スペース）。照合はスペース除去で行われる
  user_id: 'owner_manual',                             // 即公開扱い
  user_name: '常連',
  rating: 2,
  course: '最短コース＋オプション（計2万円ほど）',
  detailed_ratings: { cleanliness: 3, looks: 2, style: 2, service: 3, massage: 2, intimacy: 2 },
  tags: ['グラマー', '巨乳', '20代前半'],
  is_public: true,
  content,
};

async function main() {
  const len = content.replace(/\s/g, '').length;
  console.log(`■ 本文字数（空白除く）: ${len}字 ${len >= 700 ? '✅ 700字以上' : '⚠️ 700字未満（自動公開トリガー条件を満たさない）'}`);

  // 重複チェック（再実行でduplicate keyエラーを防ぐ）
  const { data: existing } = await supabase.from('reviews').select('id').eq('id', review.id).maybeSingle();
  if (existing) { console.log('⚠️ 既に存在:', review.id, '→ スキップ'); return; }

  if (DRY) {
    console.log('--- DRY RUN（DB変更なし）---');
    console.log(JSON.stringify({ ...review, content: content.slice(0, 60) + '…(省略)' }, null, 2));
    return;
  }

  const { data, error } = await supabase.from('reviews').insert(review).select();
  if (error) { console.error('❌ INSERT失敗:', error); process.exit(1); }
  console.log('✅ 挿入完了:', data?.[0]?.id);
  console.log('索引URL: https://www.mens-esthe-map.jp/shops/kanagawa_sagamihara_unison_spa/threads/kanagawa_sagamihara_unison_spa_上野ゆい');
  console.log('※ group共有なので調布・千歳烏山のページにも自動表示されます');
}
main();
