/**
 * check_ssr_helpers.mjs — SSRで実際に呼ばれる純粋関数を「実行して」検証する
 *
 * 【なぜ必要か（2026-08-22 に本番を落とした）】
 * `heroShops.js` で `export { shapeShopRow } from '../utils/shopFields'` と書いた。
 * これは**ローカル束縛を作らない**再エクスポートなので、同じファイル内の
 * `buildInitialHero()` から `shapeShopRow` を参照できず ReferenceError になる。
 * ところが **`npm run build` は通ってしまった**。理由は
 *   - 型エラーでも構文エラーでもない「実行時エラー」であること
 *   - ホームは `ƒ`（リクエスト時SSR）なのでビルド中に一度も実行されないこと
 * の2点。結果、ビルド成功→デプロイ→**本番500**という最悪の経路を通った。
 *
 * 【この検査の役割】
 * ビルドの前に、SSRが依存する関数を**実際に呼ぶ**。
 * 「ビルドが通る」と「動く」は別物なので、動くことを機械で確かめる。
 *
 * ⚠️ Node は拡張子なしの import を解決できない（webpack/Next は解決できる）。
 *    そのため import 指定子に拡張子を補ってから読み込む。
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

const ROOT = process.cwd();
const failures = [];

/** src配下のモジュールを、拡張子なしimportを解決できる形にしてから読み込む */
async function loadModule(relPath, seen = new Map()) {
  const abs = path.resolve(ROOT, relPath);
  if (seen.has(abs)) return seen.get(abs);
  const src = fs.readFileSync(abs, 'utf-8');
  const patched = src.replace(
    /(from\s*['"])(\.[^'"]+)(['"])/g,
    (m, a, spec, c) => {
      const target = path.resolve(path.dirname(abs), spec);
      for (const ext of ['', '.js', '.jsx', '.mjs', '/index.js']) {
        if (fs.existsSync(target + ext) && fs.statSync(target + ext).isFile()) {
          return a + pathToFileURL(target + ext).href + c;
        }
      }
      return m;
    },
  );
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ssrcheck-')), path.basename(abs).replace(/\.jsx?$/, '.mjs'));
  fs.writeFileSync(tmp, patched);
  const mod = await import(pathToFileURL(tmp).href);
  seen.set(abs, mod);
  return mod;
}

const check = (name, fn) => {
  try {
    const msg = fn();
    if (msg) failures.push(`${name}: ${msg}`);
  } catch (e) {
    failures.push(`${name}: ${e && e.message ? e.message : e}`);
  }
};

// ── ホームSSR（pages/index.jsx）が呼ぶヒーロー生成 ─────────────────────
{
  const hero = await loadModule('src/data/heroShops.js');
  const rows = hero.HERO_SHOP_IDS.map((id, i) => ({
    id, group_id: 'g' + i, name: '店' + i, image_url: 'https://example.test/' + i + '.jpg',
    website_url: 'https://example.test', schedule_url: 'https://example.test/s',
    phone_number: '03-0000-0000', business_hours: '10:00-24:00', price_system: { 60: 14000 },
    raw_data: { address: '東京都港区', city: '麻布十番', area: '麻布十番', prefecture: '東京都', rating: 4.7, reviewCount: 0 },
  }));

  check('buildInitialHero が実行できる', () => {
    const out = hero.buildInitialHero(rows);
    if (!Array.isArray(out)) return '配列を返していない';
    if (out.length !== rows.length) return `${rows.length}件渡して${out.length}件しか返らない`;
    return null;
  });

  check('buildInitialHero は空入力でも落ちない', () => {
    hero.buildInitialHero(undefined);
    hero.buildInitialHero([]);
    return null;
  });

  check('shapeShopRow が heroShops から呼べる（再エクスポートの束縛切れ検出）', () => {
    if (typeof hero.shapeShopRow !== 'function') return '関数として取り出せない';
    const s = hero.shapeShopRow(rows[0]);
    if (s.address !== '東京都港区') return 'raw_data が展開されていない';
    if (s.business_hours !== '10:00-24:00') return 'テーブル列が落ちている';
    // D-010: 収集元サイトの評価は構造的に落とす
    if (s.rating !== undefined) return `rating が残っている（${s.rating}）＝収集元の★が表示される`;
    if (s.reviewCount !== undefined) return 'reviewCount が残っている';
    return null;
  });
}

