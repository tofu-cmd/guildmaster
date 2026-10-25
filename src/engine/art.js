export function pix(rows,pal,size,w,h){
  let r='';
  rows.forEach((row,y)=>{for(let x=0;x<row.length;x++){const c=pal[row[x]];if(c)r+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`}});
  return `<svg class="pix" viewBox="0 0 ${w} ${h}" width="${size}" height="${Math.round(size*h/w)}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}
export const CPAL={warrior:{b:'#b0463a',h:'#9aa5ad'},mage:{b:'#5b6fd1',h:'#3a3f8a'},rogue:{b:'#6a4a8a',h:'#2b2336'},cleric:{b:'#d8d2bf',h:'#d4aa4f'},ranger:{b:'#4c8a5b',h:'#6b4a2b'},paladin:{b:'#8aa0d8',h:'#d4aa4f'},bard:{b:'#c9577a',h:'#7a3b5a'}};
export const TCOL=['#a3adb5','#72c177','#5ea6ec','#b97cef','#f3a93c'];
export const BASE=['....hhh....','...hhhhh...','...sssss...','...seses...','....sss....','..bbbbbbb..','.sbbbbbbbs.','.sbbbbbbbs.','..ddddddd..','..bbbbbbb..','...ll.ll...','...ll.ll...'];
export const line=(x,y0,y1,k)=>{const a=[];for(let y=y0;y<=y1;y++)a.push([x,y,k]);return a};
export const WEAPON={
  warrior:[...line(10,1,5,'w'),[10,6,'t'],...line(0,6,8,'k')],
  mage:[...line(10,2,11,'t'),[10,1,'o']],
  rogue:line(10,6,8,'w'),
  cleric:[[5,6,'x'],[4,7,'x'],[5,7,'x'],[6,7,'x'],...line(0,3,11,'t'),[0,2,'x']],
  ranger:line(10,2,9,'t'),
  paladin:[...line(10,2,6,'w'),[10,7,'t'],...line(0,6,9,'x'),[5,6,'x'],[4,7,'x'],[5,7,'x'],[6,7,'x']],
  bard:[...line(10,4,6,'t'),[10,7,'x'],[10,8,'x'],[9,8,'x'],[9,7,'x']]
};
export const spriteCache={};
export const SKINS=['#f1cfae','#e0b48a','#bd8a5e','#7d5438'];
export const CLOTHS=[null,'#b0463a','#5b6fd1','#4c8a5b','#6a4a8a','#8a8f98'];
export const HAIRS=[null,'#2b2336','#6b4a2b','#c9a24b','#b0463a','#d9d9d9'];
export const SKIN_N=['Fair','Tan','Brown','Deep'];
export function sprite(cls,tier,size,look){
  const lk=look||{};
  const key=`${cls}${tier}${size}-${lk.skin||0}-${lk.cloth||0}-${lk.hair||0}`;
  if(spriteCache[key])return spriteCache[key];
  const g=BASE.map(r=>r.split(''));
  WEAPON[cls].forEach(([x,y,k])=>{g[y][x]=k});
  const c=CPAL[cls];
  const pal={h:HAIRS[lk.hair||0]||c.h,b:CLOTHS[lk.cloth||0]||c.b,s:SKINS[lk.skin||0],e:'#16181d',d:TCOL[tier],l:'#3a3a48',w:'#cfd6dc',t:'#8a6a3a',o:'#7ad7ff',x:'#d4aa4f',k:'#6b4a2b'};
  return spriteCache[key]=pix(g.map(r=>r.join('')),pal,size,11,12);
}
export const ICONS={
  fight:{p:{w:'#cfd6dc',b:'#8a6a3a'},r:['w......w','.w....w.','..w..w..','...ww...','...ww...','..w..w..','.bw..wb.','bb....bb']},
  skull:{p:{w:'#e7e1d1',k:'#14171c'},r:['.wwwwww.','wwwwwwww','wkkwwkkw','wkkwwkkw','wwwkkwww','.wwwwww.','..wkwkw.','..wwwww.']},
  chest:{p:{b:'#8a6a3a',g:'#e0b83e',d:'#5a4426'},r:['........','.dddddd.','bbbbbbbb','bbbggbbb','gggggggg','bbbggbbb','bbbbbbbb','dddddddd']},
  camp:{p:{r:'#e2603a',o:'#f3c13c',b:'#8a6a3a'},r:['...r....','..rr.r..','.rrrrrr.','.rroorr.','..rooor.','...oo...','bbbbbbbb','.b....b.']},
  trap:{p:{w:'#cfd6dc',b:'#6a5a48'},r:['........','........','w..w..w.','w..w..w.','ww.ww.ww','ww.ww.ww','bbbbbbbb','bbbbbbbb']},
  scroll:{p:{y:'#e7d9a8',k:'#6b5a2e'},r:['..yyyyyy','.yyyyyyy','.ykkkkky','.yyyyyyy','.ykkkkyy','.yyyyyyy','.ykkkyyy','yyyyyy..']},
  heal:{p:{g:'#7fb069'},r:['...gg...','...gg...','...gg...','gggggggg','gggggggg','...gg...','...gg...','...gg...']},
  boss:{p:{r:'#c9473a',y:'#f3c13c',w:'#e7e1d1'},r:['r......r','rr....rr','.rrrrrr.','rryrryrr','rrrrrrrr','.rwwwwr.','.rwrrwr.','..rrrr..']},
  flag:{p:{b:'#8a6a3a',f:'#d4aa4f'},r:['bffffff.','bfffffff','bffffff.','b.......','b.......','b.......','b.......','bbb.....']},
  road:{p:{w:'#a3adb5'},r:['........','..ww....','..ww..ww','......ww','..ww....','..ww..ww','......ww','........']},
  arrow:{p:{w:'#cfd6dc',b:'#8a6a3a'},r:['......ww','.....www','....ww.w','...ww...','..ww....','.bb.....','bb......','b.......']}
};
export const icon=(n,size)=>pix(ICONS[n].r,ICONS[n].p,size,8,8);
