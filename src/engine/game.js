import {STATS,SL,SS,CLASSES,TIERS,RT,RANKS,TIER_CAP,BOSS_RANK,FIRST,EPI,PARTY_NAMES,QTYPES,MON,PLACE,BOSSES,ERAS,QUIRKS,AFFL,VIRT,BLD,PERKS,DECISIONS,BAD_EVENTS,CRAFT,REP,CHAPTERS,repTier,moral,alignTitle,fillStory,storyTrait,KEY,CRISES,TOWNS,CRISIS_DAYS,MAPW,MAPH,MKEY} from './data.js';
import {pix,CPAL,TCOL,BASE,line,WEAPON,spriteCache,SKINS,CLOTHS,HAIRS,SKIN_N,sprite,ICONS,icon} from './art.js';
import {GUILD,PCOL,LOC,hashStr,locOf,route,bez,routeD,svgAt,terrainCache,terrain} from './map.js';
export const rnd=(a,b)=>a+Math.random()*(b-a);
export const ri=(a,b)=>Math.floor(rnd(a,b+1));
export const pick=a=>a[Math.floor(Math.random()*a.length)];
export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export let S=null,M=null;
export const MODEKEY='guildmaster-mode';
export let ui={tab:'quests',drawer:null,selectedParty:null,modal:null,confirm:null,speed:1,paused:false,frac:0,toasts:[],exp:{},mode:'live',advancing:false,mv:{x:0,y:0,w:640}};
try{if(localStorage.getItem(MODEKEY)==='live')ui.mode='live'}catch(e){}
export const uid=()=>S.nid++;
export const perk=id=>(M.perks[id]||0);
/* ---------- model ---------- */
export const era=()=>ERAS.find(e=>e.id===S.eraId)||ERAS[0];
export const efx=(k,d)=>era().fx[k]||d;
export const rank=()=>{let r=0;RT.forEach((t,i)=>{if(S.renown>=t)r=i});return r};
export const bl=id=>S.bld[id]||0;
export const rosterCap=()=>6+2*rank()+2*bl('barracks');
export const partyCount=()=>2+Math.floor(rank()/2);
export const hero=id=>S.heroes.find(h=>h.id===id);
export const party=id=>S.parties.find(p=>p.id===id);
export const members=p=>p.members.map(hero).filter(Boolean);
export const Q=h=>[...(h.quirks||[]).map(id=>QUIRKS[id]).filter(Boolean),...(h.story||[]).map(storyTrait)];
export const fxm=(h,k)=>Q(h).reduce((a,q)=>a*(q.fx[k]||1),1);
export function statMult(h){
  let m=1;
  if(h.affl==='fearful')m*=.85;
  if(h.virtue==='powerful')m*=1.2;
  if(h.virtue==='courageous')m*=1.1;
  return m;
}
export const stat=(h,s)=>Math.round(h.base[s]*(1+.1*(h.level-1))*statMult(h));
export function status(h){
  if(h.injured>0)return 'injured';
  if(h.rest>0)return 'resting';
  const p=h.party&&party(h.party);
  if(p&&p.mission)return 'questing';
  return p&&p.at==='field'?'roaming':'ready';
}
export const unavailable=h=>h.injured>0||h.rest>0;
export const availableClasses=()=>Object.keys(CLASSES).filter(c=>!CLASSES[c].lock||perk(c));
export function pickQuirks(tier){
  const pos=Object.keys(QUIRKS).filter(k=>QUIRKS[k].pos),neg=Object.keys(QUIRKS).filter(k=>!QUIRKS[k].pos);
  const out=[],take=(pool,n)=>{const p=[...pool].sort(()=>Math.random()-.5);for(let i=0;i<n;i++)out.push(p[i])};
  take(pos,tier>=3?2:1);
  take(neg,tier===4?(Math.random()<.5?1:0):1);
  return out;
}
export const randLook=()=>({skin:ri(0,3),cloth:Math.random()<.6?0:ri(1,5),hair:Math.random()<.4?0:ri(1,5)});
export function heroObj(o){
  return {id:uid(),name:o.name,cls:o.cls,tier:o.tier,level:1,xp:0,base:o.base,injured:0,rest:0,party:null,wins:0,quests:0,rep:0,story:[],journal:[],unread:0,stress:0,quirks:o.quirks,affl:null,virtue:null,look:o.look,wage:o.wage};
}
export function makeHero(tier,cls){
  cls=cls||pick(availableClasses());
  const base={};
  STATS.forEach(s=>base[s]=Math.max(1,Math.round(CLASSES[cls].base[s]*TIERS[tier].mult*rnd(.85,1.15))));
  const name=pick(FIRST)+(tier>=2?' '+pick(EPI):'');
  const quirks=pickQuirks(tier);
  let wage=TIERS[tier].wage*rnd(.9,1.15);
  quirks.forEach(id=>{wage*=QUIRKS[id].fx.wage||1});
  return heroObj({name,cls,tier,base,quirks,look:randLook(),wage:Math.max(1,Math.round(wage))});
}