// ── 欠損フィールドの表示ヘルパ（D-009） ────────────────────────────────
{
  const f = await loadModule('src/utils/shopFields.js');
  check('joinFields は全部空なら空文字', () => (f.joinFields(undefined, null, '  ') === '' ? null : '空にならない'));
  check('joinFields は同値を畳む', () => (f.joinFields('埼玉県', '埼玉県') === '埼玉県' ? null : '重複が残る'));
  check('joinFields は市区の接尾辞違いを畳む', () =>
    (f.joinFields('大阪市', '大阪') === '大阪市' && f.joinFields('相模原', '相模原市') === '相模原市'
      ? null : '「大阪市 大阪」型の冗長表示が残る'));
  // ⚠️ ここが緩むと別地名を誤って1つに潰す。実データに324店ぶん存在する組み合わせ。
  check('joinFields は別地名を畳まない（船橋/西船橋・川崎/武蔵小杉）', () =>
    (f.joinFields('船橋', '西船橋') === '船橋 西船橋' && f.joinFields('川崎', '武蔵小杉') === '川崎 武蔵小杉'
      ? null : '別の地名を誤って畳んでいる'));
  check("joinFields は文字列'undefined'を捨てる", () => (f.joinFields('undefined') === '' ? null : 'ゴミが残る'));
  check('shopLocationText は住所を優先', () =>
    (f.shopLocationText({ address: '東京都渋谷区1-1', prefecture: '東京都' }) === '東京都渋谷区1-1' ? null : '住所が優先されない'));
  check('shopLocationText は住所が無ければ県市にフォールバック', () =>
    (f.shopLocationText({ raw_data: { prefecture: '栃木県', city: '宇都宮' } }) === '栃木県 宇都宮' ? null : 'フォールバックしない'));
  check('shopLocationText は全部無ければ空', () =>
    (f.shopLocationText({ raw_data: {} }) === '' ? null : '空にならない'));
}

