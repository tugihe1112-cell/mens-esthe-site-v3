import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Google検索を使って一番上のURLを取得する簡易的な関数
async function searchGoogle(query) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 検索結果のリンクを抽出 (GoogleのDOM構造に依存)
    let firstLink = null;
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        // '/url?q=' で始まり、Googleのサービス以外のURLを抽出
        if (href && href.startsWith('/url?q=') && !href.includes('google.com') && !href.includes('youtube.com')) {
            const actualUrl = href.replace('/url?q=', '').split('&')[0];
            if (!firstLink) firstLink = decodeURIComponent(actualUrl);
        }
    });
    
    return firstLink;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('🔍 荻窪エリアの店舗のURLを自動検索します...\n');
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name')
      .eq('area_id', 'tokyo_suginami_ogikubo');

    if (error) throw error;

    for (const shop of shops) {
      console.log(`⏳ [${shop.name}] を検索中...`);
      // 「店舗名 + エリア名 + メンズエステ」で検索精度を上げる
      const searchQuery = `${shop.name} 荻窪 メンズエステ`;
      const url = await searchGoogle(searchQuery);

      if (url) {
        console.log(`  👉 候補URL: ${url}`);
      } else {
        console.log(`  ❌ 見つかりませんでした`);
      }
      console.log('---');
      
      // 連続リクエストでブロックされないよう少し待機
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n✅ 検索が完了しました。');
  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}
main();
