-- Tier 3-2: 口コミ閲覧カウント（週次リテンションメール「あなたの口コミがN回読まれました」用）
-- Supabase SQL Editor で実行すること。

-- 閲覧数と「前回通知時点の閲覧数」を reviews に追加（テーブル追加せず列2つで実現）
alter table reviews add column if not exists view_count integer not null default 0;
alter table reviews add column if not exists last_notified_views integer not null default 0;

-- 閲覧インクリメント（threadページSSRから service role で呼ぶ。式更新なのでRPC化）
create or replace function increment_review_views(ids text[])
returns void language sql as $$
  update reviews set view_count = coalesce(view_count, 0) + 1 where id = any(ids);
$$;

-- 週次メール送信後に「通知済み閲覧数」を現在値に合わせる（次週はこの差分＝新規閲覧のみ通知）
create or replace function ack_review_views(ids text[])
returns void language sql as $$
  update reviews set last_notified_views = view_count where id = any(ids);
$$;
