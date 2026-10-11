import crypto from 'crypto';

export function hostnameOf(value) {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function rootDomainOf(value) {
  const host = value?.includes?.('://') ? hostnameOf(value) : value;
  if (!host) return null;
  const labels = host.toLowerCase().replace(/^www\./, '').split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.');
  const multiPartSuffixes = new Set([
    'co.jp',
    'ne.jp',
    'or.jp',
    'ac.jp',
    'go.jp',
    'com.au',
    'co.uk',
  ]);
  const lastTwo = labels.slice(-2).join('.');
  return multiPartSuffixes.has(lastTwo)
    ? labels.slice(-3).join('.')
    : lastTwo;
}

/**
 * 名簿の照合で「1つのサイト」とみなす単位を返す関数を作る（2026-09-27）。
 * ふだんはドメイン（例: aroma-giraffe.com）。ただし **1つのドメインの下に店ごとに別のアドレスがある**とき
 * （例: らんぷ＝a.senju-lamp.com・omiya.senju-lamp.com…、men-este.com＝aroma-terrace.men-este.com・tokyo-fairy-land.men-este.com…）は
 * アドレス（www を除いたホスト名）ごとに分ける。ドメインでまとめると1店分しか読まず、残りの店が一致0になっていた。
 * @param {string[]} urls 全店の公式URL
 */
export function rosterSiteKeyFactory(urls) {
  const hostsByRoot = new Map();
  for (const u of urls || []) {
    const h = hostnameOf(u); const r = rootDomainOf(u);
    if (!h || !r) continue;
    (hostsByRoot.get(r) || hostsByRoot.set(r, new Set()).get(r)).add(h);
  }
  return (u) => {
    const r = rootDomainOf(u);
    if (!r) return null;
    return (hostsByRoot.get(r)?.size || 0) > 1 ? hostnameOf(u) : r;
  };
}

/**
 * 名簿を取得するページが店舗公式サイト配下であることを確認する。
 * 画像自体はS3/CDNでもよいため、image URLではなく「画像を列挙したページ」を検査する。
 */
export function assertOfficialRosterSource({ officialWebsiteUrl, rosterUrl }) {
  const officialRoot = rootDomainOf(officialWebsiteUrl);
  const rosterRoot = rootDomainOf(rosterUrl);
  if (!officialRoot || !rosterRoot || officialRoot !== rosterRoot) {
    throw new Error(
      `公式外の名簿ページを拒否: official=${officialWebsiteUrl} roster=${rosterUrl}`,
    );
  }
}

const decodeOnce = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

// 写真のキーの「店」の部分（英数字・_・- だけ）。
export function imageKeyScope(shopId) {
  return String(shopId || '')
    .normalize('NFKC')
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

/**
 * 写真のキーの「人物ID」の部分。URL にそのまま入れても、Worker が同じキーを探せる文字だけにする。
 * 【2026-10-11】人物ページのURLの最後の段（URL.pathname）は日本語の名前を「%E3%81%82…」の形で返す。それをそのまま
 * キーに入れたので R2 には「%」の文字のままのキーで入り、Worker（URL を decodeURIComponent してから探す）が 404（490枚）。
 * 人物ページのURLまるごと（…/cast/104621/#CastProfile）を人物IDにした道具もあり、「#」から後ろがブラウザから送られず 404（ARROW 8枚）。
 * → %XX は先に戻し、文字・数字・「.」「_」「-」以外は「_」にする。変えたときは元の形の短いハッシュを添える（別の人が同じ形にならない）。
 *   日本語の名前はそのまま残る（日本語のキーは Worker で正しく返る＝本番で確認済み）。
 */
export function imageKeyCastPart(castId) {
  const raw = decodeOnce(String(castId ?? '')).normalize('NFKC').trim();
  if (!raw) return '';
  const safe = raw.replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/^[._]+|[._]+$/g, '').slice(0, 40);
  if (safe === raw) return safe;
  const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 8);
  return safe ? `${safe}_${hash}` : hash;
}

