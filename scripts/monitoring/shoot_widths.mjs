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
    // ⚠️ 装飾は対象外にする。読ませる文字ではないので、大きくしても意味がない。
    //    ・aria-hidden の中（透かし・飾りの引用符など）
    //    ・絵文字や記号だけの要素（📍 🏢 ✕ など＝アイコン代わり）
    const size = parseFloat(cs.fontSize);
    const text = (el.childNodes.length === 1 && el.firstChild?.nodeType === 3) ? el.textContent.trim() : '';
    const decorative = el.closest('[aria-hidden="true"]') !== null
      || (text && !/[0-9A-Za-z\u3040-\u30ff\u4e00-\u9fff]/.test(text));
    if (text && size && size < 11.5 && !decorative && tiny.length < 12) {
      tiny.push({ size: Math.round(size * 10) / 10, text: text.slice(0, 24) });
    }
  }

  // (c) U02の受入条件: 390×844で「特典・登録CTA・検索操作」までが最初の画面に入るか
  const firstView = {};
  const vh = window.innerHeight;
  for (const [key, sel] of [['benefit', '.ui-help'], ['registerCta', 'a[href*="/register"]'], ['searchInput', '#home-search-mobile, #home-search-shop']]) {
    const el = document.querySelector(sel);
    firstView[key] = el ? Math.round(el.getBoundingClientRect().bottom) : null;
  }
  firstView.viewportHeight = vh;
  firstView.allWithinFirstView = ['benefit', 'registerCta', 'searchInput']
    .every((k) => firstView[k] !== null && firstView[k] <= vh);

  return { vw, scrollWidth: de.scrollWidth, overflowsX, offenders, tiny, firstView };
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

        // ⚠️ まず「実際の初期画面」を1枚（固定ドックもそのまま写る）。
        //    U02の「390×844で特典と登録CTAと検索操作まで見える」はこれで確認する。
        const viewFile = path.join(OUT_DIR, `${name}_${vp.label}_view.png`);
        await page.screenshot({ path: viewFile, fullPage: false });

        // ⚠️ 全体ショットでは position:fixed の要素が本文の途中に写り込み、
        //    その下にある本文を隠してしまう（実機では起きない撮影上の都合）。
        //    判定を誤らせるので、全体ショットの間だけ固定要素を隠す。
        await page.evaluate(() => {
          for (const el of document.body.querySelectorAll('*')) {
            if (getComputedStyle(el).position === 'fixed') { el.dataset.hiddenForShot = '1'; el.style.visibility = 'hidden'; }
          }
        });
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

  const firstViewNg = findings.filter((f) => f.width === 390 && f.name === 'home' && f.firstView && !f.firstView.allWithinFirstView);
  console.log('\n=== ホーム390pxの初期画面（U02: 特典・登録CTA・検索操作が入るか）===');
  for (const f of findings.filter((x) => x.name === 'home' && x.width === 390 && x.firstView)) {
    const v = f.firstView;
    console.log(`  ビューポート高さ${v.viewportHeight}px / 特典 ${v.benefit}px / 登録CTA ${v.registerCta}px / 検索入力 ${v.searchInput}px → ${v.allWithinFirstView ? '✅ 収まっている' : '🚨 収まっていない'}`);
  }
  if (firstViewNg.length) console.log('  ⚠️ 最新口コミ本文まで入る必要はないが、上の3つは初期画面に入れる約束（DESIGN.md U02）。');

  console.log('\n=== 12px未満で描画されている文字（装飾は除外）===');
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
