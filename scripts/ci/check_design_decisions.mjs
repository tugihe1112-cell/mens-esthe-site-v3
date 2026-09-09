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
    if (!/TAG_CATEGORIES/.test(src)) {
      violations.push(
        `[D-001] ${p} からタグ絞り込みサイドバー（TAG_CATEGORIES）が消えている。\n` +
        `        SearchPageと同じ左サイドバー構成を維持すること。`
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

    // (a) 📍 の直後に店舗フィールドを直書きしている＝データが空だとピンだけ残る
    if (/📍\s*\{\s*shop\./.test(codeOnly)) {
      violations.push(
        `[D-009] ${p} が「📍 {shop.xxx}」を直書きしている。\n` +
        `        住所が無い店舗が614店（全体の56%）あり、ピンだけが宙に浮く。\n` +
        `        → <LocationLabel parts={[shop.prefecture, shop.city]} /> を使うこと\n` +
        `          （中身が空なら要素ごと描画されない。呼び出し側の条件分岐は不要）。`
      );
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
    // U02下部2: 地域別は select で1地域ずつ。全県を縦に並べる形へ戻さない。
    if (!home.includes('home-pref-select')) {
      violations.push('[U02] ホームの地域別口コミが select（口コミの地域）を失っている。全県を縦積みに戻さない。');
    }
    if (!/\.slice\(0,\s*2\)/.test(home)) {
      violations.push('[U02] ホームの地域別口コミが最大2件に絞られていない。');
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

if (violations.length) {
  console.error('\n🚨 オーナー確定事項（playbook/decisions.md）に反する変更が検出されました:\n');
  violations.forEach((v) => console.error('  - ' + v + '\n'));
  console.error('技術的に正しく見えても、実装せず okabayashi に確認してください。\n');
  process.exit(1);
}

console.log('✅ デザイン決定事項チェック OK');
