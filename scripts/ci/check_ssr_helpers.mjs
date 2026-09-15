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
  const m = await loadModule('src/utils/authRedirect.js');
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

// ── 静的最適化ページでクエリを落とさない（FIXES.md F01 / 2026-09-07 本番実測）────
// 【事故】`/login` `/register` `/admin` `/auth/*` は Automatic Static Optimization の
//   対象（ビルド出力の `○ Static`）で、クライアントでも router.asPath にクエリが載らない。
//   実測: `/login?redirect=%2Fshops%2F...` を開いて4秒後、window.location.search には
//   クエリがあるのに、描画された「新規登録」リンクは `/register`（redirect無し）だった。
//   ＝ 認証をまたいだ戻り先が、そもそもページに届いていなかった。
//   同じ経路で `/admin?review=...`（新着口コミメールの導線）も壊れていた。
{
  const q = await loadModule('src/compat/queryString.js');
  const R = q.resolveQueryString;

  check('⭐asPath にクエリがある動的ページの挙動は変えない', () =>
    (R('shop=x&cast=y', '?ignored=1') === 'shop=x&cast=y' ? null : 'asPath を優先していない'));

  check('⭐asPath に無ければ実URLで補う（/login・/register・/admin）', () =>
    (R('', '?redirect=%2Fshops%2FA%2Fthreads%2FB') === 'redirect=%2Fshops%2FA%2Fthreads%2FB'
      ? null : '静的ページで戻り先が落ちる（F01が効かない）'));

  check('先頭の ? を二重に残さない', () =>
    (R('', '?a=1') === 'a=1' && R('', 'a=1') === 'a=1' ? null : '? の扱いが違う'));

  check('どちらも空・undefined・null でも空文字', () =>
    (R('', '') === '' && R(undefined, undefined) === '' && R(null, null) === ''
      ? null : '空入力で落ちるか空にならない'));

  check('⭐fragment をクエリ値へ混入させない（access_token/refresh_token の漏れ）', () => {
    const got = R('token_hash=abc#access_token=xyz&refresh_token=zzz', '');
    if (got !== 'token_hash=abc') return `fragment が残っている: ${got}`;
    const p = new URLSearchParams(got);
    if (p.get('token_hash') !== 'abc') return `token_hash が汚染されている: ${p.get('token_hash')}`;
    if (p.get('refresh_token')) return 'refresh_token がクエリ値として取れてしまう';
    return null;
  });

  check('実URL側に fragment が混ざっても落とす', () =>
    (R('', '?next=%2Fx#access_token=y') === 'next=%2Fx' ? null : '実URL側の fragment が残る'));

  check('fragment だけの asPath は実URLへフォールバックする', () =>
    (R('#access_token=y', '?redirect=%2Fa') === 'redirect=%2Fa'
      ? null : 'fragment だけの asPath を優先してしまう'));

  check('⭐encode済みの # (%23) は戻り先の一部として残す', () => {
    const qs = R('', '?redirect=%2Fshops%2F60026%2Fthreads%2F%E8%A6%B3%E6%9C%88%E3%81%9B%E3%81%AA%23review-1');
    const v = new URLSearchParams(qs).get('redirect');
    return v === '/shops/60026/threads/観月せな#review-1' ? null : `口コミのアンカーが壊れる: ${v}`;
  });

  check('管理画面の既存導線 /admin?review=... が読める', () => {
    const v = new URLSearchParams(R('', '?review=abc-123')).get('review');
    return v === 'abc-123' ? null : `新着口コミメールの導線が読めない: ${v}`;
  });
}