/* ---------- founding the guild: the player builds the starting party ---------- */
export const GNAMES=['The Ragged Lantern','The Iron Hearth','The Gilded Boot','The Last Candle','The Broken Wheel','The Silver Stag'];
export const topStat=cls=>STATS.slice().sort((a,b)=>CLASSES[cls].base[b]-CLASSES[cls].base[a])[0];
export const rollBase=(cls,tier)=>{const b={};STATS.forEach(s=>b[s]=Math.max(1,Math.round(CLASSES[cls].base[s]*TIERS[tier].mult*rnd(.9,1.1))));return b};
export const shuffled=a=>[...a].sort(()=>Math.random()-.5);
export function rollTraits(s){
  const keys=Object.keys(QUIRKS);
  s.posOpts=shuffled(keys.filter(k=>QUIRKS[k].pos)).slice(0,3);
  s.negOpts=shuffled(keys.filter(k=>!QUIRKS[k].pos)).slice(0,2);
  s.pos=s.posOpts[0];s.neg=s.negOpts[0];
}
export function newSlot(cls,tier,used){
  let name;do{name=pick(FIRST)}while(used.includes(name));
  const s={tier,cls,name,focus:topStat(cls),look:randLook(),base:rollBase(cls,tier)};
  rollTraits(s);return s;
}
export const slotStats=s=>{const b={...s.base};b[s.focus]+=Math.round(3*TIERS[s.tier].mult);return b};
export function initCreate(){
  const avail=availableClasses();
  const cls=['cleric',...shuffled(avail.filter(c=>c!=='cleric')).slice(0,2)];
  const used=[],slots=[];
  cls.forEach(c=>{const s=newSlot(c,0,used);used.push(s.name);slots.push(s)});
  if(perk('vet')){const s=newSlot(pick(avail),1,used);s.vet=true;slots.push(s)}
  ui.create={gname:pick(GNAMES),pname:S.parties[0].name,slots,err:''};
}
export function foundGuild(){
  const c=ui.create,names=c.slots.map(s=>(s.name||'').trim());
  if(names.some(n=>!n)){c.err='Every hero needs a name.';return}
  S.guildName=(c.gname||'').trim()||GNAMES[0];
  S.parties[0].name=(c.pname||'').trim()||S.parties[0].name;
  c.slots.forEach((s,i)=>{
    const quirks=[s.pos,s.neg];
    let wage=TIERS[s.tier].wage;quirks.forEach(id=>{wage*=QUIRKS[id].fx.wage||1});
    S.heroes.push(heroObj({name:names[i],cls:s.cls,tier:s.tier,base:slotStats(s),quirks,look:s.look,wage:Math.max(1,Math.round(wage))}));
  });
  S.heroes.slice(0,4).forEach(h=>{h.party=S.parties[0].id;S.parties[0].members.push(h.id)});
  S.setup=false;
  S.heroes.forEach(h=>jot(h,`Joined ${S.guildName} as a founding member.`,'moment',true));
  note(`${S.guildName} opens its doors with ${S.heroes.map(h=>h.name.split(' ')[0]).join(', ')}. Era: ${era().n}.`,'world',1);
  ui.create=null;
  if(ui.introAfter){pushToast({k:'info',t:'Tip: click a quest pin on the map to send a party. "How to play" is always at the bottom.'});ui.introAfter=false}
}
export function pickTier(){
  const cap=TIER_CAP[rank()],w=[50,30,15,8,3].slice(0,cap+1);
  let r=Math.random()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return i}
  return 0;
}
export function makeCandidate(){
  const h=makeHero(pickTier());
  h.cost=Math.round(TIERS[h.tier].hire*rnd(.85,1.2)*(1-.08*perk('haggle')));
  return h;
}
export function refreshTavern(n){
  for(let i=0;i<n&&S.tavern.length;i++)S.tavern.splice(Math.floor(Math.random()*S.tavern.length),1);
  while(S.tavern.length<5)S.tavern.push(makeCandidate());
}
export function ensureParties(){
  while(S.parties.length<partyCount())S.parties.push({id:uid(),name:PARTY_NAMES[S.parties.length%PARTY_NAMES.length],members:[],mission:null,pos:{x:GUILD.x,y:GUILD.y},leg:null,at:'home',auto:false,recall:false,dest:null});
}
export function makeQuest(){
  const r=rank(),d=ri(Math.min(8,1+r),Math.min(10,3+r));
  const type=pick(QTYPES),band=Math.min(4,Math.floor((d-1)/2));
  const m=pick(MON[band]),pl=pick(PLACE[band]);
  const diff=12*Math.pow(1.45,d-1)*rnd(.92,1.1)*efx('diff',1);
  return {id:uid(),d,type:type.k,title:type.f(m,pl),place:pl,monster:m,w:type.w,diff,
    gold:Math.round(12*Math.pow(1.45,d-1)*7*rnd(.92,1.12)*efx('gold',1)),renown:Math.round((3+d*d*.9+d*3)*efx('renown',1)),xp:10+d*8,days:ri(2,4),expires:ri(3,6)};
}
export function makeBossQuest(){
  const B=BOSSES[S.boss];
  return {id:uid(),d:10,boss:true,type:'Final quest',title:`Slay ${B.n}`,place:B.place,monster:B.n,w:B.w,diff:230*efx('diff',1),gold:4000,renown:300,xp:150,days:5,expires:999};
}
export function makeCrisis(){
  const d=Math.min(9,2+rank()),c=pick(CRISES),place=pick(TOWNS);
  const diff=12*Math.pow(1.45,d-1)*.9*efx('diff',1);
  return {id:uid(),d,crisis:true,type:c.k,title:c.f(place),place,monster:'the threat',w:c.w,diff,stake:c.s,
    gold:Math.round(12*Math.pow(1.45,d-1)*7*2.5),renown:Math.round((3+d*d*.9+d*3)*2.5),xp:30+d*10,days:3,expires:CRISIS_DAYS};
}
export const boardOrder=q=>q.crisis?2:q.boss?1:0;
export function fillBoard(){
  const target=5+Math.floor(rank()/2);
  while(S.board.filter(q=>!q.boss&&!q.crisis).length<target)S.board.push(makeQuest());
  S.board.sort((a,b)=>boardOrder(b)-boardOrder(a)||a.d-b.d);
}
export function heroOdds(h,q){
  let o=0;
  Q(h).forEach(x=>{o+=x.fx.odds||0;o+=(x.fx.type&&x.fx.type[q.type])||0});
  if(h.virtue==='focused')o+=.04;
  if(h.affl==='paranoid')o-=.03;
  o+=(h.rep||0)*.0004;
  return o;
}
export const power=(ms,w)=>STATS.reduce((s,k)=>s+(w[k]||0)*ms.reduce((a,h)=>a+stat(h,k),0),0);
export function chance(ms,q){
  if(!ms.length)return 0;
  const c=.5+(power(ms,q.w)/q.diff-1)*.55+(new Set(ms.map(h=>h.cls)).size-1)*.04+ms.reduce((a,h)=>a+heroOdds(h,q),0);
  return clamp(c,.03,.97);
}
export function stressMult(h,ms){
  let m=fxm(h,'stress');
  ms.forEach(x=>{
    m*=fxm(x,'pstress');
    if(x.cls==='bard')m*=.8;
    if(x.cls==='paladin')m*=.85;
    if(x.virtue==='courageous')m*=.9;
    if((x.rep||0)>=45)m*=.95;
    if((x.rep||0)<=-40)m*=1.05;
  });
  if(h.virtue==='stalwart')m*=.5;
  return m*efx('stress',1);
}
export function breakdown(h,ev){
  if(Math.random()<.25){
    const v=pick(Object.keys(VIRT));
    h.virtue=v;h.affl=null;h.stress=40;shiftRep(h,4,ev);
    ev.push({k:'win',t:`${h.name} rises to the moment and becomes ${VIRT[v].n}! ${VIRT[v].d}`});
    jot(h,`Rose to the moment under pressure and became ${VIRT[v].n}.`,'moment');
  }else{
    const a=pick(Object.keys(AFFL));
    h.affl=a;h.virtue=null;h.stress=60;shiftRep(h,-3,ev);
    ev.push({k:'death',t:`${h.name} breaks under the strain and becomes ${AFFL[a].n}. ${AFFL[a].d}`});
    jot(h,`Broke under the strain and became ${AFFL[a].n}.`,'moment');
  }
}
export function addStress(h,amt,ms,ev){
  if(amt>0)amt=Math.round(amt*stressMult(h,ms));
  h.stress=clamp(h.stress+amt,0,100);
  if(h.stress>=100)breakdown(h,ev);
  else if(h.affl&&h.stress<=20){
    ev.push({k:'win',t:`${h.name} has recovered from being ${AFFL[h.affl].n}.`});
    jot(h,`Recovered from being ${AFFL[h.affl].n}.`,'moment');
    h.affl=null;
  }
}
export function newGame(){
  S={v:2,day:1,gold:200+75*perk('purse'),renown:25*perk('fame'),rankSeen:0,heroes:[],parties:[],board:[],tavern:[],offers:[],pending:[],storyQ:[],log:[],fallen:[],
    stats:{won:0,lost:0,fallen:0},hardcore:true,over:false,nextCrisis:ri(12,18),vic:0,paid:false,nid:1,
    eraId:pick(ERAS).id,boss:ri(0,BOSSES.length-1),bossSpawned:false,bld:{chapel:perk('chapel'),barracks:0,infirmary:0,training:0}};
  S.rankSeen=rank();
  S.ledger=[{d:1,n:S.gold,why:'Starting funds',c:'open',bal:S.gold}];
  S.setup=true;
  ensureParties();
  fillBoard();refreshTavern(5);
  initCreate();
}
export function gainRenown(n,ev){
  S.renown=Math.max(RT[rank()],S.renown+n);
  while(S.rankSeen<rank()){
    S.rankSeen++;
    const r=S.rankSeen;ensureParties();
    ev.push({k:'rank',t:`Your guild reached Rank ${RANKS[r].l}: ${RANKS[r].n}! Harder quests and stronger heroes are now in play.`});
    S.offers.push({hero:makeHero(TIER_CAP[r]),why:'has heard your guild is on the rise and wants in, no fee.'});
  }
}
export function addXp(h,x,ev){
  h.xp+=Math.round(x*(1+.2*bl('training'))*fxm(h,'xp'));
  while(h.xp>=40*h.level&&h.level<12){h.xp-=40*h.level;h.level++;ev.push({k:'lvl',t:`${h.name} reached level ${h.level}.`});jot(h,`Reached level ${h.level}.`,'moment')}
}
export function shiftRep(h,d,ev){
  const before=repTier(h.rep||0).n;
  h.rep=clamp((h.rep||0)+d,-100,100);
  const after=repTier(h.rep).n;
  if(after!==before){
    ev.push({k:d>0?'win':'loss',t:`${h.name} is now seen as ${after} (${h.rep>0?'+':''}${h.rep} reputation).`});
    jot(h,`The guild now sees ${h.name.split(' ')[0]} as ${after}.`,'moment');
  }
}
export const LCATS={quest:'Quests',hero:'Heroes',gold:'Gold',world:'World'};
export function guessCat(t){
  if(/set out|completed|failed|crushed|crisis|quest|expired|boss|slain|slay/i.test(t))return 'quest';
  if(/hired|released|joined|level|injur|breaks|recover|reputation|seen as|chapter|opened up|died|relax|rises|journal/i.test(t))return 'hero';
  if(/gold|wage|paid|upgrad|quit/i.test(t))return 'gold';
  return 'world';
}
export const catOf=e=>e.c||guessCat(e.t);
export function note(t,c,day){
  S.log.unshift({d:day||S.day,c:c||guessCat(t),t});
  if(S.log.length>500)S.log.length=500;
}
export function gold(n,why,c){
  if(!n)return;
  S.gold+=n;
  S.ledger=S.ledger||[];
  S.ledger.unshift({d:S.day,n,why,c:c||'other',bal:S.gold});
  if(S.ledger.length>1000)S.ledger.length=1000;
}
export function jot(h,t,k,quiet){
  h.journal=h.journal||[];
  h.journal.push({d:S.day,k:k||'moment',t});
  if(h.journal.length>80)h.journal.shift();
  if(!quiet)h.unread=(h.unread||0)+1;
}
/* backstory chapters unlock with finished quests and write themselves, leaning on the hero's reputation */
export function autoChapter(h,ev){
  const ci=h.story.length,C=CHAPTERS[ci];
  const opts=C.o.map((o,i)=>({o,i})).filter(x=>!x.o.k||(x.o.k==='hi'&&h.rep>=40)||(x.o.k==='lo'&&h.rep<=-30));
  const w=x=>x.o.k?2.5:x.o.m>0?1+Math.max(0,h.rep)/25:x.o.m<0?1+Math.max(0,-h.rep)/25:1;
  let r=Math.random()*opts.reduce((a,x)=>a+w(x),0),pickd=opts[0];
  for(const x of opts){r-=w(x);if(r<=0){pickd=x;break}}
  const o=pickd.o;
  h.story.push({c:ci,o:pickd.i});
  if(o.fx.wage)h.wage=Math.max(1,Math.round(h.wage*o.fx.wage));
  jot(h,`Chapter ${ci+1}, ${C.n}: ${o.l}. ${fillStory(o.s,h)} (Gained the trait ${o.t}.)`,'story');
  shiftRep(h,o.r,ev||[]);
  note(`${h.name} opened up about their past: ${o.l}.`);
  if(ev)ev.push({k:'lvl',t:`${h.name}'s journal has a new entry: "${o.l}" (${o.t}).`});
}
export function checkStory(h,ev){
  while(h.story.length<CHAPTERS.length&&(h.quests||0)>=CHAPTERS[h.story.length].at)autoChapter(h,ev);
}
export function hallEntry(h){
  return {name:h.name,cls:h.cls,tier:h.tier,rep:h.rep||0,title:alignTitle(h),traits:(h.story||[]).map(s=>CHAPTERS[s.c].o[s.o].t)};
}
export function kill(h,q){
  S.heroes=S.heroes.filter(x=>x!==h);
  S.parties.forEach(p=>p.members=p.members.filter(id=>id!==h.id));
  S.fallen.push({name:h.name,cls:h.cls,tier:h.tier,level:h.level,day:S.day,quest:q.title,title:(h.story||[]).length?alignTitle(h):'',rep:repTier(h.rep||0).n});
  S.stats.fallen++;
  if((h.story||[]).length>=2){M.hall.unshift(Object.assign(hallEntry(h),{fell:true}));M.hall=M.hall.slice(0,12);saveMeta()}
}
export function goodEvent(ms){
  const fn=h=>h.name.split(' ')[0],by=c=>{const h=ms.find(x=>x.cls===c);return h&&fn(h)};
  const pool=[
    {icon:'fight',t:`${fn(pick(ms))} leads a skirmish against a patrol and wins.`},
    {icon:'road',t:'The road is clear and spirits are high.'},
    by('rogue')&&{icon:'trap',t:`${by('rogue')} spots a trap and disarms it.`},
    by('mage')&&{icon:'scroll',t:`${by('mage')} reads old runes that reveal a shortcut.`},
    by('ranger')&&{icon:'arrow',t:`${by('ranger')} picks off a lookout from afar.`},
    by('cleric')&&{icon:'heal',t:`${by('cleric')} tends to sore feet and bruised egos.`},
    by('bard')&&{icon:'camp',t:`${by('bard')} plays a tune that eases every mind.`},
    by('paladin')&&{icon:'flag',t:`${by('paladin')} rallies the party with a blessing.`}
  ].filter(Boolean);
  return pick(pool);
}
export function tickMission(p,ev){
  const m=p.mission,e=m.total-m.daysLeft,ms=members(p),ch=chance(ms,m.quest);
  if(Math.random()<.45){
    const avail=DECISIONS.map((d,i)=>i).filter(i=>!m.used.includes(i));
    if(avail.length){
      const i=pick(avail);m.used.push(i);
      runDecision(p,i,e,ev);
      return;
    }
  }
  const irr=ms.filter(h=>h.affl==='irrational').length*.15;
  if(Math.random()<ch-irr){
    const g=goodEvent(ms);
    m.mom+=.05;ms.forEach(h=>addStress(h,-2,ms,ev));
    m.ev.push({day:e,icon:g.icon,tone:'good',t:g.t});
    ev.push({k:'win',m:true,t:`${p.name}: ${g.t}`});
  }else{
    const b=pick(BAD_EVENTS);
    m.mom-=.07;ms.forEach(h=>addStress(h,ri(4,9),ms,ev));
    m.ev.push({day:e,icon:b.icon,tone:'bad',t:b.t});
    ev.push({k:'loss',m:true,t:`${p.name}: ${b.t}`});
  }
}
export const deathChance=(q,cleric,disaster)=>(.12+.02*q.d)*(cleric?.5:1)*(q.boss?1.5:1)*(disaster?1.5:1);
export function resolve(p,ev){
  const m=p.mission,q=m.quest,ms=members(p);
  const ch=clamp(chance(ms,q)+m.mom,.03,.97),roll=Math.random();
  const ok=roll<ch,great=ok&&roll<ch*.4,pct=Math.round(ch*100);
  p.mission=null;
  p.pos={...locOf(q.place)};p.leg={from:{...p.pos},to:{...p.pos}};p.at='field';p.dest=null;
  const cleric=ms.some(h=>h.cls==='cleric');
  if(ok){
    let g=Math.round(q.gold*(great?1.25:1)*ms.reduce((a,h)=>a*fxm(h,'gold'),1));
    const rn=Math.round(q.renown*ms.reduce((a,h)=>a*fxm(h,'renown'),1));
    const selfish=ms.filter(h=>h.affl==='selfish').length;
    if(selfish){g=Math.round(g*(1-.1*selfish));ev.push({k:'loss',t:`A selfish party member pocketed some of the loot.`})}
    gold(g,`Reward: ${q.title}`,'reward');S.stats.won++;
    ms.forEach(h=>{h.wins++;h.quests=(h.quests||0)+1;jot(h,`${great?'Crushed':'Completed'} "${q.title}" with ${p.name}.`,'quest');shiftRep(h,Math.round(1+q.d*.5)+(great?2:0)+(q.boss?10:0),ev);addXp(h,q.xp,ev)});
    ev.push({k:'win',t:`${p.name} ${great?'crushed':'completed'} "${q.title}" (${pct}% final odds). +${g} gold, +${rn} renown.`});
    gainRenown(rn,ev);
    ms.forEach(h=>addStress(h,ri(0,4),ms,ev));
    if(q.crisis){
      ev.push({k:'rank',t:`The crisis is over. ${q.place} is saved, and a grateful survivor wants to join your guild.`});
      S.offers.push({hero:makeHero(Math.min(4,TIER_CAP[rank()]+(Math.random()<.5?1:0))),why:'was among those you saved and swears to repay the debt.'});
    }
    if(q.boss){
      S.vic=S.vic||1;
      ev.push({k:'rank',t:`${q.monster} has fallen! Your guild's name will be sung for generations.`});
    }else{
      const rk=rank();
      if(q.d>=Math.max(2,rk)&&Math.random()<.12+(great?.12:0)+q.d*.01){
        const t=Math.min(4,TIER_CAP[rk]+(q.d>=rk+3&&Math.random()<.4?1:0));
        S.offers.push({hero:makeHero(t),why:`heard how you handled "${q.title}" and asks to join, no fee.`});
      }
    }
  }else{
    S.stats.lost++;
    const loss=Math.round(q.renown*.4),mit=cleric?.5:1,heavy=q.boss?1.5:1;
    ev.push({k:'loss',t:`${p.name} failed "${q.title}" (${pct}% final odds). -${loss} renown.${cleric?' Their cleric limited the damage.':''}`});
    gainRenown(-loss,ev);
    if(q.boss)S.board.push(q);
    if(q.crisis){
      S.over=true;S.overReason=`"${q.title}" was not stopped. ${q.stake} The realm turned on your guild.`;
      ev.push({k:'death',t:`The crisis was not stopped. The realm turns on your guild.`});
    }
    ms.forEach(h=>{
      h.quests=(h.quests||0)+1;jot(h,`Failed "${q.title}" with ${p.name}.`,'quest');shiftRep(h,-Math.round(2+q.d*.4),ev);
      addXp(h,Math.round(q.xp/2),ev);
      addStress(h,ri(14,26)*(q.boss?1.4:1),ms,ev);
      const vig=h.virtue==='vigorous'?.5:1;
      if(S.hardcore&&Math.random()<deathChance(q,cleric,roll>ch+.3)){
        kill(h,q);ev.push({k:'death',t:`${h.name} (${TIERS[h.tier].n} ${CLASSES[h.cls].n}, level ${h.level}) died on the quest. They are remembered.`});
      }else if(Math.random()<(.4+.02*q.d)*mit*fxm(h,'injury')*vig){
        h.injured=Math.max(1,ri(2,2+Math.ceil(q.d/2))-bl('infirmary')+efx('heal',0));
        ev.push({k:'loss',t:`${h.name} is injured for ${h.injured} days.`});
        jot(h,`Injured on the road. Out of action for ${h.injured} days.`,'moment');
      }
    });
  }
  const left=members(p);
  left.filter(h=>h.affl==='abusive').forEach(a=>{
    left.filter(x=>x!==a).forEach(x=>addStress(x,6,left,ev));
    ev.push({k:'loss',t:`${a.name} lashes out at the others.`});
    shiftRep(a,-2,ev);
  });
  const hon=left.filter(h=>moral(h)>=2),dark=left.filter(h=>moral(h)<=-2);
  if(hon.length&&dark.length){
    [...hon,...dark].forEach(h=>addStress(h,4,left,ev));
    ev.push({k:'loss',t:`${hon[0].name} and ${dark[0].name} clashed over how the quest was handled.`});
  }
  p.members=p.members.filter(id=>hero(id));
  members(p).forEach(h=>checkStory(h,ev));
}
/* road events resolve on their own: a specialist in the party takes charge when one fits */
export function runDecision(p,i,e,ev,me){
  const m=p.mission,D=DECISIONS[i],ms=members(p),ch=chance(ms,m.quest),fn=h=>h.name.split(' ')[0];
  const opts=D.o.filter(o=>!o.c||ms.some(h=>h.cls===o.c));
  const gated=opts.filter(o=>o.c),plain=opts.filter(o=>!o.c&&!o.s),safe=opts.filter(o=>o.s);
  const o=gated.length?pick(gated):(safe.length&&(!plain.length||Math.random()<.3)?pick(safe):pick(plain.length?plain:opts));
  let r,tone;
  if(o.s){r=o.s;tone='neutral'}
  else if(Math.random()<clamp(o.p+(ch-.5)*.3,.1,.95)){r=o.w;tone='good'}
  else{r=o.f;tone='bad'}
  m.mom+=r[0];
  if(r[1])ms.forEach(h=>addStress(h,r[1],ms,ev));
  const actor=o.c?ms.find(h=>h.cls===o.c):pick(ms);
  let t=`${o.c?`${fn(actor)} takes charge. `:''}${r[2]}`;
  if(r[3]){const g=Math.round(r[3]*m.quest.d);gold(g,`Found on the road (${m.quest.title})`,'reward');t+=` +${g} gold.`}
  const entry={day:e,icon:D.icon,tone,t:`${D.title}. ${t}`};
  if(me)Object.assign(me,entry,{pending:false});else m.ev.push(entry);
  ev.push({k:tone==='good'?'win':tone==='bad'?'loss':'info',m:true,t:`${p.name}: ${D.title}. ${t}`});
  jot(actor,`${m.quest.title}, day ${e}: ${D.title}. ${t}`,'quest');
}
/* ---------- parties roam the map on their own ---------- */
export const ROAM_SPEED=150,AUTO_ODDS=.55;
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const atHome=p=>!p.mission&&p.at!=='field';
const sortBoard=()=>S.board.sort((a,b)=>boardOrder(b)-boardOrder(a)||a.d-b.d);

