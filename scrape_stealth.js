const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const OUT = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\opencode\\instagram_data';
fs.mkdirSync(OUT, { recursive: true });

const ALL_PROFILES = [
  'hubspot','neilpatel','russellbrunson','prettylittlemarketer','becauseofmarketing',
  'semrush','marketingconmelissa','marketing_espresso','sproutsocial','shwinnabegobrand',
  'dainwalker','marketingharry','soravjain','hootsuite','digitalmarketer','mosseri',
  'marketingmind.in','copyposse','marketing_examples','grammarly','yoast','juliaemccoy',
  'getresponse','optinmonster','ignitevisibility','plerdy_com','thenumbersgame1',
  'ericosiu','jaybaer','adweek','adage','adsoftheworldnyc','smexaminer','latermedia',
  'eugbrandstrat','coldestjoel','internet.anthropology','ashi.branding','thebrandblueprint_',
  'teoherzkovich','girlinbluestudios','peoplebrandsandthings','orenmeetsworld','carmscrolls',
  'amandasabreah','nogood.io','marketing_humor','canva','marketing360','_socialsam_',
  'imdanielaqueiroz','shrutipangtey','likfoon','mari_smith','triciabiz','realchasechappell',
  'ecom.saksham','apurv_sngh','cassie.schoonover','bentimes10','sociallyybri',
  'nataliedawson','brandsetera','theadnetwork','thesortedgirl','alexxmarketing'
];

const CHROME_PATH = 'C:\\Users\\Admin\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scrapeProfile(page, handle) {
  const d = { handle, profileName: '', followers: '', following: '', postCount: '', items: [] };
  try {
    await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(2000);
    
    // Check for login wall immediately
    if (page.url().includes('login')) {
      d._blocked = true;
      return d;
    }
    
    // Scroll 8 times
    await page.evaluate(async () => {
      for (let i = 0; i < 8; i++) {
        window.scrollBy(0, 400);
        await new Promise(r => setTimeout(r, 200));
      }
    });
    
    const data = await page.evaluate((h) => {
      const r = { handle: h, items: [] };
      r.ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
      r.ogDesc = document.querySelector('meta[property="og:description"]')?.content || '';
      r.ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
      if (r.ogTitle) { const m = r.ogTitle.match(/^([^(]+)/); if (m) r.profileName = m[1].trim(); }
      if (r.ogDesc) {
        const f = r.ogDesc.match(/([\d,.KMkmB]+)\s*Followers/i);
        const g = r.ogDesc.match(/([\d,.KMkmB]+)\s*Following/i);
        const p = r.ogDesc.match(/([\d,.KMkmB]+)\s*Posts/i);
        if (f) r.followers = f[1];
        if (g) r.following = g[1];
        if (p) r.postCount = p[1];
      }
      const seen = new Set();
      document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]').forEach(a => {
        if (!seen.has(a.href)) {
          seen.add(a.href);
          const img = a.querySelector('img');
          r.items.push({ url: a.href, imgSrc: img?.src || '' });
        }
      });
      return r;
    }, handle);
    
    Object.assign(d, data);
    return d;
  } catch(e) {
    d.error = e.message;
    return d;
  }
}

async function main() {
  console.log('=== STEALTH SCRAPE ALL ===\n');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Set a real user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

  // LOGIN
  console.log('Logging in...');
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3000);
  
  const loginResult = await page.evaluate(({email,pass}) => {
    const inputs = document.querySelectorAll('input');
    let u, p;
    inputs.forEach(i => {
      if (i.type === 'password') p = i;
      else if (i.name === 'username' || i.type === 'text' || i.autocomplete === 'username') u = i;
    });
    if (!u || !p) return 'no_inputs';
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(u, email); u.dispatchEvent(new Event('input', {bubbles:true}));
    s.call(p, pass); p.dispatchEvent(new Event('input', {bubbles:true}));
    const btn = document.querySelector('button[type="submit"]');
    if (btn) { btn.click(); return 'submitted'; }
    return 'no_button';
  }, {email: 'hussainsingapuri24@gmail.com', pass: '2j@n2006'});
  console.log(`Login: ${loginResult}`);
  await sleep(6000);
  
  // Dismiss dialogs
  for (let i=0; i<3; i++) {
    try {
      const btns = await page.$$('button, div[role="button"]');
      for (const b of btns) {
        const t = await page.evaluate(el => el.textContent, b);
        if (t && (t.includes('Not Now') || t.includes('Save'))) await b.click();
      }
    } catch(e) {}
    await sleep(1000);
  }
  
  // Check login
  await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  const loggedIn = !page.url().includes('login');
  console.log(`Status: ${loggedIn ? '✓' : '✗'}`);
  
  if (!loggedIn) {
    console.log('Trying 2jan2006...');
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });
    await sleep(3000);
    await page.evaluate(({email,pass}) => {
      const inputs = document.querySelectorAll('input');
      let u, p;
      inputs.forEach(i => {
        if (i.type === 'password') p = i;
        else if (i.name === 'username' || i.type === 'text') u = i;
      });
      if (u && p) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(u, email); u.dispatchEvent(new Event('input', {bubbles:true}));
        s.call(p, pass); p.dispatchEvent(new Event('input', {bubbles:true}));
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      }
    }, {email: 'hussainsingapuri24@gmail.com', pass: '2jan2006'});
    await sleep(6000);
  }
  
  if (page.url().includes('login')) {
    console.log('LOGIN STILL FAILED. Opening for manual...');
    const rl = require('readline').createInterface({input:process.stdin,output:process.stdout});
    await new Promise(r => rl.question('Press Enter after logging in...', () => { rl.close(); r(); }));
    await sleep(3000);
  }

  // SCRAPE ALL 67 fast
  let success = 0;
  for (let i = 0; i < ALL_PROFILES.length; i++) {
    const h = ALL_PROFILES[i];
    process.stdout.write(`[${i+1}/${ALL_PROFILES.length}] @${h}... `);
    
    const d = await scrapeProfile(page, h);
    
    if (d._blocked) {
      console.log('BLOCKED - re-logging');
      await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
      await sleep(3000);
      continue;
    }
    
    const existing = fs.readdirSync(OUT).filter(f => f.startsWith(h));
    const cat = existing.length > 0 ? existing[0].replace(h+'_','').replace('.json','') : 'mkt';
    d.category = cat;
    fs.writeFileSync(path.join(OUT, `${h}_${cat}.json`), JSON.stringify(d, null, 2));
    
    console.log(`${d.items.length} items | ${d.followers || '?'} followers`);
    success++;
    
    await sleep(1000);
  }

  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.json'));
  let totalSize = files.reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0);
  let totalItems = 0;
  files.forEach(f => {
    try { totalItems += JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf-8')).items?.length || 0; } catch(e) {}
  });
  console.log(`\n=== DONE: ${success}/${ALL_PROFILES.length} | ${files.length} files | ${(totalSize/1024).toFixed(1)}KB | ${totalItems} posts ===`);
  
  await browser.close();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