// ── 失敗の理由を利用者に説明する（DESIGN.md U03-10 / 2026-09-08）──────────────
// 【事故1】ログイン画面が `"ログインに失敗しました: " + err.message` を表示していた。
//   Supabase の英語文がそのまま出て、利用者は次に何をすればいいか分からない。
// 【事故2】それを直す際に**全部を1つの固定文へ潰した**。今度は「なぜ登録できないのか」が
//   誰にも分からなくなり、登録が止まっているのに原因を追えなかった。
// この検査は「内部文言を出さない」と「理由を説明する」の**両方**が同時に成立することを見る。
{
  const t = await loadModule('src/utils/authErrorText.js');
  const { classifyAuthError, loginErrorFor, resetErrorFor, LOGIN_ERROR_TEXT, RESET_ERROR_TEXT } = t;

  const cases = [
    ['Invalid login credentials', 0, 'invalid_credentials'],
    ['Email not confirmed', 0, 'email_not_confirmed'],
    ['Request rate limit reached', 0, 'rate_limit'],
    ['For security purposes, you can only request this after 51 seconds', 0, 'rate_limit'],
    ['', 429, 'rate_limit'],
    ['Failed to fetch', 0, 'network'],
    ['Load failed', 0, 'network'],
    ['NetworkError when attempting to fetch resource.', 0, 'network'],
  ];
  for (const [message, status, expected] of cases) {
    check(`失敗理由の分類: ${expected} ← ${message || `status=${status}`}`, () => {
      const got = classifyAuthError({ message, status });
      return got === expected ? null : `${expected} のはずが ${got} になった（案内文が的外れになる）`;
    });
  }

  check('⭐分類できない例外は server へ倒す（判定漏れで内部文言を出さない）', () =>
    (classifyAuthError({ message: 'TypeError: cannot read properties of undefined' }) === 'server'
      ? null : '未知の例外を server 以外へ分類している'));
  check('message が無い/例外以外でも落ちない', () =>
    (classifyAuthError(undefined) === 'server' && classifyAuthError({}) === 'server' && classifyAuthError('x') === 'server'
      ? null : 'null相当の入力で分類が壊れる'));

  // ⭐ 事故1の再発検出: 返す文字列に内部文言のかけらも混ぜない
  const leaky = 'ZZINTERNALZZ';
  for (const [label, fn] of [['ログイン', loginErrorFor], ['再設定', resetErrorFor]]) {
    check(`⭐${label}の画面文言に内部の例外文が混ざらない`, () => {
      const out = fn({ message: `PostgrestError: ${leaky} at /var/task/api/x.js:12`, status: 500 });
      const dump = JSON.stringify(out);
      if (dump.includes(leaky)) return '内部の例外文がそのまま画面へ出る（U03-10の再発）';
      return /[A-Za-z]{6,}/.test(`${out.text}${out.hint}`) ? `英字の内部文言らしき文字列が残っている: ${dump}` : null;
    });
  }

  // ⭐ 事故2の再発検出: 原因ごとに文言が分かれ、次の一手が必ず書いてある
  check('⭐ログインの失敗理由が1種類に潰れていない', () => {
    const texts = new Set(Object.keys(LOGIN_ERROR_TEXT).map((k) => LOGIN_ERROR_TEXT[k].text));
    return texts.size >= 4 ? null : `文言が ${texts.size} 種類しかない（原因が分からない画面に戻っている）`;
  });
  for (const [label, table] of [['ログイン', LOGIN_ERROR_TEXT], ['再設定', RESET_ERROR_TEXT]]) {
    check(`⭐${label}の全ての理由に「次にすること」が書いてある`, () => {
      const bad = Object.keys(table).filter((k) => !table[k].text || !table[k].hint);
      return bad.length === 0 ? null : `hint(次の一手)が無い: ${bad.join(', ')}`;
    });
  }
  check('資格情報の誤りとメール未確認で別の案内になる', () =>
    (loginErrorFor({ message: 'Invalid login credentials' }).text
      !== loginErrorFor({ message: 'Email not confirmed' }).text
      ? null : '原因が違うのに同じ案内を出している'));
  check('再設定では「パスワードが違う」等の的外れな案内を出さない', () =>
    (resetErrorFor({ message: 'Invalid login credentials' }).code === 'server'
      ? null : '再設定メールの失敗にログイン用の文言を出している'));
}

