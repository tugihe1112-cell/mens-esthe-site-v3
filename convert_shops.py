import json

# 既存データを読み込み
with open('src/data/all_shops.json', 'r', encoding='utf-8') as f:
    all_shops = json.load(f)

# 最大IDを取得
max_id = max([shop['id'] for shop in all_shops])

# 新しい店舗データを読み込んで変換
new_shops = [
    'tokyo/arakawa/nippori/aroma_giraffe.json',
    'tokyo/arakawa/nippori/deep_black.json',
    'tokyo/arakawa/nippori/be_majo.json'
]

for i, shop_file in enumerate(new_shops):
    with open(shop_file, 'r', encoding='utf-8') as f:
        shop_data = json.load(f)
    
    # 既存の形式に変換
    converted = {
        "id": max_id + i + 1,
        "name": shop_data['name'],
        "prefecture": "東京都",
        "city": "荒川区",
        "area": "日暮里",
        "address": "東京都荒川区日暮里エリア",
        "image": "/images/shops/no_image.jpg",
        "rating": 0,
        "reviewCount": 0,
        "price": shop_data['price'],
        "hours": "要確認",
        "isPremium": False,
        "tags": shop_data.get('tags', []),
        "websiteUrl": shop_data['url'],
        "nearestStation": "日暮里駅",
        "description": f"{shop_data['name']} / 料金: {shop_data['price']}",
        "threads": [],
        "therapists": []
    }
    
    # セラピストデータを変換
    for girl in shop_data.get('girls', []):
        therapist = {
            "id": f"{converted['id']}-{girl['name'].replace(' ', '-')}",
            "name": girl['name'],
            "age": girl['age'],
            "height": girl['height'],
            "bust": 0,  # 計算が必要な場合は追加
            "cup": girl['cup'],
            "waist": 0,
            "hip": 0
        }
        converted['therapists'].append(therapist)
    
    all_shops.append(converted)

# 保存
with open('src/data/all_shops.json', 'w', encoding='utf-8') as f:
    json.dump(all_shops, f, ensure_ascii=False, indent=2)

print(f"✅ {len(new_shops)}店舗を追加しました！")
print(f"総店舗数: {len(all_shops)}")
