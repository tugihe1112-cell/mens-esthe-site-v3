/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // VITE_ 環境変数をそのままブラウザに公開（.envファイルの変数名変更不要）
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    VITE_PUBLIC_SITE_URL: process.env.VITE_PUBLIC_SITE_URL,
  },

  // 画像ドメイン許可
  images: {
    domains: [
      'azuetkuzzmshqfbrhqmf.supabase.co',
      'cdn2-caskan.com',
      'files.re-db.com',
      'imagedelivery.net',
    ],
    unoptimized: true, // 既存の LazyImage が Supabase Image Transform を使っているためオフ
  },

  // /api/ はVercelサーバーレス関数として残す（既存のapi/*.jsをそのまま使用）
  // Next.js の pages/api/ と競合しないよう注意

  // Tailwind等のトランスパイル対象
  transpilePackages: [],
};

module.exports = nextConfig;