/** Where a party is drawn right now (smooth between daily steps). */
export function partyPos(p){
  if(p.mission){const m=p.mission;return bez(route(m.quest.place,m.origin),progress(p)/100)}
  const l=p.leg;
  if(!l)return p.pos||{x:GUILD.x,y:GUILD.y};
  const f=clamp(ui.frac,0,1);
  return {x:l.from.x+(l.to.x-l.from.x)*f,y:l.from.y+(l.to.y-l.from.y)*f};
}
export function nearestPlace(pos){
  let best='the wilds',bd=1e9;
  Object.keys(LOC).forEach(n=>{const d=near(pos,LOC[n]);if(d<bd){bd=d;best=n}});
  return best;
}
function stepToward(p,t){
  const f={...p.pos},d=near(f,t);
  p.leg=d<=ROAM_SPEED?{from:f,to:{x:t.x,y:t.y}}:{from:f,to:{x:f.x+(t.x-f.x)/d*ROAM_SPEED,y:f.y+(t.y-f.y)/d*ROAM_SPEED}};
}
function roamPoint(pos){
  for(let i=0;i<8;i++){
    const a=Math.random()*Math.PI*2,r=ri(70,170);
    const x=clamp(pos.x+Math.cos(a)*r,26,MAPW-26),y=clamp(pos.y+Math.sin(a)*r*.7,48,MAPH-30);
    if(near({x,y},GUILD)>55)return {x,y};
  }
  return {x:clamp(pos.x+90,26,MAPW-26),y:pos.y};
}
export function startMission(p,q,how){
  const o=partyPos(p),origin={x:Math.round(o.x*10)/10,y:Math.round(o.y*10)/10};
  p.mission={quest:q,daysLeft:q.days,total:q.days,mom:0,used:[],ev:[],origin};
  p.auto=true;p.recall=false;p.dest=null;p.at='field';
  p.pos={...origin};p.leg={from:{...origin},to:{...origin}};
  S.board=S.board.filter(x=>x!==q);
  note(how==='auto'?`${p.name} spotted "${q.title}" and took it on.`:how==='reroute'?`${p.name} changed course for "${q.title}".`:`${p.name} set out on "${q.title}".`);
}
export function recallParty(p){
  const o=partyPos(p);
  if(p.mission){
    const q=p.mission.quest;
    if(!S.board.includes(q))S.board.push(q);
    p.mission=null;sortBoard();
  }
  p.pos={x:o.x,y:o.y};p.leg={from:{...p.pos},to:{...p.pos}};
  p.recall=true;p.auto=false;p.dest=null;
  p.at=near(p.pos,GUILD)<2?'home':'field';
  if(p.at==='field')stepToward(p,GUILD);
  note(`${p.name} was recalled to the tavern.`);
}
/** Small things that happen to a party while it roams. They never kill. */
function encounter(p,ev){
  const ms=members(p);
  if(!ms.length||Math.random()>.65)return;
  const d=Math.min(9,1+rank()),where=nearestPlace(p.pos),roll=Math.random();
  const note1=(k,t)=>ev.push({k,m:true,t});
  if(roll<.4){
    const q={w:{might:.4,agility:.3,wits:.3},diff:12*Math.pow(1.45,d-1)*.85,type:'Roaming'};
    if(Math.random()<chance(ms,q)){
      const g=Math.round(q.diff*.9);
      gold(g,`Roaming skirmish near ${where}`,'reward');
      ms.forEach(h=>addXp(h,6+d*3,ev));
      note1('win',`${p.name} drove off raiders near ${where}. +${g} gold.`);
      jot(pick(ms),`Fought off raiders near ${where} while roaming.`,'quest');
    }else{
      ms.forEach(h=>addStress(h,ri(5,10),ms,ev));
      note1('loss',`${p.name} was ambushed near ${where} and had to fall back.`);
      if(Math.random()<.3){
        const h=pick(ms);
        h.injured=Math.max(1,ri(1,2)-bl('infirmary'));
        note1('loss',`${h.name} is injured for ${h.injured} day${h.injured>1?'s':''}.`);
        jot(h,`Hurt in an ambush near ${where}.`,'moment');
      }
    }
  }else if(roll<.62){
    const g=Math.round(12*Math.pow(1.45,d-1)*.7);
    gold(g,`Found while roaming near ${where}`,'reward');
    note1('win',`${p.name} found a forgotten cache near ${where}. +${g} gold.`);
  }else if(roll<.8){
    ms.forEach(h=>addStress(h,-8,ms,ev));
    note1('win',`${p.name} rested at a quiet shrine near ${where}. Stress eases.`);
  }else if(roll<.92){
    gainRenown(1,ev);
    note1('info',`${p.name} helped a lost traveler near ${where}. Word spreads (+1 renown).`);
  }else{
    ms.forEach(h=>addStress(h,3,ms,ev));
    note1('loss',`${p.name} saw a bad omen near ${where}. Nerves fray.`);
  }
}
/** One day of free-roaming: go home to heal, take a quest worth taking, or wander. */
export function autoStep(p,ev){
  if(p.leg)p.pos={...p.leg.to};
  p.leg={from:{...p.pos},to:{...p.pos}};
  const ms=members(p),atG=near(p.pos,GUILD)<2;
  if(atG){p.at='home';p.pos={x:GUILD.x,y:GUILD.y};p.leg={from:{...p.pos},to:{...p.pos}}}
  else p.at='field';
  if(!ms.length)return;
  if(p.recall){
    if(atG){p.recall=false;p.auto=false;ev.push({k:'info',m:true,t:`${p.name} is back at the tavern.`})}
    else stepToward(p,GUILD);
    return;
  }
  if(!p.auto){if(!atG)stepToward(p,GUILD);return}
  if(ms.some(unavailable)){if(!atG)stepToward(p,GUILD);return}
  if(p.dest&&near(p.pos,p.dest)<2){encounter(p,ev);p.dest=null}
  const here=members(p);
  if(!here.length||here.some(unavailable))return;
  const c=S.board.filter(q=>!q.crisis&&!q.boss&&chance(here,q)>=AUTO_ODDS).sort((a,b)=>near(p.pos,locOf(a.place))-near(p.pos,locOf(b.place)))[0];
  if(c){startMission(p,c,'auto');return}
  if(!p.dest)p.dest=roamPoint(p.pos);
  p.at='field';
  stepToward(p,p.dest);
}

