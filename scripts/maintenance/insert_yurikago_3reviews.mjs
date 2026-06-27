import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
// ⚠️ INSERTは必ず service role（anon keyはRLSでサイレント無効 → ng-rules.md）
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const DRY = process.argv.includes('--dry-run');

const SHOP_ID = 'osaka_umeda_kokoronoyurikago'; // SEO本命（30表示@9.6位）・g_solo＝このページにのみ表示

const REVIEWS = [
  {
    tname: '聖琉', age: '30', rid: 'owner_yurikago_seiryu_1', rating: 4,
    course: '120分18,000円（1日1名限定）',
    detailed_ratings: { cleanliness: 4, looks: 4, style: 3, service: 5, massage: 4, intimacy: 3 },
    tags: ['グラマー', '巨乳', '可愛い系', '30代'],
    content: `ルサンチマンの2回目となる訪問録を記す。今回は体力的な理由から、1日1名限定とされている120分コース（18,000円）を確保した。
彼女の魅力はなんといっても、その童顔と、鼓膜をくすぐるアニメヒロインのような愛らしい声にある。体型は豊満そのものであり、立派なバストと安産型のヒップを備えた、いわゆる「ぽっちゃり系」の王道を行く肉付きだ。おじさんとしては、この包み込まれるような安心感がたまらない。
ウェルカムティーをいただきながらの事前精算を済ませ、コリが気になる部位などのカウンセリングを実施する。シャワー室へ向かう際、「紙パンツは中で穿くか、外で穿くか」といった細やかな確認があるのは、地味にありがたい配慮である。
施術の滑り出しは、密着感を伴うストレッチから。包み込まれるような密着の演出を経て、うつ伏せでの足腰のストレッチ、そしてオイルへと移行する。ただし、この時点での密着度はそこまで高くなく、あくまで丁寧な施術がベースだ。
仰向けターンでは、頭側からのデコルテマッサージを受けながら、彼女の雄大なバストを見上げるという眼福の時間が用意されている。下半身のオイルは指圧やストレッチ要素が薄めで、最終盤に脚の付け根周辺をじっくりと流すスタイルだ。
際どいゾーンへの踏み込みはごく標準的であり、こちらの期待をスッと躱す技術に長けている。当然ながら個人的なオプション要求などは一切NGで、不用意なお触りは即座に制止される鉄壁の防御力を誇る。過度な刺激を求めるのではなく、純粋な癒やしと、肉感的なボディによるマッサージを心ゆくまで堪能するためのセラピストと言える。美魔女ならぬ癒やし系の彼女は、疲れ切ったおじさんの避難所のような存在であった。`,
  },
  {
    tname: '茉莉奈', age: '39', rid: 'owner_yurikago_marina_1', rating: 3,
    course: '120分18,000円（指名料込み）',
    detailed_ratings: { cleanliness: 4, looks: 4, style: 4, service: 5, massage: 5, intimacy: 2 },
    tags: ['高身長', '美脚', '色白', '美人系'],
    content: `新大阪エリアのマンションに店舗を構える「こころのゆりかご」への初突撃記録である。今回は120分コース、指名料込みで18,000円の枠を手配した。
事前情報通り、エントランスのチャイムには無言でのオートロック解錠。玄関前では茉莉奈嬢が満面の笑みで出迎えてくれた。まず驚かされたのはその長身っぷりだ。当方175センチであるが、目線がほぼ同じ位置にある。切れ長で涼しげな目元から、一瞬アジア系の外国籍かとも推測したが、生粋の日本人とのこと。色白でスラリと伸びた脚線美を持ち、実年齢は40代半ばらしいが、肌ツヤの良さからずっと若々しい印象を受ける。
お茶をすすりながらの歓談と支払いを終え、シャワールームへ。紙製アンダーウェアはトランクスとビキニの2択が用意されており、迷わずホールド感の強いビキニタイプを装着してベッドへダイブした。
彼女はどうやら昼間も健全なリラクゼーションサロンで腕を振るっているらしく、その施術スキルは界隈の平均を優に超えている。絶妙な力加減に身を任せていると、世間話の途中で「ここは特別なサービスが無いから精神的に楽に働ける」という実直な発言が飛び出した。その瞬間、猛者としては「今日の勝負は負け確だ」と天を仰ぎそうになったが、それを補って余りあるトークスキルとマッサージの心地よさに、次第にそんな邪念はどうでもよくなっていった。
施術の構成は非常に王道である。うつ伏せからのカエル足、四つん這いの体勢を経て、仰向けでの添い寝スタイルへと進む。時間が少し余ったため、ラストは丁寧なハンドマッサージで締めくくられた。
際どいラインへのアプローチは何度かあるものの、本人の宣言通りそれ以上の進展はない。いわゆる裏メニューの類も存在しない、まさに純度100%のメンズエステを体現したような時間であった。疲労回復の観点では大いに満足したものの、男の闘争本能としてはもう一歩先を求めたかったというのが本音である。しばらく冷却期間を置いてからの再訪となりそうだ。`,
  },
  {
    tname: '彩華', age: '42', rid: 'owner_yurikago_ayaka_1', rating: 4,
    course: '150分23,000円（特別指名料込み）',
    detailed_ratings: { cleanliness: 5, looks: 4, style: 4, service: 5, massage: 5, intimacy: 4 },
    tags: ['スレンダー', '巨乳', '美人系', '40代'],
    content: `新大阪を舞台とした、彩華嬢との2度目の対戦記録を残しておく。今回は特別指名料を含めた150分コース（23,000円）で予約を確定させた。事前のWEB予約からLINEでのやり取りに至るまで、レスポンスは極めてスムーズである。
オートロックの無言解錠を経て指定の部屋へ赴くと、素敵な笑顔の彼女が招き入れてくれる。宣材写真はそれなりに補正の魔法がかかっているものの、実物も十分に愛嬌のある整った顔立ちだ。特筆すべきはそのプロポーションである。胸元に深く刻まれた谷間に否応なく視線を奪われ、おじさんの心拍数が跳ね上がるのを感じた。単なる細身ではなく、引き締まった中にも女性らしい柔らかな肉感を残した、見事なスレンダーボディである。
ウェルカムドリンクやおしぼり、さらにはちょっとした茶菓子まで用意されており、おもてなしの精神が非常に高い。穏やかなトーンでお互いの好きな映画などの世間話を交わしながらシャワーへと案内されるため、この時点で既にかなりの精神的デトックスが完了している。
施術のローテーションは、うつ伏せからのパウダー、オイル、カエル足、そして仰向けという流れ。序盤の指圧がまた絶品で、こちらの腕を力強くホールドしながらのプレスは、個人的にかなりツボに入った。
このうつ伏せの最中、室内ミラー越しに彼女の形の良いヒップラインを鑑賞するという高等テクニックが発動する。下着越しの密着演出も織り交ぜられ、脳内の熱量が上がりっぱなしである。そこから足元、そして脚の付け根へとパウダーを用いたフェザータッチが続き、心地よさは最高潮に達する。
オイルマッサージに移行してからは、随所にフェザータッチが織り交ぜられ、全身の力が完全に抜け落ちるような感覚に陥る。カエル足のターンでは、際どいラインまで攻めるダイナミックなフェザータッチが展開される。
終盤は頭側からのデコルテケア。ここでも彼女の豊かな胸元が視界いっぱいに広がり、ふわりと漂う上質な香りと相まって、究極の眼福空間が完成する。
最後は映画の感想戦の続きを楽しみながらのマーメイドスタイルで終了。今回が2回目の指名となるが、いわゆる最後までといった展開は一切ない。そのため、過激なお触りに対する寛容度などは検証していない。総じて、高いマッサージ技術と極上の接客を純粋に楽しむ、正統派メンズエステの最適解の一つと言える素晴らしい時間であった。`,
  },
];

