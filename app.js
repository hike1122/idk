const K='jd1',$=s=>document.querySelector(s),C=()=>(window.Capacitor&&window.Capacitor.Plugins)||{};
const dk=d=>{d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const esc=s=>String(s).replace(/[<>"&]/g,c=>'&#'+c.charCodeAt(0)+';'),cv=v=>isNaN(v)?v:+v;
// nome,kcal,P,C,G,fibra,Na,Ca,Fe,K,VitC (por 100g) - valores aproximados TACO/USDA
const DB=`Arroz branco cozido,128,2.5,28.1,0.2,1.6,1,4,0.1,1,0
Feijão carioca cozido,76,4.8,13.6,0.5,8.5,2,27,1.3,255,0
Lentilha cozida,93,6.3,16.3,0.5,7.9,2,16,1.5,220,1
Peito de frango grelhado,159,32,0,2.5,0,50,6,0.5,350,0
Carne bovina grelhada,219,35.9,0,7.3,0,60,5,3.1,380,0
Ovo cozido,146,13.3,0.6,9.5,0,140,49,1.5,126,0
Tilápia grelhada,128,26,0,2.7,0,52,10,0.6,380,0
Salmão grelhado,200,25,0,11,0,60,15,0.5,430,0
Atum em lata (água),118,26,0,1,0,300,10,1,250,0
Pão francês,300,8,58.6,3.1,2.3,648,16,1,100,0
Pão integral,253,9.4,49.9,3.7,6.9,500,92,2.5,200,0
Macarrão cozido,158,5.8,30.7,0.9,1.5,1,7,0.5,50,0
Batata cozida,52,1.2,11.9,0,1.3,2,4,0.2,200,7
Batata-doce cozida,77,0.6,18.4,0.1,2.2,9,17,0.2,230,17
Mandioca cozida,125,0.6,30.1,0.3,1.6,1,19,0.1,208,11
Aveia em flocos,394,13.9,66.6,8.5,9.1,5,48,4.4,336,0
Leite integral,61,3.2,4.7,3.3,0,43,113,0.1,150,1
Iogurte natural,63,3.5,5,3.3,0,46,121,0.1,155,1
Queijo mussarela,330,22.6,3,25,0,580,875,0.3,80,0
Banana prata,98,1.3,26,0.1,2,1,8,0.4,358,22
Maçã,56,0.3,15.2,0,1.3,1,3,0.1,75,3
Laranja,37,1,8.9,0.1,1,0,35,0.1,163,54
Mamão,40,0.5,10.4,0.1,1,3,22,0.2,222,82
Morango,30,0.9,6.8,0.3,1.7,2,11,0.3,184,63
Abacate,96,1.2,6,8.4,6.3,0,8,0.2,206,8
Tomate,15,1.1,3.1,0.2,1.2,1,7,0.2,222,21
Alface,11,1.3,1.7,0.2,1.8,7,38,0.4,200,15
Brócolis cozido,25,2.1,4.4,0.5,3.4,2,50,0.5,230,42
Cenoura cozida,30,0.8,6.7,0.2,2.6,20,26,0.2,200,2
Amêndoas,579,21,22,50,12.5,1,264,3.7,733,0
Pasta de amendoim,588,25,20,50,6,17,50,1.7,650,0
Azeite de oliva,884,0,0,100,0,0,0,0,0,0
Whey protein,400,80,8,6,0,300,400,1,400,0
Chocolate ao leite,540,7,59,30,3,79,189,2,372,0`.split('\n').map(l=>{const a=l.split(',');return[a[0],...a.slice(1).map(Number)]});
const MEALS=['Café da manhã','Almoço','Lanche','Jantar','Ceia'];
const MIC=[['Fibra',4,25,'g'],['Sódio',5,2300,'mg'],['Cálcio',6,1000,'mg'],['Ferro',7,14,'mg'],['Potássio',8,3500,'mg'],['Vitamina C',9,90,'mg']];
const TIPS=['💧 Beba um copo d’água e espere 10 minutos antes de decidir.','🧠 Pergunte: é fome física ou emoção (estresse, tédio, solidão, cansaço)?','🚶 Mude de ambiente: caminhe 10 min, tome um banho, escove os dentes.','🍳 Se for fome de verdade, faça uma refeição completa e sentado: proteína + fibra (ovo, iogurte, fruta).','📵 Se for comer: prato servido, sem telas, devagar. Sem culpa.','🚫 Não compense depois: nada de pular refeição ou esticar o jejum por culpa. Volte ao plano na próxima refeição.','🛒 Deixe longe da vista os alimentos que você costuma exagerar.','🤝 Se acontece com frequência ou causa sofrimento, converse com um psicólogo ou nutricionista.'];
const def={p:{sex:'f',age:30,w:70,h:165,act:1,goal:1},g:{p:110,c:200,f:60,water:2500},fast:{s:'12:00',e:'20:00',n:1},days:{},tasks:[{id:1,t:'Beber a meta de água'},{id:2,t:'Respeitar a janela de comer'},{id:3,t:'Registrar as refeições'},{id:4,t:'Me mexer 20 minutos'}],start:dk(),sos:[],wt:[]};
let S=Object.assign({},def,JSON.parse(localStorage.getItem(K)||'{}')),D=dk(),tab='hoje',CM=new Date(),F,st;
const save=()=>localStorage.setItem(K,JSON.stringify(S));
const day=d=>{d=d||D;return S.days[d]||(S.days[d]={food:[],water:0,ex:0,todo:{}})};
const goalK=()=>S.g.p*4+S.g.c*4+S.g.f*9,gk=d=>(S.days[d]&&S.days[d].k)||goalK();
const tot=d=>{const t=Array(10).fill(0);((S.days[d]||{food:[]}).food).forEach(x=>x.v.forEach((n,i)=>t[i]+=n));return t};
const mm=t=>{const a=t.split(':');return +a[0]*60+ +a[1]},hm=m=>Math.floor(m/60)+'h '+String(Math.round(m%60)).padStart(2,'0')+'m';
const pct=(a,b)=>Math.min(100,b?a/b*100:0),lbl=d=>d==dk()?'Hoje':d.split('-').reverse().join('/');
const ok=d=>{const a=S.days[d];return S.tasks.length>0&&!!a&&S.tasks.every(x=>a.todo[x.id])};
function fs(){const n=new Date(),m=n.getHours()*60+n.getMinutes(),s=mm(S.fast.s),e=mm(S.fast.e),win=((e-s+1440)%1440)||1440,el=(m-s+1440)%1440,inW=el<win,left=inW?win-el:1440-el,len=inW?win:1440-win;return{inW,left,len,win,pct:(len-left)/len*100}}
const bar=(a,b,col,l,u)=>`<div style="margin:8px 0"><div class="row sp" style="font-size:13px"><span>${l}</span><span style="color:var(--m)">${Math.round(a)}/${Math.round(b)}${u||'g'}</span></div><div class=bar><i style="width:${pct(a,b)}%;--col:${col}"></i></div></div>`;
const fld=(o,k,l,t)=>`<label style="display:block;margin:8px 0;color:var(--m);font-size:13px">${l}<input type=${t||'number'} step=any value="${S[o][k]}" onchange="S.${o}.${k}=${t?'this.value':'+this.value'};save();${o=='fast'?'sched();':''}render()"></label>`;
const sel=(o,k,l,op)=>`<label style="display:block;margin:8px 0;color:var(--m);font-size:13px">${l}<select onchange="S.${o}.${k}=cv(this.value);save();render()">${op.map(x=>`<option value="${x[0]}" ${S[o][k]==x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></label>`;
const ph=(m,k,v)=>new Promise(r=>{const q=indexedDB.open('ph',1);q.onupgradeneeded=()=>q.result.createObjectStore('s');q.onsuccess=()=>{const t=q.result.transaction('s',m=='get'?'readonly':'readwrite').objectStore('s'),x=m=='get'?t.get(k):m=='put'?t.put(v,k):t.delete(k);x.onsuccess=()=>r(x.result);x.onerror=()=>r()}});
const toast=m=>{const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3800)};
const closeS=()=>{clearInterval(st);const s=$('.sheet');s&&s.remove()};
const sheet=h=>{closeS();document.body.insertAdjacentHTML('beforeend',`<div class=sheet onclick="event.target==this&&closeS()"><div>${h}</div></div>`)};
const go=t=>{tab=t;render();scrollTo(0,0)},cm=n=>{CM=new Date(CM.getFullYear(),CM.getMonth()+n,1);render()};
const dd=n=>{D=dk(new Date(new Date(D+'T12:00').getTime()+n*864e5));render()};
const dnav=()=>`<div class="row sp"><button onclick=dd(-1)>‹</button><b>${lbl(D)}</b><button onclick=dd(1)>›</button></div>`;
function wr(){const g=S.g,p=S.p,k=goalK(),w=[],pk=g.p/p.w,fp=g.f*9/k*100;
if(k<1200)w.push('Meta de calorias muito baixa ('+k+' kcal). Metas assim causam fadiga e aumentam a chance de compulsão.');
if(k>4000)w.push('Meta de calorias muito alta ('+k+' kcal).');
if(pk<.8)w.push('Proteína baixa: '+pk.toFixed(1)+' g/kg (mínimo recomendado ≈ 0,8).');
if(pk>2.5)w.push('Proteína muito alta: '+pk.toFixed(1)+' g/kg.');
if(fp<20)w.push('Gordura baixa ('+Math.round(fp)+'% das kcal).');
if(fp>40)w.push('Gordura alta ('+Math.round(fp)+'% das kcal).');
if(g.c<50)w.push('Carboidrato muito baixo (<50 g).');
if(g.c*4/k>.65)w.push('Carboidrato muito alto (>65% das kcal).');
if(fs().win<240)w.push('Janela de comer muito curta (<4h): fica difícil atingir os nutrientes.');
return w}
function vHoje(){const d=dk(),t=tot(d),k=gk(d),f=fs(),a=S.days[d]||{water:0,ex:0},w=wr(),n=new Date(),m=n.getHours()*60+n.getMinutes();
if(t[0]>k*1.1)w.push('Você passou da meta de hoje em '+Math.round(t[0]-k)+' kcal.');
if(!f.inW&&m>=mm(S.fast.e)&&t[0]<k*.6)w.push('Você comeu pouco hoje. Comer de menos aumenta a chance de compulsão à noite.');
return `<h1>Jejum e Dieta</h1><p style="color:var(--m);margin-bottom:6px">${n.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</p>`+w.map(x=>`<div class=wr>⚠️ ${x}</div>`).join('')+
`<div class=card><h2>${f.inW?'Janela de comer aberta':'Em jejum'}</h2><div class=ring style="--p:${f.pct};--col:${f.inW?'var(--g)':'var(--b)'}"><div><div class=big>${hm(f.left)}</div><small>${f.inW?'até fechar':'até comer'}</small></div></div><p style="text-align:center;color:var(--m);margin-top:10px">Comer: ${S.fast.s} às ${S.fast.e}</p></div>`+
`<div class=card><h2>Calorias</h2><div class=row><div class=ring style="--p:${pct(t[0],k)};--col:${t[0]>k?'var(--r)':'var(--a)'};width:110px;height:110px;flex:none"><div><b style="font-size:20px">${Math.round(Math.abs(k-t[0]))}</b><br><small>${t[0]>k?'acima':'restam'}</small></div></div><div style="flex:1">${bar(t[1],S.g.p,'var(--a)','Proteína')}${bar(t[2],S.g.c,'var(--y)','Carbo')}${bar(t[3],S.g.f,'var(--r)','Gordura')}</div></div></div>`+
`<div class=card><h2>Água</h2>${bar(a.water,S.g.water,'#38bdf8','💧 Hoje','ml')}<div class=row><button onclick="wat(-250)">−250</button><button class=pri onclick="wat(250)">+250 ml</button></div></div>`+
`<div class=card><h2>Atividade física</h2>${bar(xs(d)[0],30,'var(--t)','🏃 '+Math.round(xs(d)[1])+' kcal gastas',' min')}<button onclick="go('treino')">Abrir treino</button></div>`+
`<div class=card><h2>Compulsões vencidas</h2><div class=big>${S.sos.filter(x=>x.r).length} 💪</div></div>`}
const wat=n=>{const a=day(dk());a.water=Math.max(0,a.water+n);save();render()};
const ex=()=>{const m=+prompt('Quantos minutos de exercício?');if(m>0){day(dk()).ex+=m;save();render()}};
function vDieta(){const t=tot(D),k=gk(D),fd=day().food;
return dnav()+`<button style="width:100%;margin:10px 0" onclick="go('alimentos')">📚 Meus alimentos</button><div class=card><h2>Resumo do dia</h2><div class="row sp"><div><div class=big style="color:${t[0]>k?'var(--r)':'var(--t)'}">${Math.round(t[0])}</div><small>de ${k} kcal</small></div><button onclick=kd()>Meta do dia ✏️</button></div>${bar(t[1],S.g.p,'var(--a)','Proteína')}${bar(t[2],S.g.c,'var(--y)','Carbo')}${bar(t[3],S.g.f,'var(--r)','Gordura')}</div>`+
MEALS.map(m=>{const l=fd.filter(x=>x.meal==m);return `<div class=card><div class="row sp"><h2 style=margin:0>${m} · ${Math.round(l.reduce((s,x)=>s+x.v[0],0))} kcal</h2><span><button onclick="cp('${m}')">⧉</button> <button class=pri onclick="fSheet('${m}')">+</button></span></div>${l.map(x=>`<div class=row style="margin-top:10px" onclick="fSheet('${m}',${x.id})">${x.ph?`<img data-ph="${x.ph}" class=th>`:''}<div style=flex:1>${esc(x.name)}<br><small>${x.gr}g · P${Math.round(x.v[1])} C${Math.round(x.v[2])} G${Math.round(x.v[3])}</small></div><b>${Math.round(x.v[0])}</b></div>`).join('')}</div>`}).join('')+
`<div class=card><h2>Micronutrientes</h2>${MIC.map(x=>bar(t[x[1]],x[2],x[0]=='Sódio'&&t[x[1]]>x[2]?'var(--r)':'var(--b)',x[0],x[3])).join('')}<small>Valores aproximados (base TACO/USDA) e metas de referência para adultos.</small></div>`}
const kd=()=>{const v=+prompt('Meta de calorias deste dia:',gk(D));if(v>0){day().k=v;save();render()}};
const num=(id,l,i)=>`<label style="flex:1;font-size:12px;color:var(--m)">${l}<input id=${id} type=number step=any value="${Math.round(F.v[i])}" onchange="F.v[${i}]=+this.value"></label>`;
function fSheet(meal,id){const x=id&&day().food.find(y=>y.id==id);F=x?JSON.parse(JSON.stringify(x)):{id:Date.now(),meal,name:'',gr:100,v:Array(10).fill(0),ph:0};
sheet(`<h2>${x?'Editar':'Adicionar'} · ${meal}</h2><input id=fnm placeholder="Buscar ou digitar alimento" value="${esc(F.name)}" oninput="F.name=this.value;srch()"><div id=sr class=row style="flex-wrap:wrap;margin:8px 0"></div><label style="display:block;margin:8px 0;font-size:12px;color:var(--m)">Quantidade (g/ml)<input id=fgr type=number value=${F.gr} onchange="F.gr=+this.value;fill()"></label><div class=row>${num('ik','kcal',0)}${num('ip','Prot',1)}${num('ic','Carb',2)}${num('ig','Gord',3)}</div><div class=row style="margin:14px 0"><button onclick=shot()>📷 Foto</button><button onclick=toLib()>📚 Guardar</button><img id=fp class=th style=display:none onload="this.style.display=''"></div><div class=row><button class=pri style=flex:1 onclick=addF()>Salvar</button>${x?'<button onclick=delF()>Excluir</button>':''}</div>`);
srch();if(F.ph)ph('get',F.ph).then(u=>u&&($('#fp').src=u))}
function fill(){const r=ALL().find(x=>x[0].toLowerCase()==F.name.toLowerCase());if(r){F.v=r.slice(1,11).map(n=>+(n*F.gr/100).toFixed(1));['ik','ip','ic','ig'].forEach((x,i)=>$('#'+x).value=Math.round(F.v[i]))}}
async function shot(){try{const P=C().Camera;let u;if(P)u=(await P.getPhoto({quality:55,width:720,resultType:'dataUrl',source:'CAMERA',saveToGallery:false,correctOrientation:true})).dataUrl;else u=await new Promise(r=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.capture='environment';i.onchange=()=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(i.files[0])};i.click()});F.ph='p'+F.id;await ph('put',F.ph,u);$('#fp').src=u}catch(x){}}
function addF(){F.name=F.name||'Alimento';const d=day(),i=d.food.findIndex(x=>x.id==F.id);i<0?d.food.push(F):d.food[i]=F;save();closeS();render()}
function delF(){const d=day();d.food=d.food.filter(x=>x.id!=F.id);if(F.ph)ph('del',F.ph);save();closeS();render()}
function prot(h){const e=(mm(S.fast.s)+(24-h)*60)%1440;S.fast.e=String(e/60|0).padStart(2,'0')+':'+String(e%60).padStart(2,'0');save();sched();render()}
function vCal(){const y=CM.getFullYear(),m=CM.getMonth(),n=new Date(y,m+1,0).getDate(),o=new Date(y,m,1).getDay(),t=dk();let c='',i;
for(i=0;i<o;i++)c+='<i></i>';
for(i=1;i<=n;i++){const d=dk(new Date(y,m,i));c+=`<div class="${d<S.start||d>t?'':ok(d)?'ok':d<t?'no':''} ${d==t?'td':''}" onclick="D='${d}';go('tarefas')">${i}</div>`}
let sk=0,x=new Date();if(!ok(t))x.setDate(x.getDate()-1);while(dk(x)>=S.start&&ok(dk(x))){sk++;x.setDate(x.getDate()-1)}
const full=Object.keys(S.days).filter(d=>d>=S.start&&ok(d)).length,dn=Math.floor((new Date(t)-new Date(S.start))/864e5)+1;
return `<h1>Calendário</h1><div class="card row sp" style="text-align:center"><div><div class=big>${Math.max(dn,0)}</div><small>dia da dieta</small></div><div><div class=big>${sk}🔥</div><small>sequência</small></div><div><div class=big>${full}</div><small>dias completos</small></div></div><div class=card><div class="row sp"><button onclick=cm(-1)>‹</button><b>${CM.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b><button onclick=cm(1)>›</button></div><div class=cal style="margin-top:12px">${'DSTQQSS'.split('').map(l=>`<small style="text-align:center">${l}</small>`).join('')}${c}</div><p style="color:var(--m);font-size:12px;margin-top:10px">🟩 todas as tarefas feitas · 🟥 dia incompleto · toque no dia para ver</p></div>`}
function vTar(){const a=day(),miss=S.tasks.filter(x=>!a.todo[x.id]).length;
return dnav()+`<div class=wr style="${miss?(D<dk()?'background:#fb718522;border-color:#fb718566;color:#fecdd3':''):'background:#4ade8022;border-color:#4ade8055;color:#bbf7d0'}">${miss?(D<dk()?'❌ Dia NÃO completado: faltaram '+miss+' tarefa(s)':'Faltam '+miss+' tarefa(s) para completar o dia'):'✅ Dia completo!'}</div>`+
S.tasks.map(x=>`<div class="card row" style="margin:8px 0;padding:12px"><input type=checkbox style="width:24px;height:24px;margin:0" ${a.todo[x.id]?'checked':''} onchange="tg(${x.id})"><span style=flex:1 onclick="ed(${x.id})">${esc(x.t)}</span><button onclick="rm(${x.id})">🗑</button></div>`).join('')+`<button class=pri style="width:100%;margin-top:8px" onclick=addT()>+ Nova tarefa</button><p style="color:var(--m);font-size:12px;margin-top:8px">Toque no texto para editar.</p>`}
const tg=id=>{const a=day();a.todo[id]=!a.todo[id];save();render()};
const addT=()=>{const t=prompt('Nova tarefa:');if(t){S.tasks.push({id:Date.now(),t});save();render()}};
const ed=id=>{const x=S.tasks.find(y=>y.id==id),t=prompt('Editar tarefa:',x.t);if(t){x.t=t;save();render()}};
const rm=id=>{if(confirm('Remover tarefa?')){S.tasks=S.tasks.filter(y=>y.id!=id);save();render()}};
function vAj(){const p=S.p,b=10*p.w+6.25*p.h-5*p.age+(p.sex=='m'?5:-161),td=b*[1.2,1.375,1.55,1.725][p.act],imc=p.w/((p.h/100)**2);
return `<h1>Ajustes</h1><div class=card><h2>Perfil</h2>${sel('p','sex','Sexo',[['f','Feminino'],['m','Masculino']])}${fld('p','age','Idade (anos)')}${fld('p','w','Peso (kg)')}${fld('p','h','Altura (cm)')}${sel('p','act','Atividade física',[[0,'Sedentário'],[1,'Leve (1–3x/sem)'],[2,'Moderada (3–5x/sem)'],[3,'Intensa (6–7x/sem)']])}${sel('p','goal','Objetivo',[[0,'Emagrecer (−15%)'],[1,'Manter'],[2,'Ganhar (+10%)']])}<p style="color:var(--m);font-size:13px">IMC ${imc.toFixed(1)} · Metabolismo basal ${Math.round(b)} kcal · Gasto diário ≈ ${Math.round(td)} kcal</p></div>`+
`<div class=card><h2>Metas (você decide)</h2>${fld('g','p','Proteína (g)')}${fld('g','c','Carboidrato (g)')}${fld('g','f','Gordura (g)')}${fld('g','water','Água (ml)')}<p style="margin:8px 0">Total: <b>${goalK()} kcal</b></p><button onclick=auto()>Calcular automaticamente</button></div>`+
`<div class=card><h2>Acompanhamento</h2><label style="color:var(--m);font-size:13px">Início da dieta<input type=date value=${S.start} onchange="S.start=this.value;save();render()"></label><button style="margin-top:10px" onclick=pes()>⚖️ Registrar peso</button>${spark()}<p style="margin-top:8px;font-size:13px;color:var(--m)">${S.wt.slice(-5).map(x=>lbl(x.d)+': '+x.v+' kg').join(' · ')}</p></div>`+
`<div class=card><h2>Notificações</h2><p style="margin-bottom:10px;font-size:13px">Os avisos são alarmes do próprio Android e funcionam com o app fechado.</p><button onclick=perm()>Permitir alarmes exatos</button></div><div class=card><h2>Backup</h2><p style="font-size:13px;margin-bottom:10px">Copie antes de desinstalar ou atualizar o app (fotos não entram).</p><button onclick=exp()>Copiar backup</button> <button onclick=imp()>Restaurar</button></div>`}
function auto(){const p=S.p,b=10*p.w+6.25*p.h-5*p.age+(p.sex=='m'?5:-161),t=b*[1.2,1.375,1.55,1.725][p.act]*[.85,1,1.1][p.goal];S.g.p=Math.round(p.w*1.6);S.g.f=Math.round(t*.27/9);S.g.c=Math.max(0,Math.round((t-S.g.p*4-S.g.f*9)/4));S.g.water=Math.round(p.w*35/50)*50;save();render()}
const pes=()=>{const v=+prompt('Peso de hoje (kg):',S.p.w);if(v>0){S.wt.push({d:dk(),v});S.p.w=v;save();render()}};
const perm=async()=>{try{await C().LocalNotifications.changeExactNotificationSetting();sched()}catch(x){}};
function sos(){let s=600;sheet(`<h2>Bateu compulsão? Respire. Isso passa.</h2><div class=breathe></div><p style="text-align:center;color:var(--m)">Inspire 4s · segure 4s · solte 6s</p><div class=big id=sc style="text-align:center">10:00</div><p style="text-align:center;color:var(--m)">A vontade costuma ter pico e cair em 10–20 min.</p>${TIPS.map(t=>`<p style="margin:10px 0">${t}</p>`).join('')}<div class=row><button class=pri style=flex:1 onclick=sl(1)>Resisti 💪</button><button style=flex:1 onclick=sl(0)>Comi, sem culpa</button></div>`);
clearInterval(st);st=setInterval(()=>{s--;const x=$('#sc');if(!x||s<0)return clearInterval(st);x.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},1000)}
const sl=r=>{S.sos.push({d:Date.now(),r});save();closeS();toast(r?'Parabéns! Você venceu essa vontade 💪':'Tudo bem. Volte ao plano na próxima refeição, sem compensar.');render()};
async function sched(){const L=C().LocalNotifications;if(!L)return;try{const p=await L.requestPermissions();if(p.display!='granted')return toast('Ative as notificações nas configurações do celular');const q=await L.getPending();if(q.notifications.length)await L.cancel(q);if(!S.fast.n)return;
const s=mm(S.fast.s),e=mm(S.fast.e),w=m=>{const z=((m%1440)+1440)%1440;return{on:{hour:z/60|0,minute:z%60},allowWhileIdle:true}};
const n=[[1,'🍽️ Janela de comer aberta','Hora de fazer uma refeição de verdade.',s],[2,'⏳ Falta 30 min','A janela de comer fecha em 30 minutos.',e-30],[3,'🌙 Jejum começou','Janela encerrada. Beba água e descanse.',e],[4,'✅ Fechar o dia','Confira sua lista de tarefas de hoje.',21*60+30]];
for(let h=9;h<=21;h+=3)n.push([10+h,'💧 Hora da água','Beba um copo agora.',h*60]);
const o=[];n.forEach(x=>{if(x[0]<4)S.fast.days.forEach(d=>o.push({id:100+x[0]*10+d,title:x[1],body:x[2],schedule:{on:{weekday:d+1,...w(x[3]).on},allowWhileIdle:true}}));else o.push({id:x[0],title:x[1],body:x[2],schedule:w(x[3])})});if(o.length)await L.schedule({notifications:o});
const x=await L.checkExactNotificationSetting();if(x.exact_alarm=='denied')toast('Vá em Ajustes e toque em “Permitir alarmes exatos”')}catch(x){}}
const V={hoje:vHoje,dieta:vDieta,jejum:vJejum,calendario:vCal,tarefas:vTar,ajustes:vAj,treino:vTreino,alimentos:vLib},TABS=[['hoje','🏠','Hoje'],['dieta','🥗','Dieta'],['jejum','⏱️','Jejum'],['treino','🏃','Treino'],['calendario','📅','Agenda'],['tarefas','✅','Tarefas']];
function render(){$('#app').innerHTML=V[tab]();$('nav').innerHTML=TABS.map(t=>`<button class="${t[0]==tab?'on':''}" onclick="go('${t[0]}')"><b>${t[1]}</b>${t[2]}</button>`).join('');document.querySelectorAll('[data-ph]').forEach(async i=>{i.src=await ph('get',i.dataset.ph)})}
S.lib=S.lib||[];S.fast.days=S.fast.days||[0,1,2,3,4,5,6];
const ALL=()=>DB.concat(S.lib);
const EXS=[['Caminhada leve',3],['Caminhada rápida',4.3],['Corrida leve (8 km/h)',8.3],['Corrida (10 km/h)',9.8],['Bicicleta leve',4],['Bicicleta moderada',8],['Natação',5.8],['Musculação',3.5],['Musculação intensa',6],['HIIT',8],['Yoga',2.5],['Pilates',3],['Dança',5],['Futebol',7],['Pular corda',11],['Elíptico',5],['Escada',4],['Trilha',6],['Luta/Boxe',7.8],['Alongamento',2.3]];
const bmr=()=>{const p=S.p;return 10*p.w+6.25*p.h-5*p.age+(p.sex=='m'?5:-161)},kpm=met=>met*bmr()/1440;
const xs=d=>{const l=(S.days[d]||{}).exl||[];return[l.reduce((s,x)=>s+x.m,0),l.reduce((s,x)=>s+x.k,0)]};
let XS=0,XM=30,XT=200,LQ='';
function vTreino(){const d=dk(),l=day(d).exl||[],t=xs(d),k=Math.round(kpm(EXS[XS][1])*XM);
return `<h1>Treino</h1><p style="color:var(--m)">Calculado pelo seu corpo: ${S.p.w} kg · ${S.p.h} cm · ${S.p.age} anos</p>${t[0]>150||t[1]>1000?'<div class=wr>Muito exercício hoje. Descanse e se alimente bem.</div>':''}
<div class=card><h2>Registrar hoje</h2><select onchange="XS=+this.value;render()">${EXS.map((x,i)=>`<option value=${i} ${i==XS?'selected':''}>${x[0]}</option>`).join('')}</select><label style="display:block;margin:8px 0;font-size:12px;color:var(--m)">Minutos<input type=number value=${XM} onchange="XM=+this.value;render()"></label><div class=big style="margin:10px 0">${k} kcal</div><button class=pri onclick=addX()>Adicionar</button></div>
<div class=card><h2>Hoje · ${t[0]} min · ${Math.round(t[1])} kcal</h2>${l.map(x=>`<div class="row sp" style="margin:8px 0"><span>${x.n} · ${x.m} min</span><span>${x.k} kcal <button onclick="delX(${x.id})">✕</button></span></div>`).join('')||'<small>Nada registrado.</small>'}</div>
<div class=card><h2>Quanto tempo para gastar</h2><label style="font-size:12px;color:var(--m)">Meta (kcal)<input type=number value=${XT} onchange="XT=+this.value;render()"></label><div style="margin-top:10px">${EXS.map(x=>`<div class="row sp" style="margin:6px 0;font-size:14px"><span style="flex:1">${x[0]}</span><small style="width:80px">${Math.round(kpm(x[1])*30)} kcal/30min</small><b style="width:62px;text-align:right">${Math.ceil(XT/kpm(x[1]))} min</b></div>`).join('')}</div><small>Estimativa. Use para planejar o treino, não para compensar comida.</small></div>`}
const addX=()=>{const d=day(dk());(d.exl=d.exl||[]).push({id:Date.now(),n:EXS[XS][0],m:XM,k:Math.round(kpm(EXS[XS][1])*XM)});save();toast('Treino registrado');render()};
const delX=id=>{const d=day(dk());d.exl=d.exl.filter(x=>x.id!=id);save();render()};
const libList=()=>ALL().map((x,i)=>[x,i]).filter(y=>y[0][0].toLowerCase().includes(LQ.toLowerCase())).map(y=>`<div class="row sp" style="margin:10px 0" ${y[1]>=DB.length?`onclick="libSheet(${y[1]-DB.length})"`:''}><span>${y[1]>=DB.length?'⭐ ':''}${esc(y[0][0])}<br><small>P${y[0][2]} C${y[0][3]} G${y[0][4]}${y[0][11]?' · porção '+y[0][11]+'g':''}</small></span><b>${Math.round(y[0][1])}</b></div>`).join('');
const vLib=()=>`<h1>Meus alimentos</h1><p style="color:var(--m)">Valores por 100 g. Os ⭐ são seus e ficam salvos.</p><button class=pri style="width:100%;margin:10px 0" onclick="libSheet(-1)">+ Novo alimento</button><input placeholder="Buscar" value="${esc(LQ)}" oninput="LQ=this.value;$('#ll').innerHTML=libList()"><div id=ll>${libList()}</div><button style="margin-top:12px" onclick="go('dieta')">‹ Voltar</button>`;
function libSheet(i){const r=i<0?['',0,0,0,0,0,0,0,0,0,0,0]:S.lib[i],f=(id,l,n)=>`<label style="flex:1;font-size:12px;color:var(--m)">${l}<input id=${id} type=number step=any value=${r[n]}></label>`;
sheet(`<h2>${i<0?'Novo':'Editar'} alimento (por 100 g)</h2><input id=ln placeholder="Nome" value="${esc(r[0])}"><div class=row style="margin:8px 0">${f('l1','kcal',1)}${f('l2','Prot',2)}${f('l3','Carb',3)}${f('l4','Gord',4)}</div><div class=row>${f('l5','Fibra',5)}${f('l6','Sódio mg',6)}${f('l7','Cálcio mg',7)}${f('l8','Ferro mg',8)}</div><div class=row style="margin:8px 0">${f('l11','Porção usual (g)',11)}</div><div class=row><button class=pri style="flex:1" onclick="libSave(${i})">Salvar</button>${i>=0?`<button onclick="libDel(${i})">Excluir</button>`:''}</div>`)}
function libSave(i){const o=i<0?[]:S.lib[i];S.lib[i<0?S.lib.length:i]=[$('#ln').value||'Alimento',...[1,2,3,4,5,6,7,8].map(n=>+$('#l'+n).value||0),o[9]||0,o[10]||0,+$('#l11').value||0];save();closeS();render()}
const libDel=i=>{S.lib.splice(i,1);save();closeS();render()};
const toLib=()=>{const g=F.gr||100;S.lib.push([F.name||'Alimento',...F.v.slice(0,10).map(n=>+(n*100/g).toFixed(1)),g]);save();toast('Guardado em Meus alimentos')};
const recents=a=>{const s=[],o=[];Object.values(S.days).flatMap(d=>d.food).sort((x,y)=>y.id-x.id).forEach(f=>{if(!s.includes(f.name)){s.push(f.name);const i=a.findIndex(z=>z[0]==f.name);if(i>=0)o.push([a[i],i])}});return o};
function srch(){const q=F.name.toLowerCase(),a=ALL(),r=q?a.map((x,i)=>[x,i]).filter(y=>y[0][0].toLowerCase().includes(q)):recents(a);$('#sr').innerHTML=r.slice(0,10).map(y=>`<button style="padding:6px 10px;font-size:13px" onclick="pk(${y[1]})">${esc(y[0][0])} · ${Math.round(y[0][1])}</button>`).join('')||'<small>Não achei: preencha à mão e toque em 📚 Guardar.</small>'}
const pk=i=>{const r=ALL()[i];F.name=r[0];F.gr=r[11]||100;$('#fnm').value=r[0];$('#fgr').value=F.gr;fill()};
const cp=m=>{const y=dk(new Date(new Date(D+'T12:00').getTime()-864e5)),s=((S.days[y]||{}).food||[]).filter(x=>x.meal==m);if(!s.length)return toast('Nada ontem nesta refeição');s.forEach(x=>day().food.push({...x,id:Date.now()+Math.floor(Math.random()*999),ph:0}));save();render()};
const PHS=[[0,'Digestão'],[4,'Glicose e insulina caem'],[12,'Mais gordura como energia'],[16,'Jejum prolongado: vá com calma']];
const FT=['💧 Pode: água, café e chá sem açúcar. Qualquer coisa com calorias quebra o jejum.','🍳 Quebre o jejum com proteína + fibra, devagar. Evite começar por doces.','🧂 Se sentir tontura em jejum mais longo, água com uma pitada de sal pode ajudar.','😴 Dormir bem reduz a fome e as compulsões do dia seguinte.','🔁 Quebrou antes da hora? Sem culpa: retome na próxima refeição, sem compensar.','⚠️ Evite jejum se estiver grávida, amamentando, for menor de 18, usar remédios (ex.: diabetes) ou tiver histórico de transtorno alimentar. Fale com um médico antes.'];
const lastMeal=()=>{let m=0;Object.values(S.days).forEach(d=>d.food.forEach(f=>{if(f.id>1e12&&f.id<=Date.now()&&f.id>m)m=f.id}));return m};
const tdw=i=>{const a=S.fast.days,k=a.indexOf(i);k<0?a.push(i):a.splice(k,1);save();sched();render()};
function vJejum(){const f=fs(),fh=Math.round(24-f.win/60),lm=lastMeal(),since=lm?(Date.now()-lm)/6e4:0,hrs=lm?since/60:(f.inW?0:(f.len-f.left)/60);
return `<h1>Jejum</h1>`+wr().filter(x=>x.includes('Janela')).map(x=>`<div class=wr>${x}</div>`).join('')+`<div class=card><div class=ring style="--p:${f.pct};--col:${f.inW?'var(--g)':'var(--b)'}"><div><div class=big>${hm(f.left)}</div><small>${f.inW?'até fechar':'até comer'}</small></div></div></div>`+
`<div class=card><h2>Seu jejum real</h2><div class=big>${lm?hm(since):'—'}</div><small>${lm?'desde a última refeição registrada':'registre refeições para medir'}</small>${PHS.map((p,i)=>`<div class=row style="margin-top:8px;opacity:${hrs>=p[0]?1:.4}"><span>${hrs>=p[0]&&(i==3||hrs<PHS[i+1][0])?'●':'○'}</span><span>${p[0]}h+ ${p[1]}</span></div>`).join('')}<p style="margin-top:8px"><small>Os efeitos variam de pessoa para pessoa.</small></p></div>`+
`<div class=card><h2>Protocolo</h2><div class=row style="flex-wrap:wrap">${[12,14,16,18,20].map(h=>`<button class="${fh==h?'pri':''}" onclick=prot(${h})>${h}:${24-h}</button>`).join('')}</div>${fld('fast','s','Começo a comer','time')}${fld('fast','e','Paro de comer','time')}<h2 style="margin-top:12px">Dias do jejum</h2><div class=row>${'DSTQQSS'.split('').map((l,i)=>`<button style="flex:1;padding:10px 0" class="${S.fast.days.includes(i)?'pri':''}" onclick=tdw(${i})>${l}</button>`).join('')}</div><label class=row style="margin-top:12px"><input type=checkbox style="width:24px;height:24px" ${S.fast.n?'checked':''} onchange="S.fast.n=this.checked?1:0;save();sched();render()"> Notificações de jejum e água</label></div>`+
`<div class=card><h2>Dicas</h2>${FT.map(t=>`<p style="margin:10px 0">${t}</p>`).join('')}</div>`}
const spark=()=>{const w=S.wt.slice(-20).map(x=>x.v);if(w.length<2)return'';const a=Math.min(...w),b=Math.max(...w)||1,r=b-a||1;return `<svg viewBox="0 0 200 50" style="width:100%;margin-top:10px"><polyline fill="none" stroke="var(--t)" stroke-width="2" points="${w.map((v,i)=>(i*200/(w.length-1))+','+(45-(v-a)/r*40)).join(' ')}"/></svg>`};
const exp=()=>navigator.clipboard.writeText(JSON.stringify(S)).then(()=>toast('Backup copiado. Cole em um bloco de notas.'),()=>toast('Não consegui copiar'));
const imp=()=>{const t=prompt('Cole o backup aqui:');if(!t)return;try{S=JSON.parse(t);save();render();toast('Backup restaurado')}catch(x){toast('Backup inválido')}};
render();sched();setInterval(()=>{if(tab=='hoje'&&!$('.sheet'))render()},30000);
