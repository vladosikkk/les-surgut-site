import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const content=JSON.parse(fs.readFileSync('content.json','utf8'));
const library=JSON.parse(fs.readFileSync('photo-library.json','utf8'));
const counts={shalash:26,les:25,tuman:25,luna:25};
const covers={shalash:'shalash-02',les:'les-03',tuman:'tuman-19',luna:'luna-22'};
const amenities={
 shalash:[['shalash-10','Оборудованная кухня','interiors'],['shalash-11','Парная с окном','spa'],['shalash-14','Горячий чан среди сосен','spa'],['shalash-22','Костровая зона и зимняя территория','details']],
 les:[['les-09','Гостиная и праздничный стол','interiors'],['les-14','Спальня в деревянном доме','interiors'],['les-25','Детская площадка на закрытой территории','details'],['les-18','Зона очага у дома','details']],
 tuman:[['tuman-05','Гостиная с панорамными окнами','interiors'],['tuman-07','Оборудованная кухня и лестница','interiors'],['tuman-09','Просторная парная с окном','spa'],['tuman-18','Зона очага среди сосен','details']],
 luna:[['luna-07','Большая барная стойка','interiors'],['luna-16','Парная с панорамным окном','spa'],['luna-14','Спальня','interiors'],['luna-23','Костровая зона на террасе','details']]
};
const galleryAdditions=[
 ['tuman-19','Дом «Туман» среди зимних сосен','homes'],['tuman-05','Панорамная гостиная дома «Туман»','interiors'],['tuman-09','Парная дома «Туман»','spa'],['tuman-03','Новогодняя сервировка дома «Туман»','details'],
 ['luna-22','Дом «Луна» и чан зимой','homes'],['luna-03','Светлая гостиная дома «Луна»','interiors'],['luna-16','Парная дома «Луна»','spa'],['luna-08','Праздничный стол дома «Луна»','details'],
 ['les-03','Дом «Лес» на зимней территории','homes'],['les-09','Праздничная гостиная дома «Лес»','interiors'],['les-11','Парная дома «Лес»','spa'],['les-21','Очаг у дома «Лес»','details'],
 ['shalash-02','Дом «Шалаш» в зимнем лесу','homes'],['shalash-05','Панорамная гостиная дома «Шалаш»','interiors'],['shalash-11','Парная дома «Шалаш»','spa'],['shalash-22','Костровая зона дома «Шалаш»','details']
];

const width=file=>{
 const result=spawnSync('sips',['-g','pixelWidth',file],{encoding:'utf8'});
 if(result.status!==0)throw new Error(result.stderr);
 const value=Number(/pixelWidth: (\d+)/.exec(result.stdout)?.[1]);
 if(!value)throw new Error(`Не удалось определить ширину ${file}`);
 return value;
};

for(const house of content.houses){
 house.cover=covers[house.slug];
 house.gallery=Array.from({length:counts[house.slug]},(_,index)=>`${house.slug}-${String(index+1).padStart(2,'0')}`);
}
for(const [slug,photos] of Object.entries(amenities))library.houses[slug]=photos.map(([name,caption,category])=>[name,caption,category,width(`assets/${name}-small.webp`),width(`assets/${name}.webp`)]);

const existing=new Set(library.photos.map(item=>item[0]));
for(const [name,caption,category] of galleryAdditions)if(!existing.has(name))library.photos.push([name,caption,category,width(`assets/${name}-small.webp`),width(`assets/${name}.webp`)]);

library.responsive=[];
for(const [slug,count] of Object.entries(counts))for(let index=1;index<=count;index++){
 const name=`${slug}-${String(index).padStart(2,'0')}`;
 library.responsive.push([name,width(`assets/${name}-small.webp`),width(`assets/${name}.webp`)]);
}

fs.writeFileSync('content.json',JSON.stringify(content,null,2)+'\n');
fs.writeFileSync('photo-library.json',JSON.stringify(library,null,2)+'\n');
console.log('Обновлены 4 галереи, 4 обложки, 16 фотографий удобств и 16 кадров общей галереи.');
