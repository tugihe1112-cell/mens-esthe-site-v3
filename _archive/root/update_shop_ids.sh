#!/bin/bash

echo "=== AROMA more ID変更開始 ==="

# 六本木 16008 → 60010
sed -i '' 's/"id": 16008/"id": 60010/g' public/data/tokyo/minato/roppongi/aromamore.json
sed -i '' 's/"id": 1600801/"id": 6001001/g; s/"id": 1600802/"id": 6001002/g; s/"id": 1600803/"id": 6001003/g; s/"id": 1600804/"id": 6001004/g; s/"id": 1600805/"id": 6001005/g; s/"id": 1600806/"id": 6001006/g; s/"id": 1600807/"id": 6001007/g; s/"id": 1600808/"id": 6001008/g; s/"id": 1600809/"id": 6001009/g; s/"id": 16008\([0-9][0-9]\)/"id": 60010\1/g' public/data/tokyo/minato/roppongi/aromamore.json
echo "✓ 六本木完了"

# 日本橋 16008 → 60011
sed -i '' 's/"id": 16008/"id": 60011/g' public/data/tokyo/chuo/nihonbashi/aromamore.json
sed -i '' 's/"id": 1600801/"id": 6001101/g; s/"id": 1600802/"id": 6001102/g; s/"id": 1600803/"id": 6001103/g; s/"id": 1600804/"id": 6001104/g; s/"id": 1600805/"id": 6001105/g; s/"id": 1600806/"id": 6001106/g; s/"id": 1600807/"id": 6001107/g; s/"id": 1600808/"id": 6001108/g; s/"id": 1600809/"id": 6001109/g; s/"id": 16008\([0-9][0-9]\)/"id": 60011\1/g' public/data/tokyo/chuo/nihonbashi/aromamore.json
echo "✓ 日本橋完了"

# 高田馬場 16008 → 60012
sed -i '' 's/"id": 16008/"id": 60012/g' public/data/tokyo/shinjuku/takadanobaba/aromamore.json
sed -i '' 's/"id": 1600801/"id": 6001201/g; s/"id": 1600802/"id": 6001202/g; s/"id": 1600803/"id": 6001203/g; s/"id": 1600804/"id": 6001204/g; s/"id": 1600805/"id": 6001205/g; s/"id": 1600806/"id": 6001206/g; s/"id": 1600807/"id": 6001207/g; s/"id": 1600808/"id": 6001208/g; s/"id": 1600809/"id": 6001209/g; s/"id": 16008\([0-9][0-9]\)/"id": 60012\1/g' public/data/tokyo/shinjuku/takadanobaba/aromamore.json
echo "✓ 高田馬場完了"

# 歌舞伎町 16008 → 60013
sed -i '' 's/"id": 16008/"id": 60013/g' public/data/tokyo/shinjuku/kabukicho/aromamore.json
sed -i '' 's/"id": 1600801/"id": 6001301/g; s/"id": 1600802/"id": 6001302/g; s/"id": 1600803/"id": 6001303/g; s/"id": 1600804/"id": 6001304/g; s/"id": 1600805/"id": 6001305/g; s/"id": 1600806/"id": 6001306/g; s/"id": 1600807/"id": 6001307/g; s/"id": 1600808/"id": 6001308/g; s/"id": 1600809/"id": 6001309/g; s/"id": 16008\([0-9][0-9]\)/"id": 60013\1/g' public/data/tokyo/shinjuku/kabukicho/aromamore.json
echo "✓ 歌舞伎町完了"

# 新宿 16008 → 60014
sed -i '' 's/"id": 16008/"id": 60014/g' public/data/tokyo/shinjuku/shinjuku/aromamore.json
sed -i '' 's/"id": 1600801/"id": 6001401/g; s/"id": 1600802/"id": 6001402/g; s/"id": 1600803/"id": 6001403/g; s/"id": 1600804/"id": 6001404/g; s/"id": 1600805/"id": 6001405/g; s/"id": 1600806/"id": 6001406/g; s/"id": 1600807/"id": 6001407/g; s/"id": 1600808/"id": 6001408/g; s/"id": 1600809/"id": 6001409/g; s/"id": 16008\([0-9][0-9]\)/"id": 60014\1/g' public/data/tokyo/shinjuku/shinjuku/aromamore.json
echo "✓ 新宿完了"

