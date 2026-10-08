/**
 * rosterPagination.mjs — 在籍一覧のページ送りを見分けて、全部のページを辿る（照合の道具が共通で使う）
 *
 * 【なぜ（2026-10-09）】
 * タイガーアイ（tiger01-nagoya.com）の在籍一覧は staff.php?p=1〜4 の4ページ（312人）。
 * 1ページ目には ?p=2 へのリンクしか無く、2ページ目に ?p=1（前）と ?p=3（次）がある。
 * 照合の道具（brand_roster_audit）は「まだ読んでいないページ送りのリンクを**1つだけ**」選んで進む作りで、
 * 2ページ目で ?p=1 を選んで1ページ目に戻り、3ページ目に行かないまま止まっていた。
 * → 3〜4ページ目の在籍中の人を「公式にいない」と判定し、9/27 と 10/04 の照合で19人を消していた。
 *   （画面を組み立てる読み方と deep_roster_audit は、そもそも2ページ目から先を辿っていなかった）
 *
 * 【決まり】
 *  ・見つけたページ送りのリンクは**全部**待ち行列に入れ、読んだページからもまた拾う（幅優先）。
 *  ・ページ送りとみなすのは、同じオリジンで、**同じ一覧**（/page/N を外したパスが同じ）のリンクのうち、
 *    ?p= / ?page= / ?pg= の番号付き、/page/N・/p/N の形、または「次」「next」「›」「»」「>」の文字のもの。
 *  ・募集・ブログ・日記・お知らせ・出勤表・料金・アクセス・口コミのページは辿らない。
 *  ・1つの一覧につき最大 MAX_LIST_PAGES ページ（読みすぎで止まらないように）。
 */

export const MAX_LIST_PAGES = 15;

// 口コミの一覧（voice_list・impressions_list）は同じパスでもページ送りでも在籍一覧ではない（2026-10-09 の全サイト調べで見つけた）
const NOT_LIST = /(recruit|blog|diary|news|schedule|system|price|access|review|voice|impression|kuchikomi)/i;
// cp＝RiRe 川崎・TeTe 横浜の casts?cp=2（2026-10-09 の全サイト調べで見つけた）
const PAGE_PARAM = /[?&](p|page|pg|cp|paged|pageno|pn)=\d+/i;
// 「次」「>」でも、日付・週の切り替え（?date=・?week=）や人物ページの「次の子」（?uid=）はページ送りではない
const NOT_PAGE_QUERY = /[?&](date|day|week|month|ym|uid|sid|gid|lid|id)=/i;
const PAGE_PATH = /\/(page|p)\/\d+\/?$/i;
const NEXT_TEXT = /^(次|next|›|»|>)/i;

/** /cast/page/3/ → /cast、/staff.php → /staff.php、/ → / */
export function listBasePath(pathname) {
  return pathname.replace(PAGE_PATH, '').replace(/\/+$/, '') || '/';
}

/**
 * そのページにあるリンクのうち、同じ一覧の別ページへのものを返す。
 * @param {{href:string, text?:string}[]} anchors  href は相対でもよい
 * @param {string} pageUrl  リンクがあったページ
 * @returns {string[]} 絶対URL（# を外し、重複なし、そのページ自身は除く）
 */
