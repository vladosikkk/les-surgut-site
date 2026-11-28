import assert from 'node:assert/strict';
import fs from 'node:fs';

const content=JSON.parse(fs.readFileSync('content.json','utf8'));
const library=JSON.parse(fs.readFileSync('photo-library.json','utf8'));
const expected={shalash:26,les:25,tuman:25,luna:25};
const covers={shalash:'shalash-02',les:'les-03',tuman:'tuman-19',luna:'luna-22'};

for(const [slug,count] of Object.entries(expected)){
 const house=content.houses.find(item=>item.slug===slug);
 assert.ok(house,`Не найден дом ${slug}`);
 assert.equal(house.cover,covers[slug],`Неверная обложка ${slug}`);
 assert.deepEqual(house.gallery,Array.from({length:count},(_,index)=>`${slug}-${String(index+1).padStart(2,'0')}`),`Неверный порядок ${slug}`);
 assert.equal(library.houses[slug].length,4,`Нужно 4 фотографии удобств ${slug}`);
}

assert.equal(new Set(content.houses.flatMap(house=>house.gallery)).size,101,'Галереи домов не должны содержать дубликаты');
assert.equal(library.responsive.length,101,'Нужны точные размеры всех 101 фотографий фотосессий');
for(const [name,small,large] of library.responsive){
 assert.ok(fs.existsSync(`assets/${name}.webp`),`Нет ${name}.webp`);
 assert.ok(fs.existsSync(`assets/${name}-small.webp`),`Нет ${name}-small.webp`);
 assert.ok(small>0&&large>=small,`Некорректные размеры ${name}`);
}

const galleryAssets=new Set(library.photos.map(item=>item[0]));
for(const name of ['tuman-19','tuman-05','luna-22','luna-03','les-03','les-09','shalash-02','shalash-05'])assert.ok(galleryAssets.has(name),`Общая галерея не содержит ${name}`);

console.log('HOUSE_PHOTOS_OK 101');
