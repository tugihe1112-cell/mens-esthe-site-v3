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

if (failures.length) {
  console.error('\n🚨 SSRヘルパの実行検査に失敗しました（このままデプロイすると本番が500になります）:\n');
  failures.forEach((v) => console.error('  - ' + v));
  console.error('\n⚠️ `npm run build` は実行時エラーを検出できません。ここで止めるのが最後の砦です。\n');
  process.exit(1);
}

console.log('✅ SSRヘルパ実行チェック OK');
