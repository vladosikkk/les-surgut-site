import {chromium} from 'playwright-core';
import fs from 'node:fs';

const executablePath='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseURL=process.env.BASE_URL||'http://127.0.0.1:4173/';
const widths=[320,360,375,390,430,768,1024,1440,1920];
const browser=await chromium.launch({headless:true,executablePath});
const results=[];
fs.mkdirSync('browser-checks',{recursive:true});

for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 const errors=[];
 const failed=[];
 const fullVideoRequests=[];
 const fullReviewRequests=[];
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
 page.on('pageerror',error=>errors.push(error.message));
 page.on('requestfailed',request=>{if(request.failure()?.errorText!=='net::ERR_ABORTED')failed.push(`${request.method()} ${request.url()} ${request.failure()?.errorText||''}`)});
 page.on('request',request=>{if(/\/assets\/house-(?:shalash|les|tuman|luna)\.mp4/.test(request.url()))fullVideoRequests.push(request.url())});
 page.on('request',request=>{if(/\/assets\/review-\d+\.webp(?:\?|$)/.test(request.url()))fullReviewRequests.push(request.url())});
 await page.goto(baseURL,{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(600);

 const metrics=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
  cards:document.querySelectorAll('.editorial-card').length,
  counts:[...document.querySelectorAll('.editorial-card')].map(card=>card.querySelectorAll('[data-media]').length),
  rails:[...document.querySelectorAll('[data-photo-carousel]')].map(rail=>({left:rail.getBoundingClientRect().left,right:rail.getBoundingClientRect().right,width:rail.clientWidth,scrollWidth:rail.scrollWidth})),
  headerPosition:getComputedStyle(document.querySelector('.header')).position,
  mobileBottomVisible:getComputedStyle(document.querySelector('.mobile-bottom')).display!=='none'
 }));

 if(width===375||width===1440){
  const firstRail=page.locator('[data-photo-carousel]').first();
  await firstRail.scrollIntoViewIfNeeded();
  const before=await firstRail.evaluate(element=>element.scrollLeft);
  if(width>=768)await page.locator('[data-carousel-next]').first().click();
  else await firstRail.press('ArrowRight');
  await page.waitForTimeout(500);
  const after=await firstRail.evaluate(element=>element.scrollLeft);
  await page.locator('.editorial-shot').first().click();
  await page.locator('#media-dialog[open]').waitFor();
  const opened=await page.locator('.media-stage img').getAttribute('src');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  const advanced=await page.locator('.media-stage img').getAttribute('src');
  if(width===375)await page.screenshot({path:'browser-checks/lightbox-375.png'});
  await page.keyboard.press('Escape');
  const closed=await page.locator('#media-dialog').evaluate(dialog=>!dialog.open);
  const focusReturned=await page.locator('.editorial-shot').first().evaluate(element=>document.activeElement===element);
  results.push({width,interaction:{before,after,opened,advanced,closed,focusReturned}});

  await page.evaluate(async()=>{
   for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(resolve=>setTimeout(resolve,35))}
   window.scrollTo(0,0);
  });
  await page.waitForTimeout(700);
  const brokenImages=await page.evaluate(()=>[...document.images].filter(image=>image.complete&&image.naturalWidth===0).map(image=>image.currentSrc||image.src));
  results.at(-1).brokenImages=brokenImages;
  const firstCard=page.locator('.editorial-card').first();
  await firstCard.scrollIntoViewIfNeeded();
  await firstCard.screenshot({path:`browser-checks/gallery-${width}.png`});
 }

 const row=results.find(result=>result.width===width)||{width};
 Object.assign(row,{...metrics,errors,failed,fullVideoRequests:[...new Set(fullVideoRequests)],fullReviewRequests:[...new Set(fullReviewRequests)]});
 if(!results.includes(row))results.push(row);
 await page.close();
}

