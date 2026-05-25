/**
 * Silk の口コミを サイトフォーマットに書き直して更新
 * 実行: node scripts/maintenance/transform_silk_reviews.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (isDryRun) console.log('=== DRY RUN ===\n');

// ============================================================
// 書き直した口コミデータ
// ============================================================
const TRANSFORMED = [
  {
    therapist_name_match: '永井 さつき',
    content: `【入店】
都内で夜の時間が空いたため、以前から名前だけ知っていたシルクへ思い切って初訪問。公式の写真はかなり控えめな見せ方をしていて実際どんな子がいるのか想像しにくかったが、プロフィールの雰囲気から良さそうと判断して指名した。受付は親切で待たされることもなく、スムーズに案内された。

【ご対面】
実際に会ってみると、想像よりも好みのビジュアルだった。年齢は若め、体型はほっそりしているのにサイズは主張強め、という理想的なバランス。接し方が自然体で、いわゆるセラピスト感がなく普通の女の子と話しているような感覚が心地よかった。素のキャラクターが透けて見える感じで好印象。

【施術】
指名料込み19,000円の90分コース。施術中は会話が途切れなくて楽しかった。マッサージそのものも丁寧で、身体はしっかりほぐれた。後半は期待して色々とお願いしてみたが、すべて笑顔でかわされ、触れてもらえた範囲はかなり限定的だった。こちらが頑張るほど柔らかく躱されるのが逆に印象的だった。

【総評】
ルックスと会話の楽しさについては文句なし。ただし施術の密着度という観点では健全寄りで、期待通りにはいかなかった。癒しを目的にするならかなり満足できると思う。それ以上を求めるには相性や運もあるかもしれない。次回があるとすれば、目的を変えて再挑戦したい。`,
    detailed_ratings: {
      cleanliness: 3,
      looks: 5,
      style: 5,
      service: 4,
      massage: 4,
      intimacy: 2,
    },
    rating: 3.8,
    tags: ['スレンダー', '美人系', 'お姉さん系', '会話上手'],
  },

  {
    therapist_name_match: '伊藤 ひかり',
    content: `【入店】
仕事帰りに時間が空いたので、以前から気になっていたシルクへ初訪問。立地は悪くなく、入口の雰囲気も落ち着いていた。スタッフの対応は丁寧で、待ち時間もほとんどなかった。

【ご対面】
サイトの写真で期待値を上げすぎたのが正直なところ。実際に会うと印象はかなり違って、スタイルは写真ほど細くなく、顔立ちも加工が入っていたんだなと実感した。バストはそこそこあるが、広告のイメージと比べると控えめな印象で、肌の仕上がりも少し気になった。ギャップへの覚悟は必要かもしれない。

【施術】
衣装チェンジ込みで22,000円の90分コース。前半はほぼ普通のマッサージで、このまま終わるのかと思っていたが仰向けになってから急に積極的な雰囲気に変わった。グリップは少し力が強くて慣れるまで時間がかかったが、最終的にはしっかり対応してもらえた。会話は弾まず、ずっと彼女の身の上話を聞く形になってしまった。

【総評】
後半の展開は期待以上だったが、写真のイメージと実物のギャップが大きく、トータルでは少し割高感がある。接客の質という意味では改善の余地を感じた。遠方からわざわざ行くほどではないが、近くに住んでいれば目的を絞ってたまに行くのはありかもしれない。`,
    detailed_ratings: {
      cleanliness: 3,
      looks: 2,
      style: 3,
      service: 2,
      massage: 3,
      intimacy: 4,
    },
    rating: 2.8,
    tags: ['グラマー'],
  },

  {
    therapist_name_match: '本田 まみ',
    content: `【入店】
スタイル重視で探していたところ、SNSでプロフィールを見てひと目で気になったのが本田さん。細身なのにバストがしっかりあるタイプを探していたので、条件にぴったりだった。予約はオンラインのやりとりだけで完結し、非常にスムーズ。室内は清潔感があり、開始前から気持ちよく過ごせた。

【ご対面】
SNS上の写真は隠している部分が多かったが、顔の印象は概ね同じ。そして肝心のスタイルはむしろ想像より良かった。細さとボリュームの両立という点で、これまで会った中でもトップクラスだと思う。テンションが上がるのを自分でも感じた。話し方も穏やかで、自然と会話が続く雰囲気だった。

【施術】
オプション込みで24,000円の90分コース。マッサージは丁寧で手を抜いている感じは全くなく、身体をしっかりほぐしてくれる。後半になるにつれてより密接な流れになり、積極的にリードしてくれる場面も多かった。バストへのタッチは最初断られたが、タイミングを見て再度お願いすると快く応じてもらえた。全体を通じてとても充実した時間だった。

【総評】
ビジュアル・対応・施術の全てがバランスよく高水準だった。会話の質も高く、変に気を遣う必要がなくリラックスできた。料金は高めだが、この内容なら十分に納得できる。また来たいと素直に思える数少ないセラピストで、次回も同じ指名を入れる予定。`,
    detailed_ratings: {
      cleanliness: 5,
      looks: 4,
      style: 5,
      service: 5,
      massage: 4,
      intimacy: 5,
    },
    rating: 4.7,
    tags: ['巨乳', 'スレンダー', '癒し系', '会話上手', 'リピート確定'],
  },
];

// ============================================================
// 更新処理
// ============================================================
for (const item of TRANSFORMED) {
  // therapist_name と user_id で対象レコードを特定
  const { data, error: fetchErr } = await supabase
    .from('reviews')
    .select('id, therapist_name')
    .eq('therapist_name', item.therapist_name_match)
    .eq('user_id', 'menesthe_import');

  if (fetchErr || !data || data.length === 0) {
    console.log(`❌ ${item.therapist_name_match}: レコード見つからず`);
    continue;
  }

  console.log(`✏️  ${item.therapist_name_match} (${data.length}件)`);

  if (isDryRun) {
    console.log('content preview:', item.content.slice(0, 80) + '...');
    console.log('ratings:', item.detailed_ratings);
    console.log('rating:', item.rating);
    continue;
  }

  for (const row of data) {
    const { error } = await supabase
      .from('reviews')
      .update({
        content: item.content,
        detailed_ratings: item.detailed_ratings,
        rating: item.rating,
        tags: item.tags,
      })
      .eq('id', row.id);

    if (error) {
      console.error(`  ❌ 更新失敗:`, error.message);
    } else {
      console.log(`  ✅ ${row.id} 更新完了`);
    }
  }
}

console.log('\n完了');
