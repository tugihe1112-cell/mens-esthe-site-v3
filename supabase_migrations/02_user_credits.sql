-- ① user_credits テーブル（閲覧日数管理）
create table if not exists user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits_days integer default 0,        -- 残り閲覧日数
  expires_at timestamptz,                -- 閲覧期限
  total_reviews_posted integer default 0, -- 累計投稿数
  updated_at timestamptz default now()
);

alter table user_credits enable row level security;
create policy "自分のクレジットのみ閲覧" on user_credits for select using (auth.uid() = user_id);
create policy "自分のクレジットのみ更新" on user_credits for update using (auth.uid() = user_id);
create policy "insert自分のみ" on user_credits for insert with check (auth.uid() = user_id);

-- ② 口コミ投稿時に閲覧日数を付与するトリガー
-- （投稿の文字数に応じて7〜25日付与）
create or replace function grant_credits_on_review()
returns trigger language plpgsql security definer as $$
declare
  content_len integer;
  days_to_add integer;
begin
  content_len := length(NEW.content);
  -- 文字数で日数決定
  if content_len >= 600 then
    days_to_add := 25;
  elsif content_len >= 300 then
    days_to_add := 15;
  elsif content_len >= 100 then
    days_to_add := 7;
  else
    days_to_add := 3;
  end if;

  insert into user_credits (user_id, credits_days, expires_at, total_reviews_posted, updated_at)
  values (
    NEW.user_id::uuid,
    days_to_add,
    now() + (days_to_add || ' days')::interval,
    1,
    now()
  )
  on conflict (user_id) do update set
    credits_days = user_credits.credits_days + days_to_add,
    expires_at = greatest(user_credits.expires_at, now()) + (days_to_add || ' days')::interval,
    total_reviews_posted = user_credits.total_reviews_posted + 1,
    updated_at = now();

  return NEW;
end;
$$;

drop trigger if exists on_review_insert_grant_credits on reviews;
create trigger on_review_insert_grant_credits
  after insert on reviews
  for each row execute function grant_credits_on_review();
