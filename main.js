(() => {
// -- JS content identical to earlier 'puppy_pet.html' single-file build, packaged as module --

const cnv = document.getElementById('game');
const ctx = cnv.getContext('2d');
const pHunger = document.getElementById('pHunger');
const pFun = document.getElementById('pFun');
const pClean = document.getElementById('pClean');
const pEnergy = document.getElementById('pEnergy');
const pMood = document.getElementById('pMood');
const logEl = document.getElementById('log');
const banner = document.getElementById('dayBanner');

const btnFeed = document.getElementById('btnFeed');
const btnPlay = document.getElementById('btnPlay');
const btnClean = document.getElementById('btnClean');
const btnSleep = document.getElementById('btnSleep');
const btnReset = document.getElementById('btnReset');

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const now = () => performance.now();
const SAVE_KEY = 'puppy_pet_pwa_v1';

let AC;
function ensureAC(){ if (!AC) AC = new (window.AudioContext||window.webkitAudioContext)(); if (AC.state==='suspended') AC.resume(); }
function tone(freq=440, dur=0.15, type='sine', vol=0.2){
  ensureAC(); const t0 = AC.currentTime;
  const o = AC.createOscillator(); const g = AC.createGain();
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol,t0+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0+dur+0.02);
}
function woof(){ ensureAC(); const t0=AC.currentTime; const o=AC.createOscillator(); const g=AC.createGain();
  o.type='square'; o.frequency.setValueAtTime(300,t0); o.frequency.exponentialRampToValueAtTime(160,t0+0.12);
  g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.35,t0+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.2);
  o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0+0.22);
}
function chewSound(){ tone(520,0.06,'triangle',0.25); setTimeout(()=>tone(420,0.06,'triangle',0.2),70); }
function sparkle(){ tone(900,0.08,'sine',0.15); setTimeout(()=>tone(1200,0.08,'sine',0.12),90); }
function sleepChime(){ tone(600,0.15,'sine',0.12); setTimeout(()=>tone(400,0.2,'sine',0.08),120); }

