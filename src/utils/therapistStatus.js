/**
 * therapistStatus.js — 「この人はまだ在籍一覧に載っているか」の唯一の判定と文言
 *
 * 【背景（2026-09-09）】
 * 退店したセラピストのページは口コミごと残す（公開済みURLを殺さないため）。
 * ところが画面には何の表示もなく、訪問者は現役だと思って店へ行っていた。
 * 実データでは `is_active = false` が155人いた。
 *
 * ⚠️ **「退店済み」と断定しない。** 我々が確認できるのは
 *    「店舗の最新の在籍一覧に居ない」ことだけで、退店・休業・収集失敗の区別はつかない。
 *    根拠のない断定をしないのは、固定の「★ New」を全店から消したのと同じ考え方。
 * ⚠️ 判定材料は2つあり、**両方**を見ること。
 *    - is_active === false … 行は残っているが在籍一覧から外れた
 *    - raw_data.archived === true … 名簿から行ごと消え、SSRが口コミから復元したページ
 *    片方だけにすると、どちらかの経路の人が現役として表示される。
 */

/** 人物ページの見出し横に出す文言 */
export const NOT_LISTED_LABEL = '現在は在籍一覧にありません';
/** 一覧カードなど狭い場所で使う短い文言（主張の内容は同じ） */
export const NOT_LISTED_SHORT = '在籍一覧になし';
/** 人物ページで見出しの下に添える説明 */
export const NOT_LISTED_NOTE =
  'この店舗の最新の在籍一覧に掲載されていません（退店・休業などの可能性があります）。過去の口コミはそのまま残しています。最新の在籍は公式サイトでご確認ください。';

/**
 * @param {object|null} therapist therapists の行、または `notListed` を持つ整形済みオブジェクト
 * @returns {boolean}
 */
export function isNotListed(therapist) {
  if (!therapist) return false;
  return therapist.is_active === false
    || therapist.raw_data?.archived === true
    || therapist.notListed === true;
}
