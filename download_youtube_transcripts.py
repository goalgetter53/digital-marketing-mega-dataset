import os, subprocess, json, time, threading, sys
from concurrent.futures import ThreadPoolExecutor, as_completed

OUT = r'C:\Users\Admin\AppData\Local\Temp\opencode\youtube_transcripts'
os.makedirs(OUT, exist_ok=True)

# Channel list: (folder_name, channel_url)
CHANNELS = [
    ("NeilPatel", "https://www.youtube.com/@neilpatel/videos"),
    ("HubSpot", "https://www.youtube.com/@HubSpot/videos"),
    ("Ahrefs", "https://www.youtube.com/@Ahrefs/videos"),
    ("Backlinko", "https://www.youtube.com/@Backlinko/videos"),
    ("Semrush", "https://www.youtube.com/@semrush/videos"),
    ("Moz", "https://www.youtube.com/@moz/videos"),
    ("SocialMediaExaminer", "https://www.youtube.com/@socialmediaexaminer/videos"),
    ("ThinkMedia", "https://www.youtube.com/@ThinkMediaTV/videos"),
    ("VidIQ", "https://www.youtube.com/@vidiq/videos"),
    ("GaryVee", "https://www.youtube.com/@garyvee/videos"),
    ("MarketingSchool", "https://www.youtube.com/@Marketingschool/videos"),
    ("Shopify", "https://www.youtube.com/@Shopify/videos"),
    ("Hootsuite", "https://www.youtube.com/@Hootsuite/videos"),
    ("SproutSocial", "https://www.youtube.com/@SproutSocial/videos"),
    ("Later", "https://www.youtube.com/@later/videos"),
    ("Salesforce", "https://www.youtube.com/@Salesforce/videos"),
    ("Canva", "https://www.youtube.com/@canva/videos"),
    ("WordStream", "https://www.youtube.com/@WordStream/videos"),
    ("Unbounce", "https://www.youtube.com/@Unbounce/videos"),
    ("Wix", "https://www.youtube.com/@Wix/videos"),
    ("Squarespace", "https://www.youtube.com/@squarespace/videos"),
    ("Mailchimp", "https://www.youtube.com/@Mailchimp/videos"),
    ("Buffer", "https://www.youtube.com/@bufferapp/videos"),
    ("CoSchedule", "https://www.youtube.com/@CoSchedule/videos"),
    ("ContentMarketingInstitute", "https://www.youtube.com/@CMIContent/videos"),
    ("Copyblogger", "https://www.youtube.com/@copyblogger/videos"),
    ("Copyhackers", "https://www.youtube.com/@copyhackers/videos"),
    ("MarketingProfs", "https://www.youtube.com/@MarketingProfs/videos"),
    ("GrowthHackers", "https://www.youtube.com/@GrowthHackers/videos"),
    ("Optimizely", "https://www.youtube.com/@optimizely/videos"),
    ("Hotjar", "https://www.youtube.com/@Hotjar/videos"),
    ("CrazyEgg", "https://www.youtube.com/@crazyegg/videos"),
    ("Instapage", "https://www.youtube.com/@instapage/videos"),
    ("HubSpotAcademy", "https://www.youtube.com/@HubSpotAcademy/videos"),
    ("GoogleAnalytics", "https://www.youtube.com/@googleanalytics/videos"),
    ("GoogleAds", "https://www.youtube.com/@googleads/videos"),
    ("MetaBusiness", "https://www.youtube.com/@MetaforBusiness/videos"),
    ("TikTokBusiness", "https://www.youtube.com/@TikTokForBusiness/videos"),
    ("LinkedInMarketing", "https://www.youtube.com/@LinkedInMarketing/videos"),
    ("PinterestBusiness", "https://www.youtube.com/@pinterestbusiness/videos"),
    ("TwitterBusiness", "https://www.youtube.com/@XBusiness/videos"),
    ("NeilPatelSEO", "https://www.youtube.com/@NeilPatel/videos"),
    ("BrianDean", "https://www.youtube.com/@BrianDeanSEO/videos"),
    ("MattDiggity", "https://www.youtube.com/@mattdiggityseo/videos"),
    ("AuthorityHacker", "https://www.youtube.com/@AuthorityHacker/videos"),
    ("IncomeSchool", "https://www.youtube.com/@IncomeSchool/videos"),
    ("ExposureNinja", "https://www.youtube.com/@exposureninja/videos"),
    ("Fstoppers", "https://www.youtube.com/@Fstoppers/videos"),
    ("MattWolfe", "https://www.youtube.com/@MattWolfeMarketing/videos"),
    ("EricSiou", "https://www.youtube.com/@EricSiou/videos"),
    ("NateDiaz", "https://www.youtube.com/@NateDiazMarketing/videos"),
    ("KyleCook", "https://www.youtube.com/@KyleCookMarketing/videos"),
    ("LiamKay", "https://www.youtube.com/@LiamKayMarketing/videos"),
    ("JamesAkerman", "https://www.youtube.com/@JamesAkermanAgency/videos"),
    ("ChrisDo", "https://www.youtube.com/@ChrisDoContent/videos"),
    ("AlexHormozi", "https://www.youtube.com/@AlexHormozi/videos"),
    ("RussellBrunson", "https://www.youtube.com/@RussellBrunson/videos"),
    ("DanKoe", "https://www.youtube.com/@dankoe/videos"),
    ("JustinWelsh", "https://www.youtube.com/@justinwelsh/videos"),
    ("SahilBloom", "https://www.youtube.com/@SahilBloom/videos"),
    ("DickieBush", "https://www.youtube.com/@dickiebush/videos"),
    ("NicolasCole", "https://www.youtube.com/@nicolascole77/videos"),
    ("JayClouse", "https://www.youtube.com/@jayclouse/videos"),
    ("KieranDrew", "https://www.youtube.com/@KieranDrewWriting/videos"),
    ("AlexBerman", "https://www.youtube.com/@AlexBermanYouTube/videos"),
]