// キーとして R2 に入れてはいけない文字（URL の中で意味が変わる・見えない）。
const UNSAFE_KEY_CHAR = /[%#?\\/\s\p{C}]/u;

// 写真の URL から、Worker が R2 で探すキーを出す（Worker と同じく pathname を decodeURIComponent する）。
export function imageKeyFromUrl(url) {
  try { return decodeOnce(new URL(String(url || '')).pathname.replace(/^\/+/, '')); } catch { return ''; }
}

/**
 * 写真のキー（imageKeyFromUrl の結果）が、この店のこの人物IDの写真か。
 * 今の形（imageKeyCastPart）と、2026-10-11 より前の形（人物IDを「%E3…」のまま・日本語のまま・URLまるごと入れたキー）の両方を見る。
 * 人物IDの後ろは「_<版12桁>.<拡張子>」だけ＝ID「a」の写真と ID「a_b」の写真を取り違えない。
 */
export function isPhotoKeyOf({ shopId, castId }, key) {
  const scope = imageKeyScope(shopId);
  if (!scope) return false;
  const file = String(key || '').replace(/^(?:therapist-images|shop-logos|shops)\//, '');
  const tail = /^_[0-9a-f]{12}\.[a-z0-9]+$/;
  const now = imageKeyCastPart(castId);
  // 昔のキーは人物IDを前後の空白ごと入れていた（ゆりかご大津「一連（いちれん）8-14　デビュー　」）＝ここでは trim しない
  const legacy = decodeOnce(String(castId ?? '')).normalize('NFKC');
  const pairs = [[file, now], [decodeOnce(file).normalize('NFKC'), legacy]];
  return pairs.some(([f, id]) => {
    if (!id) return false;
    const head = `cast_${scope}_${id}`;
    return f.startsWith(head) && tail.test(f.slice(head.length));
  });
}

/**
 * 同名ファイル(例 photos/15/...jpg)が別店舗で衝突しないR2キーを作る。
 */
export function scopedImageKey({ shopId, castId, sourceUrl, prefix = 'cast' }) {
  const scope = imageKeyScope(shopId);
  const castPart = imageKeyCastPart(castId);
  if (!scope || !castPart || !sourceUrl) throw new Error('scopedImageKeyの引数が不足しています');
  let extension = 'jpg';
  try {
    const candidate = new URL(sourceUrl).pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(candidate)) {
      extension = candidate === 'jpeg' ? 'jpg' : candidate;
    }
  } catch {
    // 形式不明はjpg。uploadImageが実Content-Typeを検証する。
  }
  const version = crypto.createHash('sha1').update(sourceUrl).digest('hex').slice(0, 12);
  const key = `${prefix}_${scope}_${castPart}_${version}.${extension}`;
  if (UNSAFE_KEY_CHAR.test(key)) throw new Error(`写真のキーに URL で意味が変わる文字が入っています: ${key}`);
  return key;
}

// 起動時・CI の自己診断。実際に 404 になった人物IDの形をそのまま入れてある。
export function selfTestImageKeys() {
  const errors = [];
  const ok = (cond, msg) => { if (!cond) errors.push(msg); };
  const src = 'https://example.jp/photos/1/a.jpg';
  const pct = '%E3%81%82%E3%81%84'; // 「あい」を%で書いた形（castIdOf が URL.pathname から返していた形）
  const k1 = scopedImageKey({ shopId: 'aichi_meieki_galaxy_nagoya', castId: pct, sourceUrl: src });
  ok(!k1.includes('%'), `%で書いた人物IDがキーに残る: ${k1}`);
  ok(k1.startsWith('cast_aichi_meieki_galaxy_nagoya_あい_'), `%で書いた人物IDを日本語に戻していない: ${k1}`);
  ok(k1 === scopedImageKey({ shopId: 'aichi_meieki_galaxy_nagoya', castId: 'あい', sourceUrl: src }), '%で書いた形と日本語の形で別のキーになる');
  const arrow = 'https://estama.jp/shop/28543/cast/104621/#CastProfile';
  const k2 = scopedImageKey({ shopId: 'kyoto_kyoto_arrow', castId: arrow, sourceUrl: src });
  ok(!/[#/?%:]/.test(k2), `URLまるごとの人物IDで # / ? % : がキーに残る: ${k2}`);
  ok(k2 !== scopedImageKey({ shopId: 'kyoto_kyoto_arrow', castId: 'https://estama.jp/shop/28543/cast/104622/#CastProfile', sourceUrl: src }), '別の人物ページのURLが同じキーになる');
  ok(scopedImageKey({ shopId: 's', castId: '104621', sourceUrl: src }).startsWith('cast_s_104621_'), '英数字の人物IDまで形が変わった（今までの写真と照合できなくなる）');
  ok(imageKeyCastPart('聖 彩朱佳') !== imageKeyCastPart('聖_彩朱佳'), '空白を「_」にしただけで別の人と同じ形になる');
  ok(imageKeyCastPart('%E3%81') !== '', '壊れた%の形で人物IDが空になる');
  ok(imageKeyFromUrl('https://h.dev/therapist-images/cast_s_%25E3%2581%2582_0123456789ab.jpg') === 'therapist-images/cast_s_%E3%81%82_0123456789ab.jpg', 'imageKeyFromUrl が Worker と同じキーを返さない（%25）');
  ok(imageKeyFromUrl('https://h.dev/therapist-images/cast_s_あ_0123456789ab.jpg') === 'therapist-images/cast_s_あ_0123456789ab.jpg', 'imageKeyFromUrl が日本語のキーを返さない');
  // 同じ人物ページの写真か（新人追加の「同じ公式プロフィールの人は足さない」）
  ok(isPhotoKeyOf({ shopId: 's', castId: pct }, 'therapist-images/cast_s_%E3%81%82%E3%81%84_0123456789ab.jpg'), '昔の形（%のまま）のキーを同じ人と見ない');
  ok(isPhotoKeyOf({ shopId: 's', castId: 'あい' }, 'therapist-images/cast_s_%E3%81%82%E3%81%84_0123456789ab.jpg'), '昔の形（%のまま）のキーを日本語の人物IDで見つけられない');
  ok(isPhotoKeyOf({ shopId: 's', castId: pct }, imageKeyFromUrl(`https://h.dev/therapist-images/${scopedImageKey({ shopId: 's', castId: pct, sourceUrl: src })}`)), '今の形で作ったキーを同じ人と見ない');
  ok(isPhotoKeyOf({ shopId: 'kyoto_kyoto_arrow', castId: arrow }, imageKeyFromUrl('https://h.dev/therapist-images/cast_kyoto_kyoto_arrow_https://estama.jp/shop/28543/cast/104621/%23CastProfile_c6cb0cdc3249.jpg')), '昔の形（URLまるごと）のキーを同じ人と見ない');
  ok(!isPhotoKeyOf({ shopId: 's', castId: 'a' }, 'therapist-images/cast_s_a_b_0123456789ab.jpg'), '人物ID「a」が「a_b」の写真に当たる');
  ok(!isPhotoKeyOf({ shopId: 's', castId: '1' }, 'therapist-images/cast_s_12_0123456789ab.jpg'), '人物ID「1」が「12」の写真に当たる');
  ok(!isPhotoKeyOf({ shopId: 't', castId: 'a' }, 'therapist-images/cast_s_a_0123456789ab.jpg'), '別の店の写真に当たる');
  ok(isPhotoKeyOf({ shopId: 's', castId: '%e4%b8%80%e3%80%80' }, 'therapist-images/cast_s_%e4%b8%80%e3%80%80_0123456789ab.jpg'), '昔の形（後ろに全角の空白・小文字の%）のキーを同じ人と見ない');
  return errors;
}
