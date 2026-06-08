import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

async def main():
    print("[https://www.mens-esthe-map.jp/] をブラウザで擬似的に開いて解析中（約5秒）...\n")
    
    async with async_playwright() as p:
        # headless=Trueでブラウザを画面に表示せずに実行
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # サイトにアクセスし、ネットワークが落ち着くまで待つ
        await page.goto("https://www.mens-esthe-map.jp/", wait_until="networkidle")
        
        # JavaScript実行後のHTMLを取得
        html = await page.content()
        soup = BeautifulSoup(html, 'html.parser')
        
        # 解析データの出力
        title = soup.title.string if soup.title else 'N/A'
        print(f"📌 タイトル:\n{title}\n")
        
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        desc = meta_desc['content'] if meta_desc else 'N/A'
        print(f"📌 ディスクリプション:\n{desc}\n")
        
        h1_tags = soup.find_all('h1')
        print("📌 H1タグ:")
        if h1_tags:
            for i, h1 in enumerate(h1_tags, 1):
                print(f"  {i}. {h1.text.strip()}")
        else:
            print("  （検出されませんでした）")
        print()

        links = soup.find_all('a')
        print(f"📌 ページ内の内部/外部リンク総数: {len(links)} 個")
        
        # 上位のいくつかのリンクを表示してみる
        if links:
            print("\n📌 検出されたリンクの例（最初の5件）:")
            count = 0
            for link in links:
                href = link.get('href')
                text = link.text.strip().replace('\n', '')
                if href and count < 5:
                    print(f"  - [{text}] -> {href}")
                    count += 1

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
