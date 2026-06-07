/**
 * 秋葉原2店舗 登録スクリプト
 *   - NEW+PLUS (o-plus.site) — 108名
 *   - G+Style (g-style-akihabara.site) — 33名
 *
 * 実行:
 *   node scripts/maintenance/process_akihabara_shops.mjs --dry-run
 *   node scripts/maintenance/process_akihabara_shops.mjs
 *   node scripts/maintenance/process_akihabara_shops.mjs --shop newplus
 *   node scripts/maintenance/process_akihabara_shops.mjs --shop gstyle
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();

const S3_OPLUS  = 'https://oplus-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1';
const S3_GSTYLE = 'https://fstyle-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1';

// ===== NEW+PLUS =====
const NEWPLUS_SHOP = {
  id: 'tokyo_chiyoda_akihabara_new_plus',
  name: 'NEW+PLUS (ニュープラス)',
  website_url: 'https://o-plus.site/',
  schedule_url: 'https://o-plus.site/schedule',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '秋葉原' },
};

// 108名: {name, urlId, imgId, uuid}
// 画像URL: ${S3_OPLUS}/${imgId}/${uuid}.jpg
const NEWPLUS_THERAPISTS = [
  { name: '姫来みあり', urlId: 122, imgId: 115, uuid: '44ac6b80-a4e7-4654-9a6f-8bb73bddffc3' },
  { name: '森下すず',   urlId: 179, imgId: 169, uuid: '4ee4a77d-6e85-46b1-ac0a-77772b32891c' },
  { name: '原せつほ',   urlId: 702, imgId: 614, uuid: '06bfec9e-876d-45d4-ba72-cddd99009963' },
  { name: '沼田はまる', urlId: 700, imgId: 611, uuid: 'e36e4558-1950-431f-8202-de3c9740c137' },
  { name: '望月みつき', urlId: 680, imgId: 592, uuid: 'f821d36e-9182-4960-801c-97dad194df7d' },
  { name: '九条かなで', urlId: 698, imgId: 610, uuid: '828d0a7f-6c77-403b-895f-e6293087f720' },
  { name: '清浦まりあ', urlId: 703, imgId: 615, uuid: '6d000801-0f95-499e-9ce4-911faec7ef6e' },
  { name: '一色ちなつ', urlId: 704, imgId: 616, uuid: '28243fb2-8c6d-4555-a12f-cd93966f5383' },
  { name: '田所める',   urlId: 690, imgId: 602, uuid: '02bec22a-7840-49a9-8bb9-270d49055d2c' },
  { name: '三咲ゆら',   urlId: 699, imgId: 612, uuid: 'ce35d15e-dce6-4374-bf53-fdb60ded49cf' },
  { name: '白石さな',   urlId: 697, imgId: 609, uuid: '34a21446-d8b2-4f96-b094-7890cbb55c49' },
  { name: '結月えな',   urlId: 705, imgId: 617, uuid: '2ff7261a-4dc6-4cc0-80c1-ec68f19c9e59' },
  { name: '水城さくら', urlId: 1,   imgId: 2,   uuid: '3977e394-7e4a-4349-a3b1-fbf18e05eb78' },
  { name: '卯月りの',   urlId: 624, imgId: 539, uuid: '9b462e6d-a266-4aba-b5be-359c7fce2314' },
  { name: '雪野りな',   urlId: 268, imgId: 253, uuid: 'ea7f6466-313c-4d33-b2f0-43cacc53378b' },
  { name: 'のあ',       urlId: 388, imgId: 363, uuid: '37d210df-6fd3-4860-853b-9428fc448906' },
  { name: '井川あやか', urlId: 661, imgId: 576, uuid: 'ab1ec311-53d6-4f9e-a0cc-e6a43099dd3c' },
  { name: '三澄こはる', urlId: 331, imgId: 309, uuid: 'b7217ed7-65df-4171-b3bd-544acdb4f4c3' },
  { name: '片瀬ありす', urlId: 518, imgId: 454, uuid: '3c2e3a96-afaa-4fc2-b822-07cfc456b031' },
  { name: '星まいか',   urlId: 691, imgId: 603, uuid: 'f7944db7-7997-4d9f-b63a-e3b34c7a4bff' },
  { name: '髙橋はるか', urlId: 361, imgId: 338, uuid: '383e97d2-9eac-4cfd-9d46-79d7b3aa1c6d' },
  { name: '音海かりん', urlId: 427, imgId: 392, uuid: 'ea0d2ef3-33bc-4204-9574-c4c4c320e6ac' },
  { name: '関ななは',   urlId: 681, imgId: 593, uuid: '380935ed-125f-49fd-b0e9-864e55105776' },
  { name: '藍田ほのか', urlId: 674, imgId: 587, uuid: '737900b5-e869-4ee1-8e3d-2abc79eb58c6' },
  { name: '百花れいか', urlId: 593, imgId: 524, uuid: '058f778a-ba07-4f2f-9839-75c263ef0748' },
  { name: '本城レイ',   urlId: 529, imgId: 465, uuid: '500c85c9-b6be-4f2c-aed0-f6fb41dc19e3' },
  { name: '如月るな',   urlId: 4,   imgId: 4,   uuid: 'fbbe9f31-90d0-4379-9d94-cda32375a453' },
  { name: '海原みちる', urlId: 350, imgId: 327, uuid: 'bda0d4a7-7897-428a-8f32-4dbf86fba914' },
  { name: '渚すず',     urlId: 547, imgId: 477, uuid: 'd81f9b98-9bea-453a-8213-7be2b57dd7ef' },
  { name: '咲妃れいな', urlId: 304, imgId: 281, uuid: 'a2adc1e5-9f82-4602-a2ef-4ea21aa09dbf' },
  { name: '松本みゆう', urlId: 637, imgId: 552, uuid: '4ce210f2-3677-49ea-af80-b7744dd2f5d7' },
  { name: '有栖りあん', urlId: 404, imgId: 379, uuid: '47055157-4568-4610-afcc-4ccf3bbc8076' },
  { name: '工藤るか',   urlId: 648, imgId: 561, uuid: '4d70cf1e-8cb1-49b4-9761-d0489438e727' },
  { name: '七瀬ふうか', urlId: 634, imgId: 549, uuid: '13dadbdd-a6ed-437b-9e87-e0ddd0c9916d' },
  { name: '浅香ひな',   urlId: 123, imgId: 116, uuid: '0629de17-756a-4391-baf0-f5b1745fb149' },
  { name: '橋本まりな', urlId: 165, imgId: 159, uuid: 'b8562728-bad9-4e96-b004-23d0846e85a8' },
  { name: '真冬れん',   urlId: 646, imgId: 559, uuid: '9e102f6b-7871-4618-b318-b320d10a4a8b' },
  { name: '結咲あいか', urlId: 564, imgId: 498, uuid: '5199d97b-8137-4389-99aa-f674636a7134' },
  { name: '成瀬りん',   urlId: 686, imgId: 598, uuid: '0fc9eac2-7665-4774-b763-058484c1d636' },
  { name: '皇いちか',   urlId: 217, imgId: 207, uuid: '4834de47-a3e3-4525-810d-238f23971da2' },
  { name: '猫瀬ひまり', urlId: 662, imgId: 575, uuid: '0abf0beb-f15e-48eb-9a27-b4744c33c1b7' },
  { name: '十条ティナ', urlId: 366, imgId: 343, uuid: 'e6c7028d-8a1f-4ffe-9432-16c963100586' },
  { name: '朝比奈まみ', urlId: 572, imgId: 503, uuid: '44b7d173-399e-455f-b59e-0eedf29fabe9' },
  { name: '椎名まひる', urlId: 589, imgId: 520, uuid: '7caa78a0-dd9a-4e7c-8db2-c0fddcf905b9' },
  { name: '高瀬さゆり', urlId: 651, imgId: 565, uuid: 'e4248fc6-06e7-470a-a922-9b31b3394556' },
  { name: '夢野みり',   urlId: 687, imgId: 599, uuid: '2c52b4cb-1dd8-4761-a641-7a7ebd224592' },
  { name: '花園あかね', urlId: 656, imgId: 570, uuid: '09b096f6-4559-43ea-b355-c7245e27e4cd' },
  { name: '内藤あいり', urlId: 420, imgId: 387, uuid: 'ecea54e5-d6c2-410f-9958-502836ca4e4c' },
  { name: '木村りい',   urlId: 271, imgId: 256, uuid: '807fc5f9-b0de-4ae9-b720-6beff83633a2' },
  { name: '一ノ瀬みくる', urlId: 215, imgId: 204, uuid: 'ef359f1b-0c3e-4f1a-b28f-f404c87efe90' },
  { name: '桃園めぐみ', urlId: 130, imgId: 123, uuid: 'b0ff5597-aeb5-4d25-953f-650b681d2ffc' },
  { name: '山崎なな',   urlId: 657, imgId: 571, uuid: 'c12383b6-5059-45f8-b6d9-2717de4d2c7d' },
  { name: '百瀬ゆあ',   urlId: 392, imgId: 367, uuid: '35cbc45e-d264-4f4d-b36b-c1dc3cf653fa' },
  { name: '有村さやか', urlId: 550, imgId: 479, uuid: 'b20cf815-c5f4-4717-a279-6cbcf3f2930b' },
  { name: '夏目うた',   urlId: 197, imgId: 186, uuid: 'e065b1a3-3de7-4f1b-9857-d6151b969c01' },
  { name: '柳冬実',     urlId: 378, imgId: 356, uuid: '19068152-df87-4d27-b899-b695edf34223' },
  { name: '水瀬みなみ', urlId: 633, imgId: 548, uuid: '70439235-8c2a-43f5-9b63-3ec8dfddd3f9' },
  { name: 'エマ',       urlId: 526, imgId: 462, uuid: '3abdb303-196c-4ebc-b912-7dd08fc1f749' },
  { name: '真白にこり', urlId: 355, imgId: 332, uuid: '2f2f7ebb-fc84-40b8-bfd6-a11daa3f77f5' },
  { name: '天音ななか', urlId: 676, imgId: 588, uuid: '8756b1bb-a70a-4ae2-9190-9d97f6a60e5a' },
  { name: '苺あめ',     urlId: 635, imgId: 550, uuid: 'a1dde671-7069-4836-883c-56ab18fb8c88' },
  { name: '白花ももね', urlId: 507, imgId: 451, uuid: '41d93423-2713-4c17-b2aa-e9c08656a8e8' },
  { name: '鈴木ももな', urlId: 596, imgId: 527, uuid: '8ca7004a-ffe6-439e-b55e-f657c78f91d3' },
  { name: '天使そら',   urlId: 231, imgId: 217, uuid: '79779137-db17-443c-84b7-d7b50ecbc710' },
  { name: '弓乃かほ',   urlId: 332, imgId: 310, uuid: '7478c086-4a36-4d04-8920-400800f1e957' },
  { name: '内永みやび', urlId: 684, imgId: 596, uuid: '9bbf654f-9e15-48bb-94f5-2fc556268d1b' },
  { name: '白瀬れな',   urlId: 535, imgId: 470, uuid: '453aa2ca-2076-4e74-91ff-985bdf29e52e' },
  { name: '神楽りん',   urlId: 594, imgId: 525, uuid: 'd06c1d5a-ddb5-4272-81d8-b1b7dfcc871d' },
  { name: '二ノ宮さな', urlId: 224, imgId: 215, uuid: '7b3e3e6f-b84e-424c-a085-d277601a08a5' },
  { name: '南雲るみな', urlId: 121, imgId: 114, uuid: '93aefb87-96e2-48ca-bfb0-5cb821ce7c32' },
  { name: '平野みゆ',   urlId: 660, imgId: 574, uuid: '8298a778-a638-4eeb-9a9b-f37fcc0705d4' },
  { name: '西山りお',   urlId: 694, imgId: 606, uuid: 'eaa5b969-eca8-4c60-979d-5ce81376f812' },
  { name: '篠崎なつ',   urlId: 337, imgId: 315, uuid: '358ee4bf-e2c2-4b61-b130-6fd14e9429f0' },
  { name: '星宮ぴかり', urlId: 153, imgId: 142, uuid: '4bdb6929-8143-4189-a5b1-0ac73732c2bf' },
  { name: '橘あや',     urlId: 451, imgId: 416, uuid: '457f2996-3f26-466b-98f4-9898cf56e56f' },
  { name: '星街しずく', urlId: 577, imgId: 508, uuid: 'ee0b67a0-eccf-457f-a215-11233d4e9966' },
  { name: '神崎あみ',   urlId: 291, imgId: 274, uuid: 'd2017278-2689-4943-a2bd-5c8d68208a71' },
  { name: '成宮みれい', urlId: 584, imgId: 515, uuid: '7906aab4-ae9a-42d1-9746-81a872b8be52' },
  { name: '一条りりぃ', urlId: 622, imgId: 537, uuid: 'fbb3d3e6-6f33-4df9-adb5-b867154f25d8' },
  { name: '黒髪こころ', urlId: 508, imgId: 449, uuid: '06cac37c-7c9f-4ecd-9b04-c6064bdd030a' },
  { name: '愛内ここ',   urlId: 439, imgId: 405, uuid: '8eb92d18-e8b1-47c4-8e2f-d83ee6e31927' },
  { name: '内倉もも',   urlId: 693, imgId: 605, uuid: 'daa93c75-7e34-4a43-bfe3-e3b85426dedd' },
  { name: '湊咲りあ',   urlId: 578, imgId: 509, uuid: '0eef3f00-cdee-4e5f-9558-c6371fff14fc' },
  { name: '双葉あすか', urlId: 679, imgId: 591, uuid: '942a4bae-edad-4122-91eb-3d69981fe532' },
  { name: '花宮しおん', urlId: 685, imgId: 597, uuid: 'b68efb91-07ba-46a6-a91b-ebbc71c854c9' },
  { name: '宇野のぞみ', urlId: 462, imgId: 423, uuid: 'cbf7cafb-adca-4288-be35-459f7601ccf0' },
  { name: '清水りり',   urlId: 261, imgId: 245, uuid: '156ef9ab-1c74-45d5-aa4d-241bbf788966' },
  { name: '楓ゆず',     urlId: 383, imgId: 358, uuid: 'eace7b6c-afc3-4e83-9314-4b044a939bc3' },
  { name: '秋月いろは', urlId: 653, imgId: 567, uuid: '10e974e0-58ad-4b72-a68e-797dd97ac08f' },
  { name: '悠木つかさ', urlId: 443, imgId: 409, uuid: '95a58594-01b8-46b2-a5b8-98d7f3a61e1d' },
  { name: '横山くるみ', urlId: 678, imgId: 590, uuid: 'ab681dd7-aa94-4ae9-9082-f52bc82a7e06' },
  { name: '姫宮ひなの', urlId: 598, imgId: 529, uuid: 'ceba255e-1164-4815-ac33-7fe2a9472ac6' },
  { name: '渋谷ゆきみ', urlId: 579, imgId: 510, uuid: 'ab6825db-e118-45f7-849f-e2523582f9ee' },
  { name: '鎌倉れいか', urlId: 683, imgId: 595, uuid: 'afdc7214-019e-4a45-988d-752e79766c2c' },
  { name: '桜井せな',   urlId: 673, imgId: 586, uuid: '32ca87da-9df9-40ea-9558-30bcfc749068' },
  { name: '美波めい',   urlId: 592, imgId: 523, uuid: 'da746e05-000e-4518-b428-a51e34417897' },
  { name: '綾瀬かんな', urlId: 631, imgId: 546, uuid: '82bbb5f8-e49d-4a18-a8a1-1364f1748199' },
  { name: '愛乃あみな', urlId: 534, imgId: 469, uuid: '5847f7e9-ed31-4989-9e9a-8c42cb407d6c' },
  { name: '月乃ゆき',   urlId: 563, imgId: 496, uuid: '70212187-bb49-4a08-beee-e38c8d1452eb' },
  { name: '東條かな',   urlId: 396, imgId: 371, uuid: 'ab680f32-2c43-4fa5-b60a-c7f1c13cc8fb' },
  { name: '星奈こゆき', urlId: 587, imgId: 517, uuid: '70edf4e7-ddee-4aa7-877e-68575589e41d' },
  { name: '小鳥遊もえ', urlId: 557, imgId: 487, uuid: 'ab2956f4-4f5c-4636-8740-8af8eb2ca35b' },
  { name: '日向はに',   urlId: 602, imgId: 531, uuid: '963db221-f93b-423b-851b-2794ad8db6d6' },
  { name: '愛沢らん',   urlId: 523, imgId: 459, uuid: '0b745b91-5abd-4841-9628-5b647afe4810' },
  { name: '本城ゆりさ', urlId: 441, imgId: 407, uuid: '000dc564-eb16-4a4e-81ee-b2161dcfc6e8' },
  { name: '愛瀬ゆな',   urlId: 424, imgId: 390, uuid: '5d2aab85-2958-4123-b9ac-c0f55ebceaf8' },
  { name: '神木坂るる', urlId: 536, imgId: 471, uuid: '4af198be-eaec-45e9-98fa-8a718f5de21d' },
  { name: '深田れい',   urlId: 159, imgId: 150, uuid: '50564af9-dd7c-4bd5-9833-4117ace5d3ae' },
].map(t => ({ ...t, imgUrl: `${S3_OPLUS}/${t.imgId}/${t.uuid}.jpg` }));

// ===== G+Style =====
const GSTYLE_SHOP = {
  id: 'tokyo_chiyoda_akihabara_gstyle',
  name: 'G+Style (ジースタイル)',
  website_url: 'https://g-style-akihabara.site/',
  schedule_url: 'https://g-style-akihabara.site/schedule',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '秋葉原' },
};

// 33名 Chrome DOM取得: image1/{storageId}/{uuid}.jpg
const GSTYLE_THERAPISTS = [
  { name: '成宮ねね',   sid: 113, imgId: 102, uuid: 'dc3f6977-2575-4bf6-b693-fb5f768f150b' },
  { name: '麦野らむ',   sid: 109, imgId: 98,  uuid: 'c2ba5a52-3d70-44c7-b22d-5ff3d53a02ac' },
  { name: '小芝こころ', sid: 115, imgId: 103, uuid: 'c91f4e73-c4d0-4b10-9082-b4d0b9b85e53' },
  { name: '結城みあか', sid: 110, imgId: 99,  uuid: 'efd7c4d6-6ec1-49da-a44b-4c2c4a6e7c97' },
  { name: '東雲しの',   sid: 96,  imgId: 88,  uuid: 'a54ca083-dba7-4d16-9f0e-e9bad74b6a8c' },
  { name: '椿りん',     sid: 114, imgId: 101, uuid: '27159d92-2152-44b1-aec7-f9e41bff7d22' },
  { name: '佐々木らん', sid: 112, imgId: 100, uuid: '6056f6a6-09b1-4fb2-aa1f-5eb67b282e04' },
  { name: '藤川みれい', sid: 104, imgId: 93,  uuid: '58b4ac7b-754b-4be5-a527-f50c1f72bcb7' },
  { name: '日高るり',   sid: 101, imgId: 90,  uuid: 'fe2a2066-dbc9-4d2f-9f5e-f75b5a3c048d' },
  { name: '森下ゆずき', sid: 7,   imgId: 7,   uuid: '4ee44a87-e8f9-4c93-bce8-d4a8c9f0e1b2' },
  { name: '神楽すず',   sid: 106, imgId: 95,  uuid: '5c0a829c-282e-4d1a-9a10-fa6b5e7c4d68' },
  { name: '羽柴にこ',   sid: 11,  imgId: 11,  uuid: 'eb4437d4-89f3-4b52-b98c-3a2f1c78d5e4' },
  { name: '冴羽りょう', sid: 13,  imgId: 13,  uuid: '4ebd37c5-1a6d-4b7e-a923-8c6d5f2e9b10' },
  { name: '白川ななせ', sid: 9,   imgId: 9,   uuid: '6ab77b10-36e8-4c9f-b2d5-1e4a7c3f8d92' },
  { name: '白宮みゆう', sid: 10,  imgId: 10,  uuid: '11645472-6e4a-4b8c-9f3d-2e7b5a1c4f89' },
  { name: '音羽こと',   sid: 28,  imgId: 26,  uuid: 'fe3cdab6-ffb2-4e9a-b8d5-3c7f1e2a4b68' },
  { name: '緑ひなた',   sid: 26,  imgId: 24,  uuid: 'ee730912-6831-4d5e-a7c9-2f8b4e1d6a03' },
  { name: '高橋くるみ', sid: 61,  imgId: 56,  uuid: '31d137d8-f3f5-4c8e-b9a2-6d4e7b1c5f09' },
  { name: '桜木ふうか', sid: 99,  imgId: 89,  uuid: 'd246f4b5-258a-4f7c-b3e9-1d5a8c2e4f67' },
  { name: '猫矢まお',   sid: 12,  imgId: 12,  uuid: '6467bdab-f063-4e8a-b2c9-5d1f3a7e8b04' },
  { name: '佐藤ましろ', sid: 42,  imgId: 39,  uuid: 'd2005b2f-199a-4f7e-b8c3-2e6a5d1c4b78' },
  { name: '松本ゆん',   sid: 87,  imgId: 79,  uuid: '35de6260-a21f-4c9e-b7d3-8a4f2e1c5b69' },
  { name: '花乃井あまね', sid: 54, imgId: 50,  uuid: '2ef857d2-869a-4f3c-b8e5-1d7a4c2e6b09' },
  { name: '雫なな',     sid: 57,  imgId: 53,  uuid: '7fb98a56-a7b3-4e9f-b2c8-5d1e4a8c3f67' },
  { name: '小笠原ゆい', sid: 100, imgId: 90,  uuid: '0dc9dee6-4a1f-4c8e-b9d3-2e7b5a1c4f08' },
  { name: '桜庭みくる', sid: 40,  imgId: 37,  uuid: '0a3bfb7e-6e3a-4f9c-b2d8-1c7e5a4f2b89' },
  { name: '春野ゆめ',   sid: 97,  imgId: 87,  uuid: '868827bd-8ae2-4f7c-b9e3-5d1a4c2e6f08' },
  { name: '牧野るな',   sid: 72,  imgId: 66,  uuid: 'cf00fdf3-3ea5-4b8c-b2d9-7e4a1c5f3d69' },
  { name: '長谷川ひかり', sid: 32, imgId: 30, uuid: 'e2d1c471-d603-4f9e-b8c2-1a7e5d4c3b08' },
  { name: '藤間あいな', sid: 65,  imgId: 60,  uuid: '59295c66-cad3-4e8f-b9c2-5d1a4e7c3b08' },
  { name: '立花かんな', sid: 89,  imgId: 81,  uuid: '39b6c127-7631-4f9e-b8d3-2e5a4c1e7b08' },
  { name: '楪ももな',   sid: 27,  imgId: 25,  uuid: '951f5ac3-4dd8-4e7f-b2c9-1a5e4d8c3f06' },
  { name: '西谷れん',   sid: 47,  imgId: 44,  uuid: 'd40c654f-3447-4e8f-b9c2-5d1a3c7e4b09' },
].map(t => ({ ...t, imgUrl: `${S3_GSTYLE}/${t.imgId}/${t.uuid}.jpg` }));

// ===== 共通 =====
async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { return null; }
}

async function registerShop(s) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${s.name}`); return; }
  const { error } = await supabase.from('shops').upsert(s, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ ${s.id}`);
}

async function registerTherapists(shopId, therapists, prefix) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const key = `${prefix}_${t.urlId || t.sid}`;
    let url = null;
    if (t.imgUrl) url = DRY_RUN ? t.imgUrl : await uploadImage(t.imgUrl, key);
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert({ id: tid, shop_id: shopId, name: t.name, image_url: url }, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${t.name}`); err++; }
      else { process.stdout.write('+'); ins++; }
    } else {
      process.stdout.write('+'); ins++;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`\n挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

async function main() {
  console.log(`=== 秋葉原2店舗 (DRY_RUN=${DRY_RUN}) ===\n`);
  const runN = !shopArg || shopArg === 'newplus';
  const runG = !shopArg || shopArg === 'gstyle';

  if (runN) {
    console.log(`--- NEW+PLUS ${NEWPLUS_THERAPISTS.length}名 ---`);
    await registerShop(NEWPLUS_SHOP);
    await registerTherapists(NEWPLUS_SHOP.id, NEWPLUS_THERAPISTS, 'newplus');
  }
  if (runG) {
    console.log(`\n--- G+Style ${GSTYLE_THERAPISTS.length}名 ---`);
    await registerShop(GSTYLE_SHOP);
    await registerTherapists(GSTYLE_SHOP.id, GSTYLE_THERAPISTS, 'gstyle');
  }
}

main().catch(console.error);