async function ensureTherapist(tname) {
  const tid = `${SHOP_ID}_${tname}`;
  const { data: existing } = await supabase.from('therapists').select('id, name').eq('id', tid).maybeSingle();
  if (existing) { console.log(`  therapist既存: ${tid}`); return { tid, tname: existing.name }; }
  if (DRY) { console.log(`  [DRY] therapist作成予定: ${tid} / name="${tname}"`); return { tid, tname }; }
  const { error } = await supabase.from('therapists').insert({ id: tid, shop_id: SHOP_ID, name: tname, image_url: null });
  if (error) { console.error('  ❌ therapist作成失敗:', error); process.exit(1); }
  console.log(`  ✅ therapist作成: ${tid}`);
  return { tid, tname };
}

async function main() {
  for (const r of REVIEWS) {
    const len = r.content.replace(/\s/g, '').length;
    console.log(`\n=== ${r.tname} (${r.age}) ===  本文 ${len}字 ${len >= 700 ? '✅' : '⚠️ 700字未満'}`);

    const { tid, tname } = await ensureTherapist(r.tname);
    const review = {
      id: r.rid, shop_id: SHOP_ID, therapist_id: tid, therapist_name: tname,
      user_id: 'owner_manual', user_name: '常連', rating: r.rating,
      course: r.course, detailed_ratings: r.detailed_ratings, tags: r.tags,
      is_public: true, content: r.content,
    };

    const { data: ex } = await supabase.from('reviews').select('id').eq('id', r.rid).maybeSingle();
    if (ex) { console.log('  review既存 → スキップ'); continue; }

    if (DRY) {
      console.log('  [DRY]', JSON.stringify({ ...review, content: r.content.slice(0, 45) + '…(省略)' }));
      continue;
    }
    const { data, error } = await supabase.from('reviews').insert(review).select();
    if (error) { console.error('  ❌ review挿入失敗:', error); process.exit(1); }
    console.log('  ✅ review挿入:', data?.[0]?.id);
    console.log(`     索引URL: https://www.mens-esthe-map.jp/shops/${SHOP_ID}/threads/${tid}`);
  }
  console.log('\n完了。');
}
main();
