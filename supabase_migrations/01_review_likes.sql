-- ① review_likes テーブル
create table if not exists review_likes (
  id uuid primary key default gen_random_uuid(),
  review_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(review_id, user_id)
);

alter table review_likes enable row level security;
create policy "誰でも閲覧可" on review_likes for select using (true);
create policy "ログイン済みユーザーがいいね" on review_likes for insert with check (auth.uid() = user_id);
create policy "自分のいいねを削除可" on review_likes for delete using (auth.uid() = user_id);

-- ② reviews に like_count カラム追加
alter table reviews add column if not exists like_count integer default 0;

-- ③ トリガーで自動カウント
create or replace function update_review_like_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update reviews set like_count = like_count + 1 where id::text = NEW.review_id;
  elsif TG_OP = 'DELETE' then
    update reviews set like_count = greatest(like_count - 1, 0) where id::text = OLD.review_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_review_like_change on review_likes;
create trigger on_review_like_change
  after insert or delete on review_likes
  for each row execute function update_review_like_count();
