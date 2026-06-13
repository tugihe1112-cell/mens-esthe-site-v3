import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/icon-192.png" />
        {/* Google Search Console */}
        <meta name="google-site-verification" content="anNOZN2xei4Sb_JnJNpsLGSVtx00wOnuz7pw1szbTV8" />
        {/* Supabase preconnect */}
        <link rel="preconnect" href="https://azuetkuzzmshqfbrhqmf.supabase.co" />
        <link rel="dns-prefetch" href="https://azuetkuzzmshqfbrhqmf.supabase.co" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
