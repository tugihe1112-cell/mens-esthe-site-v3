import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  // バックアップ保存用のフォルダを作成
  const backupDir = './database_backups';
  if (!fs.existsSync(backupDir)){
      fs.mkdirSync(backupDir);
  }

  // 保存するテーブルのリストと、ファイル名につけるタイムスタンプ
  const tables = ['shops', 'therapists', 'reviews'];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  try {
    console.log(`💾 データベースのセーブ（バックアップ）を開始します...\n`);

    for (const table of tables) {
      let allData = [];
      let offset = 0;
      const limit = 1000;
      let hasMore = true;

      console.log(`⏳ ${table} テーブルのデータを取得中...`);

      // 1000件制限を回避して全データを取得するループ
      while (hasMore) {
        const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`, { headers });
        if (!res.ok) throw new Error(`${table} の取得に失敗: ${res.statusText}`);
        const data = await res.json();

        allData = allData.concat(data);
        if (data.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }

      // JSONファイルとして書き出し
      const filePath = `${backupDir}/${table}_backup_${timestamp}.json`;
      fs.writeFileSync(filePath, JSON.stringify(allData, null, 2), 'utf-8');
      console.log(`   ✅ ${table} のセーブ完了 (${allData.length}件): ${filePath}`);
    }

    console.log(`\n🎊 すべてのデータのセーブが完了しました！`);
    console.log(`📂 プロジェクト内の '${backupDir}' フォルダに保存されています。これで安全に次の作業に進めます。`);

  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  }
}

run();
