import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fetchWithRetry, isTransientMonitorStatus } from '../lib/monitorFetch.mjs';
import { classifyDnsFailure, isClosureEvidence } from '../lib/dnsVerdict.mjs';
import { classifyGroup, selfTestMatching, normId } from '../lib/brandNameMatch.mjs';
import { evaluateSections, sectionsInHtml, MIN_PAGES } from '../lib/sectionPresence.mjs';
import { expectsLastmod } from '../lib/sitemapRules.mjs';

const noWait = async () => {};
const response = (status, contentType = 'text/plain') => new Response('', {
  status,
  headers: { 'content-type': contentType },
});

async function sequenceFetch(sequence) {
  let calls = 0;
  const fetchImpl = async () => {
    const value = sequence[Math.min(calls, sequence.length - 1)];
    calls += 1;
    if (value instanceof Error) throw value;
    return value;
  };
  const run = (options = {}) => fetchWithRetry('https://monitor.test/resource', {}, {
    attempts: 3,
    delaysMs: [0, 0],
    sleepImpl: noWait,
    fetchImpl,
    ...options,
  });
  return { run, calls: () => calls };
}

assert.equal(isTransientMonitorStatus(408), true);
assert.equal(isTransientMonitorStatus(429), true);
assert.equal(isTransientMonitorStatus(503), true);
assert.equal(isTransientMonitorStatus(404), false);

{
  const test = await sequenceFetch([response(503), response(503), response(200)]);
  assert.equal((await test.run()).status, 200);
  assert.equal(test.calls(), 3, '一時的な5xxは3回まで再試行する');
}

{
  const test = await sequenceFetch([new TypeError('socket closed'), new TypeError('DNS'), response(200)]);
  assert.equal((await test.run()).status, 200);
  assert.equal(test.calls(), 3, 'ネットワーク例外も再試行する');
}

{
  const test = await sequenceFetch([response(404)]);
  assert.equal((await test.run()).status, 404);
  assert.equal(test.calls(), 1, '通常ページの恒久4xxを再試行で隠さない');
}

{
  const test = await sequenceFetch([response(404), response(404), response(404)]);
  assert.equal((await test.run({ retryStatuses: [404] })).status, 404);
  assert.equal(test.calls(), 3, 'chunkの404はデプロイ境界を考慮して確認し直す');
}

{
  const test = await sequenceFetch([response(500), response(500), response(500)]);
  assert.equal((await test.run()).status, 500);
  assert.equal(test.calls(), 3, '恒久5xxは3回確認後も失敗として返す');
}

// ── 名前解決の失敗をどう読むか（2026-09-15）──────────────────────────
// 🚩 閉店の判断は名前解決だけを根拠にする決まり。だがその実装がエラーの種類を見ておらず、
//    引けなければ全部「ドメイン消滅」にしていた＝回線が細い環境では営業中の店が閉店候補に出る。
//    実際 bellrose-osaka.com / wife-room.com が ETIMEOUT で消滅扱いになっていた。
{
  assert.equal(classifyDnsFailure('ENOTFOUND'), 'domain_gone',
    'NXDOMAIN（登録されていない）はドメイン消滅と判定する');

  // ⭐ ここが本体。「引けなかった」を「無い」と読まないこと。
  for (const code of ['ETIMEOUT', 'ESERVFAIL', 'EAI_AGAIN', 'ECONNREFUSED', 'UNKNOWN', undefined, '']) {
    assert.equal(classifyDnsFailure(code), 'dns_unresolved',
      `${code} は「調べられなかった」であって「ドメインが無い」ではない`);
    assert.equal(isClosureEvidence(classifyDnsFailure(code)), false,
      `${code} を閉店の根拠にしてはいけない（2026-09-13「応答しない≠店が無い」と同じ誤り）`);
  }

  assert.equal(isClosureEvidence('domain_gone'), true, 'NXDOMAINだけが閉店の根拠になる');
  assert.equal(isClosureEvidence('no_a_record'), false, 'Aレコードが無いだけでは閉店の根拠にならない');
  assert.equal(isClosureEvidence('alive'), false, '生きているドメインは当然根拠にならない');
}


