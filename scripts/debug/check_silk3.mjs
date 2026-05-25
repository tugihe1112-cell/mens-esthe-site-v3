import fs from 'fs';
const res = await fetch('http://www.ms-silk.tokyo/cast/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html = await res.text();

// spacer以外の画像を探す
const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)]
  .map(m => ({ src: m[1], tag: m[0].substring(0, 120) }))
  .filter(m => !m.src.includes('spacer'));

console.log('spacer以外の画像:', imgs.slice(0, 10));

// background-imageも確認
const bgs = [...html.matchAll(/url\(["']?([^"')]+)["']?\)/gi)]
  .map(m => m[1])
  .filter(s => !s.includes('spacer') && (s.includes('cast') || s.includes('img') || s.includes('photo')));
console.log('\nbackground-image候補:', bgs.slice(0, 10));
