echo -e "\033[1;36m=== 1. 致命的なキー漏洩の確認 (Service Role Keyのフロントエンド混入) ===\033[0m"
grep -rn "SUPABASE_SERVICE_ROLE_KEY\|service_role\|service-role" src/ 2>/dev/null || echo "✅ フロントエンドコード内に特権キーの直接記述は見つかりませんでした。"
grep -rn "VITE_SUPABASE_SERVICE_ROLE_KEY" .env* 2>/dev/null || echo "✅ .envにVITE_プレフィックスでの特権キー露出は見つかりませんでした。"

echo -e "\n\033[1;36m=== 2. APIコールのN+1問題チェック (ループ内でのデータフェッチ) ===\033[0m"
grep -rn "map(.*=>.*fetch\|map(.*=>.*supabase" src/ 2>/dev/null || echo "✅ mapループ内での明らかなAPIコール（N+1）は見つかりませんでした。"

echo -e "\n\033[1;36m=== 3. 肥大化コンポーネントのuseEffect暴走チェック (SearchPage.jsx) ===\033[0m"
grep -rn -A 2 -B 2 "useEffect" src/pages/SearchPage.jsx 2>/dev/null | head -n 25 || echo "⚠️ SearchPage.jsx が見つかりませんでした。"

echo -e "\n\033[1;36m=== 4. ホスティング環境の特定 (各種設定ファイルの有無) ===\033[0m"
ls -la netlify.toml wrangler.toml firebase.json render.yaml 2>/dev/null || echo "主要なホスティング設定ファイルは見つかりませんでした。"
