const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\opencode\\instagram_data';

const PROFILES = [
  { handle: 'hubspot', cat: 'inbound' },
  { handle: 'neilpatel', cat: 'seo' },
  { handle: 'russellbrunson', cat: 'sales_funnels' },
  { handle: 'prettylittlemarketer', cat: 'social_media' },
  { handle: 'becauseofmarketing', cat: 'campaigns' },
  { handle: 'semrush', cat: 'seo' },
  { handle: 'marketingconmelissa', cat: 'digital_mkt' },
  { handle: 'marketing_espresso', cat: 'tips' },
  { handle: 'sproutsocial', cat: 'social_media' },
  { handle: 'shwinnabegobrand', cat: 'branding' },
  { handle: 'dainwalker', cat: 'brand_strategy' },
  { handle: 'marketingharry', cat: 'content' },
  { handle: 'soravjain', cat: 'ai_marketing' },
  { handle: 'hootsuite', cat: 'social_media' },
  { handle: 'digitalmarketer', cat: 'digital_mkt' },
  { handle: 'mosseri', cat: 'ig_strategy' },
  { handle: 'marketingmind.in', cat: 'mkt_edu' },
  { handle: 'copyposse', cat: 'copywriting' },
  { handle: 'marketing_examples', cat: 'copywriting' },
  { handle: 'grammarly', cat: 'writing' },
  { handle: 'yoast', cat: 'seo' },
  { handle: 'juliaemccoy', cat: 'ai_writing' },
  { handle: 'getresponse', cat: 'email' },
  { handle: 'optinmonster', cat: 'cro' },
  { handle: 'ignitevisibility', cat: 'seo_content' },
  { handle: 'plerdy_com', cat: 'cro_ux' },
  { handle: 'thenumbersgame1', cat: 'analytics' },
  { handle: 'ericosiu', cat: 'ai_growth' },
  { handle: 'jaybaer', cat: 'cx' },
  { handle: 'adweek', cat: 'advertising' },
  { handle: 'adage', cat: 'ad_news' },
  { handle: 'adsoftheworldnyc', cat: 'creative_ads' },
  { handle: 'smexaminer', cat: 'social_media' },
  { handle: 'latermedia', cat: 'scheduling' },
  { handle: 'eugbrandstrat', cat: 'brand_culture' },
  { handle: 'coldestjoel', cat: 'gen_z' },
  { handle: 'internet.anthropology', cat: 'digital_culture' },
  { handle: 'ashi.branding', cat: 'luxury' },
  { handle: 'thebrandblueprint_', cat: 'brand_strategy' },
  { handle: 'teoherzkovich', cat: 'gen_z' },
  { handle: 'girlinbluestudios', cat: 'creative' },
  { handle: 'peoplebrandsandthings', cat: 'brand_news' },
  { handle: 'orenmeetsworld', cat: 'creative_dir' },
  { handle: 'carmscrolls', cat: 'storytelling' },
  { handle: 'amandasabreah', cat: 'brand_culture' },
  { handle: 'nogood.io', cat: 'growth' },
  { handle: 'marketing_humor', cat: 'memes' },
  { handle: 'canva', cat: 'design' },
  { handle: 'marketing360', cat: 'all_in_one' },
  { handle: '_socialsam_', cat: 'ig_growth' },
  { handle: 'imdanielaqueiroz', cat: 'ig_biz' },
  { handle: 'shrutipangtey', cat: 'digital_products' },
  { handle: 'likfoon', cat: 'content_style' },
  { handle: 'mari_smith', cat: 'facebook' },
  { handle: 'triciabiz', cat: 'business_systems' },
  { handle: 'realchasechappell', cat: 'ecommerce' },
  { handle: 'ecom.saksham', cat: 'ecommerce' },
  { handle: 'apurv_sngh', cat: 'mkt_edu' },
  { handle: 'cassie.schoonover', cat: 'content' },
  { handle: 'bentimes10', cat: 'agency' },
  { handle: 'sociallyybri', cat: 'mindful' },
  { handle: 'nataliedawson', cat: 'biz_growth' },
  { handle: 'brandsetera', cat: 'brand' },
  { handle: 'theadnetwork', cat: 'ad_industry' },
  { handle: 'thesortedgirl', cat: 'digital_brand' },
  { handle: 'alexxmarketing', cat: 'ig_coaching' },
];

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function scrapeOne(page, handle, cat) {
  try {
    await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await sleep(3000);

    // Scroll more for grid posts
    for (let s = 0; s < 15; s++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await sleep(600);
    }

    const data = await page.evaluate((h) => {
      const d = { handle: h, profileName: '', bio: '', followers: '', following: '', postCount: '', profilePic: '', items: [] };
      d.ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
      d.ogDesc = document.querySelector('meta[property="og:description"]')?.content || '';
      d.ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
      if (d.ogTitle) { const m = d.ogTitle.match(/^([^(]+)/); if (m) d.profileName = m[1].trim(); }
      if (d.ogDesc) {
        const f = d.ogDesc.match(/([\d,.KMkmB]+)\s*Followers/); if (f) d.followers = f[1];
        const g = d.ogDesc.match(/([\d,.KMkmB]+)\s*Following/); if (g) d.following = g[1];
        const p = d.ogDesc.match(/([\d,.KMkmB]+)\s*Posts/); if (p) d.postCount = p[1];
      }
      const pp = document.querySelector('img[alt*="profile"]');
      if (pp) d.profilePic = pp.src;
      
      const links = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
      const seen = new Set();
      links.forEach(a => {
        const href = a.href;
        if (href && !seen.has(href)) {
          seen.add(href);
          const img = a.querySelector('img');
          d.items.push({ url: href, imgSrc: img?.src || ''});
        }
      });
      return d;
    }, handle);

    // Also try to get page text for any bio content
    const bodyText = await page.textContent('body').catch(() => '');
    // Try extracting bio: look for text between follower count and posts
    const bioMatch = bodyText.match(/Posts[\d,.KMkm]+\s*Followers[\d,.KMkm]+\s*Following[\d,.KMkm]+\s*([^]+?)(?:Follow|Message|Email)/i);
    if (bioMatch && bioMatch[1]) data._rawBio = bioMatch[1].trim().substring(0, 500);

    fs.writeFileSync(path.join(OUTPUT_DIR, `${handle}_${cat}.json`), JSON.stringify(data, null, 2));
    console.log(`  ✓ @${handle} | ${data.followers || '?'} followers | ${data.postCount || '?'} posts | ${data.items.length} items`);
    return true;
  } catch(e) {
    console.log(`  ✗ @${handle}: ${e.message.substring(0, 80)}`);
    return false;
  }
}

async function main() {
  console.log('=== SCRAPE 66 MARKETING PROFILES ===\n');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox']
  });
  let page = await browser.newPage();

  // LOGIN
  console.log('Logging in...');
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'load', timeout: 60000 });
  await sleep(3000);
  
  // Fill credentials
  await page.evaluate(({email, pass}) => {
    const inputs = document.querySelectorAll('input[type="text"], input:not([type="password"])');
    inputs.forEach(i => { 
      if (!i.value) { 
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(i, email); i.dispatchEvent(new Event('input', { bubbles: true })); 
      }
    });
    const pwd = document.querySelector('input[type="password"]');
    if (pwd) {
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      s.call(pwd, pass); pwd.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, { email: 'hussainsingapuri24@gmail.com', pass: '2j@n2006' });
  await sleep(1500);

  // Click login via evaluate
  await page.evaluate(() => {
    document.querySelectorAll('button, div[role="button"]').forEach(b => {
      if (b.textContent.includes('Log in') || b.textContent.includes('Log In')) b.click();
    });
  });
  await sleep(8000);
  
  // Handle any popups
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      document.querySelectorAll('button, div[role="button"]').forEach(b => {
        if (b.textContent.includes('Not Now') || b.textContent.includes('Save')) b.click();
      });
    });
    await sleep(1500);
  }

  // Verify login by URL
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);
  const loggedIn = !currentUrl.includes('login') || currentUrl.includes('instagram.com/');
  console.log(`Status: ${loggedIn ? '✓ LOGGED IN' : '✗'}`);

  if (!loggedIn) {
    console.log('Retrying with 2jan2006...');
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'load', timeout: 60000 });
    await sleep(3000);
    await page.evaluate(({email, pass}) => {
      const inputs = document.querySelectorAll('input[type="text"], input:not([type="password"])');
      inputs.forEach(i => { if (!i.value) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(i, email); i.dispatchEvent(new Event('input', { bubbles: true })); }});
      const pwd = document.querySelector('input[type="password"]');
      if (pwd) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(pwd, pass); pwd.dispatchEvent(new Event('input', { bubbles: true })); }
    }, { email: 'hussainsingapuri24@gmail.com', pass: '2jan2006' });
    await sleep(1500);
    await page.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (b.textContent.includes('Log in')) b.click(); }); });
    await sleep(8000);
  }

  // SCRAPE
  console.log('\nScraping profiles (2 at a time)...');
  let success = 0;
  for (let i = 0; i < PROFILES.length; i += 2) {
    const batch = PROFILES.slice(i, i + 2);
    console.log(`\n--- ${Math.floor(i/2)+1}/${Math.ceil(PROFILES.length/2)} (${i+1}-${Math.min(i+2, PROFILES.length)}) ---`);
    
    const p2 = batch.length > 1 ? await browser.newPage() : null;
    const r1 = await scrapeOne(page, batch[0].handle, batch[0].cat);
    let r2 = false;
    if (p2) { r2 = await scrapeOne(p2, batch[1].handle, batch[1].cat); await p2.close(); }
    success += (r1 ? 1 : 0) + (r2 ? 1 : 0);
    
    if (i + 2 < PROFILES.length) await sleep(1000);
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
  let totalSize = files.reduce((acc, f) => acc + fs.statSync(path.join(OUTPUT_DIR, f)).size, 0);
  console.log(`\n=== DONE: ${success}/${PROFILES.length} | ${files.length} files | ${(totalSize/1024).toFixed(1)}KB ===`);
  await browser.close();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