// ── URLクエリ更新（無限ループ再発防止） ────────────────────────────────
// 【事故】2026-08-22、/search?shopId=... で画面がチカチカした。
//   useSearchParams が毎レンダーで setParams を作り直し、かつオブジェクト引数を無視して
//   **同じURLへ router.replace を呼び続けて**いた。実測で3秒間に400回。
{
  const r = await loadModule('src/compat/queryString.js');
  const b = r.buildNextQueryString;

  // ── 静的最適化ページでクエリが読めない問題（2026-09-07 / 本番実測）─────────
  // 【事故】`/login` `/register` `/auth/*` は `○ Static` でビルドされるため、
  //   クライアントでも router.asPath が `/login` のままでクエリが載らない。
  //   実測: `/login?redirect=%2Fshops%2F...` を開いて4秒後も、描画された
  //   「新規登録」リンクは `/register`（redirect無し）だった。
  //   ＝ 認証をまたいだ戻り先がページに届いていなかった。
  //   `/login?redirect=/admin?review=...`（新着口コミメール導線）も同じ経路。
  const rq = r.resolveQueryString;
  check('⭐asPathにクエリが無ければ実URLで補う（静的ページの戻り先が届く）', () =>
    (rq('', '?redirect=%2Fshops%2Fa') === 'redirect=%2Fshops%2Fa' ? null : '静的ページで戻り先が読めない'));
  check('⭐asPathにクエリがあれば実URLを見ない（動的ページの挙動を変えない）', () =>
    (rq('shop=Silk', '?shop=Other') === 'shop=Silk' ? null : '動的ページのクエリを上書きしている（ループ再発の恐れ）'));
  check('先頭の ? を二重に付けない', () =>
    (rq('', 'redirect=%2Fx') === 'redirect=%2Fx' ? null : '? の扱いが不正'));
  check('どちらも空なら空', () =>
    (rq('', '') === '' && rq('', undefined) === '' ? null : '空の扱いが不正'));

  check('オブジェクト形式が反映される（無視されていた元バグ）', () => {
    const out = b('', { shop: 'Silk' });
    return out === 'shop=Silk' ? null : `反映されない（${out}）`;
  });

  check('⭐変化が無ければ null（=replaceしない。ループの最後の砦）', () => {
    const out = b('shop=Silk', { shop: 'Silk' });
    return out === null ? null : `null を返さない（${out}）＝無限ループする`;
  });

  check('⭐エンコード揺れ(%20 vs +)でも「同じ」と判定できる', () => {
    // 空白は `+` と `%20` のどちらでも来る。URLSearchParams は `+` で出力するので、
    // 生の文字列比較のままだと `%20` で来た瞬間に毎回「違う」と判定してループする。
    // ⚠️ ここは実際に無限ループの分かれ目。緩めないこと。
    const a = b('shop=Silk%20Spa', { shop: 'Silk Spa' });
    const c = b('shop=Silk+Spa', { shop: 'Silk Spa' });
    if (a !== null) return `%20 で差分と誤判定した（${a}）`;
    if (c !== null) return `+ で差分と誤判定した（${c}）`;
    return null;
  });

  check('日本語を含んでも同じと判定できる', () => {
    const qs = new URLSearchParams({ shop: 'Silk (シルク)' }).toString();
    return b(qs, { shop: 'Silk (シルク)' }) === null ? null : '日本語で差分と誤判定した';
  });

  // /search?shopId=... の解決フロー。ここが崩れると
  // 「ループは止まったが絞り込みが効かない」状態になる（2026-08-22に実際に発生）
  check('shopId解決前: 同じshopIdを書き戻すだけなら replace しない', () => {
    const out = b('shopId=tokyo_shibuya_silk', { shopId: 'tokyo_shibuya_silk' });
    return out === null ? null : `不要なreplaceが走る（${out}）`;
  });

  check('shopId解決後: 店名クエリへ置き換わる', () => {
    const out = b('shopId=tokyo_shibuya_silk', { shop: 'Silk' });
    return out === 'shop=Silk' ? null : `変更が反映されない（${out}）`;
  });

  check('空・undefined・null の値は落とす', () => {
    const out = b('', { shop: 'Silk', cast: '', tags: undefined, x: null });
    return out === 'shop=Silk' ? null : `空値が残る（${out}）`;
  });

  check('関数形式でも動く（react-router互換）', () => {
    const out = b('a=1', (p) => { p.set('a', '2'); });
    return out === 'a=2' ? null : `関数形式が壊れている（${out}）`;
  });

  check('全部消したら空文字を返す（nullではない）', () => {
    const out = b('a=1', {});
    return out === '' ? null : `空クエリにできない（${out}）`;
  });
}

