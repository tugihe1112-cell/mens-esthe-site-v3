import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
// ⚠️ INSERTは必ず service role（anon keyはRLSでサイレント無効 → ng-rules.md）
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const DRY = process.argv.includes('--dry-run');

const SHOP_ID = 'kanagawa_sagamihara_unison_spa';  // 表示120@9位のSEOページ。g_brand_unison_spaで全店共有

const content = `【入店】
家から近い調布の店を狙って突撃。いつも通り、店の評判やセラピストの写真をひと通り調べて、どんな店か頭に入れてから向かう派なのだが、この店はサイトの見せ方からしてなかなか攻めていて、"ここ、いろんな意味で大丈夫か…?"という不安と淡い期待が半々。そわそわしながらドアを叩いた。指名は天海さん、写真で当たりをつけての指名だった。

【ご対面】
出てきたのは、都会のオフィスにいそうな清潔感のある綺麗な人。身構えていたぶん、実物の好印象は嬉しい誤算で、ブスと言う人はまずいないと思う。接客もいい意味でこなれていて、責任感を持って丁寧に対応してくれる感じに好感が持てた。ルックスも対応も、今回は素直に"当たり"だった。

【施術】
料金は80分で2万円ほど、オプション込みでちょうどこの額に収まるよう組まれた上手い値付け。スタイルはスレンダーで、痩せすぎ?と言いたくなるほど綺麗なくびれのモデル体型。ただ胸は写真の印象より小さめでCくらい、巨乳好きの自分には少し物足りなかった（ここも"盛り"はある）。施術はソファから始まる少し変わった入りで、以降はうつ伏せ→カエル足→四つん這い→仰向けと王道の流れ。"密着"系のサービス精神はとにかく旺盛で、オプションを付けると最初から"完成形"で楽しませてくれる。ただ、段階を踏んで距離を縮める"過程"を味わいたい派には、いきなりゴールから始まるのは少し惜しいかもしれない。

【総評】
ルックスも接客も良く、人としての満足度は高い。一方でこの店、サービスの"線引き"がかなり曖昧で、振る舞い次第では"そこまで行くの?"という領域まで気配を感じる場面もあった。とはいえ相手が何者かも分からない世界、当方はそこは深追いしなかった——その手の過剰さを求めていない人には、むしろ身構える要素かもしれない。良い体験ではあったが、メンエスの枠を超えてきそうな空気も含めて、また指名するかは少し迷う。清潔感のある美人と、こなれた接客を、割り切った価格で気軽に楽しみたい人に向いた一軒だった。`;

const review = {
  id: 'owner_unison_spa_amami_yura_1',
  shop_id: SHOP_ID,
  therapist_id: `${SHOP_ID}_天海ゆら`,   // DBから自動解決して上書き（下記）
  therapist_name: '天海　ゆら',           // 同上。照合はスペース除去で行われる
  user_id: 'owner_manual',               // 即公開扱い
  user_name: '常連',
  rating: 3,
  course: '80分コース（オプション込み）2万円ほど',
  detailed_ratings: { cleanliness: 4, looks: 4, style: 4, service: 4, massage: 3, intimacy: 4 },
  tags: ['スレンダー', '清楚系', '20代後半'],
  is_public: true,
  content,
};

async function main() {
  // 1. 天海ゆら のtherapistレコードをDBから解決（id区切りのズレに強くする）
  const { data: tRows } = await supabase
    .from('therapists')
    .select('id, name, shop_id')
    .eq('shop_id', SHOP_ID)
    .ilike('name', '%天海%');
  const t = (tRows || []).find(r => r.name.replace(/[\s　]/g, '').includes('天海ゆら')) || (tRows || [])[0];
  if (t) {
    review.therapist_id = t.id;
    review.therapist_name = t.name;
    console.log(`■ therapist解決: id=${t.id} / name="${t.name}"`);
  } else {
    console.log('⚠️ 相模原に天海ゆらのtherapistレコードが見つからない → ハードコード値で続行（要確認）');
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
