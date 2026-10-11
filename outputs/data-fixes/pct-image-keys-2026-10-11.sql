-- 写真のURLの「%」を「%25」に直す（2026-10-11・Claude 作成・実行はオーナーの OK のあと）
--
-- 何が起きていたか:
--   新人追加などの道具が、在籍一覧の人物ページのURLから「人物ID」を取るとき、日本語の名前を
--   %で書いた形（%E3%81%82…）のまま写真のキーにしていた。R2 には「%」の文字のままのキーで入っている。
--   ところが配信の Worker は URL を decodeURIComponent してからキーを探すので、日本語のキーを探しに行き 404。
--   → URL の「%」を「%25」にすれば、Worker が戻した結果が R2 のキーと同じになり、同じ写真が返る。
--   本番の /api/og（サーバー側で画像を取りに行く）で 490件とも「今のURL=無い／直したURL=ある」を確認済み。
--
-- 対象: セラピスト 489行（22店）＋店のロゴ 1行（DEEP 名駅）。口コミのある人は0人。
-- 控え: outputs/data-fixes/pct-image-keys-2026-10-11.json（id・元のURL・直したURL）
-- 戻し方: その JSON の old_url に戻す（R2 の写真・キーは触らない）
--
-- ⚠️ 1つの文（DO ブロック）なので、件数が想定と違えば例外で全部取り消され、何も書かれない。

do $$
declare n int; m int;
begin
  update therapists
     set image_url = left(image_url, length(image_url) - length(substring(image_url from '[^/]+$')))
                     || replace(substring(image_url from '[^/]+$'), '%', '%25')
   where image_url like 'https://mens-esthe-images.tugihe1112.workers.dev/therapist-images/%'
     and substring(image_url from '[^/]+$') like '%\%%' escape '\'
     and substring(image_url from '[^/]+$') not like '%\%25%' escape '\';
  get diagnostics n = row_count;
  if n <> 489 then
    raise exception 'therapists: 想定 489 行に対して % 行。何も書きません', n;
  end if;

  update shops
     set image_url = 'https://mens-esthe-images.tugihe1112.workers.dev/shop-logos/aichi_meieki_deep_3751_%25E4%25BF%25AE%25E6%25AD%25A3FV_PC-1-scaled.webp'
   where id = 'aichi_meieki_deep_3751'
     and image_url = 'https://mens-esthe-images.tugihe1112.workers.dev/shop-logos/aichi_meieki_deep_3751_%E4%BF%AE%E6%AD%A3FV_PC-1-scaled.webp';
  get diagnostics m = row_count;
  if m <> 1 then
    raise exception 'shops: 想定 1 行に対して % 行。何も書きません', m;
  end if;
end $$;

-- 確認（直したあと）: 残り 0 行、直した行 489 行・ロゴ 1 行になっていること
select
  (select count(*) from therapists
    where substring(image_url from '[^/]+$') like '%\%%' escape '\'
      and substring(image_url from '[^/]+$') not like '%\%25%' escape '\') as remaining_old_form,
  (select count(*) from therapists
    where image_url like 'https://mens-esthe-images.tugihe1112.workers.dev/therapist-images/%\%25%' escape '\') as fixed_therapists,
  (select count(*) from shops
    where id = 'aichi_meieki_deep_3751' and image_url like '%\%25E4%' escape '\') as fixed_shop_logo;
