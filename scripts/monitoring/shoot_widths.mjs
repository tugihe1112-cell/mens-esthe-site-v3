/**
 * shoot_widths.mjs — 指定幅で本番を実際に描画し、画面の破綻を機械で拾う＋スクショを残す
 *
 * 【なぜ必要か】
 * 指示書の受入条件は「幅360/390/768/1024/1440pxで確認。横スクロールなし、入力・ボタン・本文の欠けなし」。
 * これは今まで**人の目でしか確認できず、ずっと未実施のまま**だった。
 * 目で見るべきもの（余白の気持ちよさ）と、機械で判る事故（横スクロール・極小文字）は別物なので、
 * 後者は機械に判定させ、前者はスクショを残して人が見る。
 *
 * 【機械で見るもの】
 *  (a) 横スクロールの発生（documentElement.scrollWidth > clientWidth）と、はみ出している要素
 *  (b) 実際に描画された文字サイズが12px未満のもの（U01: 補助文は日時・件数でも12px以上）
 *
 * ⚠️ 新しいライブラリは入れない。既に devDependencies にある puppeteer を使う。
 * ⚠️ この検査は**本番を読むだけ**。ログインもフォーム送信もしない。
 *
 * 実行:
 *   node scripts/monitoring/shoot_widths.mjs
 *   BASE_URL=http://localhost:3000 node scripts/monitoring/shoot_widths.mjs   # 手元のdevでも可
 *   ONLY=/,/search node scripts/monitoring/shoot_widths.mjs                   # ページを絞る
 */
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const BASE = process.env.BASE_URL || 'https://www.mens-esthe-map.jp';
const OUT_DIR = process.env.OUT_DIR || 'outputs/screenshots';

// 指示書 §5 の指定幅。スマホは高さ844px、PCは900pxを基準にする。
const VIEWPORTS = [
  { w: 360, h: 844, label: '360' },
  { w: 390, h: 844, label: '390' },
  { w: 768, h: 900, label: '768' },
  { w: 1024, h: 900, label: '1024' },
  { w: 1440, h: 900, label: '1440' },
];

const DEFAULT_PAGES = [
  ['/', 'home'],
  ['/search?shop=%E6%96%B0%E5%AE%BF', 'search'],
  ['/shops', 'shop-list'],
  ['/shops/tokyo_minato_toranomon_tiger_gate', 'shop-detail'],
  ['/shops/tokyo_taito_ueno_iroke_wife/threads/' + encodeURIComponent('tokyo_taito_ueno_iroke_wife_星咲えり'), 'therapist'],
  ['/popular-reviews', 'reviews'],
  ['/register', 'register'],
  ['/login', 'login'],
];

const only = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
const pages = only.length ? DEFAULT_PAGES.filter(([p]) => only.some((o) => p.startsWith(o))) : DEFAULT_PAGES;

/** ページ内で実際に描画された状態を測る（ブラウザ内で実行される） */
function measure() {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const overflowsX = de.scrollWidth > vw + 1;

  const offenders = [];
  const tiny = [];
  const seen = new Set();
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;

    // (a) ビューポートより右へはみ出している要素
    if (r.right > vw + 1 && r.width > 4) {
      const sel = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
      if (!seen.has(sel) && offenders.length < 12) { seen.add(sel); offenders.push({ sel, right: Math.round(r.right), width: Math.round(r.width) }); }
    }

    // (b) 12px未満で描画されている文字（U01: 日時・件数でも12px以上）
    const size = parseFloat(cs.fontSize);
    const text = (el.childNodes.length === 1 && el.firstChild?.nodeType === 3) ? el.textContent.trim() : '';
    if (text && size && size < 11.5 && tiny.length < 12) {
      tiny.push({ size: Math.round(size * 10) / 10, text: text.slice(0, 24) });
    }
  }
  return { vw, scrollWidth: de.scrollWidth, overflowsX, offenders, tiny };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const findings = [];

  for (const [urlPath, name] of pages) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1 });
      const url = BASE + urlPath;
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        await new Promise((r) => setTimeout(r, 1200)); // クライアント描画の落ち着きを待つ
        const m = await page.evaluate(measure);
        const file = path.join(OUT_DIR, `${name}_${vp.label}.png`);
        await page.screenshot({ path: file, fullPage: true });
        findings.push({ name, width: vp.w, ...m, file });
        const mark = m.overflowsX ? '🚨' : (m.tiny.length ? '⚠️ ' : '✅');
        console.log(`${mark} ${name} @${vp.w}px  scrollWidth=${m.scrollWidth}  極小文字=${m.tiny.length}件  → ${file}`);
      } catch (e) {
        console.log(`❌ ${name} @${vp.w}px  取得失敗: ${String(e.message).slice(0, 80)}`);
        findings.push({ name, width: vp.w, error: String(e.message).slice(0, 200) });
      } finally {
        await page.close();
      }
    }
  }
  await browser.close();

  const overflow = findings.filter((f) => f.overflowsX);
  const tiny = findings.filter((f) => (f.tiny || []).length > 0);

  console.log('\n=== 横スクロールが出ている画面 ===');
  if (overflow.length === 0) console.log('  なし');
  for (const f of overflow) {
    console.log(`  ${f.name} @${f.width}px（${f.vw} → ${f.scrollWidth}px）`);
    for (const o of f.offenders) console.log(`      はみ出し: ${o.sel}  right=${o.right} width=${o.width}`);
  }

  console.log('\n=== 12px未満で描画されている文字 ===');
  if (tiny.length === 0) console.log('  なし');
  for (const f of tiny) {
    console.log(`  ${f.name} @${f.width}px`);
    for (const t of f.tiny) console.log(`      ${t.size}px  「${t.text}」`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify({ base: BASE, checkedAt: new Date().toISOString(), findings }, null, 2));
  console.log(`\n📄 ${path.join(OUT_DIR, 'report.json')} と各PNGを保存しました`);
  console.log('⚠️ 機械が見たのは「横スクロール」と「極小文字」だけです。余白・詰まり・読みやすさはPNGを人が見ること。');
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