# 西新宿 16008 → 60015
sed -i '' 's/"id": 16008/"id": 60015/g' public/data/tokyo/shinjuku/nishishinjuku/aromamore.json
sed -i '' 's/"id": 1600801/"id": 6001501/g; s/"id": 1600802/"id": 6001502/g; s/"id": 1600803/"id": 6001503/g; s/"id": 1600804/"id": 6001504/g; s/"id": 1600805/"id": 6001505/g; s/"id": 1600806/"id": 6001506/g; s/"id": 1600807/"id": 6001507/g; s/"id": 1600808/"id": 6001508/g; s/"id": 1600809/"id": 6001509/g; s/"id": 16008\([0-9][0-9]\)/"id": 60015\1/g' public/data/tokyo/shinjuku/nishishinjuku/aromamore.json
echo "✓ 西新宿完了"

# 池袋 16008 → 60016
sed -i '' 's/"id": 16008/"id": 60016/g' public/data/tokyo/toshima/ikebukuro/aromamore.json
sed -i '' 's/"id": 1600801/"id": 6001601/g; s/"id": 1600802/"id": 6001602/g; s/"id": 1600803/"id": 6001603/g; s/"id": 1600804/"id": 6001604/g; s/"id": 1600805/"id": 6001605/g; s/"id": 1600806/"id": 6001606/g; s/"id": 1600807/"id": 6001607/g; s/"id": 1600808/"id": 6001608/g; s/"id": 1600809/"id": 6001609/g; s/"id": 16008\([0-9][0-9]\)/"id": 60016\1/g' public/data/tokyo/toshima/ikebukuro/aromamore.json
echo "✓ 池袋完了"

# 代々木原宿 16008 → 60017
sed -i '' 's/"id": 16008/"id": 60017/g' public/data/tokyo/shibuya/yoyogi_harajuku/aromamore.json
sed -i '' 's/"id": 1600801/"id": 6001701/g; s/"id": 1600802/"id": 6001702/g; s/"id": 1600803/"id": 6001703/g; s/"id": 1600804/"id": 6001704/g; s/"id": 1600805/"id": 6001705/g; s/"id": 1600806/"id": 6001706/g; s/"id": 1600807/"id": 6001707/g; s/"id": 1600808/"id": 6001708/g; s/"id": 1600809/"id": 6001709/g; s/"id": 16008\([0-9][0-9]\)/"id": 60017\1/g' public/data/tokyo/shibuya/yoyogi_harajuku/aromamore.json
echo "✓ 代々木原宿完了"

# 恵比寿 16008 → 60018
sed -i '' 's/"id": 16008/"id": 60018/g' public/data/tokyo/shibuya/ebisu/aromamore.json
sed -i '' 's/"id": 1600801/"id": 6001801/g; s/"id": 1600802/"id": 6001802/g; s/"id": 1600803/"id": 6001803/g; s/"id": 1600804/"id": 6001804/g; s/"id": 1600805/"id": 6001805/g; s/"id": 1600806/"id": 6001806/g; s/"id": 1600807/"id": 6001807/g; s/"id": 1600808/"id": 6001808/g; s/"id": 1600809/"id": 6001809/g; s/"id": 16008\([0-9][0-9]\)/"id": 60018\1/g' public/data/tokyo/shibuya/ebisu/aromamore.json
echo "✓ 恵比寿完了"

echo ""
echo "=== Mirajour ID変更開始 ==="

