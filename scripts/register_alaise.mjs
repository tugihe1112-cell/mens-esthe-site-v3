import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const GROUP_ID = 'g_alaise';
const TARGET_URL = 'https://a-laise-sk.com/schedule/';

const SYSTEM_DATA = [
  { courseName: '基本コース', description: '', prices: [{ time: '60min', price: '15,000円' }, { time: '80min', price: '20,000円' }, { time: '100min', price: '25,000円' }] }
];

const SHOPS = [
  { id: 'tokyo_suginami_ogikubo_alaise', name: 'a laise 荻窪', area_id: 'tokyo_suginami_ogikubo', raw_data: { prefecture: '東京都', city: '杉並区', area: '荻窪', address: '東京都杉並区荻窪エリア', system: SYSTEM_DATA } },
  { id: 'tokyo_nakano_nakano_alaise', name: 'a laise 中野', area_id: 'tokyo_nakano_nakano', raw_data: { prefecture: '東京都', city: '中野区', area: '中野', address: '東京都中野区中野エリア', system: SYSTEM_DATA } },
  { id: 'tokyo_shinjuku_takadanobaba_alaise', name: 'a laise 高田馬場', area_id: 'tokyo_shinjuku_takadanobaba', raw_data: { prefecture: '東京都', city: '新宿区', area: '高田馬場', address: '東京都新宿区高田馬場エリア', system: SYSTEM_DATA } }
];

async function main() {
  console.log('🚀 「a laise（アレーズ）」の店舗とセラピストの全店舗一括登録を開始します...\n');

  try {
    // 1. 店舗データの登録
    console.log('🏪 店舗データを登録中...');
    for (const shop of SHOPS) {
      const shopData = {
        id: shop.id,
        name: shop.name,
        area_id: shop.area_id,
        group_id: GROUP_ID,
        schedule_url: TARGET_URL,
        website_url: 'https://a-laise-sk.com/',
        business_hours: '営業時間要確認',
        price_system: '60分 15,000円～',
        image_url: 'https://placehold.jp/2ecc71/ffffff/400x300.png?text=a+laise', 
        raw_data: shop.raw_data
      };
      await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
    }
    console.log('✅ 店舗登録完了。\n');

    // 2. セラピストの抽出
    console.log(`⏳ ${TARGET_URL} からデータを取得中...`);
    const response = await fetch(TARGET_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const html = new TextDecoder('utf-8').decode(await response.arrayBuffer());
    const $ = cheerio.load(html);
    const items = $('.cast__item');

    let baseTherapists = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      const rawNameText = item.find('.cast__name').text();
      let cleanName = rawNameText.replace(/\(\d+歳\)/, '').trim();
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

      const isNew = item.find('.label__new__cast').length > 0;
      if (isNew) tags.push('NEW');

      let imageUrl = item.find('picture img').attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = new URL(imageUrl, 'https://a-laise-sk.com').href;
      }

      baseTherapists.push({
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

    console.log(`🔍 ${baseTherapists.length} 件のデータを抽出しました。`);

    // 3. 全店舗に複製して登録
    let allTherapistsToInsert = [];
    for (const shop of SHOPS) {
      const seenNames = {};
      baseTherapists.forEach(t => {
        let finalNameId = t.name.replace(/\s/g, '_');
        if (seenNames[finalNameId]) {
          seenNames[finalNameId]++;
          finalNameId = `${finalNameId}_${seenNames[finalNameId]}`;
        } else {
          seenNames[finalNameId] = 1;
        }
        allTherapistsToInsert.push({
          ...t,
          id: `${shop.id}_${finalNameId}`,
          shop_id: shop.id
        });
      });
    }

    console.log(`🗑️ 既存のセラピストデータをクリア中...`);
    await supabase.from('therapists').delete().in('shop_id', SHOPS.map(s => s.id));

    console.log(`📦 全 ${allTherapistsToInsert.length} 件（全店舗分）のセラピストを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < allTherapistsToInsert.length; i += chunkSize) {
      const chunk = allTherapistsToInsert.slice(i, i + chunkSize);
      await supabase.from('therapists').insert(chunk);
    }
    console.log('✅ セラピストの登録完了。');

    // 4. ローカル同期
    console.log('\n⏳ JSONに同期中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log(`\n🎉 a laise（アレーズ）荻窪・中野・高田馬場の登録が完了しました！`);

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
