const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\opencode\\instagram_data';

const PROFILES = [
  '_socialsam_', 'amandasabreah', 'apurv_sngh', 'ashi.branding', 'bentimes10',
  'canva', 'carmscrolls', 'cassie.schoonover', 'ecom.saksham', 'girlinbluestudios',
  'imdanielaqueiroz', 'internet.anthropology', 'latermedia', 'likfoon',
  'marketing_humor', 'marketing360', 'nogood.io', 'orenmeetsworld',
  'peoplebrandsandthings', 'plerdy_com', 'realchasechappell', 'shrutipangtey',
  'sociallyybri', 'thebrandblueprint_', 'triciabiz', 'copyposse'
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function parseMeta(handle, html) {
  const d = { handle, profileName: '', followers: '', following: '', postCount: '', items: [] };
  
  // Extract og:title
  const ogt = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogt) d.ogTitle = ogt[1];
  
  // Extract og:description (contains follower count)
  const ogd = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
  if (ogd) {
    d.ogDesc = ogd[1];
    const f = ogd[1].match(/([\d,.KMkmB]+)\s*Followers/i);
    const g = ogd[1].match(/([\d,.KMkmB]+)\s*Following/i);
    const p = ogd[1].match(/([\d,.KMkmB]+)\s*Posts/i);
    if (f) d.followers = f[1];
    if (g) d.following = g[1];
    if (p) d.postCount = p[1];
  }
  
  // Extract og:image
  const ogi = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (ogi) d.ogImage = ogi[1];
  
  // Extract profile name from og:title
  if (d.ogTitle) {
    const m = d.ogTitle.match(/^([^(]+)/);
    if (m) d.profileName = m[1].trim();
  }
  
  // Try to extract post URLs from embedded JSON data (sharedData)
  // Instagram embeds some post data in script tags
  const jsonMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
  for (const match of jsonMatches) {
    try {
      const json = JSON.parse(match[1]);
      if (json.mainEntityofPage) d._schemaUrl = json.mainEntityofPage['@id'];
    } catch(e) {}
  }
  
  // Also try to find post URLs in the HTML
  const postUrls = html.match(/https:\/\/www\.instagram\.com\/[^/]+\/p\/[a-zA-Z0-9_-]+/g);
  if (postUrls) {
    const seen = new Set();
    postUrls.forEach(url => {
      if (!seen.has(url)) { seen.add(url); d.items.push({ url }); }
    });
  }
  
  // Try smaller reels pattern too
  const reelUrls = html.match(/https:\/\/www\.instagram\.com\/[^/]+\/reel\/[a-zA-Z0-9_-]+/g);
  if (reelUrls) {
    const seen = new Set(d.items.map(i => i.url));
    reelUrls.forEach(url => {
      if (!seen.has(url)) { seen.add(url); d.items.push({ url }); }
    });
  }
  
  return d;
}

async function main() {
  console.log('=== FAST HTTP SCRAPE ===\n');
  fs.mkdirSync(OUT, { recursive: true });

  let success = 0;
  for (let i = 0; i < PROFILES.length; i++) {
    const h = PROFILES[i];
    console.log(`[${i+1}/${PROFILES.length}] @${h}`);
    
    try {
      const res = await fetch(`https://www.instagram.com/${h}/`);
      if (res.status === 200) {
        const data = parseMeta(h, res.body);
        
        // Load existing data if any
        const existingFiles = fs.readdirSync(OUT).filter(f => f.startsWith(h));
        let cat = 'unknown';
        if (existingFiles.length > 0) {
          cat = existingFiles[0].replace(h + '_', '').replace('.json', '');
          try {
            const old = JSON.parse(fs.readFileSync(path.join(OUT, existingFiles[0]), 'utf-8'));
            // Merge
            if (!data.followers && old.followers) data.followers = old.followers;
            if (!data.profileName && old.profileName) data.profileName = old.profileName;
            if (old.items && old.items.length > 0 && data.items.length === 0) data.items = old.items;
          } catch(e) {}
        }
        
        data.category = cat;
        fs.writeFileSync(path.join(OUT, `${h}_${cat}.json`), JSON.stringify(data, null, 2));
        console.log(`  ${data.profileName || '?'} | ${data.followers || '?'} followers | ${data.items.length} posts`);
        success++;
      } else {
        console.log(`  Status ${res.status}`);
      }
    } catch(e) {
      console.log(`  Error: ${e.message.substring(0, 60)}`);
    }
  }
  
  const allFiles = fs.readdirSync(OUT).filter(f => f.endsWith('.json'));
  let totalSize = allFiles.reduce((acc, f) => acc + fs.statSync(path.join(OUT, f)).size, 0);
  let totalItems = 0;
  allFiles.forEach(f => {
    try { totalItems += JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf-8')).items?.length || 0; } catch(e) {}
  });
  console.log(`\n=== DONE: ${allFiles.length} files | ${(totalSize/1024).toFixed(1)}KB | ${totalItems} posts ===`);
}

main().catch(console.error);
