/**
 * check_design_decisions.mjs — playbook/decisions.md のうち「機械で検証できる項目」をCIで守る
 *
 * 【なぜ必要か】
 * 同じデザイン決定が3回覆された（2026-05-23決定 → 07-05再指摘 → 08-06に再び覆る → 08-08再々指摘）。
 * 決定はCLAUDE.mdに書かれていたが4,000行に埋もれ、実装者が読まなかった。
 * ドキュメントを増やすだけでは同じことが起きるので、**ビルドを落として物理的に止める**。
 *
 * 実行: node scripts/ci/check_design_decisions.mjs
 *   （.github/workflows/ci.yml から呼ぶ。ローカルでも実行可）
 */
import fs from 'fs';

const violations = [];

function read(path) {
  try { return fs.readFileSync(path, 'utf-8'); } catch { return null; }
}

// ── D-001: 店舗ページにタブUIを復活させない ───────────────────────────
{
  const p = 'src/pages/ShopDetailPage.jsx';
  const src = read(p);
  if (src === null) {
    violations.push(`${p} が見つからない（リネームした場合はこのチェックも更新すること）`);
  } else {
    if (/\bsetActiveTab\b|\buseState\(['"]top['"]\)/.test(src)) {
      violations.push(
        `[D-001] ${p} にタブUI（activeTab）が復活している。\n` +
        `        店舗ページはSearchPage型（左タグサイドバー＋キャスト一覧の1ページ構成）と決定済み。\n` +
        `        → playbook/decisions.md D-001 を参照。変更したい場合は実装せずokabayashiに確認すること。`
      );
    }
    // 🚫 2026-08-20: **タグサイドバーを条件付きで出し分けること自体を禁止する。**
    //    経緯: 2026-08-21 に「タグ0件なら隠す」分岐(`hasAvailableTags`)が入り、
    //    口コミ0件の店舗だけ別レイアウトになった。しかも**開発中によく見る口コミありの店では
    //    再現しない**ため、オーナーから3回同じ指摘を受けた。
    //    列定義を条件付きにする修正では不十分（レイアウトが2種類ある限り必ずまた割れる）。
    //    → **レイアウトを1種類に固定する**のが唯一の再発防止。
    //    ⚠️ このチェックを緩めないこと。緩めた瞬間に同じ事故が起きる。
    // ⚠️ コメント内の言及（「復活させるな」という注意書き自体）に反応しないよう、
    //    行コメント・ブロックコメントを除去してから検査する。
    const codeOnly = src
      .replace(/\/\*[\s\S]*?\*\//g, '')   // /* ... */
      .replace(/^\s*\/\/.*$/gm, '');      // 行頭の //
    if (/hasAvailableTags|hasTags\b|tagsAvailable/.test(codeOnly)) {
      violations.push(
        `[D-001] ${p} にタグサイドバーの出し分け（hasAvailableTags 等）が復活している。\n` +
        `        /shops/:id は**全店舗で常に**「左タグサイドバー＋キャスト一覧」（D-001）。\n` +
        `        タグ件数が0でもレイアウトを変えないこと（SearchPageと同じ挙動）。\n` +
        `        「0件だと無意味だから隠す」という判断は過去に却下されている。\n` +
        `        → 実装せず okabayashi に確認すること。`
      );
    }
    if (!/TAG_CATEGORIES|TagFilterSidebar/.test(src)) {
      violations.push(
        `[D-001] ${p} からタグ絞り込みサイドバーが消えている。\n` +
        `        SearchPageと同じ左サイドバー構成を維持すること。`
      );
    }
  }
}

// ── D-001（2026-09-20 追加）: ブランドページも同じレイアウトであること ────────
// 🚩 D-014で多ルームの店舗ページを /brands/:id へ301した。**畳んだ先が同じ見え方でなければ
//    畳んだ意味がない。**ところが9/19の「移植」は機能だけで形を移しておらず、
//    ブランドページは開閉ボタン1つになっていた＝**370店・全体の34%がタグの列を失っていた**。
//    ガードが ShopDetailPage しか見ていなかったので、14本緑のまま4日間気づかなかった。
// ⚠️ 両方のページが**同じ部品**を描くこと。片方だけ作り直せる状態にしない。
{
  const shared = 'src/components/TagFilterSidebar.jsx';
  const sharedSrc = read(shared);
  if (sharedSrc === null) {
    violations.push(`[D-001] ${shared} が無い。タグの列は共通部品に一本化してある。`);
  } else if (!/タグで絞り込む/.test(sharedSrc)) {
    violations.push(`[D-001] ${shared} から「タグで絞り込む」の文言が消えている。`);
  }
  for (const p of ['src/pages/ShopDetailPage.jsx', 'src/pages/BrandPage.jsx']) {
    const src = read(p);
    if (src === null) { violations.push(`${p} が見つからない`); continue; }
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    if (!/<TagFilterSidebar/.test(codeOnly)) {
      violations.push(
        `[D-001] ${p} がタグの列（TagFilterSidebar）を描いていない。\n` +
        `        店舗ページとブランドページは**同じ見え方**にすること（D-014で301した先だから）。`
      );
    }
    if (!/lg:grid-cols-\[220px_1fr\]/.test(codeOnly)) {
      violations.push(
        `[D-001] ${p} に「左にタグの列・右に一覧」の2列レイアウトが無い。\n` +
        `        開閉ボタン1つに置き換えるのは過去に却下されている（2026-09-20）。`
      );
    }
    // 🚫 部品を使わず、ページ側でタグの一覧を作り直していないか
    if (/TAG_CATEGORIES\.map\(/.test(codeOnly)) {
      violations.push(
        `[D-001] ${p} がタグの一覧を自前で描いている（TAG_CATEGORIES.map）。\n` +
        `        共通部品 TagFilterSidebar を使うこと。自前で描くと片方だけ古くなる。`
      );
    }
  }
}

// ── D-002: ヒーローのcoverflowを維持 ─────────────────────────────────
{
  const p = 'src/components/TopHeroSlider.jsx';
  const src = read(p);
  if (src === null) {
    violations.push(`[D-002] ${p} が存在しない。ヒーローのcoverflowは維持する決定（decisions.md D-002）。`);
  } else if (!/coverflow/i.test(src)) {
    violations.push(
      `[D-002] ${p} から coverflow が消えている。\n` +
      `        静的ヒーロー化は2026-07-02にオーナー判断でrevert済み。変更前に確認すること。`
    );
  }
}

// ── D-002 付随: ヒーローの「店舗を見る」が押せること ─────────────────────
// 同じ「押しても開かない」が**2回**起きている。どちらもビルド・ガード緑のまま本番だけ壊れていた。
//   1回目（a673684）: 両隣のスライドが中央のボタンに覆いかぶさってクリックを横取り
//                     → 非アクティブの .swiper-slide を pointer-events:none、アクティブを auto
//   2回目（2026-09-21）: 最初の1枚だけ開き、送った後の4枚は無反応。当たり判定を
//                     .swiper-wrapper が取っていた（coverflow の 3D 空間で、送った後の
//                     アクティブが奥行き 0 に戻らない）→ wrapper を pointer-events:none
// 3行のどれが欠けても、どちらかが再発する。見るのは CSS のコメントを外した実コード。
{
  const p = 'src/index.css';
  const src = read(p);
  if (src === null) {
    violations.push(`[D-002/押せる] ${p} が見つからない。`);
  } else {
    const css = src.replace(/\/\*[\s\S]*?\*\//g, '');
    // 指定したセレクタ「そのもの」の宣言ブロックを返す（.swiper-slide で -active に当てない）
    const ruleBody = (selector) => {
      const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const m = css.match(new RegExp(`(?:^|[,}\\s])${esc}\\s*\\{([^}]*)\\}`));
      return m ? m[1] : null;
    };
    const pe = (body) => (body && (body.match(/pointer-events\s*:\s*([a-z-]+)/) || [])[1]) || null;
    const checks = [
      ['.hero-coverflow .swiper-wrapper', 'none',
        '当たり判定を .swiper-wrapper が取り、送った後のスライドで「店舗を見る」が無反応になる（2026-09-21）'],
      ['.hero-coverflow .swiper-slide', 'none',
        '両隣のスライドが中央のボタンを横取りする（1回目・a673684）'],
      ['.hero-coverflow .swiper-slide-active', 'auto',
        'アクティブのスライドまで押せなくなる'],
    ];
    for (const [sel, want, why] of checks) {
      const got = pe(ruleBody(sel));
      if (got !== want) {
        violations.push(
          `[D-002/押せる] ${p} の ${sel} が pointer-events:${want} になっていない（実際: ${got ?? '指定なし'}）。\n` +
          `        → ${why}。`
        );
      }
    }
  }
  const slider = read('src/components/TopHeroSlider.jsx') || '';
  if (!/pauseOnMouseEnter\s*:\s*true/.test(slider)) {
    violations.push(
      '[D-002/押せる] TopHeroSlider の autoplay から pauseOnMouseEnter が消えている。\n' +
      '        → 狙っている間にボタンが動いて外れる（1回目・a673684 の対策の半分）。'
    );
  }
}

// ── D-004: 課金前に価格を出さない ────────────────────────────────────
{
  const p = 'src/pages/PremiumPage.jsx';
  const src = read(p);
  // コメント行（説明として旧価格に言及している行）は除外してから判定する
  const code = (src || '').split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
  if (src && /[¥￥]\s?2,?980|[¥￥]\s?29,?800/.test(code)) {
    violations.push(
      `[D-004] ${p} に旧価格（¥2,980 / ¥29,800）が復活している。\n` +
      `        決定価格は¥980/¥9,800。かつ課金開始トリガー充足まで価格は表示しない。`
    );
  }
}

// ── D-007: /search の未入力状態を空にしない ──────────────────────────
{
  const p = 'src/pages/SearchPage.jsx';
  const src = read(p);
  if (src === null) {
    violations.push(`[D-007] ${p} が存在しない。/searchは未入力でも注目セラピストを表示する。`);
  } else {
    if (!/buildFeaturedTherapistPool/.test(src)) {
      violations.push('[D-007] /search から未入力時の注目セラピスト取得が消えている。');
    }
    if (!/気になるセラピストから探せます/.test(src)) {
      violations.push('[D-007] /search から未入力時の案内・一覧導線が消えている。');
    }
  }
}

// ── D-008: 店舗画像を object-cover で全面表示しない ────────────────────────
// 【事故】2026-08-20、PCで新着店舗スライダーと店舗ヒーローが「壊れて見える」と報告。
//   実測すると、店舗画像は 2026-07-06 の一括リサイズで**全て最大600px**なのに、
//   PCヒーローは幅約1,700px＝2.8倍に拡大し、さらに object-cover で上下を切り落としていた。
//   ユニーク756枚のうち横長(aspect≥2.2)が245枚・低解像度(<200px)が129枚あり、
//   **半数以上がこの表示方法で破綻する**状態だった。
// 【対処】「ぼかした複製を背景に敷き、本体は object-contain」に変更。
//   object-cover に戻すと同じ事故が必ず再発するので、機械的に止める。
{
  const targets = [
    ['src/pages/ShopDetailPage.jsx', '店舗ページのヒーロー'],
    ['src/pages/Home.jsx', 'ホームの新着店舗カード'],
  ];
  for (const [p, label] of targets) {
    const src = read(p);
    if (src === null) { violations.push(`[D-008] ${p} が見つからない`); continue; }
    // ⚠️ 初版のガードは2回とも不十分だった。記録しておく。
    //   1回目: 「object-cover が書かれていないこと」しか見ておらず**ザル**だった。
    //     LazyImage は className をラッパーdivに渡し、<img> には object-cover をハードコードしている。
    //     そのため呼び出し側が object-contain と書いても効かず、
    //     ガードは通るのに実際は cover のまま、という状態を素通しした。
    //   2回目: 行単位で見たため、複数行にまたがる JSX（src と imgClassName が別行）を誤検知した。
    //     さらに OG画像・JSON-LD・onError など**表示ではない箇所**まで拾っていた。
    //   → 「画像を実際に描画している行」だけを対象にし、その**周辺8行**に
    //      object-contain か blur-（ぼかし背景レイヤー）があるかで判定する。
    //   3回目の修正: ±8行の窓で見たら、**すぐ上のぼかし背景レイヤーが窓に入ってしまい**、
    //     本体を cover に戻しても検知できなかった（テストで発覚）。
    //     → 窓ではなく「その要素の開始タグから `/>` まで」を切り出して、要素単位で判定する。
    const lines = src.split('\n');
    /** src= の行から、その要素（<LazyImage ... /> または <img ... />）の範囲を切り出す */
    const elementAt = (i) => {
      let s = i;
      while (s > 0 && !/<(LazyImage|img)\b/.test(lines[s])) s--;
      let e = i;
      while (e < lines.length - 1 && !/\/>/.test(lines[e])) e++;
      return lines.slice(s, e + 1).join('\n');
    };
    lines.forEach((line, i) => {
      // 実際に描画している行だけを対象にする（src= に渡している箇所）
      if (!/src=\{[^}]*shop\.image_url/.test(line)) return;
      const el = elementAt(i);
      if (/object-contain/.test(el)) return; // 正しい
      if (/blur-/.test(el)) return;          // ぼかし背景レイヤーは意図的な cover
      violations.push(
        `[D-008] ${p}:${i + 1} で店舗画像が contain 表示になっていない（${label}）。\n` +
        `        店舗画像は最大600px・横長バナーや低解像度が過半のため、拡大＋切り取りで破綻する。\n` +
        `        必ず **imgClassName="... object-contain"**（LazyImage）または\n` +
        `        <img className="... object-contain">（生img）にすること。\n` +
        `        ⚠️ LazyImage の className はラッパーdivに付くだけで <img> には届かない。`
      );
    });
  }
}

// ── D-009: 欠損しうる店舗フィールドを無条件で描画しない ──────────────────────
// 【事故】2026-08-22、オーナーから「多分全ての店舗で同じ問題が起きてる」と指摘。
//   実測すると掲載1,099店のうち **住所なし614店(56%)・市区+エリアなし65店・
//   電話なし1,092店(99%)・営業時間なし615店(56%)** で、
//   `📍 {shop.address}` のような無条件描画により
//   「📍だけが浮く」「空のピンクの箱が出る」「ACCESSラベルの右が空白」状態が全店舗規模で発生していた。
//   さらに `shop.access` は**DBに存在しないフィールド**で、参照3箇所すべてが常に空だった。
// 【対処】src/components/LocationLabel.jsx（空なら null を返す）と
//   src/utils/shopFields.js の joinFields() に一本化。呼び出し側で分岐を書かせない。
// ⚠️ 出し分けを各ファイルに書くと必ずどこかが漏れる（実際に7ファイルで同じミスをしていた）。
{
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '_archive' || e.name === 'node_modules') continue;
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      // .bak_* 等の残骸はビルド対象外なので検査しない（そもそも削除済み）
      else if (/\.(jsx|tsx)$/.test(e.name)) files.push(p);
    }
  };
  for (const root of ['src', 'pages']) { if (fs.existsSync(root)) walk(root); }

  for (const p of files) {
    const src = read(p) || '';
    const codeOnly = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    // (a) 📍 を直書きしている＝データが空だとピンだけ残る
    // 🚩 2026-09-15: ここは以前 `/📍\s*\{\s*shop\./` だけを見ており、
    //    **📍の直後に `{shop.` が来る書き方しか検出できなかった**。
    //    ShopListPage は `<span>📍</span> {shop.prefecture}` と📍をspanで包んでいたため、
    //    間に `</span>` が挟まって素通りし、住所の無い店で丸いバッジにピンだけが浮いていた。
    //    ＝ガードが「特定の書き方」を見ていて「性質（空でも出てしまう）」を見ていなかった。
    //    → 📍のリテラルそのものを禁止し、**同じ行か直前2行に明示のガード**
    //      （`&&` / 三項 / LocationLabel）がある場合だけ許す形にした。
    if (!p.endsWith('LocationLabel.jsx')) {
      // ⚠️ コメントは**行番号を保ったまま**空白化する。
      //    codeOnly のようにコメントごと消すと行がずれて、報告する行番号が嘘になる。
      //    逆に生のまま走査すると、この検査を説明したコメント内の📍に自分で反応する
      //    （2026-09-15、実際に4件の誤検知が出た）。
      const blank = (m) => m.replace(/[^\n]/g, ' ');
      const lineSafe = src
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
        .replace(/\/\*[\s\S]*?\*\//g, blank)
        .replace(/^([ \t]*)\/\/.*$/gm, (m) => blank(m));
      const lines = lineSafe.split('\n');
      const rawLines = src.split('\n');
      for (let i = 0; i < lines.length; i += 1) {
        if (!lines[i].includes('📍')) continue;
        // 直前2行まで見る＝ガードが `{x && (` と別行に書かれている形（掲示板）を通すため。
        // 🚩 ガードの根拠は**コードから**取り、例外マーカーだけコメントから取る。
        //    2026-09-15、ここを生の行だけで見ていたため、📍の直前に置いた
        //    「→ LocationLabel を使うこと」という**自分の説明コメント**を
        //    「ガード済み」と読んで素通りした（前日 strip() で直したのと同じ型）。
        const codeWindow = lines.slice(Math.max(0, i - 2), i + 1).join('\n');
        const guarded = /&&|\?\s*\(|LocationLabel/.test(codeWindow);
        // `D-009-ok:` は**必ず空でない値**だと分かっている場所のための明示の例外。
        // 理由をコメントに書かせることで、黙って直書きに戻るのを防ぐ。
        const excused = /D-009-ok/.test(rawLines.slice(Math.max(0, i - 4), i + 1).join('\n'));
        if (guarded || excused) continue;
        violations.push(
          `[D-009] ${p}:${i + 1} が📍を無条件に描画している。\n` +
          `        住所が無い店舗が614店（全体の56%）あり、ピンだけが宙に浮く。\n` +
          `        → <LocationLabel parts={[shop.prefecture, shop.city]} /> を使うこと\n` +
          `          （中身が空なら要素ごと描画されない。呼び出し側の条件分岐は不要）。`
        );
        break;
      }
    }

    // (b) DBに存在しないフィールド。参照した時点で必ず undefined になる
    if (/\bshop\.access\b/.test(codeOnly)) {
      violations.push(
        `[D-009] ${p} が存在しないフィールド shop.access を参照している。\n` +
        `        shops/raw_data のどちらにも access は無い（正しくは address）。\n` +
        `        2026-08-22 まで3箇所が常に空文字を描いていた。`
      );
    }

    // (c) 収集元サイトの評価を画面に出さない
    //   `raw_data.rating` は他サイトから収集した値で、当サイトの口コミの裏付けが無い。
    //   実測: ★>0 の39店は **全店 reviewCount 0**。出すと「口コミ0件なのに★4.7」になる。
    //   星は必ず実際の口コミから算出する（shapeShopRow が rating を落としているので
    //   shop.rating は常に undefined。参照が残っていること自体が設計の誤解を招く）。
    if (/\bshop\.rating\b|raw_data\??\.rating\b/.test(codeOnly)) {
      violations.push(
        `[D-009] ${p} が shop.rating / raw_data.rating を参照している。\n` +
        `        これは収集元サイトの評価で、当サイトの口コミの裏付けが無い（39店が★>0だが口コミ0件）。\n` +
        `        「掲載料を受け取らないから辛口も載せる」という差別化を自ら壊すので表示しない。\n` +
        `        → 実際の口コミから算出した平均（avgRating 等）を使うこと。`
      );
    }

    // (d) データが無いことだけを伝える行き止まり文言
    const deadEnd = codeOnly.match(/'[^']*情報なし'|"[^"]*情報なし"/g);
    if (deadEnd) {
      violations.push(
        `[D-009] ${p} に行き止まり文言（${deadEnd.join(' / ')}）がある。\n` +
        `        「◯◯情報なし」はユーザーの次の行動に繋がらない。\n` +
        `        → その行ごと出さない（LocationLabel / joinFields が空なら描画しない）か、\n` +
        `          /stats の実測相場のように**代わりに使える情報**を出すこと。`
      );
    }
  }
}

// ── F06: 根拠のない順位・新着・近隣表示を出さない（2026-09-08） ──────────────
// 【事故】本番のヒーローが「口コミ人気 No.1〜5」と表示していたが、実体は固定5件の配列番号で
//   順位集計ではなかった。ドットの現在地も autoplay の**残り時間**から計算しており、
//   スライドを送らなくても時間だけで別の番号が光っていた。
//   店舗一覧は全店に「★ New」、店舗詳細は同県の店を並べながら「虎ノ門の他の/近く」と書いていた。
//   ＝いずれも「掲載料を受け取らないから正直に出す」という差別化を自ら崩す表示。
{
  const strip = (src) => (src || '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  // A. ヒーロー：順位に見える文言と、時間から作るドット判定
  {
    const p = 'src/components/TopHeroSlider.jsx';
    const src = read(p);
    if (src === null) { violations.push(`[F06-A] ${p} が見つからない`); }
    else {
      const code = strip(src);
      if (/口コミ人気|人気\s*No\.|ランキング\s*No\./.test(code)) {
        violations.push(
          `[F06-A] ${p} に順位を主張する文言が復活している。\n` +
          `        ヒーローは HERO_SHOP_IDS の固定5件で、口コミの集計順位ではない。\n` +
          `        → 「掲載店舗ピックアップ」のように、実際にやっていることだけを書くこと。`
        );
      }
      if (/activeProgress\s*\)\s*\*\s*\(\s*items\.length/.test(code)) {
        violations.push(
          `[F06-A] ${p} のドット選択が autoplay の残り時間（activeProgress）から計算されている。\n` +
          `        時間の progress と slide index は別物。送っていないのにドットだけが動く。\n` +
          `        → onSlideChange の realIndex を state に持ち、それだけで active を決めること。`
        );
      }
      if (!/onSlideChange/.test(code)) {
        violations.push(`[F06-A] ${p} が onSlideChange で現在スライドを取得していない。`);
      }
      if (!/aria-label=\{`\$\{i \+ 1\}枚目/.test(code)) {
        violations.push(`[F06-A] ${p} のドットが読み上げ可能な操作でなくなっている（aria-label）。`);
      }
      if (!/prefers-reduced-motion/.test(code) || !/toggleAutoplay/.test(code)) {
        violations.push(
          `[F06-A] ${p} から自動送りの停止手段が消えている。\n` +
          `        一時停止／再生ボタンと prefers-reduced-motion の初期停止は W3C 2.2.2 の要件。`
        );
      }
    }
  }

  // B. 店舗一覧：全店に出る固定バッジ（2026-09-08 オーナー判断で削除）
  {
    const p = 'src/pages/ShopListPage.jsx';
    const code = strip(read(p));
    if (/★\s*New/.test(code)) {
      violations.push(
        `[F06-B] ${p} に固定の「★ New」が復活している。\n` +
        `        この一覧は口コミ件数を取得していないため、全店舗に無条件で出る（口コミがある店にも付く）。\n` +
        `        → playbook/decisions.md D-010 を参照。日時ベースの新着バッジも独断で新設しないこと。`
      );
    }
  }

  // B-2. 店舗詳細：口コミ0件の店に「★ New」を出さない（2026-09-15）
  //     ShopListPage では 2026-09-08 に消したが、**店舗詳細には残っていた**＝
  //     `★ {avgRating || 'New'}` で0件の店に「★ New」が出ていた。
  //     ★は評価の記号なのに評価ではなく、これらの店は新規でもない（「0件」の言い換え）。
  //     営業を確認できていない店にも付いて矛盾していた（実際に本番で出た）。
  {
    const p = 'src/pages/ShopDetailPage.jsx';
    const code = strip(read(p));
    if (/★\s*\{[^}]*\|\|\s*'New'/.test(code) || /★\s*New/.test(code)) {
      violations.push(
        `[F06-B] ${p} が口コミ0件の店に「★ New」を出している。\n` +
        `        ★は評価の記号で、評価が無いなら出さない。「新規」でもなく0件の言い換えにすぎない。\n` +
        `        → playbook/decisions.md D-010（根拠のない数字を画面に出さない）。`
      );
    }
  }

  // F06-C. 店舗詳細：「在籍N人」と在籍一覧の母集団を食い違わせない（2026-09-16）
  //   以前は一覧だけ `image_url=not.is.null` で写真がある人に絞っており、
  //   店舗情報の「在籍N人」（全行カウント）と一覧の「全N人」が同じ画面で食い違っていた。
  //   極端な例では Finale (フィナーレ) が「在籍 356 人」と
  //   「全0人／在籍セラピスト情報はありません」を並べて出していた（本番で確認）。
  //   実測: 店舗ページが出る725店のうち355店でずれ、112店・4,418人ぶんが一覧ゼロ。
  //   ⚠️ 直し方は「数字を小さくする」ではなく「写真が無い人も名前で出す」。
  //      4,418行は非表示0・最終確認日なし0＝確認できている実在の人だった。
  {
    const p = 'src/pages/ShopDetailPage.jsx';
    const code = strip(read(p));
    if (/therapistQuery\s*=\s*`[^`]*image_url=not\.is\.null/.test(code)) {
      violations.push(
        `[F06-C] ${p} が在籍一覧を写真の有無で絞っている。\n` +
        `        店舗情報の「在籍N人」は全行を数えるので、同じ画面に食い違う2つの数字が出る。\n` +
        `        （Finale は「在籍356人」と「全0人」を並べて出していた）\n` +
        `        → playbook/decisions.md D-010（根拠のない数字を画面に出さない）。`
      );
    }
    // 🚩 `[^)]*` と書くと、アロー関数の `(t)` の `)` で止まって**一致しない**
    //    （2026-09-16、妨害テストで素通りして発覚）。範囲で取ること。
    if (/setCloudTherapists\([\s\S]{0,200}?image_url\?\.trim\(\)/.test(code)) {
      violations.push(
        `[F06-C] ${p} が取得後に写真の有無で在籍一覧を絞り直している。\n` +
        `        取得の条件だけ直しても、ここで絞ると「直したつもりで直っていない」になる。`
      );
    }
    // 🚩 重複排除は先勝ち。写真ありを先に並べてからでないと、
    //    写真を持っている人が写真なしの行に負けて消える。
    if (!/const hasImage = [\s\S]{0,200}?\.sort\([\s\S]{0,120}?hasImage\(b\)[\s\S]{0,200}?seen/.test(code)) {
      violations.push(
        `[F06-C] ${p} が重複排除の前に写真ありを先頭へ並べていない。\n` +
        `        同名の行は先に来たほうが残るので、写真なしが先だと**写真を持つ人が写真なしで出る**。`
      );
    }
  }

  // C. 店舗詳細：同県の店を並べながら「近く」「元の地域名」と書かない
  {
    const p = 'src/pages/ShopDetailPage.jsx';
    const code = strip(read(p));
    if (/近くの店舗と比べて|近くのメンズエステ/.test(code)) {
      violations.push(
        `[F06-C] ${p} が「近く」と書いている。距離は measure していない（同エリア or 同県の集合）。`
      );
    }
    // ⚠️ 「ssrNearbyScope という文字列がある」だけでは不十分。propsの受け口に残したまま
    //    見出しの計算から外す、という壊し方を素通しする（実際に妨害テストで素通りした）。
    //    見出しを組み立てている式そのものが scope を見ているかを検査する。
    if (!/\{nearbyHeading\}/.test(code)) {
      violations.push(
        `[F06-C] ${p} の「他の店舗」見出しが nearbyHeading を使っていない。`
      );
    }
    const headingStmts = [...code.matchAll(/const\s+(?:nearbyScopeName|nearbyHeading)\s*=\s*[^;]+;/g)]
      .map((m) => m[0]).join('\n');
    for (const [needle, why] of [
      ['ssrNearbyScope', '実際に使った集合（area/prefecture）を見ていない'],
      ['ssrArea', 'エリア名を出す経路が無い'],
      ['ssrPrefecture', '同県フォールバック時に県名を出す経路が無い'],
    ]) {
      if (!headingStmts.includes(needle)) {
        violations.push(
          `[F06-C] ${p} の見出し計算が ${needle} を参照していない（${why}）。\n` +
          `        同エリアが3件未満だとSSRは同県へフォールバックする。\n` +
          `        見出しだけ元の地域名のままだと「虎ノ門の他の店舗」と書いて荻窪を並べることになる。`
        );
      }
    }
    const ssr = read('pages/shops/[shopId]/index.jsx');
    if (ssr !== null && !/nearbyScope/.test(ssr)) {
      violations.push('[F06-C] 店舗SSRが nearbyScope を props で渡していない。');
    }
  }

  // D. ヘッダー：'/' の前方一致で全ページが透過になる書き方に戻さない
  {
    const p = 'src/components/Header.jsx';
    const code = strip(read(p));
    if (!/isTransparentHeaderPath/.test(code)) {
      violations.push(
        `[F06-D] ${p} が src/utils/headerTransparency.mjs を使っていない。\n` +
        `        判定をここへ書き戻すと境界テストが効かなくなる。`
      );
    }
    if (/\[\s*'\/'\s*,[^\]]*\]\s*\.some\(/.test(code)) {
      violations.push(
        `[F06-D] ${p} に「'/' を含む配列の some(startsWith)」が復活している。\n` +
        `        全pathnameが '/' に前方一致するため、全ページが透過ヘッダーになる。`
      );
    }
  }
}

// ── U01/U03: 共通トークンとナビ、認証フォーム（2026-09-08） ──────────────────
{
  const strip = (src) => (src || '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  // U01: トークンは .ui-* に閉じる。既存の .card や全 button を一括で上書きしない
  {
    const p = 'src/index.css';
    const css = read(p);
    if (css === null) { violations.push(`[U01] ${p} が見つからない`); }
    else {
      // ⚠️ `var(--ui-primary)` の**参照**では通さない。定義（`--ui-primary:`）があることを見る。
      //    妨害テストで、定義だけ消しても参照が残っていて素通りした。
      for (const token of ['--ui-primary', '--ui-field-min', '--ui-tap-min', '--ui-surface', '--ui-border']) {
        if (!css.includes(`${token}:`)) violations.push(`[U01] ${p} に ${token} の定義が無い。`);
      }
      for (const cls of ['.ui-card', '.ui-field', '.ui-btn-primary', '.ui-label', '.ui-error', '.ui-tap']) {
        if (!css.includes(cls)) violations.push(`[U01] ${p} から ${cls} が消えている。`);
      }
      // 全ボタン・全カードへの一括上書きは禁止（どこが壊れたか切り分けられなくなる）
      if (/^\s*button\s*\{/m.test(css.replace(/\/\*[\s\S]*?\*\//g, ''))) {
        violations.push(
          `[U01] ${p} に全 button を対象にした一括指定がある。\n` +
          `        .ui-* を「今回触る画面」から明示的に使う方式にすること（DESIGN.md U01）。`
        );
      }
    }
  }

  // U01-3: ボトムナビは lg:hidden。768〜1023px で主ナビが消える状態に戻さない
  {
    const p = 'src/components/BottomNav.jsx';
    const code = strip(read(p));
    if (/className="[^"]*\bmd:hidden\b/.test(code)) {
      violations.push(
        `[U01-3] ${p} が md:hidden に戻っている。\n` +
        `        ヘッダーのPCナビは lg: から出るため、768〜1023px で主ナビがどこにも無くなる。`
      );
    }
    if (!/\blg:hidden\b/.test(code)) violations.push(`[U01-3] ${p} の lg:hidden が消えている。`);
    if (!/aria-current=/.test(code)) violations.push(`[U01-5] ${p} が現在地を aria-current で示していない。`);
    // U01-5: 未登録で「投稿」だけを常時強調しない
    if (/highlight:\s*true/.test(code)) {
      violations.push(`[U01-5] ${p} で特定の項目を常時強調している（選択中のみ強調する）。`);
    }
    for (const path of ['/popular-reviews', '/post-review', '/search']) {
      if (!code.includes(`'${path}'`)) violations.push(`[U01-4] ${p} の5項目から ${path} が消えている。`);
    }
  }

  // U01-3: フッターの下余白の境界も lg に揃える
  {
    const p = 'src/components/Footer.jsx';
    const code = read(p) || '';
    if (/pb-20\s+md:pb-/.test(code)) {
      violations.push(`[U01-3] ${p} の下余白が md 境界のまま。BottomNav(lg:hidden) と食い違いドックが本文を覆う。`);
    }
  }

  // U03: 認証フォーム
  {
    // ⚠️ 件数まで見る。登録はパスワード＋確認の**2欄**が対象で、
    //    片方だけ外しても「1つはある」で素通りした（妨害テストで判明）。
    for (const [p, autocomplete, needed] of [
      ['src/pages/RegisterPage.jsx', 'new-password', 2],
      ['src/pages/LoginPage.jsx', 'current-password', 1],
    ]) {
      const code = strip(read(p));
      // U03-1: 常時動く 800px の発光レイヤーを戻さない
      if (/w-\[800px\]/.test(code) || /animate-pulse-slow/.test(code)) {
        violations.push(
          `[U03-1] ${p} に常時動く大きな発光レイヤーが復活している。\n` +
          `        背景は紺＋薄いグラデーション1枚。発光は主ボタンとスライダーへ集約する。`
        );
      }
      // U03-4/5: ラベルと入力の結び付け、autoComplete
      if (!/htmlFor="/.test(code)) violations.push(`[U03-4] ${p} の label が htmlFor で入力と結び付いていない。`);
      const acCount = (code.match(new RegExp(`autoComplete="${autocomplete}"`, 'g')) || []).length;
      if (acCount < needed) {
        violations.push(`[U03-5] ${p} の autoComplete="${autocomplete}" が ${needed}箇所必要なのに ${acCount}箇所しかない。`);
      }
      if (!/autoCapitalize="none"/.test(code)) {
        violations.push(`[U03-5] ${p} のメール欄に autoCapitalize="none" が無い。`);
      }
      // U03-6: パスワードの表示/隠す（type=button・対象を区別できる aria-label）
      if (!/aria-label=\{show/.test(code)) {
        violations.push(`[U03-6] ${p} にパスワードの表示/隠す操作（aria-labelで対象を区別）が無い。`);
      }
      // U01: 主ボタンとフォームは .ui-* を使う
      if (!/ui-btn-primary/.test(code)) violations.push(`[U01] ${p} の主ボタンが .ui-btn-primary を使っていない。`);
      if (!/ui-field/.test(code)) violations.push(`[U01] ${p} の入力欄が .ui-field を使っていない。`);
    }

    // U03-3: 登録の入力は1列（パスワードを2カラムに戻さない）
    const reg = strip(read('src/pages/RegisterPage.jsx'));
    if (/grid-cols-2/.test(reg)) {
      violations.push('[U03-3] RegisterPage に2カラムのグリッドが復活している（入力欄は全て1列）。');
    }
    // U03-7: API成功を「登録完了」と表示しない
    if (/登録が完了しました|登録完了/.test(reg)) {
      violations.push('[U03-7] RegisterPage が送信受付を「登録完了」と表示している（完了はメール確認後）。');
    }
    if (!/確認メールを送る/.test(reg)) {
      violations.push('[U03-7] RegisterPage の主ボタンが「確認メールを送る」ではない。');
    }
    // U03-8: 同意チェックを省略・初期ONにしない
    if (!/useState\(false\)[\s\S]{0,0}/.test(reg) || !/agreeToTerms/.test(reg)) {
      violations.push('[U03-8] RegisterPage の利用規約同意チェックが消えている。');
    }
    if (/agreeToTerms.{0,20}useState\(true\)|useState\(true\).{0,20}agreeToTerms/.test(reg)) {
      violations.push('[U03-8] RegisterPage の同意チェックが初期ONになっている。');
    }
  }
}

// ── U02／U04: ホームの入口と、読了後の登録導線（2026-09-08）───────────────
{
  const strip = (src) => (src || '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  // ── U02: ホーム ────────────────────────────────────────
  {
    const p = 'src/pages/Home.jsx';
    const home = strip(read(p));
    // U02-1: 見えるH1は1つだけ。sr-only H1と可視見出しの二重持ちに戻さない。
    const h1Count = (home.match(/<h1\b/g) || []).length;
    if (h1Count !== 1) {
      violations.push(`[U02-1] ${p} の <h1> が ${h1Count} 個ある（可視のH1を1つだけにする）。`);
    }
    if (/<h1[^>]*className="sr-only"/.test(home)) {
      violations.push(`[U02-1] ${p} に sr-only の H1 が復活している（画面の見出しと食い違う）。`);
    }
    if (!home.includes('口コミを読んで、店選びの不安を減らす。')) {
      violations.push(`[U02-1] ${p} の検索カード見出しが価値説明になっていない。`);
    }
    // U02-2: カード幅880px（PC40px余白・40px角丸へ戻さない）
    if (!/max-w-\[880px\]/.test(home)) {
      violations.push(`[U02-2] ${p} の検索カードが幅880pxではない。`);
    }
    if (/rounded-\[2\.5rem\]|md:p-10/.test(home)) {
      violations.push(`[U02-2] ${p} の検索カードが以前の40px角丸・40px余白へ戻っている。`);
    }
    // U02下部2: 地域は1地域ずつ。全県ぶんを縦に並べる形へ戻さない。
    // ⚠️ 2026-09-22 呼水の作り直しで形を変えた: select（口コミの地域）→「チップで欄全体を1地域に絞る」。
    //    欄は src/components/HomeReviewsSection.jsx に移したので、そちらを見る。
    //    以前は `.slice(0, 2)` という綴りを探していたが、同じファイルの注目セラピスト（shuffled.slice(0, 2)）
    //    にも当たり、地域別の絞り込みを消しても通っていた。件数は homeReviews.js の関数で決め、
    //    check_ssr_helpers が挙動（1店舗2件まで・最新1件を除く・数えきれない件数は出さない）を検査する。
    if (!/<HomeReviewsSection\b/.test(home)) {
      violations.push('[U02] ホームが口コミ欄（HomeReviewsSection）を描いていない。');
    }
    {
      const sp = 'src/components/HomeReviewsSection.jsx';
      const sec = strip(read(sp));
      if (!sec) {
        violations.push(`[U02] ${sp} が無い（ホームの口コミ欄）。`);
      } else {
        // 地域の切り替えは「押した状態」が読み上げでも分かるボタン群
        if (!/role="group"/.test(sec) || !/aria-label="口コミの地域"/.test(sec) || !/aria-pressed=\{/.test(sec)) {
          violations.push(`[U02] ${sp} の地域の切り替えが「口コミの地域」のボタン群（aria-pressed）になっていない。`);
        }
        // カードを描くのは「最新1件」と「新着の並び」の2か所だけ（県ごとにカードを並べる＝縦積みに戻さない）
        const cardCount = (sec.match(/<HomeReviewCard\b/g) || []).length;
        if (cardCount !== 2 || !/feed\.map\([\s\S]{0,200}?<HomeReviewCard/.test(sec)) {
          violations.push(`[U02] ${sp} のカードが「最新1件＋新着の並び」の形になっていない（<HomeReviewCard が ${cardCount} か所）。全県の縦積みに戻さない。`);
        }
        if (!/pickLeadReview\(/.test(sec) || !/pickFeedReviews\(/.test(sec)) {
          violations.push(`[U02] ${sp} が homeReviews.js の関数を通っていない（最新1件の重複・件数がずれる）。`);
        }
        // D-003: 中立宣言は消さない（Home/Footer）。口コミが0件の画面にも出す。
        if ((sec.match(/<NeutralStatement\b/g) || []).length < 2 || !sec.includes('掲載店舗から広告費・掲載料を受け取っていません。')) {
          violations.push(`[D-003] ${sp} の中立宣言が消えている（口コミがある画面・0件の画面の両方に出す）。`);
        }
      }
    }
    {
      const ssr = strip(read('pages/index.jsx'));
      if (!/groupReviewsByPref\(/.test(ssr) || !/buildLatestFeed\(/.test(ssr)) {
        violations.push('[U02] ホームSSRが homeReviews.js の組み立て（buildLatestFeed / groupReviewsByPref）を通っていない（1店舗2件の上限・件数がずれる）。');
      }
      // 件数は数えられた数字だけ出す。全件数は exact で取り、数えきれない数字は summarizeReviewIndex が null にする。
      // 🚩「キャスト 1000件」は実際の母数ではなく `.limit(1000)` そのものだった。同じ型にしない。
      if (!/summarizeReviewIndex\(/.test(ssr) || !/select\('shop_id, created_at', \{ count: 'exact' \}\)/.test(ssr)) {
        violations.push('[U05] ホームSSRの口コミ件数が exact の全件数と summarizeReviewIndex を通っていない（取得上限の数字を件数として出してしまう）。');
      }
    }
    // U02下部5: 期限のない「読み放題」表現を使わない
    if (/1件書けば口コミ読み放題|1件で読み放題/.test(home)) {
      violations.push('[U02] ホームに期限のない「読み放題」表現が復活している（日数を明記する）。');
    }
    // U02下部4: 同じ行き先のショートカット群を戻さない
    if (/キャスト検索[\s\S]{0,200}口コミを書く[\s\S]{0,200}ランキング/.test(home)) {
      violations.push('[U02] ホームに4機能ショートカットが復活している（共通ナビ・検索と重複する）。');
    }
  }

  // ── U02: ホームの口コミカード ──────────────────────────
  {
    const p = 'src/components/HomeReviewCard.jsx';
    const card = strip(read(p));
    // 「続きを読む」→取得→「全文を読む」の二段階に戻さない
    if (/from '\.\.\/lib\/supabase'/.test(card)) {
      violations.push(`[U02] ${p} が本文取得のためにSupabaseを呼んでいる（押して待つ中間状態が復活する）。`);
    }
    if (/続きを読む/.test(card)) {
      violations.push(`[U02] ${p} に「続きを読む」の中間ステップが復活している（全文リンク1回にする）。`);
    }
    if (!card.includes('口コミ全文を読む')) {
      violations.push(`[U02] ${p} の全文リンクが消えている。`);
    }
    // 全文リンクは該当口コミのアンカー付き
    if (!/#review-\$\{/.test(card)) {
      violations.push(`[U02] ${p} の全文リンクが該当口コミのアンカー（#review-<id>）を失っている。`);
    }
    // スマホ幅では index.css が全ての a に min-height:44px を付ける。行の中の文字リンクがそのまま44pxの箱になると
    // 名前と店名の間が20px以上空く（2026-09-22 描画して発見）。押せる範囲はカード全体（after）か
    // py-3 -my-3（見た目の位置を変えずに上下へ広げる）で取り、文字リンク自体は min-h-0 にする。
    {
      const classLists = [...card.matchAll(/className="([^"]*)"/g)].map((m) => m[1].split(/\s+/));
      const stretched = classLists.filter((c) => c.includes('after:inset-0'));
      const expanded = classLists.filter((c) => c.includes('py-3') && c.includes('-my-3'));
      if (stretched.length !== 1 || !stretched[0].includes('min-h-0')) {
        violations.push(`[U02] ${p} の新着カードが「カード全体で1つのリンク（after:inset-0 ＋ min-h-0）」になっていない。`);
      }
      if (expanded.length < 2 || expanded.some((c) => !c.includes('min-h-0'))) {
        violations.push(`[U02] ${p} の最新1件の店名・人物名リンクが min-h-0 と py-3 -my-3 を失っている（スマホで行が44pxに膨らむ）。`);
      }
    }
  }

  // ── U02-4: 検索欄は常時ラベル・入力とボタンは同じ行 ─────
  {
    const p = 'src/components/SearchBar.jsx';
    const bar = strip(read(p));
    if (!/htmlFor="/.test(bar)) {
      violations.push(`[U02-4] ${p} の検索欄が常時ラベルを持っていない（placeholderはラベルの代わりにならない）。`);
    }
    if (!/min-w-0/.test(bar)) {
      violations.push(`[U02-4] ${p} の入力に min-width:0 が無い（検索ボタンが画面外へ押し出される）。`);
    }
  }

  // ── U04: 読了後の登録導線 ──────────────────────────────
  {
    const p = 'src/components/RegisterInvite.jsx';
    const invite = strip(read(p));
    if (!invite) {
      violations.push(`[U04] ${p} が見つからない（読了後の案内の状態分岐が失われる）。`);
    } else {
      // 3状態それぞれの主表示（DESIGN.md U04 の表）
      for (const text of ['気になる口コミを、もっと読む', 'あなたの体験談も共有しませんか', '体験談を投稿して、閲覧期間を延長']) {
        if (!invite.includes(text)) violations.push(`[U04] ${p} の状態別の見出し「${text}」が消えている。`);
      }
      // 公開口コミが読めている地点で「続きを読む」と書かない
      if (/登録してこの続きを読む|この続きを読む/.test(invite)) {
        violations.push(`[U04] ${p} が公開口コミの読了地点で「続きを読む」と書いている（読めなくなる誤解になる）。`);
      }
      // 戻り先はF01の契約だけを使う
      if (!/withReturnTo\('\/register'/.test(invite)) {
        violations.push(`[U04] ${p} の登録リンクが戻り先（withReturnTo）を渡していない。`);
      }
    }

    const list = strip(read('src/components/ReviewListWithRestriction.jsx'));
    if (!/<RegisterInvite/.test(list)) {
      violations.push('[U04] ReviewListWithRestriction が読了案内（RegisterInvite）を使っていない。');
    }

    const mrc = strip(read('src/components/ModernReviewCard.jsx'));
    // F01/U04: 口コミ単位のアンカー
    if (!/id=\{review\.id \? `review-\$\{review\.id\}`/.test(mrc)) {
      violations.push('[U04] ModernReviewCard の article に review-<id> のアンカーが無い（登録後に同じ口コミへ戻れない）。');
    }
    if (!/scrollMarginTop/.test(mrc)) {
      violations.push('[U04] ModernReviewCard に scroll-margin-top が無い（アンカー先がヘッダーに隠れる）。');
    }
    // ロック表示は未登録＝登録CTA／会員＝投稿CTA
    if (!mrc.includes('無料登録して続きを読む')) {
      violations.push('[U04] ModernReviewCard のロック表示が未登録にも投稿CTAを出している（登録CTAにする）。');
    }
    // 権限のない本文をURLだけで開かない
    if (!/if \(!canReadFull \|\| !review\.id\) return;/.test(mrc)) {
      violations.push('[U04] ModernReviewCard がアンカー指定だけで本文を開けるようになっている（canReadFullで塞ぐ）。');
    }

    const thread = strip(read('src/pages/ThreadDetailPage.jsx'));
    if (!/showStickyCta && !inviteVisible/.test(thread)) {
      violations.push('[U04] 人物詳細の固定CTAが、読了案内が見えている間も表示される（本文を二重に覆う）。');
    }
    if (!/IntersectionObserver/.test(thread)) {
      violations.push('[U04] 人物詳細の固定CTAの表示判定が IntersectionObserver ではない（毎フレームのstate更新は禁止）。');
    }
  }
}

// ── U05: 検索・店舗・人物ページの比較しやすさ（2026-09-08）─────────────────
{
  const strip = (src) => (src || '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  const search = strip(read('src/pages/SearchPage.jsx'));
  // 3本目の名前入力を戻さない（上部の「セラピスト名」とAND条件になり必ず0件になる）
  if (/castNameFilter/.test(search)) {
    violations.push('[U05] SearchPage に3本目の「キャスト名で絞り込み」が復活している（castInputへ一本化する）。');
  }
  if (!search.includes('セラピストを探す')) {
    violations.push('[U05] SearchPage の可視H1「セラピストを探す」が無い。');
  }
  if (/店舗・地域が偏らないように表示しています/.test(search)) {
    violations.push('[U05] SearchPage に実装の説明文が復活している（利用者の操作の助けにならない）。');
  }
  // 列数の段階（2/3/4/5）を1か所で定義する
  if (!/const GRID_CLASS = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5/.test(search)) {
    violations.push('[U05] SearchPage の列数（320/640/1024/1280の4段階）の定義が消えている。');
  }
  // 名前・店舗・地域は写真の下の面へ（写真の上に重ねない）
  if (!/bg-slate-900 border-t border-white\/5/.test(search)) {
    violations.push('[U05] SearchPage のカードで名前・店舗・地域が写真下の単色面に置かれていない。');
  }
  // 未取得を0件と表示しない
  if (!/countsReady && reviewCountMap\[t\.id\] > 0/.test(search)) {
    violations.push('[U05/F05] SearchPage が未取得の口コミ件数を表示しうる（取得済みのときだけ出す）。');
  }
  // タグシートはモーダルとして閉じられる
  for (const [re, msg] of [
    [/aria-modal=/, 'aria-modal が無い'],
    [/e\.key === 'Escape'/, 'Escapeで閉じられない'],
    [/opener\.focus\(\)/, '閉じた後に開いたボタンへfocusが戻らない'],
  ]) {
    if (!re.test(search)) violations.push(`[U05] SearchPage のタグシートで ${msg}。`);
  }

  const list = strip(read('src/pages/ShopListPage.jsx'));
  for (const en of ['ALL SHOPS', 'SEARCH RESULTS']) {
    if (list.includes(en)) violations.push(`[U05] ShopListPage の見出しが英語（${en}）のまま。`);
  }
  if (!list.includes('表示対象')) {
    violations.push('[U05] ShopListPage の件数表示が「表示対象○件」になっていない。');
  }

  const detail = strip(read('src/pages/ShopDetailPage.jsx'));
  for (const en of ['THERAPISTS', 'SHOP INFORMATION', 'GROUP STORE']) {
    if (detail.includes(en)) violations.push(`[U05] ShopDetailPage の見出しが英語（${en}）のまま。`);
  }
  if (!/max-w-\[1200px\]/.test(detail)) {
    violations.push('[U05] ShopDetailPage のPCコンテンツ幅が1200pxになっていない。');
  }
}

// ── 在籍一覧に居ない人を現役として見せない（2026-09-09）─────────────────────
// 【事故】退店したセラピストのページは口コミごと残る（公開済みURLを殺さないため）が、
//   画面には**何の表示もなかった**。実データで is_active=false が155人いた。
//   秋葉原の1店に至っては店舗ごと別ブランドへ改名しており、旧店名を掲載し続けていた。
// ⚠️ ただし断定もしない。確認できるのは「最新の在籍一覧に居ない」ことだけで、
//    退店か休業か収集失敗かは分からない（★Newを全店から消したのと同じ考え方）。
{
  const strip = (src) => (src || '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  // 判定と文言は1か所に集約する（各画面に散らすと必ずどこかが緩む）
  const helper = strip(read('src/utils/therapistStatus.js'));
  if (!helper) {
    violations.push('[U05] src/utils/therapistStatus.js が無い。在籍状態の判定と文言の集約先が失われる。');
  } else {
    if (!/export function isNotListed/.test(helper)) {
      violations.push('[U05] therapistStatus.js の isNotListed の定義が消えている。');
    }
    // 判定材料は2つ。片方だけにすると、その経路の人が現役として表示される。
    for (const [re, label] of [
      [/therapist\.is_active === false/, 'is_active=false（行は残るが在籍一覧から外れた）'],
      [/therapist\.raw_data\?\.archived === true/, 'raw_data.archived=true（名簿から消えた人）'],
    ]) {
      if (!re.test(helper)) violations.push(`[U05] therapistStatus.js の判定から「${label}」が外れている。`);
    }
    for (const c of ['NOT_LISTED_LABEL', 'NOT_LISTED_SHORT', 'NOT_LISTED_NOTE']) {
      if (!new RegExp(`export const ${c}`).test(helper)) {
        violations.push(`[U05] therapistStatus.js の ${c} が消えている。`);
      }
    }
    // 断定しない（退店の事実は確認していない）
    if (/'退店済み'|"退店済み"/.test(helper)) {
      violations.push('[U05] therapistStatus.js が「退店済み」と断定している。確認できているのは「在籍一覧に居ない」ことだけ。');
    }
  }

  // ── 支店名を画面に出さない（2026-09-14 オーナー確認）──
  // 「アロマモア渋谷店」ではなく「アロマモア」。その店舗の「渋谷店」に価値はない。
  // 地名が name に入っているのは**検索で引っかかるためだけ**。
  {
    const helper = strip(read('src/utils/shopHelpers.js'));
    if (!/export const getDisplayName/.test(helper)) {
      violations.push('[U08] getDisplayName が消えている（支店名の除去）。');
    }
    // 🚩 末尾の1語を無条件に外すとブランド名を削る
    //    （"美・セラ極～KIWAMI～" "トキョプラ 旧T+Plus (ティープラス) 新宿" が実在）。
    //    必ず**その店自身の所在地**と照合してから外すこと。
    // ⚠️ 存在だけ見ると、括弧側と空白側の**片方だけ**外す壊し方が通る（2026-09-14 妨害テストで実際に素通りした）。
    //    照合は2箇所（"CREST SPA TOKYO (荻窪)" と "らんぷ 北千住"）あるので件数で見る。
    const checks = (helper.match(/places\.has\(/g) || []).length;
    if (!/ownPlaceWords/.test(helper) || checks < 2) {
      violations.push(`[U08] 表示名の地名除去が、その店自身の所在地と照合していない（${checks}箇所。括弧と空白の両方が必要・ブランド名を削る事故になる）。`);
    }
    // 一覧で生の店舗名を出していないこと（送れていない画面が必ず出るため件数で見る）
    for (const f of [
      'src/pages/SearchPage.jsx', 'src/pages/PopularReviewsPage.jsx',
      'src/pages/NewTherapistsPage.jsx', 'src/pages/PostReviewPage.jsx',
      'src/pages/PrefecturePage.jsx', 'src/pages/Home.jsx',
    ]) {
      const body = strip(read(f));
      if (/[>{]\s*\{shop\.name\}/.test(body)) {
        violations.push(`[U08] ${f} が支店名を含む生の店舗名を表示している（getDisplayName を通すこと）。`);
      }
    }
  }

  // ── 店舗の状態（閉店／営業未確認）も同じ作りで守る（2026-09-14）──
  {
    const shopHelper = strip(read('src/utils/shopStatus.js'));
    if (!shopHelper) {
      violations.push('[U07] src/utils/shopStatus.js が無い。閉店・営業未確認の判定と文言の集約先が失われる。');
    } else {
      if (!/export function shopStatusOf/.test(shopHelper)) {
        violations.push('[U07] shopStatus.js の shopStatusOf の定義が消えている。');
      }
      // 🚩 「閉店」と「営業未確認」を1つに畳んではいけない。
      //    サイトが消えた18店のうち15店は営業中だった（2026-09-13実測）。
      //    確認できないだけの店に「閉店」と出すのは、営業中の店への誤情報。
      for (const c of ['CLOSED_LABEL', 'CLOSED_SHORT', 'CLOSED_NOTE',
                       'UNCONFIRMED_LABEL', 'UNCONFIRMED_SHORT', 'UNCONFIRMED_NOTE']) {
        if (!new RegExp(`export const ${c}`).test(shopHelper)) {
          violations.push(`[U07] shopStatus.js の ${c} が消えている（閉店と営業未確認の区別が失われる）。`);
        }
      }
      for (const [re, label] of [
        [/raw_data\.closed === true|raw\.closed === true/, '閉店の判定'],
        [/operation_unconfirmed === true/, '営業未確認の判定'],
      ]) {
        if (!re.test(shopHelper)) violations.push(`[U07] shopStatus.js から「${label}」が外れている。`);
      }
      if (/UNCONFIRMED_LABEL\s*=\s*'閉店|UNCONFIRMED_SHORT\s*=\s*'閉店/.test(shopHelper)) {
        violations.push('[U07] 「営業未確認」を「閉店」と表示している。確認できているのは「つながらない」ことだけ。');
      }
    }
    // 帯・札が実際に描かれていること（importだけ残す改変を通さない）
    for (const [file, tag, label] of [
      ['src/pages/ShopDetailPage.jsx', '<ShopStatusBanner', '店舗ページの帯'],
      ['src/pages/SearchPage.jsx', '<ShopStatusChip', '検索結果の札'],
      ['src/pages/PrefecturePage.jsx', '<ShopStatusChip', 'エリア一覧の札'],
    ]) {
      if (!strip(read(file)).includes(tag)) {
        violations.push(`[U07] ${label}（${file}）が描かれていない。`);
      }
    }
    // 🚩 SSRは raw_data を丸ごと渡さない方針なので、印の2つだけ平らにして渡す必要がある。
    //    ここが欠けると帯は本番で一度も出ない（ローカルでは気づけない）。
    const shopSsr = strip(read('pages/shops/[shopId]/index.jsx'));
    if (!/closed:\s*shop\.raw_data\?\.closed === true/.test(shopSsr)
        || !/operationUnconfirmed:\s*shop\.raw_data\?\.operation_unconfirmed === true/.test(shopSsr)) {
      violations.push('[U07] 店舗SSRが閉店・営業未確認の印を渡していない（帯がSSRで出ない）。');
    }
  }

  // 表示側3か所が**実際に呼んでいる**こと（importだけ残す改変を通さない）
  for (const [p, label] of [
    ['src/pages/ThreadDetailPage.jsx', '人物ページ'],
    ['src/components/HomeReviewCard.jsx', 'ホームの口コミカード'],
    ['src/pages/PopularReviewsPage.jsx', '口コミ一覧のカード'],
  ]) {
    if (!/isNotListed\(/.test(strip(read(p)))) {
      violations.push(`[U05] ${label}（${p}）が在籍状態を表示していない。退店した人が現役として出る。`);
    }
  }

  // ホームのSSRが在籍状態を渡していること（渡さなければカード側は永久に判定できない）
  const home = strip(read('pages/index.jsx'));
  if (!/select\('id, image_url, is_active'\)/.test(home)) {
    violations.push('[U05] ホームSSRが therapists.is_active を取得していない（カードに印を出せない）。');
  }
  if (!/notListed: notListedById\[r\.therapist_id\] === true/.test(home)) {
    violations.push('[U05] ホームSSRが口コミへ在籍状態（notListed）を渡していない。');
  }
  // 口コミ一覧も同じ列を取っていること
  const pop = strip(read('src/pages/PopularReviewsPage.jsx'));
  if ((pop.match(/select=id,name,image_url,shop_id,is_active/g) || []).length < 2) {
    violations.push('[U05] 口コミ一覧の人物取得が is_active を取っていない（2箇所とも必要）。');
  }
}

// ── 初期画面と件数表示（2026-09-09の実測で判明）─────────────────────────────
{
  const strip = (src) => (src || '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  // U02: 390×844の初期画面に「特典・登録CTA・検索操作」が入る。
  // 実測で検索欄が851px（7pxはみ出し）だった原因は、補助文2行を検索欄の**上**に置いていたこと。
  const home = strip(read('src/pages/Home.jsx'));
  const noteIdx = home.indexOf('閲覧期間は登録手続き時から3日間です。メール確認後に利用できます。自動課金はありません');
  const searchIdx = home.indexOf('<SearchBar />');
  if (noteIdx >= 0 && searchIdx >= 0 && noteIdx < searchIdx) {
    violations.push('[U02] ホームの補助文が検索欄より前にある。2行ぶん押し下げて390×844の初期画面から検索操作が外れる。');
  }
  // 計測が確実にカード内のCTAを掴めるようにする（ヘッダーの登録ボタンを誤って掴むと判定が死ぬ）
  // ⚠️ 目印はクラス名で代用しない。`.ui-help` で拾ったら注記を掴んで判定が狂った（2026-09-09、2度目）。
  for (const [attr, label] of [['data-cta="home-register"', '登録CTA'], ['data-role="home-benefit"', '特典の一文']]) {
    if (!home.includes(attr)) {
      violations.push(`[U02] ホームの${label}の目印（${attr}）が無い。初期画面の自動判定が効かなくなる。`);
    }
  }

  // 取得上限の数字を「件数」として出さない
  // 🚩「キャスト 1000件」は実際の母数ではなく `.limit(1000)` そのものだった。
  //   2026-08-05にサイトマップが1,000件で切れて98店欠落したのと同じ型の誤り。
  const search = strip(read('src/pages/SearchPage.jsx'));
  if (!/const \[resultCapped, setResultCapped\]/.test(search)) {
    violations.push('[U05] 検索が取得上限に達したかを持っていない（上限の数字を件数として表示してしまう）。');
  }
  if (!/resultCapped \? '以上' : ''/.test(search)) {
    violations.push('[U05] 検索の件数表示が上限到達時に「以上」を付けていない。');
  }
}

if (violations.length) {
  console.error('\n🚨 オーナー確定事項（playbook/decisions.md）に反する変更が検出されました:\n');
  violations.forEach((v) => console.error('  - ' + v + '\n'));
  console.error('技術的に正しく見えても、実装せず okabayashi に確認してください。\n');
  process.exit(1);
}

console.log('✅ デザイン決定事項チェック OK');
