import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const baseURL=process.env.BASE_URL||'http://127.0.0.1:4174';
const config=await fetch(`${baseURL}/api/booking`).then(response=>response.json());
assert.ok(config.turnstileSiteKey);
for(const route of ['/','/houses/shalash/','/houses/les/','/houses/tuman/','/houses/luna/','/events/','/gallery/','/weddings/']){
 const response=await fetch(`${baseURL}${route}`);assert.equal(response.status,200,route);
}
const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:375,height:812}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`${baseURL}/weddings/`,{waitUntil:'networkidle'});
 await page.locator('[data-book]:visible').first().click();
 await page.locator('#booking-dialog[open]').waitFor();
 await page.waitForTimeout(5000);
 const turnstileState=await page.evaluate(()=>({scripts:[...document.scripts].map(script=>script.src).filter(Boolean),iframeCount:document.querySelectorAll('iframe').length,note:document.querySelector('#booking-security-note')?.textContent,container:document.querySelector('#booking-turnstile')?.innerHTML}));
 assert.ok(turnstileState.scripts.some(src=>src.includes('challenges.cloudflare.com')),JSON.stringify(turnstileState));
 assert.match(turnstileState.container||'',/cf-turnstile-response/,JSON.stringify(turnstileState));
 const fields=await page.locator('#booking-form [name]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('name')));
 for(const name of ['house','bookingType','arrival','departure','guests','name','phone','channel','comment','consent','company','startedAt'])assert.ok(fields.includes(name),name);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 assert.ok(overflow<=1,`overflow ${overflow}`);assert.deepEqual(errors,[]);
 console.log('CLOUDFLARE_PAGES_BROWSER PASS');
}finally{await browser.close()}
