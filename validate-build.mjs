import fs from 'node:fs';
import path from 'node:path';

const root=fs.existsSync('dist/client/index.html')?'dist/client':'dist';
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const cards=[...html.matchAll(/<article class="editorial-card[\s\S]*?<\/article>/g)].map(match=>match[0]);
const counts=cards.map(card=>(card.match(/data-media=/g)||[]).length);
const ids=cards.flatMap(card=>[...card.matchAll(/data-media="([^"]+)/g)].map(match=>match[1]));
console.log('EDITORIAL_CARDS',cards.length,'COUNTS',counts.join(','));
console.log('EDITORIAL_IMAGES',ids.length,'UNIQUE',new Set(ids).size,'DUPLICATES',ids.length-new Set(ids).size);

const refs=new Set();
for(const relative of fs.readdirSync(root,{recursive:true}).filter(file=>/\.(?:html|css)$/.test(file))){
 const source=fs.readFileSync(path.join(root,relative),'utf8');
 for(const match of source.matchAll(/\/assets\/([^"' )?]+)/g))refs.add(match[1].split('#')[0]);
}
const missing=[...refs].filter(file=>!fs.existsSync(path.join(root,'assets',file)));
console.log('ASSET_REFS',refs.size,'MISSING',missing.length);
if(missing.length)console.log(missing.join('\n'));
console.log('REVIEW_SCREENSHOTS',(html.match(/review-card|review-slide|data-review/g)||[]).length);
const expectedPages=['','about','contacts','events','gallery','houses','houses/les','houses/luna','houses/shalash','houses/tuman','offers','orangery','privacy','services','weddings'];
const missingPages=expectedPages.filter(page=>!fs.existsSync(path.join(root,page,'index.html')));
const assetFiles=fs.readdirSync(path.join(root,'assets'),{withFileTypes:true}).filter(entry=>entry.isFile()).map(entry=>path.join(root,'assets',entry.name));
const oversized=assetFiles.filter(file=>fs.statSync(file).size>=25*1024*1024);
console.log('PAGES',expectedPages.length,'MISSING',missingPages.length,'ASSETS',assetFiles.length,'OVERSIZED',oversized.length);
if(missingPages.length)console.log(missingPages.join('\n'));
if(oversized.length)console.log(oversized.join('\n'));

const expectedCounts=[6,6,6,22,6,6,8,8,17,8];
if(cards.length!==10||counts.some((count,index)=>count!==expectedCounts[index])||ids.length!==new Set(ids).size||missing.length||missingPages.length||oversized.length)process.exitCode=1;