// ── ブランドのまとまり判定（2026-09-16）────────────────────────────
// `group_id=other` のせいで無関係な店が1ブランドに混ざり、
// /brands/other が「THE HALF ／ セラピスト229名」になっていた。
// 毎日の監視(check_data_freshness)と洗い出し(inspect_group_id_mixups)が
// **同じ判定**を使う。ここが緩むと両方が同時に緩むので、境目を固定する。
{
  assert.deepEqual(selfTestMatching(), [], '突き合わせ方の自己診断が失敗している');

  // 🚩 括弧の中を落とすと落ちるケース。英字と仮名が括弧の内と外で入れ替わる書き方。
  assert.equal(classifyGroup({ gid: 'g_brand_dejavu_tokyo', rooms: [
    { id: 'tokyo_setagaya_sangenjaya_dejavu_tokyo', name: 'Dejavu TOKYO (デジャヴ東京) 三軒茶屋店' },
    { id: 'tokyo_minato_nishiazabu_dejavu_tokyo', name: 'デジャヴ東京 (Dejavu TOKYO)' },
  ] }).verdict, 'ok', '同一ブランドを無関係と誤検知している（括弧の中を落としていないか）');

  // 🚩 idの県を落とさないと `tokyo_` で一致して mixed を見逃す。
  assert.equal(classifyGroup({ gid: 'other', rooms: [
    { id: 'tokyo_shinagawa_gotanda_the_half', name: 'THE HALF' },
    { id: 'tokyo_candy_spa', name: 'キャンディスパ' },
  ] }).verdict, 'mixed', '無関係な店の混入を見逃している');
  assert.equal(normId('tokyo_candy_spa'), 'candy_spa', 'idの先頭の都道府県を落としていない');

  // 名前が違ってもidが揃っていれば改名の疑い。混入として毎日赤くはしない。
  assert.equal(classifyGroup({ gid: 'g_brand_jesse', rooms: [
    { id: 'tokyo_chofu_jesse', name: 'Jesse (ジェシー 調布店)' },
    { id: 'kanagawa_kawasaki_noborito_jesse', name: 'Tigger (ティガー 登戸店)' },
  ] }).verdict, 'renamed', '改名の疑いを混入と混同している');

  // 置き場所の無い値は、名前が似ていても混入として出す。
  assert.equal(classifyGroup({ gid: 'unknown', rooms: [
    { id: 'tokyo_a_spa', name: 'SPA' }, { id: 'osaka_b_spa', name: 'SPA' },
  ] }).verdict, 'mixed', '置き場所の無い group_id を素通りさせている');

  // 1ルームだけのブランドは対象外（単独店を毎日赤くしない）。
  assert.equal(classifyGroup({ gid: 'g_solo_x', rooms: [{ id: 'tokyo_x', name: 'X' }] }).verdict, 'ok',
    '単独店を混入として扱っている');
}

