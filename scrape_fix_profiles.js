const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DATA_DIR = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\opencode\\instagram_data';

// Profiles with 0 items that need re-scraping
const TO_FIX = [
  '_socialsam_', 'amandasabreah', 'apurv_sngh', 'ashi.branding', 'bentimes10',
  'canva', 'carmscrolls', 'cassie.schoonover', 'ecom.saksham', 'girlinbluestudios',
  'imdanielaqueiroz', 'internet.anthropology', 'latermedia', 'likfoon',
  'marketing_humor', 'marketing360', 'nogood.io', 'orenmeetsworld',
  'peoplebrandsandthings', 'plerdy_com', 'realchasechappell', 'shrutipangtey',
  'sociallyybri', 'thebrandblueprint_', 'triciabiz', 'copyposse'
];

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function main() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  
  // LOGIN with proper waits
  console.log('Logging in...');
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'load', timeout: 60000 });
  await sleep(3000);
  
  // Type credentials slowly like a human
  await page.waitForSelector('input[name="text"]', { timeout: 10000 }).catch(() => {});
  // Actually type into inputs using keyboard
  const inputs = await page.$$('input:not([type="password"])');
  if (inputs.length > 0) {
    await inputs[0].click();
    await page.keyboard.type('hussainsingapuri24@gmail.com', { delay: 60 });
  }
  await sleep(500);
  
  const pwdInput = await page.$('input[type="password"]');
  if (pwdInput) {
    await pwdInput.click();
    await page.keyboard.type('2j@n2006', { delay: 60 });
  }
  await sleep(800);
  
  // Press Enter to submit
  await page.keyboard.press('Enter');
  await sleep(8000);
  
  // Handle any dialogs/save info etc
  for (let i = 0; i < 5; i++) {
    try {
      const btns = await page.$$('button, div[role="button"]');
      for (const b of btns) {
        const t = await b.textContent();
        if (t.includes('Not Now') || t.includes('Save')) {
          await b.click();
          await sleep(1000);
        }
      }
    } catch(e) {}
    await sleep(1000);
  }
  
  // Check if logged in
  const url = page.url();
  console.log(`After login URL: ${url}`);
  const isLoggedIn = !url.includes('login');
  console.log(`Status: ${isLoggedIn ? '✓' : '✗'}`);
  
  if (!isLoggedIn) {
    console.log('Login failed. Trying alternative flow...');
    // Maybe need to navigate again
    await page.goto('https://www.instagram.com/', { waitUntil: 'load', timeout: 30000 });
    await sleep(3000);
  }
  
  // Verify by trying to access a profile
  const testUrl = page.url();
  console.log(`Final URL: ${testUrl}`);
  
  // SCRAPE remaining profiles
  console.log(`\nScraping ${TO_FIX.length} profiles...`);
  let success = 0;
  
  for (let i = 0; i < TO_FIX.length; i++) {
    const handle = TO_FIX[i];
    console.log(`  [${i+1}/${TO_FIX.length}] @${handle}`);
    
    try {
      await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'load', timeout: 30000 });
      await sleep(4000);
      
      // Check if redirected to login
      if (page.url().includes('login')) {
        console.log(`  ✗ Redirected to login (session expired). Re-logging...`);
        await page.fill('input[name="text"]', '');
        // Actually need full re-login
        break;
      }
      
      // Scroll 20 times with human-like delay
      for (let s = 0; s < 20; s++) {
        await page.evaluate(() => window.scrollBy(0, 300 + Math.random() * 300));
        await sleep(500 + Math.random() * 500);
      }
      
      // Get post URLs
      const items = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
        const seen = new Set();
        return Array.from(links).filter(a => { const h = a.href; if (h && !seen.has(h)) { seen.add(h); return true; } return false; }).map(a => ({ url: a.href }));
      });
      
      // Get meta
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content').catch(() => '');
      const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content').catch(() => '');
      
      console.log(`  → ${items.length} items${items.length > 0 ? ' ✓' : ''}`);
      
      // Find category from filename
      const existingFiles = fs.readdirSync(DATA_DIR).filter(f => f.startsWith(handle));
      const cat = existingFiles.length > 0 ? existingFiles[0].replace(handle + '_', '').replace('.json', '') : 'unknown';
      
      const data = { handle, category: cat, ogTitle, ogDesc, items: items.slice(0, 30) };
      if (ogDesc) {
        const f = ogDesc.match(/([\d,.KMkmB]+)\s*Followers/); if (f) data.followers = f[1];
        const g = ogDesc.match(/([\d,.KMkmB]+)\s*Following/); if (g) data.following = g[1];
        const p = ogDesc.match(/([\d,.KMkmB]+)\s*Posts/); if (p) data.postCount = p[1];
      }
      if (ogTitle) { const m = ogTitle.match(/^([^(]+)/); if (m) data.profileName = m[1].trim(); }
      
      fs.writeFileSync(path.join(DATA_DIR, `${handle}_${cat}.json`), JSON.stringify(data, null, 2));
      success++;
      
      // Random delay between profiles to avoid rate limiting
      await sleep(2000 + Math.random() * 3000);
      
    } catch(e) {
      console.log(`  ✗ ${e.message.substring(0, 80)}`);
    }
  }
  
  console.log(`\n=== Re-scraped: ${success}/${TO_FIX.length} ===`);
  
  // Final summary
  const allFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  let totalSize = allFiles.reduce((acc, f) => acc + fs.statSync(path.join(DATA_DIR, f)).size, 0);
  let totalItems = 0;
  allFiles.forEach(f => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
      totalItems += d.items?.length || 0;
    } catch(e) {}
  });
  console.log(`\nTotal: ${allFiles.length} files | ${(totalSize/1024).toFixed(1)}KB | ${totalItems} posts`);
  
  await browser.close();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
