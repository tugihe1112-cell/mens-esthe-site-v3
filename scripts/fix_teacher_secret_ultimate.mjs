import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const CORRECT_SHOP_ID = 'tokyo_meguro_meguro_teacher_secret';
const OLD_SHOP_ID = 'tokyo_meguro_teacher_secret';
const BASE_URL = 'https://teachersecret2025.com';

// ユーザーから提供されたHTMLデータ（動的ロード後の中身が含まれている）
const HTML_CONTENT = `
<div class="c-panel__bg">
<div id="girls_inner" class="c-panel__wrapper">
<div class="c-panel">
<div class="c-panel-inner">
<div class="no_text c-panel__flow">
<ul>
<li></li>
<li></li>
</ul>
</div>
<div class="c-panel__image">
<a href="https://teachersecret2025.com/profile?lid=55">
<img src="https://teachersecret2025.com/photos/55/20260421222514-ogawa01.jpg" alt="小川 ひなの">
</a>
<span class="beginner wow pulse" data-wow-iteration="10" style="visibility: visible; animation-iteration-count: 10; animation-name: pulse;">NEW</span>
</div>
<div class="c-panel__profile">
<p class="c-panel__name">小川 ひなの(18)</p>
<p class="c-panel__size">身長154cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="">セクシー系美女</li><li class="">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>出会えた人は運がいい――モデル顔負けの逸材セラピスト。</li>
<li>出会えた人は運がいい――モデル顔負けの逸材セラピスト。</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=54">
<img src="https://teachersecret2025.com/photos/54/20260419141957-ChatGPT Image 2026年4月19日 14_18_46.jpg" alt="金木 姫奈">
</a>
<span class="beginner wow pulse" data-wow-iteration="10" style="visibility: visible; animation-iteration-count: 10; animation-name: pulse;">NEW</span>
</div>
<div class="c-panel__profile">
<p class="c-panel__name">金木 姫奈(22)</p>
<p class="c-panel__size">身長165cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="is_active">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="is_active">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="">セクシー系美女</li><li class="is_active">好感度抜群</li><li class="">落ち着きがある</li><li class="is_active">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>あどけなさと柔らかさ――笑顔に包まれて、じんわり溶けていく。</li>
<li>あどけなさと柔らかさ――笑顔に包まれて、じんわり溶けていく。</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=53">
<img src="https://teachersecret2025.com/photos/53/20260419081344-ChatGPT Image 2026年4月18日 20_18_44.jpg" alt="花宮 瑠々">
</a>
<span class="beginner wow pulse" data-wow-iteration="10" style="visibility: visible; animation-iteration-count: 10; animation-name: pulse;">NEW</span>
</div>
<div class="c-panel__profile">
<p class="c-panel__name">花宮 瑠々(20)</p>
<p class="c-panel__size">身長160cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">業界未経験</li><li class="">大人気</li><li class="is_active">もっちり美肌</li><li class="">小柄</li><li class="">色白</li><li class="is_active">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="">セクシー系美女</li><li class="is_active">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>清楚×スレンダー美脚――視線を奪い、気づけば引き込まれる存在。</li>
<li>清楚×スレンダー美脚――視線を奪い、気づけば引き込まれる存在。</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=50">
<img src="https://teachersecret2025.com/photos/50/20260418190351-ChatGPT Image 2026年4月18日 19_03_26.png" alt="二宮 旭">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">二宮 旭(21)</p>
<p class="c-panel__size">身長160cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="is_active">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="is_active">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="is_active">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="">セクシー系美女</li><li class="">好感度抜群</li><li class="is_active">落ち着きがある</li><li class="">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>Gカップ×艶やか密着──滑らかな指先に、理性がほどける時間。</li>
<li>Gカップ×艶やか密着──滑らかな指先に、理性がほどける時間。</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=49">
<img src="https://teachersecret2025.com/photos/49/20260418201326-ChatGPT Image 2026年4月18日 20_11_33.png" alt="岡田 紗羅">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">岡田 紗羅(25)</p>
<p class="c-panel__size">身長165cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="is_active">もっちり美肌</li><li class="">小柄</li><li class="is_active">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="is_active">セクシー系美女</li><li class="is_active">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>「Gカップ×ふわもち密着──甘さと柔らかさに溺れる時間。」</li>
<li>「Gカップ×ふわもち密着──甘さと柔らかさに溺れる時間。」</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=46">
<img src="https://teachersecret2025.com/photos/46/20260418185346-ChatGPT Image 2026年4月18日 18_25_31.png" alt="東雲 桃南">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">東雲 桃南(24)</p>
<p class="c-panel__size">身長158cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="is_active">色白</li><li class="">妹系</li><li class="is_active">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="is_active">小動物系美女</li><li class="">セクシー系美女</li><li class="is_active">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>「誰もが振り返る、静かな美しさ──色気と癒しが溶け合う濃密時間」</li>
<li>「誰もが振り返る、静かな美しさ──色気と癒しが溶け合う濃密時間」</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=39">
<img src="https://teachersecret2025.com/photos/39/20260418191326-ChatGPT Image 2026年4月18日 19_13_15.png" alt="星乃 綺羅々">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">星乃 綺羅々(22)</p>
<p class="c-panel__size">身長160cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="is_active">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="is_active">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="">セクシー系美女</li><li class="">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>清楚な色気と愛嬌あるSっ気で贈る、刺激的な時間！</li>
<li>清楚な色気と愛嬌あるSっ気で贈る、刺激的な時間！</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=36">
<img src="https://teachersecret2025.com/photos/36/20250814173428-abe13.jpg" alt="松島 琉璃">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">松島 琉璃(25)</p>
<p class="c-panel__size">身長159cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="is_active">小動物系美女</li><li class="">セクシー系美女</li><li class="">好感度抜群</li><li class="">落ち着きがある</li><li class="is_active">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>「溢れる色気×マシュマロGカップ──包み込まれる濃密密着」</li>
<li>「溢れる色気×マシュマロGカップ──包み込まれる濃密密着」</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=33">
<img src="https://teachersecret2025.com/photos/33/20260418193801-ChatGPT Image 2026年4月18日 19_37_03.png" alt="根本 莉愛">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">根本 莉愛(25)</p>
<p class="c-panel__size">身長156cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="is_active">セクシー系美女</li><li class="">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>「ルックスだけじゃない！極上のホスピタリティと濃密リンパで虜に」  </li>
<li>「ルックスだけじゃない！極上のホスピタリティと濃密リンパで虜に」  </li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=14">
<img src="https://teachersecret2025.com/photos/14/20250321124052-nisimiya08.jpg" alt="西宮 七星">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">西宮 七星(24)</p>
<p class="c-panel__size">身長155cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="is_active">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="">セクシー系美女</li><li class="">好感度抜群</li><li class="">落ち着きがある</li><li class="is_active">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>破壊力抜群！Gカップ美女の濃厚施術で虜になる！</li>
<li>破壊力抜群！Gカップ美女の濃厚施術で虜になる！</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=4">
<img src="https://teachersecret2025.com/photos/4/20250326132716-kuramoti14.jpg" alt="倉持 理恵">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">倉持 理恵(28)</p>
<p class="c-panel__size">身長163cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="is_active">セクシー系美女</li><li class="">好感度抜群</li><li class="">落ち着きがある</li><li class="is_active">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>キレカワ美人の密着施術！圧巻のくびれと至福のひとときを！</li>
<li>キレカワ美人の密着施術！圧巻のくびれと至福のひとときを！</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=8">
<img src="https://teachersecret2025.com/photos/8/20250321124327-komine13.jpg" alt="小峰 絵梨">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">小峰 絵梨(27)</p>
<p class="c-panel__size">身長155cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="">セクシー系美女</li><li class="is_active">好感度抜群</li><li class="">落ち着きがある</li><li class="is_active">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>169cmのモデル体型！癒しと刺激が交差する濃密施術！</li>
<li>169cmのモデル体型！癒しと刺激が交差する濃密施術！</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=5">
<img src="https://teachersecret2025.com/photos/5/20241229181949-watanabe11.jpg" alt="渡邊 美桜">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">渡邊 美桜(27)</p>
<p class="c-panel__size">身長169cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="is_active">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="is_active">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="">セクシー系美女</li><li class="is_active">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="is_active">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>愛くるしい笑顔とふわふわボディで、極上の癒しと刺激をお届け！</li>
<li>愛くるしい笑顔とふわふわボディで、極上の癒しと刺激をお届け！</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=11">
<img src="https://teachersecret2025.com/photos/11/20241231160932-eno12.jpg" alt="江野 愛理">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">江野 愛理(26)</p>
<p class="c-panel__size">身長150cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="">セクシー系美女</li><li class="">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>激カワロリ顔×色気漂う魅力！濃密施術で虜に！</li>
<li>激カワロリ顔×色気漂う魅力！濃密施術で虜に！</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=6">
<img src="https://teachersecret2025.com/photos/6/20241228024320-tatibana11.jpg" alt="橘 一華">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">橘 一華(20)</p>
<p class="c-panel__size">身長156cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="">色白</li><li class="is_active">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="is_active">小動物系美女</li><li class="">セクシー系美女</li><li class="">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class=" c-panel__flow">
<ul>
<li>お人形のような美貌と極上もち肌で、心まで満たす癒しの時間！</li>
<li>お人形のような美貌と極上もち肌で、心まで満たす癒しの時間！</li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=2">
<img src="https://teachersecret2025.com/photos/2/20250401185228-yazawa13.jpg" alt="矢澤 光">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">矢澤 光(21)</p>
<p class="c-panel__size">身長156cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="is_active">もっちり美肌</li><li class="">小柄</li><li class="is_active">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="is_active">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="">セクシー系美女</li><li class="">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div><div class="c-panel">
<div class="c-panel-inner">
<div class="no_text c-panel__flow">
<ul>
<li></li>
<li></li>
</ul>
</div>
<div class="c-panel__image">

<a href="https://teachersecret2025.com/profile?lid=22">
<img src="https://teachersecret2025.com/photos/22/20250321123958-kusunoki02.jpg" alt="楠 楓">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">楠 楓(23)</p>
<p class="c-panel__size">身長162cm </p>
</div>
<ul class="c-panel__tag"><li class="">業界未経験</li><li class="">大人気</li><li class="">もっちり美肌</li><li class="">小柄</li><li class="">色白</li><li class="">妹系</li><li class="">癒し系</li><li class="">清楚系</li><li class="">天然系</li><li class="">カワイイ系</li><li class="">モデル系美女</li><li class="">アイドル系美女</li><li class="">キレイ系</li><li class="">小動物系美女</li><li class="is_active">セクシー系美女</li><li class="">好感度抜群</li><li class="">落ち着きがある</li><li class="">明るい</li><li class="is_active">高身長</li><li class="">低身長</li><li class="">モデル体型</li></ul>
</div>
</div>
</div>
`;

