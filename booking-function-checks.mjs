import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from './functions/api/booking.js';

const env={TURNSTILE_SITE_KEY:'public-test-key',TURNSTILE_SECRET_KEY:'secret-test-key',TELEGRAM_BOT_TOKEN:'bot-test-token',TELEGRAM_CHAT_ID:'chat-test-id'};
const config=await onRequestGet({env});
assert.equal(config.status,200);
assert.deepEqual(await config.json(),{turnstileSiteKey:'public-test-key'});

const originalFetch=globalThis.fetch;
const calls=[];
globalThis.fetch=async (url,options={})=>{
 calls.push([String(url),options]);
 if(String(url).includes('/siteverify'))return new Response(JSON.stringify({success:true,action:'booking',hostname:'les-surgut.pages.dev'}),{status:200});
 if(String(url).includes('api.telegram.org'))return new Response(JSON.stringify({ok:true}),{status:200});
 throw new Error(`Unexpected fetch: ${url}`);
};

try{
 const payload={name:'Иван',phone:'+7 (999) 111-22-33',house:'les',bookingType:'stay',arrival:'2026-12-01',departure:'2026-12-03',guests:'4',channel:'telegram',comment:'Баня',reason:'Отдых',page:'https://les-surgut.pages.dev/',company:'',startedAt:String(Date.now()-3000),turnstileToken:'token'};
 const response=await onRequestPost({request:new Request('https://les-surgut.pages.dev/api/booking',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://les-surgut.pages.dev','CF-Connecting-IP':'203.0.113.1'},body:JSON.stringify(payload)}),env});
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{ok:true});
 assert.equal(calls.length,2);
 const telegramBody=JSON.parse(calls[1][1].body);
 assert.match(telegramBody.text,/Дом: Дом «Лес»/);
 assert.match(telegramBody.text,/Даты: 2026-12-01 — 2026-12-03/);
 assert.match(telegramBody.text,/Связаться: telegram/);
 const trap=await onRequestPost({request:new Request('https://les-surgut.pages.dev/api/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company:'spam'})}),env});
 assert.deepEqual(await trap.json(),{ok:true});
 console.log('BOOKING_FUNCTION PASS');
}finally{globalThis.fetch=originalFetch}
