/**
 * rosterNoiseRules.mjs — 「この在籍行は人か、部屋・素材か」の判定を1か所に置く
 *
 * 🚩 なぜ切り出したか（2026-09-20）
 * この判定を**別のやり方（TypeSafe AI の Jev）と突き合わせて正答率を測る**ため。
 * 比較のために規則を書き写すと、測っているのが「本物の判定」ではなく**写し**になる。
 * 写した時点で本番と食い違っていても誰も気づけない。
 * ⇒ 洗い出し（inspect_therapist_roster_noise）と比較（compare_roster_noise_judgement）が
 *   **同じ関数を通る**ようにする。brandNameMatch.mjs / dnsVerdict.mjs と同じ作法。
 *
 * ⚠️ この規則は**網羅ではない**。2026-09-16 の実測で、④は語のリストでしか拾えず、
 *    実際に見つかった「背景画像」は**2店目のページを目で見て**初めて分かった。
 *    「①④が0件になった」は「ノイズが無い」ではなく「この規則では見つからない」である。
 */
import { normName } from './brandNameMatch.mjs';

/** ① 部屋・支店の呼び名。「練馬Cルーム」「THE HALF五反田店」 */
export const BRANCH_SUFFIX = /(店|ルーム|room|支店)$/i;

/** ④ 取り込み元のページ部品がそのまま名前になったもの。
 *  ⚠️ **語のリスト＝網羅ではない。** 増やすときは実際に見つけたものだけを足す（想像で足さない）。 */
//  「ノーイメージ」は 2026-09-23、Marine（綱島）の二重レコードをまとめる下見で実際に見つけた（全店で1行）。
export const ASSET_WORDS = /^(背景画像|背景|メイン画像|トップ画像|ロゴ|バナー|サンプル|画像|写真|no ?image|noimage|ノーイメージ|dummy|ダミー)$/i;

/** 同じ名前がこの数以上の無関係な店に居たら「よくある源氏名」とみなす（実測: 36行すべて「みやび」だった）。 */
export const COMMON_NAME_MIN_SHOPS = 3;

/** 店名が短すぎると偶然一致する（「みやび」で36件の誤検知を出した）。 */
export const OWN_NAME_MIN = 3;

export const BUCKET_LABELS = {
  room: '① 部屋・店舗の呼び名が人として並んでいる … 消す対象',
  asset: '④ 素材・部品の名前が人として並んでいる … 消す対象（語のリスト＝網羅ではない）',
  decorated: '② 人名に店名が付いている … 消さない。表示名から店名を外す',
  otherShop: '③ 他店の名前と完全一致（よくある源氏名は除外済み）… 要確認',
};

/** 消す対象になりうる段（②は**人なので消さない**）。 */
export const DELETABLE_BUCKETS = ['room', 'asset'];

/**
 * 1行を分類する。該当しなければ null（＝ふつうの在籍者）。
 * @param {{name:string, shopId:string, shopName:string,
 *          shopIdsWithSameName?:string[], shopsUsingName?:number}} row
 */
export function classifyRosterName({ name, shopId, shopName, shopIdsWithSameName = [], shopsUsingName = 0 }) {
  const raw = String(name ?? '').trim();
  const n = normName(raw);
  if (!n) return null;
  if (BRANCH_SUFFIX.test(raw)) return 'room';
  if (ASSET_WORDS.test(raw)) return 'asset';
  const own = normName(shopName || '');
  if (own.length >= OWN_NAME_MIN && n !== own && n.includes(own)) return 'decorated';
  if (shopIdsWithSameName.length && !shopIdsWithSameName.includes(shopId) && shopsUsingName < COMMON_NAME_MIN_SHOPS) {
    return 'otherShop';
  }
  return null;
}

/**
 * 判定そのものの自己診断。**DBに触る前に**呼ぶこと。
 * 壊れた判定で一覧を出すくらいなら、何も出さないほうが害が小さい（brandNameMatch と同じ方針）。
 */
export function selfTestRosterRules() {
  const cases = [
    // 実際に消した行
    [{ name: '練馬Cルーム', shopId: 's1', shopName: 'Cannele (カヌレ)' }, 'room'],
    [{ name: 'THE HALF五反田店', shopId: 's2', shopName: 'THE HALF (ザ・ハーフ)' }, 'room'],
    [{ name: '荻窪北口ROOM', shopId: 's3', shopName: 'a laise' }, 'room'],
    [{ name: '背景画像', shopId: 's4', shopName: 'ルレーヴ' }, 'asset'],
    [{ name: 'ノーイメージ', shopId: 's8', shopName: 'Marine (マリン) 綱島' }, 'asset'],
    // 実在の人。消してはいけない
    [{ name: '瑠香 -るか- Marvelous -マーベラス-', shopId: 's5', shopName: 'Marvelous -マーベラス-' }, 'decorated'],
    [{ name: '花森みい', shopId: 's4', shopName: 'ルレーヴ' }, null],
    // よくある源氏名は他店名と一致しても人（実測で36行すべて「みやび」だった）
    [{ name: 'みやび', shopId: 's6', shopName: 'アロマ○○', shopIdsWithSameName: ['s9'], shopsUsingName: 7 }, null],
    // 珍しい名前が他店の店名と一致するなら要確認のまま残す
    [{ name: 'ゆりかご京都', shopId: 's6', shopName: 'アロマ○○', shopIdsWithSameName: ['s9'], shopsUsingName: 1 }, 'otherShop'],
    // 店名が短いと偶然一致する。3文字未満は見ない
    [{ name: 'あい', shopId: 's7', shopName: 'あ', shopsUsingName: 1 }, null],
    [{ name: '', shopId: 's7', shopName: 'X' }, null],
  ];
  const bad = [];
  for (const [row, want] of cases) {
    const got = classifyRosterName(row);
    if (got !== want) bad.push(`「${row.name}」→ ${got} （期待 ${want}）`);
  }
  if (bad.length) {
    console.error('❌ 判定の自己診断に失敗しました。一覧は出しません:');
    for (const b of bad) console.error('   - ' + b);
    process.exit(1);
  }
}
