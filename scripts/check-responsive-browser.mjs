import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const chromeCandidates=['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium'];
const chrome=chromeCandidates.find(fs.existsSync);
if(!chrome)throw new Error('Chrome или Chromium не найден');
const port=9400+Math.floor(Math.random()*400),profile=fs.mkdtempSync(path.join(os.tmpdir(),'les-responsive-'));
const child=spawn(chrome,[`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--headless=new','--disable-gpu','--no-first-run','about:blank'],{stdio:'ignore'});
const pause=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
async function json(url,options){for(let attempt=0;attempt<100;attempt++){try{const response=await fetch(url,options);if(response.ok)return response.json()}catch{}await pause(100)}throw new Error(`Chrome DevTools недоступен: ${url}`)}

try{
 const target=await json(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'}),socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 let sequence=0;const pending=new Map(),listeners=new Map();
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result)}else if(message.method&&listeners.has(message.method)){for(const resolve of listeners.get(message.method).splice(0))resolve(message.params)}});
 const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 const event=method=>new Promise(resolve=>{if(!listeners.has(method))listeners.set(method,[]);listeners.get(method).push(resolve)});
 await command('Page.enable');
 const base=process.env.RESPONSIVE_BASE_URL||'http://127.0.0.1:4173/les-surgut-site/';
 const widths=[320,375,390,430,768,1024,1440,1920],routes=['','houses/','houses/tuman/','houses/luna/','houses/les/','houses/shalash/','gallery/','editor/'],checks=[];let performanceSummary=null;
 for(const width of widths){
  await command('Emulation.setDeviceMetricsOverride',{width,height:width<768?844:1000,deviceScaleFactor:1,mobile:width<768});
  for(const route of routes){
   const loaded=event('Page.loadEventFired');await command('Page.navigate',{url:base+route});await loaded;await pause(120);
   const {result}=await command('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const root=document.documentElement,navigation=performance.getEntriesByType('navigation')[0],resources=performance.getEntriesByType('resource');return {innerWidth,scrollWidth:root.scrollWidth,broken:[...document.images].filter(img=>{const r=img.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&img.complete&&img.naturalWidth===0}).map(img=>img.currentSrc||img.src),performance:{domContentLoadedMs:Math.round(navigation?.domContentLoadedEventEnd||0),loadMs:Math.round(navigation?.loadEventEnd||0),requests:resources.length,encodedKB:Math.round(resources.reduce((sum,item)=>sum+(item.encodedBodySize||0),0)/1024),fullWebpRequests:resources.filter(item=>item.name.endsWith('.webp')&&!item.name.includes('-small.webp')).length,smallWebpRequests:resources.filter(item=>item.name.includes('-small.webp')).length}}})()`});
   if(width===1440&&route==='')performanceSummary=result.value.performance;
   checks.push({width,route,overflow:result.value.scrollWidth-result.value.innerWidth,broken:result.value.broken});
  }
 }
 const failures=checks.filter(item=>item.overflow>1||item.broken.length);
 console.log(JSON.stringify({checks:checks.length,failures,performance:performanceSummary},null,2));
 if(failures.length)process.exitCode=1;
 socket.close();
}finally{child.kill('SIGTERM')}