// ── 店舗ファジー検索（「セルで検索しても出てこない」の再発防止） ──────────
// 【不具合】2026-08-22、「メンズエステ セル〜Selu〜」を「セル」で検索すると0件だった。
//   語境界の判定文字が `[\s()\[\]・／-]` しか無く、「せる」の直後の「〜」を
//   境界と見なせずスコア0.5（閾値0.7未満）で落ちていた。
//   実測で、境界扱いされない区切り文字を名前に含む店舗は 477/1,099店。
{
  const m = await loadModule('src/utils/searchMatch.js');
  const shop = (name, extra = {}) => ({ name, ...extra });

  const selu = shop('メンズエステ セル〜Selu〜', { city: '渋谷区', area: '代々木・原宿' });
  check('⭐「セル」で「メンズエステ セル〜Selu〜」がヒットする', () =>
    (m.shopFuzzyMatch(selu, 'セル') ? null : '〜が語境界として扱われていない'));
  check('「せる」（ひらがな）でもヒットする', () =>
    (m.shopFuzzyMatch(selu, 'せる') ? null : 'かな正規化が効いていない'));
  check('「Selu」でヒットする', () => (m.shopFuzzyMatch(selu, 'Selu') ? null : '英字でヒットしない'));
  check('「メンズエステ セル」（2語AND）でヒットする', () =>
    (m.shopFuzzyMatch(selu, 'メンズエステ セル') ? null : '複数トークンで落ちる'));

  // 他の区切り文字も同様に効くこと
  check('全角カッコ区切りでヒットする', () =>
    (m.shopFuzzyMatch(shop('Vicca+plus. (ヴィッカプラス)'), 'ヴィッカプラス') ? null : '（）が境界でない'));
  check('＋区切りでヒットする', () =>
    (m.shopFuzzyMatch(shop('Vicca+plus. (ヴィッカプラス)'), 'plus') ? null : '+が境界でない'));

  // ⚠️ ここが緩むと誤ヒットが増える。長音符・々は「語の一部」であって区切りではない
  // ⚠️ 長音符「ー」を境界扱いすると、語の途中で切れて誤ヒットが激増する。
  //    例: 「ミラ」で「ミラージュ」に当たってしまう（ー の直前で語が終わったと誤認）。
  //    実データで「ー」は411店の名前に含まれるので影響が大きい。
  check('⭐長音符は語の一部（「ジュ」で「ミラージュ」を出さない）', () =>
    (!m.shopFuzzyMatch(shop('ミラージュ'), 'ジュ') ? null : 'ーを境界扱いして誤ヒットしている'));
  check('⭐々も語の一部（「木」で「代々木サロン」を出さない）', () =>
    (!m.shopFuzzyMatch(shop('代々木サロン'), '木') ? null : '々を境界扱いして誤ヒットしている'));

  // ── 語頭一致（2026-08-22 オーナー判断で許可）─────────────────────
  // 実測: 1,099店中 **824店(75%)** が、自分の店名の先頭4文字で検索しても出てこなかった。
  // 日本語は単語を空白で区切らないため「リンダスパ」が1語と見なされ「リンダ」で届かなかった。
  check('⭐「リンダ」で「LINDA SPA (リンダスパ)」がヒットする（語頭一致）', () =>
    (m.shopFuzzyMatch(shop('LINDA SPA (リンダスパ)'), 'リンダ') ? null : '語頭一致が効いていない'));
  check('⭐「LIND」で「LINDA SPA」がヒットする（英字の語頭一致）', () =>
    (m.shopFuzzyMatch(shop('LINDA SPA (リンダスパ)'), 'LIND') ? null : '英字の語頭一致が効いていない'));
  check('⭐「ユニゾン」で「ユニゾンスパ (相模原店)」がヒットする', () =>
    (m.shopFuzzyMatch(shop('ユニゾンスパ (相模原店)'), 'ユニゾン') ? null : '語頭一致が効いていない'));

  // ⚠️ 語の「途中」は依然として当てない。ここを緩めると意図しない一致が激増する。
  //    ただし読み辞書で `lunabelle → ルナベール` と展開されるので、
  //    「ルナ」は**ルナベールの語頭**として正しくヒットする（リンダ→リンダスパと同じ理屈）。
  //    当ててはいけないのは語の**途中**＝「ベール」のような後半だけの断片。
  check('⭐語の途中には当てない（「ベール」で「Aroma Lunabelle」を出さない）', () =>
    (!m.shopFuzzyMatch(shop('Aroma Lunabelle (アロマルナベール秋葉原)'), 'ベール') ? null : '語中に誤ヒットしている'));
  check('⭐語の途中には当てない（「ティック」で「Celtic（セルティック）」を出さない）', () =>
    (!m.shopFuzzyMatch(shop('Celtic（セルティック）'), 'ティック') ? null : '語中に誤ヒットしている'));

  // ── ③ 関連度順（オーナー指摘「一番上にそれが出てこない」）─────────────
  // 「メンズエステセル」で31件ヒットし、目的の店(0.857)が
  // 「メンズエステ一宮」等(0.714)に埋もれてスクロールが必要だった。
  const many = [
    shop('メンズエステ一宮'),
    shop('メンズエステ Cucue (きゅきゅ)'),
    shop('メンズエステ Lynx 千葉店'),
    selu,
    shop('東京メンズエステ 池袋ルーム'),
  ];
  check('⭐「メンズエステセル」で目的の店が1番目に来る', () => {
    const r = m.rankShops(many, 'メンズエステセル');
    return r[0] && r[0].name === selu.name ? null : `1番目が ${r[0] && r[0].name}（関連度順に並んでいない）`;
  });

  // ── ③(b) 業界共通語は絞り込みに使わない ───────────────────────────
  // 「メンズエステ」は当サイトの全店に共通する語で、店を区別しない（31店の名前に含まれる）。
  check('⭐「メンズエステセル」で無関係な店まで拾わない', () => {
    const r = m.rankShops(many, 'メンズエステセル');
    return r.length === 1 ? null : `${r.length}件ヒットした（共通語で広く拾いすぎ）: ${r.map(x => x.name).join(' / ')}`;
  });
  check('「メンズエステ」だけで検索しても0件にしない', () => {
    const r = m.rankShops(many, 'メンズエステ');
    return r.length > 0 ? null : '共通語を消しすぎて0件になった';
  });

  // ── ④ カタカナで英字店名を探せる（読み辞書）───────────────────────
  // カタカナ読みを持たない英字ブランドは155店・ユニーク83語。
  check('⭐「リンクス」で「メンズエステ Lynx 千葉店」がヒットする', () =>
    (m.shopFuzzyMatch(shop('メンズエステ Lynx 千葉店'), 'リンクス') ? null : '読み辞書が効いていない'));
  check('⭐「クレスト」で「CREST SPA TOKYO」がヒットする', () =>
    (m.shopFuzzyMatch(shop('CREST SPA TOKYO'), 'クレスト') ? null : '読み辞書が効いていない'));
  check('⭐「ブロッサム」で「Aroma Blossom (田町店)」がヒットする', () =>
    (m.shopFuzzyMatch(shop('Aroma Blossom (田町店)'), 'ブロッサム') ? null : '読み辞書が効いていない'));
  check('辞書に無い語もローマ字音写で拾える（「アネラ」→Anela）', () =>
    (m.shopFuzzyMatch(shop('Anela'), 'アネラ') ? null : 'ローマ字フォールバックが効いていない'));

  // ⚠️ 読み展開で無関係な店まで拾わないこと
  check('⭐「リンクス」で「LINDA SPA」を誤ヒットさせない', () =>
    (!m.shopFuzzyMatch(shop('LINDA SPA (リンダスパ)'), 'リンクス') ? null : '読み展開で誤ヒットしている'));
}

