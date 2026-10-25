export const STATS=['might','magic','agility','wits'];
export const SL={might:'Might',magic:'Magic',agility:'Agility',wits:'Wits'};
export const SS={might:'MIT',magic:'MAG',agility:'AGI',wits:'WIT'};
export const CLASSES={
  warrior:{n:'Warrior',base:{might:8,magic:1,agility:3,wits:2},role:'Front-line bruiser. Huge Might.'},
  mage:{n:'Mage',base:{might:1,magic:8,agility:2,wits:3},role:'Spell damage. Huge Magic.'},
  rogue:{n:'Rogue',base:{might:3,magic:1,agility:8,wits:3},role:'Fast and sneaky. Huge Agility.'},
  cleric:{n:'Cleric',base:{might:2,magic:5,agility:2,wits:5},role:'Healer. Halves injury and death risk for the whole party.'},
  ranger:{n:'Ranger',base:{might:4,magic:2,agility:6,wits:4},role:'Well-rounded archer.'},
  paladin:{n:'Paladin',lock:true,base:{might:6,magic:3,agility:1,wits:4},role:'Holy knight. Party gains 15% less stress.'},
  bard:{n:'Bard',lock:true,base:{might:1,magic:3,agility:4,wits:7},role:'Calms nerves. Party gains 20% less stress.'}
};
export const TIERS=[
  {n:'Common',mult:1,hire:60,wage:2},{n:'Uncommon',mult:1.6,hire:180,wage:5},
  {n:'Rare',mult:2.5,hire:550,wage:12},{n:'Epic',mult:4,hire:1700,wage:30},{n:'Legendary',mult:6.5,hire:5500,wage:70}
];
export const RT=[0,40,150,400,900,1800,3500,6500];
export const RANKS=[{l:'F',n:'Ragged Tavern'},{l:'E',n:'Local Hall'},{l:'D',n:'Town Guild'},{l:'C',n:'Regional Guild'},{l:'B',n:'Famed Guild'},{l:'A',n:'Grand Guild'},{l:'S',n:'Royal Guild'},{l:'SS',n:'Legendary Guild'}];
export const TIER_CAP=[0,1,1,2,2,3,3,4];
export const BOSS_RANK=6;
export const FIRST=['Aldric','Brea','Cael','Dara','Edda','Fenn','Garrick','Hana','Isolde','Joren','Kestrel','Lyra','Marek','Nessa','Orin','Pell','Quill','Rhea','Soren','Tamsin','Ulric','Vesper','Wren','Yara','Zeph','Bram','Corin','Dunya','Eryk','Freya'];
export const EPI=['the Unbroken','Ashbringer','of the Hollow','Stormcaller','the Grim','Dawnwarden','Oathkeeper','the Pale','Gravewalker','Emberhand','the Swift','Skyrender'];
export const PARTY_NAMES=['Iron Wolves','Ember Company','Grey Lanterns','Thorn and Crow','Silver Pact'];
export const QTYPES=[
  {k:'Monster hunt',w:{might:.6,agility:.25,wits:.15},f:(m)=>`Slay the ${m}`},
  {k:'Dungeon delve',w:{agility:.4,magic:.3,wits:.3},f:(m,p)=>`Delve into ${p}`},
  {k:'Escort',w:{might:.4,agility:.2,wits:.4},f:(m,p)=>`Escort a caravan past ${p}`},
  {k:'Arcane work',w:{magic:.6,wits:.4},f:(m,p)=>`Recover the relic of ${p}`},
  {k:'Bounty',w:{agility:.5,might:.3,wits:.2},f:(m,p)=>`Bounty: ${m} near ${p}`}
];
export const MON=[
  ['Giant Rats','Goblin Scouts','Wolf Pack','Bog Imps'],
  ['Bandit Gang','Ogre','Skeleton Patrol','Harpies'],
  ['Cave Troll','Wraith','Young Drake','Cult Mages'],
  ['Demon Knight','Lich','Wyrm','Stone Giant'],
  ['Elder Dragon','Void Titan','Archdemon','Hydra Queen']
];
export const PLACE=[
  ['the Old Cellar','Mossy Culvert','Farmer Hale’s Field','the Pale Woods'],
  ['Ashen Mine','Bandit Pass','the Sunken Crypt','Thornwood'],
  ['Gloam Keep','the Ruined Abbey','Cinder Fen','Frost Barrow'],
  ['Obsidian Citadel','the Drowned Temple','Bone Spire','the Ember Throne'],
  ['the Black Sun Vault','Worldsplit Chasm','the Dreaming Abyss','Dragon’s Crown']
];
export const BOSSES=[
  {n:'Vorathrax, the Black Sun Dragon',place:'the Black Sun Vault',w:{might:.4,magic:.3,agility:.1,wits:.2},lore:'A dragon whose shadow has swallowed three towns.'},
  {n:'The Hollow King',place:'the Drowned Throne',w:{magic:.5,wits:.3,might:.2},lore:'A dead monarch who raises the drowned to his court.'},
  {n:'The Maw Beneath',place:'Worldsplit Chasm',w:{agility:.35,might:.35,wits:.3},lore:'Something vast has been chewing up the roads from below.'}
];
export const ERAS=[
  {id:'plague',n:'Year of Plague',d:'Injuries last 1 day longer. Gold rewards +25%.',fx:{heal:1,gold:1.25}},
  {id:'rush',n:'Gold Rush',d:'Gold rewards +35%, wages +30%.',fx:{gold:1.35,wage:1.3}},
  {id:'haunt',n:'Haunted Age',d:'Stress gain +30%. Renown rewards +25%.',fx:{stress:1.3,renown:1.25}},
  {id:'peace',n:'Quiet Years',d:'Quests are 10% easier. Gold rewards -15%.',fx:{diff:.9,gold:.85}},
  {id:'war',n:'Time of War',d:'Quests are 12% harder. Renown rewards +30%.',fx:{diff:1.12,renown:1.3}}
];
export const QUIRKS={
  lucky:{n:'Lucky',pos:1,d:'+3% quest odds',fx:{odds:.03}},
  stoic:{n:'Stoic',pos:1,d:'Gains 30% less stress',fx:{stress:.7}},
  tough:{n:'Tough',pos:1,d:'30% less likely to be injured',fx:{injury:.7}},
  quick:{n:'Quick Learner',pos:1,d:'+30% XP',fx:{xp:1.3}},
  frugal:{n:'Frugal',pos:1,d:'Wage 30% lower',fx:{wage:.7}},
  slayer:{n:'Monster Slayer',pos:1,d:'+6% odds on monster hunts and bounties',fx:{type:{'Monster hunt':.06,'Bounty':.06}}},
  scholar:{n:'Scholar',pos:1,d:'+6% odds on delves and arcane work',fx:{type:{'Dungeon delve':.06,'Arcane work':.06}}},
  guide:{n:'Trailwise',pos:1,d:'+7% odds on escort quests',fx:{type:{'Escort':.07}}},
  inspire:{n:'Inspiring',pos:1,d:'The whole party gains 10% less stress',fx:{pstress:.9}},
  coward:{n:'Coward',d:'Gains 40% more stress',fx:{stress:1.4}},
  greedy:{n:'Greedy',d:'Wage 40% higher',fx:{wage:1.4}},
  clumsy:{n:'Clumsy',d:'-3% quest odds',fx:{odds:-.03}},
  frail:{n:'Frail',d:'50% more likely to be injured',fx:{injury:1.5}},
  hothead:{n:'Hot-headed',d:'Gains 20% more stress, -5% odds on escorts',fx:{stress:1.2,type:{'Escort':-.05}}},
  dull:{n:'Slow Learner',d:'-30% XP',fx:{xp:.7}},
  jinxed:{n:'Jinxed',d:'-5% odds on delves and arcane work',fx:{type:{'Dungeon delve':-.05,'Arcane work':-.05}}},
  gloomy:{n:'Gloomy',d:'The whole party gains 10% more stress',fx:{pstress:1.1}}
};
export const AFFL={
  fearful:{n:'Fearful',d:'Stats -15% until stress falls to 20.'},
  paranoid:{n:'Paranoid',d:'-3% quest odds until stress falls to 20.'},
  selfish:{n:'Selfish',d:'Skims 10% of quest gold until stress falls to 20.'},
  abusive:{n:'Abusive',d:'Adds stress to party mates after quests.'},
  irrational:{n:'Irrational',d:'Causes setbacks on the road.'}
};
export const VIRT={
  stalwart:{n:'Stalwart',d:'Gains half the stress.'},
  courageous:{n:'Courageous',d:'Stats +10%. Party gains 10% less stress.'},
  focused:{n:'Focused',d:'+4% quest odds.'},
  powerful:{n:'Powerful',d:'Stats +20%.'},
  vigorous:{n:'Vigorous',d:'Heals injuries twice as fast.'}
};
export const BLD=[
  {id:'chapel',n:'Chapel',d:'Heroes can pray here to shed stress (-40/-50/-60, 50 gold, one day).',cost:[150,400,900]},
  {id:'barracks',n:'Barracks',d:'+2 roster slots per level.',cost:[120,350,800]},
  {id:'infirmary',n:'Infirmary',d:'Injuries heal 1 day faster per level (minimum 1 day).',cost:[150,400,900]},
  {id:'training',n:'Training Hall',d:'+20% hero XP per level.',cost:[150,400,900]}
];
export const PERKS=[
  {id:'purse',n:'Old Savings',d:'+75 starting gold per level.',cost:[20,30,45,65]},
  {id:'fame',n:'Famous Name',d:'Start with +25 renown per level.',cost:[40,70]},
  {id:'haggle',n:'Silver Tongue',d:'Hiring costs 8% less per level.',cost:[25,40,60]},
  {id:'hearth',n:'Hearth Keepers',d:'Stress relief works +5 better per level.',cost:[30,45,70]},
  {id:'vet',n:'Veteran Recruit',d:'Start with an extra Uncommon hero.',cost:[40]},
  {id:'chapel',n:'Inherited Chapel',d:'Start with a level 1 Chapel.',cost:[80]},
  {id:'paladin',n:'Unlock: Paladin',d:'Paladins start appearing in taverns. They steady the party’s nerves.',cost:[60]},
  {id:'bard',n:'Unlock: Bard',d:'Bards start appearing in taverns. They soothe the party’s stress.',cost:[60]}
];
export const DECISIONS=[
  {icon:'skull',title:'Ambush at the pass',text:'Raiders spring from the rocks above the road.',o:[
    {l:'Fight back',p:.55,w:[.06,0,'The party breaks the ambush and presses on.'],f:[-.1,12,'The party is battered and shaken, but survives.']},
    {l:'Slip past in the shadows',c:'rogue',p:.85,w:[.04,0,'The rogue leads everyone around the raiders.'],f:[-.05,6,'The raiders spot them and a scuffle costs time.']},
    {l:'Rain arrows from cover',c:'ranger',p:.85,w:[.07,0,'Arrows scatter the raiders before they can charge.'],f:[-.05,5,'The shots go wide and the raiders close in.']},
    {l:'Fall back and regroup',s:[-.04,3,'The party loses half a day but keeps its nerve.']}]},
  {icon:'road',title:'Crossroads in the mist',text:'One path cuts through a marsh. The other is long but safe.',o:[
    {l:'Take the marsh shortcut',p:.5,w:[.08,0,'The shortcut saves a full day.'],f:[-.08,8,'The marsh swallows supplies and morale.']},
    {l:'Scry the marsh first',c:'mage',p:.85,w:[.08,-3,'A scrying spell reveals a dry line through the marsh.'],f:[-.02,2,'The vision is murky, so they take the long road.']},
    {l:'Take the long safe road',s:[0,0,'The long road is dull but uneventful.']}]},
  {icon:'scroll',title:'A humming shrine',text:'A weathered shrine glows with a faint light.',o:[
    {l:'Pray at the shrine',c:'cleric',p:.85,w:[.08,-10,'The shrine answers. Spirits lift across the party.'],f:[-.03,5,'The shrine stays silent and the party feels foolish.']},
    {l:'Loot the offerings',p:.45,w:[.04,0,'Hidden coins glint in the dust.',12],f:[-.08,10,'A curse settles over the party.']},
    {l:'Leave it alone',s:[0,0,'The party moves on, untouched.']}]},
  {icon:'heal',title:'A wounded stranger',text:'A traveler by the road begs for help.',o:[
    {l:'Tend the wounds',c:'cleric',p:.9,w:[.05,-6,'The grateful traveler shares a map and a purse.',8],f:[-.02,3,'The traveler was beyond saving.']},
    {l:'Help as best you can',p:.55,w:[.04,-3,'The traveler recovers and points out a safer path.'],f:[-.05,6,'It was a ruse. The traveler’s friends rob the party.']},
    {l:'Walk on',s:[0,5,'The party moves on. The guilt lingers.']}]},
  {icon:'camp',title:'A long night',text:'The party is exhausted and the light is fading.',o:[
    {l:'Make camp and rest',s:[-.03,-8,'A full night of sleep steadies everyone.']},
    {l:'Push on through the dark',p:.5,w:[.05,0,'The party gains ground by moonlight.'],f:[-.07,9,'Tired and stumbling, the party loses its way.']},
    {l:'Sing by the fire',c:'bard',p:.9,w:[.03,-14,'A song lifts every heart around the fire.'],f:[-.01,-4,'The song falls flat, but the rest helps.']},
    {l:'Hold a prayer vigil',c:'paladin',p:.9,w:[.03,-10,'Quiet prayer restores everyone’s resolve.'],f:[-.01,-3,'The vigil runs long, but nobody is hurt.']}]},
  {icon:'trap',title:'The floor gives way',text:'Old stone cracks under the party’s boots.',o:[
    {l:'Leap for solid ground',p:.5,w:[.05,0,'The party scrambles clear.'],f:[-.09,10,'Some of the party tumble into the dark.']},
    {l:'Disarm the mechanism',c:'rogue',p:.88,w:[.07,0,'The rogue stills the trap with a deft hand.'],f:[-.06,6,'The mechanism jams and the floor lurches.']},
    {l:'Brace the beams',c:'warrior',p:.85,w:[.06,0,'The warrior holds the ceiling while everyone crosses.'],f:[-.06,7,'The beams crack and everyone scrambles.']}]}
];
export const BAD_EVENTS=[
  {icon:'trap',t:'A hidden trap catches the party off guard.'},
  {icon:'skull',t:'Something howls in the dark. Nobody sleeps.'},
  {icon:'camp',t:'Rain soaks the camp and tempers fray.'}
];
/* backstory: each hero unlocks chapters by finishing quests; the player picks how each one reads */
export const CRAFT={warrior:'blade',mage:'spellbook',rogue:'lockpicks',cleric:'holy symbol',ranger:'bow',paladin:'oath',bard:'lute'};
export const REP=[
  {min:75,n:'Legendary',cls:'r-top'},{min:45,n:'Renowned',cls:'r-high'},{min:15,n:'Respected',cls:'r-high'},
  {min:-14,n:'Unknown',cls:'r-mid'},{min:-39,n:'Doubted',cls:'r-low'},{min:-101,n:'Disgraced',cls:'r-bad'}
];
export const CHAPTERS=[
  {n:'Origins',at:1,intro:'{n} sits by the fire after the first quest and talks about where they came from.',o:[
    {l:'A quiet farm',s:'{n} grew up on a small farm, rising before dawn and learning that honest work feeds everyone. Taking up the {craft} was the first thing they ever did for themselves.',t:'Humble Roots',d:'Wage 15% lower.',fx:{wage:.85},m:1,r:4},
    {l:'The city streets',s:'{n} was raised in the alleys of a crowded port town, trading favors and learning who to trust. The {craft} came later, as a way to stop trading.',t:'Streetwise',d:'+5% odds on bounties and delves.',fx:{type:{'Bounty':.05,'Dungeon delve':.05}},m:0,r:0},
    {l:'Running from something',s:'Nobody asked where {n} came from, and they like it that way. They left a village behind in a hurry, and some doors there are still shut.',t:'Haunted Past',d:'+3% odds, gains 15% more stress.',fx:{odds:.03,stress:1.15},m:-1,r:-4},
    {k:'hi',l:'A noble house',s:'{n} was born to a minor noble house and walked away from the inheritance. The name still opens doors, and the guild’s patrons notice.',t:'Name of Note',d:'+10% renown from quests.',fx:{renown:1.1},m:1,r:8},
    {k:'lo',l:'A known outlaw',s:'Before the guild, {n} ran with a crew that robbed caravans. The wanted posters have faded, but not everyone forgets.',t:'Wanted Poster',d:'+10% gold from quests, party gains 5% more stress.',fx:{gold:1.1,pstress:1.05},m:-1,r:-8}]},
  {n:'Motive',at:3,intro:'On a long road, {n} finally says why they keep taking quests.',o:[
    {l:'To protect others',s:'{n} fights because someone has to stand between the weak and the dark. Every rescued traveler feels like a debt repaid.',t:'Guardian’s Heart',d:'20% less likely to be injured, party gains 5% less stress.',fx:{injury:.8,pstress:.95},m:1,r:4},
    {l:'For coin and a warm bed',s:'{n} is honest about it: the work pays and the guild keeps a bed warm. There is no shame in a steady wage.',t:'Steady Hands',d:'Gains 15% less stress.',fx:{stress:.85},m:0,r:0},
    {l:'For glory',s:'{n} wants songs written about them, and will take the risk that gets one. Quiet victories feel like wasted days.',t:'Glory Hound',d:'+3% odds, party gains 10% more stress.',fx:{odds:.03,pstress:1.1},m:-1,r:-4},
    {k:'hi',l:'To end the darkness',s:'After all they have seen, {n} no longer fights for coin. They want the darkness gone for good, and the rest of the guild believes it.',t:'Beacon',d:'+4% odds, party gains 8% less stress.',fx:{odds:.04,pstress:.92},m:1,r:8},
    {k:'lo',l:'To settle scores',s:'{n} keeps a list of names and a long memory. The guild is a tool for settling it, and the list is shorter than it used to be.',t:'Grudge-bearer',d:'+7% odds on hunts and bounties, gains 20% more stress.',fx:{type:{'Monster hunt':.07,'Bounty':.07},stress:1.2},m:-1,r:-8}]},
  {n:'Regret',at:6,intro:'One night, {n} goes quiet. The others notice, and eventually the story comes out.',o:[
    {l:'A promise unkept',s:'{n} once promised to come back for someone and could not. They carry the weight openly now, and it keeps them honest.',t:'Oathkeeper',d:'+2% odds, gains 10% less stress.',fx:{odds:.02,stress:.9},m:1,r:4},
    {l:'A mentor lost',s:'A teacher showed {n} the {craft} and died before the lessons were finished. {n} fills the gaps with practice.',t:'Self-taught',d:'+20% XP.',fx:{xp:1.2},m:0,r:0},
    {l:'A betrayal',s:'{n} once sold out a friend to save themselves. They have never said it aloud, and they have trusted no one fully since.',t:'Cold Heart',d:'+4% odds, party gains 10% more stress.',fx:{odds:.04,pstress:1.1},m:-1,r:-4},
    {k:'hi',l:'A debt repaid',s:'Years ago a stranger risked everything for {n}. They have spent every quest since paying it forward, and the guild has noticed.',t:'Paid Forward',d:'Party gains 10% less stress, 15% less likely to be injured.',fx:{pstress:.9,injury:.85},m:1,r:8},
    {k:'lo',l:'A village left to burn',s:'{n} was there when a village burned and did nothing. The silence follows them into every camp.',t:'Silent Guilt',d:'+4% odds, gains 25% more stress.',fx:{odds:.04,stress:1.25},m:-1,r:-8}]},
  {n:'Bonds',at:10,intro:'{n} pulls a worn keepsake from a pocket, and the others ask about it.',o:[
    {l:'A sibling at home',s:'{n} sends coin home to a younger sibling who still thinks the {craft} is just a hobby. The letters keep them steady.',t:'Letters Home',d:'Gains 20% less stress.',fx:{stress:.8},m:1,r:4},
    {l:'The party is family',s:'{n} stopped talking about home long ago. The people who share the road are the family they chose.',t:'Found Family',d:'Party gains 5% less stress.',fx:{pstress:.95},m:0,r:0},
    {l:'A rival to beat',s:'{n} has a rival in another guild, and every victory is also a message. They would happily lose a coin to win that fight.',t:'Bitter Rival',d:'+3% odds, gains 10% more stress.',fx:{odds:.03,stress:1.1},m:-1,r:-4},
    {k:'hi',l:'A flame that endures',s:'Someone waits for {n} in a quiet town, and the guild knows the name. {n} has never been more careful, or more brave.',t:'Waiting Flame',d:'25% less likely to be injured, +2% odds.',fx:{injury:.75,odds:.02},m:1,r:8},
    {k:'lo',l:'Nobody at all',s:'{n} has cut every tie. There is no one to disappoint and no one to mourn, and the guild suspects that is the point.',t:'Lone Wolf',d:'+5% odds, party gains 10% more stress.',fx:{odds:.05,pstress:1.1},m:-1,r:-8}]},
  {n:'Creed',at:15,intro:'After so many quests, {n} finally puts words to the code they live by.',o:[
    {l:'Mercy first',s:'{n} always offers surrender before steel. It has cost the party time, and saved a few lives that later returned the favor.',t:'Code of Mercy',d:'Party gains 7% less stress.',fx:{pstress:.93},m:1,r:5},
    {l:'The job comes first',s:'{n} lives by a simple creed: finish the task, protect the party, and sleep afterward.',t:'Professional',d:'+3% odds, +10% XP.',fx:{odds:.03,xp:1.1},m:0,r:0},
    {l:'The ends justify the means',s:'{n} believes no one remembers how a quest was won, only that it was. That belief has paid off, and cost a few quiet nights.',t:'Ruthless',d:'+5% odds, +8% gold, party gains 10% more stress.',fx:{odds:.05,gold:1.08,pstress:1.1},m:-1,r:-5},
    {k:'hi',l:'A shield for the guild',s:'{n} has sworn that no one in this guild will fall while they stand. The oath is public, and the guild’s banner hangs a little prouder.',t:'Banner-Bearer',d:'+3% odds, +8% renown, party gains 10% less stress.',fx:{odds:.03,renown:1.08,pstress:.9},m:1,r:8},
    {k:'lo',l:'Fear is a weapon',s:'{n} has learned that a reputation can win fights before they begin. Enemies know the name. So do allies, and they are not entirely comfortable.',t:'Dread Reputation',d:'+5% odds, +5% renown, party gains 12% more stress.',fx:{odds:.05,renown:1.05,pstress:1.12},m:-1,r:-8}]}
];
export const repTier=r=>REP.find(x=>r>=x.min);
export const moral=h=>(h.story||[]).reduce((a,s)=>a+CHAPTERS[s.c].o[s.o].m,0);
export function alignTitle(h){
  if(!(h.story||[]).length)return 'Unwritten';
  const m=moral(h);
  return m>=4?'Paragon':m>=2?'Honorable':m>-2?'Pragmatic':m>-4?'Ruthless':'Villain';
}
export const fillStory=(s,h)=>s.replace(/\{n\}/g,h.name.split(' ')[0]).replace(/\{craft\}/g,CRAFT[h.cls]);
export const storyTrait=s=>{const o=CHAPTERS[s.c].o[s.o];return {n:o.t,pos:o.m>=0,story:1,d:o.d,fx:o.fx}};
export const KEY='guildmaster-save-v2',MKEY='guildmaster-legacy-v1';
export const CRISES=[
  {k:'Crisis: Siege',w:{might:.6,agility:.2,wits:.2},f:p=>`Break the siege of ${p}`,s:'A warband is about to break the gates.'},
  {k:'Crisis: Plague',w:{magic:.5,wits:.4,agility:.1},f:p=>`Stop the plague at ${p}`,s:'A sickness is spreading and the town will fall.'},
  {k:'Crisis: Ritual',w:{magic:.5,might:.2,wits:.3},f:p=>`Halt the ritual at ${p}`,s:'A cult is close to finishing something terrible.'},
  {k:'Crisis: Warlord',w:{agility:.4,might:.4,wits:.2},f:p=>`Stop the warlord of ${p}`,s:'A warlord has demanded that the guild kneel.'}
];
export const TOWNS=['Hollowmere','Ashford','Greywater','Dunmoor','Kettlebrook','Stonewick'];
export const CRISIS_DAYS=25;
export const MAPW=640,MAPH=430;