export function endDay(){
  if(S.over)return;
  const ev=[];
  S.heroes.forEach(h=>{
    if(h.injured>0)h.injured=Math.max(0,h.injured-(h.virtue==='vigorous'?2:1));
    if(h.rest>0)h.rest--;
  });
  const wages=Math.round(S.heroes.reduce((s,h)=>s+h.wage,0)*efx('wage',1));
  gold(-wages,'Daily wages','wages');
  if(wages)ev.push({k:'info',q:true,t:`Paid ${wages} gold in wages.`});
  if(S.gold<0){
    const idle=S.heroes.filter(h=>status(h)==='ready');
    if(idle.length){
      const h=pick(idle);
      S.heroes=S.heroes.filter(x=>x!==h);
      S.parties.forEach(p=>p.members=p.members.filter(id=>id!==h.id));
      ev.push({k:'loss',t:`You could not pay ${h.name}. They quit the guild.`});
    }
  }
  S.parties.forEach(p=>{
    if(p.mission){
      p.mission.daysLeft--;
      if(p.mission.daysLeft<=0)resolve(p,ev);
      else tickMission(p,ev);
    }
    if(!p.mission)autoStep(p,ev);
  });
  if(rank()>=BOSS_RANK&&!S.bossSpawned){
    S.bossSpawned=true;S.board.push(makeBossQuest());
    ev.push({k:'rank',t:`A dread omen: ${BOSSES[S.boss].n} has awakened. ${BOSSES[S.boss].lore} A final quest is now on the board.`});
  }
  const before=S.board.length;
  S.board.forEach(q=>{if(!q.boss&&!q.crisis)q.expires--});
  S.board=S.board.filter(q=>q.boss||q.crisis||q.expires>0);
  if(S.board.length<before)ev.push({k:'info',t:`${before-S.board.length} quest(s) expired on the board.`});
  const cr=S.board.find(q=>q.crisis);
  if(cr){
    cr.expires--;
    if(cr.expires<=0){
      S.over=true;S.overReason=`You never answered "${cr.title}". ${cr.stake} The realm turned on your guild.`;
      ev.push({k:'death',t:`The deadline passed. "${cr.title}" went unanswered.`});
      S.board=S.board.filter(q=>q!==cr);
    }else if(cr.expires===15||cr.expires===10)ev.push({k:'loss',t:`Crisis: ${cr.expires} days left to answer "${cr.title}".`});
    else if(cr.expires===5||cr.expires===2)ev.push({k:'rank',t:`FINAL WARNING: only ${cr.expires} days left to answer "${cr.title}". Send a party now.`});
  }else if(!S.over&&!S.parties.some(p=>p.mission&&p.mission.quest.crisis)&&S.day>=S.nextCrisis){
    const c=makeCrisis();
    S.board.push(c);S.nextCrisis=S.day+c.expires+ri(12,20);
    ev.push({k:'rank',t:`CRISIS: ${c.title}. ${c.stake} Send a party within ${c.expires} days and win, or your guild is lost.`});
  }
  fillBoard();refreshTavern(2);
  S.day++;
  if(!S.heroes.length&&S.gold<50){S.over=true;ev.push({k:'death',t:'You have no heroes and no gold to hire more. The guild is finished.'})}
  ev.forEach(e=>{if(!e.m)note(e.t,null,S.day-1)});
  ev.filter(e=>!e.q).forEach(pushToast);
  nextModal();
}
export let toastId=0;
export function pushToast(e){
  ui.toasts.push({id:++toastId,k:e.k,t:e.t,until:Date.now()+(e.k==='death'||e.k==='rank'?15000:7000)});
  if(ui.toasts.length>7)ui.toasts.shift();
}
export function nextModal(){
  if(S.over)ui.modal={type:'over'};
  else if(S.vic===1){S.vic=2;ui.modal={type:'victory'}}
  else ui.modal=null;
}

