import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  ...nextVitals,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // 外部R2画像を独自の失敗時リトライ付きLazyImageで扱うため、next/imageへ
      // 機械的に置換しない。外部画像の配信健全性は日次監視で別途保証する。
      '@next/next/no-img-element': 'off',
      // React Compilerは未導入。React 19の新しいCompiler向け推奨ルールを
      // 既存の正常な副作用処理へ遡及適用せず、Rules of Hooksと依存配列検査は維持する。
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'dist/**',
    'public/**',
    'src/_archive/**',
    '_archive/**',
    'scripts/archive/**',
    'scripts/_old/**',
    'audit/**',
    '**/*.bak_*',
    '**/*.backup*',
  ]),
]);
