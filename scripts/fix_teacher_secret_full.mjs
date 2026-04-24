import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://teachersecret2025.com';
const SCHEDULE_URL = 'https://teachersecret2025.com/schedule';
const SHOP_ID = 'tokyo_meguro_teacher_secret';

async function main() {
  console.log('🚀 「女教師の秘め事」の完全修正（店舗表示＆フルデータ取得）を開始します...\n');

  try {
    // --- 1. 店舗が画面に出ない問題の修正（エリアIDの自動同期） ---
    console.log('🔍 システム上の正しい「目黒エリアID」を調べています...');
    const { data: graceShop } = await supabase
      .from('shops')
      .select('area_id')
      .eq('id', 'tokyo_meguro_meguro_grace')
      .single();
    
    // GRACEと同じエリアIDを使う（なければとりあえず 'tokyo_meguro'）
    const correctAreaId = (graceShop && graceShop.area_id) ? graceShop.area_id : 'tokyo_meguro';
    
    await supabase
      .from('shops')
      .update({ area_id: correctAreaId })
      .eq('id', SHOP_ID);
    console.log(`✅ 店舗のエリアIDを「${correctAreaId}」に修正しました（これで画面に出るはずです）。\n`);

    // --- 2. フルのセラピスト取得（/schedule から） ---
    console.log(`⏳ ${SCHEDULE_URL} からフルデータを取得中...`);
    const response = await axios.get(SCHEDULE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const items = $('.c-panel');

    if (items.length === 0) {
        console.log('⚠️ セラピストが見つかりませんでした。');
        return;
    }

    console.log(`✅ ${items.length} 名のフルデータを抽出しました。\n`);

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
      // is_activeクラスがついているものだけを正しく抽出
      item.find('.c-panel__tag li.is_active').each((_, tagEl) => {
        tags.push($(tagEl).text().trim());
      });

      const cleanName = rawName.replace(/[\s　]/g, '');

      let bioText = `年齢: ${age || '非公開'}`;
      if (catchphrase) {
          bioText += `\n${catchphrase}`;
      }

      newTherapists.push({
        id: `${SHOP_ID}_${cleanName}`,
        shop_id: SHOP_ID,
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

    // --- 3. Supabaseへの登録処理 ---
    console.log(`🗑️ 以前の不完全なデータ(4名)をクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 フルのデータ(${newTherapists.length}名)を登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 完全修正完了！ 店舗が画面に表示され、${newTherapists.length}名のセラピストが登録されました。`);
    console.log('ブラウザで「Cmd + Shift + R」を押してスーパーリロードし、表示を確認してください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