/* ---------- legacy (carries across runs) ---------- */
export const calcLegacy=()=>rank()*10+Math.floor(S.stats.won/2)+Math.floor(S.day/10)+(S.vic?80:0);
export function loadMeta(){
  M={legacy:0,total:0,perks:{},runs:[],hall:[]};
  try{const d=JSON.parse(localStorage.getItem(MKEY));if(d&&d.perks)M=d}catch(e){}
  M.hall=M.hall||[];
}
export function saveMeta(){try{localStorage.setItem(MKEY,JSON.stringify(M))}catch(e){}}
export function bankLegacy(){
  if(S.paid)return;
  const gain=calcLegacy();
  S.paid=true;S.gain=gain;
  M.legacy+=gain;M.total+=gain;
  M.runs.unshift({day:S.day,rank:RANKS[rank()].l,won:S.stats.won,vic:!!S.vic,gain,era:era().n});
  M.runs=M.runs.slice(0,8);
  S.heroes.filter(h=>(h.story||[]).length>=2).sort((a,b)=>(b.rep||0)-(a.rep||0)).slice(0,3).forEach(h=>M.hall.unshift(hallEntry(h)));
  M.hall=M.hall.slice(0,12);
  saveMeta();
}


/* ---------- store: React subscribes to these ---------- */
const subs=new Set(),tsubs=new Set();let ver=0,tver=0;
export const subscribe=cb=>{subs.add(cb);return()=>subs.delete(cb)};
export const subscribeTick=cb=>{tsubs.add(cb);return()=>tsubs.delete(cb)};
export const getVersion=()=>ver;
export const getTickVersion=()=>tver;
export function saveNow(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){/* storage blocked */}}
export function bump(){ver++;saveNow();subs.forEach(f=>f())}
function tickBump(){tver++;tsubs.forEach(f=>f())}

