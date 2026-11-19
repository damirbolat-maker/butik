/* Мой бутик — учёт товаров, продаж, клиентов и денег */
'use strict';
/* ---------- constants ---------- */
const CATS=['Платья','Верх','Низ','Верхняя одежда','Обувь','Сумки','Аксессуары','Украшения','Другое'];
const CUR=['CNY','TRY','USD','RUB','EUR','AED','KZT'];
const CUR_NAME={CNY:'юань',TRY:'лира',USD:'доллар',RUB:'рубль',EUR:'евро',AED:'дирхам',KZT:'тенге'};
const STAT=['Бронь','Новый','Оплачен','Отправлен','Доставлен','Возврат'];
const STAT_COL={'Бронь':['#f5e7ee','#7d3355'],'Новый':['#eeeae6','#5a514b'],'Оплачен':['#fdf2dc','#8a5a00'],'Отправлен':['#e4eefb','#2b5a9a'],'Доставлен':['#e5f3ea','#2d7a4b'],'Возврат':['#fbe9e6','#b83a2e']};
const CH=['Instagram','WhatsApp','Kaspi','Знакомые','Другое'];
const PAY=['Kaspi перевод','Kaspi QR','Kaspi Red','Рассрочка Kaspi','Наличные','Карта другого банка','Своя рассрочка'];
const EXP_CATS=['Реклама / таргет','Блогеры','Упаковка','Курьер / доставка','Фотосъёмка','Аренда / склад','Другое'];
const SHIP_ST=['Заказано','В пути','На складе'];
const SHIP_FROM=['Китай','Турция','Россия','ОАЭ','Другое'];
const DEF_RATES={CNY:66.53,TRY:8.86,USD:443.62,RUB:5.36,EUR:492.24,AED:120.8,KZT:1};
const DEF_FEES=Object.fromEntries(PAY.map(p=>[p,0]));
const QUICK_SIZES=['XS','S','M','L','XL','XXL','36','37','38','39','40','41','One size'];
const DEF_TPL={
  order:{t:'Подтверждение заказа',x:'Здравствуйте, {имя}! 🤍 Ваш заказ: {товар}, размер {размер}, {кол-во} шт. Сумма: {сумма}. Спасибо, что выбрали {магазин}!'},
  reserve:{t:'Бронь',x:'{имя}, отложила для вас {товар}, размер {размер} 🤍 Держу бронь до {срок}. Для подтверждения нужна предоплата.'},
  shipped:{t:'Заказ отправлен',x:'{имя}, ваш заказ отправлен 📦 {комментарий}\nЕсли будут вопросы — пишите!'},
  remind:{t:'Напоминание об оплате',x:'{имя}, добрый день! Напоминаю про оплату {платёж} до {дата}. Остаток по заказу: {долг}. Спасибо 🙏'},
  thanks:{t:'Спасибо + отзыв',x:'{имя}, спасибо за покупку! Как вам {товар}? Будем очень рады отзыву и фото 🤍'},
  newin:{t:'Новинки',x:'{имя}, привет! Пришла новая коллекция, есть ваш размер 😍 Смотрите: {витрина}'}
};
const ICON_SHIRT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3l-5 4 2.5 3L7 9v12h10V9l1.5 1L21 7l-5-4c-.5 1.7-2 3-4 3S8.5 4.7 8 3z"/></svg>';

const S={items:[],sales:[],clients:[],expenses:[],shipments:[],settings:{},
  tab:'items',money:'debts',q:'',cat:'Все',stat:'Все',period:'month',sort:'new',
  calc:{cur:'CNY',price:'',qty:'',rate:'',delivery:'',extra:'',markup:100,sell:''}};
const COLS=['items','sales','clients','expenses','shipments'];
let sb=null,F=null;

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const n=v=>{const x=parseFloat(String(v??'').replace(/\s/g,'').replace(',','.'));return isFinite(x)?x:0};
const money=v=>(Math.round(v)||0).toLocaleString('ru-RU')+' ₸';
const pct=v=>isFinite(v)&&!isNaN(v)?Math.round(v*100)+'%':'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=x=>String(x).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>ymd(new Date());
const addDays=(s,k)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+k);return ymd(d)};
const addMonths=(s,k)=>{const d=new Date(s+'T12:00:00');const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+k);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return ymd(d)};
const fdate=s=>s?String(s).slice(0,10).split('-').reverse().join('.'):'';
const digits=p=>String(p||'').replace(/\D/g,'');
const waNum=p=>{let d=digits(p);if(d.length===11&&d[0]==='8')d='7'+d.slice(1);if(d.length===10)d='7'+d;return d};
const fmtPhone=p=>{const d=waNum(p);if(d.length===11&&d[0]==='7')return `+7 ${d.slice(1,4)} ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9)}`;return p||''};
const like=(q,s)=>!q||String(s).toLowerCase().includes(q.toLowerCase());
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function plural(k,a,b,c){k=Math.abs(k);const m=k%10,h=k%100;if(m===1&&h!==11)return a;if(m>=2&&m<=4&&(h<12||h>14))return b;return c}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),2600)}
function setSync(t){$('#sync').textContent=t||''}
const rates=()=>({...DEF_RATES,...(S.settings.rates||{})});
const fees=()=>({...DEF_FEES,...(S.settings.payFees||{})});
const tpls=()=>{const o={};for(const k in DEF_TPL)o[k]={t:DEF_TPL[k].t,x:(S.settings.templates||{})[k]||DEF_TPL[k].x};return o};
const shopName=()=>S.settings.shopName||'Мой бутик';
const showcaseUrl=()=>location.origin+location.pathname.replace(/[^/]*$/,'')+'catalog.html';

/* ---------- calculations ---------- */
const itemById=id=>S.items.find(i=>i.id===id);
const shipById=id=>S.shipments.find(s=>s.id===id);
const itemLabel=it=>[it.name,it.brand,it.color].filter(Boolean).join(' · ');
const qtyOf=it=>(it.sizes||[]).reduce((a,x)=>a+n(x.q),0);
const rateOf=it=>n(it.rate)>0?n(it.rate):(rates()[it.currency]??1);
function shipQty(id){return S.items.filter(i=>i.shipmentId===id).reduce((a,i)=>a+qtyOf(i),0)}
function deliveryOf(it){const sh=it.shipmentId&&shipById(it.shipmentId);if(sh&&n(sh.cost)>0){const q=shipQty(sh.id);return q?n(sh.cost)*qtyOf(it)/q:0}return n(it.delivery)}
function goodsCost(it){return n(it.price)*qtyOf(it)*rateOf(it)}
function unitCost(it){const q=qtyOf(it);if(!q)return 0;return (goodsCost(it)+deliveryOf(it)+n(it.extra))/q}
function inTransit(it){const sh=it.shipmentId&&shipById(it.shipmentId);return !!(sh&&sh.status!=='На складе')}
function soldMap(){const m={};for(const s of S.sales){if(s.status==='Возврат')continue;const k=s.itemId+'|'+(s.size||'');m[k]=(m[k]||0)+n(s.qty)}return m}
function stockOf(it,m){return (it.sizes||[]).map(x=>({s:x.s||'',q:n(x.q),left:n(x.q)-(m[it.id+'|'+(x.s||'')]||0)}))}
const isRet=s=>s.status==='Возврат';
const saleSum=s=>isRet(s)?0:n(s.qty)*n(s.price);
const saleCostUnit=s=>{const it=itemById(s.itemId);return it?unitCost(it):n(s.cost)};
const saleFee=s=>isRet(s)?0:n(s.fee);
const saleProfit=s=>isRet(s)?0:saleSum(s)-saleFee(s)-n(s.extraCost)-n(s.qty)*saleCostUnit(s);
const paidOf=s=>(s.payments||[]).reduce((a,p)=>a+n(p.amount),0);
const debtOf=s=>isRet(s)?0:Math.max(0,Math.round(saleSum(s)-paidOf(s)));
function nextDue(s){
  const d=debtOf(s);if(!d)return null;
  const plan=(s.plan||[]).slice().sort((a,b)=>String(a.due).localeCompare(String(b.due)));
  if(!plan.length)return null;
  const planTotal=plan.reduce((a,p)=>a+n(p.amount),0),base=saleSum(s)-planTotal,paid=paidOf(s);
  let cum=base;
  for(const p of plan){cum+=n(p.amount);if(paid<cum-0.5)return{due:p.due,amount:Math.min(d,Math.round(cum-paid))}}
  return{due:plan[plan.length-1].due,amount:d};
}
const isOverdue=s=>{const nd=nextDue(s);return !!(nd&&nd.due<today())};
function makePlan(total,months,first){months=Math.max(1,Math.round(n(months)));const part=Math.floor(total/months/100)*100;const plan=[];let rest=total;for(let i=0;i<months;i++){const a=i===months-1?rest:part;plan.push({due:addMonths(first,i),amount:a});rest-=a}return plan}

/* ---------- data layer ---------- */
function applyRow(col,id,data,del){
  if(col==='settings'){if(id==='main')S.settings=del?{}:(data||{});return}
  if(!S[col])return;
  const arr=S[col],i=arr.findIndex(x=>x.id===id);
  if(del){if(i>=0)arr.splice(i,1);return}
  const rec={id,...data};if(i>=0)arr[i]=rec;else arr.push(rec);
}
async function loadAll(){
  const all=[];let from=0;
  for(;;){const {data,error}=await sb.from('docs').select('collection,id,data').range(from,from+999);if(error)throw error;all.push(...data);if(data.length<1000)break;from+=1000}
  for(const c of COLS)S[c]=[];S.settings={};
  for(const r of all)applyRow(r.collection,r.id,r.data,false);
}
let rtTimer=null;
function subscribeRT(){
  sb.channel('docs-rt').on('postgres_changes',{event:'*',schema:'public',table:'docs'},p=>{
    if(p.eventType==='DELETE')applyRow(p.old.collection,p.old.id,null,true);
    else applyRow(p.new.collection,p.new.id,p.new.data,false);
    clearTimeout(rtTimer);rtTimer=setTimeout(render,60);
  }).subscribe(st=>{if(st==='SUBSCRIBED')setSync('');else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT')setSync('Нет живой синхронизации — обновите страницу')});
}
function clean(o){const r={};for(const k in o){if(k!=='id'&&o[k]!==undefined)r[k]=o[k]}return JSON.parse(JSON.stringify(r))}
async function saveDoc(col,id,data){
  id=id||newId();data=clean(data);
  const {error}=await sb.from('docs').upsert({collection:col,id,data});
  if(error)throw error;
  applyRow(col,id,data,false);render();return id;
}
async function patchDoc(col,id,patch){
  const cur=col==='settings'?S.settings:(S[col].find(x=>x.id===id)||{});
  return saveDoc(col,id,{...cur,...patch});
}
async function delDoc(col,id){
  const {error}=await sb.from('docs').delete().eq('collection',col).eq('id',id);
  if(error)throw error;applyRow(col,id,null,true);render();
}
const saveSettings=patch=>patchDoc('settings','main',patch);
function errMsg(e){const m=String(e&&(e.message||e.error_description||e)||'');if(/row-level|permission|JWT|401|403/i.test(m))return 'Нет доступа — войдите заново';if(/fetch|network/i.test(m))return 'Нет интернета — не сохранилось';return 'Не сохранилось: '+m.slice(0,80)}

async function uploadPhoto(file){
  let img;
  try{img=await createImageBitmap(file)}catch(e){img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file)})}
  const max=1280,k=Math.min(1,max/Math.max(img.width,img.height));
  const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.82));
  const path='items/'+newId()+'.jpg';
  const {error}=await sb.storage.from('photos').upload(path,blob,{contentType:'image/jpeg',cacheControl:'31536000'});
  if(error)throw error;
  return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
}

