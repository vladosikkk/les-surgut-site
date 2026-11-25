(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
let site=null;let selected={arrival:'',departure:'',house:''};let lastOpener=null;let gallery=[];let galleryIndex=0;
const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=()=>localDate(new Date());
const parseDate=s=>new Date(`${s}T12:00:00`);
const formatDate=s=>parseDate(s).toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
const money=n=>new Intl.NumberFormat('ru-RU').format(n);
const safeURL=(value,hosts=[])=>{try{const u=new URL(value,location.origin);if(u.protocol!=='https:'&&u.origin!==location.origin)return null;if(hosts.length&&!hosts.includes(u.hostname))return null;return u.href;}catch{return null;}};
const safePhoto=name=>typeof name==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,120}$/.test(name);
const notify=text=>{const t=$('.toast');if(!t)return;t.textContent=text;t.hidden=false;setTimeout(()=>{t.hidden=true},3500)};
const readLocal=key=>{try{return localStorage.getItem(key)}catch{return null}};
const writeLocal=(key,value)=>{try{localStorage.setItem(key,value);return true}catch{return false}};
const lock=()=>document.body.classList.toggle('modal-open',!!$('dialog[open]'));
function openDialog(dialog,opener){lastOpener=opener||document.activeElement;if(!dialog.open)dialog.showModal();lock()}
function closeDialog(dialog){dialog.close();lock();if(lastOpener?.isConnected)lastOpener.focus()}
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.closest('dialog'))));
$$('dialog').forEach(d=>{d.addEventListener('close',()=>{lock();if(d.id==='media-dialog'){
 const stage=$('.media-stage'),video=$('video',stage);
 if(video){video.pause();video.removeAttribute('src');video.load()}
 stage.replaceChildren();
}});d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d)}})});
const menu=$('#mobile-menu');const menuButton=$('.menu-toggle');
function reflectMenu(){
 const open=!!menu?.open;
 document.body.classList.toggle('menu-open',open);
 menuButton?.setAttribute('aria-expanded',String(open));
 menuButton?.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
 lock();
}
function setMenu(open){
 if(!menu||!menuButton)return;
 if(open&&!menu.open)menu.showModal();
 if(!open&&menu.open)menu.close();
 reflectMenu();
}
menuButton?.addEventListener('click',()=>setMenu(!menu.open));
$('[data-menu-close]')?.addEventListener('click',()=>setMenu(false));
menu?.addEventListener('close',reflectMenu);
menu?.addEventListener('click',event=>{if(event.target.closest('a,[data-book]'))setMenu(false)});
document.addEventListener('keydown',event=>{
 const mediaDialog=$('#media-dialog');
 if(mediaDialog?.open){
  if(event.key==='Escape'){event.preventDefault();closeDialog(mediaDialog);return}
  if(gallery.length&&event.key==='ArrowRight')showMedia(galleryIndex+1);
  if(gallery.length&&event.key==='ArrowLeft')showMedia(galleryIndex-1);
 }
});
const mq=matchMedia('(min-width:768px)');
mq.addEventListener('change',()=>{if(mq.matches)setMenu(false)});
function updateData(data){
 site=data;window.lesContent=data;
 for(const h of data.houses||[]){
  $$(`[data-weekend="${h.slug}"]`).forEach(el=>{el.textContent=h.priceWeekend?`${money(h.priceWeekend)} ₽ / сутки`:'По запросу'});
  $$(`[data-price="${h.slug}"]`).forEach(el=>{el.replaceChildren(document.createTextNode(h.priceWeekday?`от ${money(h.priceWeekday)} ₽`:'Стоимость по запросу'));if(h.priceWeekday){const s=document.createElement('span');s.textContent=' / сутки';el.append(s)}});
  const card=$(`.house-card a[href="/les-surgut-site/houses/${h.slug}/"]`)?.closest('.house-card');
  if(card){const style=$('.house-meta>span:first-child',card);if(style)style.textContent=h.style;const title=$('.house-title h3',card),desc=$('.house-description',card);if(title)title.textContent=h.name;if(desc)desc.textContent=h.description;const img=$('.house-photo img',card);if(img&&safePhoto(h.cover)){img.src=`/les-surgut-site/assets/${h.cover}.webp`;img.srcset='';img.alt=`${h.name}: ${h.style}`}}
  if(document.body.dataset.page===`houses/${h.slug}`){const style=$('.house-hero-heading .eyebrow');if(style)style.textContent=h.style.toUpperCase();const list=$('.detail-gallery');if(list&&Array.isArray(h.gallery)&&JSON.stringify(h.gallery)!==JSON.stringify($$('[data-media]',list).map(b=>b.dataset.media))){list.replaceChildren();h.gallery.filter(safePhoto).forEach(name=>{const b=document.createElement('button');b.className='gallery-item';b.dataset.media=name;b.dataset.caption=`Дом ${h.name}, фото комплекса`;b.setAttribute('aria-label',`Увеличить фото: дом ${h.name}`);const img=document.createElement('img');img.src=`/les-surgut-site/assets/${name}.webp`;img.alt=`Дом ${h.name}, фото комплекса`;img.loading='lazy';b.append(img);list.append(b)});}const title=$('.house-hero h1');if(title)title.textContent=h.name;const desc=$('.house-hero-copy>p:not(.detail-price)');if(desc)desc.textContent=h.description;const extra=$('.house-description-extra');if(extra){extra.textContent=h.descriptionExtra||'';extra.hidden=!h.descriptionExtra}const sections=$$('.house-signature');[h.signature,h.secondarySignature].forEach((block,index)=>{const section=sections[index];if(!section||!block)return;const heading=$('h2',section),copy=$('div>p',section);if(heading)heading.textContent=block.title||'';if(copy)copy.textContent=block.text||''});const groups=$$('.amenity-groups article');(h.amenityGroups||[]).forEach((group,index)=>{const section=groups[index];if(!section)return;const heading=$('h3',section),list=$('ul',section);if(heading)heading.textContent=group.title;if(list){const template=$('li',list)?.cloneNode(true);list.replaceChildren();for(const item of group.items){const li=template?.cloneNode(true)||document.createElement('li');const label=$('span',li)||li;label.textContent=item;list.append(li)}}});const img=$('.house-hero-photo img');if(img&&safePhoto(h.cover)){img.src=`/les-surgut-site/assets/${h.cover}.webp`;img.srcset='';$('.house-hero-photo').dataset.media=h.cover}}
 }
 const cExtra=data.contacts||{};const channelURL=safeURL(cExtra.channel,['t.me']);if(channelURL)$$('a[href="https://t.me/les_surgut"]').forEach(a=>a.href=channelURL);const insta=safeURL(cExtra.instagram,['www.instagram.com','instagram.com']);if(insta)$$('a[href^="https://www.instagram.com/"]').forEach(a=>a.href=insta);const mapLink=safeURL(cExtra.map,['2gis.ru','yandex.ru']);if(mapLink)$$('a[href^="https://2gis.ru/"]').forEach(a=>a.href=mapLink);const address=$('.address');if(address&&cExtra.address){const icon=$('svg',address);address.replaceChildren(...(icon?[icon]:[]),document.createTextNode(cExtra.address));}
 const intro=$('.hero-text>p');if(intro&&data.brand?.intro)intro.textContent=data.brand.intro;
 const introExtra=$('.hero-extra');if(introExtra&&typeof data.brand?.introExtra==='string')introExtra.textContent=data.brand.introExtra;
 const wt=$('.weekday-content h2'),wp=$('.weekday-content>p');if(wt&&data.weekday?.title)wt.textContent=data.weekday.title;if(wp&&data.weekday?.text)wp.textContent=data.weekday.text;
 const c=data.contacts||{};
 $$('a[href^="tel:"]').forEach(a=>{if(/^\+?\d{10,15}$/.test(c.phoneRaw||'')){a.href=`tel:${c.phoneRaw}`;if(a.matches('.header-phone'))$('span',a).textContent=c.phone;else if(!a.matches('.hero-call,.mobile-bottom a'))a.textContent=c.phone}});
 const links={max:safeURL(c.max,['max.ru']),telegram:safeURL(c.telegram,['t.me']),whatsapp:/^\d{10,15}$/.test(c.whatsapp||'')?`https://wa.me/${c.whatsapp}`:null};
 Object.entries(links).forEach(([name,url])=>{const prefix=name==='max'?'https://max.ru/':name==='telegram'?'https://t.me/+':'https://wa.me/';if(url)$$(`a[data-channel="${name}"],a[href^="${prefix}"]`).forEach(a=>a.href=url)});
 const houseSelect=$('#booking-house');if(houseSelect)for(const option of houseSelect.options){const h=data.houses?.find(h=>h.slug===option.value);if(h)option.textContent=h.name}
 initCalendars();window.dispatchEvent(new CustomEvent('les:content',{detail:data}));
 if(/^\d{5,12}$/.test(String(site.analytics?.yandexMetrikaId||''))&&!readLocal('les-consent'))$('.cookie-banner').hidden=false;
 initAnalytics();
}
fetch('/les-surgut-site/content.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('content');return r.json()}).then(data=>{
 if(new URLSearchParams(location.search).get('draft')==='1'){try{const draft=JSON.parse(readLocal('les-content-draft'));if(draft?.houses?.length===4){data=draft;const banner=document.createElement('div');banner.className='draft-banner';banner.textContent='Предпросмотр локального черновика. Посетители сайта этих изменений ещё не видят.';document.body.prepend(banner)}}catch{notify('Черновик не удалось открыть. Показан опубликованный контент.')}}
 updateData(data);
}).catch(()=>{notify('Не удалось обновить данные. Уточните стоимость и даты у менеджера.');window.dispatchEvent(new Event('les:content-error'))});
// Native dialogs retain focus and keyboard navigation. No personal form data is persisted.
const booking=$('#booking-dialog'),form=$('#booking-form');
const arrival=form?.elements.arrival,departure=form?.elements.departure,guests=form?.elements.guests,phone=form?.elements.phone,bookingType=form?.elements.bookingType;
const fieldError=(input,id,message='')=>{if(!input)return;input.setCustomValidity(message);input.setAttribute('aria-invalid',String(!!message));const output=$(id);if(output)output.textContent=message;return !message};
let turnstileWidgetId=null,bookingProtectionPromise=null;
const loadTurnstile=()=>new Promise((resolve,reject)=>{
 if(window.turnstile)return resolve(window.turnstile);
 const existing=document.querySelector('script[data-les-turnstile]');
 if(existing){existing.addEventListener('load',()=>resolve(window.turnstile),{once:true});existing.addEventListener('error',reject,{once:true});return}
 const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;script.dataset.lesTurnstile='';script.addEventListener('load',()=>resolve(window.turnstile),{once:true});script.addEventListener('error',reject,{once:true});document.head.append(script);
});
async function initBookingProtection(){
 if(turnstileWidgetId!==null)return true;
 if(!bookingProtectionPromise)bookingProtectionPromise=(async()=>{
  const response=await fetch('/les-surgut-site/api/booking',{headers:{Accept:'application/json'},cache:'no-store'});if(!response.ok)throw new Error('booking-config');
  const {turnstileSiteKey}=await response.json();if(!turnstileSiteKey)throw new Error('turnstile-config');
  const turnstile=await loadTurnstile(),container=$('#booking-turnstile');container.hidden=false;
  turnstileWidgetId=turnstile.render(container,{sitekey:turnstileSiteKey,action:'booking',theme:'light'});return true;
 })().catch(()=>{bookingProtectionPromise=null;$('#booking-security-note').textContent='Онлайн-отправка пока недоступна — подготовим сообщение для мессенджера.';return false});
 return bookingProtectionPromise;
}
function validateGuests(){
 const raw=guests?.value||'';
 const valid=/^\d+$/.test(raw)&&/[1-9]/.test(raw);
 return fieldError(guests,'#guests-error',valid?'':'Укажите количество гостей целым числом от 1.');
}
function normalizedPhoneDigits(value){const source=String(value||''),hasFixedPrefix=/^\s*\+7/.test(source);let digits=source.replace(/\D/g,'');if(hasFixedPrefix&&digits[0]==='7')digits=digits.slice(1);if(digits.length>10&&(digits[0]==='7'||digits[0]==='8'))digits=digits.slice(1);return digits}
function subscriberDigits(value){return normalizedPhoneDigits(value).slice(0,10)}
function formatPhone(value){const d=subscriberDigits(value);let result='+7';if(d.length)result+=` (${d.slice(0,3)}`;if(d.length>=3)result+=')';if(d.length>3)result+=` ${d.slice(3,6)}`;if(d.length>6)result+=`-${d.slice(6,8)}`;if(d.length>8)result+=`-${d.slice(8,10)}`;return result}
function validatePhone(){const complete=subscriberDigits(phone?.value).length===10&&phone?.dataset.overflow!=='true';return fieldError(phone,'#phone-error',complete?'':'Введите номер полностью: +7 (999) 999-99-99.')}
function setPhoneCaret(subscriberCount){if(!phone)return;let seen=-1,pos=phone.value.length;for(let index=0;index<phone.value.length;index++){if(/\d/.test(phone.value[index])){seen++;if(seen===subscriberCount){pos=index+1;break}}}phone.setSelectionRange(pos,pos)}
guests?.addEventListener('input',validateGuests);
$$('[data-guest-step]').forEach(button=>button.addEventListener('click',()=>{
 const raw=guests.value;
 const current=/^\d+$/.test(raw)&&/[1-9]/.test(raw)?BigInt(raw):1n;
 const next=current+BigInt(button.dataset.guestStep);
 guests.value=String(next<1n?1n:next);
 validateGuests();
 guests.focus();
}));
phone?.addEventListener('input',()=>{const raw=phone.value,before=raw.slice(0,phone.selectionStart??raw.length),count=subscriberDigits(before).length;phone.dataset.overflow=String(normalizedPhoneDigits(raw).length>10);phone.value=formatPhone(raw);setPhoneCaret(count);validatePhone()});
phone?.addEventListener('focus',()=>{if(!phone.value)phone.value='+7 '});
phone?.addEventListener('blur',()=>{if(phone.value==='+7 ')phone.value='';validatePhone()});
phone?.addEventListener('change',()=>{const raw=phone.value;phone.dataset.overflow=String(normalizedPhoneDigits(raw).length>10);phone.value=formatPhone(raw);validatePhone()});
if(arrival){arrival.min=today();departure.min=today();arrival.addEventListener('change',()=>{const day=parseDate(arrival.value||today());day.setDate(day.getDate()+1);departure.min=localDate(day);if(departure.value&&departure.value<=arrival.value)departure.value='';});}
let bookingReason='Отдых',bookingStep=0,datesFromCalendar=false;
function updateBookingContext(){
 if(!form)return;
 const h=site?.houses?.find(h=>h.slug===form.elements.house.value);
 const all=form.elements.house.value==='all';
 const orangery=form.elements.house.value==='orangery';
 $('.booking-format').hidden=orangery;
 $('[data-booking-date-start]').textContent=orangery?'Начало':'Заезд';
 $('[data-booking-date-end]').textContent=orangery?'Окончание':'Выезд';
 const title=$('#booking-aside-title'),caption=$('#booking-aside-caption'),image=$('#booking-aside-photo');
 title.textContent=orangery?'Оранжерея.':h?`Дом «${h.name}».`:all?'Весь «Лес» для вас.':'Ближе к природе. Ближе к своим.';
 caption.textContent=orangery?'Планируем открытие в мае 2027. Обсудим ваш повод и поделимся новостями пространства.':h?h.style:all?'Для большой встречи и отдыха с близкими. Обсудим пространство и размещение.':'Четыре дома среди сосен. Поможем найти тот, в котором вам будет хорошо.';
 const source=orangery?'/les-surgut-site/assets/orangery-reference.webp':h&&safePhoto(h.cover)?`/les-surgut-site/assets/${h.cover}.webp`:'/les-surgut-site/assets/tg-303972.webp';
 if(image.getAttribute('src')!==source)image.src=source;
 const thumb=$('#booking-house-thumb');
 const thumbSource=orangery?'/les-surgut-site/assets/orangery-reference-small.webp':h&&safePhoto(h.cover)?`/les-surgut-site/assets/${h.cover}-small.webp`:'/les-surgut-site/assets/tg-303972-small.webp';
 if(thumb.getAttribute('src')!==thumbSource)thumb.src=thumbSource;
 image.alt=orangery?'Будущая Оранжерея — визуализация':h?`${h.name}: ${h.style}`:'Река и сосны в загородном комплексе «Лес»';
 $('#booking-summary-house').textContent=orangery?'Оранжерея · скоро':h?`Дом «${h.name}»`:all?'Весь комплекс':'Поможем выбрать дом';
 $('#booking-summary-dates').textContent=arrival.value&&departure.value?`${formatDate(arrival.value)} — ${formatDate(departure.value)}`:'Даты уточним';
 const ending=Number(guests.value.slice(-2));
 const word=ending>=11&&ending<=14?'гостей':ending%10===1?'гость':ending%10>=2&&ending%10<=4?'гостя':'гостей';
 $('#booking-summary-guests').textContent=`${guests.value} ${word}`;
}
function setBookingTitle(wide,mobile=wide){
 $('[data-booking-title-wide]').textContent=wide;
 $('[data-booking-title-mobile]').textContent=mobile;
}
function setBookingStep(index,focus=true){
 bookingStep=index;
 booking.classList.remove('is-message-ready');
 $$('[data-booking-step]',form).forEach(step=>step.hidden=Number(step.dataset.bookingStep)!==index);
 $$('[data-booking-step-label]').forEach((label,i)=>{
  label.classList.toggle('is-current',i===index);
  label.classList.toggle('is-complete',i<index);
  if(i===index)label.setAttribute('aria-current','step');else label.removeAttribute('aria-current');
 });
 const callback=bookingReason==='Обратный звонок',video=/видеообзор/i.test(bookingReason);
 setBookingTitle(index===1?'Как с вами связаться?':callback?'Давайте созвонимся.':video?'Заглянем поближе.':form.elements.house.value==='orangery'?'Ваше событие в Оранжерее.':bookingType.value==='event'?'Ваше событие в «Лесу».':'Спланируем ваш отдых.',index===1?'Контакты':callback?'Заказать звонок':video?'Запросить обзор':bookingType.value==='event'?'Ваше событие':'Ваш отдых');
 $('#booking-description').textContent=index===1?'Выберите мессенджер. Мы поможем с датами, домом и деталями.':'Выберите дом и даты. О деталях позаботимся вместе.';
 $('#form-error').textContent='';
 updateBookingContext();
 $('[data-booking-scroll]').scrollTop=0;
 booking.scrollTop=0;
 if(focus)$(`[data-booking-step="${index}"] input,[data-booking-step="${index}"] select`,form)?.focus();
}
function refreshBookingDates(){
 const orangery=form.elements.house.value==='orangery';
 const optional=!datesFromCalendar&&(orangery||bookingReason==='Обратный звонок'||/видеообзор/i.test(bookingReason)||bookingType.value==='event'||bookingReason==='Оранжерея');
 arrival.required=departure.required=!optional;
 $('#booking-dates-note').textContent=orangery?'Планируем открытие в мае 2027. Желаемую дату можно обсудить позже.':optional?'Даты можно выбрать позже. Обсудим удобное время в переписке.':'Менеджер подтвердит свободные даты.';
 const earliestDeparture=parseDate(arrival.value||today());
 if(arrival.value||!optional)earliestDeparture.setDate(earliestDeparture.getDate()+1);
 departure.min=localDate(earliestDeparture);
}
function verifyStayDetails(){
 validateGuests();
 const invalid=$('[data-booking-step="0"] :invalid',form);
 if(invalid){setBookingStep(0,false);invalid.reportValidity();return false}
 const fail=message=>{setBookingStep(0,false);$('#form-error').textContent=message;arrival.focus();return false};
 if((arrival.value&&!departure.value)||(!arrival.value&&departure.value))return fail('Выберите обе даты: заезд и выезд.');
 if(arrival.value&&(arrival.value<today()||departure.value<=arrival.value))return fail('Проверьте даты: выезд должен быть позже заезда, а заезд не в прошлом.');
 const h=site?.houses.find(h=>h.slug===form.elements.house.value);
 if(h&&arrival.value&&busyInside(h,arrival.value,departure.value))return fail('В этот период есть занятые даты. Выберите другие или попросите менеджера подобрать вариант.');
 return true;
}
$('[data-booking-next]')?.addEventListener('click',()=>{if(verifyStayDetails())setBookingStep(1)});
$('[data-booking-back]')?.addEventListener('click',()=>setBookingStep(0));
form?.addEventListener('input',updateBookingContext);
form?.addEventListener('change',event=>{
 if(event.target.name==='house'&&form.elements.house.value==='orangery')bookingType.value='event';
 if(event.target.name==='bookingType'||event.target.name==='house')refreshBookingDates();
 updateBookingContext();
});
window.addEventListener('les:content',updateBookingContext);
function openBooking(button,calendarDates=false){
 if(!form)return;
 $('#message-ready').hidden=true;
 form.hidden=false;
 form.elements.house.value=button.dataset.house||'';
 bookingReason=button.dataset.reason||'Отдых';
 datesFromCalendar=calendarDates;
 bookingType.value=form.elements.house.value==='orangery'||/мероприят|празд|свад|корпоратив|беседк|день рождения|дни рождения|вечеринк|выпускн/i.test(bookingReason)?'event':'stay';
 form.elements.comment.value=bookingReason==='Отдых'?'':bookingReason==='Обратный звонок'?'Пожалуйста, перезвоните мне.':/видеообзор/i.test(bookingReason)?'Пришлите, пожалуйста, видеообзор.':bookingReason;
 form.elements.startedAt.value=String(Date.now());form.elements.company.value='';
 arrival.value=calendarDates?selected.arrival:'';
 departure.value=calendarDates?selected.departure:'';
 refreshBookingDates();
 $('.booking-wishes-disclosure').open=mq.matches||!!form.elements.comment.value;
 setBookingStep(0,false);
 openDialog(booking,button.closest('#mobile-menu')?menuButton:button);
 track('booking_opened',{reason:bookingReason,house:form.elements.house.value||'not_selected'});
 if(/видеообзор/i.test(bookingReason))track('video_requested',{house:form.elements.house.value||'not_selected'});
 if(/свад/i.test(bookingReason))track('wedding_requested',{house:form.elements.house.value||'les'});
 initBookingProtection();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-book]');if(b)openBooking(b)});
