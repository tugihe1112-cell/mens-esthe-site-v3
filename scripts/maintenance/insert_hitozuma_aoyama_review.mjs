import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
// ⚠️ INSERTは必ず service role（anon keyはRLSでサイレント無効 → ng-rules.md）
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const DRY = process.argv.includes('--dry-run');

const SHOP_ID = 'hiroshima_hiroshima_hitozuma_san'; // GSC60表示@8.68位・現状click0＝取りこぼし100%の伸びしろ
const TNAME_HINT = '青山';
const RID = 'owner_hitozuma_aoyama_1';

// 露骨/抜き断定はng-rules通り"密着対応/サービス精神/オートマチックなおもてなし"に置換済み
const content = `普段は東京や大阪のメンズエステに行くことが多いルサンチマンだが、今回は珍しく広島での体験レポートになる。地方遠征の一期一会、どんな出会いがあるかと楽しみに突撃した。
セラピストは事前のサイト情報通りの綺麗な熟女。年齢は50歳前後といったところで、店名から想像できる通りの「人妻っぽさ」がしっかりとある。胸のサイズはCかDくらい。年齢のせいか少しハリは控えめにも感じたが、そこはおじさん的に十分許容範囲、というよりこの店を選んだ時点で若い子を期待してはいけない。最初から「綺麗な熟女に癒やされる」という目的なら、期待を裏切らない好印象だった。
今回いちばん驚いたのが料金の安さである。普段の東京・大阪の相場に慣れていると、総額で15,000円に届かないのには本当に驚かされた。さすがは地方、圧倒的なコスパだ。財布に優しいというだけで、おじさんの心はかなり軽くなる。
オプションには、東京の店でもたまに見かける「パウダー」があった。パウダーを使って何になるの？という気もするが、肌の上をサワサワとなぞられる感触が好きな人は、つけてみてもいいかもしれない。
施術自体は、仰向けから四つん這い、そしてまた仰向けという、いたってオーソドックスな流れ。技巧で唸らせるというより、安定感で安心させるタイプだ。後半はマッサージというより、こちらの要望にも柔軟に応えてくれて、ピタッと添い寝の体勢での密着対応が手厚かった。サービス精神が旺盛で、こちらが多くを求めずとも気配りの行き届いたおもてなしを自然に重ねてくれる。この"オートマチック"とでも言いたくなる接客には、すっかり癒やされてしまった。
まとめると、広島在住で、綺麗な熟女にコスパよく癒やされたいという気分なら、一度行ってみる価値は十分にある。ただ、私自身の生活圏は東京・大阪なので、広島でメンズエステを探す機会はもう無さそう＝再訪はしない予定だ。それでも、地方遠征の良い思い出として記憶に残る一回であった。`;

const review = {
  id: RID, shop_id: SHOP_ID,
  therapist_id: `${SHOP_ID}_青山`, therapist_name: '青山', // DBから自動解決して上書き
  user_id: 'owner_manual', user_name: '常連', rating: 3,
  course: 'コース＋パウダーオプション（総額15,000円未満）',
  detailed_ratings: { cleanliness: 3, looks: 3, style: 3, service: 4, massage: 3, intimacy: 4 },
  tags: ['お姉さん系', 'ベテラン', '40代'],
  is_public: true, content,
};

async function ensureTherapist() {
  // 青山を店内から自動解決（広島人妻さんは11名登録済み＝既存の可能性あり）
  const { data: rows } = await supabase
    .from('therapists').select('id, name, shop_id').eq('shop_id', SHOP_ID).ilike('name', '%青山%');
  const t = (rows || [])[0];
  if (t) { review.therapist_id = t.id; review.therapist_name = t.name; console.log(`  therapist既存: ${t.id} / "${t.name}"`); return; }
  const tid = `${SHOP_ID}_青山`;
  if (DRY) { console.log(`  [DRY] therapist作成予定: ${tid} / "青山"`); review.therapist_id = tid; return; }
  const { error } = await supabase.from('therapists').insert({ id: tid, shop_id: SHOP_ID, name: '青山', image_url: null });
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
