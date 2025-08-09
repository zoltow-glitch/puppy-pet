(() => {
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

  const tutorial = document.getElementById('tutorial');
  const btnStart = document.getElementById('btnStart');

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const now = () => Date.now();
  const SAVE_KEY = 'pp_save_v2';

  function vibrate(ms){ if (navigator.vibrate) navigator.vibrate(ms); }

  function log(msg){
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.textContent = `[${time}] ${msg}`;
    logEl.prepend(line);
  }

  const state = load() || {
    t: now(),
    hunger: 80, fun: 80, clean: 80, energy: 80,
    sleeping: false,
    age: 0,
  };

  const conf = {
    decayPerMin: { hunger: 3, fun: 2.5, clean: 2, energy: 2 },
    actionBoost: { feed: 25, play: 22, clean: 28, sleep: 35 },
    actionCost: { play: 14, clean: 6 },
    sleepRatePerMin: 22,
    sleepTimeScale: 3,
  };

  function save(){ state.t = now(); localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  function load(){ try{ const s=localStorage.getItem(SAVE_KEY); return s?JSON.parse(s):null; }catch{ return null; } }

  function applyOfflineProgress(){
    const last = state.t || now();
    let mins = (now() - last) / 60000;
    if (mins <= 0) return;
    const ts = state.sleeping ? conf.sleepTimeScale : 1;
    mins *= ts;
    decay(mins);
    if (state.sleeping){
      state.energy = clamp(state.energy + conf.sleepRatePerMin * mins, 0, 100);
      if (state.energy >= 98) state.sleeping = false;
    }
    state.age += mins;
  }

  function decay(mins){
    state.hunger = clamp(state.hunger - conf.decayPerMin.hunger * mins, 0, 100);
    state.fun    = clamp(state.fun    - conf.decayPerMin.fun    * mins, 0, 100);
    state.clean  = clamp(state.clean  - conf.decayPerMin.clean  * mins, 0, 100);
    state.energy = clamp(state.energy - conf.decayPerMin.energy * mins, 0, 100);
  }

  function mood(){ return Math.round((state.hunger + state.fun + state.clean + state.energy) / 4); }

  // Visual FX helpers
  function heart(x,y,ttl=900){ effects.push({type:'heart',x,y,ttl,t0:now()}); }
  function bubble(x,y,ttl=800){ effects.push({type:'bubble',x,y,ttl,t0:now(),r:3+Math.random()*4}); }
  function zzz(x,y,ttl=1000){ effects.push({type:'zzz',x,y,ttl,t0:now()}); }
  function ball(x,y,vx,vy){ effects.push({type:'ball',x,y,vx,vy,g:400}); }

  const pet = {
    x: 180, y: 150, r: 34,
    blinkT: 0, eyeOpen: true,
    action: null, // 'feed','play','clean','sleep'
    actionT: 0,
    baseY: 150,
    tailT: 0,
    breathT: 0,
  };

  let effects = [];

  function doFeed(){
    state.hunger = clamp(state.hunger + conf.actionBoost.feed, 0, 100);
    state.clean = clamp(state.clean - 5, 0, 100);
    pet.action = 'feed'; pet.actionT = 0;
    for(let i=0;i<3;i++) heart(pet.x + 20 + Math.random()*10, pet.y - 40 - i*6);
    vibrate(15);
    log('Fed your pet.');
  }
  function doPlay(){
    if (state.energy < 10){ log('Too tired to play.'); return; }
    state.fun = clamp(state.fun + conf.actionBoost.play, 0, 100);
    state.energy = clamp(state.energy - conf.actionCost.play, 0, 100);
    pet.action = 'play'; pet.actionT = 0;
    ball(pet.x - 20, pet.y - 20, 180, -220);
    vibrate(15);
    log('Played fetch.');
  }
  function doClean(){
    state.clean = clamp(state.clean + conf.actionBoost.clean, 0, 100);
    state.energy = clamp(state.energy - conf.actionCost.clean, 0, 100);
    pet.action = 'clean'; pet.actionT = 0;
    for(let i=0;i<8;i++) bubble(pet.x - 10 + Math.random()*20, pet.y + 10 + Math.random()*10);
    vibrate(10);
    log('You cleaned your pet.');
  }
  function doSleep(){
    if (state.energy >= 95){ log('Already well-rested.'); return; }
    state.sleeping = true;
    pet.action = 'sleep'; pet.actionT = 0;
    for(let i=0;i<3;i++) zzz(pet.x + 26, pet.y - 26 - i*8);
    log('Sleeping... time flows faster.');
  }

  // UI binds
  btnFeed.addEventListener('click', doFeed);
  btnPlay.addEventListener('click', doPlay);
  btnClean.addEventListener('click', doClean);
  btnSleep.addEventListener('click', doSleep);
  btnReset.addEventListener('click', () => {
    if (!confirm('Reset your pet?')) return;
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  });
  btnStart.addEventListener('click', () => tutorial.close());

  function updateUI(){
    pHunger.value = state.hunger;
    pFun.value = state.fun;
    pClean.value = state.clean;
    pEnergy.value = state.energy;
    pMood.value = mood();
    document.title = `Mood ${pMood.value}% • Pocket Pet`;
  }

  // Drawing helpers
  function drawGround(){
    ctx.fillStyle = '#6de38f';
    ctx.fillRect(0, 190, cnv.width, 50);
  }
  function drawPet(){
    const m = mood();
    const col = m > 66 ? '#8ef0ff' : m > 33 ? '#ffd166' : '#ff7b7b';

    // Base idle motion
    pet.tailT += 0.1;
    pet.breathT += 0.02;
    const bob = Math.sin(Date.now()/300) * 2;
    let y = pet.baseY + bob;
    let x = pet.x;

    // Action overrides
    if (pet.action === 'play'){
      // Jump arc for ~0.8s
      const t = pet.actionT;
      const T = 0.8;
      const k = Math.min(t/T,1);
      y -= Math.sin(k*Math.PI) * 30;
      x += Math.sin(k*Math.PI) * 5;
      if (t > T) pet.action = null;
    }
    if (pet.action === 'sleep'){
      // Slow breathing
      y += Math.sin(pet.breathT)*1.5;
    }

    // Shadow
    ctx.beginPath();
    ctx.ellipse(x, pet.baseY + 28, 28, 8, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    // Body
    const r = pet.r;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = col;
    ctx.fill();

    // Tail wag
    ctx.save();
    ctx.translate(x + r-6, y + 6);
    ctx.rotate(Math.sin(pet.tailT)*0.4);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Eyes + mouth
    pet.blinkT -= 1;
    if (pet.blinkT <= 0){ pet.eyeOpen = !pet.eyeOpen; pet.blinkT = pet.eyeOpen ? 90 + Math.random()*90 : 6; }
    ctx.fillStyle = '#111';
    const eyeY = y - 6;
    if (pet.eyeOpen){
      ctx.beginPath(); ctx.arc(x - 10, eyeY, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 10, eyeY, 4, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillRect(x - 14, eyeY-1, 8, 2);
      ctx.fillRect(x + 6,  eyeY-1, 8, 2);
    }

    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (pet.action === 'feed'){
      // Chew animation
      const chew = Math.sin(pet.actionT*20) * 4;
      ctx.arc(x, y + 12, 8, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#ff7aa2';
      ctx.fillRect(x-6, y+12, 12, chew>0?chew:0);
    } else if (m > 66){ ctx.arc(x, y + 8, 8, 0, Math.PI); ctx.stroke();
    } else if (m > 33){ ctx.moveTo(x-6, y+12); ctx.lineTo(x+6, y+12); ctx.stroke();
    } else { ctx.arc(x, y + 16, 8, Math.PI, 0, true); ctx.stroke(); }

    // Zzz when sleeping
    if (state.sleeping){
      if (Math.random()<0.02) zzz(x + 24, y - 16);
    }
  }

  function drawEffects(dt){
    const tnow = now();
    effects = effects.filter(e => tnow - e.t0 < e.ttl);
    for (const e of effects){
      const k = (tnow - e.t0) / e.ttl;
      if (e.type === 'heart'){
        const yy = e.y - k*30;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = '#ff6b9a';
        ctx.beginPath();
        // Simple heart
        ctx.moveTo(e.x, yy);
        ctx.bezierCurveTo(e.x-6, yy-8, e.x-12, yy+4, e.x, yy+12);
        ctx.bezierCurveTo(e.x+12, yy+4, e.x+6, yy-8, e.x, yy);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (e.type === 'bubble'){
        const yy = e.y - k*18;
        ctx.globalAlpha = 0.7*(1-k);
        ctx.strokeStyle = '#bde0fe';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, yy, e.r + k*3, 0, Math.PI*2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (e.type === 'zzz'){
        const yy = e.y - k*20;
        ctx.globalAlpha = 1-k;
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '14px system-ui';
        ctx.fillText('Z', e.x, yy);
        ctx.globalAlpha = 1;
      } else if (e.type === 'ball'){
        e.vy += e.g*dt;
        e.x += e.vx*dt;
        e.y += e.vy*dt;
        if (e.y > 190){ e.y = 190; e.vy *= -0.6; e.vx *= 0.85; }
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(e.x, e.y-8, 6, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  function drawBackground(){
    ctx.clearRect(0,0,cnv.width, cnv.height);
    // Sky tint by time of day
    const t = new Date();
    const hour = t.getHours();
    const prog = (hour + t.getMinutes()/60) / 24;
    banner.style.transform = `translateX(${prog * 100}%)`;
    // Clouds
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#fff';
    for (let i=0;i<4;i++){
      const cx = (prog*cnv.width*1.5 + i*120) % (cnv.width+180) - 90;
      const cy = 40 + i*12;
      ctx.beginPath(); ctx.ellipse(cx, cy, 28, 14, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+20, cy+4, 20, 10, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx-20, cy+6, 16, 8, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Ground
    drawGround();
  }

  let lastTs = now();
  function tick(){
    const ts = now();
    let deltaMin = (ts - lastTs) / 60000;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    const scale = state.sleeping ? conf.sleepTimeScale : 1;
    deltaMin *= scale;

    decay(deltaMin);
    if (state.sleeping){
      state.energy = clamp(state.energy + conf.sleepRatePerMin * deltaMin, 0, 100);
      if (state.energy >= 98){
        state.sleeping = false;
        log('Woke up refreshed.');
      }
    }
    state.age += deltaMin;

    // Update pet action timer
    if (pet.action) pet.actionT += dt;

    // Occasional random events
    if (Math.random() < (deltaMin * 60) / 45){
      const r = Math.random();
      if (r < 0.33){ state.clean = clamp(state.clean - 10,0,100); log('Pet made a mess.'); }
      else if (r < 0.66){ state.fun = clamp(state.fun - 8,0,100); log('Pet got bored.'); }
      else { state.hunger = clamp(state.hunger - 8,0,100); log('Pet is peckish.'); }
    }

    updateUI();
    save();

    // Draw
    drawBackground();
    drawEffects(dt);
    drawPet();

    requestAnimationFrame(tick);
  }

  function resize(){
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const rectW = cnv.clientWidth || cnv.width;
    const rectH = cnv.clientHeight || cnv.height;
    cnv.width = rectW * scale;
    cnv.height = rectH * scale;
    ctx.setTransform(scale,0,0,scale,0,0);
  }
  new ResizeObserver(resize).observe(cnv);
  resize();

  // Boot
  applyOfflineProgress();
  updateUI();
  drawBackground(); drawPet();
  if (!load()) { try{ tutorial.showModal(); }catch{ tutorial.open = true; } }
  requestAnimationFrame(tick);
})();