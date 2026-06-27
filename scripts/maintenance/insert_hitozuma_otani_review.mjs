import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
// ⚠️ INSERTは必ず service role（anon keyはRLSでサイレント無効 → ng-rules.md）
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const DRY = process.argv.includes('--dry-run');

const SHOP_ID = 'hiroshima_hiroshima_hitozuma_san'; // 60表示@8.68・取りこぼし回収中（青山夫人に続く2件目）
const RID = 'owner_hitozuma_otani_1';

// 露骨/越境（ソープ比喩・お触りOK断定・拒否を押す描写）はng-rules通り"密着演出/線引き/潔く撤退"に置換済み
const content = `広島遠征の記録をもう一つ残しておく。前回とは別の日に、同じ店へ再び足を運んだ一日だ。電話で確認したところ、運良くすぐに空きがあり、すんなりと予約を取ることができた。
指定されたマンションに到着し、インターフォンを鳴らしてドアを開ける。するとそこには、胸元を大きく開けた装いの「姫」が立っていた。玄関先でこれほど大胆な装いで、万が一近所の住人に見られたらどうするのだろうかと勝手にヒヤヒヤしながらも、手招きされるまま鼻の下を伸ばして入室した。
明るい部屋で顔をよく見ると、年齢的には熟女の枠に入るのだろうが、非常に童顔で愛嬌のある「可愛らしいお姉さん」といった雰囲気である。もともとストライクゾーンが太平洋並みに広い私だが、最近とくに母性に飢えていたこともあり、心の中で「大当たり！」と快哉を叫んでしまった。スタイルも、胸はそこそこのサイズ感がありつつ、全体的にはモデルのようにすらっとしたスレンダー体型だ。
施術が始まると、適当な世間話を交えながら、噂の「パウダー」が登場した。これまであまり体験したことのない技法だったため最初は驚いたが、生粋のM気質である私がくすぐったさに過剰な反応を示すと、彼女はそれを面白がるように嬉々としてパウダーで攻め立ててきた。時折、際どいラインを掠めるようなタッチも織り交ぜてきて、このセラピストは男のツボをよく分かっているなという印象を受ける。ローテーションはうつ伏せから四つん這い、そして仰向けという流れで、最終的に私のおじさんボディは全身パウダーまみれに仕上がった。
特に印象に残ったのは仰向け時の展開で、密着度の高い演出を惜しみなく披露してくれ、これには大いに高揚させられた。密着の流れで自然と距離が近づく場面もあったが、一方で、こちらが調子に乗って核心部分へ踏み込もうとすると、そこは明確に線引きされていた。引き際を弁えるのも猛者の嗜みということで、潔く撤退する。サービス精神と節度が同居しているのは、むしろ安心して通えるポイントかもしれない。
広島はメンズエステの店舗数自体がそこまで多くないため、手札は限られてくる。今回のセラピストも非常に魅力的だったが、この店には他にも逸材が隠れていそうな予感がするので、次回はまた別の人を指名して再訪してみるのも悪くないと思っている。`;

const review = {
  id: RID, shop_id: SHOP_ID,
  therapist_id: `${SHOP_ID}_大谷`, therapist_name: '大谷', // DBから自動解決して上書き
  user_id: 'owner_manual', user_name: '常連', rating: 4,
  course: 'コース＋パウダーオプション（総額15,000円未満）',
  detailed_ratings: { cleanliness: 3, looks: 4, style: 4, service: 4, massage: 3, intimacy: 4 },
  tags: ['スレンダー', '可愛い系', 'ベテラン', '40代'],
  is_public: true, content,
};

async function ensureTherapist() {
  const { data: rows } = await supabase
    .from('therapists').select('id, name, shop_id').eq('shop_id', SHOP_ID).ilike('name', '%大谷%');
  const t = (rows || [])[0];
  if (t) { review.therapist_id = t.id; review.therapist_name = t.name; console.log(`  therapist既存: ${t.id} / "${t.name}"`); return; }
  const tid = `${SHOP_ID}_大谷`;
  if (DRY) { console.log(`  [DRY] therapist作成予定: ${tid} / "大谷"`); review.therapist_id = tid; return; }
  const { error } = await supabase.from('therapists').insert({ id: tid, shop_id: SHOP_ID, name: '大谷', image_url: null });
  if (error) { console.error('  ❌ therapist作成失敗:', error); process.exit(1); }
  console.log(`  ✅ therapist作成: ${tid}`); review.therapist_id = tid;
}

async function main() {
  const len = content.replace(/\s/g, '').length;
  console.log(`■ 本文字数（空白除く）: ${len}字 ${len >= 700 ? '✅ 700字以上' : '⚠️ 700字未満'}`);

  await ensureTherapist();

  const { data: ex } = await supabase.from('reviews').select('id').eq('id', RID).maybeSingle();
  if (ex) { console.log('⚠️ 既に存在 → スキップ'); return; }

  if (DRY) {
    console.log('--- DRY RUN ---');
    console.log(JSON.stringify({ ...review, content: content.slice(0, 55) + '…(省略)' }, null, 1));
    return;
  }
  const { data, error } = await supabase.from('reviews').insert(review).select();
  if (error) { console.error('❌ 挿入失敗:', error); process.exit(1); }
  console.log('✅ 挿入完了:', data?.[0]?.id);
  console.log(`索引URL: https://www.mens-esthe-map.jp/shops/${SHOP_ID}/threads/${review.therapist_id}`);
}
main();
