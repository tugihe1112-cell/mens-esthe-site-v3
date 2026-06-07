echo -e "\033[1;36m=== 1. DataContext (状態管理のブラックボックス) ===\033[0m"
cat src/contexts/DataContext.jsx 2>/dev/null || cat src/contexts/DataContext.js 2>/dev/null || echo "⚠️ DataContext が見つかりません"

echo -e "\n\033[1;36m=== 2. AuthContext (認証フローとセキュリティ) ===\033[0m"
cat src/contexts/AuthContext.jsx 2>/dev/null || cat src/contexts/AuthContext.js 2>/dev/null || echo "⚠️ AuthContext が見つかりません"

echo -e "\n\033[1;36m=== 3. App.jsx (ルーティングと初期ロードの設計) ===\033[0m"
cat src/App.jsx 2>/dev/null || cat src/App.tsx 2>/dev/null || cat src/main.jsx 2>/dev/null || echo "⚠️ App.jsx が見つかりません"

echo -e "\n\033[1;36m=== 4. sync_all_data.cjs (データ同期の心臓部) ===\033[0m"
cat scripts/sync_all_data.cjs 2>/dev/null || echo "⚠️ sync_all_data.cjs が見つかりません"