function log(msg){ const line=document.createElement('div'); line.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`; logEl.prepend(line); }

const state = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') || {t:performance.now(),hunger:80,fun:80,clean:80,energy:80,sleeping:false,age:0};
const conf = {decayPerMin:{hunger:3,fun:2.5,clean:2,energy:2},actionBoost:{feed:28,play:26,clean:30,sleep:35},actionCost:{play:18,clean:8},sleepRatePerMin:26,sleepTimeScale:3};
function save(){ state.t=performance.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function decay(mins){ state.hunger=clamp(state.hunger-conf.decayPerMin.hunger*mins,0,100); state.fun=clamp(state.fun-conf.decayPerMin.fun*mins,0,100); state.clean=clamp(state.clean-conf.decayPerMin.clean*mins,0,100); state.energy=clamp(state.energy-conf.decayPerMin.energy*mins,0,100); }
function mood(){ return Math.round((state.hunger+state.fun+state.clean+state.energy)/4); }

const dog={x:110,y:190,dir:1,action:'idle',t:0,runT:0,jumpT:0,shakeT:0,chewT:0,sleepT:0,wagT:0,blinkT:0,blinkOpen:true};
const fx=[]; function heart(x,y){fx.push({type:'heart',x,y,t:0,d:0.9});} function bubble(x,y){fx.push({type:'bubble',x,y,t:0,d:0.9,r:3+Math.random()*4});} function zzz(x,y){fx.push({type:'zzz',x,y,t:0,d:1.2});} function ball(x,y,vx,vy){fx.push({type:'ball',x,y,vx,vy,g:980,t:0});}

function doFeed(){chewSound(); state.hunger=clamp(state.hunger+conf.actionBoost.feed,0,100); state.clean=clamp(state.clean-5,0,100); dog.action='eat'; dog.t=0; dog.chewT=0; for(let i=0;i<4;i++) heart(dog.x+40+Math.random()*10, dog.y-40-i*6); log('Fed your puppy.');}
function doPlay(){woof(); if (state.energy<12){log('Too tired to play.'); return;} state.fun=clamp(state.fun+conf.actionBoost.play,0,100); state.energy=clamp(state.energy-conf.actionCost.play,0,100); dog.action='zoomies'; dog.t=0; dog.runT=0; dog.jumpT=0; ball(dog.x, dog.y-30, 260, -420); log('Play time!');}
function doClean(){sparkle(); state.clean=clamp(state.clean+conf.actionBoost.clean,0,100); state.energy=clamp(state.energy-conf.actionCost.clean,0,100); dog.action='shake'; dog.t=0; dog.shakeT=0; for(let i=0;i<14;i++) bubble(dog.x-10+Math.random()*20, dog.y-10+Math.random()*10); log('Bath time.');}
function doSleep(){sleepChime(); if (state.energy>=95){log('Already rested.'); return;} state.sleeping=true; dog.action='sleep'; dog.t=0; dog.sleepT=0; for(let i=0;i<3;i++) zzz(dog.x+36, dog.y-42-i*10); log('Sleeping...');}

btnFeed.addEventListener('click', doFeed); btnPlay.addEventListener('click', doPlay); btnClean.addEventListener('click', doClean); btnSleep.addEventListener('click', doSleep);
btnReset.addEventListener('click', ()=>{ localStorage.removeItem(SAVE_KEY); location.reload(); });

function updateUI(){ pHunger.value=state.hunger; pFun.value=state.fun; pClean.value=state.clean; pEnergy.value=state.energy; pMood.value=mood(); document.title=`Mood ${pMood.value}% • Puppy Pet`; }

function drawBackground(dt){ ctx.clearRect(0,0,cnv.width,cnv.height); const t=new Date(); const prog=(t.getHours()+t.getMinutes()/60)/24; banner.style.transform=`translateX(${prog*100}%)`; ctx.fillStyle='#ffe58f'; const sunx=40+prog*(cnv.width-80); ctx.beginPath(); ctx.arc(sunx,40,18,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=0.15; ctx.fillStyle='#fff'; for(let i=0;i<4;i++){ const cx=(prog*cnv.width*1.6+i*150)%(cnv.width+220)-110; const cy=55+i*10; ctx.beginPath(); ctx.ellipse(cx,cy,30,16,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+22,cy+4,22,12,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx-22,cy+6,18,10,0,0,Math.PI*2); ctx.fill(); } ctx.globalAlpha=1; ctx.fillStyle='#6de38f'; ctx.fillRect(0,205,cnv.width,55); }

const draw={
  cap(x,y,len,r,c){ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,r,Math.PI/2,Math.PI*3/2); ctx.arc(x+len,y,r,Math.PI*3/2,Math.PI/2); ctx.closePath(); ctx.fill();},
  rect(x,y,w,h,r,c){ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath(); ctx.fill();}
};

function drawDog(dt){
  const x=dog.x,y=dog.y,dir=dog.dir;
  ctx.beginPath(); ctx.ellipse(x,210,30,10,0,0,Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fill();
  const wag=Math.sin(dog.wagT)*0.7; let head=0,jump=0,shake=0;
  if(dog.action==='idle'){head=Math.sin(dog.t*2)*0.15;} if(dog.action==='zoomies'){jump=Math.sin(dog.jumpT*3.14)*45; head=Math.sin(dog.t*10)*0.2;} if(dog.action==='eat'){head=0.3*Math.sin(dog.chewT*20);} if(dog.action==='shake'){shake=Math.sin(dog.shakeT*60)*6;} if(dog.action==='sleep'){head=-0.5;}
  ctx.save(); ctx.translate(x,y-jump); ctx.scale(dir,1);
  draw.rect(-46,-26+(shake?Math.sin(dog.shakeT*50)*2:0),92,44,18,'#c6a27a'); draw.rect(-30,-8,60,22,10,'#e7cfb2');
  ctx.save(); ctx.translate(46,-8); ctx.rotate(wag+(shake?Math.sin(dog.shakeT*80)*0.2:0)); draw.cap(0,0,26,6,'#c6a27a'); ctx.restore();
  for(let i=0;i<2;i++){const off=i?18:-18; const step=dog.action==='zoomies'?Math.sin(dog.t*20+i)*6:0; draw.cap(-22+off,14+step,22,6,'#c6a27a'); draw.cap(-6+off,14-step,22,6,'#c6a27a');}
  ctx.save(); ctx.translate(-36,-26); ctx.rotate(head); draw.rect(-14,-12,48,36,16,'#c6a27a'); ctx.save(); ctx.translate(-10,-8); ctx.rotate(-0.6+(shake?Math.sin(dog.shakeT*80)*0.2:0)); draw.cap(0,0,22,8,'#a47f5a'); ctx.restore(); ctx.save(); ctx.translate(30,-6); ctx.rotate(0.7+(shake?Math.sin(dog.shakeT*80)*0.2:0)); draw.cap(0,0,18,7,'#a47f5a'); ctx.restore(); draw.rect(22,2,22,14,7,'#e7cfb2'); ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(40,9,3,0,Math.PI*2); ctx.fill();
  dog.blinkT-=dt; if(dog.blinkT<=0){dog.blinkOpen=!dog.blinkOpen; dog.blinkT=dog.blinkOpen?0.9+Math.random()*1.1:0.08;} ctx.fillStyle='#222'; if(dog.blinkOpen){ctx.beginPath(); ctx.arc(10,4,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(0,2,3,0,Math.PI*2); ctx.fill();} else {ctx.fillRect(8,3,6,2); ctx.fillRect(-2,1,6,2);}
  ctx.strokeStyle='#222'; ctx.lineWidth=2; ctx.beginPath(); if(dog.action==='eat'){ctx.arc(26,14,6,0,Math.PI);} else if(dog.action==='sleep'){ctx.moveTo(20,16); ctx.lineTo(32,16);} else {const m=mood(); if(m>66){ctx.arc(24,16,6,0,Math.PI);} else if(m>33){ctx.moveTo(18,18); ctx.lineTo(30,18);} else {ctx.arc(24,22,6,Math.PI,0,true);} } ctx.stroke();
  ctx.restore(); ctx.restore();
}

function drawFX(dt){
  for(let i=fx.length-1;i>=0;i--){const e=fx[i]; e.t+=dt; const k=e.t/(e.d||1); if(k>=1){fx.splice(i,1); continue;}
    if(e.type==='heart'){ctx.globalAlpha=1-k; ctx.fillStyle='#ff6b9a'; const yy=e.y-k*40; ctx.beginPath(); ctx.moveTo(e.x,yy); ctx.bezierCurveTo(e.x-8,yy-10,e.x-14,yy+6,e.x,yy+16); ctx.bezierCurveTo(e.x+14,yy+6,e.x+8,yy-10,e.x,yy); ctx.fill(); ctx.globalAlpha=1;}
    else if(e.type==='bubble'){ctx.globalAlpha=0.7*(1-k); ctx.strokeStyle='#bde0fe'; ctx.lineWidth=2; const yy=e.y-k*26; ctx.beginPath(); ctx.arc(e.x,yy,e.r+k*4,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1;}
    else if(e.type==='zzz'){ctx.globalAlpha=1-k; ctx.fillStyle='#e5e7eb'; const yy=e.y-k*24; ctx.font='16px system-ui'; ctx.fillText('Z',e.x,yy); ctx.globalAlpha=1;}
    else if(e.type==='ball'){e.vy+=980*dt; e.x+=e.vx*dt; e.y+=e.vy*dt; if(e.y>205){e.y=205; e.vy*=-0.55; e.vx*=0.9;} ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(e.x,e.y-10,7,0,Math.PI*2); ctx.fill();}
  }
}

let last=performance.now();
function tick(ts){
  const dt=Math.min(0.05,(ts-last)/1000); last=ts;
  let deltaMin=dt/60*(state.sleeping?conf.sleepTimeScale:1); decay(deltaMin);
  if(state.sleeping){state.energy=clamp(state.energy+conf.sleepRatePerMin*deltaMin,0,100); if(state.energy>=98){state.sleeping=false;}}
  state.age+=deltaMin; dog.t+=dt; dog.wagT+=dt*8;
  if(dog.action==='idle'){ if(Math.random()<0.003){dog.dir*=-1;} }
  else if(dog.action==='zoomies'){ dog.runT+=dt; dog.x+=260*dt*dog.dir; if(dog.x>cnv.width-60){dog.dir=-1;} if(dog.x<60){dog.dir=1;} dog.jumpT+=dt*1.4; if(dog.t>1.6){dog.action='idle'; dog.t=0;} }
  else if(dog.action==='eat'){ dog.chewT+=dt; if(dog.t>0.9){dog.action='idle'; dog.t=0;} }
  else if(dog.action==='shake'){ dog.shakeT+=dt; if(dog.t>0.9){dog.action='idle'; dog.t=0;} }
  else if(dog.action==='sleep'){ dog.sleepT+=dt; if(Math.random()<0.02) {fx.push({type:'zzz',x:dog.x+36,y:dog.y-42,t:0,d:1.2});} if(!state.sleeping){dog.action='idle'; dog.t=0;} }
  if(Math.random()<dt/45){ const r=Math.random(); if(r<0.33){state.clean=clamp(state.clean-10,0,100); log('Mud paws.');} else if(r<0.66){state.fun=clamp(state.fun-8,0,100); log('Bored pup.');} else {state.hunger=clamp(state.hunger-8,0,100); log('Hungry whine.');} }
  drawBackground(dt); drawFX(dt); drawDog(dt); updateUI(); localStorage.setItem(SAVE_KEY, JSON.stringify(state)); requestAnimationFrame(tick);
}
function resize(){ const scale=Math.min(window.devicePixelRatio||1,2); const rectW=cnv.clientWidth||cnv.width; const rectH=cnv.clientHeight||cnv.height; cnv.width=rectW*scale; cnv.height=rectH*scale; ctx.setTransform(scale,0,0,scale,0,0); }
new ResizeObserver(resize).observe(cnv); resize();
requestAnimationFrame(tick);
})();