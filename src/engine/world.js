import {PLACE,ERAS,BOSSES,MAPW,MAPH} from './data.js';
import {GUILD} from './map.js';

/* A world is a pure function of its seed: same seed, same map, towns, era and final boss. */
function xmur3(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^=h>>>16)>>>0}}
export function seedRng(seed){
  let a=xmur3(String(seed).trim().toLowerCase())();
  return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
}
const W1=['ember','ash','iron','raven','hollow','gilded','frost','thorn','crimson','pale','storm','amber'];
const W2=['crown','hearth','vale','fang','tide','spire','mire','keep','wolf','lantern','forge','barrow'];
export const randomSeed=()=>`${W1[Math.floor(Math.random()*W1.length)]}-${W2[Math.floor(Math.random()*W2.length)]}-${Math.floor(Math.random()*900+100)}`;

const PRE=['Hollow','Ash','Grey','Dun','Kettle','Stone','Wolf','Raven','Elder','Mist','Briar','Cinder','Salt','Marsh','Oak','Frost','Rook','Amber'];
const SUF=['mere','ford','water','moor','brook','wick','haven','stead','ham','cross','gate','fell','wood','bridge','holm'];
const INNS=['The Wanderer’s Rest','The Gilded Goose','The Hanged Crow','The Sleeping Giant','The Copper Kettle','The Salted Eel','The Lantern & Lamb','The Tilted Crown','The Weary Boot','The Three Candles'];
export const KINDS={
  hamlet:{n:'Hamlet',inn:4,relief:10,heal:0,d:'A few cottages and a bunk room. Calms nerves, no healer.'},
  village:{n:'Village',inn:7,relief:15,heal:1,d:'A decent inn and a herbwife. Calms nerves and speeds recovery.'},
  town:{n:'Town',inn:11,relief:20,heal:2,d:'Warm beds, a proper healer and a temple. The best rest in the realm.'}
};
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const shuf=(r,a)=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};

export function genWorld(seed){
  seed=String(seed||'').trim()||'nameless';
  const r=seedRng(seed),rx=[95,145,195,245,290],ry=[60,92,122,150,178],locs={};
  PLACE.forEach((arr,b)=>arr.forEach((n,i)=>{
    const a=((i*90+b*41+25)+(r()*34-17))*Math.PI/180,k=1+(r()*.16-.08);
    locs[n]={x:Math.round(Math.min(MAPW-30,Math.max(30,GUILD.x+rx[b]*k*Math.cos(a)))),y:Math.round(Math.min(MAPH-34,Math.max(54,GUILD.y+ry[b]*k*Math.sin(a))))};
  }));
  locs['the Drowned Throne']={x:Math.round(540+r()*50),y:Math.round(56+r()*22)};
  const all=Object.values(locs),pts=[],towns=[];
  const names=shuf(r,PRE.flatMap(p=>SUF.map(s=>p+s))),inns=shuf(r,INNS),used=new Set();
  for(let i=0;i<7&&names.length;i++){
    let best=null;
    for(let t=0;t<250&&!best;t++){
      const p={x:Math.round(50+r()*(MAPW-100)),y:Math.round(84+r()*(MAPH-124))};
      if(near(p,GUILD)<75||all.some(l=>near(p,l)<40)||pts.some(l=>near(p,l)<70))continue;
      best=p;
    }
    if(!best)break;
    pts.push(best);
    let nm=names.shift();while(used.has(nm)&&names.length)nm=names.shift();used.add(nm);
    const roll=r(),kind=roll<.42?'hamlet':roll<.8?'village':'town',K=KINDS[kind];
    towns.push({id:i+1,name:nm,kind,x:best.x,y:best.y,tavern:inns[i%inns.length],inn:K.inn,relief:K.relief,heal:K.heal,found:false,visits:0});
  }
  if(towns.length){
    const cand=towns.filter(t=>near(t,GUILD)>=90),first=(cand.length?cand:towns).sort((a,b)=>near(a,GUILD)-near(b,GUILD))[0];
    first.found=true;
    if(first.kind==='town'){first.kind='village';Object.assign(first,{inn:KINDS.village.inn,relief:KINDS.village.relief,heal:KINDS.village.heal})}
  }
  return {seed,eraId:ERAS[Math.floor(r()*ERAS.length)].id,boss:Math.floor(r()*BOSSES.length),locs,towns};
}
