import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
// ⚠️ INSERTは必ず service role（anon keyはRLSでサイレント無効 → ng-rules.md）
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const DRY = process.argv.includes('--dry-run');

const SHOP_ID = 'kanagawa_sagamihara_unison_spa';  // 表示120@9位のSEOページ。g_brand_unison_spaで全店共有

const content = `【入店】
ここは何度か通っている店で、今回はたまたま空きがあるとのことで藤城さんを指名した。プロフィール写真を見て「タイプかもしれない」と野生のカンが働いたのがきっかけ。料金は最初から最後まで含めて2万円ほどと相場からすればかなり安い部類で、そのぶんのクオリティと割り切れば気軽に遊べる価格帯ではある。複数エリア展開で在籍も多く、フットワーク軽く使える店だとは思う。

【ご対面】
入室して正直に思ったのは、写真から受けた印象とは方向性がだいぶ違うな、ということ。良くも悪くも華やかな"夜の街"系の雰囲気で、清楚さや上品さを期待していると面食らうかもしれない。サイトには胸が大きいと書いてあったが実際に会うとそこまでではなく、ここも"盛り"が入っている。写真でタイプと感じて指名しただけに、このギャップは少し残念だった。

【施術】
マッサージはうつ伏せ→仰向け→カエル足→四つん這いと、よくある一般的な流れ。ただ率直に言って、きちんと時間を計っているのか不思議になるくらい雑で、施術そのものへの丁寧さやこだわりはあまり感じられなかった。オプションの密着対応は一通りしてくれるものの、初回ということもあってか終始遠慮がちで、"本気度"のようなものは伝わってこない。良くも悪くも事務的で、特別感は薄かった。

【総評】
コミュニケーションは上手で、話していて気まずさはなく、人柄で嫌いになる人はまずいないと思う。ただ、写真とのギャップ・施術の雑さ・密着の淡白さが重なって、自分は再訪したいとは思えなかった。とにかく安く、スッキリすることだけが目的なら選択肢としてアリだが、ルックスのイメージ通りや丁寧さ・濃い時間を求める人には物足りない。期待値を上げず、割り切って遊ぶ前提なら、という一回だった。`;

const review = {
  id: 'owner_unison_spa_fujishiro_keika_1',
  shop_id: SHOP_ID,
  therapist_id: `${SHOP_ID}_藤城けいか`,   // DBから自動解決して上書きする（下記）
  therapist_name: '藤城　けいか',            // 同上。照合はスペース除去で行われる
  user_id: 'owner_manual',                  // 即公開扱い
  user_name: '常連',
  rating: 2,
  course: 'コース＋オプション（計2万円ほど）',
  detailed_ratings: { cleanliness: 3, looks: 2, style: 2, service: 3, massage: 2, intimacy: 2 },
  tags: ['小柄', 'ギャル系', '20代前半'],
  is_public: true,
  content,
};

async function main() {
  // 1. 藤城けいか のtherapistレコードをDBから解決（id/正式名のズレに強くする）
  const { data: tRows } = await supabase
    .from('therapists')
    .select('id, name, shop_id')
    .eq('shop_id', SHOP_ID)
    .ilike('name', '%藤城%');
  const t = (tRows || []).find(r => r.name.replace(/[\s　]/g, '').includes('藤城けいか')) || (tRows || [])[0];
  if (t) {
    review.therapist_id = t.id;
    review.therapist_name = t.name;
    console.log(`■ therapist解決: id=${t.id} / name="${t.name}"`);
  } else {
    console.log('⚠️ 相模原に藤城けいかのtherapistレコードが見つからない → ハードコード値で続行（therapist_nameでの表示は機能するが要確認）');
  }

  // 2. 文字数チェック（700字以上＝自動公開＆閲覧権トリガー条件）
  const len = content.replace(/\s/g, '').length;
  console.log(`■ 本文字数（空白除く）: ${len}字 ${len >= 700 ? '✅ 700字以上' : '⚠️ 700字未満'}`);

  // 3. 重複チェック
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
  console.log(`索引URL: https://www.mens-esthe-map.jp/shops/${SHOP_ID}/threads/${review.therapist_id}`);
  console.log('※ group共有なので調布・千歳烏山のページにも自動表示されます');
}
main();
