import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://petime2024.com';
const SHOP_ID = 'tokyo_meguro_meguro_petime'; // 目黒エリアベース
const GROUP_ID = 'g_petime'; // クチコミ吸収・グループ化ID

// ユーザーから提供されたHTMLデータ
const HTML_CONTENT = `
<div class="staffsList therapists clearfix">
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/44">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/43/07ea0f58-ff21-4266-8f5f-da6c37a6a6fb.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">緒川 ひなの(18歳)</h3>              
      <p>T.154cm&nbsp;<br class="displayNoneMore740">Fカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>施術上手</label><label>上品</label><label>清楚系</label><label>お嬢様系</label><label>業界未経験</label><label>もっちり美肌</label><label>小動物系美女</label><label>好感度抜群</label><label>天然系</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/43">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/42/cea068f8-72cd-419e-a243-dbc316ad7a3b.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">金木 姫菜(22歳)</h3>              
      <p>T.165cm&nbsp;<br class="displayNoneMore740">Eカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>施術上手</label><label>美人系</label><label>明るい</label><label>業界未経験</label><label>礼儀正しい</label><label>モデル系美女</label><label>好感度抜群</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/42">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/41/c9e700e3-b92a-4d5a-9f26-3a51bc5a2f61.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">華宮 瑠々(20歳)</h3>              
      <p>T.160cm&nbsp;<br class="displayNoneMore740">Fカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>おっとり</label><label>清楚系</label><label>妹系</label><label>癒し系</label><label>業界未経験</label><label>礼儀正しい</label><label>小動物系美女</label><label>好感度抜群</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/39">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/38/cde7ef26-3822-46dd-986a-bd33ef9c821c.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">二宮 旭(21歳)</h3>              
      <p>T.160cm&nbsp;<br class="displayNoneMore740">Dカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>施術上手</label><label>上品</label><label>清楚系</label><label>お嬢様系</label><label>礼儀正しい</label><label>アイドル系美女</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/38">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/37/8c404695-2ae2-43b1-8a0e-e9a21b1da43d.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">岡田 紗良(25歳)</h3>              
      <p>T.165cm&nbsp;<br class="displayNoneMore740">Gカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>おっとり</label><label>明るい</label><label>癒し系</label><label>もっちり美肌</label><label>セクシー系美女</label><label>好感度抜群</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/35">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/34/449f162b-3c84-414b-8d76-9a2278ef6789.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/35"></a>
      <h3 class="itemName">東雲 桃菜(24歳)</h3>              
      <p>T.158cm&nbsp;<br class="displayNoneMore740">Gカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>施術上手</label><label>明るい</label><label>清楚系</label><label>癒し系</label><label>もっちり美肌</label><label>小動物系美女</label><label>好感度抜群</label>
    </div>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/3">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/3/5dc85f22-18a9-480a-bd95-3ab10590d03e.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/3"></a>
      <h3 class="itemName">星野 綺羅々(22歳)</h3>              
      <p>T.160cm&nbsp;<br class="displayNoneMore740">Fカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>おっとり</label><label>美人系</label><label>上品</label><label>礼儀正しい</label><label>もっちり美肌</label><label>セクシー系美女</label>
    </div>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/9">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/9/d361d36d-007a-4b7a-acff-e32a12449d77.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/9"></a>
      <h3 class="itemName">根本 莉亜(25歳)</h3>              
      <p>T.156cm&nbsp;<br class="displayNoneMore740">Gカップ</p>
    </div>
    <div class="mark">
        <label>施術上手</label><label>おっとり</label><label>上品</label><label>経験豊富</label><label>癒し系</label><label>優しい</label><label>礼儀正しい</label><label>もっちり美肌</label><label>セクシー系美女</label>
    </div>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/12">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/12/e01d2028-b025-48ef-b1de-a0f6a59bb2f1.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/12"></a>
      <h3 class="itemName">小峰 英里(27歳)</h3>              
      <p>T.155cm&nbsp;<br class="displayNoneMore740">Eカップ</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>施術上手</label><label>美人系</label><label>明るい</label><label>清楚系</label><label>経験豊富</label><label>優しい</label><label>小柄</label><label>もっちり美肌</label><label>アイドル系美女</label>
    </div>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/18">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/18/78d48f50-b373-4f69-b00c-12057d295172.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">倉持 梨恵(28歳)</h3>              
      <p>T.163cm&nbsp;<br class="displayNoneMore740">Gカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>施術上手</label><label>美人系</label><label>明るい</label><label>お姉様系</label><label>礼儀正しい</label><label>もっちり美肌</label><label>セクシー系美女</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/6">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/6/77520601-bcb2-4d40-b480-9209cef7f931.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/6"></a>
      <h3 class="itemName">松島 瑠璃(25歳)</h3>              
      <p>T.159cm&nbsp;<br class="displayNoneMore740">Dカップ</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>施術上手</label><label>明るい</label><label>清楚系</label><label>かわいい系</label><label>経験豊富</label><label>礼儀正しい</label><label>もっちり美肌</label>
    </div>
  </div>
  <div class="item clearfix fadein scrollin">
    <a data-turbolinks="false" href="/therapist/14">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/14/a8774151-0bab-4e98-93b6-2772efb8b7b8.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">西宮 七瀬(24歳)</h3>              
      <p>T.155cm&nbsp;<br class="displayNoneMore740">Cカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>施術上手</label><label>明るい</label><label>清楚系</label><label>経験豊富</label><label>お嬢様系</label><label>礼儀正しい</label><label>もっちり美肌</label><label>アイドル系美女</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/19">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/19/2abf2047-f2b0-474f-85c7-a5523f80ba1f.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">渡辺 美桜(27歳)</h3>              
      <p>T.169cm&nbsp;<br class="displayNoneMore740">Dカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>施術上手</label><label>おっとり</label><label>美人系</label><label>上品</label><label>礼儀正しい</label><label>モデル体型</label><label>セクシー系美女</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/20">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/20/021e6df1-9778-44ce-b52f-19a7c24e7e62.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">江野 愛莉(26歳)</h3>              
      <p>T.150cm&nbsp;<br class="displayNoneMore740">Fカップ</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>施術上手</label><label>おっとり</label><label>明るい</label><label>経験豊富</label><label>小柄</label><label>もっちり美肌</label><label>セクシー系美女</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/15">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/15/a122b467-97d0-4688-b577-8d701e36234c.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">橘 一花(20歳)</h3>              
      <p>T.156cm&nbsp;<br class="displayNoneMore740">Dカップ</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>施術上手</label><label>おっとり</label><label>清楚系</label><label>癒し系</label><label>お嬢様系</label><label>業界未経験</label><label>礼儀正しい</label><label>もっちり美肌</label><label>小動物系美女</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/17">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/17/1753ce77-4835-463c-b8df-d8003cfcd497.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/17"></a>
      <h3 class="itemName">矢沢 光(21歳)</h3>              
      <p>T.156cm&nbsp;<br class="displayNoneMore740">Eカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>おっとり</label><label>明るい</label><label>かわいい系</label><label>癒し系</label><label>礼儀正しい</label><label>もっちり美肌</label><label>アイドル系美女</label>
    </div>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/22">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/22/e32765ac-8470-4d70-a8c7-1e0c43b451d5.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">楠木 楓(23歳)</h3>              
      <p>T.162cm&nbsp;<br class="displayNoneMore740">Cカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>施術上手</label><label>美人系</label><label>明るい</label><label>経験豊富</label><label>礼儀正しい</label><label>セクシー系美女</label><label>好感度抜群</label><label>天然系</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/13">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/13/b2fda91f-fc28-4d0f-b75a-fa5ee4e3eac4.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">高槻 有来(28歳)</h3>              
      <p>T.160cm&nbsp;<br class="displayNoneMore740">Fカップ</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>施術上手</label><label>美人系</label><label>上品</label><label>清楚系</label><label>経験豊富</label><label>癒し系</label><label>お姉様系</label><label>もっちり美肌</label><label>セクシー系美女</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/4">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/4/4fa77691-9fd8-4496-bbe7-26c2fcac4c22.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/4"></a>
      <h3 class="itemName">一ノ瀬 沙羅(23歳)</h3>              
      <p>T.165cm&nbsp;<br class="displayNoneMore740">Cカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>美人系</label><label>明るい</label><label>清楚系</label><label>もっちり美肌</label><label>アイドル系美女</label>
    </div>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/36">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/35/dfca84b2-99e8-46fa-b6bb-f4eb245d31ec.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/36"></a>
      <h3 class="itemName">白石 未央(21歳)</h3>              
      <p>T.160cm&nbsp;<br class="displayNoneMore740">Dカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>おっとり</label><label>清楚系</label><label>かわいい系</label><label>癒し系</label><label>優しい</label><label>業界未経験</label><label>礼儀正しい</label><label>もっちり美肌</label><label>小動物系美女</label><label>天然系</label>
    </div>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/5">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/5/21bb2ddc-0508-4b77-b220-72f071216996.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/5"></a>
      <h3 class="itemName">浜辺 夏穂(22歳)</h3>              
      <p>T.158cm&nbsp;<br class="displayNoneMore740">Dカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>上品</label><label>明るい</label><label>かわいい系</label><label>優しい</label><label>礼儀正しい</label><label>アイドル系美女</label>
    </div>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/29">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/28/b42c0304-d6a4-48c0-96c6-4d1acfc9fe6d.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/29"></a>
      <h3 class="itemName">小坂 真帆(19歳)</h3>              
      <p>T.164cm&nbsp;<br class="displayNoneMore740">Cカップ</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>おっとり</label><label>明るい</label><label>清楚系</label><label>癒し系</label><label>モデル体型</label><label>アイドル系美女</label>
    </div>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/11">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/11/f5b32a45-0926-432f-aa97-e45a5d5360b2.jpg">
    </div>
    </a><div class="itemInfo"><a data-turbolinks="false" href="/therapist/11"></a>
      <h3 class="itemName">桜井 星那(23歳)</h3>              
      <p>T.156cm&nbsp;<br class="displayNoneMore740">Dカップ</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>明るい</label><label>清楚系</label><label>かわいい系</label><label>優しい</label><label>礼儀正しい</label><label>もっちり美肌</label><label>小動物系美女</label>
    </div>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/7">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/7/9c09a880-ffbb-435a-80b7-7662f24681d9.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">月野 鈴(22歳)</h3>              
      <p>T.158cm&nbsp;<br class="displayNoneMore740">Cカップ</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>明るい</label><label>かわいい系</label><label>もっちり美肌</label><label>アイドル系美女</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/32">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/31/ea112c66-a4ed-4530-8a4a-8ab474b84e4e.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">小鳥遊 舞香(22歳)</h3>              
      <p>T.160cm&nbsp;<br class="displayNoneMore740">Cカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>施術上手</label><label>明るい</label><label>経験豊富</label><label>モデル系美女</label><label>好感度抜群</label><label>天然系</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/2">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/2/33319095-47f1-4921-b010-b846fe9d6990.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">七瀬 愛菜(23歳)</h3>              
      <p>T.161cm&nbsp;<br class="displayNoneMore740">Fカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>おっとり</label><label>清楚系</label><label>優しい</label><label>お嬢様系</label><label>礼儀正しい</label><label>もっちり美肌</label><label>アイドル系美女</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/34">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/33/40ac0a1b-6418-4d76-85d8-b9a9ed1e489b.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">如月 恋(21歳)</h3>              
      <p>T.168cm&nbsp;<br class="displayNoneMore740">Cカップ</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>明るい</label><label>礼儀正しい</label><label>モデル体型</label><label>モデル系美女</label><label>好感度抜群</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/31">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/30/f6015268-1214-4e79-910a-b699bd8f9bf2.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">雪里 茉白(21歳)</h3>              
      <p>T.162cm&nbsp;<br class="displayNoneMore740">Fカップ</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>おっとり</label><label>清楚系</label><label>癒し系</label><label>礼儀正しい</label><label>もっちり美肌</label><label>小動物系美女</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/30">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/29/af8e35c0-48ac-4444-8cec-4132eb8a233c.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">綾瀬 風花(20歳)</h3>              
      <p>T.155cm&nbsp;<br class="displayNoneMore740">Dカップ</p>
    </div>
    <div class="mark">
        <label>新人</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/21">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/21/341e4785-bf41-4792-8164-ccd4b2ac9aec.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">柊木 果奈(26歳)</h3>              
      <p>T.158cm&nbsp;<br class="displayNoneMore740">ー</p>
    </div>
    <div class="mark">
        <label>新人</label><label>施術上手</label><label>美人系</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/23">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/23/361a1b67-4727-4356-94fb-5b4b09b907c7.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">宮本 亜美(22歳)</h3>              
      <p>T.150cm&nbsp;<br class="displayNoneMore740">ー</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>施術上手</label><label>小柄</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/25">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/24/0914a778-37c7-407c-94e0-278137a20f49.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">白雪 姫乃(21歳)</h3>              
      <p>T.158cm&nbsp;<br class="displayNoneMore740">ー</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>明るい</label><label>かわいい系</label><label>優しい</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/26">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/25/39adaa72-000b-4406-bd19-c23e135b9ecc.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">榎並 可憐(22歳)</h3>              
      <p>T.156cm&nbsp;<br class="displayNoneMore740">ー</p>
    </div>
    <div class="mark">
        <label>色白肌</label><label>明るい</label><label>清楚系</label><label>かわいい系</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/27">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/26/ad057757-3a5e-4d43-ab9e-34da63d8a5bf.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">宇佐美 瑠々(20歳)</h3>              
      <p>T.158cm&nbsp;<br class="displayNoneMore740">ー</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>明るい</label><label>モデル体型</label>
    </div>
    </a>
  </div>
  <div class="item clearfix fadein">
    <a data-turbolinks="false" href="/therapist/28">
    <div class="itemImg">
      <img src="https://taikunojikan2-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/27/aa5dcf56-a31f-4445-a568-862d592a0c00.jpg">
    </div>
    <div class="itemInfo">
      <h3 class="itemName">如月 雪愛(19歳)</h3>              
      <p>T.162cm&nbsp;<br class="displayNoneMore740">ー</p>
    </div>
    <div class="mark">
        <label>新人</label><label>色白肌</label><label>かわいい系</label><label>業界未経験</label>
    </div>
    </a>
  </div>
</div>
`;

