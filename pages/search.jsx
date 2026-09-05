/**
 * /search — キャスト・店舗検索（SSRラッパー）
 *
 * ⚠️ 以前は src/pages/SearchPage の素の再exportで、canonical は SeoHead
 *    （react-helmet-async＝クライアント注入）からしか出ていなかった。
 *    Pages Router では helmet のタグは初期HTMLに乗らないため、Googlebot が
 *    JSを実行しない一次クロールでは canonical が存在しない状態だった。
 *    → next/head で SSR 時点から canonical を固定出力する。
 *
 *    さらに /search?shop=... /search?cast=... /search?shopId=... は
 *    同じ実体の無限バリエーション（クエリの組み合わせ数だけURLが生える）なので、
 *    クエリ付きは noindex,follow にしてクロール予算を素の /search と
 *    店舗ページ側に寄せる（follow は残すのでリンクは辿られる）。
 */
import React from 'react';
import Head from 'next/head';
import SearchPage from '../src/pages/SearchPage';
import SeoHead from '../src/components/SeoHead';

export async function getServerSideProps({ query, res }) {
  // ⚠️ stale-while-revalidate は 300 以下（CIガードで300超はビルド失敗）。
  //    Next.js はデプロイ毎にビルドIDが変わり旧JSチャンクが消えるため、
  //    HTMLを長く stale にすると「消えたJSを指す真っ黒ページ」事故が再発する。
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  const hasQuery = Object.keys(query || {}).length > 0;
  return { props: { hasQuery } };
}

export default function SearchSSRPage({ hasQuery }) {
  return (
    <>
      <SeoHead
        title="キャスト検索"
        description="セラピスト名・店舗名でメンズエステを検索。出勤スケジュール・体験口コミ・料金を一括確認できます。全国580店舗以上対応。"
        path="/search"
      />
      <Head>
        {hasQuery && <meta name="robots" content="noindex,follow" />}
      </Head>
      <SearchPage renderSeo={false} />
    </>
  );
}
