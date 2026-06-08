import requests
from bs4 import BeautifulSoup

def analyze_webpage(url):
    print(f"[{url}] の情報を取得中...\n")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.title.string if soup.title else 'N/A'
        print(f"📌 タイトル:\n{title}\n")
        
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        desc = meta_desc['content'] if meta_desc else 'N/A'
        print(f"📌 ディスクリプション:\n{desc}\n")
        
        h1_tags = soup.find_all('h1')
        print("📌 H1タグ:")
        for i, h1 in enumerate(h1_tags, 1):
             print(f"  {i}. {h1.text.strip()}")
        print()

        links = soup.find_all('a')
        print(f"📌 ページ内の内部/外部リンク総数: {len(links)} 個")
        
    else:
        print(f"取得失敗。ステータスコード: {response.status_code}")

if __name__ == "__main__":
    target_url = "https://www.mens-esthe-map.jp/"
    analyze_webpage(target_url)
