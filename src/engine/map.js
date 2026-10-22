import {PLACE,TOWNS,MAPW,MAPH} from './data.js';
export const GUILD={x:320,y:222};
export const PCOL=['#d4aa4f','#5ea6ec','#b97cef','#72c177','#dc6652'];
export const LOC={};
(function(){
  const rx=[95,145,195,245,290],ry=[60,92,122,150,178];
  PLACE.forEach((arr,b)=>arr.forEach((n,i)=>{const a=(i*90+b*41+25)*Math.PI/180;LOC[n]={x:Math.round(GUILD.x+rx[b]*Math.cos(a)),y:Math.round(GUILD.y+ry[b]*Math.sin(a))}}));
  TOWNS.forEach((n,i)=>{const a=(i*60+10)*Math.PI/180;LOC[n]={x:Math.round(GUILD.x+125*Math.cos(a)),y:Math.round(GUILD.y+80*Math.sin(a))}});
  LOC['the Drowned Throne']={x:560,y:62};
})();
export const hashStr=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
export const locOf=place=>LOC[place]||{x:GUILD.x+60+hashStr(place)%140,y:GUILD.y-60-hashStr(place+'y')%110};
export function route(place,origin){
  const L=locOf(place),G=origin||GUILD,dx=L.x-G.x,dy=L.y-G.y,len=Math.hypot(dx,dy)||1,off=(hashStr(place)%70)-35;
  return {G,L,C:{x:(G.x+L.x)/2-dy/len*off,y:(G.y+L.y)/2+dx/len*off}};
}
export const bez=(r,t)=>{const u=1-t;return {x:u*u*r.G.x+2*u*t*r.C.x+t*t*r.L.x,y:u*u*r.G.y+2*u*t*r.C.y+t*t*r.L.y}};
export const routeD=r=>`M${r.G.x} ${r.G.y}Q${r.C.x.toFixed(1)} ${r.C.y.toFixed(1)} ${r.L.x} ${r.L.y}`;
export const svgAt=(svg,x,y)=>svg.replace('<svg class="pix"',`<svg class="pix" x="${x}" y="${y}"`);
export let terrainCache='';
export function terrain(){
  if(terrainCache)return terrainCache;
  let seed=7;const rr=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  let s=`<rect width="${MAPW}" height="${MAPH}" fill="#1b150f"/>`;
  for(let i=0;i<14;i++)s+=`<ellipse cx="${(rr()*MAPW).toFixed(0)}" cy="${(rr()*MAPH).toFixed(0)}" rx="${(40+rr()*60).toFixed(0)}" ry="${(20+rr()*35).toFixed(0)}" fill="#241b13" opacity=".7"/>`;
  s+=`<path d="M0 95C90 125 150 60 240 112S380 190 430 252S560 360 640 332" fill="none" stroke="#3b4a4f" stroke-width="10" opacity=".9"/>`;
  for(let i=0;i<15;i++){const x=30+rr()*580,y=16+rr()*42;s+=`<path d="M${(x-12).toFixed(0)} ${(y+11).toFixed(0)}L${x.toFixed(0)} ${(y-9).toFixed(0)}L${(x+12).toFixed(0)} ${(y+11).toFixed(0)}z" fill="#5b4d40"/><path d="M${(x-3.5).toFixed(0)} ${(y-2).toFixed(0)}L${x.toFixed(0)} ${(y-9).toFixed(0)}L${(x+3.5).toFixed(0)} ${(y-2).toFixed(0)}z" fill="#e6d3a6"/>`}
  for(let i=0;i<75;i++){
    const x=rr()*MAPW,y=70+rr()*(MAPH-80);
    if(Math.hypot(x-GUILD.x,y-GUILD.y)<42)continue;
    s+=`<path d="M${x.toFixed(0)} ${(y-8).toFixed(0)}l5 9h-10z" fill="${rr()<.5?'#3a3820':'#4a4527'}"/>`;
  }
  return terrainCache=s;
}