# 新宿御苑 16014 → 60019
sed -i '' 's/"id": 16014/"id": 60019/g' public/data/tokyo/shinjuku/shinjuku_gyoen/mirajour.json
sed -i '' 's/"id": 1601400/"id": 6001900/g; s/"id": 16014\([0-9][0-9][0-9]\)/"id": 60019\1/g' public/data/tokyo/shinjuku/shinjuku_gyoen/mirajour.json
echo "✓ 新宿御苑完了"

# 大久保 16014 → 60020
sed -i '' 's/"id": 16014/"id": 60020/g' public/data/tokyo/shinjuku/okubo/mirajour.json
sed -i '' 's/"id": 1601400/"id": 6002000/g; s/"id": 16014\([0-9][0-9][0-9]\)/"id": 60020\1/g' public/data/tokyo/shinjuku/okubo/mirajour.json
echo "✓ 大久保完了"

# 高田馬場 16014 → 60021
sed -i '' 's/"id": 16014/"id": 60021/g' public/data/tokyo/shinjuku/takadanobaba/mirajour.json
sed -i '' 's/"id": 1601400/"id": 6002100/g; s/"id": 16014\([0-9][0-9][0-9]\)/"id": 60021\1/g' public/data/tokyo/shinjuku/takadanobaba/mirajour.json
echo "✓ 高田馬場完了"

# 東新宿 16014 → 60022
sed -i '' 's/"id": 16014/"id": 60022/g' public/data/tokyo/shinjuku/higashishinjuku/mirajour.json
sed -i '' 's/"id": 1601400/"id": 6002200/g; s/"id": 16014\([0-9][0-9][0-9]\)/"id": 60022\1/g' public/data/tokyo/shinjuku/higashishinjuku/mirajour.json
echo "✓ 東新宿完了"

# 新宿三丁目 16014 → 60023
sed -i '' 's/"id": 16014/"id": 60023/g' public/data/tokyo/shinjuku/shinjuku_sanchome/mirajour.json
sed -i '' 's/"id": 1601400/"id": 6002300/g; s/"id": 16014\([0-9][0-9][0-9]\)/"id": 60023\1/g' public/data/tokyo/shinjuku/shinjuku_sanchome/mirajour.json
echo "✓ 新宿三丁目完了"

# 西新宿 16014 → 60024
sed -i '' 's/"id": 16014/"id": 60024/g' public/data/tokyo/shinjuku/nishishinjuku/mirajour.json
sed -i '' 's/"id": 1601400/"id": 6002400/g; s/"id": 16014\([0-9][0-9][0-9]\)/"id": 60024\1/g' public/data/tokyo/shinjuku/nishishinjuku/mirajour.json
echo "✓ 西新宿完了"

# 池袋 16014 → 60025
sed -i '' 's/"id": 16014/"id": 60025/g' public/data/tokyo/toshima/ikebukuro/mirajour.json
sed -i '' 's/"id": 1601400/"id": 6002500/g; s/"id": 16014\([0-9][0-9][0-9]\)/"id": 60025\1/g' public/data/tokyo/toshima/ikebukuro/mirajour.json
echo "✓ 池袋完了"

# 渋谷 414 → 60026
sed -i '' 's/"id": 414/"id": 60026/g' public/data/tokyo/shibuya/shibuya/mirajour.json
sed -i '' 's/"id": 41400/"id": 6002600/g; s/"id": 414\([0-9][0-9]\)/"id": 60026\1/g' public/data/tokyo/shibuya/shibuya/mirajour.json
echo "✓ 渋谷完了"

echo ""
echo "=== 完了！全ての店舗IDを更新しました ==="
echo ""
echo "確認コマンド："
echo "find public/data -name 'aromamore.json' -exec sh -c 'echo \"\$1: \$(grep -m1 \\\"id\\\":\\ \"\$1\")\"' _ {} \;"
echo "find public/data -name 'mirajour.json' -exec sh -c 'echo \"\$1: \$(grep -m1 \\\"id\\\":\\ \"\$1\")\"' _ {} \;"
