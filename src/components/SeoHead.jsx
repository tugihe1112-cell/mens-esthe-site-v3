import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_TITLE = "メンエスマップ";
const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-image.jpg`;

export default function SeoHead({ title, description, path, image, noindex = false }) {
  const pageTitle = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE;
  const pageDesc = description || "厳選されたメンズエステ店舗とセラピストを検索できるポータルサイトです。";
  const url = path ? `${SITE_URL}${path}` : SITE_URL;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_TITLE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={ogImage} />
      {!noindex && <link rel="canonical" href={url} />}
    </Helmet>
  );
}