// ── 認証トークンの期限判定（「ログイン中だけキャストが全員消える」の再発防止）──
// 【事故】2026-08-26、ログイン中に店舗ページのキャストが「全0人・在籍セラピスト情報はありません」に。
//   実測: 匿名キーでは47件返るのに、保存済みJWTでは **401 PGRST303 JWT expired** で0件。
//   authHeaders() が**期限を見ずに**保存済みトークンを送っていたため、
//   トークンが切れた瞬間から全RESTが401になり、呼び出し側は
//   `Array.isArray(data)` で受けているので**エラーではなく「データ無し」**として描画されていた。
{
  const s = await loadModule('src/utils/sessionExpiry.js');
  const now = 1_700_000_000;
  const f = s.isSessionUnusable;

  check('トークンが無ければ使えない', () => (f(null, now) && f({}, now) ? null : '判定できていない'));
  check('⭐期限切れは使えないと判定する', () =>
    (f({ access_token: 'x', expires_at: now - 1 }, now) ? null : '期限切れを見逃している＝401で全部空になる'));
  check('⭐期限直前（余裕60秒以内）も更新対象にする', () =>
    (f({ access_token: 'x', expires_at: now + 30 }, now) ? null : '通信中に切れる恐れがある'));
  check('十分に余裕があれば使う', () =>
    (!f({ access_token: 'x', expires_at: now + 3600 }, now) ? null : '有効なトークンを捨てている'));
  check('expires_at が無い場合は使ってみる（過剰にanonへ落とさない）', () =>
    (!f({ access_token: 'x' }, now) ? null : '期限不明で捨てている'));
}

