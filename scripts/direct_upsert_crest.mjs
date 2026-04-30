import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const htmlContent = `
<main class="priority noHome">
  <section class="staffsView">
    <div class="todayStaffList">
      ${`
        `}
    </div>
  </section>
</main>
`;

// ユーザーがチャットに貼ったHTMLを直接パース
const fullHtml = `
<main class="priority noHome">
  ${fs.readFileSync(path.resolve('scripts/temp_html.txt'), 'utf-8')}
</main>
`;

async function main() {
  // ...解析と登録のロジック
}
