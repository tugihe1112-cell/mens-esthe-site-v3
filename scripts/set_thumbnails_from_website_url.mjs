import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// サイトのURLから、og:image または一番上の画像を抽出する関数
async function fetchImageFromUrl(siteUrl) {
  if (!siteUrl) return null;
  try {
    const response = await fetch(siteUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return null;
    
    // 文字化け対策
    const buffer = await response.arrayBuffer();
    let html = new TextDecoder('utf-8').decode(buffer);
    if (html.toLowerCase().includes('shift_jis')) {
        html = new TextDecoder('shift_jis').decode(buffer);
    } else if (html.toLowerCase().includes('euc-jp')) {
        html = new TextDecoder('euc-jp').decode(buffer);
    }

    const $ = cheerio.load(html);

    // 1. OGP画像（SNSシェア用のメイン画像）を探す（最も確実）
    let imageUrl = $('meta[property="og:image"]').attr('content');

    // 2. なければ、ヘッダーやメインビジュアルっぽい画像を探す
    if (!imageUrl) {
        imageUrl = $('img[src*="logo"], img[src*="top"], img[src*="main"]').first().attr('src');
    }

    // URLが相対パスの場合は絶対パスに変換
    if (imageUrl && !imageUrl.startsWith('http')) {
        const urlObj = new URL(siteUrl);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    return imageUrl;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('🚀 データベースの website_url から実際の画像を抽出してサムネイルに設定します...\n');
  try {
    // 荻窪エリアの店舗データを取得
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, website_url, image_url')
      .eq('area_id', 'tokyo_suginami_ogikubo');

    if (error) throw error;

    for (const shop of shops) {
      if (!shop.website_url) {
        console.log(`⚠️ [${shop.name}]: website_url が登録されていません。`);
        continue;
      }

      console.log(`⏳ [${shop.name}] (${shop.website_url}) から画像を抽出中...`);
      const extractedImageUrl = await fetchImageFromUrl(shop.website_url);

      if (extractedImageUrl) {
        // 画像をデータベースに更新
        await supabase
          .from('shops')
          .update({ image_url: extractedImageUrl })
          .eq('id', shop.id);
        console.log(`  ✅ 画像を設定しました: ${extractedImageUrl}`);
      } else {
        console.log(`  ❌ 画像を自動抽出できませんでした。`);
      }
    }

    // Vite用にローカルJSONを同期
    console.log('\n⏳ JSONデータを更新中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log('\n🎉 全ての処理が完了しました！ブラウザをリロードして確認してください。');
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}

main();
