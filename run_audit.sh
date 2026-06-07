echo -e "\033[1;36m=== 1. codebase内の直接参照を検索 (node_modules, .git 除外) ===\033[0m"
grep -rn "sync_all_data.cjs" . --exclude-dir=node_modules --exclude-dir=.git

echo -e "\n\033[1;36m=== 2. npm scripts経由の呼び出し (npm run sync / yarn sync) を検索 ===\033[0m"
grep -rn "npm run sync\|yarn sync" . --exclude-dir=node_modules --exclude-dir=.git

echo -e "\n\033[1;36m=== 3. GitHub Actions (CI/CD) のCronジョブ定義を検索 ===\033[0m"
if [ -d ".github/workflows" ]; then
  grep -rni "cron\|sync" .github/workflows/
else
  echo "⚠️ .github/workflows ディレクトリが存在しません。"
fi

echo -e "\n\033[1;36m=== 4. Vercel の Cron設定 (vercel.json) を検索 ===\033[0m"
if [ -f "vercel.json" ]; then
  cat vercel.json | grep -A 5 -B 2 -i "crons" || echo "vercel.json に crons 設定が見当たりません。"
else
  echo "⚠️ vercel.json が存在しません。"
fi

echo -e "\n\033[1;36m=== 5. PM2 ecosystem config などの常駐プロセス設定を検索 ===\033[0m"
find . -maxdepth 2 \( -name "ecosystem.config.js" -o -name "ecosystem.config.cjs" \) -exec grep -Hni "sync" {} + || echo "PM2の設定ファイルが見当たりません。"

echo -e "\n\033[1;36m=== 6. Supabase の pg_cron / Edge Functions の設定を検索 ===\033[0m"
if [ -d "supabase" ]; then
  grep -rni "cron\|sync_all_data" supabase/
else
  echo "⚠️ supabase ディレクトリが存在しません。"
fi
