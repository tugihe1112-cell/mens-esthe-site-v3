import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// fetchShopData 内の口コミ取得処理を探して書き換えます
if (content.includes('.from(\'reviews\').select(\'*\').eq(\'shop_id\', shopId)')) {
  content = content.replace(
    /\.from\('reviews'\)\.select\('\*'\)\.eq\('shop_id', shopId\)/g,
    '.from(\'reviews\').select(\'*\').in(\'shop_id\', [shopId, ...(data?.brand_id ? [data.brand_id] : []), data?.id].filter(Boolean))'
  );
  fs.writeFileSync(filePath, content);
  console.log('✅ Supabaseへの口コミ取得条件を「ブランド全体吸収」に修正しました！');
} else if (content.includes('.from("reviews").select("*").eq("shop_id", shopId)')) {
  content = content.replace(
    /\.from\("reviews"\)\.select\("\*"\)\.eq\("shop_id", shopId\)/g,
    '.from("reviews").select("*").in("shop_id", [shopId, ...(data?.brand_id ? [data.brand_id] : []), data?.id].filter(Boolean))'
  );
  fs.writeFileSync(filePath, content);
  console.log('✅ Supabaseへの口コミ取得条件を「ブランド全体吸収」に修正しました！');
} else {
  // すこし幅を持たせた書き換え
  const lines = content.split('\n');
  let fixed = false;
  for(let i=0; i<lines.length; i++){
    if(lines[i].includes('supabase.from') && lines[i].includes('reviews') && lines[i].includes('eq') && lines[i].includes('shop_id')){
       lines[i] = lines[i].replace(/\.eq\(['"]shop_id['"],\s*shopId\)/, '.in("shop_id", [shopId, data?.brand_id].filter(Boolean))');
       fixed = true;
    }
  }
  if(fixed){
     fs.writeFileSync(filePath, lines.join('\n'));
     console.log('✅ Supabaseへの口コミ取得条件を「ブランド全体吸収」に修正しました！（部分一致）');
  } else {
     console.log('⚠️ 自動書き換えに失敗しました。手動で確認する必要があります。');
  }
}
