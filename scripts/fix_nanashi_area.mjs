import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://774spa.com';
const CORRECT_AREA_ID = 'tokyo_setagaya_sangenjaya'; 
const NEW_SHOP_ID = `${CORRECT_AREA_ID}_nanashi_spa`; 
const GROUP_ID = 'g_nanashi_spa'; 
const WRONG_SHOP_ID = 'tokyo_shinagawa_gotanda_nanashi_spa';

const SYSTEM_DATA = [
  {
    courseName: '基本コース',
    description: 'システム料金',
    prices: [
      { time: '60分', price: '15,000円' },
      { time: '80分', price: '20,000円' },
      { time: '100分', price: '25,000円' },
      { time: '120分以上〜', price: 'お電話にてお問い合わせください。' }
    ]
  }
];

const HTML_CONTENT = `
<main>
<div class="wow fadeInUp" id="cast" style="visibility: visible; animation-name: fadeInUp;">
<h2 class="w1000"><span>THERAPIST</span><br>セラピスト一覧</h2>
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

<a href="https://774spa.com/profile?lid=56">
<img src="https://774spa.com/photos/56/20260408171928-line_oa_chat_260408_171607.jpeg" alt="双葉るり">
</a>
<span class="twitter-icon"><a href="https://twitter.com/774spa_ruri" target="_blank"><img src="https://774spa.com/commons/icon_twitter.png" alt="Twitter"></a></span>
</div>
<div class="c-panel__profile">
<p class="c-panel__name">双葉るり(24)</p>
<p class="c-panel__size">身長160cm </p>
</div>
<ul class="c-panel__tag"><li class="">スレンダー</li><li class="is_active">グラマー</li><li class="">美人</li><li class="is_active">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="is_active">愛嬌</li><li class="is_active">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=55">
<img src="https://774spa.com/photos/55/20260323204745-IMG_7727.jpeg" alt="金城もも">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">金城もも(24)</p>
<p class="c-panel__size">身長155cm </p>
</div>
<ul class="c-panel__tag"><li class="">スレンダー</li><li class="">グラマー</li><li class="">美人</li><li class="is_active">可愛い</li><li class="is_active">清楚系</li><li class="">ギャル系</li><li class="is_active">愛嬌</li><li class="">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="is_active">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=54">
<img src="https://774spa.com/photos/54/20260311215414-line_oa_chat_260311_215346.jpeg" alt="田畑ゆうな">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">田畑ゆうな(25)</p>
<p class="c-panel__size">身長150cm </p>
</div>
<ul class="c-panel__tag"><li class="">スレンダー</li><li class="is_active">グラマー</li><li class="">美人</li><li class="">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="is_active">愛嬌</li><li class="is_active">上品</li><li class="is_active">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=53">
<img src="https://774spa.com/photos/53/20260124142635-IMG_7316.jpeg" alt="川村みれい">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">川村みれい(24)</p>
<p class="c-panel__size">身長160cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">スレンダー</li><li class="">グラマー</li><li class="is_active">美人</li><li class="">可愛い</li><li class="">清楚系</li><li class="is_active">ギャル系</li><li class="">愛嬌</li><li class="">上品</li><li class="is_active">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=29">
<img src="https://774spa.com/photos/29/20260305010214-line_oa_chat_260305_010123.jpeg" alt="臼井さゆ">
</a>
<span class="twitter-icon"><a href="https://twitter.com/774spa_sayu3" target="_blank"><img src="https://774spa.com/commons/icon_twitter.png" alt="Twitter"></a></span>
</div>
<div class="c-panel__profile">
<p class="c-panel__name">臼井さゆ(23)</p>
<p class="c-panel__size">身長151cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">スレンダー</li><li class="">グラマー</li><li class="">美人</li><li class="is_active">可愛い</li><li class="is_active">清楚系</li><li class="">ギャル系</li><li class="">愛嬌</li><li class="">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="is_active">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=47">
<img src="https://774spa.com/photos/47/20251102024005-line_oa_chat_251102_023825.jpeg" alt="二階堂さや">
</a>
<span class="twitter-icon"><a href="https://twitter.com/774spa_saya " target="_blank"><img src="https://774spa.com/commons/icon_twitter.png" alt="Twitter"></a></span>
</div>
<div class="c-panel__profile">
<p class="c-panel__name">二階堂さや(19)</p>
<p class="c-panel__size">身長165cm </p>
</div>
<ul class="c-panel__tag"><li class="">スレンダー</li><li class="">グラマー</li><li class="">美人</li><li class="is_active">可愛い</li><li class="is_active">清楚系</li><li class="">ギャル系</li><li class="is_active">愛嬌</li><li class="">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="is_active">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=20">
<img src="https://774spa.com/photos/20/20251203172202-line_oa_chat_251203_172140.jpeg" alt="くるみ">
</a>
<span class="twitter-icon"><a href="https://twitter.com/kakakaja1115" target="_blank"><img src="https://774spa.com/commons/icon_twitter.png" alt="Twitter"></a></span>
</div>
<div class="c-panel__profile">
<p class="c-panel__name">くるみ(27)</p>
<p class="c-panel__size">身長155cm </p>
</div>
<ul class="c-panel__tag"><li class="">スレンダー</li><li class="">グラマー</li><li class="">美人</li><li class="">可愛い</li><li class="is_active">清楚系</li><li class="">ギャル系</li><li class="is_active">愛嬌</li><li class="is_active">上品</li><li class="is_active">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=36">
<img src="https://774spa.com/photos/36/20250925044122-IMG_6262.jpeg" alt="朝比奈しほ">
</a>
<span class="twitter-icon"><a href="https://twitter.com/shiho_774spa" target="_blank"><img src="https://774spa.com/commons/icon_twitter.png" alt="Twitter"></a></span>
</div>
<div class="c-panel__profile">
<p class="c-panel__name">朝比奈しほ(19)</p>
<p class="c-panel__size">身長160cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">スレンダー</li><li class="">グラマー</li><li class="">美人</li><li class="is_active">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="">愛嬌</li><li class="is_active">上品</li><li class="is_active">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=40">
<img src="https://774spa.com/photos/40/20250904191518-line_oa_chat_250904_191145.jpeg" alt="橘ゆうか">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">橘ゆうか(22)</p>
<p class="c-panel__size">身長156cm </p>
</div>
<ul class="c-panel__tag"><li class="">スレンダー</li><li class="is_active">グラマー</li><li class="is_active">美人</li><li class="">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="is_active">愛嬌</li><li class="is_active">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=31">
<img src="https://774spa.com/photos/31/20250811072848-line_oa_chat_250811_050946.jpeg" alt="椿さら">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">椿さら</p>
<p class="c-panel__size"></p>
</div>
<ul class="c-panel__tag"><li class="is_active">スレンダー</li><li class="">グラマー</li><li class="is_active">美人</li><li class="">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="">愛嬌</li><li class="is_active">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="is_active">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=30">
<img src="https://774spa.com/photos/30/20250801075542-line_oa_chat_250801_075353.jpeg" alt="椎名みお">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">椎名みお(27)</p>
<p class="c-panel__size">身長153cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">スレンダー</li><li class="">グラマー</li><li class="is_active">美人</li><li class="">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="">愛嬌</li><li class="is_active">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="is_active">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=28">
<img src="https://774spa.com/photos/28/20250716175941-line_oa_chat_250716_175935.jpg" alt="なつめ　ゆら">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">なつめ　ゆら(25)</p>
<p class="c-panel__size">身長163cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">スレンダー</li><li class="">グラマー</li><li class="is_active">美人</li><li class="">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="">愛嬌</li><li class="is_active">上品</li><li class="is_active">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=37">
<img src="https://774spa.com/photos/37/20250821220808-IMG_5890.jpeg" alt="桜木まい">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">桜木まい(27)</p>
<p class="c-panel__size">身長165cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">スレンダー</li><li class="">グラマー</li><li class="is_active">美人</li><li class="">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="">愛嬌</li><li class="is_active">上品</li><li class="is_active">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=13">
<img src="https://774spa.com/photos/13/20250412150055-LINE_ALBUM_寺島らな_250412_1.jpg" alt="寺島らな">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">寺島らな(20)</p>
<p class="c-panel__size">身長160cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">スレンダー</li><li class="">グラマー</li><li class="">美人</li><li class="is_active">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="is_active">愛嬌</li><li class="">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="is_active">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=24">
<img src="https://774spa.com/photos/24/20250503182006-line_oa_chat_250503_181747.jpg" alt="叶かのん">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">叶かのん(20)</p>
<p class="c-panel__size">身長153cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">スレンダー</li><li class="">グラマー</li><li class="">美人</li><li class="is_active">可愛い</li><li class="is_active">清楚系</li><li class="">ギャル系</li><li class="">愛嬌</li><li class="">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="is_active">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=41">
<img src="https://774spa.com/photos/41/20250906150246-IMG_6049.jpeg" alt="赤城みお">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">赤城みお(19)</p>
<p class="c-panel__size">身長166cm </p>
</div>
<ul class="c-panel__tag"><li class="">スレンダー</li><li class="is_active">グラマー</li><li class="">美人</li><li class="is_active">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="">愛嬌</li><li class="">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="is_active">色白肌</li><li class="is_active">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=38">
<img src="https://774spa.com/photos/38/20250829204131-line_oa_chat_250827_194108.jpeg" alt="胡蝶いおり">
</a>
<span class="twitter-icon"><a href="https://twitter.com/IORI397" target="_blank"><img src="https://774spa.com/commons/icon_twitter.png" alt="Twitter"></a></span>
</div>
<div class="c-panel__profile">
<p class="c-panel__name">胡蝶いおり(25)</p>
<p class="c-panel__size">身長166cm </p>
</div>
<ul class="c-panel__tag"><li class="is_active">スレンダー</li><li class="">グラマー</li><li class="is_active">美人</li><li class="">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="">愛嬌</li><li class="">上品</li><li class="is_active">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="is_active">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=25">
<img src="https://774spa.com/photos/25/20250702092213-S__7675916.jpg" alt="姫乃ゆい">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">姫乃ゆい(20)</p>
<p class="c-panel__size">身長158cm </p>
</div>
<ul class="c-panel__tag"><li class="">スレンダー</li><li class="is_active">グラマー</li><li class="">美人</li><li class="is_active">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="is_active">愛嬌</li><li class="">上品</li><li class="is_active">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=10">
<img src="https://774spa.com/photos/10/20250410185533-LINE_ALBUM_小早川りか_250410_1.jpg" alt="小早川 りか">
</a>
<span class="twitter-icon"><a href="https://twitter.com/kobarika_774" target="_blank"><img src="https://774spa.com/commons/icon_twitter.png" alt="Twitter"></a></span>
</div>
<div class="c-panel__profile">
<p class="c-panel__name">小早川 りか(25)</p>
<p class="c-panel__size">身長159cm </p>
</div>
<ul class="c-panel__tag"><li class="">スレンダー</li><li class="is_active">グラマー</li><li class="is_active">美人</li><li class="is_active">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="is_active">愛嬌</li><li class="">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
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

<a href="https://774spa.com/profile?lid=46">
<img src="https://774spa.com/photos/46/20251026122211-IMG_6665.jpeg" alt="新人入店">
</a>

</div>
<div class="c-panel__profile">
<p class="c-panel__name">新人入店</p>
<p class="c-panel__size"></p>
</div>
<ul class="c-panel__tag"><li class="">スレンダー</li><li class="">グラマー</li><li class="">美人</li><li class="">可愛い</li><li class="">清楚系</li><li class="">ギャル系</li><li class="">愛嬌</li><li class="">上品</li><li class="">施術力</li><li class="">小麦肌</li><li class="">色白肌</li><li class="">高身長</li><li class="">小柄</li></ul>
</div>
</div>
</div>

</div>
</div></main>
`;

