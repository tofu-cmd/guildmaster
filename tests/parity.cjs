const { chromium } = require('playwright');
async function run(url,days,burn){
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport:{width:1200,height:900}});
  await ctx.addInitScript((n)=>{
    let a=123456789;
    Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    for(let i=0;i<n;i++)Math.random();
  },burn);
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);
  await p.click('text=Found the guild'); await p.click('text=Let’s go');
  const modals=async()=>{for(let k=0;k<10;k++){
    const t=await p.evaluate(()=>{const m=document.querySelector('.modal h2');return m&&m.textContent});if(!t)return;
    let d=false;for(const sel of ['button:has-text("Welcome them")','button:has-text("Continue")','button:has-text("Claim legacy")','button:has-text("Begin a new run")','button:has-text("Let’s go")','button:has-text("Close")','button:has-text("Cancel")']){
      const e=await p.$(sel);if(e&&await e.isEnabled()){await e.click();d=true;break;}}
    if(!d){const e=await p.$('button:has-text("Turn away")');if(e){await e.click();d=true}}
    if(!d)return;}};
  for(let d=0;d<days;d++){
    const pins=await p.$$('.pin');
    if(pins.length&&!(await p.$$('.mission')).length){await pins[0].click();const s=await p.$('.modal button:has-text("Send")');if(s)await s.click();else await modals();}
    const eb=await p.$('button:has-text("End Day")'); if(!eb){await modals();break;}
    await eb.click(); await p.waitForTimeout(1250); await modals();
  }
  const st=await p.evaluate(()=>localStorage.getItem('guildmaster-save-v2'));
  await b.close();
  return {st:JSON.parse(st),errs};
}
(async()=>{
  const days=+process.argv[2]||30,burn=+process.argv[3]||0;
  const a=await run('file://'+require('path').resolve(__dirname,'../legacy/index.html'),days,burn);
  const b=await run('http://localhost:4173/',days,0);
  const A=a.st,B=b.st;
  const keys=['day','gold','renown','heroes','parties','board','tavern','log','ledger','stats','fallen','offers','eraId','boss','bld','guildName','over'];
  let same=true;
  for(const k of keys){const x=JSON.stringify(A[k]),y=JSON.stringify(B[k]);if(x!==y){same=false;console.log('DIFF in',k,(x||'').length,(y||'').length);}}
  console.log('legacy day',A.day,'gold',A.gold,'| react day',B.day,'gold',B.gold);
  console.log(same?'PARITY OK: identical game state':'PARITY MISMATCH','errors',a.errs,b.errs);
})();
