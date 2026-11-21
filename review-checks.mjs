import {chromium} from 'playwright-core';
import fs from 'node:fs';

const baseURL=process.env.BASE_URL||'http://127.0.0.1:4173/';
const widths=[320,360,375,390,430,768,1024,1440,1920];
const expected=['review-01','review-02','review-03','review-04','review-05','review-06','review-07','review-08'];
const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
const results=[];
fs.mkdirSync('browser-checks',{recursive:true});

for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:900}});
 const errors=[];
 const initialFullRequests=[];
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(/\/assets\/review-\d+\.webp(?:\?|$)/.test(request.url()))initialFullRequests.push(request.url())});
 await page.goto(baseURL,{waitUntil:'domcontentloaded'});
 const section=page.locator('.reviews-section');
 await section.scrollIntoViewIfNeeded();
 await page.waitForTimeout(350);
 const rail=page.locator('.review-carousel');
 const cards=page.locator('.review-card');
 const sequence=await cards.evaluateAll(items=>items.map(item=>item.dataset.media));
 const heights=await cards.evaluateAll(items=>items.map(item=>item.getBoundingClientRect().height));
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 const geometry=await rail.evaluate(element=>{const rect=element.getBoundingClientRect();return{left:rect.left,right:rect.right,width:rect.width,scrollWidth:element.scrollWidth}});
 const result={width,sequence,heights,overflow,geometry,errors,initialFullRequests:[...new Set(initialFullRequests)]};

 if(width===375||width===1440){
  const before=await rail.evaluate(element=>element.scrollLeft);
  if(width>=768)await page.locator('.review-controls [data-carousel-next]').click(); else await rail.press('ArrowRight');
  await page.waitForTimeout(450);
  const after=await rail.evaluate(element=>element.scrollLeft);
  await cards.first().click();
  await page.locator('#media-dialog[open]').waitFor();
  const image=page.locator('.media-stage img');
  await image.waitFor();
  await image.evaluate(element=>element.complete?true:new Promise(resolve=>element.addEventListener('load',()=>resolve(true),{once:true})));
  const opened=await image.getAttribute('src');
  const naturalWidth=await image.evaluate(element=>element.naturalWidth);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  const advanced=await image.getAttribute('src');
  if(width===375)await page.screenshot({path:'browser-checks/review-lightbox-375.png'});
  await page.keyboard.press('Escape');
  const closed=await page.locator('#media-dialog').evaluate(dialog=>!dialog.open);
  const focusReturned=await cards.first().evaluate(element=>document.activeElement===element);
  await section.screenshot({path:`browser-checks/reviews-${width}.png`});
  Object.assign(result,{before,after,opened,advanced,naturalWidth,closed,focusReturned});
 }
 results.push(result);
 await page.close();
}

await browser.close();
fs.writeFileSync('browser-checks/review-results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
const failed=results.some(result=>JSON.stringify(result.sequence)!==JSON.stringify(expected)||new Set(result.heights).size!==1||result.overflow>1||result.geometry.left<0||result.geometry.right>result.width+1||result.errors.length||result.initialFullRequests.length||result.after!==undefined&&(result.after<=result.before||result.opened===result.advanced||result.naturalWidth<1000||!result.closed||!result.focusReturned));
if(failed)process.exitCode=1;
