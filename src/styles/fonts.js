// サイトの書体（2026-09-30・デザインA案「夜の文芸誌」）
//
// ⚠️ next/font で読み込む＝ビルド時にフォントを取ってきて**自分のドメインから配信**する。
//    Google Fonts を直接 <link> で読むと CSP（font-src 'self' data:）に止められるうえ、
//    別のドメインへの接続が1本増えて最初の表示が遅くなる。
// ⚠️ 本文には使わない（本文は端末に入っている日本語の書体のまま）。日本語のWebフォントは
//    1文字の範囲ごとにファイルが分かれていて、本文まで明朝にすると読み込みが何十本にも増える。
//    明朝は**見出しだけ・太さ1種類**に絞る。数字の書体は欧文だけなので軽い。
// ⚠️ preload: false＝日本語の書体は「どの文字範囲が要るか」を事前に決められないので先読みしない。
//    display: 'swap'＝読み込み中は代わりの明朝で先に表示する（文字を消さない）。
// ⚠️ 見出しの書体の並びは**端末の明朝が先**（index.css・tailwind.config.js）。この配信の明朝は、
//    明朝を持たない端末（Android など）のためだけに読まれる。配信を先にすると1ページ 270〜450KB 増えた。
import { Shippori_Mincho_B1, Cormorant_Garamond } from 'next/font/google';

export const mincho = Shippori_Mincho_B1({
  weight: ['700'],
  subsets: ['latin'],
  preload: false,
  display: 'swap',
  fallback: ['Hiragino Mincho ProN', 'Yu Mincho', 'YuMincho', 'Noto Serif JP', 'serif'],
});

// 斜体は使う画面ができてから足す（1つ足すごとにファイルが1本増える）
export const numeral = Cormorant_Garamond({
  weight: ['500', '600'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});