// ── 節が在るか（2026-09-20）────────────────────────────────────────
// ブランドページの「店舗情報」が本番で一度も出ていなかった。条件付きの節は壊れても
// 例外を出さず**何も出さずに消える**ので、200のまま画面は正常に見える。
// ⚠️ 守りたいのは2つで、**両方とも外せない**。
//    (a) 全枚で欠けたら落とす＝実装の事故は全ページで同時に起きる
//    (b) 1枚欠けでは落とさない＝データの都合で欠ける1枚を毎日赤くしない
//        （2026-09-04、古い期待値で1日96通のメールが飛んだ。赤が信用されなくなるほうが高くつく）
{
  const brand = (n, has) => Array.from({ length: n }, (_, i) => ({ path: `/brands/g${i}`, sections: new Set(has) }));
  const all = ['在籍セラピスト', 'ルーム', 'タグで絞り込む', '店舗情報'];

  const gone = evaluateSections(brand(5, ['在籍セラピスト', 'ルーム', 'タグで絞り込む']));
  assert.equal(gone.failures.length, 1, '全枚で節が消えているのに落ちていない');
  assert.ok(gone.failures[0].includes('店舗情報'), '落ちた理由に節の名前が出ていない');

  const one = brand(5, all);
  one[0].sections = new Set(['在籍セラピスト', 'ルーム', 'タグで絞り込む']);
  const partial = evaluateSections(one);
  assert.equal(partial.failures.length, 0, '1枚欠けで落ちている（監視が信用されなくなる）');
  // ⚠️ 警告は2種類（母数不足／欠けの割合）。1枚欠けで出てはいけないのは後者。
  assert.equal(partial.warnings.filter((w) => w.includes('枚にしかない')).length, 0, '1枚欠けで警告が出ている');
  // 🚩 母数不足は**黙ってスキップしない**。見張れていないこと自体を言う。
  const thin = evaluateSections(brand(MIN_PAGES - 1, []));
  assert.equal(thin.failures.length, 0, '母数不足で落としている');
  assert.ok(thin.warnings.some((w) => w.includes('見張れていない')), '母数不足を黙ってスキップしている');
  assert.equal(thin.counts['ブランドページ'], MIN_PAGES - 1, '内訳（枚数）を返していない');

  assert.equal(evaluateSections([]).failures.length, 0, '空配列で落ちている');
  assert.equal(evaluateSections(null).failures.length, 0, 'nullで落ちている');

  // 綴りではなく見出しで見る（本文の「ルームにより異なります」に当てない）
  assert.ok(!sectionsInHtml('/brands/x', '<p>ルームにより異なります</p>').has('ルーム'),
    '本文の「ルームにより異なります」を節と誤認している');
  assert.ok(sectionsInHtml('/brands/x', '<h2 class="a">ルーム</h2>').has('ルーム'),
    '見出しの「ルーム」を見つけられない');
  assert.equal(sectionsInHtml('/area/tokyo', '在籍セラピスト'), null, '対象外のパスを判定している');

  // ── サイトマップの lastmod（2026-09-20）──────────────────────────
  // ⚠️ D-014でブランドページが「口コミを持つページ」になったのに、監視だけ古い形のままで、
  //    **正しいサイトマップを毎回「根拠のないlastmod」と言い続けていた**。
  //    2026-09-04の「1日96通」と同じ型＝サイトは正常、監視だけが古い。
  assert.ok(expectsLastmod('/brands/g_brand_the_half'), 'ブランドページのlastmodを根拠なしと誤判定する');
  assert.ok(expectsLastmod('/shops/tokyo_x'), '店舗ページのlastmodを根拠なしと誤判定する');
  assert.ok(expectsLastmod('/shops/tokyo_x/threads/tokyo_x_あい'), '人物ページのlastmodを根拠なしと誤判定する');
  assert.ok(!expectsLastmod('/area/tokyo'), 'エリアページにlastmodを許している（更新日の根拠が無い）');
  assert.ok(!expectsLastmod('/'), 'トップにlastmodを許している');
  assert.ok(!expectsLastmod(null), 'nullで落ちる／許している');

  // 🚩 判定が正しくても、**監視が呼んでいなければ意味がない**。配線まで見る。
  //    （今日いちばん高くついたのが「関数は正しいのに繋がっていない」だった）
  const src = fs.readFileSync('scripts/monitoring/check_site_integrity.mjs', 'utf8');
  assert.ok(/sectionsInHtml\(/.test(src), '外形監視が節の在り方を拾っていない');
  assert.ok(/evaluateSections\(/.test(src), '外形監視が節の判定を呼んでいない');
  assert.ok(/selfTestSectionPresence\(\)/.test(src), '外形監視が判定の自己診断を呼んでいない');
}

// ⚠️ 合格の表示はファイルの**一番最後**に置く。途中に置くと、後ろに足した検査が落ちても
//    先に「OK」が出てしまう（2026-09-16、実際にそうなっていた）。
console.log('✅ 外形監視の再試行・恒久障害判定チェック OK');
