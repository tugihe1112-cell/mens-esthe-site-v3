-- Tier 3-3: 退店検知（在籍ステータス）。Supabase SQL Editorで実行。
-- 退店セラピストは削除せず「退店済み」でマーク（口コミ資産はSEO上残す＝ロードマップ方針）。
alter table therapists add column if not exists is_active boolean not null default true;
alter table therapists add column if not exists departed_at timestamptz;

-- 既存の索引に影響しない軽い列追加のみ。フロントは当面 is_active を無視して従来通り表示可能。
-- 退店済みの「退店済み」バッジ表示・在籍数からの除外はフロント側で段階的に対応（別途）。