async function main() {
  console.log('🚀 「体育の時間」の店舗登録とセラピスト完全抽出を開始します...\n');

  try {
    // --- 1. 店舗の登録（目黒エリアをベースにする） ---
    console.log('🏪 店舗データを作成中...');
    
    const SHOP_DATA = {
      id: SHOP_ID,
      name: '体育の時間',
      area_id: 'tokyo_meguro_meguro',
      group_id: GROUP_ID,
      schedule_url: 'https://petime2024.com/schedule',
      website_url: 'https://petime2024.com',
      business_hours: '12:00〜05:00', // HTML情報に基づく
      price_system: '70分 17,000円～', // 画像情報に基づく
      image_url: 'https://placehold.jp/2ecc71/ffffff/400x300.png?text=%E4%BD%93%E8%82%B2%E3%81%AE%E6%99%82%E9%96%93', // 必須: 仮のロゴ画像
      raw_data: {
        prefecture: '東京都',
        city: '目黒区',
        area: '目黒',
        address: '東京都目黒区目黒エリア', // 必須スクリーニング情報
        system: [
          {
            courseName: '基本コース',
            description: '',
            prices: [
              { time: '70分 (初回)', price: '17,000円' },
              { time: '70分 (通常)', price: '18,000円' },
              { time: '100分 (初回)', price: '22,000円' },
              { time: '100分 (通常)', price: '23,000円' }
            ]
          }
        ]
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報をID「${SHOP_ID}」で登録・更新しました。\n`);

    // --- 2. HTMLからセラピストをパース ---
    console.log(`⏳ 提供されたHTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.item');

    let newTherapists = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      const rawNameText = item.find('.itemName').text().trim();
      if (!rawNameText) return;

      let cleanName = rawNameText;
      let age = '';
      
      // "緒川 ひなの(18歳)" から名前と年齢を分離
      const match = rawNameText.match(/(.+?)\s*\((\d+歳)\)/);
      if (match) {
        cleanName = match[1].trim().replace(/[\s　]/g, '');
        age = match[2];
      }

      let imageUrl = item.find('img').attr('src') || '';

      let specText = item.find('p').text().trim();
      let height = '';
      let cup = '';
      
      // "T.154cm Fカップ" のようなテキストから抽出
      const hMatch = specText.match(/T\.(\d+cm)/);
      if (hMatch) height = hMatch[1];
      
      const cMatch = specText.match(/([A-Z]カップ)/);
      if (cMatch) cup = cMatch[1];

      const tags = [];
      item.find('.mark label').each((_, tagEl) => {
        tags.push($(tagEl).text().trim());
      });

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height} `;
      if (cup) fullBio += `カップ: ${cup}`;

      newTherapists.push({
        id: `${SHOP_ID}_${cleanName}`,
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

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。\n`);

    // --- 3. Supabaseへの登録処理 ---
    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！「体育の時間（目黒エリア）」に店舗と ${newTherapists.length}名のセラピストが登録されました。`);
    console.log('ブラウザでスーパーリロードして、検索結果に表示されるか確認してください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
