import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const sourceDir=path.resolve(process.argv[2]||'/Users/vladislavkovyc/Downloads/ChatExport_Скачать_3/files');
const root=path.resolve(import.meta.dirname,'..');
const assetDir=path.join(root,'assets');
const mappingFile=path.join(root,'docs/photo-mapping-2026-11-28.md');

const sessions={
 luna:['IMG_9570.PNG','IMG_9571.PNG','IMG_9448.JPG','IMG_9460.JPG','IMG_9434.JPG','IMG_9454.JPG','IMG_9457.JPG','IMG_9443.JPG','IMG_9450.JPG','IMG_9474.JPG','IMG_9462.JPG','IMG_9429.JPG','IMG_9439.JPG','IMG_9436.JPG','IMG_9468.JPG','IMG_9461.JPG','IMG_9444.JPG','IMG_9459.JPG','IMG_9464.JPG','IMG_9428.JPG','IMG_9455.JPG','IMG_9438.JPG','IMG_9458.JPG','IMG_9470.JPG','IMG_9449.JPG'],
 les:['IMG_9573.PNG','IMG_9496.JPG','IMG_9501.JPG','IMG_9574.PNG','IMG_9507.JPG','IMG_9514.JPG','IMG_9480.JPG','IMG_9482.JPG','IMG_9503.JPG','IMG_9520.JPG','IMG_9513.JPG','IMG_9485.JPG','IMG_9495.JPG','IMG_9476.JPG','IMG_9477.JPG','IMG_9510.JPG','IMG_9481.JPG','IMG_9509.JPG','IMG_9493.JPG','IMG_9490.JPG','IMG_9512.JPG','IMG_9515.JPG','IMG_9489.JPG','IMG_9478.JPG','IMG_9497.JPG'],
 shalash:['IMG_9575.PNG','IMG_9528.JPG','IMG_9576.PNG','IMG_9577.PNG','IMG_9532.JPG','IMG_9548.JPG','IMG_9563.JPG','IMG_9550.JPG','IMG_9521.JPG','IMG_9539.JPG','IMG_9533.JPG','IMG_9565.JPG','IMG_9551.JPG','IMG_9524.JPG','IMG_9542.JPG','IMG_9553.JPG','IMG_9554.JPG','IMG_9531.JPG','IMG_9522.JPG','IMG_9526.JPG','IMG_9557.JPG','IMG_9545.JPG','IMG_9547.JPG','IMG_9523.JPG','IMG_9552.JPG','IMG_9537.JPG']
};

const run=(command,args)=>{
 const result=spawnSync(command,args,{encoding:'utf8'});
 if(result.status!==0)throw new Error(`${command} ${args.join(' ')}\n${result.stderr||result.stdout}`);
 return result.stdout;
};
const dimensions=file=>{
 const output=run('sips',['-g','pixelWidth','-g','pixelHeight',file]);
 const width=Number(/pixelWidth: (\d+)/.exec(output)?.[1]);
 const height=Number(/pixelHeight: (\d+)/.exec(output)?.[1]);
 if(!width||!height)throw new Error(`Не удалось определить размер: ${file}`);
 return {width,height};
};
const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fit=(width,height,maxSide)=>{
 const scale=Math.min(1,maxSide/Math.max(width,height));
 return {width:Math.round(width*scale),height:Math.round(height*scale)};
};
const sourceFiles=fs.readdirSync(sourceDir);
const rows=[];

for(const [house,names] of Object.entries(sessions)){
 for(const [index,original] of names.entries()){
  const matches=sourceFiles.filter(name=>name===original||name.endsWith(`_${original}`));
  if(matches.length!==1)throw new Error(`${original}: найдено файлов ${matches.length}, ожидался 1`);
  const source=path.join(sourceDir,matches[0]);
  const number=String(index+1).padStart(2,'0');
  const target=`${house}-${number}.webp`;
  const small=`${house}-${number}-small.webp`;
  const originalSize=dimensions(source);
  const fullSize=fit(originalSize.width,originalSize.height,2400);
  const smallWidth=Math.min(720,originalSize.width);
  const smallHeight=Math.round(originalSize.height*(smallWidth/originalSize.width));
  run('cwebp',['-quiet','-mt','-m','6','-q','84','-metadata','none','-resize',String(fullSize.width),String(fullSize.height),source,'-o',path.join(assetDir,target)]);
  run('cwebp',['-quiet','-mt','-m','6','-q','80','-metadata','none','-resize',String(smallWidth),String(smallHeight),source,'-o',path.join(assetDir,small)]);
  const fullActual=dimensions(path.join(assetDir,target));
  const smallActual=dimensions(path.join(assetDir,small));
  const ratio=originalSize.width/originalSize.height;
  if(Math.abs(fullActual.width/fullActual.height-ratio)>0.001||Math.abs(smallActual.width/smallActual.height-ratio)>0.002)throw new Error(`Нарушены пропорции: ${target}`);
  rows.push({house,index:index+1,original,telegram:matches[0],target,small,originalSize,fullActual,smallActual,fullHash:digest(path.join(assetDir,target)),smallHash:digest(path.join(assetDir,small))});
 }
}

for(const kind of ['fullHash','smallHash']){
 if(new Set(rows.map(row=>row[kind])).size!==rows.length)throw new Error(`Обнаружены дубликаты ${kind}`);
}

const houseNames={luna:'Луна',les:'Лес',shalash:'Шалаш'};
const lines=['# Соответствие фотографий домов — 28 ноября 2026','','Оригиналы не изменялись. Полные версии: WebP, качество 84, длинная сторона до 2400 px. Адаптивные версии: WebP, качество 80, ширина до 720 px. Кадрирование не применяется.',''];
for(const house of Object.keys(sessions)){
 lines.push(`## ${houseNames[house]}`,'','| № | Исходное имя | Файл Telegram | Полный WebP | Адаптивный WebP | Размер исходника → WebP |','|---:|---|---|---|---|---|');
 for(const row of rows.filter(item=>item.house===house))lines.push(`| ${row.index} | ${row.original} | ${row.telegram} | ${row.target} | ${row.small} | ${row.originalSize.width}×${row.originalSize.height} → ${row.fullActual.width}×${row.fullActual.height} |`);
 lines.push('');
}
fs.writeFileSync(mappingFile,lines.join('\n')+'\n');
console.log(`Обработано ${rows.length} оригиналов: ${rows.length*2} WebP. Пропорции и уникальность подтверждены.`);
