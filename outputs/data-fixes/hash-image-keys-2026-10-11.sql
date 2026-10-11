-- ARROW（京都）8人の写真のURLの「#」を「%23」に直す（2026-10-11・Claude 作成）
--
-- 何が起きていたか:
--   在籍一覧の人物リンクが estama.jp の人物ページ（…/cast/104621/#CastProfile）で、その URL まるごとが
--   写真のキー（cast_kyoto_kyoto_arrow_https://estama.jp/shop/28543/cast/104621/#CastProfile_<版>.jpg）に入っていた。
--   URL の「#」から後ろはブラウザが送らないので、Worker には途中までのキーしか届かず 404。
--   → URL の「#」を「%23」にすれば、Worker が戻した結果が R2 のキーと同じになり、同じ写真が返る（本番の /api/og で8件とも確認）。
--   週1回の全件検査（image health）の「配信NG 497件」＝「%」の489件＋この8件。
--
-- 控え: outputs/data-fixes/hash-image-keys-2026-10-11.json（id・元のURL・直したURL）
-- 戻し方: その JSON の old_url に戻す（R2 の写真・キーは触らない）
-- ⚠️ 1つの文（DO ブロック）なので、件数が8でなければ例外で全部取り消され、何も書かれない。

do $$
declare n int;
begin
  update therapists
     set image_url = replace(image_url, '#', '%23')
   where shop_id = 'kyoto_kyoto_arrow'
     and image_url like 'https://mens-esthe-images.tugihe1112.workers.dev/therapist-images/cast\_kyoto\_kyoto\_arrow\_%#%' escape '\';
  get diagnostics n = row_count;
  if n <> 8 then
    raise exception 'therapists: 想定 8 行に対して % 行。何も書きません', n;
  end if;
end $$;

-- 確認（直したあと）: 「#」の残り 0 行、直した行 8 行
select
  (select count(*) from therapists where image_url like '%#%') as remaining_hash,
  (select count(*) from therapists where shop_id = 'kyoto_kyoto_arrow' and image_url like '%\%23CastProfile%' escape '\') as fixed;
