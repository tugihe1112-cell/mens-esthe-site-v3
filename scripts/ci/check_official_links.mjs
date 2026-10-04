/**
 * 口コミを全文読める場所から、公式サイト（出勤・予約）へ行けること（2026-10-05）。
 *
 * 【なぜ】 okabayashi「この口コミに店舗のリンクとセラピストのリンクがない…店のね公式の／セラピストページを押した後も同じ／
 *   お客さんの動線を考えたらこんなミスは起きないはず」。口コミを読んで会いたくなった人の次の行動は公式で出勤を見て
 *   予約すること。なのに、ホームの口コミ（開いた中）とセラピストのページから公式サイトへ行く道が1本も無かった。
 *   どのガードもビルドも、この「道が無い」ことは見ていなかった。
 * 【見ること】
 *   1. 行き先の決め方（utils/officialLinks.js）の自己診断（公式の外・在籍一覧にない人・javascript: を通さない）
 *   2. ホームの口コミ（開いた中）とセラピストのページ（上と読み終えた位置の2か所）が OfficialLinks を描くこと
 *   3. その材料（公式サイト・出勤表・公式の在籍一覧・公式プロフィール）を SSR が取って渡していること
 *      ＝「部品はあるのに材料が props で落ちて何も出ない」（2026-09-20 の店舗情報と同じ型）を止める
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selfTestOfficialLinks, officialLinksFor } from '../../src/utils/officialLinks.js';

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const read = (p) => strip(fs.readFileSync(p, 'utf8'));

const problems = selfTestOfficialLinks();
assert.deepEqual(problems, [], `公式サイトへの行き先の決め方が壊れています: ${problems.join(' / ')}`);

// 通し: SSRの店舗の形（website_url/schedule_url/rosterUrl）とDBのセラピストの行（raw_data.profileUrl）で、公式プロフィールと出勤表が出る
{
  const r = officialLinksFor({
    shop: { id: 's', website_url: 'https://qa-spa.com/', schedule_url: 'https://qa-spa.com/schedule', rosterUrl: 'https://qa-spa.com/cast/' },
    therapist: { id: 't', raw_data: { profileUrl: 'https://qa-spa.com/cast/12' } },
  });
  assert.equal(r.primary?.kind, 'therapist_profile');
  assert.equal(r.schedule?.kind, 'schedule');
}

const card = read('src/components/HomeReviewCard.jsx');
const expanded = card.slice(card.indexOf('function ExpandedBody'), card.indexOf('export default function HomeReviewCard'));
assert.match(expanded, /<OfficialLinks[\s\S]*?shopWebsiteUrl[\s\S]*?shopScheduleUrl[\s\S]*?shopRosterUrl[\s\S]*?profileUrl/, 'ホームの口コミ（開いた中）が公式サイトへの道（OfficialLinks）を描いていません');
assert.match(expanded, /to=\{reviewLink\}/, 'ホームの口コミ（開いた中）にセラピストのページへのリンクがありません');
assert.match(expanded, /to=\{shopLink\}/, 'ホームの口コミ（開いた中）にお店のページへのリンクがありません');
// 本文の読み込みに失敗しても道は出す（OfficialLinks が ok の分岐の中に入っていない）
{
  const i = expanded.indexOf("state.status === 'ok' && (");
  assert.ok(i >= 0, 'ホームの口コミ（開いた中）の本文の分岐が見つかりません（このガードを実装に合わせて直してください）');
  const okBlock = expanded.slice(i, expanded.indexOf(')}', i));
  assert.ok(!okBlock.includes('<OfficialLinks'), '公式サイトへの道を、本文の読み込みが成功したときだけにしないでください');
}

const home = read('server/homeReviews.js');
for (const col of ['website_url', 'schedule_url', 'roster_url:raw_data->>rosterUrl', 'group_id']) {
  assert.ok(home.includes(col), `ホームの口コミの店舗の取得に ${col} がありません`);
}
assert.ok(home.includes('profile_url:raw_data->>profileUrl'), 'ホームの口コミのセラピストの取得に公式プロフィールがありません');
for (const k of ['shopWebsiteUrl:', 'shopScheduleUrl:', 'shopRosterUrl:', 'profileUrl:', 'groupId:']) {
  assert.ok(home.includes(k), `ホームの口コミの props に ${k} がありません`);
}

const thread = read('src/pages/ThreadDetailPage.jsx');
assert.ok((thread.match(/<OfficialLinks/g) || []).length >= 2, 'セラピストのページは、上と読み終えた位置の2か所に公式サイトへの道を出してください');
const ssr = read('pages/shops/[shopId]/threads/[threadId].jsx');
assert.match(ssr, /from\('shops'\)\s*\.select\('[^']*schedule_url[^']*'\)/, 'セラピストのページのSSRが出勤表（schedule_url）を取っていません');
assert.match(ssr, /schedule_url:\s*shopData\.schedule_url/, 'セラピストのページのSSRが出勤表を props に載せていません');
assert.match(ssr, /rosterUrl:\s*shopData\.raw_data\?\.rosterUrl/, 'セラピストのページのSSRが公式の在籍一覧を props に載せていません');

const comp = read('src/components/OfficialLinks.jsx');
assert.ok((comp.match(/target="_blank"/g) || []).length === (comp.match(/rel="noopener noreferrer"/g) || []).length, '新しいタブで開くリンクに rel="noopener noreferrer" を付けてください');
assert.ok(comp.includes("trackEvent('click_outbound'"), '公式サイトへのリンクを click_outbound で数えてください');

console.log('✅ 口コミから公式サイト（出勤・予約）へ行ける（ホームの口コミ・セラピストのページ）');