async function main() {
  console.log('🚀 「女教師の秘め事」の完全修正（店舗統合＆手動データパース）を開始します...\n');

  try {
    // --- 1. 店舗の重複を解消し、正しいID（tokyo_meguro_meguro_teacher_secret）に統一 ---
    console.log('🔍 店舗データを整理しています...');
    
    // 古い/間違った店舗データを削除（クチコミ等があれば移行が必要ですが、今回は新規想定なので削除）
    await supabase.from('shops').delete().eq('id', OLD_SHOP_ID);
    
    // 正しいIDで店舗情報をUpsert（確実に存在させる）
    const SHOP_DATA = {
      id: CORRECT_SHOP_ID,
      name: '女教師の秘め事',
      area_id: 'tokyo_meguro_meguro', // GRACEと同じ正しいエリア
      schedule_url: 'https://teachersecret2025.com/schedule',
      website_url: 'https://teachersecret2025.com',
      raw_data: {
        system: [
          {
            courseName: '基本指導リンパコース',
            description: 'リンパ少な目、お試しコース。',
            prices: [
              { time: '70分(初回)', price: '13,000円' },
              { time: '70分', price: '14,000円' },
              { time: '100分(初回)', price: '18,000円' },
              { time: '100分', price: '19,000円' }
            ]
          },
          {
            courseName: '徹底指導リンパ集中コース(特講付き)',
            description: 'オプション不要、濃密なディープリンパ集中コース。',
            prices: [
              { time: '70分(初回)', price: '17,000円' },
              { time: '70分', price: '18,000円' },
              { time: '100分(初回)', price: '22,000円' },
              { time: '100分', price: '23,000円' }
            ]
          }
        ]
      }
    };

    const { error: upsertError } = await supabase.from('shops').upsert(SHOP_DATA);
    if (upsertError) throw upsertError;
    console.log(`✅ 店舗情報をID「${CORRECT_SHOP_ID}」に統一・更新しました。\n`);

    // --- 2. 提供されたHTMLからセラピストをパース ---
    console.log(`⏳ 提供されたHTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.c-panel');

    let newTherapists = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      const rawNameAge = item.find('.c-panel__name').text().trim();
      if (!rawNameAge) return;

      let rawName = rawNameAge;
      let age = '';
      const match = rawNameAge.match(/(.+?)\s*\((\d+)\)/);
      if (match) {
        rawName = match[1].trim();
        age = `${match[2]}歳`;
      }

      let imageUrl = item.find('.c-panel__image img').attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${BASE_URL}${imageUrl}` : `${BASE_URL}/${imageUrl}`;
      }

      let catchphrase = item.find('.c-panel__flow li').first().text().trim();
      
      const tags = [];
      // is_activeクラスがついているものだけを抽出
      item.find('.c-panel__tag li.is_active').each((_, tagEl) => {
        tags.push($(tagEl).text().trim());
      });

      const cleanName = rawName.replace(/[\s　]/g, '');

      let bioText = `年齢: ${age || '非公開'}`;
      if (catchphrase) {
          bioText += `\n${catchphrase}`;
      }

      newTherapists.push({
        id: `${CORRECT_SHOP_ID}_${cleanName}`,
        shop_id: CORRECT_SHOP_ID, // 正しい店舗IDに紐づける
        name: cleanName,
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: tags,
          bio: bioText,
          original_name: rawName
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のデータを抽出しました。\n`);

    // --- 3. Supabaseへの登録処理 ---
    console.log(`🗑️ 正しい店舗ID(${CORRECT_SHOP_ID})の古いデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', CORRECT_SHOP_ID);

    console.log(`📦 新しいデータ(${newTherapists.length}名)を登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 修正完了！「女教師の秘め事」が目黒エリアに表示され、${newTherapists.length}名のセラピストが登録されました。`);
    console.log('ブラウザで「Cmd + Shift + R」を押してスーパーリロードし、表示を確認してください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
