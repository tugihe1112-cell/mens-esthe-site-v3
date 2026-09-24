/**
 * pageDataPrefetch.js — リンクに触れた瞬間に、次のページのデータを取り始める
 *
 * 【なぜ必要か（2026-09-23 実測・okabayashi「サイトはさくさく動かない気はする」）】
 * このサイトのページは getServerSideProps（SSR）なので、リンクを押すたびに Next.js が
 * `/_next/data/<build>/<path>.json` をサーバーへ取りに行き、**返ってくるまで画面が変わらない**。
 * 実測（PC・光回線・サーバー起動済み）: 押してから画面が変わるまで
 *   店舗 249ms／ブランド 205ms／セラピスト 294ms／エリア 553ms。
 * CDNのキャッシュは60秒なので、アクセスの少ないこのサイトではほぼ毎回サーバーまで行く。
 * 止まっていたサーバーの起動待ちが入ると2秒前後。スマホ回線ではさらに往復が遅い。
 * （2026-08-22 にも「スマホでページ送りが遅い」とオーナーから指摘があった。）
 *
 * 【やること】
 * 1. リンクに触れた瞬間（touchstart／mousedown／65ms以上のホバー／キーボードのフォーカス）に、
 *    Next.js が押されたあとで取りに行くのと**同じデータ**を先に取りに行く。
 * 2. 押されたら、Next.js の取得（window.fetch）に**取り始めていた応答をそのまま渡す**。
 *    ＝同じものを2回取りに行かない（サーバーの負荷は増えない。触れて押さなかった分だけ増える）。
 *
 * ⚠️ 取りに行くのは getServerSideProps を持つページだけ（GSSP_ROUTES）。
 *    静的ページはデータ取得が無いので、取りに行くと404の無駄打ちになる。
 *    この一覧が pages/ と一致していることを scripts/ci/check_ssr_helpers.mjs が検査する。
 * ⚠️ 渡すのは30秒以内に取った応答だけ。CDN自体が最大60秒古い応答を返すので、鮮度の条件は今と変わらない。
 * ⚠️ 自分のサイトやSupabaseのデータへの書き込み（GET/HEAD以外）が1回でもあったら、
 *    取っておいた応答は全部捨てる。口コミを投稿した直後に開いたページが「投稿前」の中身になるのを防ぐ。
 * ⚠️ 失敗した応答（5xx 等）は渡さない。Next.js 自身に取り直させる（404 は Next.js が「ページが無い」として扱う）。
 * ⚠️ 通信節約モード（Save-Data）のときは何もしない。
 * ⚠️ ここで不具合が起きても通信そのものは止めない（どの経路も最後は元の fetch に落ちる）。
 */

/** getServerSideProps を持つページ（pages/ のファイル名と同じ書き方）。CIで pages/ と照合する。 */
export const GSSP_ROUTES = [
  '/',
  '/area/[pref]',
  '/brands/[brandId]',
  '/popular-reviews',
  '/request-review',
  '/search',
  '/shops/[shopId]',
  '/shops/[shopId]/threads/[threadId]',
];

export const PREFETCH_TTL_MS = 30_000;
const HOVER_DELAY_MS = 65;
const MAX_ENTRIES = 30;
const MAX_INFLIGHT = 4;

const DYNAMIC_SEGMENT = /^\[([A-Za-z0-9_]+)\]$/;

const safeDecode = (s) => {
  try { return decodeURIComponent(s); } catch { return s; }
};
const segmentsOf = (path) => {
  const clean = String(path || '/').replace(/\/+$/, '') || '/';
  return clean === '/' ? [] : clean.split('/').slice(1);
};
const dynamicCount = (route) => segmentsOf(route).filter((s) => DYNAMIC_SEGMENT.test(s)).length;

/**
 * pathname（URLエンコードされたままでよい）に当たる GSSP のページと、URLから取れる値を返す。
 * 当たらなければ null（静的ページ・存在しないページ）。
 * 固定の区切りが多いページを先に試す（Next.js と同じく「/shops/new」が「/shops/[shopId]」より勝つ）。
 */
export function matchGsspRoute(pathname, routes = GSSP_ROUTES) {
  const segs = segmentsOf(pathname);
  const ordered = [...routes].sort((a, b) => dynamicCount(a) - dynamicCount(b));
  for (const route of ordered) {
    const rsegs = segmentsOf(route);
    if (rsegs.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < rsegs.length; i += 1) {
      const m = rsegs[i].match(DYNAMIC_SEGMENT);
      if (m) {
        if (!segs[i]) { ok = false; break; }
        params[m[1]] = safeDecode(segs[i]);
      } else if (rsegs[i] !== safeDecode(segs[i])) {
        ok = false;
        break;
      }
    }
    if (ok) return { route, params };
  }
  return null;
}

/**
 * Next.js（pages router）がそのページへ移るときに取りに行くデータのURL。
 * 形は `/_next/data/<build><path>.json?<リンクのクエリ>&<URLから取れる値>`（トップは /index.json）。
 */
