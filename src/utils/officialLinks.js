/**
 * 公式サイトへの行き先を1か所で決める（2026-10-05）
 *
 * 【なぜ】 okabayashi「この口コミに店舗のリンクとセラピストのリンクがない…店のね公式の／セラピストページを押した後も
 *   同じ／お客さんの動線を考えたらこんなミスは起きないはず」。口コミを読んで「この人に入りたい」と思った人の次の行動は、
 *   公式サイトで出勤を見て予約すること。それなのに、口コミを全文読める場所（ホームの口コミ・セラピストのページ）から
 *   公式サイトへ行く道が1本も無かった（公式への道は店舗ページの奥と検索の店舗カードにしか無かった）。
 *
 * 行き先の順: その人の公式プロフィール → 公式サイトの在籍一覧 → 店の公式サイト。出勤表は別に出す。
 * ⚠️ 公式サイトと同じホスト（またはそのサブドメイン）のURLだけ使う。SNS・ポータル・同じ貸しサーバーの別の店へは送らない。
 *    http/https 以外（javascript: など）は使わない。
 * ⚠️ 在籍一覧にない人（notListed）の公式プロフィールは出さない。もう無いページや、別の人に変わったページへ送らない。
 * ⚠️ 店舗の形は2通りある（DBの行＝website_url/schedule_url/raw_data、整形済み＝websiteUrl/scheduleUrl/rosterUrl）。両方読む。
 */

function hostOf(u) {
  try {
    const x = new URL(u);
    if (x.protocol !== 'http:' && x.protocol !== 'https:') return null;
    return x.hostname.toLowerCase().replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

/** http/https の URL だけ通す（前後の空白は外す） */
export function safeHttpUrl(u) {
  if (typeof u !== 'string') return null;
  const t = u.trim();
  return hostOf(t) ? t : null;
}

/** 同じ公式サイトか（同じホスト、またはどちらかがもう一方のサブドメイン） */
export function sameOfficialSite(a, b) {
  const ha = hostOf(a); const hb = hostOf(b);
  if (!ha || !hb) return false;
  return ha === hb || ha.endsWith(`.${hb}`) || hb.endsWith(`.${ha}`);
}

const pick = (...xs) => xs.find((x) => typeof x === 'string' && x.trim()) || null;

/**
 * @returns {{ primary: {kind,href}|null, schedule: {kind,href}|null, website: {kind,href}|null }}
 *   primary  … いちばん先に出す行き先（therapist_profile / roster / official）
 *   schedule … 出勤表（primary と同じURLなら出さない）
 *   website  … primary が店の公式サイトでないときの、店の公式サイト（トップ）
 */
export function officialLinksFor({ shop, therapist, notListed = false } = {}) {
  const website = safeHttpUrl(pick(shop?.website_url, shop?.websiteUrl, shop?.raw_data?.websiteUrl));
  const schedule = safeHttpUrl(pick(shop?.schedule_url, shop?.scheduleUrl));
  const roster = safeHttpUrl(pick(shop?.rosterUrl, shop?.raw_data?.rosterUrl));
  const profile = safeHttpUrl(pick(therapist?.profileUrl, therapist?.raw_data?.profileUrl));
  const onSite = (u) => !!u && !!website && sameOfficialSite(u, website);

  let primary = null;
  if (!notListed && onSite(profile)) primary = { kind: 'therapist_profile', href: profile };
  else if (onSite(roster) && roster !== website) primary = { kind: 'roster', href: roster };
  else if (website) primary = { kind: 'official', href: website };

  return {
    primary,
    schedule: schedule && schedule !== primary?.href ? { kind: 'schedule', href: schedule } : null,
    website: primary && primary.kind !== 'official' && website ? { kind: 'official', href: website } : null,
  };
}

/** 自己診断（実際に起きる形だけ）。壊れていたら問題の一覧を返す */
export function selfTestOfficialLinks() {
  const problems = [];
  const eq = (label, got, want) => { if (got !== want) problems.push(`${label}: ${got} ≠ ${want}`); };
  const shop = { website_url: 'https://www.example-spa.com/', schedule_url: 'https://example-spa.com/schedule/', raw_data: { rosterUrl: 'https://example-spa.com/cast/' } };
  // 1. 公式プロフィールがあればそれ
  let r = officialLinksFor({ shop, therapist: { raw_data: { profileUrl: 'https://example-spa.com/profile?id=12' } } });
  eq('profile', r.primary?.kind, 'therapist_profile'); eq('profile+schedule', r.schedule?.kind, 'schedule'); eq('profile+website', r.website?.kind, 'official');
  // 2. 在籍一覧にない人はプロフィールへ送らない
  r = officialLinksFor({ shop, therapist: { raw_data: { profileUrl: 'https://example-spa.com/profile?id=12' } }, notListed: true });
  eq('notListed', r.primary?.kind, 'roster');
  // 3. 公式サイトの外（ポータル・SNS）は使わない
  r = officialLinksFor({ shop, therapist: { profileUrl: 'https://estama.jp/shop/1/cast/2' } });
  eq('portal', r.primary?.kind, 'roster');
  // 4. 同じ貸しサーバーの別の店へは送らない（aroma-terrace.men-este.com と fairy.men-este.com）
  r = officialLinksFor({ shop: { website_url: 'https://aroma-terrace.men-este.com/' }, therapist: { profileUrl: 'https://fairy.men-este.com/cast/1' } });
  eq('shared host', r.primary?.kind, 'official');
  // 5. サブドメインのルーム（a.senju-lamp.com と senju-lamp.com）は同じ公式
  eq('subdomain', sameOfficialSite('https://a.senju-lamp.com/cast/1', 'http://senju-lamp.com/'), true);
  // 6. javascript: は通さない
  r = officialLinksFor({ shop: { website_url: 'javascript:alert(1)' } });
  eq('javascript', r.primary, null);
  // 7. 何も無ければ公式サイト（整形済みの形も読む）
  r = officialLinksFor({ shop: { websiteUrl: 'https://x-spa.jp/', scheduleUrl: 'https://x-spa.jp/' } });
  eq('website only', r.primary?.kind, 'official'); eq('same schedule', r.schedule, null); eq('no dup website', r.website, null);
  return problems;
}