export function paginationLinks(anchors, pageUrl) {
  let base;
  try { base = new URL(pageUrl); } catch { return []; }
  const self = base.href.replace(/#.*/, '');
  const basePath = listBasePath(base.pathname);
  const out = [];
  for (const a of anchors || []) {
    if (!a?.href) continue;
    let u;
    try { u = new URL(a.href, base); } catch { continue; }
    if (u.origin !== base.origin || !/^https?:$/.test(u.protocol)) continue;
    u.hash = '';
    if (NOT_LIST.test(u.pathname + u.search)) continue;
    if (listBasePath(u.pathname) !== basePath) continue;
    const isPage = PAGE_PARAM.test(u.search) || PAGE_PATH.test(u.pathname);
    const isNext = NEXT_TEXT.test(String(a.text || '').trim()) && !NOT_PAGE_QUERY.test(u.search);
    if (!isPage && !isNext) continue;
    const h = u.href;
    if (h !== self && !out.includes(h)) out.push(h);
  }
  return out;
}

/**
 * 一覧の最初のページから、ページ送りを全部辿る（幅優先）。
 * @param {string} startUrl
 * @param {(url:string) => Promise<{url?:string, anchors:{href:string,text?:string}[]}>} visit  1ページ読む。失敗は throw
 * @param {{max?:number, visited?:Set<string>}} opts  visited を渡すと、別の一覧と読んだページを共有する
 * @returns {Promise<object[]>} visit が返したものを読んだ順に
 */
export async function crawlPaginated(startUrl, visit, { max = MAX_LIST_PAGES, visited = new Set() } = {}) {
  const queue = [startUrl];
  const results = [];
  while (queue.length && results.length < max) {
    const u = queue.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    let got;
    try { got = await visit(u); } catch { continue; }
    if (got?.url) visited.add(got.url);
    results.push(got);
    for (const h of paginationLinks(got?.anchors, got?.url || u)) {
      if (!visited.has(h) && !queue.includes(h)) queue.push(h);
    }
  }
  return results;
}

/** 自己診断（実際に起きた形だけ）。壊れていたら問題の一覧を返す（空なら正常） */
export async function selfTestRosterPagination() {
  const problems = [];
  const O = 'https://tiger01-nagoya.com';
  // 2026-10-09 タイガーアイの実際の並び: 1ページ目は ?p=2 だけ、2ページ目から先は前後のページ
  const site = {
    [`${O}/staff.php`]: [{ href: 'staff.php?p=2', text: '2' }, { href: 'profile.php?sid=969', text: 'まほみ' }, { href: 'schedule.php', text: 'SCHEDULE' }],
    [`${O}/staff.php?p=2`]: [{ href: 'staff.php?p=1', text: '1' }, { href: 'staff.php?p=3', text: '3' }, { href: 'staff.php?p=1', text: '<' }],
    [`${O}/staff.php?p=3`]: [{ href: 'staff.php?p=2', text: '2' }, { href: 'staff.php?p=4', text: '4' }],
    [`${O}/staff.php?p=4`]: [{ href: 'staff.php?p=3', text: '3' }],
    [`${O}/staff.php?p=1`]: [{ href: 'staff.php?p=2', text: '2' }],
  };
  const read = await crawlPaginated(`${O}/staff.php`, async (u) => {
    if (!site[u]) throw new Error('404');
    return { url: u, anchors: site[u] };
  });
  const seen = read.map((r) => r.url);
  for (const p of [3, 4]) if (!seen.includes(`${O}/staff.php?p=${p}`)) problems.push(`タイガーアイの形で ${p}ページ目まで辿れていない（読んだ: ${seen.join(' ')}）`);
  // 同じ一覧の /page/N は辿る。ブログのページ送り・人物ページ・別オリジンは辿らない
  const links = paginationLinks([
    { href: '/cast/page/2/', text: '2' },
    { href: '/blog/page/2/', text: '2' },
    { href: '/cast/123/', text: '次の女の子' },
    { href: '/cast/?pg=3', text: '次へ' },
    { href: 'https://other.example/cast/page/2/', text: '2' },
    { href: '#top', text: '>' },
  ], 'https://example.com/cast/');
  const want = ['https://example.com/cast/page/2/', 'https://example.com/cast/?pg=3'];
  if (JSON.stringify(links) !== JSON.stringify(want)) problems.push(`ページ送りの見分け方が違う: ${JSON.stringify(links)}`);
  // /cast/page/2/ からも同じ一覧の /cast/page/3/ を辿る
  const fromP2 = paginationLinks([{ href: '/cast/page/3/', text: '3' }, { href: '/blog/page/3/', text: '3' }], 'https://example.com/cast/page/2/');
  if (JSON.stringify(fromP2) !== JSON.stringify(['https://example.com/cast/page/3/'])) problems.push(`/page/N から先を辿れない: ${JSON.stringify(fromP2)}`);
  // 2026-10-09 の全サイト調べで見つけた形: cp=（ページ送り）は辿る。日付・週・人物ページの「次」・口コミの一覧は辿らない
  const seen2 = paginationLinks([
    { href: '/casts?cp=2', text: '2' },
    { href: '/?date=2026-10-15', text: '>' },
    { href: '/staff/?week=2026-10-15', text: '次週' },
    { href: '/voice_list.html?page=2', text: '2' },
  ], 'https://rire-kawasaki.com/casts');
  if (JSON.stringify(seen2) !== JSON.stringify(['https://rire-kawasaki.com/casts?cp=2'])) problems.push(`cp= や日付の見分け方が違う: ${JSON.stringify(seen2)}`);
  const prof = paginationLinks([{ href: '/gals/profile/?uid=1754', text: '次のセラピスト' }], 'https://www.moonr.jp/gals/profile/?uid=1700');
  if (prof.length) problems.push(`人物ページの「次の子」をページ送りとみなしている: ${JSON.stringify(prof)}`);
  // 上限で止まる
  const endless = await crawlPaginated('https://e.example/list?page=1', async (u) => {
    const n = Number(new URL(u).searchParams.get('page'));
    return { url: u, anchors: [{ href: `/list?page=${n + 1}`, text: String(n + 1) }] };
  }, { max: 5 });
  if (endless.length !== 5) problems.push(`上限で止まらない（${endless.length}ページ読んだ）`);
  return problems;
}
