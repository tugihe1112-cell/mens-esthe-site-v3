import React from "react";
import { Link } from '../compat/router';
import { AREA_LINKS } from '../data/areaLinks';
import stats from '../data/stats-2026-07.json';

export default function Footer() {
  const totalShops = stats?.coverage?.totalShops || 0;
  const totalTherapists = stats?.coverage?.totalTherapists || 0;

  return (
    <footer className="bg-slate-950 border-t border-white/5 mt-20 relative z-10 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

          <div className="md:col-span-2">
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

          <div>
            <h4 className="text-white font-bold mb-4 tracking-widest text-xs">SERVICE</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/" className="text-slate-400 hover:text-pink-400 transition">ホーム</Link></li>
              <li><Link to="/search" className="text-slate-400 hover:text-pink-400 transition">キャスト検索</Link></li>
              <li><Link to="/stats" className="text-slate-400 hover:text-pink-400 transition">メンズエステ統計2026</Link></li>
              <li><Link to="/post-review" className="text-slate-400 hover:text-pink-400 transition">口コミを書く（読み放題）</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-pink-400 transition">お問い合わせ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 tracking-widest text-xs">LEGAL</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/legal" className="text-slate-400 hover:text-pink-400 transition">特定商取引法に基づく表記</Link></li>
              <li><Link to="/terms" className="text-slate-400 hover:text-pink-400 transition">利用規約</Link></li>
              <li><Link to="/privacy" className="text-slate-400 hover:text-pink-400 transition">プライバシーポリシー</Link></li>
            </ul>
          </div>

        </div>

        {/* エリア別リンク（内部リンク構造・SEO用） */}
        <div className="border-t border-white/5 pt-8 mb-8">
          <h4 className="text-white font-bold mb-4 tracking-widest text-xs">エリアから探す</h4>
          <div className="flex flex-wrap gap-2">
            {AREA_LINKS.map(({ slug, label }) => (
              <Link
                key={slug}
                to={`/area/${slug}`}
                className="text-xs text-slate-400 hover:text-pink-400 transition bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-white/5"
              >
                {label}のメンズエステ
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