async function main() {
  console.log('🚀 誤って登録した「五反田」のデータを削除し、「三軒茶屋」として正しく登録し直します...\n');

  try {
    // ==========================================
    // 1. 誤ったデータの削除 (五反田)
    // ==========================================
    console.log('🧹 誤って登録した五反田の店舗とセラピストデータを削除中...');
    await supabase.from('therapists').delete().eq('shop_id', WRONG_SHOP_ID);
    await supabase.from('shops').delete().eq('id', WRONG_SHOP_ID);
    console.log('✅ 五反田の誤データを削除しました。\n');

    // ==========================================
    // 2. 正しい店舗データの登録 (三軒茶屋)
    // ==========================================
    console.log('🏪 正しい店舗データ（三軒茶屋）を登録中...');
    const SHOP_DATA = {
      id: NEW_SHOP_ID,
      name: '名無しスパ (旧ラリマスパ)',
      area_id: CORRECT_AREA_ID, 
      group_id: GROUP_ID, 
      schedule_url: 'https://774spa.com/schedule',
      website_url: 'https://774spa.com/',
      business_hours: '営業時間要確認', 
      price_system: '60分 15,000円～',
      image_url: 'https://placehold.jp/2ecc71/ffffff/400x300.png?text=名無しスパ',
      raw_data: {
        prefecture: '東京都',
        city: '世田谷区',
        area: '三軒茶屋',
        address: '東京都世田谷区三軒茶屋エリア',
        system: SYSTEM_DATA 
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報（ID: ${NEW_SHOP_ID}）を登録しました。\n`);

    // ==========================================
    // 3. セラピストの抽出と登録 (三軒茶屋のIDに紐付け)
    // ==========================================
    console.log(`⏳ HTMLからセラピストを再抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.c-panel');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      const rawNameText = item.find('.c-panel__name').text().trim();
      
      if (!rawNameText || rawNameText.includes('新人入店')) return;

      const nameMatch = rawNameText.match(/^(.*?)(?:\((\d+)\))?$/);
      const cleanName = nameMatch ? nameMatch[1].trim() : rawNameText;
      const age = nameMatch && nameMatch[2] ? `${nameMatch[2]}歳` : '';

      const heightText = item.find('.c-panel__size').text().trim();
      const heightMatch = heightText.match(/身長(\d+)cm/);
      const height = heightMatch ? `${heightMatch[1]}cm` : '';

      const tags = [];
      item.find('.c-panel__tag li.is_active').each((_, tagEl) => {
        tags.push($(tagEl).text().trim());
      });

      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      let imageUrl = item.find('.c-panel__image img').attr('src') || '';
      
      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height}\n`;

      newTherapists.push({
        id: `${NEW_SHOP_ID}_${finalNameId}`,
        shop_id: NEW_SHOP_ID,
        name: cleanName, 
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: tags,
          bio: fullBio.trim(),
          original_name: cleanName
        }
      });
    });

    console.log(`📦 正しいエリアに紐付けたデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    // ==========================================
    // 4. ローカルJSONへの同期
    // ==========================================
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

    console.log(`\n🎉 修正完了！「名無しスパ (旧ラリマスパ)」を「三軒茶屋」に正しく登録し、ローカルにも同期しました。`);
    console.log('Viteサーバーを再起動してブラウザの「三軒茶屋」エリアでご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
