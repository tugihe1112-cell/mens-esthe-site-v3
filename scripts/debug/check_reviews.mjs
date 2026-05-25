import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('/sessions/keen-relaxed-allen/mnt/mens-esthe-site/.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data, error } = await supabase
  .from('reviews')
  .select('id, therapist_name, content, rating, detailed_ratings, tags, user_id')
  .eq('user_id', 'menesthe_rewritten')
  .limit(5);

if (error) { console.error(error.message); process.exit(1); }

for (const r of data) {
  console.log('='.repeat(60));
  console.log(`ID: ${r.id}`);
  console.log(`セラピスト: ${r.therapist_name}`);
  console.log(`rating: ${r.rating}`);
  console.log(`tags: ${JSON.stringify(r.tags)}`);
  console.log(`detailed_ratings: ${JSON.stringify(r.detailed_ratings)}`);
  console.log(`content:\n${r.content}`);
  console.log();
}
