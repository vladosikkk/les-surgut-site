import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root='dist/client';
const pages=['','houses','gallery','services','events','about','contacts','offers','houses/tuman','houses/luna','houses/les','houses/shalash'];
for(const route of pages){
 const html=fs.readFileSync(path.join(root,route,'index.html'),'utf8');
 assert.match(html,/class="hot-strip"/,`Нет верхней полосы: ${route||'главная'}`);
 assert.match(html,/href="\/les-surgut-site\/#hot-dates"/,`Неверная ссылка полосы: ${route||'главная'}`);
}
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(home,/id="hot-dates"/);
assert.match(home,/data-hot-date-list="all"/);
for(const slug of ['tuman','luna','les','shalash']){
 const html=fs.readFileSync(path.join(root,'houses',slug,'index.html'),'utf8');
 assert.match(html,new RegExp(`data-house-hot-dates="${slug}"`));
}
assert.ok(fs.existsSync(path.join(root,'hot-dates.js')),'Модуль горячих дат не скопирован');
const content=JSON.parse(fs.readFileSync('content.json','utf8'));
assert.deepEqual(content.hotDates,[],'В публичных данных не должно быть тестовых предложений');
console.log('HOT_DATES_DOM PASS');
