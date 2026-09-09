/**
 * registerAnalytics.js — 登録ファネルの計測（DESIGN.md U06）
 *
 * 見たい数字は4つだけ：登録画面→入力開始／送信→メール送信成功／確認完了／確認後の復帰。
 *
 * ⚠️ メール・氏名・パスワード・トークン・本文・検索語・生のURLをイベントへ送らない。
 * ⚠️ `source` は固定の許可値だけ。許可外は**送らない**（勝手な値でレポートを汚さない）。
 * ⚠️ 完了イベントの担当は確認後ページ（/auth/complete）**1か所だけ**。
 *    F02のOTP確認ページからも撃つと同じ登録が二重に数えられる。
 * ⚠️ 同一ブラウザの再表示は記録済みキーで抑えるが、これは**完全な重複排除ではない**。
 *    GAのイベント数を確定した新規会員数と同一視しないこと。
 * ⚠️ 新しい計測SDKは入れない。既存の trackEvent（gtag）だけを使う。
 */
import { trackEvent } from './analytics';

/** 許可された発生元。ここに無い値は送らない。 */
export const REGISTER_CTA_SOURCES = ['home', 'header', 'bottom_nav', 'review_end', 'review_lock', 'favorite'];

/** 固定のエラー分類。内部の例外文をイベントに載せないための受け皿。 */
export const REGISTER_ERROR_CODES = ['validation', 'duplicate', 'rate_limit', 'network', 'server'];

function onceKey(key) {
  // localStorage が使えない環境（プライベートモード等）でも計測で例外を出さない。
  try {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    if (window.localStorage.getItem(key)) return false;
    window.localStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

export function trackRegisterCtaClick(source) {
  const params = REGISTER_CTA_SOURCES.includes(source) ? { source } : {};
  trackEvent('register_cta_click', params);
}

/** 登録画面の表示。再レンダーでは重複させない（呼び出し側でマウント1回に限定する）。 */
export function trackRegisterView() {
  trackEvent('register_view', {});
}

/** 最初の入力変更。フォーム表示1回につき1回。 */
export function trackRegisterStart() {
  trackEvent('register_start', {});
}

/** クライアント検証を通り、登録APIを呼ぶ直前。 */
export function trackRegisterSubmit() {
  trackEvent('register_submit', {});
}

/** APIがメール送信成功を返した時。 */
export function trackRegisterEmailSent() {
  trackEvent('register_email_sent', {});
}

/** 失敗。分類は固定の5種類だけ。 */
export function trackRegisterError(code) {
  trackEvent('register_error', { reason: REGISTER_ERROR_CODES.includes(code) ? code : 'server' });
}

/** 確認済みセッションを確認できた時。/auth/complete だけが呼ぶ。 */
export function trackRegistrationConfirmed(userId) {
  const key = userId ? `reg_confirmed_${userId}` : 'reg_confirmed';
  if (!onceKey(key)) return;
  trackEvent('registration_confirmed', {});
}

/** 確認後に戻り先へ到着。page_type だけ記録し、生のURLは送らない。 */
export function trackRegistrationReturn(pathname) {
  trackEvent('registration_return', { page_type: pageTypeOf(pathname) });
}

/** パスを固定の分類名へ畳む。IDや日本語のスラッグをそのまま送らないため。 */
export function pageTypeOf(pathname) {
  const path = String(pathname || '');
  if (/^\/shops\/[^/]+\/threads\//.test(path)) return 'therapist';
  if (/^\/shops\/[^/]+/.test(path)) return 'shop';
  if (path === '/shops') return 'shop_list';
  if (path.startsWith('/popular-reviews')) return 'reviews';
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/area/')) return 'area';
  if (path.startsWith('/mypage')) return 'mypage';
  if (path === '/' || path === '') return 'home';
  return 'other';
}
