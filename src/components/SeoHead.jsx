import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const SITE_TITLE = "メンエスマップ";
const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-image.jpg`;

export default function SeoHead({ title, description, path, image, noindex = false }) {
  const router = useRouter();
  const pageTitle = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE;
  const pageDesc = description || "全国のメンズエステ店舗・セラピストを検索し、料金・出勤情報や利用者の口コミ・体験談を比較できるポータルサイトです。";
  // pathを渡していない静的ページも、トップへ誤canonical化しない。
  // React HelmetはNext.jsのSSRへ出力されず、一覧・統計・規約などの<title>が
  // 空になっていたため、Next Headへ一本化する。
  const currentPath = String(router?.asPath || '/').split(/[?#]/)[0] || '/';
  const canonicalPath = path || currentPath;
  const url = canonicalPath === '/' ? SITE_URL : `${SITE_URL}${canonicalPath}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} key="description" />
      {noindex && <meta name="robots" content="noindex,nofollow" key="robots" />}
      <meta property="og:title" content={pageTitle} key="og:title" />
      <meta property="og:description" content={pageDesc} key="og:description" />
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:image" content={ogImage} key="og:image" />
      <meta property="og:image:width" content="1200" key="og:image:width" />
      <meta property="og:image:height" content="630" key="og:image:height" />
      <meta property="og:site_name" content={SITE_TITLE} key="og:site_name" />
      <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta name="twitter:title" content={pageTitle} key="twitter:title" />
      <meta name="twitter:description" content={pageDesc} key="twitter:description" />
      <meta name="twitter:image" content={ogImage} key="twitter:image" />
      {!noindex && <link rel="canonical" href={url} key="canonical" />}
    </Head>
  );
}