/* ---------- auth ---------- */
async function boot(){
  const cfg=window.BUTIK_CONFIG;
  if(!window.supabase||!cfg){document.body.innerHTML='<p style="padding:24px">Не удалось загрузить приложение. Проверьте интернет и обновите страницу.</p>';return}
  sb=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true}});
  sb.auth.onAuthStateChange((ev)=>{if(ev==='SIGNED_OUT')showLogin()});
  const {data:{session}}=await sb.auth.getSession();
  if(session)startApp();else showLogin();
}
function showLogin(){$('#appView').classList.add('hidden');$('#loginView').classList.remove('hidden');closeModal()}
$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const u=$('#lgUser').value.trim().toLowerCase().replace(/[`'" ]/g,''),p=$('#lgPass').value.trim().replace(/^[`'"]+|[`'"]+$/g,'');
  if(!u||!p){$('#lgErr').textContent='Введите логин и пароль';return}
  const email=u.includes('@')?u:u+'@'+window.BUTIK_CONFIG.loginDomain;
  $('#lgBtn').disabled=true;$('#lgErr').textContent='';
  const {error}=await sb.auth.signInWithPassword({email,password:p});
  $('#lgBtn').disabled=false;
  if(error){$('#lgErr').textContent=/invalid/i.test(error.message)?'Неверный логин или пароль ('+email+')':/fetch|network|load/i.test(error.message)?'Нет связи с сервером. Отключите VPN/блокировщик рекламы или попробуйте другой браузер.':'Ошибка входа: '+error.message;return}
  startApp();
});
async function startApp(){
  $('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');
  $('#view').innerHTML='<div class="empty">Загрузка…</div>';
  try{
    const {data:me}=await sb.auth.getUser();
    const {data:mem}=await sb.from('app_users').select('user_id').eq('user_id',me.user.id);
    if(!mem||!mem.length){$('#view').innerHTML='<div class="empty">У этого логина нет доступа к магазину.</div>';return}
    await loadAll();render();subscribeRT();
  }catch(e){$('#view').innerHTML=`<div class="empty">Не удалось загрузить данные.<br>${esc(errMsg(e))}<br><br><button class="btn" onclick="location.reload()">Обновить</button></div>`}
}
document.addEventListener('visibilitychange',async()=>{if(document.visibilityState==='visible'&&sb&&!$('#appView').classList.contains('hidden')){try{await loadAll();render()}catch(e){}}});

/* ---------- render ---------- */
function render(){
  if(!$('#appView')||$('#appView').classList.contains('hidden'))return;
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===S.tab));
  $('#fab').classList.toggle('hide',S.tab==='stats');
  const toDo=S.sales.filter(s=>s.status==='Новый'||s.status==='Оплачен'||s.status==='Бронь').length;
  const od=S.sales.filter(isOverdue).length;
  const bs=$('#bSales');bs.textContent=toDo;bs.classList.toggle('hidden',!toDo);
  const bm=$('#bMoney');bm.textContent=od;bm.classList.toggle('hidden',!od);
  const v=$('#view'),ae=document.activeElement,keep=ae&&ae.id==='q'?ae.selectionStart:null;
  v.innerHTML=({items:viewItems,sales:viewSales,clients:viewClients,money:viewMoney,stats:viewStats})[S.tab]();
  if(keep!==null){const q=$('#q');if(q){q.focus();try{q.setSelectionRange(keep,keep)}catch(e){}}}
  const so=$('#sort');if(so)so.value=S.sort;
}
const thumb=(url,cls='thumb')=>url?`<div class="${cls}" style="background-image:url('${esc(url)}')"></div>`:`<div class="${cls}">${ICON_SHIRT}</div>`;
const stPill=s=>{const c=STAT_COL[s]||STAT_COL['Новый'];return `background:${c[0]};color:${c[1]}`};

