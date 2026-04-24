import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// ご提供いただいたロゴURL
const LOGOS = {
  teacherSecret: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/zyokyoushinohimegoto.png',
  estheClub: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/tokyo%20este%20club.png',
  everything: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/everything.png',
  petime: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/taiikunozikan.png'
};

// 更新対象の店舗IDリスト
const UPDATES = [
  // 女教師の秘め事 (目黒、五反田)
  { ids: ['tokyo_meguro_meguro_teacher_secret', 'tokyo_shinagawa_gotanda_teacher_secret'], url: LOGOS.teacherSecret },
  
  // 東京えすてクラブ (学大、駒沢、桜新町、用賀)
  { ids: [
      'tokyo_meguro_gakugei_daigaku_tokyo_esthe_club',
      'tokyo_setagaya_komazawa_daigaku_tokyo_esthe_club',
      'tokyo_setagaya_sakurashinmachi_tokyo_esthe_club',
      'tokyo_setagaya_yoga_tokyo_esthe_club'
    ], url: LOGOS.estheClub },
  
  // Everything
  { ids: ['tokyo_meguro_meguro_everything'], url: LOGOS.everything },
  
  // 体育の時間
  { ids: ['tokyo_meguro_meguro_petime'], url: LOGOS.petime }
];

async function main() {
  console.log('🚀 各店舗のプレースホルダー画像を正式なロゴURLに一括更新します...\n');

  try {
    for (const update of UPDATES) {
      const { error } = await supabase
        .from('shops')
        .update({ image_url: update.url })
        .in('id', update.ids);

      if (error) {
        console.error(`❌ 更新エラー (${update.ids.join(', ')}):`, error.message);
      } else {
        console.log(`✅ 更新完了: ${update.ids.length}店舗にロゴを適用 -> ${update.url.split('/').pop()}`);
      }
    }

    console.log(`\n🎉 すべてのロゴ画像の差し替えが完了しました！`);
    console.log('ブラウザでスーパーリロード（Cmd + Shift + R）を実行し、一覧画面で正式なロゴが表示されているか確認してください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err.message);
  }
}

main();
