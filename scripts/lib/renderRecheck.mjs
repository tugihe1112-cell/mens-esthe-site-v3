/**
 * renderRecheck.mjs — 消す前の念押し（描画）。照合で「公式にいない」と判定した人の名前を、
 * 公式ページを手元の Chrome で組み立てて下まで少しずつスクロールした画面の文字から探す。
 * 名前がどこかに出る人は消さない。
 *
 * 【なぜ（2026-10-04）】 reconcile_brand_rosters の念押しは「描画しない HTML」で名前を探していた。
 *   後から読み込まれる一覧（スクロールで続きが出る・JS で組み立てる）だと、在籍中の人を
 *   「公式にいない」と判定して消す側に入れる。10月の照合でちゅらエスの「屋良ひまわり(21)」など
 *   在籍中の4人が消す側に入っていた（2026-09-28 のわたしのおうち・WHITE ROSE と同じ型）。
 * ⚠️ 1ページずつ順番に開き、長めに待つ。3サイト同時に開いたときは一覧が読み込まれる前に読む
 *    サイトがあり、ちゅらエスを取りこぼした（実測）。
 * ⚠️ 開けないページが1つでもあるサイトは null を返す＝呼び出し側はそのサイトでは誰も消さない。
 * ⚠️ 短い名前が別の人の名前の一部に当たって残ることはあるが、消し過ぎるより残す方を選ぶ。
 */

export const flat = (s) => String(s || '').normalize('NFKC').replace(/[\s　]/g, '');
export const bare = (s) => flat(s).replace(/[（(【\[〔～~〜].*?[）)】\]〕～~〜]/g, '').replace(/\d+$/, '');

/** 名前が text に出る行（keep）と出ない行（depart）に分ける。text が空なら誰も消さない */
export function splitByNamesInText(rows, text) {
  const t = flat(text);
  if (!t) return { keep: [...rows], depart: [] };
  const keep = []; const depart = [];
  for (const r of rows) {
    const a = flat(r.name); const b = bare(r.name);
    if ((a && t.includes(a)) || (b.length >= 2 && t.includes(b))) keep.push(r); else depart.push(r);
  }
  return { keep, depart };
}

/** urls を1ページずつ描画して下まで少しずつスクロールし、画面の文字・画像の説明・HTML をつないで返す。開けなければ null */
export async function renderedText(browser, urls, { userAgent } = {}) {
  let out = '';
  for (const url of urls || []) {
    const page = await browser.newPage();
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    try {
      await page.setViewport({ width: 1280, height: 900 });
      if (userAgent) await page.setUserAgent(userAgent);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise((r) => setTimeout(r, 2000));
      for (let i = 0; i < 60; i++) { await page.evaluate(() => window.scrollBy(0, 600)); await new Promise((r) => setTimeout(r, 300)); }
      await new Promise((r) => setTimeout(r, 3000));
      out += '\n' + await page.evaluate(() => document.body.innerText + '\n' + [...document.images].map((i) => i.alt).join('\n') + '\n' + document.documentElement.outerHTML);
    } catch {
      return null;
    } finally {
      await page.close().catch(() => {});
    }
  }
  return out;
}

/** 自己診断（実際に起きた形だけ）。壊れていたら例外 */
export function selfTestRenderRecheck() {
  const rows = [
    { id: 'a', name: '屋良ひまわり' }, // 2026-10-04 ちゅらエス：一覧に「屋良ひまわり(21)T148」と載っていた
    { id: 'b', name: '上間みらい' },   // 一覧に出ない＝消す側
    { id: 'c', name: '水沢 あおい' },  // 空白の有無を問わない
    { id: 'd', name: 'ｱｲ' },           // 半角カナも同じに
    { id: 'e', name: '月岡【つきおか】' }, // 読み付きの名前は読みを外しても探す
  ];
  const text = 'もっとみる屋良ひまわり(21)T148-かわいい系 水沢あおい(24) アイ(22) 月岡(25)';
  const { keep, depart } = splitByNamesInText(rows, text);
  const ids = (xs) => xs.map((x) => x.id).sort().join('');
  if (ids(keep) !== 'acde' || ids(depart) !== 'b') throw new Error(`renderRecheck の自己診断に失敗: keep=${ids(keep)} depart=${ids(depart)}`);
  const empty = splitByNamesInText(rows, '');
  if (empty.depart.length !== 0) throw new Error('renderRecheck の自己診断に失敗: 画面の文字が空なのに消す側がある');
}
