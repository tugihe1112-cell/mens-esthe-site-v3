/**
 * mobile_audit.mjs — スマホ実描画（402×874）でUI/UXの機械監査を行う
 *
 * 【なぜ必要か（2026-08-17）】
 * それまでのスマホ監査は「コードをgrepして既知のアンチパターンを探す」方式で、
 * **思いつかなかった不具合は原理的に見つけられなかった**。
 * また Chrome MCP の resize_window は効かず（innerWidth が 1792 のまま）、
 * メディアクエリがPC判定になるため `md:` `lg:` が効いた状態しか測れなかった。
 *
 * → サンドボックス内で **ヘッドレスChromeを 402px で起動し、ローカルサーバーの
 *   実描画を測る** 方式に変更した。これで初めて「実際にスマホでどう出るか」が分かる。
 *
 * 【これは誰が実行するのか】
 *   基本は **Claude（サンドボックス）が実行する**もので、okabayashi が動かす必要はない。
 *   Mac で動かしたい場合は下の「Macで動かす場合」を参照。
 *
 * 【使い方】
 *   npm run build
 *   npx next start -p 3111 &        # ※同じシェルで起動すること（bash呼び出しをまたぐと落ちる）
 *   node scripts/ci/mobile_audit.mjs
 *
 * 【Chromium の入手（環境で異なる）】
 *   - サンドボックス: npmレジストリのみ疎通可。puppeteer 本体は Chromium を
 *     storage.googleapis.com から落とすため使えないが、`@sparticuz/chromium` は
 *     **npmパッケージ内にバイナリを同梱**しているので入る。
 *       npm i -D @sparticuz/chromium puppeteer-core
 *   - Macで動かす場合: 追加インストール不要。**Mac に既にある Google Chrome を使う**。
 *     見つからなければ `npm i -D puppeteer` でもよい。
 *
 * 【検出する項目】
 *   1. 横はみ出し（scrollWidth > clientWidth）＝最重要。1要素でも溢れると
 *      ページ全体が横スクロール可能になり、mx-auto の中央寄せが狂って端の文字が切れる
 *   2. input/textarea/select の font-size < 16px ＝ iOS Safari がフォーカス時に自動拡大する
 *   3. 英語のUI文言（日本語サイトに英語が残っていないか。ブランド名 "Mens Esthe" は除外）
 *   4. タップ領域 40px 未満のリンク/ボタン（Apple HIG は 44pt 推奨）
 */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

/**
 * 実行環境ごとに Chromium の在り処が違うので順に探す。
 * ①Mac/Linuxに実インストールされたChrome → ②@sparticuz/chromium（サンドボックス用・npm同梱）
 * どちらも無ければ、何を入れればよいかを表示して終了する（黙って落ちない）。
 */
async function resolveBrowser() {
  const localPaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  for (const p of localPaths) {
    if (fs.existsSync(p)) return { executablePath: p, args: ['--no-sandbox', '--disable-dev-shm-usage'] };
  }
  try {
    const { default: chromium } = await import('@sparticuz/chromium');
    return {
      executablePath: await chromium.executablePath(),
      args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage'],
    };
  } catch {
    console.error([
      '❌ Chromium が見つかりません。次のいずれかを用意してください:',
      '   ・Mac: Google Chrome をインストール（通常は既にあるはず）',
      '   ・サンドボックス/CI: npm i -D @sparticuz/chromium puppeteer-core',
    ].join('\n'));
    process.exit(2);
  }
}

const BASE = process.env.AUDIT_BASE || 'http://localhost:3111';
const PAGES = (process.env.AUDIT_PAGES || [
  '/legal', '/privacy', '/terms', '/premium', '/post-review', '/popular-reviews',
  '/ranking', '/new-therapists', '/contact', '/register', '/login', '/stats',
  '/area-search', '/request-review',
].join(',')).split(',');

// ブランド名など、英語のままで正しいもの
const ALLOWED_EN = [/^Mens Esthe/i, /^DATA \/ \d{4}$/];

// サーバーが起きているか先に確認（起きていないと全ページ「到達不可」になり原因が分かりにくい）
try {
  const res = await fetch(BASE + '/legal');
  if (!res.ok) throw new Error('HTTP ' + res.status);
} catch (e) {
  console.error(`❌ ${BASE} に接続できません（${e.message}）。先にサーバーを起動してください:\n   npm run build && npx next start -p 3111 &`);
  process.exit(2);
}

const { executablePath, args } = await resolveBrowser();
const browser = await puppeteer.launch({ executablePath, args, headless: true });

let ng = 0;
for (const path of PAGES) {
  const page = await browser.newPage();
  // iPhone 相当。isMobile:true でメディアクエリもスマホ判定になる
  await page.setViewport({ width: 402, height: 874, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 25000 });
  } catch (e) {
    console.log('❌ 到達不可', path, e.message.slice(0, 50));
    await page.close();
    continue;
  }
  await new Promise((r) => setTimeout(r, 1000));

  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const en = [], small = [], inputs = [], over = [];
    document.querySelectorAll('main *').forEach((el) => {
      const b = el.getBoundingClientRect();
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
      if (own && /^[A-Za-z][A-Za-z0-9 '’!?.,&:-]{5,}$/.test(own) && /\s/.test(own)) en.push(own.slice(0, 30));
      if ((el.tagName === 'A' || el.tagName === 'BUTTON') && b.height > 0 && b.height < 40 && (el.textContent || '').trim())
        small.push(`${Math.round(b.width)}x${Math.round(b.height)} "${(el.textContent || '').trim().slice(0, 14)}"`);
      if (getComputedStyle(el).position !== 'fixed' && b.width > 0 && b.right > W + 1 && b.width < W * 3)
        over.push(`${el.tagName}.${(el.className || '').toString().split(' ')[0]} R${Math.round(b.right)}`);
    });
    document.querySelectorAll('input,textarea,select').forEach((el) => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16 && !['checkbox', 'radio', 'range'].includes(el.type)) inputs.push(`${fs}px ${el.type || el.tagName}`);
    });
    return {
      W, scrollW: document.documentElement.scrollWidth,
      en: [...new Set(en)], small: [...new Set(small)], inputs: [...new Set(inputs)],
      over: [...new Set(over)].slice(0, 5),
    };
  });
  await page.close();

  const en = r.en.filter((t) => !ALLOWED_EN.some((re) => re.test(t)));
  const flags = [];
  if (r.scrollW > r.W) { flags.push(`🔴横はみ出し +${r.scrollW - r.W}px ${r.over.join(', ')}`); ng++; }
  if (r.inputs.length) { flags.push(`🔴入力欄16px未満: ${r.inputs.join(', ')}（iOSが自動拡大する）`); ng++; }
  if (en.length) { flags.push(`🟡英語UI: ${en.slice(0, 3).join(' / ')}`); }
  if (r.small.length) { flags.push(`🟡タップ領域40px未満 ${r.small.length}件: ${r.small.slice(0, 2).join(', ')}`); }
  console.log(`${flags.length ? flags.join('\n   ') : '✅ 問題なし'}  — ${path}`);
}

await browser.close();
console.log(ng === 0 ? '\n✅ 重大な問題（🔴）はありません' : `\n❌ 重大な問題が ${ng} 件`);
process.exit(ng === 0 ? 0 : 1);
