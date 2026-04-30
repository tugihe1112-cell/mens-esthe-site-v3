import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 残すべき正しい店舗ID（黒いカード）
const TARGET_SHOP_ID = 'tokyo_suginami_ogikubo_a-laise';

// 誤って作成した削除すべき店舗ID（緑のカード）
const BAD_SHOP_IDS = [
  'tokyo_suginami_ogikubo_alaise',
  'tokyo_nakano_nakano_alaise',
  'tokyo_shinjuku_takadanobaba_alaise'
];

const TARGET_URL = 'https://a-laise-sk.com/schedule/';

async function main() {
  console.log('🚀 既存の「a laise (黒カード)」を拡張し、重複店舗を削除します...\n');

  try {
    // 1. 誤って作成した店舗とセラピストを削除
    console.log('🗑️ 誤って作成した重複店舗(緑カード)を削除中...');
    await supabase.from('therapists').delete().in('shop_id', BAD_SHOP_IDS);
    await supabase.from('shops').delete().in('id', BAD_SHOP_IDS);

    // 2. 既存の店舗情報をアップデート (荻窪・中野・高田馬場 共有化)
    console.log(`🏪 既存店舗 (${TARGET_SHOP_ID}) をグループ店舗として更新中...`);
    const { data: targetShop, error: shopErr } = await supabase
      .from('shops')
      .select('*')
      .eq('id', TARGET_SHOP_ID)
      .single();

    if (shopErr || !targetShop) {
      throw new Error('既存の a laise (黒カード) が見つかりません。');
    }

    // group_idの設定と、検索・フィルター用のタグ追加
    targetShop.group_id = 'g_alaise';
    targetShop.raw_data = targetShop.raw_data || {};
    // フロントエンドのエリア検索でヒットするようにタグに中野と高田馬場を追加
    const existingTags = targetShop.raw_data.tags || [];
    targetShop.raw_data.tags = Array.from(new Set([...existingTags, '中野', '高田馬場']));

    await supabase.from('shops').update({ 
      group_id: 'g_alaise', 
      raw_data: targetShop.raw_data 
    }).eq('id', TARGET_SHOP_ID);

    // 3. セラピスト・ROOM情報の取得
    console.log(`⏳ ${TARGET_URL} からデータを取得中...`);
    const response = await fetch(TARGET_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const html = new TextDecoder('utf-8').decode(await response.arrayBuffer());
    const $ = cheerio.load(html);
    const items = $('.cast__item');

    let therapistsToInsert = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      const rawNameText = item.find('.cast__name').text();
      let cleanName = rawNameText.replace(/\(\d+歳\)/, '').replace(/\s+/g, '').trim();
      if (!cleanName) return;

      const ageMatch = rawNameText.match(/\((\d+)歳\)/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      const rawSizeText = item.find('.cast__size').text().replace(/\s+/g, ' ').trim();
      let height = '';
      let cup = '';
      
      const heightMatch = rawSizeText.match(/T(\d+)/);
      if (heightMatch) height = heightMatch[1] + 'cm';
      const cupMatch = rawSizeText.match(/\(([A-Z])\)/);
      if (cupMatch) cup = cupMatch[1] + 'カップ';

      let fullBio = '';
      if (age) fullBio += `年齢: ${age}\n`;
      if (height || cup) fullBio += `サイズ: ${height} ${cup}`;

      const tags = [];
      item.find('.type__label span').each((i, tag) => tags.push($(tag).text().trim()));
      if (item.find('.label__new__cast').length > 0) tags.push('NEW');

      let imageUrl = item.find('picture img').attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = new URL(imageUrl, 'https://a-laise-sk.com').href;
      }

      therapistsToInsert.push({
        id: `${TARGET_SHOP_ID}_${cleanName}`,
        shop_id: TARGET_SHOP_ID,
        name: cleanName,
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: { 
          bio: fullBio.trim(), 
          original_name: cleanName,
          tags: tags,
          size_raw: rawSizeText
        }
      });
    });

    console.log(`🔍 サイトから ${therapistsToInsert.length} 件のデータ(ROOM含む)を抽出しました。`);

    // 4. 既存セラピストのクリア & 新規登録
    console.log(`🗑️ 古いセラピストデータをクリア中...`);
    await supabase.from('therapists').delete().eq('shop_id', TARGET_SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    let count = 0;
    for (let i = 0; i < therapistsToInsert.length; i += chunkSize) {
      const chunk = therapistsToInsert.slice(i, i + chunkSize);
      const { error: insErr } = await supabase.from('therapists').insert(chunk);
      if (insErr) throw insErr;
      count += chunk.length;
    }
    console.log(`✅ ${count} 件のセラピスト・ROOM情報の登録完了。`);

    // 5. ローカル同期
    console.log('\n⏳ JSONに同期中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log(`\n🎉 a laiseの修正と登録が完了しました！`);
    console.log('・余分な緑カード(3件)を削除しました。');
    console.log('・既存の黒カードに group_id を設定し、中野・高田馬場でも引っかかるようタグ付けしました。');
    console.log('・抽出されたセラピストやROOMはすべて、この黒カードに紐づいています。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
