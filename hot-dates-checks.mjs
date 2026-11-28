import assert from 'node:assert/strict';
import {activeHotDates,discountPercent,surgutDateKey,validateHotDate} from './src/hot-dates.mjs';

const now=new Date('2026-11-27T20:30:00Z'); // 28 ноября, 01:30 в Сургуте
const offer=(overrides={})=>({
 id:'tuman-2026-11-30',house:'tuman',date:'2026-11-30',guests:4,
 terms:'Будний день, доступность подтверждает менеджер',regularPrice:20000,salePrice:15000,
 publishFrom:'2026-11-28',expiresAt:'2026-11-30',active:true,booked:false,comment:'',...overrides
});

assert.equal(surgutDateKey(now),'2026-11-28','Дата должна рассчитываться по времени Сургута');
assert.equal(discountPercent(20000,15000),25,'20 000 → 15 000 равно 25%');
assert.equal(discountPercent(15000,14000),7,'Процент округляется до целого');
assert.equal(validateHotDate(offer()).discount,25,'Валидное предложение нормализуется');
assert.throws(()=>validateHotDate(offer({salePrice:21000})),/акционная цена/i);
assert.throws(()=>validateHotDate(offer({regularPrice:-1})),/обычная цена/i);
assert.throws(()=>validateHotDate(offer({house:'unknown'})),/дом/i);
assert.throws(()=>validateHotDate(offer({date:'30.11.2026'})),/дата/i);

assert.deepEqual(activeHotDates([offer()],now).map(item=>item.id),['tuman-2026-11-30']);
assert.equal(activeHotDates([offer({date:'2026-12-05',id:'day-7',expiresAt:'2026-12-05'})],now).length,1,'Седьмой день включён');
assert.equal(activeHotDates([offer({date:'2026-12-06',id:'day-8',expiresAt:'2026-12-06'})],now).length,0,'Восьмой день скрыт');
assert.equal(activeHotDates([offer({active:false})],now).length,0,'Отключённое предложение скрыто');
assert.equal(activeHotDates([offer({booked:true})],now).length,0,'Забронированное предложение скрыто');
assert.equal(activeHotDates([offer({date:'2026-11-27'})],now).length,0,'Прошедшая дата скрыта');
assert.equal(activeHotDates([offer({expiresAt:'2026-11-27'})],now).length,0,'Истёкшее предложение скрыто');
assert.equal(activeHotDates([offer({publishFrom:'2026-11-29'})],now).length,0,'Будущая публикация скрыта');
assert.equal(activeHotDates([offer({salePrice:21000})],now).length,0,'Некорректные цены не ломают страницу');

const multiple=activeHotDates([
 offer({id:'luna',house:'luna',date:'2026-12-01'}),
 offer({id:'les',house:'les',date:'2026-11-29'}),
 offer({id:'shalash',house:'shalash',date:'2026-11-29'})
],now);
assert.deepEqual(multiple.map(item=>item.id),['les','shalash','luna'],'Предложения сортируются по дате и дому');

console.log('HOT_DATES_CHECKS PASS');