function viewItems(){
  const m=soldMap();
  const cats=['Все',...CATS.filter(c=>S.items.some(i=>i.category===c))];
  let list=S.items.filter(it=>(S.cat==='Все'||it.category===S.cat)&&like(S.q,[it.name,it.brand,it.supplier,it.color,it.category,(it.sizes||[]).map(x=>x.s).join(' ')].join(' ')));
  const left=it=>stockOf(it,m).reduce((a,x)=>a+x.left,0);
  const by={new:(a,b)=>String(b.date||'').localeCompare(String(a.date||''))||n(b.createdAt)-n(a.createdAt),profit:(a,b)=>(n(b.sell)-unitCost(b))-(n(a.sell)-unitCost(a)),stock:(a,b)=>left(a)-left(b),name:(a,b)=>String(a.name).localeCompare(String(b.name),'ru')};
  list.sort(by[S.sort]||by.new);
  let units=0,atCost=0,atSell=0;
  for(const it of list){const l=Math.max(0,left(it));units+=l;atCost+=l*unitCost(it);atSell+=l*n(it.sell)}
  let h=`<input id="q" class="search" placeholder="Поиск: название, бренд, поставщик, размер…" value="${esc(S.q)}">
  <div class="chips">${cats.map(c=>`<button class="chip ${S.cat===c?'on':''}" data-act="cat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  <div class="summary"><div><small>Осталось</small><b>${units} шт</b></div><div><small>По себестоимости</small><b>${money(atCost)}</b></div><div><small>По цене продажи</small><b>${money(atSell)}</b></div></div>
  <div class="bar"><span>${list.length} ${plural(list.length,'позиция','позиции','позиций')}</span><select id="sort"><option value="new">Сначала новые</option><option value="profit">По прибыли</option><option value="stock">Мало осталось</option><option value="name">По названию</option></select></div>`;
  if(!S.items.length)return h+`<div class="empty">Товаров пока нет.<br>Нажмите <b>+</b>, чтобы добавить закупку.</div>`;
  if(!list.length)return h+`<div class="empty">Ничего не найдено</div>`;
  for(const it of list){
    const st=stockOf(it,m),cost=unitCost(it),sell=n(it.sell),pr=sell-cost,l=st.reduce((a,x)=>a+x.left,0),tr=inTransit(it);
    h+=`<div class="card" data-act="editItem" data-id="${it.id}"><div class="cardtop">${thumb(it.photo)}<div class="grow">
      <div class="row1"><div class="nm">${esc(it.name)}</div><span class="pill ${tr?'blue':''}">${tr?'В пути':esc(it.category||'—')}</span></div>
      <div class="sub">${[it.brand,it.color,it.supplier].filter(Boolean).map(esc).join(' · ')||'&nbsp;'}</div>
      <div class="sizes">${st.map(x=>`<span class="sz ${x.left<=0?'out':x.left<=1?'low':''}">${esc(x.s||'б/р')} <b>${x.left}</b>/${x.q}</span>`).join('')}</div>
      </div></div>
      <div class="nums"><div><small>Себестоимость</small><b>${money(cost)}</b></div><div><small>Цена</small><b>${sell?money(sell):'—'}</b></div><div><small>Прибыль/шт</small><b class="${pr<0?'bad':'good'}">${sell?money(pr):'—'}${sell?`<em>${pct(pr/sell)}</em>`:''}</b></div></div>
      <div class="foot"><span>Осталось <b style="color:var(--ink)">${l} шт</b>${it.hidden?' · скрыт с витрины':''}</span><div class="acts"><button class="btn sm" data-act="sellItem" data-id="${it.id}" ${l<=0?'disabled':''}>${tr?'Предзаказ':'Продать'}</button></div></div>
    </div>`;
  }
  return h;
}

function viewSales(){
  const ym=today().slice(0,7);
  let list=S.sales.filter(s=>(S.stat==='Все'||s.status===S.stat)&&like(S.q,[s.clientName,s.phone,digits(s.phone),s.itemName,s.size,s.channel,s.note,s.payMethod].join(' ')));
  list.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||n(b.createdAt)-n(a.createdAt));
  const month=S.sales.filter(s=>String(s.date||'').slice(0,7)===ym);
  const cnt={};for(const s of S.sales)cnt[s.status]=(cnt[s.status]||0)+1;
  let h=`<input id="q" class="search" placeholder="Поиск: клиент, телефон, товар…" value="${esc(S.q)}">
  <div class="chips">${['Все',...STAT].map(c=>`<button class="chip ${S.stat===c?'on':''}" data-act="stat" data-v="${c}">${c}${c!=='Все'&&cnt[c]?' · '+cnt[c]:''}</button>`).join('')}</div>
  <div class="summary"><div><small>Выручка за месяц</small><b>${money(month.reduce((a,s)=>a+saleSum(s),0))}</b></div><div><small>Прибыль за месяц</small><b class="good">${money(month.reduce((a,s)=>a+saleProfit(s),0))}</b></div><div><small>Ждут отправки</small><b>${(cnt['Новый']||0)+(cnt['Оплачен']||0)}</b></div></div>`;
  if(!S.sales.length)return h+`<div class="empty">Продаж пока нет.<br>Нажмите <b>+</b> или «Продать» на карточке товара.</div>`;
  if(!list.length)return h+`<div class="empty">Ничего не найдено</div>`;
  for(const s of list)h+=saleCard(s);
  return h;
}
function saleCard(s,opt={}){
  const pr=saleProfit(s),d=debtOf(s),nd=nextDue(s),od=nd&&nd.due<today(),it=itemById(s.itemId);
  return `<div class="card ${od?'flag':''}" data-act="editSale" data-id="${s.id}"><div class="cardtop">${thumb(it&&it.photo)}<div class="grow">
    <div class="row1"><div><div class="nm">${esc(s.clientName||'Без имени')}</div><div class="sub">${fdate(s.date)} · ${esc(s.channel||'')}${s.payMethod?' · '+esc(s.payMethod):''}</div></div>
    <select class="st" data-status="${s.id}" style="${stPill(s.status)}">${STAT.map(x=>`<option ${x===s.status?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="sub" style="color:var(--ink);margin-top:6px">${esc(s.itemName||'')}${s.size?` · <b>${esc(s.size)}</b>`:''} × ${n(s.qty)}</div>
    ${s.note?`<div class="sub">${esc(s.note)}</div>`:''}
    ${(s.exchanges||[]).length?`<div class="sub">↔ Обмен: ${esc(s.exchanges[s.exchanges.length-1].from)}</div>`:''}
  </div></div>
  <div class="nums"><div><small>Сумма</small><b>${money(saleSum(s))}</b></div><div><small>${d?'Долг':'Оплачено'}</small><b class="${d?(od?'bad':'warnc'):'good'}">${d?money(d):(isRet(s)?'—':'✓')}</b></div><div><small>Прибыль</small><b class="${pr<0?'bad':'good'}">${money(pr)}</b></div></div>
  ${d&&saleSum(s)?`<div class="debtbar"><i style="width:${Math.min(100,paidOf(s)/saleSum(s)*100)}%"></i></div>`:''}
  ${nd?`<div class="sub ${od?'bad':''}" style="margin-top:6px">${od?'Просрочен платёж':'Следующий платёж'}: <b>${money(nd.amount)}</b> до ${fdate(nd.due)}</div>`:''}
  <div class="foot"><span class="phone">${esc(fmtPhone(s.phone))}</span><div class="acts">${d?`<button class="btn sm ghost" data-act="addPay" data-id="${s.id}">+ Платёж</button>`:''}${s.phone?`<button class="btn sm wa" data-act="wa" data-id="${s.id}">WhatsApp</button>`:''}</div></div>
  </div>`;
}

function clientStats(c){
  const own=S.sales.filter(s=>s.clientId===c.id||(!s.clientId&&s.clientName&&s.clientName.toLowerCase()===String(c.name).toLowerCase()));
  const ok=own.filter(s=>!isRet(s));
  return{own,orders:ok.length,sum:ok.reduce((a,s)=>a+saleSum(s),0),debt:own.reduce((a,s)=>a+debtOf(s),0),last:own.map(s=>s.date).sort().pop()};
}
function viewClients(){
  let list=S.clients.filter(c=>like(S.q,[c.name,c.phone,digits(c.phone),c.city,c.insta,c.note,c.size].join(' '))).map(c=>({c,st:clientStats(c)}));
  list.sort((a,b)=>b.st.sum-a.st.sum||String(a.c.name).localeCompare(String(b.c.name),'ru'));
  let h=`<input id="q" class="search" placeholder="Поиск: имя, телефон, город, Instagram…" value="${esc(S.q)}">
  <div class="bar" style="margin-top:10px"><span>${S.clients.length} ${plural(S.clients.length,'клиент','клиента','клиентов')} · по сумме покупок</span><button class="btn sm ghost" data-act="waAll">Рассылка новинок</button></div>`;
  if(!S.clients.length)return h+`<div class="empty">Клиентов пока нет.<br>Они добавляются сами при продаже, или нажмите <b>+</b>.</div>`;
  if(!list.length)return h+`<div class="empty">Ничего не найдено</div>`;
  for(const {c,st} of list){
    h+=`<div class="card" data-act="editClient" data-id="${c.id}">
      <div class="row1"><div><div class="nm">${esc(c.name)}</div><div class="sub">${[c.city,c.insta,c.size?'размер '+c.size:''].filter(Boolean).map(esc).join(' · ')||'&nbsp;'}</div></div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${st.debt?`<span class="pill red">Долг ${money(st.debt)}</span>`:''}${st.orders>=3?'<span class="pill acc">Постоянная</span>':''}</div></div>
      ${c.note?`<div class="sub">${esc(c.note)}</div>`:''}
      <div class="nums"><div><small>Заказов</small><b>${st.orders}</b></div><div><small>Купила на</small><b>${money(st.sum)}</b></div><div><small>Последняя</small><b>${st.last?fdate(st.last):'—'}</b></div></div>
      ${c.phone?`<div class="foot"><span class="phone">${esc(fmtPhone(c.phone))}</span><div class="acts"><button class="btn sm wa" data-act="waClient" data-id="${c.id}">WhatsApp</button></div></div>`:''}
    </div>`;
  }
  return h;
}

function viewMoney(){
  const seg=`<div class="seg">${[['debts','Долги и брони'],['expenses','Расходы'],['ships','Партии']].map(([k,t])=>`<button class="${S.money===k?'on':''}" data-act="money" data-v="${k}">${t}</button>`).join('')}</div>`;
  if(S.money==='expenses')return seg+viewExpenses();
  if(S.money==='ships')return seg+viewShips();
  const debts=S.sales.filter(s=>debtOf(s)>0&&s.status!=='Бронь').sort((a,b)=>{const x=nextDue(a),y=nextDue(b);return String(x?x.due:'9').localeCompare(String(y?y.due:'9'))});
  const res=S.sales.filter(s=>s.status==='Бронь').sort((a,b)=>String(a.reserveUntil||'').localeCompare(String(b.reserveUntil||'')));
  const total=debts.reduce((a,s)=>a+debtOf(s),0),od=debts.filter(isOverdue);
  const week=addDays(today(),7),soon=debts.filter(s=>{const nd=nextDue(s);return nd&&nd.due>=today()&&nd.due<=week}).reduce((a,s)=>a+nextDue(s).amount,0);
  let h=seg+`<div class="summary"><div><small>Вам должны</small><b>${money(total)}</b></div><div><small>Просрочено</small><b class="${od.length?'bad':''}">${od.length} ${plural(od.length,'платёж','платежа','платежей')}</b></div><div><small>Придёт за 7 дней</small><b class="good">${money(soon)}</b></div></div>`;
  h+=`<h3>Долги и рассрочки</h3>`;
  h+=debts.length?debts.map(s=>saleCard(s)).join(''):`<div class="empty">Никто не должен 🎉</div>`;
  h+=`<h3>Брони</h3>`;
  h+=res.length?res.map(s=>{const late=s.reserveUntil&&s.reserveUntil<today();return `<div class="card ${late?'flag':''}" data-act="editSale" data-id="${s.id}"><div class="row1"><div><div class="nm">${esc(s.clientName||'Без имени')}</div><div class="sub" style="color:var(--ink)">${esc(s.itemName)} · <b>${esc(s.size)}</b> × ${n(s.qty)}</div><div class="sub ${late?'bad':''}">Бронь до ${fdate(s.reserveUntil)||'—'}${paidOf(s)?' · предоплата '+money(paidOf(s)):''}</div></div><span class="pill acc">${money(saleSum(s))}</span></div><div class="foot"><span class="phone">${esc(fmtPhone(s.phone))}</span><div class="acts"><button class="btn sm ghost" data-act="unreserve" data-id="${s.id}">Снять бронь</button><button class="btn sm" data-act="confirmRes" data-id="${s.id}">Купила</button></div></div></div>`}).join(''):`<div class="empty">Броней нет. Бронь — это продажа со статусом «Бронь»: размер не уйдёт другой клиентке.</div>`;
  return h;
}
function viewExpenses(){
  const ym=today().slice(0,7);
  const list=S.expenses.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||n(b.createdAt)-n(a.createdAt));
  const m=S.expenses.filter(e=>String(e.date).slice(0,7)===ym);
  const byCat={};for(const e of m)byCat[e.category]=(byCat[e.category]||0)+n(e.amount);
  const top=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  let h=`<div class="summary"><div><small>Расходы за месяц</small><b>${money(m.reduce((a,e)=>a+n(e.amount),0))}</b></div><div><small>Больше всего</small><b style="font-size:13.5px">${top?esc(top[0]):'—'}</b></div><div><small>Всего записей</small><b>${S.expenses.length}</b></div></div>`;
  if(!list.length)return h+`<div class="empty">Расходов пока нет.<br>Записывайте рекламу, блогеров, упаковку — без них прибыль завышена.</div>`;
  return h+`<div class="list">${list.map(e=>`<div class="li" data-act="editExp" data-id="${e.id}" style="cursor:pointer"><div class="l"><div>${esc(e.category)}</div><div class="sub">${fdate(e.date)}${e.note?' · '+esc(e.note):''}</div></div><div class="r">${money(n(e.amount))}</div></div>`).join('')}</div>`;
}
function viewShips(){
  const list=S.shipments.slice().sort((a,b)=>SHIP_ST.indexOf(a.status)-SHIP_ST.indexOf(b.status)||String(b.date).localeCompare(String(a.date)));
  const transit=S.items.filter(inTransit).reduce((a,i)=>a+goodsCost(i)+deliveryOf(i)+n(i.extra),0);
  let h=`<div class="summary"><div><small>Деньги в пути</small><b>${money(transit)}</b></div><div><small>Партий в пути</small><b>${S.shipments.filter(s=>s.status!=='На складе').length}</b></div><div><small>Всего партий</small><b>${S.shipments.length}</b></div></div>`;
  if(!list.length)return h+`<div class="empty">Партий пока нет.<br>Партия — одна посылка из карго. Её доставка сама делится на все товары внутри.</div>`;
  for(const sh of list){
    const its=S.items.filter(i=>i.shipmentId===sh.id),q=its.reduce((a,i)=>a+qtyOf(i),0),goods=its.reduce((a,i)=>a+goodsCost(i),0);
    const cls=sh.status==='На складе'?'green':sh.status==='В пути'?'blue':'warn';
    h+=`<div class="card" data-act="editShip" data-id="${sh.id}"><div class="row1"><div><div class="nm">${esc(sh.name||'Партия')}</div><div class="sub">${[sh.from,sh.cargo,sh.date?'заказ '+fdate(sh.date):'',sh.eta&&sh.status!=='На складе'?'ждём '+fdate(sh.eta):''].filter(Boolean).map(esc).join(' · ')}</div></div><span class="pill ${cls}">${esc(sh.status)}</span></div>
      ${sh.track?`<div class="sub">Трек: <b style="color:var(--ink)">${esc(sh.track)}</b></div>`:''}
      <div class="nums"><div><small>Товаров</small><b>${its.length} поз. / ${q} шт</b></div><div><small>Товар</small><b>${money(goods)}</b></div><div><small>Доставка${q?' / шт':''}</small><b>${money(n(sh.cost))}${q?`<em style="color:var(--muted)">${money(n(sh.cost)/q)}</em>`:''}</b></div></div>
      ${its.length?`<div class="sub" style="margin-top:8px">${its.map(i=>esc(i.name)).join(', ')}</div>`:''}
      ${sh.status!=='На складе'?`<div class="foot"><span></span><div class="acts"><button class="btn sm" data-act="shipArrived" data-id="${sh.id}">${sh.status==='Заказано'?'Отправлена →':'Пришла на склад ✓'}</button></div></div>`:''}
    </div>`;
  }
  return h;
}

function inPeriod(d){
  if(S.period==='all')return true;
  const t=new Date(),cur=t.getFullYear()+'-'+pad(t.getMonth()+1);
  const p=new Date(t.getFullYear(),t.getMonth()-1,1),prev=p.getFullYear()+'-'+pad(p.getMonth()+1);
  return String(d||'').slice(0,7)===(S.period==='month'?cur:prev);
}
function viewStats(){
  const m=soldMap();
  const sales=S.sales.filter(s=>inPeriod(s.date)&&s.status!=='Бронь'),ok=sales.filter(s=>!isRet(s));
  const rev=ok.reduce((a,s)=>a+saleSum(s),0),gross=ok.reduce((a,s)=>a+saleProfit(s),0),units=ok.reduce((a,s)=>a+n(s.qty),0);
  const exp=S.expenses.filter(e=>inPeriod(e.date)).reduce((a,e)=>a+n(e.amount),0),net=gross-exp;
  const fee=ok.reduce((a,s)=>a+saleFee(s)+n(s.extraCost),0),returns=sales.length-ok.length;
  const recv=S.sales.reduce((a,s)=>a+(s.payments||[]).filter(p=>inPeriod(p.date)).reduce((b,p)=>b+n(p.amount),0),0);
  const debts=S.sales.reduce((a,s)=>a+debtOf(s),0);
  const bought=S.items.filter(i=>inPeriod(i.date)).reduce((a,i)=>a+unitCost(i)*qtyOf(i),0);
  let stockCost=0,stockSell=0;const low=[];
  for(const it of S.items){if(inTransit(it))continue;for(const x of stockOf(it,m)){const l=Math.max(0,x.left);stockCost+=l*unitCost(it);stockSell+=l*n(it.sell);if(x.left<=1)low.push({it,x})}}
  const transit=S.items.filter(inTransit).reduce((a,i)=>a+goodsCost(i)+deliveryOf(i)+n(i.extra),0);
  const group=key=>{const g={};for(const s of ok){const k=key(s)||'—';g[k]=g[k]||{rev:0,pr:0,q:0};g[k].rev+=saleSum(s);g[k].pr+=saleProfit(s);g[k].q+=n(s.qty)}return Object.entries(g).sort((a,b)=>b[1].pr-a[1].pr)};
  const listHtml=(rows,showQty)=>{if(!rows.length)return '<div class="li"><span class="l" style="color:var(--muted)">Нет продаж за период</span></div>';const mx=Math.max(...rows.map(r=>Math.abs(r[1].pr)))||1;return rows.map(([k,v])=>`<div class="li"><div class="l"><div>${esc(k)}${showQty?` <span style="color:var(--muted)">· ${v.q} шт</span>`:''}</div><div class="meter"><i style="width:${Math.max(4,Math.abs(v.pr)/mx*100)}%"></i></div></div><div class="r">${money(v.pr)}<small>выручка ${money(v.rev)}</small></div></div>`).join('')};
  const expG={};for(const e of S.expenses.filter(e=>inPeriod(e.date)))expG[e.category]=(expG[e.category]||0)+n(e.amount);
  return `<h2>Итоги</h2>
  <div class="chips" style="padding-top:0">${[['month','Этот месяц'],['prev','Прошлый месяц'],['all','Всё время']].map(([v,t])=>`<button class="chip ${S.period===v?'on':''}" data-act="period" data-v="${v}">${t}</button>`).join('')}</div>
  <div class="kpis" style="margin-top:8px">
    <div class="kpi hl"><small>Чистая прибыль (после расходов)</small><b>${money(net)}</b></div>
    <div class="kpi"><small>Выручка</small><b>${money(rev)}</b></div>
    <div class="kpi"><small>Прибыль с продаж</small><b>${money(gross)}</b></div>
    <div class="kpi"><small>Расходы бизнеса</small><b>${money(exp)}</b></div>
    <div class="kpi"><small>Заказов / вещей</small><b>${ok.length} / ${units}</b></div>
    <div class="kpi"><small>Средний чек</small><b>${money(ok.length?rev/ok.length:0)}</b></div>
    <div class="kpi"><small>Маржа</small><b>${pct(rev?gross/rev:NaN)}</b></div>
    <div class="kpi"><small>Комиссии и скидки</small><b>${money(fee)}</b></div>
    <div class="kpi"><small>Деньги пришли</small><b>${money(recv)}</b></div>
    <div class="kpi"><small>Вам должны (всего)</small><b>${money(debts)}</b></div>
    <div class="kpi"><small>Закуплено за период</small><b>${money(bought)}</b></div>
    <div class="kpi"><small>Склад по себестоимости</small><b>${money(stockCost)}</b></div>
    <div class="kpi"><small>Склад по цене продажи</small><b>${money(stockSell)}</b></div>
    <div class="kpi"><small>Деньги в пути</small><b>${money(transit)}</b></div>
  </div>
  ${returns?`<div class="sub" style="margin-top:8px">Возвратов за период: ${returns}</div>`:''}
  <h3>Самые прибыльные товары</h3><div class="list">${listHtml(group(s=>s.itemName).slice(0,8),true)}</div>
  <h3>По категориям</h3><div class="list">${listHtml(group(s=>(itemById(s.itemId)||{}).category||s.category),true)}</div>
  <h3>По каналам продаж</h3><div class="list">${listHtml(group(s=>s.channel),false)}</div>
  <h3>По способам оплаты</h3><div class="list">${listHtml(group(s=>s.payMethod||'не указан'),false)}</div>
  <h3>Расходы</h3><div class="list">${Object.keys(expG).length?Object.entries(expG).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="li"><div class="l">${esc(k)}</div><div class="r">${money(v)}</div></div>`).join(''):'<div class="li"><span class="l" style="color:var(--muted)">Нет расходов за период</span></div>'}</div>
  <h3>Заканчиваются (осталось 0–1)</h3><div class="list">${low.length?low.sort((a,b)=>a.x.left-b.x.left).map(({it,x})=>`<div class="li"><div class="l">${esc(it.name)} <span style="color:var(--muted)">· ${esc(it.color||'')}</span></div><div class="r ${x.left<=0?'bad':''}">${esc(x.s||'б/р')}: ${x.left} шт</div></div>`).join(''):'<div class="li"><span class="l" style="color:var(--muted)">Всё в наличии</span></div>'}</div>`;
}

/* ---------- modal ---------- */
const stack=[];
function pushModal(){if(F&&!$('#modal').classList.contains('hidden'))stash()}
function stash(){const fr=document.createDocumentFragment();const sh=$('#sheet');while(sh.firstChild)fr.appendChild(sh.firstChild);stack.push({fr,F,top:sh.scrollTop})}
function openModal(html,push){if(push&&F&&!$('#modal').classList.contains('hidden'))stash();$('#sheet').innerHTML=html;$('#modal').classList.remove('hidden');$('#sheet').scrollTop=0;document.body.style.overflow='hidden'}
function closeModal(){const prev=stack.pop();if(prev){const sh=$('#sheet');sh.innerHTML='';sh.appendChild(prev.fr);F=prev.F;sh.scrollTop=prev.top;if(F&&F.remount)F.remount();return}$('#modal').classList.add('hidden');$('#sheet').innerHTML='';F=null;document.body.style.overflow=''}
function closeAll(){stack.length=0;closeModal()}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeAll()});
const H=(title)=>`<h2>${title}<button class="x" data-close>×</button></h2>`;
function askConfirm(text,btn,onYes){
  if(!$('#modal').classList.contains('hidden'))stash();
  F={kind:'confirm',onYes};
  openModal(`<h2 style="font-size:19px">${esc(text)}</h2><div class="actions"><button class="btn ghost" data-close>Отмена</button><button class="btn danger" data-act="confirmYes">${esc(btn)}</button></div>`,false);
}

/* item form */
function itemForm(it,pre){
  const d=it?JSON.parse(JSON.stringify(it)):{name:'',brand:'',supplier:'',category:'Платья',color:'',currency:'CNY',price:'',rate:'',delivery:'',extra:'',sell:'',sizes:[{s:'S',q:''},{s:'M',q:''},{s:'L',q:''}],date:today(),link:'',note:'',photo:'',shipmentId:'',hidden:false,...(pre||{})};
  if(!d.sizes||!d.sizes.length)d.sizes=[{s:'',q:''}];
  F={kind:'item',id:it&&it.id,d};
  const fld=(k,label,attrs='')=>`<label>${label}<input data-f="${k}" value="${esc(d[k]??'')}" ${attrs}></label>`;
  openModal(`${H(it?'Товар':'Новый товар')}
  <div class="grp"><div class="photo" id="photoBox"></div></div>
  <div class="grp"><div class="gt">Что за товар</div><div class="f">
    <label class="w">Название *<input data-f="name" value="${esc(d.name)}" placeholder="Например: Платье миди трикотаж"></label>
    ${fld('brand','Бренд','placeholder="Zara, Mango…"')}
    <label>Категория<select data-f="category">${CATS.map(c=>`<option ${d.category===c?'selected':''}>${c}</option>`).join('')}</select></label>
    ${fld('color','Цвет','placeholder="Чёрный"')}
    ${fld('supplier','Поставщик','placeholder="1688, Лалели…"')}
    ${fld('link','Ссылка / контакт поставщика','placeholder="https://… или @магазин"')}
    <label>Дата закупки<input type="date" data-f="date" value="${esc(d.date)}"></label>
  </div></div>
  <div class="grp"><div class="gt">Размеры и количество</div>
    <div class="szrow" style="font-size:12px;color:var(--muted);font-weight:600"><span>Размер</span><span>Кол-во, шт</span><span></span></div>
    <div id="szlist"></div>
    <div class="quick">${QUICK_SIZES.map(s=>`<button type="button" data-addsz="${s}">+ ${s}</button>`).join('')}<button type="button" data-addsz="">+ свой</button></div>
  </div>
  <div class="grp"><div class="gt">Закупка</div><div class="f">
    <label>Валюта<select data-f="currency">${CUR.map(c=>`<option value="${c}" ${d.currency===c?'selected':''}>${c} — ${CUR_NAME[c]}</option>`).join('')}</select></label>
    ${fld('price','Цена за 1 шт (в валюте) *','inputmode="decimal"')}
    <label>Курс, ₸<input data-f="rate" inputmode="decimal" value="${esc(d.rate??'')}"><span class="hint" id="ratehint"></span></label>
    <label>Партия (карго)<select data-f="shipmentId"><option value="">— без партии —</option>${S.shipments.map(s=>`<option value="${s.id}" ${d.shipmentId===s.id?'selected':''}>${esc(s.name)} (${esc(s.status)})</option>`).join('')}</select></label>
    <label id="delivBox">Доставка за партию товара, ₸<input data-f="delivery" inputmode="decimal" value="${esc(d.delivery??'')}" placeholder="0"></label>
    ${fld('extra','Доп. расходы, ₸','inputmode="decimal" placeholder="упаковка, бирки"')}
  </div><div class="hint" id="shipHint" style="margin-top:8px"></div></div>
  <div class="grp"><div class="gt">Продажа</div><div class="f">
    <label class="w">Цена продажи за 1 шт, ₸<input data-f="sell" inputmode="decimal" value="${esc(d.sell??'')}"></label>
  </div>
  <div class="quick"><span class="hint" style="align-self:center;margin-right:4px">Наценка:</span>${[50,80,100,150,200].map(p=>`<button type="button" data-markup="${p}">+${p}%</button>`).join('')}</div>
  </div>
  <div class="preview" id="ipv"></div>
  <div class="grp"><div class="f"><label class="w">Заметки<textarea data-f="note" placeholder="Ткань, посадка, особенности…">${esc(d.note||'')}</textarea></label>
  <label class="chk w"><input type="checkbox" data-f="hidden" ${d.hidden?'checked':''}> Не показывать на витрине</label></div></div>
  <div class="actions">${it?'<button class="btn danger" data-act="delItem">Удалить</button>':''}<div class="r">${it?'<button class="btn ghost" data-act="sellFromForm">Продать</button>':''}<button class="btn" data-act="saveItem">Сохранить</button></div></div>`);
  F.remount=()=>{renderPhoto();renderSizes();itemPreview()};
  F.remount();
}
function renderPhoto(){
  const el=$('#photoBox');if(!el)return;
  el.innerHTML=`${thumb(F.d.photo)}<div style="display:flex;flex-direction:column;gap:8px"><label class="btn sm ghost" style="cursor:pointer">${F.d.photo?'Заменить фото':'+ Добавить фото'}<input type="file" accept="image/*" id="photoIn" hidden></label>${F.d.photo?'<button class="btn sm ghost" data-act="rmPhoto">Убрать</button>':''}<span class="hint">Фото видно на витрине для клиентов</span></div>`;
}
function renderSizes(){
  const el=$('#szlist');if(!el)return;
  el.innerHTML=F.d.sizes.map((x,i)=>`<div class="szrow"><input data-sz="${i}" data-k="s" value="${esc(x.s)}" placeholder="размер"><input data-sz="${i}" data-k="q" inputmode="numeric" value="${esc(x.q)}" placeholder="0"><button type="button" data-delsz="${i}">×</button></div>`).join('');
}
function itemPreview(){
  const d=F.d,el=$('#ipv');if(!el)return;
  const h=$('#ratehint');if(h)h.textContent=n(d.rate)>0?'свой курс':'пусто = '+(rates()[d.currency]??1)+' ₸';
  const sh=d.shipmentId&&shipById(d.shipmentId),db=$('#delivBox'),sht=$('#shipHint');
  if(db)db.classList.toggle('hidden',!!(sh&&n(sh.cost)>0));
  if(sht){if(sh){const others=S.items.filter(i=>i.shipmentId===sh.id&&i.id!==F.id).reduce((a,i)=>a+qtyOf(i),0),q=qtyOf(d);sht.textContent=n(sh.cost)>0?`Доставка партии ${money(n(sh.cost))} делится на ${others+q} шт → на этот товар ${money(q&&others+q?n(sh.cost)*q/(others+q):0)}`:'У партии не указана стоимость доставки — впишите её в «Деньги → Партии» или здесь.'}else sht.textContent=''}
  const tmp={...d,id:F.id||'__new'};
  const q=qtyOf(d);let cost=0;
  if(q){let deliv=n(d.delivery);if(sh&&n(sh.cost)>0){const others=S.items.filter(i=>i.shipmentId===sh.id&&i.id!==F.id).reduce((a,i)=>a+qtyOf(i),0);deliv=n(sh.cost)*q/(others+q)}cost=(n(d.price)*q*rateOf(tmp)+deliv+n(d.extra))/q}
  const sell=n(d.sell),pr=sell-cost;
  el.innerHTML=`<div class="big"><small>Себестоимость 1 шт</small><b>${q?money(cost):'—'}</b></div>
  <div class="big"><small>Прибыль с 1 шт</small><b class="${pr<0?'bad':''}">${sell&&q?money(pr):'—'}</b></div>
  <div><small>Всего штук</small><b>${q}</b></div><div><small>Партия обошлась</small><b>${money(cost*q)}</b></div>
  <div><small>Маржа / наценка</small><b>${sell&&q?pct(pr/sell)+' / '+pct(pr/cost):'—'}</b></div><div><small>Прибыль со всей партии</small><b>${sell&&q?money(pr*q):'—'}</b></div>`;
  F.cost=cost;
}

/* sale form */
function saleForm(s,itemId,pre){
  const it0=itemById(itemId);
  const d=s?JSON.parse(JSON.stringify(s)):{date:today(),itemId:itemId||(S.items[0]&&S.items[0].id)||'',size:'',qty:1,price:'',payMethod:'Kaspi перевод',fee:'',feeManual:false,extraCost:'',paidNow:'',paidTouched:false,months:3,firstDue:addMonths(today(),1),clientName:'',phone:'',status:'Оплачен',channel:'Instagram',note:'',reserveUntil:addDays(today(),2),...(pre||{})};
  if(!s){const f=it0||itemById(d.itemId);if(f&&d.price==='')d.price=n(f.sell);if(f&&inTransit(f)&&!pre)d.status='Бронь'}
  if(s){d.months=(s.plan||[]).length||3;d.firstDue=(s.plan&&s.plan[0]&&s.plan[0].due)||addMonths(today(),1)}
  F={kind:'sale',id:s&&s.id,d,planKey:s?JSON.stringify([d.months,d.firstDue]):null};
  const items=[...S.items].sort((a,b)=>String(a.name).localeCompare(String(b.name),'ru'));
  openModal(`${H(s?'Продажа':'Новая продажа')}
  ${!S.items.length?'<div class="grp">Сначала добавьте товар во вкладке «Товары».</div>':''}
  <div class="grp"><div class="gt">Что продали</div><div class="f">
    <label class="w">Товар<select data-f="itemId">${items.map(i=>`<option value="${i.id}" ${i.id===d.itemId?'selected':''}>${esc(itemLabel(i))}</option>`).join('')}${s&&!itemById(s.itemId)?`<option value="${esc(s.itemId)}" selected>${esc(s.itemName)} (удалён)</option>`:''}</select></label>
    <label>Размер<select data-f="size" id="sizesel"></select></label>
    <label>Количество<input data-f="qty" inputmode="numeric" value="${esc(d.qty)}"></label>
    <label>Цена за 1 шт, ₸<input data-f="price" inputmode="decimal" value="${esc(d.price)}"></label>
    <label>Скидка / доставка за ваш счёт, ₸<input data-f="extraCost" inputmode="decimal" value="${esc(d.extraCost??'')}" placeholder="0"></label>
  </div></div>
  <div class="grp"><div class="gt">Оплата</div><div class="f">
    <label>Способ оплаты<select data-f="payMethod">${PAY.map(p=>`<option ${p===d.payMethod?'selected':''}>${p}</option>`).join('')}</select></label>
    <label>Комиссия, ₸<input data-f="fee" inputmode="decimal" value="${esc(d.fee??'')}"><span class="hint" id="feehint"></span></label>
    ${s?'':`<label class="w">Оплачено сейчас, ₸<input data-f="paidNow" inputmode="decimal" value="${esc(d.paidNow)}"><span class="hint">Пусто = вся сумма. 0 — если ещё не платила. Меньше суммы — остаток уйдёт в «Долги».</span></label>`}
    <div class="w" id="planBox"></div>
  </div></div>
  ${s?`<div class="grp"><div class="gt">Платежи</div><div id="payList"></div><button class="btn sm ghost" data-act="addPay" data-id="${s.id}" style="margin-top:8px">+ Принять платёж</button></div>`:''}
  <div class="grp"><div class="gt">Клиент</div><div class="f">
    <label>Имя<input data-f="clientName" list="clist" value="${esc(d.clientName)}" placeholder="Начните вводить…" autocomplete="off"></label>
    <label>Телефон<input data-f="phone" inputmode="tel" value="${esc(d.phone)}" placeholder="+7 7__ ___ __ __"></label>
    <datalist id="clist">${S.clients.map(c=>`<option value="${esc(c.name)}">${esc(fmtPhone(c.phone))}</option>`).join('')}</datalist>
  </div></div>
  <div class="grp"><div class="gt">Заказ</div><div class="f">
    <label>Статус<select data-f="status">${STAT.map(x=>`<option ${x===d.status?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>Откуда клиент<select data-f="channel">${CH.map(x=>`<option ${x===d.channel?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>Дата<input type="date" data-f="date" value="${esc(d.date)}"></label>
    <label id="resBox">Бронь до<input type="date" data-f="reserveUntil" value="${esc(d.reserveUntil||'')}"></label>
    <label class="w">Адрес / трек / комментарий<input data-f="note" value="${esc(d.note||'')}" placeholder="Город, доставка, трек-номер…"></label>
  </div></div>
  ${s&&(s.exchanges||[]).length?`<div class="grp"><div class="gt">Обмены</div>${s.exchanges.map(x=>`<div class="pay"><span>${fdate(x.date)}: ${esc(x.from)} → ${esc(x.to)}</span></div>`).join('')}</div>`:''}
  <div class="preview" id="spv"></div>
  <div class="actions">${s?'<button class="btn danger" data-act="delSale">Удалить</button><button class="btn ghost" data-act="exchange">Обмен</button>':''}<div class="r">${s&&s.phone?'<button class="btn wa" data-act="waForm">WhatsApp</button>':''}<button class="btn" data-act="saveSale" ${!S.items.length?'disabled':''}>Сохранить</button></div></div>`);
  F.remount=()=>{fillSizes();salePayUI();salePreview()};
  F.remount();
}
function fillSizes(){
  const sel=$('#sizesel');if(!sel)return;
  const it=itemById(F.d.itemId),m=soldMap();
  if(F.id){const s=S.sales.find(x=>x.id===F.id);if(s&&!isRet(s)){const k=s.itemId+'|'+(s.size||'');m[k]=(m[k]||0)-n(s.qty)}}
  const st=it?stockOf(it,m):[];
  if(!st.length){sel.innerHTML=`<option value="${esc(F.d.size||'')}">${esc(F.d.size||'—')}</option>`;return}
  if(!st.some(x=>x.s===F.d.size)){const free=st.find(x=>x.left>0)||st[0];F.d.size=free.s}
  sel.innerHTML=st.map(x=>`<option value="${esc(x.s)}" ${x.s===F.d.size?'selected':''}>${esc(x.s||'без размера')} — свободно ${x.left}</option>`).join('');
}
function autoFee(){const d=F.d;if(d.feeManual)return;const p=n(fees()[d.payMethod]);d.fee=p?Math.round(n(d.qty)*n(d.price)*p/100):'';const el=$('[data-f="fee"]');if(el)el.value=d.fee}
function salePayUI(){
  const d=F.d;autoFee();
  const fh=$('#feehint');if(fh){const p=n(fees()[d.payMethod]);fh.textContent=d.feeManual?'вписано вручную':p?`авто: ${p}% (настройки)`:'0% — укажите % в настройках'}
  const rb=$('#resBox');if(rb)rb.classList.toggle('hidden',d.status!=='Бронь');
  const pb=$('#planBox');if(!pb)return;
  if(d.payMethod==='Своя рассрочка'){
    pb.innerHTML=`<div class="f"><label>Сколько месяцев<select data-f="months">${[2,3,4,5,6,8,10,12].map(k=>`<option ${n(d.months)===k?'selected':''}>${k}</option>`).join('')}</select></label><label>Первый платёж<input type="date" data-f="firstDue" value="${esc(d.firstDue)}"></label></div><div class="hint" id="planHint" style="margin-top:6px"></div>`;
  }else pb.innerHTML='';
  const pl=$('#payList');
  if(pl){const s=S.sales.find(x=>x.id===F.id)||{};const ps=s.payments||[];pl.innerHTML=ps.length?ps.map((p,i)=>`<div class="pay"><span>${fdate(p.date)} · ${esc(p.method||'')}${p.note?' · '+esc(p.note):''}</span><span><b>${money(n(p.amount))}</b> <button class="del" data-delpay="${i}">×</button></span></div>`).join(''):'<div class="hint">Платежей ещё не было</div>'}
}
function salePreview(){
  const el=$('#spv');if(!el)return;const d=F.d,ret=d.status==='Возврат';
  const it=itemById(d.itemId),cu=F.id&&(S.sales.find(x=>x.id===F.id)||{}).itemId===d.itemId?saleCostUnit(S.sales.find(x=>x.id===F.id)):(it?unitCost(it):0);
  const sum=ret?0:n(d.qty)*n(d.price),pr=ret?0:sum-n(d.fee)-n(d.extraCost)-n(d.qty)*cu;
  let paid;if(F.id){paid=paidOf(S.sales.find(x=>x.id===F.id)||{})}else paid=String(d.paidNow).trim()===''?(d.payMethod==='Своя рассрочка'?0:sum):n(d.paidNow);
  const debt=Math.max(0,sum-paid);
  const ph=$('#planHint');if(ph){const pl=makePlan(debt,d.months,d.firstDue||today());ph.textContent=debt?`График: ${pl.map(p=>fdate(p.due)+' — '+money(p.amount)).join(', ')}`:'Долга нет — график не нужен'}
  el.innerHTML=`<div class="big"><small>Сумма</small><b>${money(sum)}</b></div><div class="big"><small>Чистая прибыль</small><b class="${pr<0?'bad':''}">${money(pr)}</b></div><div><small>Оплачено</small><b>${money(paid)}</b></div><div><small>Останется долг</small><b class="${debt?'warnc':''}">${money(debt)}</b></div>`;
}

/* payment form */
function payForm(s){
  const nd=nextDue(s),d=debtOf(s);pushModal();
  F={kind:'pay',sid:s.id,d:{amount:nd?nd.amount:d,date:today(),method:s.payMethod==='Своя рассрочка'?'Kaspi перевод':(s.payMethod||'Kaspi перевод'),note:''}};
  openModal(`${H('Принять платёж')}<div class="grp"><div class="sub" style="margin:0 0 10px">${esc(s.clientName)} · ${esc(s.itemName)} · долг <b class="warnc">${money(d)}</b></div><div class="f">
    <label>Сумма, ₸<input data-f="amount" inputmode="decimal" value="${esc(F.d.amount)}"></label>
    <label>Дата<input type="date" data-f="date" value="${esc(F.d.date)}"></label>
    <label>Как заплатила<select data-f="method">${PAY.filter(p=>p!=='Своя рассрочка').map(p=>`<option ${p===F.d.method?'selected':''}>${p}</option>`).join('')}</select></label>
    <label>Комментарий<input data-f="note" placeholder="необязательно"></label></div>
    <div class="quick"><button type="button" data-setamt="${d}">Весь долг ${money(d)}</button>${nd&&nd.amount!==d?`<button type="button" data-setamt="${nd.amount}">Очередной ${money(nd.amount)}</button>`:''}</div></div>
    <div class="actions"><div class="r"><button class="btn" data-act="savePay">Принять</button></div></div>`);
}

/* exchange */
function exchangeForm(s){
  pushModal();F={kind:'exch',sid:s.id,d:{itemId:s.itemId,size:s.size,price:s.price,note:''}};
  const items=[...S.items].sort((a,b)=>String(a.name).localeCompare(String(b.name),'ru'));
  openModal(`${H('Обмен')}<div class="grp"><div class="sub" style="margin:0 0 10px">Было: <b>${esc(s.itemName)} · ${esc(s.size)}</b></div><div class="f">
    <label class="w">Меняем на<select data-f="itemId">${items.map(i=>`<option value="${i.id}" ${i.id===s.itemId?'selected':''}>${esc(itemLabel(i))}</option>`).join('')}</select></label>
    <label>Размер<select data-f="size" id="exSize"></select></label>
    <label>Новая цена за шт, ₸<input data-f="price" inputmode="decimal" value="${esc(s.price)}"><span class="hint" id="exHint"></span></label>
    <label class="w">Причина<input data-f="note" placeholder="Не подошёл размер, другой цвет…"></label></div></div>
    <div class="actions"><div class="r"><button class="btn" data-act="saveExch">Обменять</button></div></div>`);
  F.remount=()=>exFill();F.remount();
}
function exFill(){
  const s=S.sales.find(x=>x.id===F.sid),it=itemById(F.d.itemId),m=soldMap(),sel=$('#exSize');if(!sel)return;
  if(s&&!isRet(s)){const k=s.itemId+'|'+(s.size||'');m[k]=(m[k]||0)-n(s.qty)}
  const st=it?stockOf(it,m):[];
  if(!st.some(x=>x.s===F.d.size&&x.left>0)){const f=st.find(x=>x.left>0);F.d.size=f?f.s:''}
  sel.innerHTML=st.map(x=>`<option value="${esc(x.s)}" ${x.s===F.d.size?'selected':''} ${x.left<=0?'disabled':''}>${esc(x.s||'без размера')} — свободно ${x.left}</option>`).join('');
  const h=$('#exHint');if(h&&s){const diff=(n(F.d.price)-n(s.price))*n(s.qty);h.textContent=diff>0?`Доплата клиента: ${money(diff)}`:diff<0?`Вернуть клиенту: ${money(-diff)}`:'Без доплаты'}
}

/* WhatsApp */
function fillTpl(x,s,c){
  const nd=s&&nextDue(s);const name=String((s&&s.clientName)||(c&&c.name)||'').split(' ')[0];
  const map={'имя':name,'товар':s?(s.itemName||''):'','размер':s?(s.size||''):'','кол-во':s?n(s.qty):'','сумма':s?money(saleSum(s)):'','долг':s?money(debtOf(s)):'','платёж':nd?money(nd.amount):(s?money(debtOf(s)):''),'дата':nd?fdate(nd.due):fdate(addDays(today(),3)),'срок':s&&s.reserveUntil?fdate(s.reserveUntil):fdate(addDays(today(),2)),'комментарий':s?(s.note||''):'','витрина':showcaseUrl(),'магазин':shopName()};
  return x.replace(/\{([^}]+)\}/g,(m,k)=>k in map?map[k]:m).replace(/ +\n/g,'\n').trim();
}
function waForm(s,c){
  const phone=(s&&s.phone)||(c&&c.phone);
  if(!phone){toast('Нет телефона');return}
  const T=tpls();const order=s?(s.status==='Бронь'?['reserve','order','remind']:debtOf(s)?['remind','order','shipped','thanks']:s.status==='Отправлен'?['shipped','thanks','order']:s.status==='Доставлен'?['thanks','newin']:['order','shipped','thanks','remind']):['newin','thanks'];
  const keys=[...order,...Object.keys(T).filter(k=>!order.includes(k))];
  pushModal();F={kind:'wa',phone,s,c};
  openModal(`${H('Написать в WhatsApp')}<div class="sub" style="margin:-6px 0 12px">${esc((s&&s.clientName)||(c&&c.name)||'')} · ${esc(fmtPhone(phone))}</div>
  ${keys.map(k=>`<div class="tpl" data-tpl="${k}"><b>${esc(T[k].t)}</b><span>${esc(fillTpl(T[k].x,s,c))}</span></div>`).join('')}
  <div class="grp f" style="margin-top:12px"><label class="w">Текст сообщения<textarea id="waText" style="min-height:110px">${esc(fillTpl(T[keys[0]].x,s,c))}</textarea></label></div>
  <a class="btn wa full" id="waGo" target="_blank" rel="noopener" href="#">Открыть WhatsApp →</a>
  <div class="hint" style="text-align:center;margin-top:8px">Шаблоны можно поменять в настройках ⚙</div>`);
  updWa();
}
function updWa(){const a=$('#waGo'),t=$('#waText');if(a&&t&&F)a.href='https://wa.me/'+waNum(F.phone)+'?text='+encodeURIComponent(t.value)}

/* client form */
function clientForm(c){
  const d=c?{...c}:{name:'',phone:'',city:'',insta:'',size:'',birthday:'',note:''};
  F={kind:'client',id:c&&c.id,d};
  const st=c?clientStats(c):null;
  openModal(`${H(c?'Клиент':'Новый клиент')}
  <div class="grp"><div class="f">
    <label class="w">Имя *<input data-f="name" value="${esc(d.name)}"></label>
    <label>Телефон<input data-f="phone" inputmode="tel" value="${esc(d.phone)}" placeholder="+7 7__ ___ __ __"></label>
    <label>Город<input data-f="city" value="${esc(d.city)}"></label>
    <label>Instagram<input data-f="insta" value="${esc(d.insta)}" placeholder="@username"></label>
    <label>Размер<input data-f="size" value="${esc(d.size||'')}" placeholder="S / 38"></label>
    <label class="w">Заметки<textarea data-f="note" placeholder="Любимые цвета, день рождения, что ищет…">${esc(d.note||'')}</textarea></label>
  </div></div>
  ${st&&st.own.length?`<div class="grp"><div class="gt">История покупок</div>${st.own.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(s=>`<div class="pay"><span>${fdate(s.date)} · ${esc(s.itemName)}${s.size?' · '+esc(s.size):''} × ${n(s.qty)}${isRet(s)?' · возврат':''}</span><b>${money(saleSum(s))}</b></div>`).join('')}</div>`:''}
  <div class="actions">${c?'<button class="btn danger" data-act="delClient">Удалить</button>':''}<div class="r">${c&&c.phone?'<button class="btn wa" data-act="waClientForm">WhatsApp</button>':''}<button class="btn" data-act="saveClient">Сохранить</button></div></div>`);
}

/* expense & shipment forms */
function expForm(e){
  const d=e?{...e}:{date:today(),category:EXP_CATS[0],amount:'',note:''};F={kind:'exp',id:e&&e.id,d};
  openModal(`${H(e?'Расход':'Новый расход')}<div class="grp"><div class="f">
    <label>Категория<select data-f="category">${EXP_CATS.map(c=>`<option ${c===d.category?'selected':''}>${c}</option>`).join('')}</select></label>
    <label>Сумма, ₸<input data-f="amount" inputmode="decimal" value="${esc(d.amount)}"></label>
    <label>Дата<input type="date" data-f="date" value="${esc(d.date)}"></label>
    <label>Комментарий<input data-f="note" value="${esc(d.note||'')}" placeholder="Таргет на неделю…"></label></div></div>
    <div class="actions">${e?'<button class="btn danger" data-act="delExp">Удалить</button>':''}<div class="r"><button class="btn" data-act="saveExp">Сохранить</button></div></div>`);
}
function shipForm(sh){
  const d=sh?{...sh}:{name:'Партия от '+fdate(today()),from:'Китай',cargo:'',date:today(),eta:addDays(today(),14),status:'Заказано',cost:'',track:'',note:''};F={kind:'ship',id:sh&&sh.id,d};
  const its=sh?S.items.filter(i=>i.shipmentId===sh.id):[];
  openModal(`${H(sh?'Партия':'Новая партия')}<div class="grp"><div class="f">
    <label class="w">Название<input data-f="name" value="${esc(d.name)}"></label>
    <label>Откуда<select data-f="from">${SHIP_FROM.map(c=>`<option ${c===d.from?'selected':''}>${c}</option>`).join('')}</select></label>
    <label>Карго / перевозчик<input data-f="cargo" value="${esc(d.cargo||'')}" placeholder="Название карго"></label>
    <label>Дата заказа<input type="date" data-f="date" value="${esc(d.date)}"></label>
    <label>Ожидаем<input type="date" data-f="eta" value="${esc(d.eta||'')}"></label>
    <label>Статус<select data-f="status">${SHIP_ST.map(c=>`<option ${c===d.status?'selected':''}>${c}</option>`).join('')}</select></label>
    <label>Доставка за всю партию, ₸<input data-f="cost" inputmode="decimal" value="${esc(d.cost)}"></label>
    <label class="w">Трек-номер<input data-f="track" value="${esc(d.track||'')}"></label>
    <label class="w">Заметки<textarea data-f="note">${esc(d.note||'')}</textarea></label></div>
    <div class="hint" style="margin-top:8px">Доставка делится на все товары партии пропорционально количеству штук. Товар привязывается к партии в его карточке.</div></div>
    ${its.length?`<div class="grp"><div class="gt">Товары в партии</div>${its.map(i=>`<div class="pay"><span>${esc(itemLabel(i))} · ${qtyOf(i)} шт</span><b>${money(deliveryOf(i)/Math.max(1,qtyOf(i)))}/шт</b></div>`).join('')}</div>`:''}
    <div class="actions">${sh?'<button class="btn danger" data-act="delShip">Удалить</button>':''}<div class="r">${sh?'<button class="btn ghost" data-act="itemInShip">+ Товар в партию</button>':''}<button class="btn" data-act="saveShip">Сохранить</button></div></div>`);
}

/* calculator */
function calcForm(){
  const k=S.calc;F={kind:'calc'};
  openModal(`${H('Быстрый расчёт')}
  <div class="grp"><div class="gt">Закупка</div><div class="f">
    <label>Валюта<select data-c="cur">${CUR.map(c=>`<option value="${c}" ${k.cur===c?'selected':''}>${c} — ${CUR_NAME[c]}</option>`).join('')}</select></label>
    <label>Цена за 1 шт (в валюте)<input data-c="price" inputmode="decimal" value="${esc(k.price)}" placeholder="0"></label>
    <label>Количество, шт<input data-c="qty" inputmode="numeric" value="${esc(k.qty)}" placeholder="1"></label>
    <label>Курс, ₸<input data-c="rate" inputmode="decimal" value="${esc(k.rate)}" placeholder="авто: ${rates()[k.cur]}"></label>
    <label>Доставка за партию, ₸<input data-c="delivery" inputmode="decimal" value="${esc(k.delivery)}" placeholder="0"></label>
    <label>Доп. расходы, ₸<input data-c="extra" inputmode="decimal" value="${esc(k.extra)}" placeholder="0"></label>
  </div></div>
  <div class="grp"><div class="gt">Продажа</div><div class="f">
    <label>Наценка, %<input data-c="markup" inputmode="decimal" value="${esc(k.markup)}"></label>
    <label>Своя цена, ₸<input data-c="sell" inputmode="decimal" value="${esc(k.sell)}" placeholder="пусто = по наценке"></label>
  </div></div>
  <div class="preview" id="calcout"></div>
  <button class="btn full" data-act="calcToItem">Сохранить как товар</button>`);
  updateCalc();
}
function calcNums(){
  const k=S.calc,q=n(k.qty)||1,rate=n(k.rate)||rates()[k.cur]||1;
  const total=n(k.price)*q*rate+n(k.delivery)+n(k.extra),unit=total/q,rec=Math.ceil(unit*(1+n(k.markup)/100)/100)*100,sell=n(k.sell)||rec,pr=sell-unit;
  return{q,rate,total,unit,rec,sell,pr,margin:sell?pr/sell:NaN,markup:unit?pr/unit:NaN,batch:pr*q,payback:sell?Math.ceil(total/sell):0};
}
function updateCalc(){
  const o=$('#calcout');if(!o)return;const r=calcNums();
  o.innerHTML=`<div class="big"><small>Себестоимость 1 шт</small><b>${money(r.unit)}</b></div><div class="big"><small>${n(S.calc.sell)?'Ваша цена':'Рекомендуемая цена'}</small><b>${money(r.sell)}</b></div>
  <div><small>Прибыль с 1 шт</small><b class="${r.pr<0?'bad':''}">${money(r.pr)}</b></div><div><small>Прибыль с партии</small><b>${money(r.batch)}</b></div>
  <div><small>Маржа / наценка</small><b>${pct(r.margin)} / ${pct(r.markup)}</b></div><div><small>Партия обошлась</small><b>${money(r.total)}</b></div>
  <div><small>Курс</small><b>${r.rate} ₸</b></div><div><small>Окупится после</small><b>${r.payback} шт</b></div>`;
}

/* settings */
function settingsForm(){
  const st=S.settings,R=rates(),FE=fees(),T=tpls();F={kind:'settings'};
  openModal(`${H('Настройки')}
  <div class="grp"><div class="gt">Магазин (видно на витрине)</div><div class="f">
    <label>Название<input id="sName" value="${esc(st.shopName||'')}" placeholder="Мой бутик"></label>
    <label>WhatsApp для заказов<input id="sPhone" inputmode="tel" value="${esc(st.shopPhone||'')}" placeholder="+7 7__ ___ __ __"></label>
    <label>Instagram<input id="sInsta" value="${esc(st.shopInsta||'')}" placeholder="@shop"></label>
    <label>Коротко о магазине<input id="sAbout" value="${esc(st.shopAbout||'')}" placeholder="Одежда из Турции и Китая"></label>
  </div></div>
  <div class="grp"><div class="gt">Курсы валют → ₸</div><div class="hint" style="margin-bottom:8px">Курс, по которому реально платите. Для товара можно указать свой.</div>
    <div class="rates">${CUR.filter(c=>c!=='KZT').map(c=>`<label>${c}<input data-rate="${c}" inputmode="decimal" value="${R[c]}"></label>`).join('')}</div></div>
  <div class="grp"><div class="gt">Комиссии за оплату, %</div><div class="hint" style="margin-bottom:8px">Впишите проценты из вашего тарифа Kaspi Pay — комиссия будет считаться в каждой продаже сама.</div>
    <div class="rates">${PAY.map(p=>`<label>${p}<input data-fee="${esc(p)}" inputmode="decimal" value="${n(FE[p])}"></label>`).join('')}</div></div>
  <div class="grp"><div class="gt">Шаблоны WhatsApp</div><div class="hint" style="margin-bottom:8px">Подстановки: {имя} {товар} {размер} {кол-во} {сумма} {долг} {платёж} {дата} {срок} {комментарий} {витрина} {магазин}</div>
    <div class="f">${Object.keys(T).map(k=>`<label class="w">${esc(T[k].t)}<textarea data-tplk="${k}">${esc(T[k].x)}</textarea></label>`).join('')}</div></div>
  <button class="btn full" data-act="saveSettings">Сохранить настройки</button>
  <div class="grp" style="margin-top:14px"><div class="gt">Данные</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm ghost" data-act="exportCsv">Скопировать продажи (для Excel)</button><button class="btn sm danger" data-act="clearDemo">Удалить демо-данные</button></div></div>
  <button class="btn ghost full" data-act="logout">Выйти</button>`);
}
function showcaseModal(){
  const url=showcaseUrl();F={kind:'show'};
  openModal(`${H('Витрина для клиентов')}<div class="grp"><p style="margin:0 0 10px">Публичная страница с товарами в наличии: фото, размеры, цены и кнопка «Заказать в WhatsApp». Цены закупки, клиенты и прибыль там не видны.</p>
  <div class="f"><label class="w">Ссылка<input readonly value="${esc(url)}" onclick="this.select()"></label></div>
  <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn" data-act="copyShow">Скопировать ссылку</button><a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">Открыть</a></div>
  <div class="hint" style="margin-top:10px">Поставьте её в шапку Instagram или отправляйте клиенткам. Скрыть товар с витрины — галочка в карточке товара.</div></div>`);
}

/* ---------- events ---------- */
async function copy(t){try{await navigator.clipboard.writeText(t);toast('Скопировано')}catch(e){toast('Не удалось скопировать')}}
document.addEventListener('click',async e=>{
  const tab=e.target.closest('[data-tab]');if(tab){S.tab=tab.dataset.tab;S.q='';render();window.scrollTo(0,0);return}
  if(e.target.closest('[data-close]')){closeModal();return}
  if(e.target.closest('select,input,textarea,a:not([data-act])'))return;
  if(e.target.closest('label.btn'))return;
  const tp=e.target.closest('[data-tpl]');if(tp&&F&&F.kind==='wa'){$('#waText').value=fillTpl(tpls()[tp.dataset.tpl].x,F.s,F.c);updWa();return}
  const add=e.target.closest('[data-addsz]');if(add&&F){F.d.sizes=F.d.sizes.filter(x=>String(x.s).trim()||n(x.q));F.d.sizes.push({s:add.dataset.addsz,q:''});renderSizes();const ins=document.querySelectorAll('#szlist input[data-k="'+(add.dataset.addsz?'q':'s')+'"]');ins[ins.length-1]?.focus();return}
  const dz=e.target.closest('[data-delsz]');if(dz&&F){F.d.sizes.splice(+dz.dataset.delsz,1);if(!F.d.sizes.length)F.d.sizes.push({s:'',q:''});renderSizes();itemPreview();return}
  const mk=e.target.closest('[data-markup]');if(mk&&F){itemPreview();const c=F.cost;if(!c){toast('Сначала цена и количество');return}F.d.sell=Math.ceil(c*(1+mk.dataset.markup/100)/100)*100;$('[data-f="sell"]').value=F.d.sell;itemPreview();return}
  const sa=e.target.closest('[data-setamt]');if(sa&&F){F.d.amount=sa.dataset.setamt;$('[data-f="amount"]').value=sa.dataset.setamt;return}
  const dp=e.target.closest('[data-delpay]');if(dp&&F&&F.kind==='sale'){const s=S.sales.find(x=>x.id===F.id);const i=+dp.dataset.delpay;askConfirm('Удалить платёж '+money(n(s.payments[i].amount))+'?','Удалить',async()=>{const ps=s.payments.slice();ps.splice(i,1);await patchDoc('sales',s.id,{payments:ps})});return}
  const a=e.target.closest('[data-act]');if(!a||a.disabled)return;
  const act=a.dataset.act,id=a.dataset.id;
  try{
  switch(act){
  case 'cat':S.cat=a.dataset.v;render();break;
  case 'stat':S.stat=a.dataset.v;render();break;
  case 'period':S.period=a.dataset.v;render();break;
  case 'money':S.money=a.dataset.v;render();break;
  case 'editItem':itemForm(itemById(id));break;
  case 'sellItem':saleForm(null,id);break;
  case 'editSale':saleForm(S.sales.find(s=>s.id===id));break;
  case 'editClient':clientForm(S.clients.find(c=>c.id===id));break;
  case 'editExp':expForm(S.expenses.find(x=>x.id===id));break;
  case 'editShip':shipForm(shipById(id));break;
  case 'openCalc':calcForm();break;
  case 'openSettings':settingsForm();break;
  case 'openShowcase':showcaseModal();break;
  case 'copyShow':copy(showcaseUrl());break;
  case 'sellFromForm':{const iid=F.id;closeAll();saleForm(null,iid);break}
  case 'rmPhoto':F.d.photo='';renderPhoto();break;
  case 'saveItem':{
    const d=F.d;if(!String(d.name).trim()){toast('Укажите название');return}
    const sizes=d.sizes.filter(x=>String(x.s).trim()||n(x.q)).map(x=>({s:String(x.s).trim(),q:n(x.q)}));
    if(!sizes.reduce((s,x)=>s+x.q,0)){toast('Укажите количество хотя бы одного размера');return}
    const old=F.id&&itemById(F.id);
    const rec={...(old||{}),name:String(d.name).trim(),brand:d.brand||'',supplier:d.supplier||'',category:d.category,color:d.color||'',link:d.link||'',currency:d.currency,price:n(d.price),rate:n(d.rate)>0?n(d.rate):null,delivery:n(d.delivery),extra:n(d.extra),sell:n(d.sell),sizes,date:d.date||today(),note:d.note||'',photo:d.photo||'',shipmentId:d.shipmentId||'',hidden:!!d.hidden,createdAt:old?n(old.createdAt)||Date.now():Date.now()};
    delete rec.demo;if(old&&old.demo)rec.demo=true;
    a.disabled=true;await saveDoc('items',F.id,rec);closeAll();toast('Товар сохранён');break}
  case 'delItem':{const iid=F.id;askConfirm(S.sales.some(s=>s.itemId===iid)?'Удалить товар? Продажи по нему останутся.':'Удалить товар?','Удалить',async()=>{await delDoc('items',iid);closeAll()});break}
  case 'saveSale':await saveSale(a);break;
  case 'delSale':{const sid=F.id;askConfirm('Удалить продажу?','Удалить',async()=>{await delDoc('sales',sid);closeAll()});break}
  case 'addPay':{const s=S.sales.find(x=>x.id===id);if(s)payForm(s);break}
  case 'savePay':{
    const s=S.sales.find(x=>x.id===F.sid);const d=F.d;if(!n(d.amount)){toast('Укажите сумму');return}
    a.disabled=true;const ps=(s.payments||[]).concat([{date:d.date||today(),amount:n(d.amount),method:d.method,note:d.note||''}]);
    const patch={payments:ps};if(ps.reduce((x,p)=>x+n(p.amount),0)>=saleSum(s)&&(s.status==='Новый'||s.status==='Бронь'))patch.status='Оплачен';
    await patchDoc('sales',s.id,patch);closeModal();if(F&&F.kind==='sale')F.remount();toast('Платёж принят: '+money(n(d.amount)));break}
  case 'exchange':{const s=S.sales.find(x=>x.id===F.id);exchangeForm(s);break}
  case 'saveExch':{
    const s=S.sales.find(x=>x.id===F.sid),d=F.d,it=itemById(d.itemId);if(!it||!d.size&&(it.sizes||[]).some(x=>x.s)){toast('Выберите размер');return}
    a.disabled=true;const ex=(s.exchanges||[]).concat([{date:today(),from:`${s.itemName} · ${s.size}`,to:`${itemLabel(it)} · ${d.size}`,note:d.note||''}]);
    await patchDoc('sales',s.id,{itemId:it.id,itemName:itemLabel(it),category:it.category,size:d.size,price:n(d.price),cost:Math.round(unitCost(it)*100)/100,exchanges:ex});
    closeAll();toast('Обмен оформлен');break}
  case 'waForm':{const s=S.sales.find(x=>x.id===F.id);waForm(s);break}
  case 'wa':{const s=S.sales.find(x=>x.id===id);F=null;waForm(s);break}
  case 'waClient':{const c=S.clients.find(x=>x.id===id);F=null;waForm(null,c);break}
  case 'waClientForm':{const c=S.clients.find(x=>x.id===F.id);waForm(null,c);break}
  case 'waAll':{const list=S.clients.filter(c=>c.phone);F={kind:'waall'};openModal(`${H('Рассылка новинок')}<div class="hint" style="margin-bottom:10px">WhatsApp не разрешает массовую отправку с обычного номера — откройте чат с каждой клиенткой по очереди. Текст подставится сам.</div>${list.map(c=>`<div class="pay"><span>${esc(c.name)} · ${esc(fmtPhone(c.phone))}</span><a class="btn sm wa" target="_blank" rel="noopener" href="https://wa.me/${waNum(c.phone)}?text=${encodeURIComponent(fillTpl(tpls().newin.x,null,c))}">Открыть</a></div>`).join('')||'<div class="empty">Нет клиентов с телефоном</div>'}`);break}
  case 'saveClient':{
    const d=F.d;if(!String(d.name).trim()){toast('Укажите имя');return}
    a.disabled=true;const old=F.id&&S.clients.find(c=>c.id===F.id);
    await saveDoc('clients',F.id,{...(old||{}),name:String(d.name).trim(),phone:d.phone||'',city:d.city||'',insta:d.insta||'',size:d.size||'',note:d.note||'',createdAt:old?n(old.createdAt)||Date.now():Date.now()});closeAll();toast('Клиент сохранён');break}
  case 'delClient':{const cid=F.id;askConfirm('Удалить клиента? Его продажи останутся.','Удалить',async()=>{await delDoc('clients',cid);closeAll()});break}
  case 'unreserve':{const s=S.sales.find(x=>x.id===id);askConfirm(`Снять бронь ${s.clientName||''}? Товар вернётся в продажу.`,'Снять бронь',async()=>{await delDoc('sales',id);closeAll();toast('Бронь снята')});break}
  case 'confirmRes':{const s=S.sales.find(x=>x.id===id);await patchDoc('sales',id,{status:debtOf(s)?'Новый':'Оплачен'});toast('Бронь → продажа');saleForm(S.sales.find(x=>x.id===id));break}
  case 'saveExp':{const d=F.d;if(!n(d.amount)){toast('Укажите сумму');return}a.disabled=true;const old=F.id&&S.expenses.find(x=>x.id===F.id);await saveDoc('expenses',F.id,{...(old||{}),date:d.date||today(),category:d.category,amount:n(d.amount),note:d.note||'',createdAt:old?n(old.createdAt):Date.now()});closeAll();toast('Расход записан');break}
  case 'delExp':{const xid=F.id;askConfirm('Удалить расход?','Удалить',async()=>{await delDoc('expenses',xid);closeAll()});break}
  case 'saveShip':{const d=F.d;a.disabled=true;const old=F.id&&shipById(F.id);await saveDoc('shipments',F.id,{...(old||{}),name:d.name||'Партия',from:d.from,cargo:d.cargo||'',date:d.date||today(),eta:d.eta||'',status:d.status,cost:n(d.cost),track:d.track||'',note:d.note||'',createdAt:old?n(old.createdAt):Date.now()});closeAll();toast('Партия сохранена');break}
  case 'delShip':{const sid=F.id;askConfirm('Удалить партию? Товары останутся, но без общей доставки.','Удалить',async()=>{await delDoc('shipments',sid);for(const it of S.items.filter(i=>i.shipmentId===sid)){const dl=0;await saveDoc('items',it.id,{...it,shipmentId:'',delivery:dl})}closeAll()});break}
  case 'itemInShip':{const sid=F.id;closeAll();itemForm(null,{shipmentId:sid});break}
  case 'shipArrived':{const sh=shipById(id);const next=sh.status==='Заказано'?'В пути':'На складе';await patchDoc('shipments',id,{status:next});toast(next==='На складе'?'Партия на складе — товары в продаже':'Партия в пути');break}
  case 'confirmYes':{const fn=F.onYes;closeModal();try{await fn()}catch(err){toast(errMsg(err))}break}
  case 'calcToItem':{const k=S.calc;closeAll();itemForm(null,{currency:k.cur,price:k.price,rate:k.rate,delivery:k.delivery,extra:k.extra,sell:calcNums().sell,sizes:[{s:'',q:k.qty||''}]});break}
  case 'saveSettings':{
    const r={KZT:1};document.querySelectorAll('[data-rate]').forEach(i=>{r[i.dataset.rate]=n(i.value)||DEF_RATES[i.dataset.rate]});
    const fe={};document.querySelectorAll('[data-fee]').forEach(i=>{fe[i.dataset.fee]=n(i.value)});
    const tp={};document.querySelectorAll('[data-tplk]').forEach(i=>{if(i.value.trim()&&i.value.trim()!==DEF_TPL[i.dataset.tplk].x)tp[i.dataset.tplk]=i.value.trim()});
    a.disabled=true;await saveSettings({rates:r,payFees:fe,templates:tp,shopName:$('#sName').value.trim(),shopPhone:$('#sPhone').value.trim(),shopInsta:$('#sInsta').value.trim(),shopAbout:$('#sAbout').value.trim()});closeAll();toast('Настройки сохранены');break}
  case 'exportCsv':{
    const rows=[['Дата','Клиент','Телефон','Товар','Размер','Кол-во','Цена','Сумма','Оплата','Комиссия','Скидка','Прибыль','Оплачено','Долг','Статус','Канал']];
    for(const s of S.sales.slice().sort((x,y)=>String(x.date).localeCompare(String(y.date))))rows.push([fdate(s.date),s.clientName,s.phone,s.itemName,s.size,n(s.qty),n(s.price),saleSum(s),s.payMethod||'',saleFee(s),n(s.extraCost),Math.round(saleProfit(s)),paidOf(s),debtOf(s),s.status,s.channel]);
    copy(rows.map(r=>r.map(c=>String(c??'').replace(/\t|\n/g,' ')).join('\t')).join('\n'));toast('Скопировано — вставьте в Excel или Google Таблицы');break}
  case 'clearDemo':askConfirm('Удалить все демо-товары, продажи, клиентов, партии и расходы? Ваши собственные записи останутся.','Удалить демо',async()=>{const {error}=await sb.from('docs').delete().eq('data->>demo','true');if(error)throw error;await loadAll();closeAll();render();toast('Демо-данные удалены')});break;
  case 'logout':await sb.auth.signOut();showLogin();break;
  }
  }catch(err){console.error(err);toast(errMsg(err));a.disabled=false}
});
async function saveSale(a){
  const d=F.d,it=itemById(d.itemId);if(!n(d.qty)){toast('Укажите количество');return}
  if(!n(d.price)){toast('Укажите цену');return}
  a.disabled=true;
  let cid=d.clientId||null;const name=String(d.clientName||'').trim(),ph=String(d.phone||'').trim();
  let cl=S.clients.find(c=>c.id===cid)||(name&&S.clients.find(c=>String(c.name).toLowerCase()===name.toLowerCase()))||(ph&&digits(ph).length>=10&&S.clients.find(c=>waNum(c.phone)===waNum(ph)));
  if(cl&&name&&String(cl.name).toLowerCase()!==name.toLowerCase()&&!(ph&&waNum(cl.phone)===waNum(ph)))cl=null;
  if(cl){cid=cl.id;if(ph&&!cl.phone)await patchDoc('clients',cl.id,{phone:ph})}
  else if(name){cid=await saveDoc('clients',null,{name,phone:ph,city:'',insta:'',size:d.size||'',note:'',createdAt:Date.now()})}
  const old=F.id&&S.sales.find(x=>x.id===F.id);
  const sum=n(d.qty)*n(d.price);
  let payments=old?(old.payments||[]):[],plan=old?(old.plan||[]):[];
  if(!old){const paid=String(d.paidNow).trim()===''?(d.payMethod==='Своя рассрочка'?0:sum):n(d.paidNow);if(paid>0)payments=[{date:d.date||today(),amount:paid,method:d.payMethod==='Своя рассрочка'?'Kaspi перевод':d.payMethod,note:'при заказе'}]}
  if(d.payMethod==='Своя рассрочка'){const key=JSON.stringify([d.months,d.firstDue]);if(!old||!plan.length||key!==F.planKey){const paid=payments.reduce((x,p)=>x+n(p.amount),0);plan=makePlan(Math.max(0,sum-paid),d.months,d.firstDue||addMonths(today(),1))}}else plan=[];
  const rec={...(old||{}),date:d.date||today(),itemId:d.itemId,itemName:it?itemLabel(it):(d.itemName||''),category:it?it.category:(d.category||''),size:d.size||'',qty:n(d.qty),price:n(d.price),fee:n(d.fee),feeManual:!!d.feeManual,extraCost:n(d.extraCost),payMethod:d.payMethod,payments,plan,cost:it?Math.round(unitCost(it)*100)/100:n(d.cost),clientId:cid,clientName:name,phone:ph||(cl&&cl.phone)||'',status:d.status,channel:d.channel,note:d.note||'',reserveUntil:d.status==='Бронь'?(d.reserveUntil||addDays(today(),2)):'',createdAt:old?n(old.createdAt)||Date.now():Date.now()};
  delete rec.paidNow;delete rec.paidTouched;delete rec.months;delete rec.firstDue;delete rec.commission;
  await saveDoc('sales',F.id,rec);closeAll();toast(d.status==='Бронь'?'Бронь сохранена':'Продажа сохранена');
}
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='q'){S.q=t.value;render();return}
  if(t.id==='waText'){updWa();return}
  if(t.dataset.c!==undefined){S.calc[t.dataset.c]=t.value;if(t.dataset.c==='cur'){const r=document.querySelector('[data-c="rate"]');if(r)r.placeholder='авто: '+rates()[t.value]}updateCalc();return}
  if(!F)return;
  if(t.dataset.sz!==undefined){F.d.sizes[+t.dataset.sz][t.dataset.k]=t.value;itemPreview();return}
  if(t.dataset.f){
    F.d[t.dataset.f]=t.type==='checkbox'?t.checked:t.value;
    if(F.kind==='item')itemPreview();
    if(F.kind==='exch'){if(t.dataset.f==='itemId'){const it=itemById(t.value);if(it){F.d.price=n(it.sell);$('[data-f="price"]').value=F.d.price}F.d.size=''}exFill()}
    if(F.kind==='sale'){
      const f=t.dataset.f;
      if(f==='itemId'){const it=itemById(t.value);if(it){F.d.price=n(it.sell);const p=$('[data-f="price"]');if(p)p.value=F.d.price}F.d.size='';fillSizes()}
      if(f==='fee')F.d.feeManual=t.value.trim()!=='';
      if(f==='clientName'){const c=S.clients.find(c=>String(c.name).toLowerCase()===t.value.trim().toLowerCase());if(c){F.d.clientId=c.id;if(c.phone){F.d.phone=c.phone;$('[data-f="phone"]').value=fmtPhone(c.phone)}}else F.d.clientId=null}
      if(['payMethod','qty','price','itemId','status'].includes(f))salePayUI();
      salePreview();
    }
  }
});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='sort'){S.sort=t.value;render();return}
  if(t.id==='photoIn'&&t.files&&t.files[0]&&F){toast('Загружаю фото…');try{F.d.photo=await uploadPhoto(t.files[0]);renderPhoto();toast('Фото загружено')}catch(err){toast('Фото не загрузилось: '+errMsg(err))}return}
  if(t.dataset.status){const id=t.dataset.status;try{await patchDoc('sales',id,{status:t.value});toast('Статус: '+t.value)}catch(err){toast(errMsg(err))}return}
});
$('#fab').addEventListener('click',()=>{F=null;stack.length=0;
  if(S.tab==='items')itemForm();else if(S.tab==='sales')saleForm();else if(S.tab==='clients')clientForm();
  else if(S.tab==='money'){if(S.money==='expenses')expForm();else if(S.money==='ships')shipForm();else saleForm(null,null,{status:'Бронь'})}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').classList.contains('hidden'))closeModal()});
boot();