/* ---------- map view, progress ---------- */
export function progress(p){const m=p.mission,t=m.total||m.quest.days;return clamp((t-m.daysLeft+ui.frac)/t*100,0,100)}
export function setView(x,y,w){
  w=clamp(w,150,MAPW);const h=w*MAPH/MAPW;
  x=clamp(x,0,MAPW-w);y=clamp(y,0,MAPH-h);
  ui.mv={x,y,w};tickBump();
}
export function zoomBy(f,fx,fy){
  fx=fx===undefined?.5:fx;fy=fy===undefined?.5:fy;
  const v=ui.mv,nw=clamp(v.w/f,150,MAPW),h=v.w*MAPH/MAPW,nh=nw*MAPH/MAPW;
  setView(v.x+(v.w-nw)*fx,v.y+(h-nh)*fy,nw);
}

/* ---------- live clock ---------- */
export const DAY_MS=7000;
let lastT=0,timer=null;
function loop(){
  const now=performance.now(),dt=Math.min(250,now-lastT);lastT=now;
  if(!S)return;
  const nt=ui.toasts.length;
  ui.toasts=ui.toasts.filter(t=>t.until>Date.now());
  if(ui.toasts.length!==nt)bump();
  if(ui.advancing){
    if(S.over||S.setup){ui.advancing=false;ui.frac=0;bump();return}
    ui.frac+=dt/1100;
    if(ui.frac>=1){ui.frac=0;ui.advancing=false;endDay();bump()}
    else tickBump();
    return;
  }
  if(ui.mode!=='live')return;
  if(S.over||S.setup||ui.modal||ui.paused||document.hidden)return;
  ui.frac+=dt*ui.speed/DAY_MS;
  if(ui.frac>=1){ui.frac=0;endDay();bump()}
  else tickBump();
}
export function startClock(){
  if(timer)return()=>{};
  lastT=performance.now();timer=setInterval(loop,100);
  return()=>{clearInterval(timer);timer=null};
}