// ── 同名の別人を混ぜない（FIXES.md F04）──────────────────────────────────
// 【事故】検索・店舗・人物詳細・人物SSRが名前だけで口コミを人物へ割り当てていた。
//   同名の別人が1枚のカードに統合され、写真・件数・評価・タグが混ざる。
{
  const m = await loadModule('src/utils/reviewIdentity.js');
  const { buildTherapistReviewIndex, reviewsForTherapist, summarizeReviews, filterReviewsForTherapist } = m;

  // 受入データ: 別店舗の同名2名／系列店で異なるIDの同名2名／同一店舗の同名2名
  const therapists = [
    { id: 'tA', shop_id: 's1', name: '観月 せな' },
    { id: 'tB', shop_id: 's2', name: '観月せな' },   // 別店舗の同名（別人）
    { id: 'tC', shop_id: 's3', name: '白石 あん' },
    { id: 'tD', shop_id: 's3', name: '白石あん' },   // 同一店舗の同名2名
    { id: 'tE', shop_id: 's4', name: '桜井 ゆい' },
  ];
  const reviews = [
    { id: 'r1', therapist_id: 'tA', shop_id: 's1', therapist_name: '観月せな', rating: 4, tags: ['巨乳'] },
    { id: 'r2', therapist_id: 'tB', shop_id: 's2', therapist_name: '観月せな', rating: 2, tags: ['清楚'] },
    { id: 'r3', therapist_id: 'tZ', shop_id: 's1', therapist_name: '観月せな', rating: 5 }, // 退店等・名簿に無いID
    { id: 'r4', shop_id: 's4', therapist_name: '桜井ゆい', rating: 3 },                     // IDなし旧口コミ（同名1人）
    { id: 'r5', shop_id: 's3', therapist_name: '白石あん', rating: 5 },                     // IDなし旧口コミ（同名2人＝未結合）
  ];
  const idx = buildTherapistReviewIndex(reviews, therapists);
  const ids = (t) => reviewsForTherapist(idx, t).map((r) => r.id).join(',');

  check('⭐別店舗の同名を混ぜない（IDで分ける）', () =>
    (ids('tA') === 'r1' && ids('tB') === 'r2' ? null : `tA=${ids('tA')} tB=${ids('tB')}`));
  check('⭐名簿に無いIDの口コミを名前で拾い直さない', () =>
    (!ids('tA').includes('r3') && idx.unmatched.some((r) => r.id === 'r3')
      ? null : '別IDの口コミが名前一致で混入している'));
  check('⭐IDなし旧口コミは同名が1人のときだけ結び付ける', () =>
    (ids('tE') === 'r4' ? null : `tE=${ids('tE')}`));
  check('⭐同一店舗に同名2人ならIDなし口コミは未結合にする', () =>
    (ids('tC') === '' && ids('tD') === '' && idx.unmatched.some((r) => r.id === 'r5')
      ? null : 'どちらかの同名人物へ勝手に割り当てている'));

  check('系列店をまたいでも同じIDの関連付けは維持する', () => {
    const roster = [{ id: 'tX', shop_id: 's10', name: '星野 ひな' }];
    const rows = [
      { id: 'g1', therapist_id: 'tX', shop_id: 's10' },
      { id: 'g2', therapist_id: 'tX', shop_id: 's11' }, // 系列の別店舗で書かれた同一人物の口コミ
    ];
    const i2 = buildTherapistReviewIndex(rows, roster);
    return reviewsForTherapist(i2, 'tX').length === 2 ? null : '同一IDの系列店口コミが落ちている';
  });

  check('camelCase（therapistId / shopId）でも同じ判定になる', () => {
    const i3 = buildTherapistReviewIndex(
      [{ id: 'c1', therapistId: 'tA', shopId: 's1' }],
      [{ id: 'tA', shopId: 's1', name: '観月せな' }]
    );
    return reviewsForTherapist(i3, 'tA').length === 1 ? null : 'camelCaseの行を取りこぼす';
  });

  check('空・undefined・不正な入力で落ちない', () => {
    const i4 = buildTherapistReviewIndex(undefined, undefined);
    const i5 = buildTherapistReviewIndex([{}, { therapist_name: '' }], [{ id: '', name: 'x' }]);
    return (i4.byTherapistId.size === 0 && i5.byTherapistId.size === 0) ? null : '不正入力を人物へ割り当てている';
  });

  check('⭐評価が無ければ rating は null（0.0と表示しない）', () => {
    const s1 = summarizeReviews([{ id: 'a' }, { id: 'b', rating: 0 }]);
    const s2 = summarizeReviews([{ rating: 4 }, { rating: 2 }]);
    return (s1.rating === null && s1.count === 2 && s2.rating === 3) ? null : `rating=${s1.rating}/${s2.rating}`;
  });

  check('タグは実際に付いた口コミからだけ集める', () => {
    const sum = summarizeReviews(reviewsForTherapist(idx, 'tA'));
    return (sum.tags.has('巨乳') && !sum.tags.has('清楚')) ? null : '別人のタグが混ざっている';
  });

  // 🚩 退店（therapists の行が消えた）でも、その人物IDの口コミは本人のものとして残す。
  //    ここを落とすと退店プロフィールが404になり、公開済みURLが死ぬ。
  check('⭐退店して名簿から消えても、ID一致の口コミは残る（200を保つ）', () => {
    const retired = { id: 'tGone', shop_id: 's9', name: '引退 みか' };
    const rows = [
      { id: 'q1', therapist_id: 'tGone', shop_id: 's9' },
      { id: 'q2', therapist_id: 'tOther', shop_id: 's9' },
    ];
    // 名簿には退店者が居ない（在籍者だけが返ってくる状況）
    const got = filterReviewsForTherapist(rows, retired, [{ id: 'tOther', shop_id: 's9', name: '別人 ゆき' }]);
    return (got.length === 1 && got[0].id === 'q1') ? null : `退店者の口コミが落ちている: ${got.map((r) => r.id).join(',')}`;
  });

  check('名簿が空・null でも対象IDの口コミは拾う', () => {
    const t = { id: 'tSolo', shop_id: 's8', name: '単独 あい' };
    const rows = [{ id: 'z1', therapist_id: 'tSolo', shop_id: 's8' }];
    return (filterReviewsForTherapist(rows, t, []).length === 1
      && filterReviewsForTherapist(rows, t, null).length === 1)
      ? null : '名簿が空のときに対象の口コミを落としている';
  });

  check('⭐単一人物ページ（SSR）でも同じ契約になる', () => {
    const got = filterReviewsForTherapist(reviews, therapists[0], therapists.filter((t) => t.shop_id === 's1'));
    return (got.length === 1 && got[0].id === 'r1') ? null : `SSRの絞り込みが契約と違う: ${got.map((r) => r.id).join(',')}`;
  });
}

// ── 登録ファネルの計測に個人情報を載せない（DESIGN.md U06 / 2026-09-08）────────
{
  const m = await loadModule('src/utils/registerAnalytics.js');
  const { REGISTER_CTA_SOURCES, REGISTER_ERROR_CODES, pageTypeOf } = m;

  check('⭐sourceは固定の許可値だけ', () => {
    const expected = ['home', 'header', 'bottom_nav', 'review_end', 'review_lock', 'favorite'];
    return JSON.stringify(REGISTER_CTA_SOURCES) === JSON.stringify(expected)
      ? null : `許可値が変わっている: ${JSON.stringify(REGISTER_CTA_SOURCES)}`;
  });
  check('エラー分類は固定の5種類', () => {
    const expected = ['validation', 'duplicate', 'rate_limit', 'network', 'server'];
    return JSON.stringify(REGISTER_ERROR_CODES) === JSON.stringify(expected)
      ? null : `分類が変わっている: ${JSON.stringify(REGISTER_ERROR_CODES)}`;
  });
  // ⭐ 生のURL・日本語ID・トークンをイベントに載せない
  const cases = [
    ['/shops/60026/threads/%E8%A6%B3%E6%9C%88%E3%81%9B%E3%81%AA', 'therapist'],
    ['/shops/60026/threads/観月せな', 'therapist'],
    ['/shops/60026', 'shop'],
    ['/shops', 'shop_list'],
    ['/popular-reviews', 'reviews'],
    ['/search', 'search'],
    ['/area/tokyo', 'area'],
    ['/mypage', 'mypage'],
    ['/', 'home'],
    ['/legal', 'other'],
    ['', 'home'],
  ];
  for (const [path, expected] of cases) {
    check(`page_type: ${path || '(空)'} → ${expected}`, () =>
      (pageTypeOf(path) === expected ? null : `${pageTypeOf(path)} になった`));
  }
  check('⭐page_type にIDや日本語スラッグが混ざらない', () => {
    const out = new Set(cases.map(([p]) => pageTypeOf(p)));
    for (const v of out) {
      if (!/^[a-z_]+$/.test(v)) return `分類名にIDらしき値が混ざっている: ${v}`;
    }
    return null;
  });
}

