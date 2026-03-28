import rawShops from './all_shops.json';
import therapistsMaster from './therapists.json';
import { buildShopView } from '../utils/shopViewBuilder';

// ここで全データを「復元（Hydrate）」します。
// サイトの他のページは、データがID化されたことに気づかず、
// 以前と同じように詳細データを受け取れます。

const shopsArray = Array.isArray(rawShops) ? rawShops : Object.values(rawShops);

const allShops = shopsArray.map(shop => buildShopView(shop, therapistsMaster));

export { allShops };
