import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const AREA_ID = 'tokyo_nakano_nakano'; // 中野区・中野
const SHOP_ID = `${AREA_ID}_golden`; 
const GROUP_ID = 'g_golden';

// --------------------------------------------------
// 料金システム (画像から一字一句正確に抽出)
// --------------------------------------------------
const SYSTEM_DATA = [
  {
    courseName: '新規限定コース',
    description: '',
    prices: [
      { time: '90分', price: '￥15,000' }
    ]
  },
  {
    courseName: 'フリー限定コース',
    description: '',
    prices: [
      { time: '60分', price: '￥10,000' },
      { time: '80分', price: '￥12,000' }
    ]
  },
  {
    courseName: 'マッサージ',
    description: '',
    prices: [
      { time: '70分', price: '￥16,000→￥13,000' },
      { time: '90分', price: '￥19,000→￥16,000' },
      { time: '120分', price: '￥22,000' }
    ]
  }
];

const HTML_CONTENT = `
<div id="staff_list" class="clearfix">
  <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%82%e3%81%84%e2%ad%90%ef%b8%8f24%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">NEW</p>      <h3 class="title rich_font"><span>⭐️あい⭐️(24)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/04/79CC07D1-D24B-453A-99E8-71AA54C9AD2D-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>新宿エリアから人気セラピスト入店！
お顔よし！愛嬌よし！性格良し！
会って2秒で分かる超可愛い女性セラピスト！見つめられたらイチコロ！滑らかな雪化粧を纏ったかのような肌、クリっとした人を虜にする目元、どこからみても可愛さと美貌があります！　優しい性格にあどけなさも残る可愛らしいお顔をした、まるで穢れを知らぬ天使…それだけだけではありません！天使の内にはとんでもないものが潜んでいました！施術の腕も大絶賛！！ 柔らかなタッチと際の際まで余すところのない施術は最上の幸福をもたらす事でしょう！このコラボはまさに悪魔的！天使と悪魔の競演をぜひご堪能ください！出合った瞬間にお客様はドキドキ！あの頃の恋心を高めてくれます！　一緒にいるだけで心が和む優しい雰囲気、心の奥にスーッと入り込む軽やかな雰囲気、ふんわりと優しい空気で包み込んでしまいます！！スベ肌超密着のマッサージを体験できる場所がそう多くはありません！是非お試し下さい！天性の人を引き付ける魅力に溢れている才色兼備とは彼女の事です！絶対的な確信を持ってご案内いたしますので、どうぞ心から彼女の施術に身を委ね、特別な癒しの時間をお楽しみください。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%95%e3%82%89%e2%ad%90%ef%b8%8f24%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">NEW</p>      <h3 class="title rich_font"><span>⭐️さら⭐️(24)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/04/4E4EF092-DB98-41ED-A322-834B637A06C6-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>業界未経験！！
初めてお会いする瞬間から、思わず守ってあげたくなるような可憐な雰囲気をまとった。その柔らかな微笑みと親しみやすい空気感に、日々の疲れもふっとほどけてゆきます。包み込むような優しさを併せ持ち、気づけばそばにいるだけで心が和んでしまうことでしょう。独自の“あまふわ時間”は、彼女ならではの癒し系の魅力がたっぷり詰まっています。特に、しなやかな手つきで繰り広げられるカエル足の施術は、多くのお客様から「まるで時間が止まったような心地よさ」と高い評価をいただいております。絶妙な圧と繊細なタッチで、日常の緊張や疲労をすみずみまで解きほぐしてくれます。お身体にそっと寄り添うような施術と、優しい声掛けに包まれた時間は、まさに非日常の癒しそのもの。ふんわりとした存在感と可愛らしさに癒されながら、心身ともにリフレッシュしていただけることでしょう。ぜひ、特別なひとときをご堪能ください。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%82%89%e3%82%89%e2%ad%90%ef%b8%8f24%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">NEW</p>      <h3 class="title rich_font"><span>⭐️らら⭐️(24)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/04/4928C01C-6883-4037-86F4-8BD225EC186D-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>業界未経験！
初対面でも構えずに過ごせる柔らかな空気感と、よく笑う親しみやすさで、
会話も施術も心地よい時間を提供します。マーメイド施術では流れるように全身を包み込み、マッサージでは思考までゆるむような深いリラックスへ導きます。落ち着いて話を聞いてほしい方、静かに整う癒しを求める方におすすめのセラピストです。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e3%81%82%e3%81%84/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">NEW</p>      <h3 class="title rich_font"><span>⭐️めい⭐️(24)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/04/1A835B22-AC1D-4488-A28D-D3DECED2FB95-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>彼女は、まさに「アイドル級」の可愛さと「美白」の肌を持つ魅力的な女性です。その清楚系の雰囲気は、一瞬で心を奪うこと間違いなし！施術を受けた瞬間、まるで手のひらに包まれるような、夢のようなひとときを過ごせます。さらに清楚系の魅力は、まさに男性の心を鷲掴みにします！彼女との会話は、まるで初恋のようにドキドキすること間違いなし。エステの時間が終わる頃には、彼女の虜になってしまうこと間違いありません。そんな施術を受けることで、日常の疲れを忘れ、心身ともにリフレッシュできること間違いなしです。ぜひ、彼女の魅力に触れて、極上のリラクゼーションタイムをお楽しみください。お客様のご来店を心よりお待ちしております！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%bf%e3%81%8f%f0%9f%91%9122%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">電撃復帰</p>      <h3 class="title rich_font"><span>⭐️みく⭐️(22)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/02/64EDB790-E749-4B80-B3AC-92AAE8F3F092-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>小柄な可愛い系女子！！清楚な雰囲気に色白でしなやかなボディーラインにっこりと微笑む笑顔が愛らしく、その中にほのかに香る大人らしさ、お客様のハートに忘れられない印象を刻み込むこと間違いないセラピストさんです！その清純で愛くるしい彼女の表情は、見ているだけで癒やし効果、リラックス効果があるのではないでしょうか。
性格、愛嬌、ルックスどれをとっても人気要素が詰まっております！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%95%e3%81%a8%e3%81%bf%e2%ad%90%ef%b8%8f27%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">3月度パネル指名率No.2</p>      <h3 class="title rich_font"><span>⭐️すい⭐️(24)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/03/F6D2D008-86A9-430D-93D5-3776BAD5A65E-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>最強の逸材！愛嬌！御奉仕満点！！アイドル系美少女！丁寧で一生懸命！「お客様に癒やされてほしい」というひたむきな想いが伝わってくる尽くす施術は、心までじんわり解きほぐされる心地よさです！どこかホッとするような癒やし系オーラと、24歳らしい落ち着いた雰囲気を併せ持つ彼女。お仕事帰りや、ちょっと元気をもらいたい時、ぜひ彼女の最高の笑顔に会いに来てくださいね！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%8b%e3%82%8c%e3%82%93%e2%ad%90%ef%b8%8f23%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">NEW</p>      <h3 class="title rich_font"><span>⭐️かれん⭐️(23)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/03/FD86B4B0-B216-4D88-8C84-D2F53069EF30-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>色白で透明感のある雰囲気がとても印象的です！むっちり好きの方には、たまらない！柔らかなバストラインとヒップの丸みが施術中のほどよい密着感を生み出し、自然と心身の力が抜けていきます！
得意のディープ系トリートメントは、温かなオイルを使いながら首元から脚先まで丁寧に流していく安定感のある手技でじんわり深いところまでほぐしてくれるので日頃の疲れがゆっくり解けていくのを実感していただけるはずです。おっとりした笑顔とやさしい話し方で、入室した瞬間から空気がふっと和らぐ癒し系会話も心地よく、静かに過ごしたい方にもおすすめです。自然と心身のおっとりした笑顔とやさしさで丁寧な施術がクセになるセラピストさんご予約が埋まりやすいので、お早めにどうぞ！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%bf%e3%82%84%e3%81%b3%e2%ad%90%ef%b8%8f30/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">電撃復帰</p>      <h3 class="title rich_font"><span>⭐️みやび⭐️(30)</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/02/5C18128A-3495-425A-B57D-D7C93A43A477-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>スタイル抜群で気品あるお顔立ちの美女！ほっそりとした長い手足に新雪のように白く輝く美肌や美しい輪郭に、言葉では表す事のできない清楚で上品なオーラを持った女性でございます！備わった知性やマナーから彼女の育ちの良さがはっきりとわかります。身だしなみ・心遣い・言葉遣いから相手に対する気遣いなど全てにおいて完璧な女性でございます。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%aa%e3%81%8e%e3%81%95%e2%ad%90%ef%b8%8f26%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">NEW</p>      <h3 class="title rich_font"><span>⭐️なぎさ⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/02/A1F4858C-6417-48D5-816B-076B8AC13398-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>きっと中野エリアで１番の巨乳Ｊカップ美少女！お洋服の上からでもいやらしい胸付きに興奮を覚えるッ！！大きいだけでなく形、弾力ともに☆★最高レベル★☆神がかりにえっちすぎるし！！こんなおっπで貴方に絡みつくお時間は至福のひと時を感じること間違いなし！まさに"天国"の様な素敵な空間に誘われることでしょう！勿論胸だけじゃありません！綺麗な顔立ちながら幼い雰囲気も併せ持ちます！性格もとっても明るく話しやすくて素直で優しいのでどんなお客様でもた～っぷりおもてなし！必ず貴方にとって忘れられない日になることでしょう！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%97%e3%82%85%e3%81%aa%e2%ad%90%ef%b8%8f27%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">NEW</p>      <h3 class="title rich_font"><span>⭐️しゅな⭐️(27)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/02/3ED9854C-0EB2-4245-A221-4F4146835A93-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>メンエス未経験！！思わず時間を忘れてしまうほど、甘美な癒しの世界へと誘う彼女！初めて出会った瞬間、ほんわかとした優しい空気に包まれ、心がふんわりと解けていく感覚を覚えることでしょう！その笑顔と包容力、そして柔らかな雰囲気は、まさに沼にハマるような感覚！一度味わえば、もう彼女の虜になること間違いなし！彼女が繰り出すトロトロトリートメントは、全身をゆっくりと時間をかけて、まるでとろけるような心地よさで満たしてくれます！指先が肌を流れるたび、熱を帯びた快感がじわじわと広がり、思わずうっとりと身体を委ねてしまう！その絶妙なタッチは、日常の疲れやストレスを一瞬で忘れさせ、深いリラクゼーションへと導きます！そして、思わず見惚れてしまうほどの魅力的な大きなバスト！圧倒的な存在感を放つ抜群のボディライン。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%82%8b%e3%81%aa%e2%ad%90%ef%b8%8f26%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">3月度パネル指名率No.5</p>      <h3 class="title rich_font"><span>⭐️るな⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/01/BBDFA528-B618-4724-A3C4-A04E7D94CAEC-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>業界未経験！！！
洗練されたグラマラスなボディが魅力的なグラビアアイドルのようなセクシーな魅力と、その圧倒的な存在感で男性の目を釘付けにし、心の奥まで癒してくれること間違いなし！その柔らかな手つきで疲れた体を優しくほぐしてくれます！温かくて力強い手のひらが触れるたびに、日々のストレスや疲労がすーっと溶けていくような感覚に包まれることでしょう！リンパの流れを整えることで全身の疲れを癒し。そして、、、癒しと共に隠れたS気質！攻めるのが大好き！責められるのが大好きなお客様は、Sな施術を受けて心も体も満たされること間違いありません！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%82%e3%81%84%e3%82%8b%e2%ad%90%ef%b8%8f25%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">NEW</p>      <h3 class="title rich_font"><span>⭐️あいる⭐️(25)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/12/4EE864C0-E8CA-4BC8-B674-197BB0A4B81E-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>一目見てパーフェクトなルックス!華奢なボディーは本当に二度見してしまいました。“絢爛”そして、ロマンスにあふれた極上の出逢いとなることをお約束いたします。全ての問題を解決させる癒しを秘めたお嬢様・・・、それはきっと「清純さ」が私たちの心をやさしく開放してくれるからなのでしょう。理性崩壊をさせる快感と抑えきれない興奮をもたらし、これ以上に無い至福のお時間を味わえる事は間違い御座いません!</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%af%e3%82%8b%e3%81%8b%e2%ad%90%ef%b8%8f26%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️はるか⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/11/5334AF3A-7873-4D06-AA7E-57E615CDBEB0-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>メンエス未経験！！親しみやすい笑顔と優しい声に癒されながら、しっかりとした施術で心も体も軽やかに。日常の喧騒を忘れて、安らぎの時間をぜひご堪能ください。心まで温めてくれる彼女の施術が、あなたを特別な癒しの世界へと導きます。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%ad%e3%81%ad%e2%ad%90%ef%b8%8f21%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ねね⭐️(21)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/11/A8DE228B-4947-4165-9C65-83E6079B87C8-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>夜のお仕事未経験！スレンダー美女で子猫系！彼女の魅力はそのモデル系のスタイルだけでなく、完璧なホスピタリティにあります。一度体験すればその虜になること間違いなし。彼女の得意プレイである四つん這いの施術は、まるで一流のパフォーマンスを観るかのような感動を与えてくれるでしょう。柔らかな指先が、日々の疲れを優しく解きほぐし、心地よい時間を提供します。彼女の温かい微笑みと丁寧な接客は、リラックスした雰囲気を作り出し、訪れるたびに心身ともにリフレッシュできます。ぜひ、そんな魅力あふれる施術を一度お試しください。その瞬間から、他では味わえない贅沢なひとときを過ごせることをお約束します。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%82%86%e3%81%8d%e3%81%ae%e2%ad%90%ef%b8%8f20%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">電撃復帰</p>      <h3 class="title rich_font"><span>⭐️ゆきの⭐️(20)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/09/81EED8D5-5E43-4F54-8664-3D66AF30FF41-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>以前当店で人気だったセラピスト電撃復活！！トップクラスの問い合わせ！リピート率！スタイル抜群！愛嬌良し！非の打ち所がありません！以前ご指名していたお客様も初めましてのお客様も必ず喜んで頂けると思います！ご予約埋まってしまう感じでしたので是非この際にお問い合わせ、ご予約よろしくお願いします！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%82%86%e3%81%82%e2%ad%90%ef%b8%8f24%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ゆあ⭐️(24)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/08/93D0553F-9184-41F7-93D8-0D34211B561B-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>説明不要の圧倒的美女です。100％全てのお客様に満足していただける自信がございます。清楚キレカワなルックスにＨカップのお胸、スタイルも何も説明する必要はありません。性格はおっちょこちょいとの事でそれもまた可愛らしい内面です！ご予約は争奪戦になること間違い無しですのでお早めのご予約をお待ちしています。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%bf%e3%82%8b%e3%81%8f%e2%ad%90%ef%b8%8f23/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️みるく⭐️(23)</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/06/81052204-5BF1-4D0E-8957-82F2B2C17AA5-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>有名店からの人気セラピスト入店！！小柄で可愛くておっぱいはＦカップという最高のセラピスト！愛嬌も抜群で性格も良く、関西弁のおっとりしたおしゃべりも楽しいから誰もが好きになってしまいます♡しかも密着イチャイチャ施術に我慢限界！ぜひ実際に会って最高の癒しをご堪能くださいませ。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%be%e3%82%86%f0%9f%91%9127/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">3月度リピ率No.4</p>      <h3 class="title rich_font"><span>⭐️まゆ⭐️(27)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/05/10542E3B-69B2-48C3-8A9E-89405163E45D-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>愛嬌抜群でスレンダーハイスペックボディの魅惑の美女セラピストで御座います。一見クールな印象から屈託な笑顔最強のギャップを兼ね備えておりどの表情でも惹き込まれるような唯一無二な彼女。さらにクリクリな大きく美しい瞳に小さな輪郭をし整いすぎていてまさにお人形さんのようなルックス、感無量で御座います。優しい彼女の性格と行きとどいた気配りと供に必殺の悩殺タイムをお楽しみ下さい。記憶に残る恍惚のひと時になることでしょう。極めてオススメになります。ご予約心よりお待ちしております。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%aa%e3%81%aa%e3%81%bf%f0%9f%91%9127%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ななみ⭐️(27)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/03/4AC1C9DB-4B65-4C45-81F5-05BED9828667-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>どの男性も美人過ぎて緊張をしてしまうと思います。それくらい容姿は素晴らしいです！更に柔らかそうなᕼカップが目に留まります。普段の生活ではあまり会うことのできないレベルの女性ですが会話を始めると、めちゃくちゃ愛想が良く、言葉遣いも綺麗です！常に笑顔で話してくれるので親近感も湧いてきます。一度会ってしまったらリピーターになることは間違いないと断言できるくらい自信をもってお勧めするセラピストが入店いたしました！お早めにご予約をお願いいたします。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%bf%e3%82%86%f0%9f%91%9121%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️みゆ⭐️(21)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/03/7965BAB9-A3E8-4AB1-86F7-66A82FE33C05-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>業界未経験！！
会ってびっくり。ドアを開けると、あらかわいい！！お写真と変わらぬ美女がそこに。小さい人形の骨格/顔立ちに大きなキラキラした瞳眩しい美女オーラ。街であったら確実に二度見する。華やかで笑顔が眩しくて内面は人懐っこくて明るくて。すきでしょ？そういうの。焦らさないでよ。近いよ！見つめないでよ！となぜか男性が乙女チックになる謎現象。魅力的で大胆。いろんな意味で幸福感に満たされる。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%82%8b%e3%81%84%f0%9f%91%9121%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">3月度パネル指名率No.3・リピ率No.3</p>      <h3 class="title rich_font"><span>⭐️るい⭐️(21)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/08/5F1392CE-F5F7-4EB0-B828-9FC21A72E27F-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>満点の星が輝く夜空に舞い降りた愛嬌抜群美女セラピストでございます。あまりの美しさに直視ができないほどの印象的な可愛い瞳に、思わず釘付けにされてしまう程の見事なスタイル。そしてそして、さらにすごいのは世の男性全てを魅了する明るく気さくな性格。まさしく愛嬌抜群×2乗でございます。献身的な気遣いも出来て、非の打ち所がありません。人気爆発の予感・・・お会いしていただければ必ずご満足することが出来るでしょうたっぷり濃厚なサービスと軽快なトーク1分、1秒が心に残り、今まで体験したことのない最高の空間が待っています。ご予約心よりお待ちしております</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%be%e3%81%aa%f0%9f%91%9127%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">3月度パネル指名率No.1・リピ率No.1</p>      <h3 class="title rich_font"><span>⭐️まな⭐️(27)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/03/312987B0-000A-4A41-AAE1-80D6B14D1030-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>ご存知の方もいらっしゃるかもしれません！あの中野の有名店で働いていたそのお店でも人気のセラピストが中野に復帰入店です！
甘く蕩けるような妖艶な面持ちの美人系ギャルの降臨☆
普通の生活を送っていたら味わえないような180度いや最早360度感覚が変わるエ◯スが味わえます♪
そんな彼女の細身のスタイル抜群の美乳はキレイにお手入れされてるので密着した瞬間昇天間違いなし！
マットの上では欲望のままに乱れて見境なくご奉仕しちゃいます☆
とにかくこの出会いは激アツです！
言葉はいりません。これ以上書いてしまうと贔屓になってしまうレベルの子なのでとにかく問答無用で予約してみてください。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%84%e3%81%9a%e3%81%bf%f0%9f%91%9124%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️いずみ⭐️(24)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/05/4D751038-F230-42C2-B430-BFB705079F26-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>美形のお顔美女。若さと大人の色気を併せ持ち、あふれる色気はプンプン弾けてしまったグラビア系美女。大胆に、繊細にソワラソワラ、、ググッッゥフと長い手足が絡まるように進むんでいくトリートメントはそれはもう極上の刺激と癒し。施術はダイナマイト、、今にも打ち上がるかのようなその光景に、、男の浪漫と、癒しを感じてください。。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%82%e3%82%84%e3%81%ad%f0%9f%91%9126%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️あやね⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/03/CDA45166-6ABB-4512-AAC2-751CC880C253-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>おっとり・ふわふわ系そんな言葉がぴったり！
天使のようなセラピストさんです♡
明るく人懐っこい雰囲気を持ち、その整ったルックスに
思わず虜になってしまうことでしょう！
透明感のある端整な顔立ちはかなりのレベル！
ピュアで優しい美しさを持ち、清潔感に満ち溢れていますよ♡
まさに綺麗なお姉さん！

話も抜群であたたかい雰囲気は全ての紳士様が幸せな気持ちに！
貴方もつい微笑んでしまうこと違いなく、捉えどころのない魅力にあふれています！

性格は気取ったところがなく、常にお客様のことを気にかける性格なので
きっと貴方の事だけを考えた献身的な癒しの時間をお届けすることでしょう！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%a1%e3%81%82%e3%81%8d%f0%9f%91%9128%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ちあき⭐️(30)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2023/11/CA3A31CB-55BA-43EA-A0FD-533AC0513C13-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>中野エリアで人気セラピストさん入店しました！NO.1になるぐらい他店では人気でスタイルも良くお顔立ち綺麗な女性です！人当たりが良く親しみやすい性格です！
笑顔も可愛く一緒に居るだけで癒されることでしょう！
さらにスタイル抜群で愛嬌も良く心も身体も穏やかになること間違いなしです♡
マッサージの経験もあるので、施術を楽しんで癒されるだけでなく元気も貰ってください♪
心身共に癒され間違いなくお会いしたら彼女の虜となるはずです♫
ご予約お待ちしております！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%93%e3%81%93%e3%82%8d%f0%9f%91%9124%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">3月度パネル指名率No.4・リピ率No.2</p>      <h3 class="title rich_font"><span>⭐️こころ⭐️(24)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/06/37E4F77B-9DEC-4C0C-8D11-D64BA33DC623-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>ビジュアル重視なお客様も納得の綺麗なお顔＆抜群のスタイル！
そして、男性ウケ間違いない優しく気立てのいい性格！常に笑顔が絶えない天使のような可愛さで、癒しと楽しさに満ちた空間をご提供できるセラピストさんです！見た目だけではない。サービスだけではない。スタイルだけではない。
ぜーんぶひっくるめて本当に素敵な女性！逢う人みんなを魅了してしまう人間的魅力の持ち主なのです！
常に本指名で埋まる予約困難なセラピストです！不定期出勤のため、お早めのご予約を強くオススメします！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%b2%e3%81%8b%e3%82%8a%f0%9f%91%9126%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ひかり⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/12/61A7BDD3-11A8-4070-8437-A6BA4D158552-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>文句なしのルックスに加え、セラピストとして天性の素質と、確かな技術、温かなハートをもったセラピスト！
セラピストとして、天性の素質と技術をもった彼女は、単にルックスが良いだけには留まらず、1ランクも2ランクも上の、心の奥まで満たされるようなひと時をお届け致します！満を持してオススメできます！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%82%86%e3%81%aa%f0%9f%91%9123%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ゆな⭐️(23)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/02/316C97CD-76E5-4AF9-9F83-0BD16D6382E8-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>その素晴らしいスタイルは大きなおっぱいと均整がとれており間違いなく貴方の男の部分を掻き立てることでしょう・・・そんな彼女と対面してお話しすると少し訛っていて性格も明るくて時間も忘れるほど楽しいお時間になること間違いなしです。施術が始まると豹変してしまうでしょう♪こんな可愛いGALのHカップ爆乳を視界に堪能し施術を受けれるなんで。。。下もと秘めたるお汁が洪水のように溢れてしまうでしょう！
それだけではなく男性に喜んでもらうのも大好きで献身的なサービスは貴方の体が枯れても満足することはない。
濃厚でドロドロなエ◯ス施術を楽しめるかと思います♡彼女の元気な性格と肉欲に溢れたプレイのギャップは日常のすべてを忘れられると断言致します！是非ご予約お待ちしております。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%b2%e3%81%aa%e2%ad%90%ef%b8%8f24%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ひな⭐️(21)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2026/01/F637108D-9A03-4910-B94B-FB77EEC85D93-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>同エリアで人気だったセラピスト入店！ビジュ！スタイル爆発！笑顔がとんでもなくカワイイ！素敵な女性！礼儀正しく仕事意識が高くお客様をおもてなしする意欲溢れる積極的なセラピストです。人懐っこく愛嬌抜群で一緒にいるとほっこり幸福な気持ちになることでしょう！スレンダーな身体にＥカップのバストで一生懸命マッサージしてくれる姿はまさに感動ものです！日々のストレスに疲れている方は是非癒されて下さい。期待の成長株です！
ご予約お急ぎ下さいませ！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%9d%a4%ef%b8%8f%e3%82%82%e3%81%ad%e2%9d%a4%ef%b8%8f18%e2%9d%a4%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
      <p class="sub_title">3月度リピ率No.5</p>      <h3 class="title rich_font"><span>⭐️もね⭐️(18)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/06/22C2B0C6-F672-42E8-8ABC-BB8B059BD960-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>扉を開けたらそこにはキュートFACEな天使！なかなか出会えないレベルです！出会った瞬間から運命しか感じません！ふんわりとした愛らしい声にもうメロメロです！そして出会って30秒でお分かりいただけます！「あ、このコ好き！」キャラもビジュアルも文句なし！この時間がいつまでも続けばいいのに。。。終始優しさと愛に溢れた施術はハマりすぎ要注意です！心して御来店ください！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%82%8a%e3%81%aa%f0%9f%91%9122%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️りな⭐️(22)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/07/746AB9CF-5E9A-407D-888F-E7D09F6D71EE-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>りな限定コース40分
指名料    オプション込み    ￥8000


のふんわりアイドル系美女セラピスト♡キレカワのフェイス！色白美肌でスタイル抜群の女性。そして性格は社交的で好感度抜群。宣材写真ではなかなかお顔を拝借できませんが、その容姿やレベルや接客力は保証されております。施術の方は未経験からのスタートではありますが、研修をしっかりと受けてからのスタートとなりますので、安心して身を任せていただけますと幸いです。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%82%e3%81%8f%e3%81%82%e2%ad%90%ef%b8%8f24%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️あくあ⭐️(24)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/07/F05431F9-6904-4430-86AE-29EAE8964416-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>見た目は非常におとなしそうな控えめの女性で、性格も大変好感が持てる心優しき女性でございます。繊細な指先が皆様を虜にしてしまう！そして、大人な施術が大得意で大好きとのこと！この見た目でそのギャップは世の男性は絶対イチコロ確定！均整の取れたプロポーションと優美な笑顔とのアンバランスさが、より魅力を倍増しており、透き通るような雰囲気はとても印象的です！品の良さが感じられる凛とした表情が、お客様を癒し恍惚の表情に変わる様は皆様必見です！隅々に行きわたる心遣いや優しさで貴方を日常の疲れから解き放ってくれることでしょう！このような女性と触れ合う機会はそうはございません時を共にするだけで心動かされ、ひと時の別れにも心いとめる！そんな忘れ得ぬ出逢いはいかがでしょうか！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%bb%e3%81%ae%e3%81%8b%e2%ad%90%ef%b8%8f18%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ほのか⭐️(18)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/10/8E39D1B5-A45C-4DF8-A846-EE030ACB1E38-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>業界未経験！！
若さならではのモッチリとした白い肌に、笑顔が可愛らしく、ちょっぴり天然な妹系美女！さらに目を引くのは、バランスの良いメリハリの利いたスレンダーなボディラインは、この若さで女性としての美が完成されつつあります。そして忘れてはならないのは程よく弾力のある美尻！お客様の理性を狂わせてくるような魔性の笑顔で、世の男性を虜にする希少な魅力を秘めた女の子です。はにかむ笑顔で接してくれる姿からは献身的な印象を感じ！男性を包み込むように癒やしの時間へと導いてくれることでしょう。未経験とは思えない技術の高さは天性のもの…</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%82%8a%e3%81%ae%e2%ad%90%ef%b8%8f27%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️りの⭐️(25)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/11/FCF65D73-82CB-428B-ACF0-9B171268A119-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>たわわに実る禁断の果実。男の浪漫… 
噂のSSS級超絶スタイル最強美女降臨！！一度出会ってしまったらきっともう虜になってしまうでしょう。。。街ですれ違えば誰もが振り返りたくなるようなオーラとスタイル！！ぱっちりとした大きな瞳と頬に影を落とす長いまつ毛
真っ白なめらか純白美肌さらにさらに張りのあるはちきれんばかりのたわわなＧカップ!愛嬌溢れるcuteな笑顔も一人占めしたくなること間違いなし！品があり色香の漂う雰囲気も持ち合わせ、まるで恋人と過ごしているかのような至福のお時間をお約束致します。そして献身的で五感をくすぐる彼女のテクニックは 最高級
こんなに可愛くて愛くるしいのに、一緒に昂れるセラピストは超絶レア！！彼女と二人きりで過ごせるお客様が羨ましすぎます。。。愛情たっぷり濃厚施術、覚悟してご堪能下さい！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%82%86%e3%82%8a%e3%81%82%f0%9f%91%9126%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ゆりあ⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2023/11/EA7643C9-847B-48F3-AD1F-EA25DA207A9E-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>細身のスタイルに、小顔の美しい最強のルックス、美しさの基準を左右する大切なパーツは十分すぎるほどの魅力で埋め尽くされており、あまりの美しさ、あまりの可愛さに、逢えて本当によかったと心から思っていただけることでしょう(^^♪
献身的な施術でまるで全てを包み込んでくれるかのような気持ちになれます！心と体に余りある癒しを与えてくれる…
それが彼女の最大の魅力です！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%82%8c%e3%82%80%e2%ad%90%ef%b8%8f24%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️れむ⭐️(24)</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/06/2A5E19B6-88C4-4CA1-9A07-7FC7228CB302-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>No.1スタイル！！メンズエステ業界で際立つ魅力を持つセラピストです。その愛くるしいルックスからは想像できないほどの施術力で、多くのお客様を虜にしています。彼女の得意とする仰向け密着プレイは、心地よい緊張感とリラクゼーションを同時に体験できる特別なひとときです。Ｉカップの魅惑的なスタイルと美尻が、施術のたびに新しい発見と驚きを提供します。施術は、ただのリラクゼーションに留まらず、心の奥深くまで癒される時間をお約束します。彼女のかわいらしい笑顔と優しい声に包まれながら、日常の疲れを忘れ、至福の時間を過ごしてみませんか？ぜひ、特別なひとときを体験してください。彼女の施術を受けた後、また訪れたいと思わせる魅力が必ずそこにあります。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%82%80%e3%81%a4%e3%81%8d%f0%9f%91%9123%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️むつき⭐️(23)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/11/11AD0E90-7FD2-4FB6-B906-9ED0235BD88C-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>中野エリア人気セラピスト入店いたしました！可愛くてスタイルも抜群！
さらにとっても愛嬌もあり、優しい！極めつけは天然Ｉカップ！！
こんなセラピストさんは嫌いですか…？
いいえ！大好きです！！とても柔らかい物腰かつ気配り上手♪一緒にいると心地いい！施術中のドキドキ感はもう・・・絶賛！！一度は絶対にご利用して頂きたいセラピストです！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%aa%e3%81%aa%f0%9f%91%9124%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️なな⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/04/8CE08543-3B2B-4A44-B668-8F4136BBF178-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>知っている方もいらっしゃると思います！以前中野の他店で活躍していたななさん！細身なのにＥカップのマシュマロボディ！！圧巻のルックス、スタイルに
加え、大胆施術で魅了します♡♡
礼儀正しく、とても優しい性格です。
お話をしているだけでも癒されます。
施術に入ると雰囲気は一変…
とにかく是非ご体感ください！！！
今後ブレイク間違いなしの逸材です！
是非ご予約お待ちしております！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%b2%e3%82%81%e3%82%8a%e2%ad%90%ef%b8%8f21%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ひめり⭐️(21)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/12/932B51C6-184D-4CFA-ABA0-B0571F6E4D97-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>そのスタイルを一目見た瞬間、「近くで見たら絶対にやばい」と本能が反応するタイプ。150cmのしなやかな脚線、抱き寄せたくなるＩカップのライン。ただグラマラスなだけじゃなく、仕草のひとつひとつが妙に色っぽい。肩を少し傾けて覗く鎖骨、身体を寄せた時の温度…… どれも“触れられる寸前”のような危うい雰囲気をまとっている。距離が縮まった瞬間にふっと漂う甘い呼吸！耳元で落ちてくる小さな声。指先が触れた時のゆっくりとした動き！そのすべてが理性を溶かしていくような艶を帯びている。施術は丁寧…というより “誘惑に近い密着”。気づけば身体が熱を帯びていき、“抜けられないゾーン” に自然と連れていかれる時間。清楚に見えるのに、近づくほど色気が溢れます。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%b2%e3%82%81%e3%81%ae%e2%ad%90%ef%b8%8f23%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ひめの⭐️(23)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/06/764C3157-5568-47C6-8B55-CEB05830DC8A-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>業界未経験!!
みんな大好き黒髪ロングの素人系でございます！大きな瞳が魅力的な、綺麗系と可愛い系をいいとこどりしたような顔立ち、明るく社交的な性格で笑顔が可愛い女の子！それでいてなんとＦカップ美乳の持ち主！もはや最高以外の言葉が見つかりません！不慣れながらも一生懸命な密着マッサージでカノジョと過ごすかのような甘く癒されるひとときは最高の癒しとなることでしょう！是非ご堪能くださいませ！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%be%e3%81%a9%e3%81%8b%e2%ad%90%ef%b8%8f20%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️まどか⭐️(20)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/06/074F612F-CCD9-4297-89B0-36A4CA08F216-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>素人系イマドキの女の子☆笑顔が大変心地よい、天性の癒し系セラピストさん！パッチリとした澄んだ瞳に、艶やかな唇。素人系の正統派の美人さんいう言葉がピッタリでございます。年齢も若く華やかな印象を受ける彼女ですが、素の部分のハニカミ屋な性格が、これまた大変可愛らしい...高いホスピタリティでお客様の癒しの為に、照れつつも積極的に、最高の癒しを提供致します。初対面でも、好きになって頂けることでしょう。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%aa%e3%81%bf%e2%ad%90%ef%b8%8f24%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️なみ⭐️(24)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/03/B1E21A6B-E83D-4038-8532-CD94387AD4F4-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>舞い戻ってきました！！小顔で綺麗！スラっとしたモデル系スタイル！ルックスはもちろんのこと相手を喜ばしてあげたいというおもてなしの心があふれております！そして何より男心をくすぐる小悪魔っぷりがたまりません！！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%82%e3%81%99%e3%81%8b%e2%ad%90%ef%b8%8f21%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️あすか⭐️(21)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/07/948CA95C-1E93-4C43-B075-F94A45447F6A-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>お待たせしました！メンエス界隈でも最強のスタイル！！めちゃくちゃカワイくて若いのに気遣いもできて男性を優しく立ててくれる！ずっとゼロ距離でいちゃいちゃいちゃいちゃ！一緒にいるだけで楽しすぎるのに！お写真でわかると思いますが日常ではまず出会えない凄すぎる超天然の超非現実的ツルスベプルプルBody！若さと色気を兼ね備えるめちゃカワ＋ 気持ち良さMAXボディ+ホスピタリティ最強超濃厚施術！こんなにかわいいのにめちゃくちゃ人懐こい性格はもう完全に本物の天使です。超絶 恵まれたビジュアルとボディを惜しみなく使いながら行われる一線を超えたメンズエステ…卑怯...。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%82%e3%82%84%e3%81%9b%e2%ad%90%ef%b8%8f22%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️あやせ⭐️(22)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/07/358B6E35-9D2C-4977-9D39-21B813912DBA-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>以前当店で人気だったセラピスト復活！！トップクラスの問い合わせ！リピート率！スタイル抜群！愛嬌良し！非の打ち所がありません！以前ご指名していたお客様も初めましてのお客様も必ず喜んで頂けると思います！他のエリアに移っても人気ですぐ看板セラピストになり！ご予約埋まってしまう感じでしたので是非この際にお問い合わせ、ご予約よろしくお願いします！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%97%e3%81%8a%f0%9f%91%9123%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️しお⭐️(23)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/08/3697AA8A-051C-4280-A3F2-53C4A69548F8-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>ドアを開けた瞬間、アイドルの握手会に来たのかと思ってしまうほどの圧倒的可愛さ♡クリクリの瞳と満天の笑顔が心を鷲掴みにする、超絶可愛いアイドルフェイスな女の子がご入店です♡天真爛漫で屈託のない性格で、向日葵のように包み込むような暖かみを持った可愛らしさは、緊張すると言うよりは癒しをくれる自然体な可愛らしさ♡しっかりと綺麗なクビレをしていながらも、女性らしい色気も兼ね備えた、健康的でありながら妖艶な身体付き。
ポイントを押さえた質の高いメンズエステは彼女のあたたかい『陽気』な空気感を『妖艶』な空気感に変えてくれて、容姿の良さだけでなく、施術や空気感からも高い満足度を与えてくれるメンズエステをしてくれます♡特に、躊躇なく攻め込んでくるキワのラインは、しっかりとした経験を積んだ深さであり、教わってやらされている施術と言うよりは、お客様のことを考えて本人が自発的に行う深いメンエス施術です♡アイドル級に可愛いセラピストによる、トータル満足度の非常に高いメンズエステをぜひお楽しみください♡</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%81%95%e3%81%8f%e3%82%89%e2%ad%90%ef%b8%8f22%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️さくら⭐️(22)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/10/593E62A5-D77E-4931-AA91-B4525038C2FB-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>業界完全未経験！！大きな可能性とポテンシャルを秘めたダイヤの原石のようなセラピストがやって参りました！持ち味の丁寧な所作や印象はそのままに、此度のデビューにあたってガラリと変貌を遂げた一線級の艶美女ルックスは輝くような眩しさを感じさせてくれる事でしょう！施術においても申し分のない仕上がりと密着感。どこまでも届いてくる好奇心溢れたトリートメントにはたちまち期待度も最高潮に！これまで求めらていたであろうもうひと声までをも会得した至高の癒しを披露しつづけることでしょう！大の甘えられ好き&amp;ちょっぴり押され弱さの滲む可憐な姿も交えた新たな旋風に乞うご期待くださいませ！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%82%e3%81%84%e3%82%89%f0%9f%91%9122%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️りり⭐️(22)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/11/BF789182-6383-49C8-96C0-1401AC50CF70-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>艶やかなロングヘア、愛くるしいほどにパッチリとした瞳に、ぷっくりツヤツヤな唇とチャームポイントがてんこ盛り♪
とにかく可愛いが大渋滞しています……施術においては初めての経験から戸惑いやあどけなさが僅かに残るものの、しっかりとひとつひとつのツボを捉えながらも昨今求められている好奇心旺盛な一面がとても強く、これからの業界を生き抜く伸びしろにも大きく期待できます！！
興味津々ですごく楽しそうに取り組む姿勢や、一生懸命な表情には思わず心の中でずっと応援したくなってしまうかもしれませんね♪お早目のチェックとご予約をお待ちしております！！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%84%e3%82%8d%e3%81%af%f0%9f%91%9123%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️いろは⭐️(23)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/01/C95C4BD4-63B0-4C99-B9AB-939AE5A59CCD-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>メンエス未経験！一見、清楚なアイドル系ロリな印象に見えますが！その全貌をここで告げる事は出来ませんが…もうヘロヘロメロメロです！小柄な美白スレンダースタイルにロリカワFaceはロリ好き以外の方もそそられる中毒性がございます！そして高いメンエススキルにお客様をオモテナシしたい願望の強い！おもてなしスイッチが直ぐに入ってしまう本能は誰も止める事は出来ません！</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%9d%e3%82%89%f0%9f%91%9120%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️そら⭐️(20)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/06/E9A17B58-F268-428D-AB00-1E2EAE176672-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>そら限定60分.70分.90分コース
(指名料・鼠径部・オリジナル衣装・特別オプション全て込み)
60分￥２１０００
70分¥２４０００
90分¥３００００

(通常のコースでのご予約も可能)

必ずまた会いたくなるセラピスト！
同じエリアからの電撃移籍！
一度と言わずに二度三度♡
絶対的癒し系オーラ全開のTHE清純派アイドル！！！大きくクリッとした瞳が印象的な綺麗な顔立ちその美しい瞳に見つめられると吸い込まれていくような感覚に陥ります。
反則レベルの甘々Voiceに仕草♡積極的で圧巻の施術内容も人気の秘密なんです♡中毒者続出中！最高レベルのギャップ萌えご堪能ください！
是非ご指名の上、ご来店お待ちしております♡</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%86%e3%81%83%f0%9f%91%9120%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️うぃ⭐️(20)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2023/10/786F9114-3C5D-4636-974D-AC9F01D705F8-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>業界完全未経験の「最高の原石」
礼儀正しいのに人懐っこいという男心をくすぐる性格（笑）
そして外見は目鼻立ちがはっきりした美人さんなのに「可愛らしさ」も持ち合わせているという
欲張りな見た目。。。
メンズエステ初挑戦でまだ右も左もわからないですが！オイルマッサージにはとても向上心があり、勉強熱心！
面接時、早く施術したいと言っていたのが印象的でした。
いずれ予約困難のセラピストとなること間違いなしです。
今のうちにご予約されることおすすめいたします</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%f0%9f%91%9127%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ましろ⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/06/EA0BAA6D-2CE0-44D6-AF2D-7006E7BE8F71-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>綺麗すぎて一瞬身構えてしまいますが、性格はとても明るくてフレンドリーです。なんと言いますか体と体の距離だけでなく、心と心の距離が近い感じがします。お話べたな方でも5分もすればすぐに打ち解けられるのではないでしょうか。また元々OLで働いていたということもあって、気遣い、礼儀正しさもお墨付き。会話をリードしたい方・リードされたい方、どちらでもお楽しみいただけると思います。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%b2%e3%81%be%e3%82%8a%f0%9f%91%9125%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️ひまり⭐️(25)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/12/9147618D-CE6A-48C3-9FAB-970636E200A8-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>奇跡の巨乳ロリカワ少女セラピスト！愛がたっぷりな施術に包まれる神秘の覚、スタイル抜群のセラピストさんです！
色気抜群！骨抜き昇天必至！濃厚マッサージ！うまい指使い彼女のマッサージにドハマり注意です！！オイルマッサージの技術も非常に高いです！確かな技術で心のこもった丁寧なマッサージを是非ご堪能ください♪</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%8d%e3%82%89%e3%82%89%f0%9f%91%9126%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️きらら⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/11/BDF961E0-95E7-4C0A-8CBB-FAA1F3A8DAE5-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>間違いなくトップクラスのセラピストで未だかつてない美貌の持ち主です。ルックス、内容、ホスピタリティのトータルバランスが完璧で圧倒的なセラピストで御座います。献身的な気遣いも出来て、もはや非の打ち所が探しても探してもとにかく見つかりません。そんな彼女との時間は出会えた奇跡に感謝したくなるほどでございます。そのインパクトはこの先ずっと脳裏に刻まれることと思います。人気になること間違いなしです。予約困難が予想されます。
ご予約心よりお待ちしております。</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%e2%ad%90%ef%b8%8f%e3%82%82%e3%82%82%e2%ad%90%ef%b8%8f26%e2%ad%90%ef%b8%8f/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️もも⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2025/05/430F9735-07DF-4D69-94EB-25C1695B5BD4-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>愛らしい柔らかな笑顔を向けられると、思わず抱きしめたくなってしまいます。守りたくなるような可愛らしさと朗らかな性格、そして優しくも小悪魔的な施術で、心身共にしっかり癒やす優しい時間を提供します。女性らしい体型に、きめ細かい柔肌の驚異の美ボディには目がくらみます♪可愛さたっぷりの仕草と本格的な施術には、前半でリピートを決めてしまうこと間違いなし♡織り成す癒し施術は、メンズエステの本質、そして醍醐味と言えるでしょう♡溢れ出る可愛らしさをこれでもかと放しつつも、誰とでも打ち解けてしまう！スタイル、美貌、テクニック、全てにおいて期待を裏切らない実力、あなた自身で確かめに来てください♪</span></p>    </div>
   </a>
  </article>
    <article class="item">
   <a class="link animate_background" href="https://golden0508.com/therapist/%f0%9f%91%91%e3%81%82%e3%82%84%f0%9f%91%9126%f0%9f%91%91/">
    <div class="image_wrap">
     <div class="title_area">
            <h3 class="title rich_font"><span>⭐️あや⭐️(26)⭐️</span></h3>
     </div>
     <div class="image" style="background:url(https://golden0508.com/wp-content/uploads/2024/10/6EA20DD9-674F-4438-BC11-8176D17A89EA-520x520.jpeg) no-repeat center center; background-size:cover;"></div>
    </div>
    <div class="desc">
     <p><span>全ての男性を夢中にさせるであろうセラピストが入店を決めて下さいました。ひと際目を引く可愛いルックスにEcupのバスト。キラキラと光るまるでダイヤの原石！まだどこかあどけなさや幼さの残る可愛らしいお顔立ちで、整った目鼻立ちに小顔の彼女、誰もが認める万人受けの美少女で御座います。
白く綺麗な素肌は、シルクのように滑らかできめ細かく柔らかくモチモチとした肌質・・・更には若くみずみずしいEcupのバスト・・・見事な曲線を描く彼女の素晴らしいスタイルはお褒めの言葉を差し上げてしまうはずです。性格はとっても明るく、人懐っこい子になりますので喋っていると可愛さが増してきます。またイチャイチャ大好きで甘えん坊、プレイベートに近い恋人接客で興奮は最高潮に達する事でしょう！</span></p>    </div>
   </a>
  </article>
   </div>
`;

