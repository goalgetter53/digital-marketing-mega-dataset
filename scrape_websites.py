import os, subprocess, threading, time, json

WEB_DIR = r'C:\Users\Admin\AppData\Local\Temp\opencode\web_content'
os.makedirs(WEB_DIR, exist_ok=True)

# Marketing websites to scrape with specific article sections
SITES = [
    # SEO
    ("backlinko.com", "https://backlinko.com/blog", 50),
    ("moz.com", "https://moz.com/blog", 50),
    ("searchengineland.com", "https://searchengineland.com/library", 50),
    ("searchenginejournal.com", "https://searchenginejournal.com/category/seo/", 50),
    
    # Copywriting
    ("copyhackers.com", "https://copyhackers.com/articles", 30),
    ("copyblogger.com", "https://copyblogger.com/blog/", 30),
    ("verywellmind.com", "https://www.verywellmind.com/marketing-psychology-5214458", 20),
    
    # Digital Marketing
    ("hubspot.com", "https://blog.hubspot.com/marketing", 100),
    ("neilpatel.com", "https://neilpatel.com/blog/", 50),
    ("wordstream.com", "https://www.wordstream.com/blog", 50),
    ("hootsuite.com", "https://blog.hootsuite.com/social-media-marketing/", 30),
    ("buffer.com", "https://buffer.com/resources/", 30),
    ("sproutsocial.com", "https://sproutsocial.com/insights/", 30),
    ("later.com", "https://later.com/blog/", 30),
    
    # Paid Ads
    ("optimmonster.com", "https://optimmonster.com/blog/", 30),
    ("unbounce.com", "https://unbounce.com/blog/", 30),
    ("instapage.com", "https://instapage.com/blog/", 30),
    
    # Analytics
    ("kissmetrics.com", "https://blog.kissmetrics.com/", 20),
    ("klipfolio.com", "https://www.klipfolio.com/blog", 20),
    
    # Ecommerce
    ("shopify.com", "https://www.shopify.com/blog", 50),
    ("bigcommerce.com", "https://www.bigcommerce.com/blog/", 20),
    
    # Social Media
    ("smexaminer.com", "https://www.socialmediaexaminer.com/", 30),
    ("tiktok.com", "https://www.tiktok.com/business/en/blog", 20),
    
    # General
    ("marketingprofs.com", "https://www.marketingprofs.com/", 30),
    ("cmigroup.com", "https://contentmarketinginstitute.com/blog/", 30),
]

STATUS_FILE = os.path.join(WEB_DIR, '_progress.json')

def scrape_site(name, url, max_pages):
    """Scrape articles from a marketing website"""
    site_dir = os.path.join(WEB_DIR, name.replace('.', '_'))
    os.makedirs(site_dir, exist_ok=True)
    
    # Skip if already done
    existing = [f for f in os.listdir(site_dir) if f.endswith('.html')]
    if len(existing) >= max_pages * 0.5:
        print(f'{name}: already {len(existing)} pages, skip')
        return len(existing)
    
    print(f'{name}: scraping {url[:60]}...')
    
    # Use wget to download recursively with depth 2
    cmd = (
        f'wget --recursive --level=2 --no-parent --wait=2 --random-wait '
        f'--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" '
        f'--directory-prefix="{site_dir}" --accept="*.html,*.htm" '
        f'--exclude-directories="*/tag/*,*/author/*,*/category/*,*/page/*" '
        f'--quiet --timeout=10 --tries=2 "{url}"'
    )
    
    try:
        subprocess.run(cmd, shell=True, timeout=300)
    except subprocess.TimeoutExpired:
        pass
    
    # Count what we got
    all_files = []
    for root, dirs, files in os.walk(site_dir):
        for f in files:
            if f.endswith('.html') or f.endswith('.htm'):
                all_files.append(os.path.join(root, f))
    
    print(f'{name}: {len(all_files)} pages saved')
    
    # Update progress
    progress = {}
    if os.path.exists(STATUS_FILE):
        with open(STATUS_FILE) as f:
            progress = json.load(f)
    progress[name] = len(all_files)
    with open(STATUS_FILE, 'w') as f:
        json.dump(progress, f)
    
    return len(all_files)

def track():
    while True:
        time.sleep(30)
        total = 0
        for root, dirs, files in os.walk(WEB_DIR):
            for f in files:
                if f.endswith(('.html','.htm','.txt','.md')):
                    total += 1
        mb = sum(os.path.getsize(os.path.join(root,f)) 
                 for root, dirs, files in os.walk(WEB_DIR) 
                 for f in files if f.endswith(('.html','.htm','.txt','.md'))) / (1024*1024)
        print(f'[WEB] {total} files, {mb:.2f}MB')

def main():
    print(f'Starting web scraping to {WEB_DIR}')
    
    tracker = threading.Thread(target=track, daemon=True)
    tracker.start()
    
    # Scrape with 3 concurrent processes
    from concurrent.futures import ThreadPoolExecutor, as_completed
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = []
        for name, url, count in SITES:
            futures.append(executor.submit(scrape_site, name, url, count))
        
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f'Site failed: {e}')
    
    print(f'\n=== WEB SCRAPING DONE ===')

if __name__ == '__main__':
    main()
