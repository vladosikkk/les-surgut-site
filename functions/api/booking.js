const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const text=(value,max)=>String(value??'').trim().slice(0,max);
const allowedValues=(value,allowed,fallback='')=>allowed.includes(value)?value:fallback;
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export function onRequestGet({env}){
 return json({turnstileSiteKey:text(env.TURNSTILE_SITE_KEY,200)||null});
}

async function verifyTurnstile({request,env,token}){
 if(!env.TURNSTILE_SECRET_KEY||!token)return false;
 const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get('CF-Connecting-IP')||''})
 });
 if(!response.ok)return false;
 const result=await response.json();
 const requestHost=new URL(request.url).hostname;
 const expectedHosts=new Set(String(env.TURNSTILE_HOSTNAMES||requestHost).split(',').map(value=>value.trim()).filter(Boolean));
 return result.success===true&&result.action==='booking'&&expectedHosts.has(result.hostname);
}

export async function onRequestPost({request,env}){
 const requestHost=new URL(request.url).hostname;
 const origin=request.headers.get('Origin');
 if(origin){try{if(new URL(origin).hostname!==requestHost)return json({ok:false,error:'forbidden'},403)}catch{return json({ok:false,error:'forbidden'},403)}}
 if(!request.headers.get('Content-Type')?.toLowerCase().includes('application/json'))return json({ok:false,error:'unsupported_media_type'},415);
 let body;
 try{body=await request.json()}catch{return json({ok:false,error:'invalid_json'},400)}
 if(text(body.company,200))return json({ok:true});
 const startedAt=Number(body.startedAt),elapsed=Date.now()-startedAt;
 if(!Number.isFinite(startedAt)||elapsed<2500||elapsed>2*60*60*1000)return json({ok:false,error:'spam_check_failed'},400);
 let verified=false;
 try{verified=await verifyTurnstile({request,env,token:text(body.turnstileToken,2048)})}catch{}
 if(!verified)return json({ok:false,error:'turnstile_failed'},403);
 if(!env.TELEGRAM_BOT_TOKEN||!env.TELEGRAM_CHAT_ID)return json({ok:false,error:'delivery_not_configured'},503);

 const name=text(body.name,60),phone=text(body.phone,18),comment=text(body.comment,600);
 const house=allowedValues(text(body.house,30),['','shalash','les','tuman','luna','all','orangery']);
 const bookingType=allowedValues(text(body.bookingType,20),['stay','event']);
 const channel=allowedValues(text(body.channel,20),['max','whatsapp','telegram']);
 const guests=text(body.guests,12),arrival=text(body.arrival,10),departure=text(body.departure,10),reason=text(body.reason,120);
 if(!name||!/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(phone)||!/^\d{1,12}$/.test(guests)||!bookingType||!channel)return json({ok:false,error:'invalid_fields'},400);
 if((arrival||departure)&&(!validDate(arrival)||!validDate(departure)||departure<=arrival))return json({ok:false,error:'invalid_dates'},400);
 const houseNames={shalash:'Дом «Шалаш»',les:'Дом «Лес»',tuman:'Дом «Туман»',luna:'Дом «Луна»',all:'Весь комплекс',orangery:'Оранжерея','':'Помочь выбрать'};
 const lines=['Новая заявка с сайта LES SURGUT',`Имя: ${name}`,`Телефон: ${phone}`,`Формат: ${bookingType==='event'?'Мероприятие':'Отдых в доме'}`,`Дом: ${houseNames[house]}`,`Даты: ${arrival&&departure?`${arrival} — ${departure}`:'не определены'}`,`Гостей: ${guests}`,`Связаться: ${channel}`,reason?`Повод: ${reason}`:'',comment?`Пожелания: ${comment}`:'',`Страница: ${text(body.page,300)}`].filter(Boolean);
 const delivery=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:lines.join('\n'),disable_web_page_preview:true})});
 if(!delivery.ok)return json({ok:false,error:'delivery_failed'},502);
 return json({ok:true});
}
