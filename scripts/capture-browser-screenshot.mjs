import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [url,selector,output,width='1440',height='1000']=process.argv.slice(2);
if(!url||!selector||!output)throw new Error('Использование: node capture-browser-screenshot.mjs URL SELECTOR OUTPUT [WIDTH] [HEIGHT]');
const chrome=['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium'].find(fs.existsSync);
if(!chrome)throw new Error('Chrome или Chromium не найден');
const port=10000+Math.floor(Math.random()*40000),profile=fs.mkdtempSync(path.join(os.tmpdir(),'les-capture-'));
const child=spawn(chrome,[`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','about:blank'],{stdio:'ignore'});
const pause=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
async function json(endpoint,options){for(let attempt=0;attempt<100;attempt++){try{const response=await fetch(endpoint,options);if(response.ok)return response.json()}catch{}await pause(100)}throw new Error('Chrome DevTools недоступен')}

try{
 const target=await json(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'}),socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 let sequence=0;const pending=new Map(),listeners=new Map();
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const item=pending.get(message.id);pending.delete(message.id);message.error?item.reject(new Error(message.error.message)):item.resolve(message.result)}else if(message.method&&listeners.has(message.method)){for(const resolve of listeners.get(message.method).splice(0))resolve(message.params)}});
 const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 const event=method=>new Promise(resolve=>{if(!listeners.has(method))listeners.set(method,[]);listeners.get(method).push(resolve)});
 await command('Page.enable');await command('Emulation.setDeviceMetricsOverride',{width:Number(width),height:Number(height),deviceScaleFactor:1,mobile:Number(width)<768});
 const loaded=event('Page.loadEventFired');await command('Page.navigate',{url});await loaded;await pause(700);
 await command('Runtime.evaluate',{expression:`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'start'})`});await pause(250);
 const screenshot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});fs.writeFileSync(output,Buffer.from(screenshot.data,'base64'));
 console.log(`SCREENSHOT ${output}`);socket.close();
}finally{child.kill('SIGTERM')}
