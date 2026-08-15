import crypto from 'crypto';

const R2_THERAPIST_BASE =
  'https://mens-esthe-images.tugihe1112.workers.dev/therapist-images/';

// 2026-08-14に実画像を目視確認した「人物写真ではない」または
// 「多数の別人へ誤って使い回された」画像。DB監視と修復処理で共用する。
const KNOWN_BAD_FILENAMES = [
  'mig_457770cc28bc68893c30.jpg', // MoMo Spa: お写真準備中
  'mig_6904371b7677618b4187.png', // MoMo Spa: 即姫割り広告
  'mig_3c52758cdb47563af66f.jpg', // MoMo Spa: お写真NG
  'mig_7911c479a319a0d5afc3.jpg', // Dejavu: 同じ人物を137名へ誤割当
  'mig_d3f4d59a0fcafb223d5e.png', // 空画像
  'mig_9b821ab728d571930cd2.png', // LINEロゴ
  'mig_0d6c5c5dcd5432258fe2.png', // lit.linkロゴ
  'mig_0eeaa4e3ff235a117adc.jpg', // Xロゴ
  'mig_3eda702e7d03dd5279d5.jpg', // 空画像
  'mig_07de507b202adc7712aa.jpg', // Twitterロゴ
  'mig_eb814b5c3a785e6b1c3c.png', // 空画像
  'mig_45dfd5c1c4d0db70ee67.jpg', // Limited Spa: 同じ人物を複数名へ誤割当
  'mig_970e9cb8e12dcbad1110.jpg', // 店内風景
  'mig_c17a8abc3d8a73708d2e.jpg', // Xロゴ
  'mig_5bd9b80af5c9aa2825e2.png', // 店舗ロゴ
  'mig_c7d67153872fa96a63aa.jpg', // NOW PRINTING
  'mig_3c8aba41fa14edb7dcdc.png', // 空画像
  'mig_853baba8596697a4f5e0.jpg', // PLEASE WAIT
  'mig_53cecc88100eee45ffdf.png', // 透明spacer（エステの王様）
  'mig_6401afe08c615c49d67d.jpg', // Aroma Blossom: 写真準備中
  'mig_7fe159597f4953abf5a5.png', // 透明spacer（ONE ROOM）
  'mig_9b24174d940ce8d3dd96.png', // Caskan: Coming Soon
  'mig_695b24de662cb0803994.jpg', // 感謝: 写真準備中
  'mig_a94a3893f73774795aa2.png', // 透明spacer（Deep Black）
  'mig_373a4f9d4a279963329c.jpg', // 花の雨: 共通の代替写真
  'mig_be0efab800eb90fc60d1.jpg', // シャルル: NO IMAGE
  'mig_53254e188aabe7fecab6.png', // 大人の隠れ家: Coming Soon
  'mig_27c74b32535db835babd.png', // THE ESTHE: NO PHOTO
  'mig_9d57bb4009a883ddba3d.png', // Aroma Miely: newface代替画像
  'mig_dedaeba698addfa21c16.jpg', // 動画をjpgとして保存した誤データ
];

export const KNOWN_BAD_THERAPIST_IMAGE_URLS = Object.freeze(
  KNOWN_BAD_FILENAMES.map((filename) => `${R2_THERAPIST_BASE}${filename}`),
);

const KNOWN_BAD_URL_SET = new Set(KNOWN_BAD_THERAPIST_IMAGE_URLS);

// 汎用アップロード時に拒否するのは、広告・ロゴ・準備中・空画像だけ。
// 「同じ人物を別人へ誤割当した2画像」は、本人に正しく使われる可能性があるため
// 内容ハッシュでは拒否せず、DB上の大量使い回し監視で検出する。
export const KNOWN_PLACEHOLDER_IMAGE_SHA256 = new Set([
  '5091f2817b8cf57d0ad7323a469e52d0d3076b314756348021138f39e87734a4',
  'c39efe0464ecb07e892ddc3037ca9a837179f76718b56d71d35f3efa49a35ccf',
  '25a8f593d6dadd293252d6dba10af1bebb5ede35727ba070448d78e1738d1c16',
  'fe1b501ae2cd9e94bfb255b192e8c443b483b79cb4a5f0b256e5ec1d07799de6',
  '927bb829caf39f1833e28308c515878ebdb69b83a6ad51357f9f36f2a7366fb4',
  'a862551ed5eff67cd9f63536b8397794eeedeb8cfd8e5cb75c9ee87746cf613c',
  '95e7df834b506f77817e587fe34eb928aa1ca0cd8ac3907038fc5b724b42e334',
  '624cbfa8ef131d7a5c7be83ab2e83e88590170a722acf1e3090c0d71b47a981f',
  '269be0c9c1e3ef6bb913a21280cd611759233563789a78cd1ffbfe6f1d212694',
  '99927d2610ba3924a11a4ecb7cd0367e8e395df4259aec30f56d86bb93740fe2',
  'bcfc8d595057adfc78f3c3752af207e526aad19ae6d98d567c823b391e5666de',
  '504a9616764cd63ab74e4d899c0487da685e3f680ad0e2507dd1c04951213dd4',
  'f0287df9a7efdeac5f38ed59e4383136f335bfda5abee341f9deff17688954b0',
  '4dc179f9fb40568e331ddc6dbfc7112d2dbfe2b3cb953aab1386bfe70b2b9437',
  'dcbf3d8502a06217e233905d44dfc6a2639ddfc0d6bb2c054dd7d5c3bf062718',
  '42083e2fb4155fb48677a0089ee1fcc6dbfbe73114cc391eeb85271091559ad4',
  '10534dfff350d677ec719316c949920d2494e35c5bda0eecf9e699428faec16d',
  'c1695a2c47fb1971c9d0fcb2f146ef9487dbab1ba01a51906bc39aebccd20982',
  '33f70da18562e236814e3b88b1784342a148fa8fdf3989f406d3be0190f58e09',
  '670469aa7b01ce44f55ddd65b8fb23863cafe6dc86a4077a0af80f366c642a4b',
  'ab3e60ba73bfdaed43e29a76ea7328af89b59c9ed0a685174436601d190ea57c',
]);

function canonicalUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return String(value).trim();
  }
}

export function isKnownBadTherapistImageUrl(url) {
  return KNOWN_BAD_URL_SET.has(canonicalUrl(url));
}

export function isSuspiciousTherapistImageSourceUrl(url) {
  if (!url) return true;
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url).pathname).toLowerCase();
  } catch {
    pathname = String(url).toLowerCase();
  }
  const basename = pathname.split('/').filter(Boolean).at(-1) || '';
  return (
    /(?:^|[-_.])(?:no[-_ ]?(?:image|photo)|now[-_ ]?printing|please[-_ ]?wait|placeholder|dummy|newface|coming[-_ ]?soon|spacer[0-9x]*|logo|banner|twitter|instagram|line|sns)(?:[-_.]|$)/i.test(
      basename,
    ) || /(?:写真|画像)(?:準備中|なし|無し|待ち)/.test(basename)
  );
}

export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function therapistImageRejectionReason({ sourceUrl, buffer } = {}) {
  if (isKnownBadTherapistImageUrl(sourceUrl)) return '目視確認済みの誤画像URL';
  if (isSuspiciousTherapistImageSourceUrl(sourceUrl)) return 'プレースホルダー等を示すファイル名';
  if (buffer && KNOWN_PLACEHOLDER_IMAGE_SHA256.has(sha256(buffer))) {
    return '目視確認済みの広告・ロゴ・準備中画像と同一内容';
  }
  return null;
}

export function isSuspiciousTherapistName(name) {
  const value = String(name || '').replace(/\s+/g, ' ').trim();
  if (!value) return true;
  if (/[（(]\s*[）)]$/.test(value)) return true;
  return /(?:お?写真(?:準備中|待ち|NG|ＮＧ)|即姫|割引(?:開催)?中|キャンペーン|スタッフ募集中|セラピスト募集中|求人情報|トップページ|シェアする|UI確認用|^顔面国宝|\d+分コース|\d[\d,]*円)/i.test(
    value,
  );
}

export function normalizeTherapistNameForImageComparison(name) {
  return String(name || '')
    .normalize('NFKC')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/※.*$/g, '')
    .replace(/^(?:新人割対応|新人割|新人|体験入店|《新人》|【新人】|超人気|人気|級スタイル抜群|級美女|級品|美女|美少女)+/g, '')
    .replace(/(?:セラピスト|Marvelous|マーベラス)$/gi, '')
    .replace(/[-‐‑‒–—―ー・.。\s　♡♥♦︎★☆🌟]+/g, '')
    .trim();
}

export function areTherapistNamesLikelySame(left, right) {
  const a = normalizeTherapistNameForImageComparison(left);
  const b = normalizeTherapistNameForImageComparison(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length >= 2) return longer.includes(shorter);
  return /^[一-龯]$/.test(shorter) && longer.startsWith(shorter);
}

export function findUnrelatedRepeatedTherapistImageGroups(rows) {
  const groups = new Map();
  for (const row of rows || []) {
    if (!row?.shop_id || !row?.image_url) continue;
    const key = `${row.shop_id}\u0000${canonicalUrl(row.image_url)}`;
    const group = groups.get(key) || {
      shopId: row.shop_id,
      imageUrl: canonicalUrl(row.image_url),
      rows: [],
    };
    group.rows.push(row);
    groups.set(key, group);
  }

  return [...groups.values()]
    .filter((group) => group.rows.length >= 2)
    .filter((group) => {
      const names = [...new Set(group.rows.map((row) => String(row.name || '').trim()))];
      if (names.length < 2) return false;
      const connected = new Set([0]);
      let changed = true;
      while (changed) {
        changed = false;
        for (let index = 0; index < names.length; index += 1) {
          if (connected.has(index)) continue;
          if (
            [...connected].some((known) =>
              areTherapistNamesLikelySame(names[index], names[known]),
            )
          ) {
            connected.add(index);
            changed = true;
          }
        }
      }
      return connected.size !== names.length;
    })
    .map((group) => ({
      shopId: group.shopId,
      imageUrl: group.imageUrl,
      rowCount: group.rows.length,
      names: [...new Set(group.rows.map((row) => String(row.name || '').trim()))],
    }))
    .sort((a, b) => b.names.length - a.names.length || b.rowCount - a.rowCount);
}

export function findRepeatedTherapistImageGroups(rows, minDistinctNames = 5) {
  const groups = new Map();
  for (const row of rows || []) {
    if (!row?.shop_id || !row?.image_url) continue;
    const key = `${row.shop_id}\u0000${canonicalUrl(row.image_url)}`;
    const group = groups.get(key) || {
      shopId: row.shop_id,
      imageUrl: canonicalUrl(row.image_url),
      rowCount: 0,
      names: new Set(),
    };
    group.rowCount += 1;
    group.names.add(String(row.name || '').trim());
    groups.set(key, group);
  }
  return [...groups.values()]
    .filter((group) => group.names.size >= minDistinctNames)
    .map((group) => ({
      shopId: group.shopId,
      imageUrl: group.imageUrl,
      rowCount: group.rowCount,
      distinctNames: group.names.size,
    }))
    .sort((a, b) => b.distinctNames - a.distinctNames);
}
