import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateHotDate} from '../src/hot-dates.mjs';

const clone=value=>structuredClone(value);
const findOffer=(offers,id)=>{
 const index=offers.findIndex(item=>item.id===id);
 if(index<0)throw new Error(`Предложение «${id}» не найдено`);
 return index;
};

export function mutateHotDates(source,action,input={}){
 const content=clone(source||{}),offers=Array.isArray(content.hotDates)?content.hotDates:[];
 const id=String(input.id||'').trim();
 if(action==='add'){
  if(offers.some(item=>item.id===id))throw new Error(`Предложение «${id}» уже существует`);
  offers.push(validateHotDate(input));
 }else if(action==='edit'){
  const index=findOffer(offers,id);
  offers[index]=validateHotDate({...offers[index],...input,id});
 }else if(action==='disable'){
  const index=findOffer(offers,id);offers[index]=validateHotDate({...offers[index],active:false});
 }else if(action==='book'){
  const index=findOffer(offers,id);offers[index]=validateHotDate({...offers[index],booked:true});
 }else if(action==='delete'){
  offers.splice(findOffer(offers,id),1);
 }else throw new Error('Допустимые операции: add, edit, disable, book, delete');
 content.hotDates=offers.sort((a,b)=>a.date.localeCompare(b.date)||a.house.localeCompare(b.house)||a.id.localeCompare(b.id));
 return content;
}

function parseArguments(values){
 const result={};
 for(let index=0;index<values.length;index+=2){
  const key=values[index];if(!key?.startsWith('--')||values[index+1]===undefined)throw new Error('Аргументы передаются парами: --поле значение');
  result[key.slice(2)]=values[index+1];
 }
 for(const key of ['guests','regularPrice','salePrice'])if(result[key]!==undefined)result[key]=Number(result[key]);
 for(const key of ['active','booked'])if(result[key]!==undefined)result[key]=result[key]==='true';
 return result;
}

function run(){
 const [action,...rest]=process.argv.slice(2),input=parseArguments(rest),filename=path.resolve(input.file||'content.json');delete input.file;
 const source=JSON.parse(fs.readFileSync(filename,'utf8'));
 const updated=mutateHotDates(source,action,input),temporary=`${filename}.tmp`;
 fs.writeFileSync(temporary,`${JSON.stringify(updated,null,2)}\n`);
 fs.renameSync(temporary,filename);
 console.log(`HOT_DATE_${action.toUpperCase()} ${input.id}`);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{run()}catch(error){console.error(error.message);process.exitCode=1}
}