async function main() {
  console.log('🚀 「ゴールデン（GOLDEN） 旧ガーデン」の店舗とセラピスト登録を開始します...\n');

  try {
    // 1. 店舗データの登録
    console.log('🏪 店舗データを登録中...');
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'ゴールデン（GOLDEN） 旧ガーデン',
      area_id: AREA_ID,
      group_id: GROUP_ID, 
      schedule_url: 'https://golden0508.com/schedule/',
      website_url: 'https://golden0508.com/',
      business_hours: '11:00～LAST', 
      price_system: '60分 10,000円～',
      image_url: 'https://placehold.jp/f1c40f/ffffff/400x300.png?text=GOLDEN', 
      raw_data: {
        prefecture: '東京都',
        city: '中野区',
        area: '中野',
        address: '東京都中野区中野エリア',
        system: SYSTEM_DATA // 画像から抽出した正確なコースデータ
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報（ID: ${SHOP_ID}）を登録しました。\n`);

    // 2. セラピストの抽出と登録
    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.item');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      const rawNameText = item.find('h3.title span').text().trim();
      if (!rawNameText) return;

      // 「⭐️あい⭐️(24)⭐️」や「👑みく👑22👑」のような形式から名前と年齢を抽出
      let cleanName = rawNameText.replace(/[⭐⭐️👑]/g, '').trim();
      let age = '';
      const ageMatch = cleanName.match(/\((\d+)\)|\s*(\d+)$/);
      
      if (ageMatch) {
          age = `${ageMatch[1] || ageMatch[2]}歳`;
          cleanName = cleanName.replace(/\(\d+\)|\s*\d+$/, '').trim();
      }

      // サブタイトル（NEW, ランキング等）をタグとして抽出
      const subTitle = item.find('.sub_title').text().trim();
      const tags = subTitle ? [subTitle] : [];

      const bioText = item.find('.desc p span').text().trim();

      let fullBio = '';
      if (age) fullBio += `年齢: ${age}\n\n`;
      fullBio += bioText;

      // 同名回避
      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      // 画像URL
      let bgStyle = item.find('.image').attr('style') || '';
      let imageUrl = '';
      const urlMatch = bgStyle.match(/url\((.*?)\)/);
      if (urlMatch) {
         imageUrl = urlMatch[1].replace(/['"]/g, '');
      }

      newTherapists.push({
        id: `${SHOP_ID}_${finalNameId}`,
        shop_id: SHOP_ID,
        name: cleanName, 
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: tags,
          bio: fullBio.trim(),
          original_name: rawNameText
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。`);

    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    // 3. ローカルJSONへの同期
    console.log('\n⏳ 最新のデータをローカルファイルに同期中...');
    const { data: allShops, error: allErr } = await supabase.from('shops').select('*');
    if (allErr) throw allErr;

    const paths = [
      path.resolve('src/data/shops.json'),
      path.resolve('public/data/shops.json')
    ];
    
    paths.forEach(p => {
      if (fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
      }
    });

    console.log(`\n🎉 登録と同期が完了しました！`);
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）し、ブラウザで「中野」エリアをご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
