import os, json, subprocess, time
from youtube_transcript_api import YouTubeTranscriptApi as YTA

OUT = r'C:\Users\Admin\AppData\Local\Temp\opencode\youtube_transcripts'
os.makedirs(OUT, exist_ok=True)

CHANNELS = [
    ("neilpatel", 300), ("HubSpot", 300), ("Ahrefs", 200), ("Backlinko", 200),
    ("semrush", 200), ("Moz", 100), ("socialmediaexaminer", 100),
    ("ThinkMediaTV", 300), ("vidiq", 300), ("garyvee", 300),
    ("MarketingSchool", 200), ("Shopify", 200), ("canva", 200),
    ("WordStream", 100), ("Unbounce", 100), ("LaterMedia", 100),
    ("Hootsuite", 100), ("SproutSocial", 100), ("Buffer", 100),
    ("ContentMarketingInstitute", 100), ("GoogleAnalytics", 100),
    ("GoogleAds", 100), ("MetaforBusiness", 100),
    ("TikTokForBusiness", 100), ("LinkedInMarketing", 100),
    ("pinterestbusiness", 100), ("NeilPatelSEO", 100),
    ("BrianDeanSEO", 100), ("AuthorityHacker", 100),
    ("IncomeSchool", 100), ("ExposureNinja", 100),
    ("AlexHormozi", 200), ("RussellBrunson", 200),
    ("DanKoe", 200), ("JustinWelsh", 200),
    ("SahilBloom", 200), ("DickieBush", 100),
    ("KieranDrewWriting", 100),
]

def get_videos(ch, max_v):
    cmd = f'python -m yt_dlp --flat-playlist --playlist-end {max_v*2} --dump-json "https://www.youtube.com/@{ch}/videos"'
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=45)
        vids = []
        for l in r.stdout.strip().split('\n'):
            if l.strip():
                try: vids.append(json.loads(l))
                except: pass
        return vids
    except: return []

api = YTA()

def get_transcript(vid):
    try:
        t = api.fetch(vid, ['en'])
        return ' '.join([x['text'] for x in t])
    except:
        try:
            t = api.fetch(vid, ['en-US'])
            return ' '.join([x['text'] for x in t])
        except:
            try:
                t = api.fetch(vid)
                return ' '.join([x['text'] for x in t])
            except:
                return None

total_size = 0
total_count = 0

for ch_name, target in CHANNELS:
    existing = len([f for f in os.listdir(OUT) if f.startswith(ch_name) and f.endswith('.txt')])
    needed = target - existing
    if needed <= 0:
        print(f'{ch_name}: {existing}/{target} done, skip')
        continue
    
    print(f'{ch_name}: getting {needed} more ({existing}/{target})...')
    vids = get_videos(ch_name.replace('_', ''), target)
    
    if not vids:
        # Try alternate channel ID format
        vids = get_videos(ch_name, target)
    
    count = 0
    for v in vids:
        vid = v.get('id', '')
        if not vid: continue
        
        fpath = os.path.join(OUT, f'{ch_name}_{vid}.txt')
        if os.path.exists(fpath): continue
        
        text = get_transcript(vid)
        if text and len(text) > 50:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(f'Title: {v.get("title","")}\nChannel: {ch_name}\nURL: https://youtube.com/watch?v={vid}\n\n{text}')
            total_size += len(text)
            total_count += 1
            count += 1
            mb = total_size / (1024*1024)
            print(f'  [{count}/{needed}] {ch_name}_{vid[:8]} ({mb:.1f}MB total)')
            
            if count >= needed: break
            time.sleep(1.0)
    
    print(f'  {ch_name}: +{count} transcripts')

print(f'\n=== FINAL: {total_count} transcripts, {total_size/1024/1024:.1f}MB ===')
