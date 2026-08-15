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

/**
 * 同名ファイル(例 photos/15/...jpg)が別店舗で衝突しないR2キーを作る。
 */
export function scopedImageKey({ shopId, castId, sourceUrl, prefix = 'cast' }) {
  const scope = String(shopId || '')
    .normalize('NFKC')
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  if (!scope || !castId || !sourceUrl) throw new Error('scopedImageKeyの引数が不足しています');
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
  return `${prefix}_${scope}_${castId}_${version}.${extension}`;
}
