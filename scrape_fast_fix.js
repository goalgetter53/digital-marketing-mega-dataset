const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\opencode\\instagram_data';
const USER_DIR = path.join(__dirname, 'chrome_session_' + Date.now());

const TO_FIX = [
  '_socialsam_', 'amandasabreah', 'apurv_sngh', 'ashi.branding', 'bentimes10',
  'canva', 'carmscrolls', 'cassie.schoonover', 'ecom.saksham', 'girlinbluestudios',
  'imdanielaqueiroz', 'internet.anthropology', 'latermedia', 'likfoon',
  'marketing_humor', 'marketing360', 'nogood.io', 'orenmeetsworld',
  'peoplebrandsandthings', 'plerdy_com', 'realchasechappell', 'shrutipangtey',
  'sociallyybri', 'thebrandblueprint_', 'triciabiz', 'copyposse'
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('=== FAST FIX SCRAPE ===\n');
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launchPersistentContext(USER_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  // LOGIN
  console.log('Logging in...');
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'load', timeout: 60000 });
  await sleep(3000);
  
  const loggedIn = await page.evaluate(({email,pass}) => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const u = inputs.find(i => i.type !== 'password');
    const p = inputs.find(i => i.type === 'password');
    if (!u || !p) return false;
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(u, email); u.dispatchEvent(new Event('input', {bubbles:true}));
    s.call(p, pass); p.dispatchEvent(new Event('input', {bubbles:true}));
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
    return true;
  }, {email:'hussainsingapuri24@gmail.com', pass:'2j@n2006'});
  
  if (loggedIn) console.log('Credentials entered');
  await sleep(6000);
  
  // Dismiss dialogs
  for (let i=0; i<3; i++) {
    await page.evaluate(() => {
      document.querySelectorAll('button, div[role="button"]').forEach(b => {
        if (b.textContent.includes('Not Now') || b.textContent.includes('Save')) b.click();
      });
    });
    await sleep(1500);
  }

  // SCRAPE AS FAST AS POSSIBLE
  console.log(`\nScraping ${TO_FIX.length} profiles...`);
  let success = 0;
  
  for (let i = 0; i < TO_FIX.length; i++) {
    const h = TO_FIX[i];
    process.stdout.write(`${i+1}/${TO_FIX.length} @${h}... `);
    
    try {
      await page.goto(`https://www.instagram.com/${h}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(2000);
      
      // Check for login wall fast
      const isBlocked = await page.evaluate(() => window.location.href.includes('login'));
      if (isBlocked) {
        console.log('BLOCKED (session expired)');
        // Navigate back to home and wait
        await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 10000 });
        await sleep(2000);
        continue;
      }
      
      // Scroll 5 times fast
      for (let s = 0; s < 5; s++) {
        await page.evaluate(() => window.scrollBy(0, 500));
        await sleep(300);
      }
      
      // Extract data
      const data = await page.evaluate((h) => {
        const d = { handle: h, profileName: '', followers: '', following: '', postCount: '', items: [], ogTitle: '', ogDesc: '', ogImage: '' };
        d.ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
        d.ogDesc = document.querySelector('meta[property="og:description"]')?.content || '';
        d.ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
        if (d.ogTitle) { const m = d.ogTitle.match(/^([^(]+)/); if (m) d.profileName = m[1].trim(); }
        if (d.ogDesc) {
          const f = d.ogDesc.match(/([\d,.KMkmB]+)\s*Followers/); if (f) d.followers = f[1];
          const g = d.ogDesc.match(/([\d,.KMkmB]+)\s*Following/); if (g) d.following = g[1];
          const p = d.ogDesc.match(/([\d,.KMkmB]+)\s*Posts/); if (p) d.postCount = p[1];
        }
        const seen = new Set();
        document.querySelectorAll('a').forEach(a => {
          const h = a.href;
          if ((h.includes('/p/') || h.includes('/reel/')) && !seen.has(h)) {
            seen.add(h);
            const img = a.querySelector('img');
            d.items.push({ url: h, imgSrc: img?.src || '' });
          }
        });
        // Also try to get profile pic
        const pp = document.querySelector('img[alt*="profile"], img[src*="s150x150"]');
        if (pp) d.profilePic = pp.src;
        return d;
      }, h);
      
      // Save merged with existing
      const existingFiles = fs.readdirSync(OUT).filter(f => f.startsWith(h));
      let cat = 'unknown';
      if (existingFiles.length > 0) {
        cat = existingFiles[0].replace(h + '_', '').replace('.json', '');
        try {
          const old = JSON.parse(fs.readFileSync(path.join(OUT, existingFiles[0]), 'utf-8'));
          if (!data.followers && old.followers) data.followers = old.followers;
          if (!data.profileName && old.profileName) data.profileName = old.profileName;
        } catch(e) {}
      }
      data.category = cat;
      fs.writeFileSync(path.join(OUT, `${h}_${cat}.json`), JSON.stringify(data, null, 2));
      
      console.log(`${data.items.length} items | ${data.followers || '?'} followers`);
      success++;
      
    } catch(e) {
      console.log(`ERR: ${e.message.substring(0, 50)}`);
    }
    
    await sleep(1000);
  }
  
  const allFiles = fs.readdirSync(OUT).filter(f => f.endsWith('.json'));
  let totalSize = allFiles.reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0);
  let totalItems = 0;
  allFiles.forEach(f => {
    try { totalItems += JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf-8')).items?.length || 0; } catch(e) {}
  });
  console.log(`\n=== DONE: ${allFiles.length} files | ${(totalSize/1024).toFixed(1)}KB | ${totalItems} posts ===`);
  
  await browser.close();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