// ── 認証をまたいだ戻り先（FIXES.md F01）────────────────────────────
// 【事故】口コミを読んで登録した人が、確認メールを踏むと**必ずホームに着地**していた。
//   戻り先を捨てている箇所が3つ（RegisterPage / ログイン⇄登録リンク / generateLinkのredirectTo）。
// 【危険】戻り先はURLから来る値なので、緩めるとオープンリダイレクトになる。
//   「同一サイト内の相対URLだけ」を機械で固定する。
{
  const m = await loadModule('src/utils/authRedirect.mjs');
  const f = m.normalizeReturnTo;

  check('⭐口コミのハッシュ付きURLは戻り先として保存する', () =>
    (f('/shops/a/threads/b#review-1') === '/shops/a/threads/b#review-1' ? null : '読了→登録→復帰が壊れる'));
  check('日本語・underscore を含むIDを壊さない', () =>
    (f('/shops/osaka_tanimachi_新感覚mエステ') === '/shops/osaka_tanimachi_新感覚mエステ' ? null : '日本語IDの店舗へ戻れない'));
  check('⭐管理画面の /admin?review=... を保持する', () =>
    (f('/admin?review=r_1', '/mypage') === '/admin?review=r_1' ? null : '新着口コミメールの導線が壊れる'));
  check('⭐プロトコル相対 //evil は外へ出さない', () =>
    (f('//evil.example') === '/' ? null : 'オープンリダイレクト'));
  check('⭐エンコード済みの // も外へ出さない（二重デコード対策）', () =>
    (f('/%2F%2Fevil.example') === '/' ? null : '二重デコードで外部へ出る'));
  check('⭐バックスラッシュを外へ出さない', () =>
    (f('/%5C%5Cevil.example') === '/' ? null : 'ブラウザによっては外部へ出る'));
  check('絶対URLを外へ出さない', () =>
    (f('https://evil.example/x') === '/' ? null : 'オープンリダイレクト'));
  check('javascriptスキームを拒否する', () =>
    (f('javascript:alert(1)') === '/' ? null : 'スキーム付きを通している'));
  check('⭐認証ページ自身は戻り先にしない（ログインのループ防止）', () =>
    (f('/login') === '/' && f('/auth/complete') === '/' ? null : '認証ループになる'));
  check('戻り先が無ければ用途ごとの既定へ', () =>
    (f('', '/popular-reviews') === '/popular-reviews' ? null : 'fallbackが効いていない'));
  check('⭐リンク生成で二重エンコードしない', () => {
    const url = m.withReturnTo('/register', '/shops/a#review-1', { source: 'review_end' });
    if (url.includes('%252F')) return '二重エンコードされている（復帰に失敗する）';
    return new URLSearchParams(url.split('?')[1]).get('redirect') === '/shops/a#review-1'
      ? null : '戻り先を復元できない';
  });
  check('⭐戻り先が無いときはリンクに redirect を付けない', () => {
    // ここを '/' に丸めると、ヘッダーのログインが常に ?redirect=/ を持ち、
    // 既定の /mypage ではなくホームへ飛ぶ（SSR初期表示では戻り先が空になる）
    if (m.withReturnTo('/login', '') !== '/login') return '空の戻り先が / に化けている';
    return m.normalizeReturnTo('', '') === '' ? null : '空の fallback が / に丸められている';
  });
  check('確認後の着地点はパス固定（外部URLを渡させない）', () => {
    const url = m.buildAuthCompleteUrl('/x', 'signup');
    return url.startsWith('https://') && url.includes('/auth/complete?') ? null : '着地点が固定されていない';
  });
}

