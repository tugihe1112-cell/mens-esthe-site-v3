import csv, re
from collections import defaultdict

BASE = '/sessions/friendly-vigilant-archimedes/mnt/uploads/'
def read(name):
    with open(BASE+name, encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))
def num(s): return float(str(s).replace('%','').replace(',',''))

q = read('クエリ.csv'); p = read('ページ.csv')
for r in q: r['q']=r['上位のクエリ']; r['c']=int(num(r['クリック数'])); r['i']=int(num(r['表示回数'])); r['pos']=num(r['掲載順位'])
for r in p: r['url']=r['上位のページ']; r['c']=int(num(r['クリック数'])); r['i']=int(num(r['表示回数'])); r['pos']=num(r['掲載順位'])

QI=sum(r['i'] for r in q); QC=sum(r['c'] for r in q)
print(f"■ クエリ総数 {len(q)} / 総表示 {QI} / 総クリック {QC} / CTR {QC/QI*100:.1f}% / 加重平均順位 {sum(r['pos']*r['i'] for r in q)/QI:.1f}")

brand=re.compile(r'(メンエス|メンズエステ).{0,3}(マップ|map)', re.I)
hangul=re.compile(r'[가-힣]')
pref='北海道|青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|東京|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|京都|大阪|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄|名古屋|横浜|神戸|仙台|札幌|浜松|金沢|梅田|難波|銀座|新宿|渋谷|池袋|秋葉原|上野|錦糸町|五反田|大井町|船橋|相模原|武蔵小杉|二子玉川|荻窪|祖師ヶ谷|恵比寿|麻布|赤坂|六本木|神保町|日暮里|江東|荒川'
def cat(s):
    s=s.strip()
    if brand.search(s): return 'ブランド指名'
    if hangul.search(s): return '韓国語(訪日/在日)'
    me=bool(re.search(r'メンズエステ|メンエス|mens\s*este|風俗エステ|패션헬스', s, re.I))
    if re.fullmatch(r'(メンズエステ|メンエス|めんえす|mens\s*este|メンズ\s*エステ)', s, re.I): return '汎用(メンエス単体)'
    if me and re.search(r'口コミ|ランキング|体験入店|健全|ポータル|検索|店舗|情報|案内|サイト|エリア', s): return '汎用(口コミ/比較系)'
    if me and re.search(pref+r'|駅|市|区|都内|町|県', s): return 'エリア×メンエス'
    return '店名/人名(指名)'

seg=defaultdict(lambda:[0,0,0])
for r in q:
    k=cat(r['q']); seg[k][0]+=r['i']; seg[k][1]+=r['c']; seg[k][2]+=1
print("\n■ クエリ意図セグメント（表示回数の降順）")
for k,v in sorted(seg.items(),key=lambda x:-x[1][0]):
    print(f"  {k:16s} 表示{v[0]:5d}({v[0]/QI*100:4.1f}%) クリック{v[1]:3d} 件数{v[2]:3d} CTR{(v[1]/v[0]*100 if v[0] else 0):4.1f}%")

def bucket(pos):
    return '①1-3位' if pos<=3 else '②4-10位(1頁下)' if pos<=10 else '③11-20位(2頁)' if pos<=20 else '④21位~(3頁~)'
posd=defaultdict(lambda:[0,0,0])
for r in q:
    b=bucket(r['pos']); posd[b][0]+=r['i']; posd[b][1]+=r['c']; posd[b][2]+=1
print("\n■ 表示回数の順位分布（=需要が今どこに埋もれているか）")
for b in ['①1-3位','②4-10位(1頁下)','③11-20位(2頁)','④21位~(3頁~)']:
    v=posd[b]; print(f"  {b:16s} 表示{v[0]:5d}({v[0]/QI*100:4.1f}%) クリック{v[1]:3d} クエリ{v[2]:3d}")

# CTR curve & opportunity
ctr={1:.28,2:.16,3:.11,4:.085,5:.07,6:.055,7:.045,8:.037,9:.031,10:.026}
def ec(pos):
    pp=int(round(pos))
    return ctr.get(pp,.02) if pp<=10 else (.015 if pp<=20 else .006)
TGT=.11
for r in p: r['op']=max(0, r['i']*(TGT-ec(r['pos']))) if r['pos']>3 else 0
shop=[r for r in p if '/shops/' in r['url']]; area=[r for r in p if '/area/' in r['url']]
sd=sorted([r for r in shop if 4<=r['pos']<=20 and r['i']>=5], key=lambda r:-r['op'])
print("\n■ 店舗ページ 機会スコア上位（pos4-20・表示5+／3位到達で得る推定追加click/3か月）")
print(f"  {'機会':>5} {'表示':>4} {'順位':>5} {'現':>3}  ページ(shop_id)")
for r in sd[:18]:
    print(f"  {r['op']:5.1f} {r['i']:4d} {r['pos']:5.1f} {r['c']:3d}  {r['url'].split('/shops/')[-1]}")
print(f"  → 店舗SD合計の推定追加click: {sum(r['op'] for r in sd):.0f}/3か月（現状この層のclickはほぼ0）")

print("\n■ エリアページ（表示は大きいが汎用語で競合強・上げにくい）")
print(f"  {'機会':>5} {'表示':>4} {'順位':>5} {'現':>3}  area")
for r in sorted(area,key=lambda r:-r['i']):
    print(f"  {r['op']:5.1f} {r['i']:4d} {r['pos']:5.1f} {r['c']:3d}  {r['url'].split('/area/')[-1]}")

# review-page (threads) presence
threads=[r for r in p if '/threads/' in r['url']]
print(f"\n■ セラピスト個別(/threads/)が検索に出た数: {len(threads)} （口コミページがほぼ未索引＝伸びしろの証拠）")
for r in threads: print(f"   表示{r['i']} pos{r['pos']} {r['url'].split('/shops/')[-1]}")

print(f"\n■ ページ総計: 表示{sum(r['i'] for r in p)} click{sum(r['c'] for r in p)} / shopページ{len(shop)} areaページ{len(area)}")
ko_i=seg['韓国語(訪日/在日)'][0]
print(f"■ 韓国語クエリ: 表示{ko_i}（未対応セグメント。河原町/木屋町/京都/熊本のパッションヘルス検索＝訪日・在日需要）")
