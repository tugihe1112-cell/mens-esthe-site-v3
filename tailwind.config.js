/** @type {import('tailwindcss').Config} */

// ── デザインA案「夜の文芸誌」の色（2026-09-30・オーナー選択） ─────────────────────────
// サイト全体の slate（1,200か所以上）・pink（550か所以上）を**クラス名はそのままに中身だけ**置き換える。
// 画面を1枚ずつ書き直すと何週間も新旧の色が混ざるので、色の決まりを1か所で差し替える。
//   ink（墨）＝背景と面・paper（生成り）＝文字・shu（朱）＝差し色は1色だけ。
// ⚠️ 明るさは読みやすさの基準で決めてある（勝手に暗く/明るくしない）:
//   slate-500 #8A8277 は slate-900 の上で 4.6:1・slate-950 の上で 5.0:1（小さい文字の基準 4.5:1 以上）。
//   pink-600 #C9502F は白文字で 4.5:1（ボタン）。pink-400 #EA8364 は slate-950 の上で 7:1（文字の差し色）。
//   pink-500 #E0613F の白文字は 3.5:1＝置き換える前の pink-500 と同じ（悪くしていない）。
const ink = {
  50: '#F7F3EC', 100: '#EEE7DB', 200: '#DCD4C7', 300: '#CFC7BA', 400: '#A69E92',
  500: '#8A8277', 600: '#5C5561', 700: '#3A3440', 800: '#26222C', 850: '#201D26',
  900: '#1B1820', 950: '#121016',
};
const shu = {
  50: '#FCEEE9', 100: '#F9DCD2', 200: '#F4C2B2', 300: '#F2B8A6', 400: '#EA8364',
  500: '#E0613F', 600: '#C9502F', 700: '#A8412A', 800: '#843422', 900: '#5E2618', 950: '#3A170E',
};
// 紫・ばら色も朱の濃淡へ（「ピンク→紫」のグラデーションが「朱→深い朱」になり、差し色が1色に保たれる）
const shuDeep = {
  50: '#FBF1EC', 100: '#F7E3DB', 200: '#F0CBBE', 300: '#E7AE9B', 400: '#D98B73', 500: '#B8503A',
  600: '#9E4230', 700: '#7E3426', 800: '#5E271C', 900: '#3F1A13', 950: '#26100B',
};

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // スマホでリンクをタップしたあと hover の色が residual に残る問題への対処。
  // 実機スクショで、フッターの「群馬県」だけがピンクのまま固まっていた（押した記憶がなくても
  // スクロール中に一瞬触れると残る）。これを付けると hover: が
  // @media (hover: hover) で囲まれ、タッチ端末では発火しなくなる。サイト全体に効く。
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'system-ui', '-apple-system', 'BlinkMacSystemFont',
          'Hiragino Sans', 'Hiragino Kaku Gothic ProN',
          'Noto Sans JP', 'Yu Gothic', 'Meiryo',
          'sans-serif',
        ],
        // 見出し（明朝）と数字（欧文のセリフ）。変数は pages/_app.jsx が :root に置く（src/styles/fonts.js）
        // ⚠️ 端末の明朝を先に（index.css の見出しと同じ理由＝配信の明朝は持たない端末のためだけ）
        mincho: ['Hiragino Mincho ProN', 'Hiragino Mincho Pro', 'Yu Mincho', 'YuMincho', 'var(--font-mincho)', 'serif'],
        numeral: ['var(--font-numeral)', 'Georgia', 'serif'],
      },
      colors: {
        slate: ink,
        gray: ink,
        pink: shu,
        rose: shu,
        purple: shuDeep,
        fuchsia: shuDeep,
        violet: shuDeep,
        indigo: shuDeep,
        // 新しく書くところはこちらの名前で（意味が読める名前）
        ink,
        shu,
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in-from-bottom': 'slideInFromBottom 0.5s ease-out forwards',
        'slide-in-from-top': 'slideInFromTop 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        }
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};
