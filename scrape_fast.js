const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\opencode\\instagram_data';
fs.mkdirSync(OUT, { recursive: true });

const ALL = [
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('=== ULTRA FAST PLAYWRIGHT SCRAPE ===\n');
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // LOGIN - same evaluate approach that worked before
  console.log('Login...');
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'load', timeout: 60000 });
  await sleep(3000);
  await page.evaluate(({e,p}) => {
    const i = document.querySelectorAll('input');
    if(i.length>=2){const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    s.call(i[0],e);i[0].dispatchEvent(new Event('input',{bubbles:true}));
    s.call(i[1],p);i[1].dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('button[type="submit"]')?.click();}
  },{e:'hussainsingapuri24@gmail.com',p:'2j@n2006'});
  await sleep(6000);
  for(let i=0;i<3;i++){try{await page.evaluate(()=>{document.querySelectorAll('button').forEach(b=>{if(b.textContent.includes('Not Now'))b.click()})})}catch(e){}await sleep(1000);}

  // Check login - wait for actual content
  await sleep(3000);
  const homeText = await page.textContent('body').catch(() => '');
  const loggedIn = homeText.includes('Home') || homeText.includes('Following') || homeText.includes('Suggestions');
  console.log(`Login: ${loggedIn?'✓':'✗'} (body ${homeText.length} chars)`);
  
  if(!loggedIn){
    console.log('Retry 2jan2006...');
    await page.goto('https://www.instagram.com/accounts/login/',{waitUntil:'load',timeout:30000});
    await sleep(3000);
    await page.evaluate(({e,p})=>{const i=document.querySelectorAll('input');if(i.length>=2){const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(i[0],e);i[0].dispatchEvent(new Event('input',{bubbles:true}));s.call(i[1],p);i[1].dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('button[type="submit"]')?.click();}},{e:'hussainsingapuri24@gmail.com',p:'2jan2006'});
    await sleep(6000);
    for(let i=0;i<3;i++){try{await page.evaluate(()=>{document.querySelectorAll('button').forEach(b=>{if(b.textContent.includes('Not Now'))b.click()})})}catch(e){}await sleep(1000);}
  }

  // SCRAPE ALL FAST - one page, no enrichment, minimal waits
  let ok=0;
  for(let i=0;i<ALL.length;i++){
    const h=ALL[i];
    process.stdout.write(`${i+1}/${ALL.length} @${h}... `);
    
    try{
      await page.goto(`https://www.instagram.com/${h}/`,{waitUntil:'domcontentloaded',timeout:15000});
      await sleep(2000);
      
      if(page.url().includes('login')){console.log('B');await page.goto('https://www.instagram.com/');await sleep(3000);if(!page.url().includes('login')){console.log('OK');}else{console.log('still B');}continue;}
      
      // Quick scroll
      for(let s=0;s<8;s++){await page.evaluate(()=>window.scrollBy(0,400));await sleep(150);}
      
      const d=await page.evaluate((h)=>{const r={handle:h,profileName:'',followers:'',following:'',postCount:'',items:[]};
        r.ogTitle=document.querySelector('meta[property="og:title"]')?.content||'';
        r.ogDesc=document.querySelector('meta[property="og:description"]')?.content||'';
        r.ogImage=document.querySelector('meta[property="og:image"]')?.content||'';
        if(r.ogTitle){const m=r.ogTitle.match(/^([^(]+)/);if(m)r.profileName=m[1].trim();}
        if(r.ogDesc){
          const f=r.ogDesc.match(/([\d,.KMkmB]+)\s*Followers/);if(f)r.followers=f[1];
          const g=r.ogDesc.match(/([\d,.KMkmB]+)\s*Following/);if(g)r.following=g[1];
          const p=r.ogDesc.match(/([\d,.KMkmB]+)\s*Posts/);if(p)r.postCount=p[1];}
        const seen=new Set();
        document.querySelectorAll('a').forEach(a=>{const u=a.href;if((u.includes('/p/')||u.includes('/reel/'))&&!seen.has(u)){seen.add(u);const img=a.querySelector('img');r.items.push({url:u,imgSrc:img?.src||''})}});
        return r;
      },h);
      
      const existing=fs.readdirSync(OUT).filter(f=>f.startsWith(h));
      const cat=existing.length>0?existing[0].replace(h+'_','').replace('.json',''):'mkt';
      d.category=cat;
      fs.writeFileSync(path.join(OUT,`${h}_${cat}.json`),JSON.stringify(d,null,2));
      
      console.log(`${d.items.length}p | ${d.followers||'?'}f`);
      ok++;
    }catch(e){console.log(`E:${e.message.substring(0,30)}`);}
    
    await sleep(500);
  }

  const files=fs.readdirSync(OUT).filter(f=>f.endsWith('.json'));
  let totalSize=files.reduce((a,f)=>a+fs.statSync(path.join(OUT,f)).size,0);
  let totalItems=0;
  files.forEach(f=>{try{totalItems+=JSON.parse(fs.readFileSync(path.join(OUT,f),'utf-8')).items?.length||0}catch(e){}});
  console.log(`\n=== DONE: ${ok}/${ALL.length} files | ${files.length} total | ${(totalSize/1024).toFixed(1)}KB | ${totalItems} posts ===`);
  
  await browser.close();
}

main().catch(e=>{console.error('FATAL:',e.message);process.exit(1);});
