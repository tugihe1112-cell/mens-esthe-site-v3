import React from "react";
import { Link } from '../compat/router';
import { AREA_LINKS } from '../data/areaLinks';
import stats from '../data/stats-latest.json';

/**
 * フッターは2形態（2026-08-17）:
 *  - full   … ホームのみ。ブランド文・SERVICE/LEGAL・都道府県リンク集を出す
 *  - minimal… ホーム以外の全ページ。法務リンクと年齢表記だけの1帯
 *
 * ⚠️ なぜ minimal を残すのか（完全削除しなかった理由）:
 *    特定商取引法に基づく表記・利用規約・プライバシーポリシーは、どのページからでも
 *    到達できる状態にしておく必要がある（法務・決済導入時の要件）。
 *    ただしユーザーの指摘どおり、全ページに大きなフッターを出す必要は無いので
 *    「読む邪魔にならない1行」まで削った。完全に消したい場合はここを null にすればよい。
 *
 * ⚠️ SEOについて: 都道府県リンク集をホーム限定にしても、/area/* への内部リンクは
 *    ホーム（最高PageRankかつ唯一インデックスされているページ）から張られ続ける。
 *    全ページ共通のボイラープレート・リンクは元々評価が低いため、影響は小さい。
 */
export default function Footer({ variant = 'full' }) {
  const totalShops = stats?.coverage?.totalShops || 0;
  const totalTherapists = stats?.coverage?.totalTherapists || 0;

  if (variant === 'minimal') {
    return (
      <footer className="bg-slate-950 border-t border-white/5 mt-10 relative z-10 pb-20 md:pb-4">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
            <Link to="/legal" className="hover:text-pink-400 transition">特定商取引法に基づく表記</Link>
            <Link to="/terms" className="hover:text-pink-400 transition">利用規約</Link>
            <Link to="/privacy" className="hover:text-pink-400 transition">プライバシーポリシー</Link>
            <Link to="/contact" className="hover:text-pink-400 transition">お問い合わせ</Link>
          </div>
          <p className="mt-3 text-center text-[10px] text-slate-600">
            © {new Date().getFullYear()} メンエスマップ ／ 18歳未満の方のアクセスを固く禁じます
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-slate-950 border-t border-white/5 mt-10 md:mt-20 relative z-10 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* スマホは SERVICE / LEGAL を横2列に。従来は全部が縦1列で、
            リンク8本ぶんスクロールが伸びるだけの退屈な帯になっていた。
            ⚠️ min-w-0 必須（2026-08-17 追加）: gridの列は既定で min-width:auto のため、
               「特定商取引法に基づく表記」のような長い項目が列を押し広げ、
               2列の合計がビューポートを超えて**横スクロールが発生**していた。
               その結果 max-w-2xl mx-auto 等の中央寄せが狂い、実機で右端の文字が切れていた。 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8 mb-10">

          <div className="col-span-2 min-w-0">
            <h3 className="text-2xl font-black mb-4 tracking-tight">
              <span className="text-white">メンエス</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                マップ
              </span>
            </h3>
            {/* 中立宣言＝このサイト唯一の差別化。Homeの帯と同じ文言で統一 */}
            <p className="text-sm text-slate-300 leading-relaxed mb-4 max-w-sm font-bold">
              掲載店舗から広告費・掲載料を一切受け取っていません。<br />
              だから★2の辛口もそのまま載せます。
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              全国{totalShops.toLocaleString()}店舗・在籍{totalTherapists.toLocaleString()}人のメンズエステを掲載。セラピスト別の口コミ・出勤・料金を検索できます。
              <Link to="/stats" className="text-slate-400 hover:text-pink-400 underline ml-1">
                掲載データの詳細（メンズエステ統計2026）→
              </Link>
            </p>
          </div>

          <div className="min-w-0">
            <h4 className="text-white font-bold mb-4 tracking-widest text-xs">SERVICE</h4>
            <ul className="space-y-3 text-sm font-medium break-words">
              <li><Link to="/" className="text-slate-400 hover:text-pink-400 transition">ホーム</Link></li>
              <li><Link to="/search" className="text-slate-400 hover:text-pink-400 transition">キャスト検索</Link></li>
              <li><Link to="/stats" className="text-slate-400 hover:text-pink-400 transition">メンズエステ統計2026</Link></li>
              <li><Link to="/post-review" className="text-slate-400 hover:text-pink-400 transition">口コミを書く（読み放題）</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-pink-400 transition">お問い合わせ</Link></li>
            </ul>
          </div>

          <div className="min-w-0">
            <h4 className="text-white font-bold mb-4 tracking-widest text-xs">LEGAL</h4>
            <ul className="space-y-3 text-sm font-medium break-words">
              <li><Link to="/legal" className="text-slate-400 hover:text-pink-400 transition">特定商取引法に基づく表記</Link></li>
              <li><Link to="/terms" className="text-slate-400 hover:text-pink-400 transition">利用規約</Link></li>
              <li><Link to="/privacy" className="text-slate-400 hover:text-pink-400 transition">プライバシーポリシー</Link></li>
            </ul>
          </div>

        </div>

        {/* エリア別リンク（内部リンク構造・SEO用）
            ⚠️ 以前は「東京都のメンズエステ」という長い文字列を16個並べており、
               スマホで画面ほぼ1枚ぶんを、同じ語尾の繰り返しが占領していた。
               「のメンズエステ」を小さい副次テキストに落として都道府県名を主役にし、
               3列グリッドに整列させる。**アンカーテキストは "東京都メンズエステ" のまま**
               維持されるので、索引復旧のために効いている内部リンクのSEO価値は落ちない。 */}
        <div className="border-t border-white/5 pt-8 mb-8">
          {/* ⚠️ ホーム本文にも「エリアから探す」があり、1ページに同名の見出しが2つ並んでいた
                 （2026-08-17 改名）。こちらは全ページ共通の都道府県リンク集なので役割で呼び分ける。 */}
          <h4 className="text-white font-bold mb-4 tracking-widest text-xs">都道府県から探す</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {AREA_LINKS.map(({ slug, label }) => (
              <Link
                key={slug}
                to={`/area/${slug}`}
                className="group flex flex-col items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-pink-500/40 transition px-2 py-2.5 text-center"
              >
                <span className="text-xs font-bold text-slate-200 group-hover:text-pink-400 transition leading-tight truncate w-full">{label}</span>
                <span className="text-[10px] text-slate-600 leading-tight mt-0.5">メンズエステ</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-bold tracking-wider">
            &copy; {new Date().getFullYear()} メンエスマップ. All rights reserved.
          </p>
          <div className="text-[10px] text-slate-600 font-bold border border-slate-800 px-3 py-1 rounded">
            18歳未満の方のアクセスを固く禁じます
          </div>
        </div>
      </div>
    </footer>
  );
}