const videoPage=await browser.newPage({viewport:{width:1440,height:900}});
const videoChecks=[];
const videoErrors=[];
videoPage.on('console',message=>{if(message.type()==='error')videoErrors.push(message.text())});
videoPage.on('pageerror',error=>videoErrors.push(error.message));
await videoPage.goto(`${baseURL}gallery/`,{waitUntil:'domcontentloaded'});
const videoCards=videoPage.locator('.house-video-card');
for(let index=0;index<await videoCards.count();index++){
 const card=videoCards.nth(index);
 const house=await card.getAttribute('data-video-house');
 await card.click();
 const video=videoPage.locator('.media-stage video');
 await video.waitFor();
 await video.evaluate(element=>element.readyState>=1?true:new Promise((resolve,reject)=>{
  element.addEventListener('loadedmetadata',()=>resolve(true),{once:true});
  element.addEventListener('error',()=>reject(new Error('video metadata failed')),{once:true});
 }));
 videoChecks.push({house,src:await video.getAttribute('src'),duration:await video.evaluate(element=>element.duration),readyState:await video.evaluate(element=>element.readyState)});
 await videoPage.keyboard.press('Escape');
 await videoPage.locator('#media-dialog').evaluate(dialog=>!dialog.open);
}
await videoPage.close();
const reviewChecks=[];
for(const width of [375,1440]){
 const reviewPage=await browser.newPage({viewport:{width,height:900}});
 const errors=[];
 reviewPage.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
 reviewPage.on('pageerror',error=>errors.push(error.message));
 await reviewPage.goto(baseURL,{waitUntil:'domcontentloaded'});
 const section=reviewPage.locator('.reviews-section');
 await section.scrollIntoViewIfNeeded();
 const rail=reviewPage.locator('.review-carousel');
 const sequence=await reviewPage.locator('.review-card').evaluateAll(cards=>cards.map(card=>card.dataset.media));
 const heights=await reviewPage.locator('.review-card').evaluateAll(cards=>cards.map(card=>card.getBoundingClientRect().height));
 const before=await rail.evaluate(element=>element.scrollLeft);
 if(width>=768)await reviewPage.locator('.review-controls [data-carousel-next]').click();
 else await rail.press('ArrowRight');
 await reviewPage.waitForTimeout(450);
 const after=await rail.evaluate(element=>element.scrollLeft);
 await reviewPage.locator('.review-card').first().click();
 await reviewPage.locator('#media-dialog[open]').waitFor();
 const opened=await reviewPage.locator('.media-stage img').getAttribute('src');
 const naturalWidth=await reviewPage.locator('.media-stage img').evaluate(image=>image.naturalWidth);
 await reviewPage.keyboard.press('ArrowRight');
 await reviewPage.waitForTimeout(150);
 const advanced=await reviewPage.locator('.media-stage img').getAttribute('src');
 if(width===375)await reviewPage.screenshot({path:'browser-checks/review-lightbox-375.png'});
 await reviewPage.keyboard.press('Escape');
 const closed=await reviewPage.locator('#media-dialog').evaluate(dialog=>!dialog.open);
 const focusReturned=await reviewPage.locator('.review-card').first().evaluate(element=>document.activeElement===element);
 await section.screenshot({path:`browser-checks/reviews-${width}.png`});
 reviewChecks.push({width,sequence,heights,before,after,opened,advanced,naturalWidth,closed,focusReturned,errors});
 await reviewPage.close();
}
await browser.close();
fs.writeFileSync('browser-checks/results.json',JSON.stringify(results,null,2));
fs.writeFileSync('browser-checks/video-results.json',JSON.stringify({videoChecks,videoErrors},null,2));
fs.writeFileSync('browser-checks/review-results.json',JSON.stringify(reviewChecks,null,2));
console.log(JSON.stringify(results,null,2));
console.log(JSON.stringify({videoChecks,videoErrors},null,2));
console.log(JSON.stringify({reviewChecks},null,2));

const expectedReviews=['review-01','review-02','review-03','review-04','review-05','review-06','review-07','review-08'];
const failed=results.some(result=>result.overflow>1||result.cards!==10||result.counts.some(count=>count<5||count>8)||result.rails.some(rail=>rail.left<0||rail.right>result.width+1)||result.headerPosition!=='sticky'||result.mobileBottomVisible!==(result.width<768)||result.errors.length||result.failed.length||result.fullVideoRequests.length||result.fullReviewRequests.length||result.brokenImages?.length||result.interaction&&(result.interaction.after<=result.interaction.before||result.interaction.opened===result.interaction.advanced||!result.interaction.closed||!result.interaction.focusReturned))||videoChecks.length!==4||videoChecks.some(video=>!Number.isFinite(video.duration)||video.duration<=0||video.readyState<1)||videoErrors.length||reviewChecks.some(check=>JSON.stringify(check.sequence)!==JSON.stringify(expectedReviews)||new Set(check.heights).size!==1||check.after<=check.before||check.opened===check.advanced||check.naturalWidth<1000||!check.closed||!check.focusReturned||check.errors.length);
if(failed)process.exitCode=1;
