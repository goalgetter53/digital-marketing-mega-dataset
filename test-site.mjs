import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });
console.log('Title:', await page.title());
console.log('URL:', page.url());
await page.screenshot({ path: 'C:\\Users\\Admin\\AppData\\Local\\Temp\\opencode\\screenshot.png', fullPage: true });
console.log('Screenshot saved');
await browser.close();