/* ---------- input fields ---------- */
export function setCreateField(f,i,v){
  if(!ui.create)return;
  if(f==='gname')ui.create.gname=v;
  else if(f==='pname')ui.create.pname=v;
  else if(f==='name')ui.create.slots[i].name=v;
  bump();
}
export function setSearch(v){ui.lq=v;ui.llim=60;bump()}

/* ---------- actions (every control in the UI goes through here) ---------- */
export function dispatch(act,a,b){
  switch(act){
    case 'tab':ui.tab=a;ui.drawer=a;ui.modal=null;ui.confirm=null;break;
    case 'drawer':ui.drawer=ui.drawer===a?null:a;ui.tab=a;break;
    case 'selectparty':ui.selectedParty=+a;ui.drawer='route';break;
    case 'rfilter':ui.rf=a==='reset'?{cls:'all',st:'all',sort:(ui.rf&&ui.rf.sort)||'tier'}:{cls:'all',st:'all',sort:'tier',...(ui.rf||{}),[a]:b};break;
    case 'expand':ui.exp=ui.exp||{};ui.exp[+a]=!ui.exp[+a];break;
    case 'cname':{const s=ui.create.slots[+a];s.name=pick(FIRST);break}
    case 'ccls':{const s=ui.create.slots[+a];s.cls=b;s.base=rollBase(b,s.tier);s.focus=topStat(b);break}
    case 'cfocus':ui.create.slots[+a].focus=b;break;
    case 'clook':{const [k,v]=b.split(':');ui.create.slots[+a].look[k]=+v;break}
    case 'cpos':ui.create.slots[+a].pos=b;break;
    case 'cneg':ui.create.slots[+a].neg=b;break;
    case 'creroll':rollTraits(ui.create.slots[+a]);break;
    case 'crand':{const g=ui.create.gname,pn=ui.create.pname;initCreate();ui.create.gname=g;ui.create.pname=pn;break}
    case 'cfound':foundGuild();break;
    case 'endday':if(!ui.advancing&&!ui.modal&&!S.over&&!S.setup)ui.advancing=true;break;
    case 'mode':
      ui.mode=ui.mode==='live'?'manual':'live';ui.paused=true;ui.advancing=false;ui.frac=0;
      try{localStorage.setItem(MODEKEY,ui.mode)}catch(e){}
      break;
    case 'mz':if(a==='fit')setView(0,0,MAPW);else zoomBy(a==='in'?1.5:1/1.5);break;
    case 'lv':ui.lv=a;break;
    case 'lf':ui.lf=a;ui.llim=60;break;
    case 'lmore':ui.llim=(ui.llim||60)+60;break;
    case 'gmore':ui.glim=(ui.glim||30)+40;break;
    case 'speed':if(a==='0')ui.paused=true;else{ui.paused=false;ui.speed=+a}break;
    case 'assign':ui.modal={type:'assign',qid:a};break;
    case 'send':{
      const q=S.board.find(x=>x.id==a),p=party(+b);
      if(q&&p&&!p.mission&&p.members.length&&!members(p).some(unavailable))startMission(p,q,'send');
      ui.modal=null;break;
    }
    case 'reroute':{
      const q=S.board.find(x=>x.id==a),p=party(+b);
      if(q&&p&&p.members.length&&!members(p).some(unavailable)){
        if(p.mission){S.board.push(p.mission.quest);sortBoard()}
        startMission(p,q,'reroute');
        ui.drawer=null;
      }
      break;
    }
    case 'recall':{const p=party(+a);if(p&&p.members.length){recallParty(p);ui.drawer=null}break}
    case 'roamon':{
      const p=party(+a);
      if(p&&!p.mission&&p.members.length){p.auto=true;p.recall=false;note(`${p.name} will roam the map and take quests on their own.`);ui.drawer=null}
      break;
    }
    case 'addslot':ui.modal={type:'addmember',pid:+a};break;
    case 'addhero':{
      const p=party(+a),h=hero(+b);
      if(p&&h&&atHome(p)&&p.members.length<4&&!h.party){p.members.push(h.id);h.party=p.id}
      if(p&&p.members.length>=4)ui.modal=null;
      break;
    }
    case 'remove':{
      const h=hero(+a),p=h&&party(h.party);
      if(p&&atHome(p)){p.members=p.members.filter(id=>id!==h.id);h.party=null}
      break;
    }
    case 'hire':{
      const h=S.tavern.find(x=>x.id==a);
      if(h&&S.gold>=h.cost&&S.heroes.length<rosterCap()){
        gold(-h.cost,`Hired ${h.name}`,'hiring');S.tavern=S.tavern.filter(x=>x!==h);delete h.cost;S.heroes.push(h);jot(h,`Hired from the tavern for ${S.guildName||'the guild'}.`,'moment',true);
        note(`Hired ${h.name}, a ${TIERS[h.tier].n} ${CLASSES[h.cls].n}.`);
      }
      break;
    }
    case 'reroll':if(S.gold>=20){gold(-20,'New faces at the tavern','hiring');S.tavern=[];refreshTavern(0)}break;
    case 'release':{
      const h=hero(+a);
      if(ui.confirm===h.id){
        S.heroes=S.heroes.filter(x=>x!==h);
        S.parties.forEach(p=>p.members=p.members.filter(id=>id!==h.id));
        note(`Released ${h.name}.`);ui.confirm=null;
      }else ui.confirm=h.id;
      break;
    }
    case 'relax':ui.modal={type:'relax',hid:+a};break;
    case 'dossier':ui.modal={type:'dossier',hid:+a};break;
    case 'dtab':if(ui.modal&&ui.modal.type==='dossier')ui.modal.tab=a;break;
    case 'relief':{
      const h=hero(+a),o=h&&reliefOpts(h).find(x=>x.id===b);
      if(h&&o&&S.gold>=o.cost&&status(h)!=='questing'&&status(h)!=='roaming'){
        gold(-o.cost,`${h.name}: ${o.n}`,'relief');h.rest=1;
        const ev=[];addStress(h,-o.amt,[h],ev);
        note(`${h.name} takes a day to relax (${o.n}). Stress -${o.amt}.`);
        ev.forEach(x=>note(x.t));
      }
      ui.modal=null;break;
    }
    case 'build':{
      const b0=BLD.find(x=>x.id===a),cost=b0.cost[bl(a)];
      if(cost!==undefined&&S.gold>=cost){gold(-cost,`Upgrade: ${b0.n}`,'upgrade');S.bld[a]=bl(a)+1;note(`${b0.n} upgraded to level ${S.bld[a]}.`)}
      break;
    }
    case 'accept':{
      const o=S.offers[0];
      if(o&&S.heroes.length<rosterCap()){S.heroes.push(o.hero);jot(o.hero,`Joined the guild. ${o.hero.name.split(' ')[0]} ${o.why.replace(/, no fee\.?$/,'')}.`,'moment',true);S.offers.shift();note(`${o.hero.name} joined the guild.`);nextModal()}
      break;
    }
    case 'decline':S.offers.shift();nextModal();break;
    case 'next':nextModal();break;
    case 'close':case 'backdrop':ui.modal=null;break;
    case 'hardcore':S.hardcore=!S.hardcore;break;
    case 'help':ui.modal={type:'intro'};break;
    case 'legacy':ui.modal={type:'legacy'};break;
    case 'retire':ui.modal={type:'retire'};break;
    case 'claim':bankLegacy();ui.modal={type:'legacy',between:true};break;
    case 'buyperk':{
      const p=PERKS.find(x=>x.id===a),cost=p.cost[perk(a)];
      if(cost!==undefined&&M.legacy>=cost){M.legacy-=cost;M.perks[a]=perk(a)+1;saveMeta()}
      break;
    }
    case 'begin':{const first=!M.runs.length;ui={tab:'quests',drawer:null,selectedParty:null,modal:null,confirm:null,speed:1,paused:ui.mode!=='live',frac:0,toasts:[],exp:{},mode:ui.mode,advancing:false,mv:{x:0,y:0,w:640}};newGame();ui.introAfter=first;break}
  }

  if(act!=='release'&&act!=='tab')ui.confirm=null;
  bump();
}

