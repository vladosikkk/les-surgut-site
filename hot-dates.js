const houses=new Set(['tuman','luna','les','shalash']);
const datePattern=/^\d{4}-\d{2}-\d{2}$/;

const validDate=value=>{
 if(!datePattern.test(String(value||'')))return false;
 const [year,month,day]=value.split('-').map(Number);
 const date=new Date(Date.UTC(year,month-1,day));
 return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
};
const addDays=(key,days)=>{
 const [year,month,day]=key.split('-').map(Number);
 return new Date(Date.UTC(year,month-1,day+days)).toISOString().slice(0,10);
};

export function surgutDateKey(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Yekaterinburg',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
 return `${values.year}-${values.month}-${values.day}`;
}

export function discountPercent(regularPrice,salePrice){
 if(!Number.isFinite(regularPrice)||regularPrice<=0||!Number.isFinite(salePrice)||salePrice<0||salePrice>regularPrice)throw new Error('Некорректные цены');
 return Math.round((regularPrice-salePrice)/regularPrice*100);
}

export function validateHotDate(value){
 if(!value||typeof value!=='object')throw new Error('Предложение не заполнено');
 if(!/^[a-z0-9][a-z0-9-]{2,80}$/.test(String(value.id||'')))throw new Error('Укажите уникальный идентификатор');
 if(!houses.has(value.house))throw new Error('Выберите существующий дом');
 for(const field of ['date','publishFrom','expiresAt'])if(!validDate(value[field]))throw new Error(`Некорректная дата: ${field}`);
 if(value.expiresAt<value.publishFrom)throw new Error('Срок окончания раньше начала публикации');
 if(!Number.isInteger(value.guests)||value.guests<1)throw new Error('Количество гостей должно быть положительным целым числом');
 if(!String(value.terms||'').trim())throw new Error('Укажите условия размещения');
 if(!Number.isFinite(value.regularPrice)||value.regularPrice<=0)throw new Error('Обычная цена должна быть больше нуля');
 if(!Number.isFinite(value.salePrice)||value.salePrice<0||value.salePrice>value.regularPrice)throw new Error('Акционная цена должна быть от нуля до обычной цены');
 return {...value,terms:String(value.terms).trim(),comment:String(value.comment||'').trim(),active:value.active===true,booked:value.booked===true,discount:discountPercent(value.regularPrice,value.salePrice)};
}

export function activeHotDates(values,now=new Date()){
 const today=surgutDateKey(now),lastDay=addDays(today,7);
 return (Array.isArray(values)?values:[]).flatMap(value=>{try{return [validateHotDate(value)]}catch{return []}}).filter(value=>value.active&&!value.booked&&value.date>=today&&value.date<=lastDay&&value.publishFrom<=today&&value.expiresAt>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.house.localeCompare(b.house)||a.id.localeCompare(b.id));
}
