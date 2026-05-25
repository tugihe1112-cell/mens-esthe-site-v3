/**
 * 博多人妻さん セラピスト画像URL更新（tokenあり完全URL）
 * 実行: node scripts/maintenance/fix_hakata_hitozuma_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const FB = 'https://firebasestorage.googleapis.com/v0/b/fulock-4f657.appspot.com/o/images%2FqEau5NgAYpykQcJHPVXP%2F';
const img = (key, token) => `${FB}${key}?alt=media&token=${token}`;

// key → token マッピング（博多店91名 + 久留米店35名）
const TOKEN_MAP = {
  // 博多店
  'cVNkZTAK6FArTRGP': 'a286f81d-5432-43da-b729-fd7064c09cc6',
  '8XTIfhIyW1L9W1Yb': 'f6cdaa50-5f49-402e-b21d-5b8f90bd9d2c',
  'sEP4xlQqcXFdZ7iW': 'fda5ab1c-64f5-4911-9305-513eec68c95d',
  'FCCQZw91zn8FeUtg': '26525e82-3415-4a36-8cf5-53ae70953904',
  'XH0E6LjcyMDKCb2Y': 'f5bf7314-f1ae-4cf5-be8f-d020edf5801b',
  '253v62dAPKbpH0ot': '613937f0-5a0b-4132-8758-0d5c01e0f688',
  'KlYLQnpfEEiEyXFa': 'dc942731-1bdf-4bcd-b806-1da853b3acbb',
  'uTBJs38KDzdBu0K2': '08204c5f-d145-4681-9f57-4a3d1eb8a155',
  'iNxNrNvVWypFEXI0': 'd55f83f2-f877-4294-859d-4f8eb1621751',
  'zlRhkoYwlKHiX7bG': '42aa25c7-7202-4d20-a358-cb82deb7d817',
  'TPTCUw0xczdCIe0s': '7465fa92-e317-4a00-a100-0f32e6cfbc15',
  'GuwNmutg6p3AB02e': '4ca9e770-1642-4f5a-b00d-19aa231f2774',
  'kDWDB6zhVacCUcMN': '12343f60-75f2-4a6e-931e-63993b8f82ef',
  'ppdKMTRPysXuklD9': '75e22d7f-c6bf-4998-9e34-6b49c65be9d7',
  'l97dJeeXlfEVp04s': '65c7c4b0-496e-4188-9690-0b14b2f39817',
  'LURPcGLoTKMw6hP1': 'd727b188-63f8-4326-ae7f-5daa545eab56',
  'ZI5SQbvYzhNfAddZ': '12259a73-b5da-4035-ba63-5638425f8492',
  'y6UVG23NIDTibmCk': '34b102ba-f933-43d9-b0e6-bce5e546a139',
  'jQpjwGajzFbVAurO': '5754cc11-1f49-4ab4-9395-37ffcca65e00',
  'gpjyTSIFrJWBLtrs': 'e475bd7c-3633-4000-8fb5-356de4ab709f',
  'tGnxD6MVS7qGEeSZ': 'f9d2232f-5920-46c6-a3ac-5c46c3b56b19',
  'zsNsfaECHZuFKFoD': '65ad959a-670a-4da1-8ab6-782f2bca73a2',
  'KDohWiSpraBjyBKz': '8fff5322-def2-4484-9a8e-61329ce2f3a8',
  'NAttZOxl2EZJXH9e': '1625e720-984d-4f21-b4a2-1e1da727dab2',
  'RcZBFIlsx7Xs3x3o': '932bc68d-742c-4cdf-b99a-4384b59a75dd',
  'tEQmTbGcrLcU0Xcr': 'a4f73294-6b7b-4ac8-a276-254c9e46e518',
  'ipNdG69be73uRaat': 'e04fb617-7176-422d-9aac-3b25441c5f3d',
  'AKgu5QcuiKO7d3ke': 'fcbe5afb-206e-457d-b156-b70e47ff0a0c',
  'ePV5eJO6Km5PSGxJ': '35f826a8-7857-4eba-93de-1184bb42f2a7',
  'Di4xSiNw2rUYe54D': '0a131b19-77ae-4619-af35-b50756de8aae',
  'A1LyYGuCAcO3r1A9': '0fb6817e-adb6-4edf-97df-ebb5c9c063f6',
  'LY7ZrCJCbCVotfR9': '345579f3-a508-42da-b666-f17dfccc75c3',
  'Pn7vsUvLcB6TA01h': 'fd576633-03a9-4cc3-8031-9969250737d2',
  'XA4IGm78DZmN1cbQ': 'cf6c4a89-45bc-4820-b0e3-04f90f8d70b6',
  'QdIvdPkapeKSFhn0': '7e942def-71f3-4f38-a840-0aa7a80df944',
  'Vp8GkHAJMhFg9yoE': '5c90c973-7a18-4226-b39a-043a6f88d0d3',
  'cz6PEoipTOhgCWPr': 'cb4e48eb-f3e2-4b22-983c-b998f25a932a',
  'U5vM0rA4TukXhzcy': '9cbe5df8-8bfc-4846-9fe4-2ab69a2735f9',
  'YxQeITky497lMHj3': 'fd709eec-2ba7-4af3-9cbe-efab4b16602f',
  'AkJSpYVzMW5b87Rr': '5843a88e-5616-487d-856c-71b5fe7ed128',
  '1uXxX9oHGv8GYQyE': '78afd9ef-c798-4b12-bc2d-914050a00b87',
  'azWMtWHNROiJaGCd': 'e3ea92ad-e050-4f14-9144-c2e01b1485ea',
  'csJAP01EdLexK0qc': '1fe657d4-4b47-435b-a97d-ddca4c7f8b9e',
  'BzZqDQgwijK27I22': '3ec19715-0bae-4595-acd4-70568d019166',
  'A9VcgjUSCk4CU53e': '8c00db47-5cfc-4525-9852-e109fd7db358',
  'EgdhtLKfmHTGJrUv': '180febeb-3b1d-4ba9-bc9c-3c5b2a9c4ae0',
  'kX136DJy8wkHENnk': '7d2030b5-384c-4f87-944c-b3454c684258',
  'LHEHH9idN7i4yM30': '402e33ac-3cd1-40d1-b3df-1c06dcce08a0',
  'VN4yzKFKXLD62trx': '3712cd84-a0ff-487d-aeea-cded53d295f8',
  'i9YBbic3aivOnWOy': '9a424693-9043-4b04-8be5-828d03847fdb',
  'dUV0loz6A0z2FYAd': '57121d1c-1a2f-45a4-b37d-a3613f675f87',
  'JHLBuH51OwmoGHfk': 'ac75df5d-7ea0-458f-9666-708188603467',
  '7eVjTbUxWzO0d7MQ': '2d758bac-7b6c-4cd8-9149-84ad68e13cd1',
  'oEcXkXx4sEXcKvly': '8415e5be-037c-46b6-b399-19115bca7ee7',
  'OHBfQCliYMMUk8yt': '6ee299a4-a55c-489d-9af0-562cf2ae20c3',
  'jzuWb9kd3V4AwVac': 'c9eb08f1-b57c-4d11-836d-7195a390b19c',
  '9ahZdT5P3y99T7yO': '1bab81be-91f2-4f02-9606-510766dd312c',
  'SA4XsovxVHyo8PVB': '2747caee-eb61-422f-9478-2895cecdb3d6',
  '3QBVrq89Ns7gqlon': 'c088d871-24d9-4240-bae6-335318e626b8',
  'LAZM8xkElR6NjQEI': '8fc52b84-4d7e-4bf8-925e-63b6462f086b',
  'SD3LqFLuGNebhyFr': 'c3bd62dd-a524-426b-9149-86cb793f0b4f',
  'Ubc2i8QPOTrHy7dU': '1161d56f-c21c-4d27-a453-e233c5144973',
  'BUf1Rs6fasP06Jjy': '5c570212-3fa8-40d0-bd30-629d79b4c5c4',
  'AiiRxAEH3qLdaaze': '1445468f-df22-4a03-a748-50b056c18d15',
  'WduFyck36TnyJCAa': '3b03b39d-c6b6-4b33-94e4-e9ae13611b22',
  'OfH5Erw4OPCNhipz': '15fc602b-d8ae-44e1-b71d-326f3d32bb27',
  'PeVj2H2d1cMU5KHb': '75245dfd-2b48-4500-8e8a-2e793ce7e73e',
  'Bd2REtvnY9c8pyyD': 'dbaccc0e-00cc-4c48-b6fc-de59c2f2b27c',
  'IkNutE9sCam2aCeE': 'df2168a8-3490-4dc8-9fe4-cb2c62c0db85',
  'FKGm2ZbBtCqbCCa5': '61271925-9afc-4737-8a78-644b9e7f3dcc',
  'g3xN3k3DDA2w6J6T': '585a7b02-04fe-4292-9f61-2bb233784457',
  'zKMmq2g9De7Z20GB': 'bd139826-ae14-4128-a027-ae88315abbf6',
  'IGXlb2NXyM81fN1j': '30ca1587-0d71-4f63-abda-32716ec864b4',
  'x6B3pAk0gVa6TsX4': 'c9e299af-45cc-4c40-86ab-e57f054b2313',
  'ABt9UB2p49Sz3JZ4': '655147be-01c4-4980-90e8-e5b9aad90090',
  'DosDvTi0kR2ibUb0': '60167d24-380d-4023-9032-948d28afe226',
  'IdKZr88YwFV4mJOQ': '0f9809c2-1f72-4932-bea3-1ee589ae7a97',
  'jT9qbTnF5A5o3Ekr': '3ada7d8c-014c-49cd-955f-07782260a1e5',
  'tkAe2IJIlUFmxj30': 'e21a539c-7ba1-457e-919a-8c74a9585ae0',
  'VR7L3sI4BCjaLqrl': '6a5783f7-eff6-4dc0-969e-3d2d5e1de11a',
  '771a2bNReMrzfXyD': '300d82bf-b405-4dc1-8791-18b0d8c65102',
  'tgjpQN5tpgOG8XHA': '933236bc-7a38-4ff9-a520-2449b3dba5ad',
  'EAv07rRmNCIaozrI': '4f3d14f8-692a-411c-af17-44baa8f03773',
  'Hb5wYzlPVZrC8K1C': '51354d1f-9e18-48dc-8751-46b14b94c631',
  'sOWqtyszHlFbpqUr': '38d17fa0-63cc-40d9-98df-909926b0c21e',
  'AS9VBKWwOx2qgEhl': '56800453-ed3a-4add-b24e-d1d4864d7e8a',
  'ozyBm1nxBNHt1XtO': 'f44ab75d-2f26-4ea5-b7e0-70e0f7b81a70',
  '5nSqN059tPpAOuT0': '844f9296-222e-405f-b570-9f7ef42920c9',
  'aeWjwlkIr5FQNerN': 'e404f0d4-3005-462c-af28-b25d53338679',
  'LNudEu3c0I5tm1Gf': '7152b62b-528c-45af-bcd0-9f5315691833',
  'WSXwoOzL47zBYgRS': '49ab95f6-5998-4a32-98b3-d256ca8a0471',
  // 久留米店
  'uYKJS0EKjUoeNnOR': 'c571fb5e-5691-47cc-9983-3249a3d455b1',
  'TuJ74UElmJMTdXNn': 'd089bdd9-1bd9-44ed-b211-7f176c894647',
  '5reLuEkkXlLvPIYP': 'b094ccef-efc8-426c-8eee-6889db2546da',
  'g6jTiQ5UJHI5DOYo': '46bd4397-6cd4-4911-a08b-e904a7ea7249',
  'GyNIhOBUjaIfFjq7': '9607854d-5bca-44f2-b3a6-404bf3eae446',
  'QYlT849PSiVWweLP': '19cf5686-40e8-42d0-8346-dd0b07b9eebd',
  'rDV6bMixeQFIvryh': '45474435-0702-4152-b580-056f22347ff1',
  'PGArAuPqS0zWqOyp': 'a0efaf6f-ba2e-4929-99a6-86bcf01f921d',
  'ct1QpewL8xyzSkQM': '76352c27-478b-4b01-8fdc-15052c7fa347',
  '4y6YICHTxpOoTIAE': '3c85eca5-e238-49fd-9c4c-14bb1dc79ce0',
  'exgB7PDOJ1SGSB9x': '1cf6d53e-7c2e-441b-aebe-7e5d75af7390',
  '7FTzewnAfrawdnD8': '552faa27-20ac-4693-8f93-ac54c4ddddb3',
  'pNjMLGTz56gPdyvk': 'c08aa93b-bfff-406c-a9c2-6648a6158834',
  '94IEss87UfFgrSEe': 'f05fdfcd-9d04-4d92-9228-b8ee0648a8ea',
  'bHkkLpyyWMZIdxy6': '35d4fe83-cfd4-4e17-83e1-a6bf4dd035bc',
  'vwu1VypEZXGKs68P': '2fd9f4dd-3287-42da-9c55-9e4f6260c6b7',
  'h0vQFCaOG9iwoKXG': '0bbf62b1-d31f-4690-9ac9-04a26fb3c2dd',
  'H7GCRMygFq14S4eD': 'edf751f0-a308-4787-9495-0e4f57f44e3e',
  'H6pCDwsp6YOhdcWL': '0a435246-6553-41f9-acd5-a1886629e4b3',
  'fQKixQs1KlufopPG': '42599ef6-d0ab-426d-abd5-35ce5ecc86cb',
  'EO5oKykoHVGaGGLT': '443cc0d9-a0aa-4bd1-9444-05cbd8b6cb37',
  'HCxoX04SNehpwFdE': 'e200589e-652e-426d-abd5-671d663bb808',
  'CiDID7RTjM20xR7O': 'e67d2e4e-08ca-4f4d-8958-3d3bb89ec82f',
  'GtaptYf1dg5ISfU0': '0eace59d-d166-495a-a1aa-2dba6d09c976',
  'Tvs13O8iIAzIpEhM': 'eb99b5e6-ec82-4af6-b7f2-5b32ef080bac',
  'FSfM2oKI3Ot6x8X8': '8e06d763-9b0d-4431-885c-3147841a6507',
  'DuhIBedcTcKU7BBk': '7d676d50-dd3b-4fe6-bc09-7f6b5641c09f',
  'oQSaojW8UCyc7xZj': 'e9712b18-87d1-4d2c-8cfc-725ac5f45e56',
  'U8jXMQ5fTiBf9ZYX': '2f8dd156-6602-476f-aaa1-f417e56b152e',
  'HN9LeDbTCZYDcIy4': '448e4310-d744-4e16-8722-ae7ebe336a39',
  'HAXQKR9L9uO3PG0A': 'a60241bc-e50e-46ba-ac5e-9ec1f578ff77',
  '1g96gwDGGs7xGUKp': '901c659c-fe24-4433-a3f7-ffb85cdc5fb6',
  'yDE3jx2NbbIQ8eVm': 'd59e89e4-3a7a-444d-a531-847f015e4001',
  'tFuI4OhTqgHQ45NS': '3e17fc39-8138-40e1-b657-bd725f2ba0b3',
  '5xunOkgP1FEmgaOb': '7392f110-b234-4a6b-9ced-e4c09ed87556',
};

// name → key マッピング（process_hakata_hitozuma.mjs と同順）
const NAME_KEY = [
  ['桃瀬夫人', 'cVNkZTAK6FArTRGP'],
  ['菊川夫人', '8XTIfhIyW1L9W1Yb'],
  ['早乙女夫人', 'sEP4xlQqcXFdZ7iW'],
  ['島田夫人', 'FCCQZw91zn8FeUtg'],
  ['前田夫人', 'XH0E6LjcyMDKCb2Y'],
  ['五十嵐夫人', '253v62dAPKbpH0ot'],
  ['吉岡夫人', 'KlYLQnpfEEiEyXFa'],
  ['平野夫人', 'uTBJs38KDzdBu0K2'],
  ['日野夫人', 'iNxNrNvVWypFEXI0'],
  ['久保田夫人', 'zlRhkoYwlKHiX7bG'],
  ['児島夫人', 'TPTCUw0xczdCIe0s'],
  ['梅崎夫人', 'GuwNmutg6p3AB02e'],
  ['有村夫人', 'kDWDB6zhVacCUcMN'],
  ['和久井夫人', 'ppdKMTRPysXuklD9'],
  ['城田夫人', 'l97dJeeXlfEVp04s'],
  ['三浦夫人', 'LURPcGLoTKMw6hP1'],
  ['戸田夫人', 'ZI5SQbvYzhNfAddZ'],
  ['森高夫人', 'y6UVG23NIDTibmCk'],
  ['織田夫人', 'jQpjwGajzFbVAurO'],
  ['片岡夫人', 'gpjyTSIFrJWBLtrs'],
  ['草刈夫人', 'tGnxD6MVS7qGEeSZ'],
  ['近藤夫人', 'zsNsfaECHZuFKFoD'],
  ['秋吉夫人', 'KDohWiSpraBjyBKz'],
  ['西田夫人', 'NAttZOxl2EZJXH9e'],
  ['姫乃夫人', 'RcZBFIlsx7Xs3x3o'],
  ['杉本夫人', 'tEQmTbGcrLcU0Xcr'],
  ['若菜夫人', 'ipNdG69be73uRaat'],
  ['美咲夫人', 'AKgu5QcuiKO7d3ke'],
  ['渡部夫人', 'ePV5eJO6Km5PSGxJ'],
  ['黒田夫人', 'Di4xSiNw2rUYe54D'],
  ['小川夫人', 'A1LyYGuCAcO3r1A9'],
  ['三原夫人', 'LY7ZrCJCbCVotfR9'],
  ['広末夫人', 'Pn7vsUvLcB6TA01h'],
  ['倉田夫人', 'XA4IGm78DZmN1cbQ'],
  ['長谷川夫人', 'QdIvdPkapeKSFhn0'],
  ['菅野夫人', 'Vp8GkHAJMhFg9yoE'],
  ['萩原夫人', 'cz6PEoipTOhgCWPr'],
  ['白石夫人', 'U5vM0rA4TukXhzcy'],
  ['米倉夫人', 'YxQeITky497lMHj3'],
  ['風見夫人', 'AkJSpYVzMW5b87Rr'],
  ['青山夫人', '1uXxX9oHGv8GYQyE'],
  ['桜井夫人', 'azWMtWHNROiJaGCd'],
  ['河野夫人', 'csJAP01EdLexK0qc'],
  ['並木夫人', 'BzZqDQgwijK27I22'],
  ['松嶋夫人', 'A9VcgjUSCk4CU53e'],
  ['花咲夫人', 'EgdhtLKfmHTGJrUv'],
  ['椿夫人', 'kX136DJy8wkHENnk'],
  ['二階堂夫人', 'LHEHH9idN7i4yM30'],
  ['宇野夫人', 'VN4yzKFKXLD62trx'],
  ['雨音夫人', 'i9YBbic3aivOnWOy'],
  ['酒井夫人', 'dUV0loz6A0z2FYAd'],
  ['真木夫人', 'JHLBuH51OwmoGHfk'],
  ['長山夫人', '7eVjTbUxWzO0d7MQ'],
  ['神田夫人', 'oEcXkXx4sEXcKvly'],
  ['飯田夫人', 'OHBfQCliYMMUk8yt'],
  ['山下夫人', 'jzuWb9kd3V4AwVac'],
  ['朝比奈夫人', '9ahZdT5P3y99T7yO'],
  ['辻夫人', 'SA4XsovxVHyo8PVB'],
  ['辺見夫人', '3QBVrq89Ns7gqlon'],
  ['麻央(四季)', 'LAZM8xkElR6NjQEI'],
  ['吉乃(四季)', 'SD3LqFLuGNebhyFr'],
  ['智子(四季)', 'Ubc2i8QPOTrHy7dU'],
  ['蘭(四季)', 'BUf1Rs6fasP06Jjy'],
  ['美代子(四季)', 'AiiRxAEH3qLdaaze'],
  ['弥生(四季)', 'WduFyck36TnyJCAa'],
  ['聖子(四季)', 'OfH5Erw4OPCNhipz'],
  ['幸子(四季)', 'PeVj2H2d1cMU5KHb'],
  ['桃子(四季)', 'Bd2REtvnY9c8pyyD'],
  ['敦子(四季)', 'IkNutE9sCam2aCeE'],
  ['由布子(四季)', 'FKGm2ZbBtCqbCCa5'],
  ['忍(四季)', 'g3xN3k3DDA2w6J6T'],
  ['彩(四季)', 'zKMmq2g9De7Z20GB'],
  ['冬乃(四季)', 'IGXlb2NXyM81fN1j'],
  ['景子(四季)', 'x6B3pAk0gVa6TsX4'],
  ['優香(四季)', 'ABt9UB2p49Sz3JZ4'],
  ['栞(四季)', 'DosDvTi0kR2ibUb0'],
  ['貴子(四季)', 'IdKZr88YwFV4mJOQ'],
  ['直美(四季)', 'jT9qbTnF5A5o3Ekr'],
  ['真理子(四季)', 'tkAe2IJIlUFmxj30'],
  ['真由美(四季)', 'VR7L3sI4BCjaLqrl'],
  ['明美(四季)', '771a2bNReMrzfXyD'],
  ['恵美(四季)', 'tgjpQN5tpgOG8XHA'],
  ['凛子(四季)', 'EAv07rRmNCIaozrI'],
  ['紅(四季)', 'Hb5wYzlPVZrC8K1C'],
  ['朝子(四季)', 'sOWqtyszHlFbpqUr'],
  ['洋子(四季)', 'AS9VBKWwOx2qgEhl'],
  ['桜子(四季)', 'ozyBm1nxBNHt1XtO'],
  ['双葉(四季)', '5nSqN059tPpAOuT0'],
  ['愛子(四季)', 'aeWjwlkIr5FQNerN'],
  ['梓(四季)', 'LNudEu3c0I5tm1Gf'],
  ['文(四季)', 'WSXwoOzL47zBYgRS'],
  // 久留米店
  ['青(あお)夫人', 'uYKJS0EKjUoeNnOR'],
  ['菊川夫人_久留米', 'TuJ74UElmJMTdXNn'],
  ['佐野夫人', '5reLuEkkXlLvPIYP'],
  ['奥村夫人', 'g6jTiQ5UJHI5DOYo'],
  ['七瀬夫人', 'GyNIhOBUjaIfFjq7'],
  ['華山夫人', 'QYlT849PSiVWweLP'],
  ['大沢夫人', 'rDV6bMixeQFIvryh'],
  ['春野夫人', 'PGArAuPqS0zWqOyp'],
  ['乙葉夫人', 'ct1QpewL8xyzSkQM'],
  ['増田夫人', '4y6YICHTxpOoTIAE'],
  ['今井夫人', 'exgB7PDOJ1SGSB9x'],
  ['坂梨夫人', '7FTzewnAfrawdnD8'],
  ['桃田夫人', 'pNjMLGTz56gPdyvk'],
  ['成瀬夫人', '94IEss87UfFgrSEe'],
  ['望月夫人', 'bHkkLpyyWMZIdxy6'],
  ['近藤夫人_久留米', 'vwu1VypEZXGKs68P'],
  ['小柳夫人', 'h0vQFCaOG9iwoKXG'],
  ['菅野夫人_久留米', 'H7GCRMygFq14S4eD'],
  ['長谷川夫人_久留米', 'H6pCDwsp6YOhdcWL'],
  ['紺野夫人', 'fQKixQs1KlufopPG'],
  ['姫乃夫人_久留米', 'EO5oKykoHVGaGGLT'],
  ['夏目夫人', 'HCxoX04SNehpwFdE'],
  ['野亜夫人', 'CiDID7RTjM20xR7O'],
  ['椎名夫人', 'GtaptYf1dg5ISfU0'],
  ['山口夫人', 'Tvs13O8iIAzIpEhM'],
  ['綾瀬夫人', 'FSfM2oKI3Ot6x8X8'],
  ['宮崎夫人', 'DuhIBedcTcKU7BBk'],
  ['真木夫人_久留米', 'oQSaojW8UCyc7xZj'],
  ['三崎夫人', 'U8jXMQ5fTiBf9ZYX'],
  ['佐々木夫人', 'HN9LeDbTCZYDcIy4'],
  ['葉月夫人', 'HAXQKR9L9uO3PG0A'],
  ['南夫人', '1g96gwDGGs7xGUKp'],
  ['伊東夫人', 'yDE3jx2NbbIQ8eVm'],
  ['目黒夫人', 'tFuI4OhTqgHQ45NS'],
  ['瀬戸夫人', '5xunOkgP1FEmgaOb'],
];

// shop_id取得
const { data: shops } = await supabase
  .from('shops')
  .select('id, name')
  .filter('raw_data->>prefecture', 'eq', '福岡県')
  .ilike('website_url', '%hakatahitozuma%');

const shop = shops?.[0];
if (!shop) { console.error('❌ shop not found'); process.exit(1); }
console.log(`✅ shop: ${shop.name} (${shop.id})`);
if (DRY_RUN) console.log('[DRY RUN]');

let updated = 0, errors = 0;

for (const [name, key] of NAME_KEY) {
  const token = TOKEN_MAP[key];
  if (!token) { console.log(`⚠️ tokenなし: ${name} (key: ${key})`); continue; }
  const imageUrl = img(key, token);
  const id = `${shop.id}_${name}`;

  if (DRY_RUN) {
    console.log(`[DRY] ${name} → ${imageUrl.slice(0, 80)}...`);
    continue;
  }

  const { error } = await supabase.from('therapists')
    .update({ image_url: imageUrl })
    .eq('id', id);

  if (error) {
    console.error(`❌ ${name}: ${error.message}`);
    errors++;
  } else {
    console.log(`✅ ${name}`);
    updated++;
  }
}

if (!DRY_RUN) console.log(`\n完了: 更新 ${updated}名, エラー ${errors}名`);
