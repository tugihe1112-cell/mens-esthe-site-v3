import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://teachersecret2025.com';
const TARGET_SHOP_ID = 'tokyo_meguro_teacher_secret';

async function main() {
  console.log('🚀 「女教師の秘め事」公式サイトからの抽出とSupabase登録を開始します...\n');

  try {
    // --- 1. スクレイピング処理 ---
    console.log(`⏳ 公式サイトからHTMLデータを取得中...`);
    
    // トップページにID "cast" で一覧がある想定
    const response = await axios.get(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const items = $('.c-panel');

    if (items.length === 0) {
        console.log('⚠️ セラピストが見つかりませんでした。サイトのURLや構造が異なる可能性があります。');
        return;
    }

    console.log(`✅ ${items.length} 名のデータを抽出しました。\n`);

    let newTherapists = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      // 名前と年齢の抽出 (例: "小川 ひなの(18)")
      const rawNameAge = item.find('.c-panel__name').text().trim();
      if (!rawNameAge) return;

      let rawName = rawNameAge;
      let age = '';
      const match = rawNameAge.match(/(.+?)\s*\((\d+)\)/);
      if (match) {
        rawName = match[1].trim();
        age = `${match[2]}歳`;
      }

      // 画像URLの抽出
      let imageUrl = item.find('.c-panel__image img').attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${BASE_URL}${imageUrl}` : `${BASE_URL}/${imageUrl}`;
      }

      // キャッチフレーズの抽出
      let catchphrase = item.find('.c-panel__flow li').first().text().trim();

      // タグの抽出（is_activeクラスがついているものだけ）
      const tags = [];
      item.find('.c-panel__tag li.is_active').each((_, tagEl) => {
        tags.push($(tagEl).text().trim());
      });

      // スペースを除去したクリーンな名前
      const cleanName = rawName.replace(/[\s　]/g, '');

      // bio（プロフィール文）の構築
      let bioText = `年齢: ${age || '非公開'}`;
      if (catchphrase) {
          bioText += `\n${catchphrase}`;
      }

      newTherapists.push({
        id: `${TARGET_SHOP_ID}_${cleanName}`,
        shop_id: TARGET_SHOP_ID,
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

    // --- 2. Supabaseへの登録処理 ---
    console.log(`🗑️ 古いデータをクリアしています...`);
    const { error: deleteError } = await supabase
      .from('therapists')
      .delete()
      .eq('shop_id', TARGET_SHOP_ID);

    if (deleteError) throw deleteError;

    console.log(`📦 新しいデータを登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 登録完了！ ${newTherapists.length}名 のセラピストデータが正常に保存されました。`);
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして確認してください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
