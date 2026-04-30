import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const TARGET_SHOP_ID = 'tokyo_suginami_ogikubo_a-laise';
const TARGET_URL = 'https://a-laise-sk.com/casts/'; // 正しいキャスト一覧のURL

async function main() {
  console.log(`🚀 ${TARGET_URL} から「a laise」の全セラピストを再抽出して登録します...\n`);

  try {
    const response = await fetch(TARGET_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const html = new TextDecoder('utf-8').decode(await response.arrayBuffer());
    const $ = cheerio.load(html);
    
    // '.cast__item' を含む全ての要素を抽出
    const items = $('.cast__item');
    console.log(`🔍 サイトから ${items.length} 件の要素を検出しました。`);

    let therapistsToInsert = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      const rawNameText = item.find('.cast__name').text();
      // 年齢部分を削除し、空白を詰める
      let cleanName = rawNameText.replace(/\(\d+歳\)/, '').replace(/\s+/g, '').trim();
      if (!cleanName) return;

      const ageMatch = rawNameText.match(/\((\d+)歳\)/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      const rawSizeText = item.find('.cast__size').text().replace(/\s+/g, ' ').trim();
      let height = '';
      let cup = '';
      
      const heightMatch = rawSizeText.match(/T(\d+)/);
      if (heightMatch) height = heightMatch[1] + 'cm';
      const cupMatch = rawSizeText.match(/\(([A-Z\u2160-\u217F])\)/i); // 全角ローマ数字等にも対応
      if (cupMatch) cup = cupMatch[1] + 'カップ';

      let fullBio = '';
      if (age) fullBio += `年齢: ${age}\n`;
      if (height || cup) fullBio += `サイズ: ${height} ${cup}`;

      const tags = [];
      item.find('.type__label span').each((i, tag) => tags.push($(tag).text().trim()));
      if (item.find('.label__new__cast').length > 0) tags.push('NEW');

      // 画像URLの取得を強化
      let imageUrl = item.find('picture source').first().attr('srcset')?.split(' ')[0] || item.find('img').attr('src') || '';
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

    console.log(`📝 登録用データとして ${therapistsToInsert.length} 件を整形しました。`);

    if (therapistsToInsert.length === 0) {
        console.log('⚠️ 抽出できたセラピストがいません。');
        return;
    }

    console.log(`🗑️ 既存のセラピストデータをクリア中...`);
    await supabase.from('therapists').delete().eq('shop_id', TARGET_SHOP_ID);

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    let count = 0;
    for (let i = 0; i < therapistsToInsert.length; i += chunkSize) {
      const chunk = therapistsToInsert.slice(i, i + chunkSize);
      const { error: insErr } = await supabase.from('therapists').insert(chunk);
      if (insErr) {
          console.error('挿入エラー詳細:', insErr);
          throw insErr;
      }
      count += chunk.length;
    }
    console.log(`✅ ${count} 件の登録が完了しました！`);

    console.log('\n⏳ JSONに同期中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log(`\n🎉 a laiseの全61件の再登録が完了しました！`);

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
