import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const CORRECT_AREA_ID = 'tokyo_suginami_koenji'; // 杉並区・高円寺
const NEW_SHOP_ID = `${CORRECT_AREA_ID}_spa_flame`; 
const GROUP_ID = 'g_spa_flame';
const WRONG_SHOP_ID = 'unknown_spa_flame';
const TARGET_URL = 'https://spa-flame.com/schedule/';

const SYSTEM_DATA = [
  {
    courseName: '基本コース',
    description: '',
    prices: [
      { time: '90min', price: '12,000yen' },
      { time: '120min', price: '16,000yen' },
      { time: '150min', price: '20,000yen' }
    ]
  }
];

const HTML_CONTENT = `
<ul class="girl list clearfix">


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=123">
<img src="../image_girl/123/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
つむぎさん<br>
42歳 身長 165cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=121">
<img src="../image_girl/121/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
のあさん<br>
41歳 身長 151cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=120">
<img src="../image_girl/120/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ここさん<br>
46歳 身長 153cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=118">
<img src="../image_girl/118/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
らんさん<br>
46歳 身長 165cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=115">
<img src="../image_girl/115/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
くみさん<br>
46歳 身長 160cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=113">
<img src="../image_girl/113/01.jpg?20260425062716" class="shadow" style="opacity: 1;">
<p class="girl_info">
とわさん<br>
48歳 身長 158cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=112">
<img src="../image_girl/112/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ふたばさん<br>
44歳 身長 160cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=111">
<img src="../image_girl/111/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
るりかさん<br>
45歳 身長 162cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=109">
<img src="../image_girl/109/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
セイラさん<br>
39歳 身長 167cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=108">
<img src="../image_girl/108/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
さきさん<br>
48歳 身長 153cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=107">
<img src="../image_girl/107/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
優（ゆう）さん<br>
55歳 身長 158cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=105">
<img src="../image_girl/105/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
れいかさん<br>
40歳 身長 155cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=104">
<img src="../image_girl/104/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ひめかさん<br>
48歳 身長 164cm<br>
</p>
<p class="girl_cat">
<span class="cat cat003">新人</span>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=103">
<img src="../image_girl/103/01.jpg?20260425062716" class="shadow" style="opacity: 1;">
<p class="girl_info">
あいのさん<br>
41歳 身長 165cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=101">
<img src="../image_girl/101/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ありすさん<br>
40歳 身長 168cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=100">
<img src="../image_girl/100/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ゆりなさん<br>
40歳 身長 159cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=96">
<img src="../image_girl/96/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ゆあさん<br>
43歳 身長 159cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=92">
<img src="../image_girl/92/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
もえさん<br>
52歳 身長 154cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=91">
<img src="../image_girl/91/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
まいさん<br>
42歳 身長 152cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=89">
<img src="../image_girl/89/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
芽依（めい）さん<br>
42歳 身長 155cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=88">
<img src="../image_girl/88/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
りおさん<br>
43歳 身長 160cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=87">
<img src="../image_girl/87/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
音羽（おとは）さん<br>
49歳 身長 158cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=85">
<img src="../image_girl/85/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ミイさん<br>
50歳 身長 170cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=83">
<img src="../image_girl/83/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
リリーさん<br>
47歳 身長 162cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=80">
<img src="../image_girl/80/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
みゆめさん<br>
45歳 身長 167cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=79">
<img src="../image_girl/79/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ひなさん<br>
36歳 身長 154cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=76">
<img src="../image_girl/76/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
まやさん<br>
47歳 身長 158cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=75">
<img src="../image_girl/75/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
はなさん<br>
48歳 身長 150cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=72">
<img src="../image_girl/72/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ゆたかさん<br>
40歳 身長 158cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=69">
<img src="../image_girl/69/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
みおさん<br>
38歳 身長 160cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=68">
<img src="../image_girl/68/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ねねさん<br>
45歳 身長 158cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=66">
<img src="../image_girl/66/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
あんなさん<br>
50歳 身長 140cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=65">
<img src="../image_girl/65/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
静香(しずか)さん<br>
51歳 身長 153cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=64">
<img src="../image_girl/64/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
夏菜子（かなこ）さん<br>
41歳 身長 163cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=60">
<img src="../image_girl/60/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
みゆきさん<br>
41歳 身長 156cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=58">
<img src="../image_girl/58/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
恵麻(えま)さん<br>
43歳 身長 153cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=55">
<img src="../image_girl/55/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
桃香(ももか)さん<br>
48歳 身長 163cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=51">
<img src="../image_girl/51/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
るりさん<br>
48歳 身長 152cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=50">
<img src="../image_girl/50/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
凛（りん）さん<br>
40歳 身長 164cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=47">
<img src="../image_girl/47/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
はるかさん<br>
43歳 身長 157cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=46">
<img src="../image_girl/46/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
みおりさん<br>
40歳 身長 159cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=44">
<img src="../image_girl/44/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
よしのさん<br>
48歳 身長 165cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=39">
<img src="../image_girl/39/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ななさん<br>
44歳 身長 157cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=38">
<img src="../image_girl/38/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
めぐさん<br>
45歳 身長 158cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix mv06">
<a href="https://spa-flame.com/profile/?id=34">
<img src="../image_girl/34/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
きょうこさん<br>
45歳 身長 158 cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix">
<a href="https://spa-flame.com/profile/?id=31">
<img src="../image_girl/31/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
りえさん<br>
45歳 身長 161cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix">
<a href="https://spa-flame.com/profile/?id=30">
<img src="../image_girl/30/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
まりあさん<br>
53歳 身長 156cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix">
<a href="https://spa-flame.com/profile/?id=26">
<img src="../image_girl/26/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
ほのかさん<br>
47歳 身長 156cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix">
<a href="https://spa-flame.com/profile/?id=14">
<img src="../image_girl/14/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
えみりさん<br>
46歳 身長 163cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix">
<a href="https://spa-flame.com/profile/?id=13">
<img src="../image_girl/13/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
みきさん<br>
47歳 身長 157cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix">
<a href="https://spa-flame.com/profile/?id=12">
<img src="../image_girl/12/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
みかさん<br>
50歳 身長 157cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix">
<a href="https://spa-flame.com/profile/?id=9">
<img src="../image_girl/9/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
あやさん<br>
48歳 身長 160cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix">
<a href="https://spa-flame.com/profile/?id=7">
<img src="../image_girl/7/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
はるなさん<br>
48歳 身長 154cm<br>
</p>
</a>
</li>


<li class="list-mv06 clearfix">
<a href="https://spa-flame.com/profile/?id=6">
<img src="../image_girl/6/01.jpg?20260425062716" class="shadow">
<p class="girl_info">
小鳥（ことり）さん<br>
45歳 身長 158cm<br>
</p>
</a>
</li>


</ul>
`;

