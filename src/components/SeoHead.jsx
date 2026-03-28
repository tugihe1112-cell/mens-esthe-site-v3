import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_TITLE = "メンエスガイド";

export default function SeoHead({ title, description, path }) {
  const pageTitle = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE;
  const pageDesc = description || "厳選されたメンズエステ店舗とセラピストを検索できるポータルサイトです。";
  const url = path ? `https://your-domain.com${path}` : "https://your-domain.com";

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
    </Helmet>
  );
}
