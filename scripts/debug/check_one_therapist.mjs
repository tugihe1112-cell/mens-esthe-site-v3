/**
 * check_one_therapist.mjs <therapistId>
 * 特定セラピストの個別ページが「開かない/見つからない」原因を切り分ける。
 * SSR(gSSP)は `therapists.eq('id', threadId).single()` で引くので、id完全一致が必須。
 * IDの表記揺れ(全角スペース/アンダースコア)や、shopの有無を確認する。
 *
 * 実行: node scripts/debug/check_one_therapist.mjs saitama_urawa_pink_lady_ねね
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const E = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(E('VITE_SUPABASE_URL'), E('SUPABASE_SERVICE_ROLE_KEY'));

const id = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!id) { console.error('使い方: node scripts/debug/check_one_therapist.mjs <therapistId>'); process.exit(1); }

const shopId = id.includes('_') ? id.split('_').slice(0, -1).join('_') : id; // 末尾を名前とみなし手前をshop_id候補に
const namePart = id.split('_').pop();

async function main() {
  console.log(`\n🔎 個別ページ診断: ${id}\n`);

  // 1) 完全一致（SSRと同じ引き方）
  const { data: exact, error: exErr } = await supabase.from('therapists').select('id, shop_id, name, image_url').eq('id', id).maybeSingle();
  console.log('① id 完全一致（SSRのgSSPと同じ）:');
  if (exErr) console.log(`   ⚠️ エラー: ${exErr.message}`);
  console.log(exact ? `   ✅ 見つかった  name=${exact.name}  image_url=${exact.image_url || '(null)'}` : '   ❌ 見つからない → SSRはセラピストnull=「見つかりません/仮プロフィール」表示になる');

  // 2) shop存在
  const { data: shop } = await supabase.from('shops').select('id, name').eq('id', shopId).maybeSingle();
  console.log(`\n② 店舗 ${shopId}:`);
  console.log(shop ? `   ✅ ある  ${shop.name}` : `   ❓ この分割では見つからない（shop_idの区切り位置が違うかも）`);

  // 3) 近いidを名前で探す（表記揺れ検出）
  console.log(`\n③ 「${namePart}」に近いセラピスト（表記揺れ探し）:`);
  const { data: cands } = await supabase
    .from('therapists')
    .select('id, shop_id, name, image_url')
    .ilike('id', `%${namePart}%`)
    .limit(10);
  if (!cands?.length) console.log('   該当なし');
  else cands.forEach((c) => console.log(`   - id="${c.id}"  name="${c.name}"  img=${c.image_url ? 'あり' : 'null'}  ${c.id === id ? '★完全一致' : '←idが違う(表記揺れ?)'}`));

  console.log('\n判定:');
  console.log('  ①が✅なら「開かない」はコード/一時障害の疑い（ページ自体は成立）。');
  console.log('  ①が❌で③に似たidがあれば、URLのidとDBのidの表記揺れ（=リンク生成元とDBの不一致）。\n');
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
