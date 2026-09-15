/**
 * dnsVerdict.mjs — 名前解決の失敗を「ドメインが無い」と「調べられなかった」に分ける
 *
 * 【なぜ独立させたか（2026-09-15）】
 * 閉店の判断は名前解決だけを根拠にする決まりだが、その実装が
 * **エラーの種類を見ずに、引けなければ全部「ドメイン消滅」**にしていた。
 * そのため回線が細い環境で走らせると、営業中の店が「閉店候補」として出てくる。
 * 実際 `bellrose-osaka.com` と `wife-room.com` が ETIMEOUT で消滅扱いになり、
 * 危うく営業中の店に閉店の札を貼るところだった。
 *
 * これは 2026-09-13 に潰した「応答しない ＝ 店が無い」（HTTPの403やタイムアウトを
 * 閉店扱いした件）と**同じ誤りが1階層下に残っていた**もの。
 *
 * 🚩 **ENOTFOUND（NXDOMAIN＝そのドメインは登録されていない）だけが確証。**
 *    他は全部「こちらが調べられなかった」であって、店の状態を何も語らない。
 */

/** NXDOMAIN を表すコード。これだけが「ドメインが無い」の証拠。 */
export const NXDOMAIN_CODES = new Set(['ENOTFOUND']);

/**
 * @param {string|undefined} code Node の dns エラーコード（ENOTFOUND / ETIMEOUT / ESERVFAIL 等）
 * @returns {'domain_gone'|'dns_unresolved'}
 */
export function classifyDnsFailure(code) {
  return NXDOMAIN_CODES.has(String(code || '')) ? 'domain_gone' : 'dns_unresolved';
}

/** その判定を「閉店の根拠にしてよいか」。dns_unresolved は根拠にしてはいけない。 */
export function isClosureEvidence(state) {
  return state === 'domain_gone';
}