// ── ブランドにまとめても全ルームの地名で出ること（2026-09-14）─────────────
// 🚩 支店レコードが存在する唯一の理由は「渋谷で検索した人に引っかかる」こと。
//    ブランド1枚にまとめるとき地名を引き継ぎ損ねると、**代々木で検索しても出なくなる**。
//    ここはオーナーが明示的に確認した要件なので、実データで固定する。
{
  const { buildBrands, groupBrandsByArea, pickNearbyBrands, buildBrandRoster, brandCanonicalPath, countRoomsByBrand, shopRedirectPath } = await loadModule('src/utils/brandGroups.js');
  const { rankShops } = await loadModule('src/utils/searchMatch.js');

  // 本番DBの実データ（Chocolate 3ルーム / Aroma Levante 3ルーム / 単独店1）
  const SHOPS = [
    { id: 'tokyo_shibuya_aroma_chocolate_tokyo', group_id: 'g_brand_chocolate', name: 'Chocolate (代々木ルーム)', prefecture: '東京都', city: '代々木', address: '東京都渋谷区代々木２丁目２７−１６ (最寄: 代々木駅)', area: ['代々木・原宿'], area_id: 'tokyo_shibuya_aroma' },
    { id: 'tokyo_shinjuku_chocolate_shinjuku', group_id: 'g_brand_chocolate', name: 'Chocolate (新宿ルーム)', prefecture: '東京都', city: '新宿御苑', address: '東京都新宿区新宿２丁目６−４ (最寄: 新宿三丁目駅)', area: ['新宿御苑'], area_id: 'tokyo_shinjuku_chocolate' },
    { id: 'tokyo_shinjuku_chocolate_shinokubo', group_id: 'g_brand_chocolate', name: 'Chocolate (新大久保ルーム)', prefecture: '東京都', city: '新大久保', address: '東京都新宿区百人町２丁目１１−２５ (最寄: 新大久保駅)', area: [], area_id: 'tokyo_shinjuku_chocolate' },
    // ⚠️ 同じエリアに2ルームあるケース（実データ: AROMA EMERALD は港区に2ルーム）。
    //    これが無いと「同じエリアに二重に出さない」の検査が素通りする（2026-09-14 妨害テストで発覚）。
    { id: 'tokyo_shinjuku_chocolate_shinjuku2', group_id: 'g_brand_chocolate', name: 'Chocolate (新宿御苑ルーム)', prefecture: '東京都', city: '新宿御苑', address: '東京都新宿区新宿３丁目', area: ['新宿御苑'], area_id: 'tokyo_shinjuku_chocolate' },
    { id: 'tokyo_shibuya_aroma_levante', group_id: 'g_brand_aroma_levante', name: 'Aroma Levante (代々木ルーム)', prefecture: '東京都', city: '代々木', address: '東京都渋谷区代々木 (最寄: 代々木駅西口 徒歩5分)', area: ['代々木・原宿'], area_id: 'tokyo_shibuya_aroma' },
    { id: 'tokyo_shinjuku_aroma_levante_shinjuku', group_id: 'g_brand_aroma_levante', name: 'Aroma Levante (新宿ルーム)', prefecture: '東京都', city: '新宿御苑', address: '東京都新宿区 (最寄: 新宿三丁目駅E1出口 徒歩3分)', area: ['新宿御苑'], area_id: 'tokyo_shinjuku_aroma' },
    { id: 'tokyo_yoyogi_aroma_levante', group_id: 'g_brand_aroma_levante', name: 'Aroma Levante (代々木ルーム)', prefecture: null, city: null, address: null, area: [], area_id: 'tokyo_yoyogi_aroma' },
    { id: 'solo_silk', group_id: null, name: 'Silk (シルク)', prefecture: '東京都', city: '渋谷区', address: '東京都渋谷区', area: ['渋谷'], area_id: 'tokyo_shibuya_silk' },
  ];
  const brands = buildBrands(SHOPS);
  const hit = (q, name) => rankShops(brands, q).some((b) => String(b.name).includes(name));

  check('ブランド: 8レコード→3ブランド', () => (brands.length === 3 ? null : `${brands.length}件になった`));
  check('ブランド: 名前から支店名が消える', () => {
    const b = brands.find((x) => x.id === 'g_brand_chocolate');
    return b?.name === 'Chocolate' ? null : `「${b?.name}」になった`;
  });
  check('ブランド: 所属する全店舗のidを持つ', () => {
    const b = brands.find((x) => x.id === 'g_brand_chocolate');
    return b?.shopIds?.length === 4 ? null : `${b?.shopIds?.length}件`;
  });
  // ⭐ ここが本番。1枚にしても全ルームの地名で引っかかること。
  for (const [q, name] of [
    ['渋谷', 'Chocolate'], ['代々木', 'Chocolate'], ['新大久保', 'Chocolate'],
    ['新宿', 'Chocolate'], ['原宿', 'Chocolate'],
    ['代々木', 'Aroma Levante'], ['新宿', 'Aroma Levante'],
    ['渋谷', 'Silk'],
  ]) {
    check(`⭐「${q}」で ${name} が出る`, () => (hit(q, name) ? null : '出なかった'));
  }
  check('ブランド: 関係ない地名では出ない', () => (hit('大阪', 'Chocolate') ? '大阪で出てしまった' : null));
  check('ブランド: 店名でも出る', () => (hit('Chocolate', 'Chocolate') ? null : '店名で出なかった'));
  // 🚩 2026-09-14 実装中に踏んだ2つの穴。どちらも画面が壊れる。
  check('⭐ブランド: リンク先が実在する店舗id（group_idのままだと404）', () => {
    const b = brands.find((x) => x.id === 'g_brand_chocolate');
    if (!b?.primaryShopId) return 'primaryShopId が無い';
    if (!b.shopIds.includes(b.primaryShopId)) return `${b.primaryShopId} は所属ルームに無い`;
    return b.primaryShopId === b.id ? 'group_id のままになっている' : null;
  });
  check('⭐ブランド: 表示用の項目を検索用で潰さない', () => {
    const b = brands.find((x) => x.id === 'g_brand_chocolate');
    // 全ルームを詰めると「代々木 新宿御苑 新大久保」になりカードが読めなくなる
    if (String(b?.city || '').trim().includes(' ')) return `city が連結されている: ${b.city}`;
    if (String(b?.prefecture || '').trim().includes(' ')) return `prefecture が連結されている: ${b.prefecture}`;
    return null;
  });
  // ⭐ エリア一覧の要件: 複数エリアにルームがあるブランドは、**そのすべてのエリアに出す**。
  //    代表ルームのエリアだけに出すと「渋谷を見ている人に渋谷のルームがあるブランドが出ない」。
  {
    const groups = new Map(groupBrandsByArea(brands));
    for (const [area, name] of [['代々木・原宿', 'Chocolate'], ['新宿御苑', 'Chocolate'], ['新大久保', 'Chocolate']]) {
      check(`⭐エリア「${area}」に ${name} が出る`, () =>
        ((groups.get(area) || []).some((b) => String(b.name).includes(name)) ? null : '出なかった'));
    }
    check('⭐エリア: 同じブランドを同じエリアに二重に出さない', () => {
      for (const [area, list] of groups) {
        const ids = list.map((b) => b.id);
        if (new Set(ids).size !== ids.length) return `${area} で重複`;
      }
      return null;
    });
    check('エリア: 件数の多い順に並ぶ', () => {
      const counts = groupBrandsByArea(brands).map(([, l]) => l.length);
      return counts.every((v, i) => i === 0 || counts[i - 1] >= v) ? null : '順序が違う';
    });
    check('エリア: 空・nullで落ちない', () =>
      (groupBrandsByArea([]).length === 0 && groupBrandsByArea(null).length === 0 ? null : '0件でない'));
  }

  // ── 「他のブランド」（ブランドページの回遊・クロール経路） ──
  // ⚠️ 別フィクスチャにする。上の SHOPS に行を足すと groupBrandsByArea の件数順テストが動く。
  {
    const NEAR = [
      ...SHOPS,
      { id: 'solo_a', group_id: null, name: 'アロマA', prefecture: '東京都', city: '代々木', address: '東京都渋谷区代々木１', area: ['代々木・原宿'], area_id: 'x_a' },
      { id: 'solo_b', group_id: null, name: 'アロマB', prefecture: '東京都', city: '代々木', address: '東京都渋谷区代々木２', area: ['代々木・原宿'], area_id: 'x_b' },
    ];
    const self = { id: 'g_brand_chocolate', shopIds: SHOPS.filter((s2) => s2.group_id === 'g_brand_chocolate').map((s2) => s2.id) };
    const near = pickNearbyBrands(NEAR, { area: '代々木・原宿', excludeIds: [self.id, ...self.shopIds], limit: 8 });

    // ⭐ 一番効くところ: 自分が「他のブランド」に出ないこと。
    //    ブランドIDだけ／ルームIDだけの除外では片方をすり抜ける。両方を効果で見る。
    check('⭐他ブランド: 自分のブランドが出ない', () =>
      (near.brands.some((b) => b.id === 'g_brand_chocolate') ? '自分が出た' : null));
    check('⭐他ブランド: 自分のルームIDでも出ない', () => {
      const byRoom = pickNearbyBrands(NEAR, { area: '代々木・原宿', excludeIds: SHOPS.filter((s2) => s2.group_id === 'g_brand_chocolate').map((s2) => s2.id) });
      return byRoom.brands.some((b) => b.id === 'g_brand_chocolate') ? 'ルームID除外が効いていない' : null;
    });
    check('⭐他ブランド: 送り先が /brands/ に使えるブランドID（group_id）', () => {
      const lev = near.brands.find((b) => String(b.name).includes('Levante'));
      if (!lev) return 'Levante が出なかった';
      return lev.id === 'g_brand_aroma_levante' ? null : `id が ${lev.id}`;
    });
    // ⚠️ ここは**件数で判定してはいけない**。エリア絞り込みを丸ごと外しても
    //    「3件以上」「scope==='area'」は両方そのまま通る（2026-09-14 妨害テストで素通り）。
    //    見るのは中身＝「同県だが別エリアの Silk(渋谷) が混ざっていないか」。
    check('⭐他ブランド: scope=area のとき別エリアの店を混ぜない', () => {
      if (near.scope !== 'area') return `scope が ${near.scope}（フィクスチャが同エリア3件未満になっている）`;
      if (near.brands.some((b) => String(b.name).includes('Silk'))) return '渋谷の Silk が代々木・原宿に混ざった';
      const want = ['Levante', 'アロマA', 'アロマB'];
      const missing = want.filter((w) => !near.brands.some((b) => String(b.name).includes(w)));
      return missing.length ? `同エリアなのに出ない: ${missing.join(',')}` : null;
    });
    check('⭐他ブランド: 同エリアが足りなければ同県へ広げ scope=prefecture', () => {
      const r = pickNearbyBrands(NEAR, { area: '存在しないエリア', excludeIds: ['g_brand_chocolate'] });
      if (r.scope !== 'prefecture') return `scope が ${r.scope}`;
      if (!r.brands.some((b) => String(b.name).includes('Silk'))) return '同県フォールバックなのに別エリアの Silk が出ない';
      // ⚠️ ブランドIDだけを渡す呼び方でも自分が出ないこと。
      //    ルームIDも一緒に渡す呼び方だけを検査すると、ID除外を消しても素通りする（保護の二重掛け）。
      return r.brands.some((b) => b.id === 'g_brand_chocolate') ? 'ブランドID単独の除外が効いていない' : null;
    });
    check('他ブランド: limit が効く', () =>
      (pickNearbyBrands(NEAR, { area: '代々木・原宿', excludeIds: [], limit: 2 }).brands.length === 2 ? null : 'limitが効かない'));
    check('他ブランド: 空・nullで落ちない', () => {
      if (pickNearbyBrands([], {}).brands.length !== 0) return '空配列が0件でない';
      if (pickNearbyBrands(null, {}).brands.length !== 0) return 'nullが0件でない';
      if (pickNearbyBrands(NEAR).brands.length === 0) return '引数省略で0件';
      return null;
    });
  }

  // ── DBの生レコード形（raw_data入れ子）でも地名が取れること ──────────
  // ⚠️ 上の SHOPS は prefecture / area をトップレベルに持つ「整形済み」の形。
  //    ところが**SSRがDBから受け取るのは raw_data に入れ子になった生レコード**で、
  //    トップレベルの prefecture / area は undefined。
  //    2026-09-14、ブランドSSRで `brand.prefecture` を直接読んでおり、
  //    「同エリアの他ブランド」が本番で永久に同県フォールバックへ落ちる状態だった
  //    （壊れないので気づけない＝静かに劣化する型）。整形済みフィクスチャでは再現しない。
  {
    const RAW = [
      { id: 'raw_1', group_id: 'g_raw', name: 'アロマRAW 渋谷店', raw_data: { prefecture: '東京都', city: '渋谷区', address: '東京都渋谷区', area: ['渋谷'] } },
      { id: 'raw_2', group_id: 'g_raw', name: 'アロマRAW 代々木店', raw_data: { prefecture: '東京都', city: '代々木', address: '東京都渋谷区代々木', area: ['代々木・原宿'] } },
    ];
    const [rawBrand] = buildBrands(RAW);
    check('⭐生レコード: ブランドのルームが都道府県を持つ（SSRの同エリア判定の前提）', () => {
      const head = (rawBrand.rooms || []).find((r) => r.id === rawBrand.primaryShopId) || rawBrand.rooms[0];
      return head?.prefecture === '東京都' ? null : `prefecture が ${JSON.stringify(head?.prefecture)}`;
    });
    check('⭐生レコード: ブランドのルームがエリアを持つ', () => {
      const head = (rawBrand.rooms || []).find((r) => r.id === rawBrand.primaryShopId) || rawBrand.rooms[0];
      const a = Array.isArray(head?.area) ? head.area[0] : head?.area;
      return a ? null : `area が ${JSON.stringify(head?.area)}`;
    });
    check('⭐生レコード: 全ルームの地名が検索用に残る（渋谷でも代々木でも出る）', () => {
      const missing = ['渋谷', '代々木'].filter((w) => !String(rawBrand.searchText).includes(w));
      return missing.length ? `searchText に無い: ${missing.join(',')}` : null;
    });
  }

  // ── D-014 本命URLと301の判定（店舗SSR・サイトマップ・内部リンクが共有する）──
  {
    const counts = countRoomsByBrand(SHOPS);
    const chocolate = buildBrands(SHOPS).find((b) => b.id === 'g_brand_chocolate');
    const solo = buildBrands(SHOPS).find((b) => b.id === 'solo_silk');

    check('⭐URL: 複数ルームのブランドは /brands/ が本命', () =>
      (brandCanonicalPath(chocolate) === '/brands/g_brand_chocolate' ? null : brandCanonicalPath(chocolate)));
    // ⭐ 単独店まで /brands/ に寄せると、同じ中身が2枚になる重複を新しく作る。
    check('⭐URL: 単独店は /shops/ のまま（重複を新しく作らない）', () =>
      (brandCanonicalPath(solo) === '/shops/solo_silk' ? null : brandCanonicalPath(solo)));
    check('⭐301: 複数ルームの店舗はブランドへ送る', () => {
      const got = shopRedirectPath({ id: 'tokyo_shinjuku_chocolate_shinjuku', group_id: 'g_brand_chocolate' }, counts);
      return got === '/brands/g_brand_chocolate' ? null : `${got}`;
    });
    check('⭐301: group_id が無い店舗は送らない（506店が該当）', () =>
      (shopRedirectPath({ id: 'solo_silk', group_id: null }, counts) === null ? null : '送ってしまった'));
    // ⭐ group_id はあるがルームが1つだけ＝送る相手がいない。往復するだけ。
    check('⭐301: group_idがあってもルーム1つなら送らない', () => {
      const one = countRoomsByBrand([{ id: 'a', group_id: 'g_solo_x' }]);
      return shopRedirectPath({ id: 'a', group_id: 'g_solo_x' }, one) === null ? null : '送ってしまった';
    });
    // ⭐ 判断材料が無いときに301を出すのは、消えていないページを消えたと宣言するのと同じ。
    check('⭐301: ルーム数が分からないときは送らない', () => {
      if (shopRedirectPath({ id: 'a', group_id: 'g_unknown' }, counts) !== null) return 'Mapに無いのに送った';
      if (shopRedirectPath({ id: 'a', group_id: 'g_unknown' }, null) !== null) return 'Mapがnullなのに送った';
      return null;
    });
    check('301: ルーム数の集計が group_id ごとに正しい', () => {
      if (counts.get('g_brand_chocolate') !== 4) return `chocolate が ${counts.get('g_brand_chocolate')}`;
      if (counts.get('g_brand_aroma_levante') !== 3) return `levante が ${counts.get('g_brand_aroma_levante')}`;
      if (counts.has(null) || counts.has('')) return 'group_idなしを数えている';
      return null;
    });
    check('URL/301: 空・nullで落ちない', () => {
      if (countRoomsByBrand(null).size !== 0) return 'nullが0件でない';
      if (shopRedirectPath(null, counts) !== null) return 'nullの店舗で送った';
      if (!String(brandCanonicalPath(null)).startsWith('/shops/')) return 'nullブランドで /shops/ に倒れない';
      return null;
    });
  }

  // ── 表示名から支店名・地名を外す（U08 / 2026-09-14 オーナー確認で先頭も対象に）──
  // 🚩 日本語は語の区切りが無いので、スペースや括弧を頼りにできない。
  //    実データ:「Aroma ELLA武蔵小杉」「doigt de fee (ドゥワドフェ)溝の口」「武蔵小杉 ROYCE (ロイス)」
  {
    const { getDisplayName } = await loadModule('src/utils/shopHelpers.js');
    const shop = (o) => ({ raw_data: o });
    const cases = [
      ['Aroma ELLA武蔵小杉', { city: '武蔵小杉' }, 'Aroma ELLA', '末尾に区切りなしで付いた市区'],
      ['エステ美人マダム武蔵小杉', { city: '武蔵小杉' }, 'エステ美人マダム', '末尾に区切りなしで付いた市区(全角のみ)'],
      ['doigt de fee (ドゥワドフェ)溝の口', { area: ['溝の口'] }, 'doigt de fee (ドゥワドフェ)', '括弧の外の末尾'],
      ['武蔵小杉 ROYCE (ロイス)', { city: '武蔵小杉' }, 'ROYCE (ロイス)', '⭐先頭の地名'],
      ['アロマモア 渋谷店', { area: ['渋谷'] }, 'アロマモア', '従来の「◯◯店」'],
      ['CREST SPA TOKYO (吉祥寺)', { area: ['吉祥寺'] }, 'CREST SPA TOKYO', '従来の括弧'],
      // ⭐ ここが安全装置。任意の地名を削り始めると正式なブランド名まで削れる。
      ['Aroma ELLA武蔵小杉', { city: '渋谷' }, 'Aroma ELLA武蔵小杉', '⭐その店の地名でなければ削らない'],
      ['渋谷', { city: '渋谷' }, '渋谷', '⭐店名が地名そのものなら空にしない'],
      // ⭐ ここが一番効く安全装置。区切り無しで先頭も削ると、地名で始まる正式名が壊れる。
      ['東京アロマ', { prefecture: '東京都' }, '東京アロマ', '⭐区切り無しの先頭は削らない(東京都の店)'],
      // ⭐ 読み仮名の末尾に地名が溶けている実データ。括弧ごと外すと読みまで消える。
      ['Aroma Lunabelle (アロマルナベール秋葉原)', { area: ['秋葉原'] }, 'Aroma Lunabelle (アロマルナベール)', '⭐括弧の中の地名だけ抜く'],
      ['アロマモア (アロマモア渋谷)', { area: ['渋谷'] }, 'アロマモア (アロマモア)', '⭐括弧の中の地名だけ抜く(漢字の読み)'],
      ['Aroma Lunabelle (アロマルナベール秋葉原)', { area: ['渋谷'] }, 'Aroma Lunabelle (アロマルナベール秋葉原)', '⭐その店の地名でなければ括弧の中も触らない'],
      ['CREST SPA TOKYO (吉祥寺)', { area: ['吉祥寺'] }, 'CREST SPA TOKYO', '中身が地名そのものなら括弧ごと外す(従来)'],
      ['X (ア秋葉原)', { area: ['秋葉原'] }, 'X (ア秋葉原)', '⭐括弧の中の残りが2文字未満なら抜かない'],
      ['大阪リラクゼーション', { city: '大阪市' }, '大阪リラクゼーション', '⭐区切り無しの先頭は削らない(大阪市の店)'],
    ];
    for (const [input, raw, want, label] of cases) {
      check(`表示名(${label}): ${input}`, () => {
        const got = getDisplayName(input, shop(raw));
        return got === want ? null : `「${got}」になった（期待「${want}」）`;
      });
    }
    check('⭐表示名: 長い地名から先に外す（武蔵小杉より先に小杉を外さない）', () => {
      const got = getDisplayName('Aroma ELLA武蔵小杉', { raw_data: { city: '武蔵小杉', area: ['小杉'] } });
      return got === 'Aroma ELLA' ? null : `「${got}」になった`;
    });
    check('表示名: 店舗を渡さなければ地名は触らない', () => {
      const got = getDisplayName('Aroma ELLA武蔵小杉');
      return got === 'Aroma ELLA武蔵小杉' ? null : `「${got}」になった`;
    });
    check('表示名: 空・nullで落ちない', () => {
      if (getDisplayName('') !== '') return '空文字が変化した';
      if (getDisplayName(null) !== null) return 'nullが変化した';
      return null;
    });
  }

  // ── 在籍者の名簿と実人数（2026-09-14 本番実測で発覚）──────────────
  // 🚩 ユニゾンスパ: 店舗ページ(相模原1室)は「在籍140人」なのにブランドページは「420名」＝
  //    同じ140人を3ルームぶん3回数えていた。すぐ下の名簿は重複除去しているのに数字だけ3倍。
  {
    // 同じ3人が3ルームに1行ずつ＝9行。実人数は3人。
    const ROWS = [];
    for (const room of ['r1', 'r2', 'r3']) {
      for (const n of ['咲', '上野 ゆい', '似鳥芹香']) {
        ROWS.push({ id: `${room}_${n}`, name: n, image_url: 'https://x/i.jpg', shop_id: room });
      }
    }
    check('⭐名簿: 3ルームに同じ3人がいても実人数は3（行数9を人数にしない）', () => {
      const { personCount } = buildBrandRoster(ROWS);
      return personCount === 3 ? null : `personCount が ${personCount}`;
    });
    check('⭐名簿: 表記ゆれ（似鳥 芹香 / 似鳥芹香・全角半角）を同一人物として数える', () => {
      const r = buildBrandRoster([
        { id: 'a', name: '似鳥芹香', image_url: 'i', shop_id: 'r1' },
        { id: 'b', name: '似鳥 芹香', image_url: 'i', shop_id: 'r2' },
        { id: 'c', name: 'ｱｲ', image_url: 'i', shop_id: 'r1' },
        { id: 'd', name: 'アイ', image_url: 'i', shop_id: 'r2' },
      ]);
      return r.personCount === 2 ? null : `personCount が ${r.personCount}`;
    });
    check('⭐名簿: 同じ人を写真グリッドに二重に出さない', () => {
      const { roster } = buildBrandRoster(ROWS);
      const names = roster.map((t) => t.name);
      return new Set(names).size === names.length ? null : `重複: ${names.join(',')}`;
    });
    // ⚠️ 人数は「写真あり」に限定してはいけない（店舗ページの在籍数と母数が変わる）。
    check('⭐名簿: 写真が無い人も人数には数える（名簿には出さない）', () => {
      const r = buildBrandRoster([
        { id: 'a', name: '咲', image_url: 'i', shop_id: 'r1' },
        { id: 'b', name: '写真なしの人', image_url: '', shop_id: 'r1' },
      ]);
      if (r.personCount !== 2) return `personCount が ${r.personCount}`;
      return r.roster.length === 1 ? null : `名簿が ${r.roster.length}件`;
    });
    // ⚠️ 同一人物が「写真なしの行」と「写真ありの行」を持つ実データがある。
    //    写真なしの行で人物キーを予約すると、その人が名簿から丸ごと消える。
    check('⭐名簿: 写真なしの行が先にあっても、写真ありの行で名簿に出る', () => {
      const r = buildBrandRoster([
        { id: 'a', name: '咲', image_url: null, shop_id: 'r1' },
        { id: 'b', name: '咲', image_url: 'i', shop_id: 'r2' },
      ]);
      return r.roster.length === 1 && r.roster[0].shopId === 'r2' ? null : `名簿 ${JSON.stringify(r.roster)}`;
    });
    check('名簿: 在籍でない行は名簿に出さない', () => {
      const r = buildBrandRoster([{ id: 'a', name: '咲', image_url: 'i', shop_id: 'r1', is_active: false }]);
      return r.roster.length === 0 ? null : '在籍外が名簿に出た';
    });
    check('名簿: SSRが焼いた形(shopId)でもリンク先が消えない', () => {
      const r = buildBrandRoster([{ id: 'a', name: '咲', image_url: 'i', shopId: 'r9' }]);
      return r.roster[0]?.shopId === 'r9' ? null : `shopId が ${r.roster[0]?.shopId}`;
    });
    check('名簿: limitで打ち切っても人数は打ち切らない', () => {
      const many = Array.from({ length: 50 }, (_, i) => ({ id: `x${i}`, name: `人${i}`, image_url: 'i', shop_id: 'r1' }));
      const r = buildBrandRoster(many, { limit: 24 });
      if (r.roster.length !== 24) return `名簿が ${r.roster.length}件`;
      return r.personCount === 50 ? null : `personCount が ${r.personCount}`;
    });
    check('名簿: 空・nullで落ちない', () => {
      if (buildBrandRoster([]).personCount !== 0) return '空配列が0でない';
      if (buildBrandRoster(null).roster.length !== 0) return 'nullが0件でない';
      return null;
    });
  }

  check('ブランド: 空配列・nullで落ちない', () => {
    if (buildBrands([]).length !== 0) return '空配列が0件でない';
    if (buildBrands(null).length !== 0) return 'nullが0件でない';
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