function busyInside(h,start,end){if(!h?.busy)return false;return h.busy.some(day=>day>=start&&day<end)}
form?.addEventListener('submit',async e=>{
 e.preventDefault();
 $('#form-error').textContent='';
 if(!verifyStayDetails())return;
 if(bookingStep===0){setBookingStep(1);return}
 if(!validatePhone()){phone.reportValidity();return}
 if(!form.reportValidity())return;
 const values=Object.fromEntries(new FormData(form));
 const h=site?.houses.find(h=>h.slug===values.house);
 const fail=message=>{$('#form-error').textContent=message;return false};
	 const normalizedPhone=formatPhone(values.phone);if(subscriberDigits(normalizedPhone).length!==10)return fail('Введите номер полностью: +7 (999) 999-99-99.');
	 if(!site?.contacts)return fail('Не удалось загрузить контакты. Позвоните по номеру внизу страницы.');
 const orangery=values.house==='orangery';
 const house=orangery?'Оранжерея (планируемое открытие — май 2027)':values.house==='all'?'Весь комплекс':h?.name||'Помогите выбрать дом';
	 const isCallback=bookingReason==='Обратный звонок',isVideo=/видеообзор/i.test(bookingReason);
 const greeting=orangery?'Здравствуйте! Хочу обсудить событие в будущей Оранжерее комплекса «Лес».':isCallback?'Здравствуйте! Прошу перезвонить мне.':isVideo?'Здравствуйте! Хочу получить видеообзор комплекса «Лес».':'Здравствуйте! Хочу спланировать отдых в комплексе «Лес».';
 const closing=orangery?'Расскажите о сроках открытия и возможностях проведения события.':isCallback||isVideo?'':'Подскажите свободные даты, стоимость и условия.';
 const message=[greeting,`Формат: ${values.bookingType==='event'?'Большая компания / мероприятие':'Отдых в доме'}.`,`${orangery?'Площадка':'Дом'}: ${house}.`,values.arrival?`Даты: ${formatDate(values.arrival)} - ${formatDate(values.departure)}.`:'Даты пока не определены.',`Гостей: ${values.guests}.`,`Имя: ${values.name.trim()}.`,`Телефон: ${normalizedPhone}.`,values.comment.trim()?`Пожелания: ${values.comment.trim()}`:'',closing].filter(Boolean).join('\n');
 const channel=values.channel;let url=site.contacts.max;
 if(channel==='whatsapp')url=`https://wa.me/${site.contacts.whatsapp}?text=${encodeURIComponent(message)}`;
 if(channel==='telegram')url=site.contacts.telegram;
 const valid=safeURL(url,channel==='max'?['max.ru']:channel==='telegram'?['t.me']:['wa.me']);if(!valid)return fail('Ссылка на мессенджер не настроена. Позвоните нам.');
 const submit=form.querySelector('[type="submit"]');submit.disabled=true;$('#form-error').textContent='Отправляем заявку…';
 let submitted=false;
 try{
  const protectedForm=await initBookingProtection();
  const turnstileToken=protectedForm&&window.turnstile&&turnstileWidgetId!==null?window.turnstile.getResponse(turnstileWidgetId):'';
  if(!turnstileToken)throw new Error('turnstile');
  const response=await fetch('/les-surgut-site/api/booking',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({...values,phone:normalizedPhone,reason:bookingReason,page:location.href,turnstileToken})});
  const result=await response.json().catch(()=>({}));if(!response.ok||!result.ok)throw new Error(result.error||'delivery');submitted=true;
 }catch{submitted=false}finally{submit.disabled=false}
 $('#message-preview').value=message;$('#open-messenger').href=valid;$('#open-messenger').dataset.channel=channel;$('#open-messenger').textContent=`${submitted?'Написать дополнительно в':'Открыть'} ${channel==='max'?'MAX':channel==='whatsapp'?'WhatsApp':'Telegram'}`;
 $('#message-ready h3').textContent=submitted?'Заявка отправлена.':'Осталось отправить.';
 $('#message-ready .message-instruction').textContent=submitted?'Менеджер свяжется с вами по указанному номеру. При желании можно продублировать сообщение в мессенджер.':channel==='whatsapp'?'Сообщение откроется в чате WhatsApp.':'Скопируйте текст, затем откройте чат и отправьте его менеджеру.';
 $('#copy-status').textContent=submitted?'Данные заявки переданы менеджеру комплекса.':channel==='whatsapp'?'Нажмите «Отправить» в открывшемся чате.':'Онлайн-отправка недоступна. Отправьте подготовленный текст менеджеру в чате.';
 form.hidden=true;$('#message-ready').hidden=false;
 booking.classList.add('is-message-ready');
 setBookingTitle(submitted?'Спасибо!':'Сообщение готово.',submitted?'Отправлено':'Запрос готов');
 $('#booking-description').textContent=submitted?'Мы получили вашу заявку.':'Отправьте запрос менеджеру в выбранном мессенджере.';
 $('[data-booking-scroll]').scrollTop=0;
 booking.scrollTop=0;
 $('#copy-message').focus();track(submitted?'booking_submitted':'message_prepared',{channel,house:values.house});
});
$('#copy-message')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#message-preview').value);$('#copy-status').textContent='Текст скопирован. Откройте чат и отправьте сообщение.';}catch{$('#message-preview').focus();$('#message-preview').select();$('#copy-status').textContent='Выделенный текст можно скопировать вручную.';}});
$('#edit-message')?.addEventListener('click',()=>{form.hidden=false;$('#message-ready').hidden=true;setBookingStep(1)});
document.addEventListener('click',e=>{
 const channelLink=e.target.closest('#open-messenger, a[data-channel], #mobile-menu .messenger-links a');
 if(channelLink)track('messenger_opened',{channel:channelLink.dataset.channel||new URL(channelLink.href).hostname});
 const phoneLink=e.target.closest('a[href^="tel:"]');
 if(phoneLink)track('phone_clicked',{page:document.body.dataset.page||'unknown'});
});
function galleryFromPage(opener){return $$('[data-media]',opener.closest('[data-gallery-group]')||document).filter(b=>!b.hidden&&!b.closest('[hidden]')).map(b=>({name:b.dataset.media,caption:b.dataset.caption||''}))}
function showMedia(index){
 if(!gallery.length)return;galleryIndex=(index+gallery.length)%gallery.length;const item=gallery[galleryIndex];const stage=$('.media-stage');stage.replaceChildren();const img=document.createElement('img');img.src=`/les-surgut-site/assets/${item.name}.webp`;img.alt=item.caption;img.addEventListener('error',()=>{$('.media-caption').textContent='Фотография недоступна. Попробуйте другую.'});stage.append(img);$('.media-caption').textContent=item.caption;$('.media-prev').hidden=gallery.length<2;$('.media-next').hidden=gallery.length<2;
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-media]');if(b){gallery=galleryFromPage(b);galleryIndex=Math.max(0,gallery.findIndex(x=>x.name===b.dataset.media));showMedia(galleryIndex);openDialog($('#media-dialog'),b)}
 const v=e.target.closest('[data-video]');if(v){gallery=[];const stage=$('.media-stage');stage.replaceChildren();const video=document.createElement('video');video.src=v.dataset.videoSrc||'/les-surgut-site/assets/les-tour.mp4';if(v.dataset.videoPoster)video.poster=v.dataset.videoPoster;video.controls=true;video.playsInline=true;video.autoplay=true;video.preload='metadata';video.setAttribute('aria-label',v.dataset.videoCaption||'Видеообзор комплекса «Лес»');video.addEventListener('error',()=>{video.remove();const message=document.createElement('p');message.className='video-error';message.textContent='Видео временно недоступно. Запросите обзор у менеджера.';stage.append(message)},{once:true});stage.append(video);$('.media-prev').hidden=true;$('.media-next').hidden=true;$('.media-caption').textContent=v.dataset.videoCaption||'Знакомство с загородным комплексом «Лес»';openDialog($('#media-dialog'),v);video.play().catch(()=>{});track('video_opened',{house:v.dataset.videoHouse||'complex'})}
});
$('.media-prev')?.addEventListener('click',()=>showMedia(galleryIndex-1));$('.media-next')?.addEventListener('click',()=>showMedia(galleryIndex+1));
let touchX=0;$('.media-stage')?.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].screenX},{passive:true});$('.media-stage')?.addEventListener('touchend',e=>{const dx=e.changedTouches[0].screenX-touchX;if(gallery.length&&Math.abs(dx)>55)showMedia(galleryIndex+(dx<0?1:-1))},{passive:true});
$$('[data-photo-carousel]').forEach(rail=>{
 const shell=rail.closest('.editorial-gallery-shell');
 const previous=$('[data-carousel-prev]',shell),next=$('[data-carousel-next]',shell);
 const step=()=>Math.max(rail.clientWidth*.72,240);
 const update=()=>{
  const max=Math.max(0,rail.scrollWidth-rail.clientWidth-2);
  previous.disabled=rail.scrollLeft<=2;
  next.disabled=rail.scrollLeft>=max;
 };
 previous.addEventListener('click',()=>rail.scrollBy({left:-step(),behavior:'smooth'}));
 next.addEventListener('click',()=>rail.scrollBy({left:step(),behavior:'smooth'}));
 rail.addEventListener('scroll',update,{passive:true});
 rail.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
   e.preventDefault();
   rail.scrollBy({left:(e.key==='ArrowLeft'?-1:1)*step(),behavior:'smooth'});
  }
 });
 new ResizeObserver(update).observe(rail);
 update();
});
const galleryFilters=$$('[data-gallery-filter]');
galleryFilters.forEach(button=>button.addEventListener('click',()=>{
 const category=button.dataset.galleryFilter;
 const categories=category.split(',');
 galleryFilters.forEach(filter=>{
  filter.classList.toggle('active',filter===button);
  filter.setAttribute('aria-pressed',String(filter===button));
 });
 let count=0;
 $$('.masonry [data-category]').forEach(item=>{
  item.hidden=category!=='all'&&!categories.includes(item.dataset.category);
  if(!item.hidden)count++;
 });
 $('.gallery-count').textContent=`Фото: ${count}`;
 $('#gallery-empty').hidden=count>0;
}));
$$('[data-house-filter]').forEach(button=>button.addEventListener('click',()=>{const mode=button.dataset.houseFilter;$$('[data-house-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});$$('.catalog .house-card').forEach(card=>{const slug=$('a',card).href.split('/les-surgut-site/').filter(Boolean).pop();card.hidden=(mode==='party'&&slug==='shalash')||(mode==='couple'&&['tuman','luna'].includes(slug));})}));
$$('.faq summary').forEach(summary=>summary.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();summary.parentElement.open=!summary.parentElement.open}}));
let calendarsInitialized=false;
function initCalendars(){
 if(calendarsInitialized||!site)return;calendarsInitialized=true;
 $$('[data-calendar]').forEach(container=>{
  const initial=new Date();initial.setDate(1);let month=new Date(initial);const h=site.houses.find(x=>x.slug===container.dataset.house);const section=container.closest('.calendar-section');
  const status=$('.calendar-status',section);if(site.availabilityUpdatedAt)status.textContent=`Занятость обновлена ${new Date(site.availabilityUpdatedAt).toLocaleDateString('ru-RU')}. Бронирование подтверждает менеджер.`;
  const selectedText=$('.selected-dates',section),request=$('[data-calendar-book]',section);
  function draw(){
   $('.calendar-month',container).textContent=month.toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
   $('[data-month="-1"]',container).disabled=month<=initial;
   const maxMonth=new Date(initial);maxMonth.setMonth(maxMonth.getMonth()+24);$('[data-month="1"]',container).disabled=month>=maxMonth;
   const days=$('.calendar-days',container);days.replaceChildren();const offset=(month.getDay()+6)%7;
   for(let j=0;j<offset;j++){const span=document.createElement('span');span.setAttribute('aria-hidden','true');days.append(span)}
   const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
   for(let day=1;day<=count;day++){
    const d=new Date(month.getFullYear(),month.getMonth(),day),key=localDate(d),button=document.createElement('button');button.type='button';button.className='calendar-day';button.textContent=day;button.dataset.date=key;const busy=h?.busy?.includes(key),free=h?.free?.includes(key);button.disabled=key<today()||!!busy;button.classList.toggle('is-busy',!!busy);button.classList.toggle('is-free',!!free&&!busy);button.classList.toggle('is-selected',key===selected.arrival||key===selected.departure);button.classList.toggle('in-range',!!selected.arrival&&!!selected.departure&&key>selected.arrival&&key<selected.departure);button.setAttribute('aria-label',`${formatDate(key)}: ${busy?'занято':free?'свободно':'уточнить занятость'}`);button.setAttribute('aria-pressed',String(key===selected.arrival||key===selected.departure));
    button.addEventListener('click',()=>{if(!selected.arrival||selected.departure||key<=selected.arrival){selected={arrival:key,departure:'',house:h?.slug||''}}else{if(busyInside(h,selected.arrival,key)){notify('В выбранном периоде есть занятые даты. Выберите другой заезд.');return}selected.departure=key;}draw();});days.append(button);
   }
   selectedText.textContent=selected.arrival?selected.departure?`${formatDate(selected.arrival)} - ${formatDate(selected.departure)}`:`Заезд: ${formatDate(selected.arrival)}. Теперь выберите выезд.`:'Выберите дату заезда';request.disabled=!selected.arrival||!selected.departure;
  }
  $$('[data-month]',container).forEach(b=>b.addEventListener('click',()=>{month.setMonth(month.getMonth()+Number(b.dataset.month));draw()}));
  $('[data-reset-dates]',section)?.addEventListener('click',()=>{selected={arrival:'',departure:'',house:h?.slug||''};draw()});request.addEventListener('click',()=>openBooking(request,true));draw();
 });
}
let consent={essential:true,map:false,analytics:false};try{const saved=JSON.parse(readLocal('les-consent'));if(saved&&typeof saved.map==='boolean')consent=saved}catch{}
$$('[data-consent]').forEach(b=>b.addEventListener('click',()=>{const all=b.dataset.consent==='all';consent={essential:true,map:all,analytics:all};writeLocal('les-consent',JSON.stringify(consent));$('.cookie-banner').hidden=true;if(all)loadAllMaps();else $$('iframe[data-map-frame]').forEach(frame=>{const parent=frame.parentElement;frame.remove();if(parent._mapPlaceholder)parent.append(parent._mapPlaceholder)});initAnalytics()}));
$$('[data-cookie-settings]').forEach(b=>b.addEventListener('click',()=>{$('.cookie-banner').hidden=false}));
function loadMap(container){if($('iframe',container)||!site)return;const valid=safeURL(site.contacts.mapEmbed,['yandex.ru']);if(!valid)return;container._mapPlaceholder=$('.map-placeholder',container);const frame=document.createElement('iframe');frame.src=valid;frame.title='Расположение комплекса Лес на Яндекс Карте';frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';frame.dataset.mapFrame='';container.replaceChildren(frame)}
function loadAllMaps(){$$('.map-container').forEach(loadMap)}
$$('[data-load-map]').forEach(b=>b.addEventListener('click',()=>{consent.map=true;writeLocal('les-consent',JSON.stringify(consent));loadMap(b.closest('.map-container'))}));
window.addEventListener('les:content',()=>{if(consent.map)loadAllMaps()});
let metricLoaded=false;function initAnalytics(){const id=site?.analytics?.yandexMetrikaId;if(!consent.analytics||!/^\d{5,12}$/.test(String(id||''))||metricLoaded)return;metricLoaded=true;window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};window.ym.l=Date.now();const script=document.createElement('script');script.src='https://mc.yandex.ru/metrika/tag.js';script.async=true;document.head.append(script);window.ym(Number(id),'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});}
function track(event,params={}){const id=site?.analytics?.yandexMetrikaId;if(consent.analytics&&id&&window.ym)window.ym(Number(id),'reachGoal',event,params)}
const reduce=matchMedia('(prefers-reduced-motion: reduce)');if(!reduce.matches&&'IntersectionObserver' in window){document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}},{threshold:.06,rootMargin:'0px 0px 25px 0px'});$$('.reveal').forEach(el=>observer.observe(el));}
})();

