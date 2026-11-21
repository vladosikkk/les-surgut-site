import {chromium} from 'playwright-core';
import fs from 'node:fs';

const executablePath='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseURL=process.env.BASE_URL||'http://127.0.0.1:4173';
const widths=[320,375,390,430,768,1024,1440,1920];
const browser=await chromium.launch({headless:true,executablePath});
const results=[];
fs.mkdirSync('browser-checks',{recursive:true});

for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 const errors=[];
 const failed=[];
 const videoRequests=[];
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
 page.on('pageerror',error=>errors.push(error.message));
 page.on('requestfailed',request=>{if(request.failure()?.errorText!=='net::ERR_ABORTED')failed.push(`${request.url()} ${request.failure()?.errorText||''}`)});
 page.on('request',request=>{if(request.url().includes('/assets/les-wedding.mp4'))videoRequests.push(request.url())});

 await page.goto(`${baseURL}/weddings/`,{waitUntil:'networkidle'});
 const beforeVideoRequests=videoRequests.length;
 const metrics=await page.evaluate(()=>(
  {
   overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   locations:document.querySelectorAll('.wedding-location-card').length,
   comforts:document.querySelectorAll('.wedding-comfort-card').length,
   photos:new Set([...document.querySelectorAll('.wedding-photo img,.wedding-hero>img,.wedding-final>img')].map(img=>img.currentSrc||img.src)).size,
   mobileBottomVisible:getComputedStyle(document.querySelector('.mobile-bottom')).display!=='none',
   headings:[...document.querySelectorAll('h1,h2')].map(node=>node.textContent.trim())
  }
 ));

 let interactions=null;
 if(width===375||width===1440){
  const photoButton=page.locator('.wedding-intro-gallery .wedding-photo').first();
  await photoButton.scrollIntoViewIfNeeded();
  await photoButton.click();
  await page.locator('#media-dialog[open] .media-stage img').waitFor();
  await page.keyboard.press('Escape');
  const lightboxClosed=await page.locator('#media-dialog').evaluate(dialog=>!dialog.open);
  const photoFocusReturned=await photoButton.evaluate(button=>document.activeElement===button);

  const cta=page.locator('.wedding-hero [data-book]');
  await cta.click();
  await page.locator('#booking-dialog[open]').waitFor();
  const booking=await page.evaluate(()=>(
   {
    eventChecked:document.querySelector('input[name="bookingType"][value="event"]').checked,
    house:document.querySelector('#booking-house').value,
    comment:document.querySelector('#booking-form textarea[name="comment"]').value
   }
  ));
  await page.keyboard.press('Escape');

  const videoButton=page.locator('.wedding-video-button');
  await videoButton.click();
  await page.locator('#media-dialog[open] video').waitFor();
  await page.waitForTimeout(1200);
  const video=await page.locator('#media-dialog video').evaluate(element=>({controls:element.controls,preload:element.preload,readyState:element.readyState,src:element.currentSrc||element.src}));
  await page.keyboard.press('Escape');
  const videoRemoved=await page.locator('#media-dialog video').count()===0;
  const videoFocusReturned=await videoButton.evaluate(button=>document.activeElement===button);
  interactions={lightboxClosed,photoFocusReturned,booking,video,videoRemoved,videoFocusReturned};
  const pageHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<pageHeight;y+=600){await page.evaluate(value=>scrollTo(0,value),y);await page.waitForTimeout(90)}
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(250);
  await page.screenshot({path:`browser-checks/weddings-${width}.png`,fullPage:true});
 }

 results.push({width,beforeVideoRequests,videoRequests:videoRequests.length,metrics,interactions,errors,failed});
 await page.close();
}

const eventsPage=await browser.newPage({viewport:{width:1280,height:900}});
await eventsPage.goto(`${baseURL}/events/`,{waitUntil:'networkidle'});
const weddingLink=await eventsPage.locator('a[href="/weddings/"]').count();
await eventsPage.close();
await browser.close();

const output={weddingLink,results};
fs.writeFileSync('browser-checks/weddings-results.json',JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));