export function buildDataHref(buildId, pathname, search, match) {
  const clean = String(pathname || '/').replace(/\/+$/, '') || '/';
  const path = clean === '/' ? '/index' : clean;
  const q = new URLSearchParams(search || '');
  for (const [k, v] of Object.entries(match?.params || {})) q.set(k, v);
  const qs = q.toString();
  return `/_next/data/${buildId}${path}.json${qs ? `?${qs}` : ''}`;
}

/**
 * 同じデータの取得かどうかを比べる鍵。
 * パスのエンコードの違い（%20 と空白）・クエリの順番・空白の書き方（+ と %20）は同じとみなす。
 * `/_next/data/` 以外は null。
 */
export function dataKey(href, base = 'https://example.invalid') {
  let u;
  try { u = new URL(href, base); } catch { return null; }
  if (!u.pathname.startsWith('/_next/data/')) return null;
  const params = [...u.searchParams.entries()].sort((a, b) => {
    if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
    if (a[1] === b[1]) return 0;
    return a[1] < b[1] ? -1 : 1;
  });
  return `${safeDecode(u.pathname)}?${params.map(([k, v]) => `${k}=${v}`).join('&')}`;
}

/** 書き込みがあったら先取りを捨てる相手（自分のサイトのAPIと、Supabaseのデータ。ログイン処理は含めない） */
export function isDataMutation(method, href, origin) {
  const m = String(method || 'GET').toUpperCase();
  if (m === 'GET' || m === 'HEAD') return false;
  let u;
  try { u = new URL(href, origin); } catch { return false; }
  if (u.origin === origin && u.pathname.startsWith('/api/')) return true;
  return /\.supabase\.co$/.test(u.hostname) && u.pathname.startsWith('/rest/v1/');
}

/**
 * ブラウザで1回だけ呼ぶ（pages/_app.jsx）。
 * ⚠️ SSR中は何もしない。二重に呼んでも1回分しか動かない。
 */
export function installPageDataPrefetch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__pageDataPrefetch) return;
  const conn = typeof navigator !== 'undefined' ? navigator.connection : null;
  if (conn && conn.saveData) return;
  if (typeof window.fetch !== 'function') return;

  const originalFetch = window.fetch.bind(window);
  const store = new Map(); // key -> { at, promise }
  const stats = { prefetched: 0, handedOff: 0, expired: 0, skipped: 0 };
  let inflight = 0;
  window.__pageDataPrefetch = stats; // 本番で効いているかを確かめるための数（画面には出さない）

  window.fetch = function pageDataFetch(input, init) {
    try {
      const isRequest = typeof Request !== 'undefined' && input instanceof Request;
      const url = typeof input === 'string' ? input : (input && (input.href || input.url)) || '';
      const method = String((init && init.method) || (isRequest ? input.method : 'GET')).toUpperCase();
      if (isDataMutation(method, url, window.location.origin)) {
        store.clear();
      } else if (method === 'GET') {
        const key = dataKey(url, window.location.href);
        const hit = key ? store.get(key) : null;
        if (hit) {
          store.delete(key);
          if (Date.now() - hit.at <= PREFETCH_TTL_MS) {
            stats.handedOff += 1;
            return hit.promise.then(
              (res) => (res && (res.ok || res.status === 404) ? res : originalFetch(input, init)),
              () => originalFetch(input, init),
            );
          }
          stats.expired += 1;
        }
      }
    } catch {
      // 先取りの不具合で通信を止めない
    }
    return originalFetch(input, init);
  };

  const prefetchAnchor = (a) => {
    try {
      if (!a || !a.href) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      const buildId = window.__NEXT_DATA__ && window.__NEXT_DATA__.buildId;
      if (!buildId) return;
      const match = matchGsspRoute(url.pathname);
      if (!match) return;
      const href = buildDataHref(buildId, url.pathname, url.search, match);
      const key = dataKey(href, window.location.href);
      if (!key) return;
      const current = store.get(key);
      if (current && Date.now() - current.at <= PREFETCH_TTL_MS) return;
      if (inflight >= MAX_INFLIGHT) { stats.skipped += 1; return; }
      inflight += 1;
      stats.prefetched += 1;
      const promise = originalFetch(href, { credentials: 'same-origin', headers: { 'x-nextjs-data': '1' } });
      promise.then(() => { inflight -= 1; }, () => { inflight -= 1; });
      store.set(key, { at: Date.now(), promise });
      while (store.size > MAX_ENTRIES) store.delete(store.keys().next().value);
    } catch {
      // noop
    }
  };

  const anchorOf = (target) => (target && typeof target.closest === 'function' ? target.closest('a[href]') : null);
  const onIntent = (e) => prefetchAnchor(anchorOf(e.target));
  const opts = { capture: true, passive: true };
  document.addEventListener('touchstart', onIntent, opts);
  document.addEventListener('mousedown', onIntent, opts);
  document.addEventListener('focusin', onIntent, opts);

  let hoverTimer = null;
  let hoverAnchor = null;
  document.addEventListener('mouseover', (e) => {
    const a = anchorOf(e.target);
    if (a === hoverAnchor) return;
    hoverAnchor = a;
    clearTimeout(hoverTimer);
    if (a) hoverTimer = setTimeout(() => prefetchAnchor(a), HOVER_DELAY_MS);
  }, opts);
}