/* Short ambient films play only while their card or hero is on screen. */
(()=>{
 'use strict';
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width:767px)');
 const connection=navigator.connection;
 document.querySelectorAll('[data-hero],[data-card-preview]').forEach(container=>{
  const video=container.querySelector('[data-hero-film],[data-card-film]');
  const button=container.querySelector('[data-hero-pause],[data-card-pause]');
  const name=container.closest('.house-card')?.querySelector('h3')?.textContent;
  let inView=!('IntersectionObserver' in window),userPaused=false,manualPlay=false,failed=false,playRequest=0;
  function updateButton(){
   const paused=video.paused;
   button.setAttribute('aria-label',`${paused?'Включить':'Приостановить'} видео${name?` дома «${name}»`:'фон'}`);
   button.setAttribute('aria-pressed',String(paused));
   button.querySelector('use').setAttribute('href',`/les-surgut-site/assets/icons.svg#${paused?'player-play':'player-pause'}`);
  }
  function refresh(){
   const token=++playRequest;
   const allowed=manualPlay||(!motion.matches&&!connection?.saveData);
   if(failed||!allowed||userPaused||!inView||document.hidden||document.querySelector('dialog[open]')){
    video.pause();updateButton();return;
   }
   const source=mobile.matches?video.dataset.mobileSrc:video.dataset.wideSrc;
   if(video.getAttribute('src')!==source){container.classList.remove('is-film-playing');video.src=source}
   video.muted=true;
   video.play().then(()=>{if(token===playRequest){container.classList.add('is-film-playing');updateButton()}}).catch(updateButton);
  }
  button.addEventListener('click',()=>{
   if(video.paused){manualPlay=true;userPaused=false;if(failed){video.removeAttribute('src');failed=false}}else userPaused=true;
   refresh();
  });
  video.addEventListener('error',()=>{failed=true;container.classList.remove('is-film-playing');updateButton()});
  video.addEventListener('playing',updateButton);
  video.addEventListener('pause',updateButton);
  document.addEventListener('visibilitychange',refresh);
  motion.addEventListener('change',refresh);
  mobile.addEventListener('change',refresh);
  connection?.addEventListener('change',refresh);
  const dialogs=new MutationObserver(refresh);
  const observeDialogs=()=>document.querySelectorAll('dialog').forEach(dialog=>dialogs.observe(dialog,{attributes:true,attributeFilter:['open']}));
  observeDialogs();
  let observer;
  if('IntersectionObserver' in window){
   observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;refresh()},{threshold:.1});
   observer.observe(container);
  }
  window.addEventListener('pagehide',()=>{video.pause();observer?.disconnect();dialogs.disconnect()});
  window.addEventListener('pageshow',event=>{if(event.persisted){observer?.observe(container);observeDialogs();refresh()}});
  refresh();
 });
})();
