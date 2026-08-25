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

if (failures.length) {
  console.error('\n🚨 SSRヘルパの実行検査に失敗しました（このままデプロイすると本番が500になります）:\n');
  failures.forEach((v) => console.error('  - ' + v));
  console.error('\n⚠️ `npm run build` は実行時エラーを検出できません。ここで止めるのが最後の砦です。\n');
  process.exit(1);
}

console.log('✅ SSRヘルパ実行チェック OK');
