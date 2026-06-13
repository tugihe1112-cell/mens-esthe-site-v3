-- ============================================================
-- P0: 口コミ成長エンジン（2026-06-13）
-- ① reviews.is_public — 各セラピストの口コミ1件目を全公開（メタードペイウォール）
-- ② 閲覧権の自動付与 — 700文字以上の投稿で即時7日間（手動審査→自動化）
-- ⚠️ Supabase ダッシュボード → SQL Editor で実行すること
-- ============================================================

-- ① is_public カラム追加
alter table reviews add column if not exists is_public boolean not null default false;

-- 既存データのバックフィル: セラピスト（shop_id × therapist_name）ごとの最古1件を公開
with firsts as (
  select distinct on (shop_id, therapist_name) id
  from reviews
  where therapist_name is not null and therapist_name <> ''
  order by shop_id, therapist_name, created_at asc
)
update reviews set is_public = true where id in (select id from firsts);

-- 新規投稿時: そのセラピストの1件目なら自動で公開フラグを立てる
create or replace function set_first_review_public()
returns trigger language plpgsql security definer as $$
begin
  if NEW.therapist_name is not null and NEW.therapist_name <> '' then
    if not exists (
      select 1 from reviews
      where shop_id = NEW.shop_id and therapist_name = NEW.therapist_name
    ) then
      NEW.is_public := true;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_review_insert_set_public on reviews;
create trigger on_review_insert_set_public
  before insert on reviews
  for each row execute function set_first_review_public();

-- ② 閲覧権の自動付与（実ユーザー × 700文字以上 → 7日間）
--    管理者の事後監査は /admin + notify-review メールで継続
create or replace function auto_grant_credits_on_review()
returns trigger language plpgsql security definer as $$
declare
  days_to_add integer := 7;
begin
  -- user_id がUUID形式（実ユーザー）かつ本文700文字以上のみ対象
  -- （owner_manual / menesthe_import 等のシステムIDは対象外）
  if NEW.user_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
     and length(coalesce(NEW.content, '')) >= 700 then
    insert into user_credits (user_id, credits_days, expires_at, total_reviews_posted, updated_at)
    values (NEW.user_id::uuid, days_to_add, now() + (days_to_add || ' days')::interval, 1, now())
    on conflict (user_id) do update set
      credits_days = user_credits.credits_days + days_to_add,
      expires_at = greatest(coalesce(user_credits.expires_at, now()), now()) + (days_to_add || ' days')::interval,
      total_reviews_posted = user_credits.total_reviews_posted + 1,
      updated_at = now();
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_review_insert_grant_credits on reviews;
create trigger on_review_insert_grant_credits
  after insert on reviews
  for each row execute function auto_grant_credits_on_review();
