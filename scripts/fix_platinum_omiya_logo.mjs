import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 既存の池袋店などから、正しいロゴのURLを取得して、大宮店に設定します。
async function main() {
  console.log('🚀 PLATINUM TOKYO 大宮店のロゴ欠損修正を開始します...\n');

  try {
    // 1. まず、ロゴが設定されている店舗（池袋店）から正しいロゴURLを取得
    const { data: sourceShop, error: sourceError } = await supabase
      .from('shops')
      .select('image_url')
      .eq('area_id', 'tokyo_toshima_ikebukuro') // 池袋店を指定
      .ilike('name', '%PLATINUM%')
      .not('image_url', 'is', null) // nullでないものを探す
      .not('image_url', 'eq', '')   // 空文字でないものを探す
      .limit(1);

    if (sourceError) throw sourceError;

    if (!sourceShop || sourceShop.length === 0 || !sourceShop[0].image_url) {
      console.error('❌ 設定済みのロゴURLが見つかりませんでした。池袋店のロゴを確認してください。');
      return;
    }

    const correctLogoUrl = sourceShop[0].image_url;
    console.log(`🔗 取得した共通ロゴURL: ${correctLogoUrl}`);

    // 2. 大宮店のロゴを更新
    console.log(`\n💾 大宮店 (saitama_omiya_platinum) のロゴを更新中...`);
    const { error: updateError } = await supabase
      .from('shops')
      .update({ image_url: correctLogoUrl })
      .eq('area_id', 'saitama_omiya_platinum') // 大宮店をピンポイントで指定
      .ilike('name', '%PLATINUM%');

    if (updateError) {
      console.error(`❌ 更新エラー:`, updateError);
    } else {
      console.log(`✅ 大宮店のロゴ更新が完了しました！`);
    }

  } catch (error) {
    console.error('❌ 予期せぬエラーが発生しました:', error);
  }
}

main();
