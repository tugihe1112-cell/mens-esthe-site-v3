import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fetchWithRetry, isTransientMonitorStatus } from '../lib/monitorFetch.mjs';
import { classifyDnsFailure, isClosureEvidence } from '../lib/dnsVerdict.mjs';
import { classifyGroup, selfTestMatching, normId } from '../lib/brandNameMatch.mjs';
import { evaluateSections, sectionsInHtml, MIN_PAGES } from '../lib/sectionPresence.mjs';
import { expectsLastmod } from '../lib/sitemapRules.mjs';
import { planReconcile, selfTestReconcile } from '../lib/rosterReconcile.mjs';

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

// ── 在籍名簿の再確認（2026-09-21）──────────────────────────────
// 毎日の監視は「180日再確認されていない在籍者」を数えるのに、**再確認を記録する経路が
// 無かった**。last_seen_at を書いていたのは新規登録スクリプトだけで、退店照合は
// is_active しか触らない。＝監視は正しく鳴るが、運用側に消す手段が無い形だった。
// 実測(2026-09-21本番): 180日超 4392/57850=7.6%（上限5%）／90日後には 99.8% が該当する。
{
  const problems = selfTestReconcile();
  assert.equal(problems.length, 0, `在籍照合の判定が壊れている: ${problems.join(' / ')}`);

  // 🚩 確認印は「名簿に名前が在った人」だけに付く。店ごと一括で配ると
  //    監視だけ緑になり、中身は何も確認されていない状態を正常として黙認することになる。
  const rows = [{ id: 1, name: 'あい', is_active: true }, { id: 2, name: 'うみ', is_active: true }];
  const plan = planReconcile({ rows, activeNames: ['あい'] });
  assert.deepEqual(plan.confirm.map((t) => t.id), [1], '名簿に無い人にも確認印を付けている');
  assert.deepEqual(plan.depart.map((t) => t.id), [2], '名簿に無い人を退店にしていない');

  // スクレイプ失敗で空リストが渡ったとき、その店の全員を退店にしない
  assert.ok(planReconcile({ rows, activeNames: [] }).refused, '空の在籍リストで全員を退店にしようとしている');
  assert.ok(planReconcile({ rows, activeNames: ['　', ''] }).refused, '空白だけの名簿を有効扱いしている');

  // 🚩 判定が正しくても、照合ツールが呼んでいなければ last_seen_at は永久に進まない。
  //    （2026-09-20 に最も高くついたのが「関数は正しいのに繋がっていない」だった）
  // ⚠️ **コメントを外してから見る。**
  //    最初の版は本文まるごとに正規表現を当てていたため、コードから 42703 を消しても
  //    **解説コメントに残った 42703 に一致して素通り**した（サボタージュ④で発覚）。
  //    lessons.md の型②「ガードが性質ではなく書き方を見ている」そのもの。
  const stripComments = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((line) => !/^\s*(\/\/|\*)/.test(line)).join('\n');
  const roster = stripComments(fs.readFileSync('scripts/maintenance/reconcile_therapists.mjs', 'utf8'));
  assert.ok(/from '\.\.\/lib\/rosterReconcile\.mjs'/.test(roster), '在籍照合ツールが判定を読み込んでいない');
  assert.ok(/planReconcile\(/.test(roster), '在籍照合ツールが判定を呼んでいない');
  assert.ok(/selfTestReconcile\(\)/.test(roster), '在籍照合ツールが判定の自己診断を呼んでいない');

  // ⚠️ ここだけは綴りを見ている（更新の中身はDBに繋がないと実行できないため）。
  //    見ているのは「in_active の値ごとに last_seen_at が付くか」という性質で、変数名ではない。
  const literals = (re) => [...roster.matchAll(re)].map((m) => m[0]);
  const confirmPatches = literals(/\{[^{}]*is_active:\s*true[^{}]*\}/g);
  const departPatches = literals(/\{[^{}]*is_active:\s*false[^{}]*\}/g);
  assert.ok(confirmPatches.length, '在籍確認の更新内容が見つからない（書き方を変えたらこの検査も直すこと）');
  assert.ok(confirmPatches.every((u) => /last_seen_at/.test(u)),
    '在籍を確認できた人に last_seen_at を記録していない（監視の180日判定が永久に進まない）');
  assert.ok(departPatches.length, '退店マークの更新内容が見つからない（書き方を変えたらこの検査も直すこと）');
  assert.ok(departPatches.every((u) => !/last_seen_at/.test(u)),
    '退店マークに last_seen_at を付けている（確認していない人に確認印が付く）');

  // 書き換える前にバックアップを書くこと（2026-08-20、バックアップを後回しにしてDBを112件壊した）。
  //    順序まで見る: 最初の書き換え呼び出しより前に writeFileSync があること。
  const firstWrite = roster.indexOf('await updateInChunks(');
  const backupAt = roster.indexOf('writeFileSync(');
  assert.ok(firstWrite > 0, '在籍照合ツールの書き換え呼び出しが見つからない（書き方を変えたらこの検査も直すこと）');
  assert.ok(backupAt > 0 && backupAt < firstWrite, '在籍照合ツールが書き換えの前にバックアップを書いていない');

  // 退店日は分からない（照合した日は退店日ではない）。オーナー「退店日なんてわからないでしょ」。
  // 分かっているのは last_seen_at（最後に在籍を確認した日）だけで、それは既に持っている。
  assert.ok(!/departed_at/.test(roster),
    '在籍照合ツールが departed_at を書いている（照合した日は退店日ではない。数か月ずれた日付になる）');
}

// ── 名簿の鮮度を画像監視から分けたこと（2026-09-21）────────────────
// 「180日超未確認」を画像監視（毎日）の中に置いていたため、名簿を取り直すまで毎日赤になり、
// **本当に画像が壊れても同じ失敗メールで見分けがつかなかった**（通知はゴミ箱に溜まっていた）。
// 分けた形を守る。どちらの基準も緩めていないことも見る。
{
  const yamlCode = (path) => (fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '')
    .split('\n').map((line) => line.replace(/(^|\s)#.*$/, '')).join('\n');
  const image = yamlCode('.github/workflows/image-health.yml');
  const roster = yamlCode('.github/workflows/roster-freshness.yml');

  // ⚠️ 値は**完全一致**で見る。`\b` だと `--checks=integrity,staleness` が通ってしまう（書いた直後に気づいた）。
  assert.ok(/check_data_freshness\.mjs\s+--checks=integrity(?=\s|$)/m.test(image),
    '画像監視が毎日のデータ検査（公式URL・最終確認日なし・店の混入）を走らせていない');
  assert.ok(!/check_data_freshness\.mjs(?!\s+--checks=integrity(?=\s|$))/m.test(image),
    '画像監視が名簿の鮮度まで走らせている（--checks 無し＝全部）。名簿の赤で画像の赤が見えなくなる');
  assert.ok(/SHOP_WEBSITE_MISSING_MAX_PCT:\s*'1'/.test(image), '公式URLなしの上限（1%）が変わっている');

  assert.ok(roster, '名簿の鮮度の監視（roster-freshness.yml）が無い＝180日超未確認を誰も見ていない');
  assert.ok(/schedule:\s*\n\s*-\s*cron:/.test(roster), '名簿の鮮度の監視に定時実行が無い');
  assert.ok(/check_data_freshness\.mjs\s+--checks=staleness(?=\s|$)/m.test(roster), '名簿の鮮度の監視が 180日超の判定を走らせていない');
  assert.ok(/THERAPIST_STALE_180_MAX_PCT:\s*'5'/.test(roster),
    '180日超未確認の上限（5%）が変わっている。閾値を上げて緑にしないこと');

  // 知らない指定はその場で止まること（指定したつもりの検査が黙って走らない、を防ぐ）。
  // 認証情報より前に判定するので、CI（.envなし）でも同じ結果になる。
  for (const bad of ['--checks=bogus', '--check=integrity', '--checks=']) {
    // ⚠️ .env の無い場所から走らせる。手元（.envあり）だと、認証を先に見る実装に戻しても通ってしまう。
    const r = spawnSync(process.execPath, [path.resolve('scripts/monitoring/check_data_freshness.mjs'), bad], {
      encoding: 'utf8', timeout: 20000, cwd: os.tmpdir(),
      env: { ...process.env, VITE_SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' },
    });
    assert.equal(r.status, 1, `check_data_freshness.mjs が不正な指定 ${bad} で止まらない`);
    assert.ok(/不正|知らない引数/.test(r.stderr || ''), `check_data_freshness.mjs が不正な指定 ${bad} を認証エラーと区別できていない`);
  }
}

// ⚠️ 合格の表示はファイルの**一番最後**に置く。途中に置くと、後ろに足した検査が落ちても
//    先に「OK」が出てしまう（2026-09-16、実際にそうなっていた）。
console.log('✅ 外形監視の再試行・恒久障害判定チェック OK');