async function main() {
  console.log('🚀 「スパフレイム (Spa Flame)」のデータを修正します...\n');

  try {
    // 1. 旧データの削除
    console.log('🧹 誤って登録された [unknown] エリアのデータを削除中...');
    await supabase.from('therapists').delete().eq('shop_id', WRONG_SHOP_ID);
    await supabase.from('shops').delete().eq('id', WRONG_SHOP_ID);
    console.log('✅ 削除完了\n');

    // 2. 店舗データの登録
    console.log('🏪 正しい店舗データ（高円寺）を登録中...');
    const SHOP_DATA = {
      id: NEW_SHOP_ID,
      name: 'スパフレイム (Spa Flame)',
      area_id: CORRECT_AREA_ID,
      group_id: GROUP_ID, 
      schedule_url: TARGET_URL,
      website_url: 'https://spa-flame.com/',
      business_hours: '営業時間要確認', 
      price_system: '90分 12,000円～',
      image_url: 'https://placehold.jp/3498db/ffffff/400x300.png?text=Spa+Flame', 
      raw_data: {
        prefecture: '東京都',
        city: '杉並区',
        area: '高円寺',
        address: '東京都杉並区高円寺エリア',
        system: SYSTEM_DATA // 画像から抽出した正確なコースデータ
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報（ID: ${NEW_SHOP_ID}）を登録しました。\n`);

    // 3. セラピストの抽出と登録
    console.log(`⏳ HTMLからセラピストを抽出中...`);
    const $ = cheerio.load(HTML_CONTENT);
    const items = $('.girl.list > li');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      
      const infoHtml = item.find('.girl_info').html();
      if (!infoHtml) return;

      const lines = infoHtml.split('<br>').map(s => s.trim());
      
      const rawName = lines[0].replace('さん', '').trim();
      if(!rawName) return;

      let cleanName = rawName;
      let age = '';
      let height = '';

      if (lines.length > 1) {
        const specLine = lines[1];
        const ageMatch = specLine.match(/(\d+)歳/);
        const heightMatch = specLine.match(/身長\s*(\d+)cm/i);
        
        if (ageMatch) age = `${ageMatch[1]}歳`;
        if (heightMatch) height = `${heightMatch[1]}cm`;
      }

      const tags = [];
      item.find('.girl_cat span.cat').each((_, catEl) => {
        tags.push($(catEl).text().trim());
      });

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height}`;

      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      let rawImgSrc = item.find('img').attr('src') || '';
      let imageUrl = '';
      if (rawImgSrc) {
          imageUrl = rawImgSrc.startsWith('http') ? rawImgSrc : new URL(rawImgSrc, 'https://spa-flame.com/').href;
      }

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
          original_name: lines[0]
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出。登録を開始します...`);

    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    // 4. ローカルJSONへの同期
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

    console.log(`\n🎉 修正完了！「高円寺」エリアに登録し直しました。`);
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）し、ブラウザで高円寺エリアをご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
