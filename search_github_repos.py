import urllib.request, urllib.error, json, sys, os, time

TOKEN = "GITHUB_TOKEN_HERE"
OUTPUT = os.path.join(os.path.dirname(__file__), "github_repos_found.json")
LOG = os.path.join(os.path.dirname(__file__), "search_log.txt")

def log(m):
    with open(LOG, "a") as f:
        f.write(f"{time.strftime('%H:%M:%S')} - {m}\n")
    print(m)

def github_request(url):
    log("REQUEST: " + url[:80] + "...")
    try:
        req = urllib.request.Request(url)
        req.add_header("Authorization", "token " + TOKEN)
        req.add_header("User-Agent", "Mozilla/5.0")
        log("Headers set, calling urlopen...")
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read().decode())
        remaining = resp.headers.get("X-RateLimit-Remaining", "?")
        return data, int(remaining)
    except Exception as e:
        log(f"Request error: {e}")
        return None, 0

topics = [
    "marketing", "digital-marketing", "seo", "content-marketing",
    "growth-hacking", "social-media-marketing", "email-marketing",
    "copywriting", "affiliate-marketing", "branding",
    "conversion-optimization", "marketing-analytics",
    "advertising", "ppc", "marketing-automation", "crm",
    "lead-generation", "saas-marketing", "ecommerce-marketing",
    "video-marketing", "influencer-marketing", "newsletter",
    "product-marketing", "market-research",
    "b2b-marketing", "content-strategy", "brand-strategy",
    "growth-marketing", "community-management", "data-analytics",
    "customer-success", "google-ads", "facebook-ads",
    "instagram-marketing", "tiktok-marketing", "linkedin-marketing",
    "youtube-marketing", "ai-marketing", "chatgpt-marketing"
]

log(f"Starting search across {len(topics)} topics...")
all_repos = {}
api_calls = 0

for topic in topics:
    page = 1
    while page <= 10:
        url = f"https://api.github.com/search/repositories?q=topic:{topic}&per_page=100&page={page}&sort=stars&order=desc"
        data, remaining = github_request(url)
        api_calls += 1
        
        if data is None:
            if remaining == 0:
                log("Rate limited, waiting 60s...")
                time.sleep(60)
                continue
            break
        
        items = data.get("items", [])
        if not items:
            break
        
        for item in items:
            clone_url = item["clone_url"]
            if clone_url not in all_repos:
                all_repos[clone_url] = {
                    "name": item["full_name"],
                    "stars": item["stargazers_count"],
                    "description": item.get("description", "") or "",
                    "clone_url": clone_url,
                    "html_url": item["html_url"]
                }
        
        if len(items) < 100:
            break
        page += 1
        time.sleep(0.1)
    
    if api_calls % 20 == 0:
        log(f"Progress: {len(all_repos)} unique repos after {api_calls} API calls")

log(f"Search complete: {len(all_repos)} repos in {api_calls} API calls")

with open(OUTPUT, "w") as f:
    json.dump(list(all_repos.values()), f, indent=1)

log(f"Repo list saved to {OUTPUT}")
