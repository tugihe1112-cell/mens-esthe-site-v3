-- ============================================================
-- 投稿摩擦の低減（2026-06-25）
-- 閲覧権付与を段階制に：200字以上 → 3日 / 700字以上 → 7日
-- （フォームの最低ラインを 700→200 に下げたことと連動。長文ほど報酬を大きくして誘導）
-- ⚠️ Supabase ダッシュボード → SQL Editor で実行すること
-- ============================================================

create or replace function auto_grant_credits_on_review()
returns trigger language plpgsql security definer as $$
declare
  len integer := length(coalesce(NEW.content, ''));
  days_to_add integer := 0;
begin
  -- user_id がUUID形式（実ユーザー）のみ対象（owner_manual / menesthe_* 等のシステムIDは対象外）
  if NEW.user_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    if len >= 700 then
      days_to_add := 7;   -- 長文ボーナス
    elsif len >= 200 then
      days_to_add := 3;   -- 投稿の最低ライン
    end if;

    if days_to_add > 0 then
      insert into user_credits (user_id, credits_days, expires_at, total_reviews_posted, updated_at)
      values (NEW.user_id::uuid, days_to_add, now() + (days_to_add || ' days')::interval, 1, now())
      on conflict (user_id) do update set
        credits_days = user_credits.credits_days + days_to_add,
        expires_at = greatest(coalesce(user_credits.expires_at, now()), now()) + (days_to_add || ' days')::interval,
        total_reviews_posted = user_credits.total_reviews_posted + 1,
        updated_at = now();
    end if;
  end if;
  return NEW;
end;
$$;

-- トリガー本体は既存（06）のものを流用。関数差し替えを確実に反映するため再作成。
drop trigger if exists on_review_insert_grant_credits on reviews;
create trigger on_review_insert_grant_credits
  after insert on reviews
  for each row execute function auto_grant_credits_on_review();