// ── メール確認のワンタイムトークンを2回検証しない（FIXES.md F02）─────────
// 【事故経路】compat の useNavigate が毎レンダー別関数 → effect 再実行 →
//   成功済みトークンで再 verifyOtp → 「リンクが無効です」に化ける。
{
  const m = await loadModule('src/features/auth/verifyOtpOnce.mjs');

  // 同じトークンは何度呼んでも検証は1回
  let calls = 0;
  const ok = m.createOtpVerifier(async () => { calls += 1; return {}; });
  const [r1, r2, r3] = await Promise.all([ok('t1', 'signup'), ok('t1', 'signup'), ok('t1', 'signup')]);
  check('⭐同一トークンの verifyOtp は1回だけ', () => (calls === 1 ? null : `${calls}回呼ばれた（使用済みトークンで失敗表示になる）`));
  check('後から呼んだ側も同じ成功結果を受け取る（StrictMode対策）', () =>
    (r1.ok && r2.ok && r3.ok ? null : '2回目以降が結果を受け取れず「確認中」で止まる'));

  // 別トークンは別々に検証する
  await ok('t2', 'signup');
  check('別トークンはきちんと検証する', () => (calls === 2 ? null : `別トークンが検証されていない（calls=${calls}）`));

  // reject を握りつぶさない（無限「確認中」を防ぐ）
  const rejecting = m.createOtpVerifier(async () => { throw new Error('network down'); });
  const rejected = await rejecting('t3', 'signup');
  check('⭐非同期rejectも結果に畳む', () => (rejected.ok === false ? null : 'rejectで「確認中」から動かなくなる'));

  // 期限切れ・使用済みは error として返る
  const expired = m.createOtpVerifier(async () => ({ error: { message: 'Token has expired' } }));
  const expiredResult = await expired('t4', 'signup');
  check('期限切れはエラーとして扱う', () => (expiredResult.ok === false ? null : '期限切れを成功にしている'));
}

// ── ヘッダーの透過判定（FIXES.md F06-D）──────────────────────────────────
// 【事故経路】['/', '/shops/', ...].some(p => path === p || path.startsWith(p))
//   は '/' が**全URLに前方一致する**ため、全ページが「ヒーローあり＝透過」判定だった。
//   /search・/popular-reviews・店舗一覧でも背景が透け、本文とヘッダーが重なっていた。
{
  const h = await loadModule('src/utils/headerTransparency.mjs');
  const T = h.isTransparentHeaderPath;
  const cases = [
    ['/', true, 'ホーム'],
    ['/login', true, 'ログイン'],
    ['/register', true, '登録'],
    ['/ranking', true, 'ランキング'],
    ['/shops/60026', true, '店舗詳細'],
    ['/shops/60026/threads/観月せな', true, '人物詳細'],
    ['/brands/tiger-gate', true, 'ブランド詳細'],
    ['/shops', false, '店舗一覧'],
    ['/shops/', false, '店舗一覧（末尾スラッシュ）'],
    ['/search', false, '検索'],
    ['/popular-reviews', false, '口コミ一覧'],
    ['/brands', false, 'ブランド一覧'],
    ['/mypage', false, 'マイページ'],
    ['/post-review', false, '投稿'],
    ['/stats', false, '統計'],
    ['', false, '空文字'],
    [undefined, false, 'undefined'],
    [null, false, 'null'],
  ];
  for (const [path, want, label] of cases) {
    check(`ヘッダー透過: ${label}(${String(path)})`, () =>
      (T(path) === want ? null : `${want} を期待したが ${T(path)}`));
  }
  check('⭐全ページ透過に戻っていない（F06-Dの再発検出）', () => {
    const opaque = ['/search', '/popular-reviews', '/shops', '/mypage', '/stats', '/favorites', '/terms'];
    const wrong = opaque.filter((x) => T(x));
    return wrong.length ? `不透明であるべきページが透過になっている: ${wrong.join(', ')}` : null;
  });
  check('query/hash が混ざっても判定が変わらない', () =>
    (T('/shops/60026?tab=1') === true && T('/search?q=x') === false && T('/#top') === true
      ? null : 'query/hash付きで判定が変わる'));
}

