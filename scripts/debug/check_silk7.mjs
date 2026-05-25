import fs from 'fs';
const BASE = 'http://www.ms-silk.tokyo';
const res = await fetch(`${BASE}/staff/`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html = await res.text();

// style="background-image: url(...)" ... alt="名前" のパターンで抽出
const pairs = [...html.matchAll(/style="background-image:\s*url\(([^)]+)\)"[^>]*alt="([^"]+)"/gi)]
  .map(m => ({ img: BASE + m[1].replace(/['"]/g, ''), name: m[2].trim() }));

console.log(`取得件数: ${pairs.length}`);
pairs.forEach(p => console.log(`${p.name}: ${p.img}`));
