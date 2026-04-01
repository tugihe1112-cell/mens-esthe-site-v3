import fs from 'fs';

const filePath = 'src/contexts/DataContext.jsx';

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 修正前の行（image_urlなどが漏れている）
  const targetLine = "setShops(shopsData.map(d => ({ ...d.raw_data, id: d.id, group_id: d.group_id, name: d.name })));";
  
  // 修正後の行（image_url、料金システム、HPのURLなどを全て画面側に渡す）
  const newLine = "setShops(shopsData.map(d => ({ ...d.raw_data, id: d.id, group_id: d.group_id, name: d.name, image_url: d.image_url, website_url: d.website_url, phone_number: d.phone_number, business_hours: d.business_hours, price_system: d.price_system })));";

  if (content.includes(targetLine)) {
    content = content.replace(targetLine, newLine);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("✅ DataContext.jsx の修正が完了しました！");
    console.log("🎉 これで「ロゴ画像」や「料金システム」が正しく画面に表示されるはずです！");
  } else {
    console.log("⚠️ 対象の行がすでに見つからないか、別の形に修正されている可能性があります。");
  }
} catch (error) {
  console.error("エラー:", error);
}