/* ---------- boot ---------- */
export function initGame(){
  loadMeta();
  let loaded=false;
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){const d=JSON.parse(raw);if(d&&d.v===2&&Array.isArray(d.heroes)){S=d;loaded=true}}
  }catch(e){}
  if(loaded){
    if(S.nextCrisis===undefined)S.nextCrisis=S.day+ri(10,16);
    S.ledger=S.ledger||[];
    if(!S.ledger.length)S.ledger.push({d:S.day,n:S.gold,why:'Balance when the ledger began',c:'open',bal:S.gold});
    S.heroes.forEach(h=>{h.rep=h.rep||0;h.quests=h.quests||0;h.story=h.story||[];h.journal=h.journal||[];h.unread=h.unread||0;delete h.pend});
    if(!S.setup){
      const ev0=[];
      S.parties.forEach(p=>{
        if(!p.mission)return;
        (p.mission.ev||[]).filter(x=>x.pending).forEach(me=>runDecision(p,me.did,me.day,ev0,me));
      });
      S.pending=[];S.storyQ=[];
      S.heroes.forEach(h=>checkStory(h,ev0));
    }
    S.fallen.forEach(f=>{f.title=f.title||'';f.rep=f.rep||'Unknown'});
    S.parties.forEach(p=>{
      p.pos=p.pos||{x:GUILD.x,y:GUILD.y};
      p.leg=p.leg||{from:{...p.pos},to:{...p.pos}};
      p.at=p.at||(p.mission?'field':'home');
      if(p.auto===undefined)p.auto=!!p.mission;
      p.recall=!!p.recall;p.dest=p.dest||null;
      if(p.mission&&!p.mission.origin)p.mission.origin={x:GUILD.x,y:GUILD.y};
    });
  }
  if(!loaded){newGame();ui.introAfter=true}
  else if(S.setup){initCreate()}
  else nextModal();
  if(typeof window!=='undefined'&&window.innerWidth<700)ui.mv={x:GUILD.x-220,y:GUILD.y-148,w:440};
  saveNow();
}

export const reliefOpts=h=>{
  const b=5*perk('hearth');
  const o=[{id:'free',n:'Rest at home',cost:0,amt:8+b,d:'A quiet day off.'},{id:'pub',n:'Drink at the pub',cost:25,amt:20+b,d:'Loud, cheap and surprisingly effective.'}];
  if(bl('chapel'))o.push({id:'chapel',n:'Pray at the chapel',cost:50,amt:30+10*bl('chapel')+b,d:'Calm and clarity.'});
  return o;
};
