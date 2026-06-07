echo -e "\033[1;36m=== 1. XSS脆弱性の確認 (dangerouslySetInnerHTMLの検出) ===\033[0m"
grep -rn "dangerouslySetInnerHTML" . --exclude-dir=node_modules --exclude-dir=.git || echo "✅ dangerouslySetInnerHTML は見つかりませんでした。"

echo -e "\n\033[1;36m=== 2. Supabase Storageの利用状況 (フロントエンドからの呼び出し) ===\033[0m"
grep -rn "supabase\.storage" . --exclude-dir=node_modules --exclude-dir=.git || echo "✅ フロントエンドからのStorage直接操作は見つかりませんでした。"

echo -e "\n\033[1;36m=== 3. Supabase StorageのRLSポリシー定義 (SQLファイル内の検索) ===\033[0m"
grep -rn -i "storage\.objects\|bucket_id" . --exclude-dir=node_modules --exclude-dir=.git || echo "⚠️ StorageのRLS（SQL）は見つかりませんでした。"

echo -e "\n\033[1;36m=== 4. SEO設定の現状確認 (index.html の head タグ) ===\033[0m"
if [ -f "index.html" ]; then
  cat index.html | grep -A 15 "<head>"
else
  echo "⚠️ index.html が見つかりません。"
fi

echo -e "\n\033[1;36m=== 5. Viteのビルド・SSR設定確認 (vite.config.js / ts) ===\033[0m"
if [ -f "vite.config.js" ]; then
  cat vite.config.js
elif [ -f "vite.config.ts" ]; then
  cat vite.config.ts
else
  echo "⚠️ vite.config.js / ts が見つかりません。"
fi