STATUS_FILE = os.path.join(OUT, '_progress.json')
lock = threading.Lock()

def get_video_list(channel_url, max_videos=300):
    """Get list of video URLs from a channel"""
    cmd = f'yt-dlp --flat-playlist --dump-json --playlist-end {max_videos} "{channel_url}"'
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
        videos = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                try:
                    data = json.loads(line)
                    videos.append(data)
                except: pass
        return videos
    except Exception as e:
        print(f'  ERROR listing: {e}')
        return []

def download_transcript(video_id, channel_name, video_data):
    """Download transcript for one video using yt-dlp"""
    out_path = os.path.join(OUT, f'{channel_name}_{video_id}')
    txt_path = out_path + '.txt'
    
    if os.path.exists(txt_path):
        return 0
    
    # Try yt-dlp to download auto-subs
    cmd = f'yt-dlp --skip-download --write-auto-subs --sub-langs en --convert-subs srt --output "{out_path}.%(ext)s" --quiet "https://www.youtube.com/watch?v={video_id}"'
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        
        # Check for SRT file
        srt_path = out_path + '.en.srt'
        if os.path.exists(srt_path):
            # Convert SRT to plain text
            with open(srt_path, 'r', encoding='utf-8') as f:
                content = f.read()
            # Clean SRT formatting
            import re
            lines = content.split('\n')
            text_lines = []
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if line.isdigit():
                    continue
                if '-->' in line:
                    continue
                if re.match(r'^\d{2}:\d{2}:\d{2}', line):
                    continue
                text_lines.append(line)
            clean_text = ' '.join(text_lines)
            
            # Also try to get video title
            title = video_data.get('title', '')
            
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(f'Title: {title}\nChannel: {channel_name}\nURL: https://youtube.com/watch?v={video_id}\n\n{clean_text}')
            
            # Remove SRT
            os.remove(srt_path)
            
            size = os.path.getsize(txt_path)
            return size
    except:
        pass
    
    return 0

def process_channel(ch_name, ch_url, target_videos=200):
    """Process one channel - list videos and download transcripts"""
    with lock:
        progress = {}
        if os.path.exists(STATUS_FILE):
            with open(STATUS_FILE, 'r') as f:
                progress = json.load(f)
    
    done = progress.get(ch_name, 0)
    if done >= target_videos:
        print(f'{ch_name}: already have {done}, skip')
        return 0
    
    print(f'{ch_name}: finding videos...')
    videos = get_video_list(ch_url, target_videos * 2)
    if not videos:
        print(f'{ch_name}: no videos found')
        return 0
    
    print(f'{ch_name}: {len(videos)} videos found, downloading transcripts...')
    
    count = 0
    total_chars = 0
    for v in videos:
        vid = v.get('id', '')
        if not vid:
            continue
        
        size = download_transcript(vid, ch_name, v)
        if size > 0:
            count += 1
            total_chars += size
        
        # Progress every 20
        if count > 0 and count % 20 == 0:
            progress[ch_name] = progress.get(ch_name, 0) + 20
            with open(STATUS_FILE, 'w') as f:
                json.dump(progress, f)
            print(f'  {ch_name}: {count}/{target_videos} ({total_chars/1024:.0f}KB)')
        
        if count >= target_videos:
            break
    
    # Final save
    with lock:
        progress[ch_name] = progress.get(ch_name, 0) + count
        with open(STATUS_FILE, 'w') as f:
            json.dump(progress, f)
    
    print(f'{ch_name}: done ({count} transcripts)')
    return count

def track_progress():
    """Track total size periodically"""
    while True:
        time.sleep(30)
        files = [os.path.join(OUT, f) for f in os.listdir(OUT) if f.endswith('.txt') and f != '_progress.json']
        total = sum(os.path.getsize(f) for f in files)
        mb = total / (1024*1024)
        print(f'\n[PROGRESS] {len(files)} files, {mb:.2f}MB')
        if mb >= 250:  # We need 500MB total across ALL sources
            pass

def main():
    print(f'Starting YouTube transcript download to {OUT}')
    print(f'Channels: {len(CHANNELS)}')
    
    # Start progress tracker
    import threading
    tracker = threading.Thread(target=track_progress, daemon=True)
    tracker.start()
    
    # Process channels with thread pool (3 at a time to avoid rate limits)
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = []
        for ch_name, ch_url in CHANNELS:
            futures.append(executor.submit(process_channel, ch_name, ch_url, 150))
        
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f'Channel failed: {e}')
    
    # Final report
    files = [os.path.join(OUT, f) for f in os.listdir(OUT) if f.endswith('.txt') and f != '_progress.json']
    total = sum(os.path.getsize(f) for f in files)
    print(f'\n=== FINAL: {len(files)} transcripts, {total/1024/1024:.2f}MB ===')

if __name__ == '__main__':
    main()
