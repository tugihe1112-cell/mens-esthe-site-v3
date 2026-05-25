import fs from 'fs';
const BASE = 'http://www.ms-silk.tokyo';
const res = await fetch(`${BASE}/staff/`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html = await res.text();

// 各セラピストブロックを探す（background-image + 名前が近くにある構造）
// まずブロック全体を確認
const blocks = [...html.matchAll(/background(?:-image)?[^{]*url\(["']?([^"')]+)["']?\)[^}]*/gi)];
console.log(`background-image件数: ${blocks.length}`);

// HTMLから名前+bg画像のペアを抽出
// "style"属性内のurl()と、同一要素または近くのテキストを対応付け
const sectionMatches = [...html.matchAll(/style="[^"]*url\(([^)]+)\)[^"]*"[^>]*>[\s\S]{0,300}/gi)];
sectionMatches.slice(0, 5).forEach(m => {
  const imgPath = m[1].replace(/['"]/g, '');
  const text = m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 80);
  console.log(`img: ${imgPath}`);
  console.log(`text: ${text}\n`);
});
