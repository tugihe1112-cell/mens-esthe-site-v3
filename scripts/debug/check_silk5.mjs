import fs from 'fs';
const res = await fetch('http://www.ms-silk.tokyo/staff/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html = await res.text();

// spacer以外の画像
const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*/gi)]
  .map(m => m[1]).filter(s => !s.includes('spacer') && !s.includes('banner') && !s.includes('logo'));
console.log('画像:', imgs.slice(0, 10));

// data-src等
const lazys = [...html.matchAll(/data-(?:src|image|lazy|original)=["']([^"']+)["']/gi)]
  .map(m => m[1]).filter(s => !s.includes('spacer'));
console.log('lazy:', lazys.slice(0, 10));

// background-image
const bgs = [...html.matchAll(/url\(["']?([^"')]+)["']?\)/gi)].map(m => m[1]).filter(s => !s.includes('spacer'));
console.log('bg:', bgs.slice(0, 10));

// 名前らしきテキスト周辺
const names = [...html.matchAll(/<(?:h[1-6]|p|span|div)[^>]*>([^<]{2,10})<\/(?:h[1-6]|p|span|div)>/gi)]
  .map(m => m[1].trim()).filter(s => /[ぁ-んァ-ヾ一-龯]/.test(s)).slice(0, 10);
console.log('名前候補:', names);