// ── 「他の店舗」が同エリアか同県か（FIXES.md F06-C）───────────────────────
// 【事故】同エリアが3件未満だとSSRは同県へフォールバックするのに、見出しは
//   元の地域名のままだった＝「虎ノ門の他の店舗／近くの店舗と比べてみる」と書いて
//   荻窪・池袋を並べていた。距離は測っていないので「近く」とも言えない。
{
  const n = await loadModule('src/utils/nearbyShops.mjs');
  const row = (id, area) => ({ id, name: '店' + id, raw_data: { area } });
  const area3 = [row(1, '虎ノ門'), row(2, '虎ノ門'), row(3, '虎ノ門'), row(4, '荻窪')];
  const area2 = [row(1, '虎ノ門'), row(2, '虎ノ門'), row(4, '荻窪'), row(5, '池袋')];

  check('⭐同エリア3件以上なら scope=area（見出しはエリア名）', () => {
    const r = n.pickNearbyShops(area3, '虎ノ門');
    if (r.scope !== 'area') return `scope=${r.scope}`;
    if (r.shops.length !== 3) return `同エリアだけに絞れていない（${r.shops.length}件）`;
    return null;
  });
  check('⭐同エリア3件未満なら scope=prefecture（見出しは県名）', () => {
    const r = n.pickNearbyShops(area2, '虎ノ門');
    if (r.scope !== 'prefecture') return `scope=${r.scope} ＝別エリアを「虎ノ門の他の店舗」と書いてしまう`;
    if (r.shops.length !== 4) return `フォールバック時の件数が違う（${r.shops.length}件）`;
    return null;
  });
  check('境界: ちょうど3件は area / 2件は prefecture', () => {
    const three = [row(1, '虎ノ門'), row(2, '虎ノ門'), row(3, '虎ノ門')];
    const two = [row(1, '虎ノ門'), row(2, '虎ノ門')];
    if (n.pickNearbyShops(three, '虎ノ門').scope !== 'area') return '3件が area にならない';
    if (n.pickNearbyShops(two, '虎ノ門').scope !== 'prefecture') return '2件が prefecture にならない';
    return null;
  });
  check('area が無い店舗は最初から prefecture 扱い', () => {
    const r = n.pickNearbyShops(area3, undefined);
    return r.scope === 'prefecture' && r.shops.length === 4 ? null : `scope=${r.scope} / ${r.shops.length}件`;
  });
  check('raw_data.area が配列の店舗も拾う', () => {
    const rows = [1, 2, 3].map((i) => ({ id: i, name: 'a' + i, raw_data: { area: ['虎ノ門'] } }));
    const r = n.pickNearbyShops(rows, '虎ノ門');
    return r.scope === 'area' ? null : `配列areaを拾えていない（scope=${r.scope}）`;
  });
  check('limit を超えない / 空・不正入力で落ちない', () => {
    const many = Array.from({ length: 20 }, (_, i) => row(i, '虎ノ門'));
    if (n.pickNearbyShops(many, '虎ノ門', 8).shops.length !== 8) return 'limitが効いていない';
    if (n.pickNearbyShops(null, '虎ノ門').shops.length !== 0) return 'null入力で落ちる';
    if (n.pickNearbyShops(undefined, undefined).scope !== 'prefecture') return 'undefined入力の扱いが違う';
    if (n.pickNearbyShops([], '虎ノ門').shops.length !== 0) return '空配列の扱いが違う';
    return null;
  });
  check('⭐返す一覧は修正前と同一（scopeを足しただけ）', () => {
    const legacy = (near, area, limit = 8) => {
      const sameArea = (near || []).filter((s) => {
        const a = Array.isArray(s.raw_data?.area) ? s.raw_data.area[0] : s.raw_data?.area;
        return area ? a === area : true;
      });
      return (sameArea.length >= 3 ? sameArea : near || [])
        .slice(0, limit).map((s) => ({ id: s.id, name: s.name }));
    };
    const inputs = [[area3, '虎ノ門'], [area2, '虎ノ門'], [area3, undefined], [[], '虎ノ門'], [area2, '荻窪']];
    for (const [rows, area] of inputs) {
      const got = JSON.stringify(n.pickNearbyShops(rows, area).shops);
      const want = JSON.stringify(legacy(rows, area));
      if (got !== want) return `一覧が変わっている（area=${area}）: ${got} vs ${want}`;
    }
    return null;
  });
}

if (failures.length) {
  console.error('\n🚨 SSRヘルパの実行検査に失敗しました（このままデプロイすると本番が500になります）:\n');
  failures.forEach((v) => console.error('  - ' + v));
  console.error('\n⚠️ `npm run build` は実行時エラーを検出できません。ここで止めるのが最後の砦です。\n');
  process.exit(1);
}

console.log('✅ SSRヘルパ実行チェック OK');
