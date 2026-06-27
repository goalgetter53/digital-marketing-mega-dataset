const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DATA_DIR = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\opencode\\instagram_data';

async function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function main() {
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Login fresh
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'load', timeout: 60000 });
  await sleep(4000);
  await page.evaluate(({email, pass}) => {
    const inputs = document.querySelectorAll('input:not([type="password"])');
    inputs.forEach(i => { if (!i.value) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(i, email); i.dispatchEvent(new Event('input', { bubbles: true })); }});
    const pwd = document.querySelector('input[type="password"]');
    if (pwd) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(pwd, pass); pwd.dispatchEvent(new Event('input', { bubbles: true })); }
  }, {email: 'hussainsingapuri24@gmail.com', pass: '2j@n2006'});
  await sleep(1500);
  await page.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (b.textContent.includes('Log in')) b.click(); }); });
  await sleep(8000);

  // Test a profile that had 0 items - dump the page structure
  const testHandle = 'nogood.io';
  await page.goto(`https://www.instagram.com/${testHandle}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(5000);
  
  // Dump page structure
  const pageInfo = await page.evaluate(() => {
    const d = {};
    d.url = window.location.href;
    d.title = document.title;
    d.bodyLength = document.body?.textContent?.length || 0;
    d.isLoginWall = document.body?.textContent?.includes('Log in') || false;
    d.ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
    d.ogDesc = document.querySelector('meta[property="og:description"]')?.content || '';
    d.ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
    // Check for grid containers
    d.allLinks = Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('/p/') || h.includes('/reel/')).slice(0, 5);
    d.hasArticle = !!document.querySelector('article');
    d.hasMain = !!document.querySelector('main');
    d.sectionImages = Array.from(document.querySelectorAll('img')).map(i => i.alt?.substring(0, 100)).filter(Boolean).slice(0, 3);
    d.linkCount = document.querySelectorAll('a').length;
    return d;
  });
  
  console.log(JSON.stringify(pageInfo, null, 2));
  
  await browser.close();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
