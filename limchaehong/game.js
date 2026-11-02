// 고양이 기사의 탐험 - 비행기 슈팅 게임
// 데이터(챕터/적/보스)는 chapters.js, 규칙은 document/game-limchaehong.md 참고
(() => {
  'use strict';

  const { chapters, enemies: ENEMY_DEFS } = window.GAME_DATA;

  const W = 480;          // 논리 해상도 너비 (높이 H는 화면 비율에 맞춰 달라짐)
  let H = 720;
  const FONT = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // ---------- 유틸 ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

  function pickWeighted(list, weightOf) {
    let total = 0;
    for (const o of list) total += weightOf(o);
    let r = Math.random() * total;
    for (const o of list) {
      r -= weightOf(o);
      if (r <= 0) return o;
    }
    return list[list.length - 1];
  }

  // ---------- 아이템 정의 (문서의 무기와 아이템 참고) ----------
  const ITEMS = {
    multi:  { glyph: '✴️', color: '#f97316', weight: 3,   name: '멀티샷' },
    power:  { glyph: '💪', color: '#ef4444', weight: 3,   name: '파워업' },
    pierce: { glyph: '🏹', color: '#06b6d4', weight: 2,   name: '관통탄' },
    homing: { glyph: '🎯', color: '#ec4899', weight: 2,   name: '유도탄' },
    rapid:  { glyph: '⚡', color: '#eab308', weight: 3,   name: '연사 강화' },
    shield: { glyph: '🛡️', color: '#3b82f6', weight: 2,   name: '방어막' },
    heal:   { glyph: '❤️', color: '#f43f5e', weight: 2,   name: '체력 회복' },
    magnet: { glyph: '🧲', color: '#8b5cf6', weight: 1.5, name: '자석' },
    bomb:   { glyph: '💣', color: '#475569', weight: 2,   name: '폭탄 보급' },
  };
  const ITEM_KEYS = Object.keys(ITEMS);
  const UP_KEYS = ['multi', 'power', 'pierce', 'homing', 'rapid'];   // 시간제 강화 무기
  const UP_MAX_LV = 3;
  const UP_SECONDS = 25;       // 한 단계가 유지되는 시간
  const BOMB_SECONDS = 3;      // 폭탄 사용 중 무적 시간

  // ---------- 이모지 스프라이트 캐시 ----------
  let ratioX = 1;
  let ratioY = 1;
  const sprites = new Map();

  function sprite(ch, size) {
    size = Math.max(8, Math.round(size / 4) * 4);
    const key = ch + size;
    let s = sprites.get(key);
    if (!s) {
      const px = Math.ceil(size * 1.4 * ratioX);
      const c = document.createElement('canvas');
      c.width = c.height = px;
      const g2 = c.getContext('2d');
      g2.font = `${size * ratioX}px ${EMOJI_FONT}`;
      g2.textAlign = 'center';
      g2.textBaseline = 'middle';
      g2.fillText(ch, px / 2, px / 2 + size * ratioX * 0.04);
      s = { c, w: px / ratioX };
      sprites.set(key, s);
    }
    return s;
  }

  function drawEmoji(ch, x, y, size, rot = 0, alpha = 1) {
    const s = sprite(ch, size);
    if (rot || alpha !== 1) {
      ctx.save();
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      ctx.drawImage(s.c, -s.w / 2, -s.w / 2, s.w, s.w);
      ctx.restore();
    } else {
      ctx.drawImage(s.c, x - s.w / 2, y - s.w / 2, s.w, s.w);
    }
  }

  function text(str, x, y, size, color = '#fff', align = 'center', maxWidth = W - 24) {
    ctx.font = `700 ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size / 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.strokeText(str, x, y, maxWidth);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y, maxWidth);
  }

  // ---------- 화면 크기 ----------
  function resize() {
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    H = clamp(Math.round(W * ih / iw), 640, 960);
    const scale = Math.min(iw / W, ih / H);
    const cw = Math.floor(W * scale);
    const chh = Math.floor(H * scale);
    const dpr = window.devicePixelRatio || 1;
    stage.style.width = cw + 'px';
    stage.style.height = chh + 'px';
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(chh * dpr);
    ratioX = canvas.width / W;
    ratioY = canvas.height / H;
    sprites.clear();
    if (run) run.player.y = Math.min(run.player.y, H - 20);
  }

  // ---------- 입력 ----------
  const keys = {};
  const input = {
    bombReq: false,
    touchFire: false,
    stick: { x: 0, y: 0 },
    mouse: { x: W / 2, y: H / 2, active: false },
  };

  function isTouchDevice() {
    return stage.classList.contains('touch');
  }

  window.addEventListener('keydown', (e) => {
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    keys[e.code] = true;
    if (e.repeat) return;
    if (e.code === 'KeyW') input.bombReq = true;
    if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
    if (e.code === 'Enter' || e.code === 'Space') confirm();
    if (e.code.startsWith('Arrow')) input.mouse.active = false;
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
    input.touchFire = false;
    if (g.state === 'play') setPaused(true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && g.state === 'play') setPaused(true);
  });

  // 마우스: 움직이면 고양이가 따라온다
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    input.mouse.x = (e.clientX - r.left) / r.width * W;
    input.mouse.y = (e.clientY - r.top) / r.height * H;
    if (Math.hypot(e.movementX || 0, e.movementY || 0) >= 2) input.mouse.active = true;
  });

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') stage.classList.add('touch');
  }, true);
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) stage.classList.add('touch');

  canvas.addEventListener('pointerdown', () => confirm());
  stage.addEventListener('contextmenu', (e) => e.preventDefault());

  // 모바일 가상 스틱
  const stickEl = document.getElementById('stick');
  const knobEl = document.getElementById('knob');
  let stickId = null;

  function moveStick(e) {
    const r = stickEl.getBoundingClientRect();
    const R = r.width / 2;
    let dx = (e.clientX - (r.left + R)) / R;
    let dy = (e.clientY - (r.top + R)) / R;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    knobEl.style.transform = `translate(${dx * R * 0.5}px, ${dy * R * 0.5}px)`;
    const dead = Math.hypot(dx, dy) < 0.15;
    input.stick.x = dead ? 0 : dx;
    input.stick.y = dead ? 0 : dy;
  }
  function endStick() {
    stickId = null;
    knobEl.style.transform = '';
    input.stick.x = input.stick.y = 0;
  }
  stickEl.addEventListener('pointerdown', (e) => {
    stickId = e.pointerId;
    stickEl.setPointerCapture(e.pointerId);
    input.mouse.active = false;
    moveStick(e);
  });
  stickEl.addEventListener('pointermove', (e) => { if (e.pointerId === stickId) moveStick(e); });
  stickEl.addEventListener('pointerup', (e) => { if (e.pointerId === stickId) endStick(); });
  stickEl.addEventListener('pointercancel', (e) => { if (e.pointerId === stickId) endStick(); });

  function holdButton(id, onDown, onUp) {
    const el = document.getElementById(id);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      onDown();
    });
    const up = () => { if (onUp) onUp(); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }
  holdButton('btnMissile', () => { input.touchFire = true; }, () => { input.touchFire = false; });
  holdButton('btnBomb', () => { input.bombReq = true; });
  holdButton('btnPause', () => togglePause());

  // ---------- 게임 상태 ----------
  const g = {
    state: 'title',   // title | intro | play | paused | outro | gameover | end
    t: 0,
    chapterIdx: 0,
    score: 0,
    chapterStartScore: 0,
    best: 0,
  };
  try { g.best = Number(localStorage.getItem('catKnightBest')) || 0; } catch (e) { /* 저장소 사용 불가 */ }

  let run = null;

  function setState(s) {
    g.state = s;
    g.t = 0;
    stage.dataset.state = s;
  }

  const chapter = () => chapters[g.chapterIdx];
  const storyLength = (lines) => lines.length * 0.35 + 0.6;

  function confirm() {
    if (g.t < 0.25) return;
    switch (g.state) {
      case 'title':
        g.chapterIdx = 0;
        g.score = 0;
        g.chapterStartScore = 0;
        setupBackground(chapter().bg);
        setState('intro');
        break;
      case 'intro':
        if (g.t < storyLength(chapter().intro)) g.t = storyLength(chapter().intro);
        else startRun();
        break;
      case 'paused':
        setPaused(false);
        break;
      case 'outro':
        if (g.t < storyLength(chapter().outro)) g.t = storyLength(chapter().outro);
        else nextChapter();
        break;
      case 'gameover':
        g.score = g.chapterStartScore;
        startRun();
        break;
      case 'end':
        setState('title');
        break;
      default:
    }
  }

  function setPaused(on) {
    if (on && g.state === 'play') setState('paused');
    else if (!on && g.state === 'paused') { setState('play'); g.t = 1; }
  }
  function togglePause() {
    if (g.state === 'play') setPaused(true);
    else if (g.state === 'paused') setPaused(false);
  }

  function nextChapter() {
    if (g.chapterIdx + 1 < chapters.length) {
      g.chapterIdx++;
      g.chapterStartScore = g.score;
      setupBackground(chapter().bg);
      setState('intro');
    } else {
      saveBest();
      setState('end');
    }
  }

  function saveBest() {
    if (g.score > g.best) {
      g.best = g.score;
      try { localStorage.setItem('catKnightBest', String(g.best)); } catch (e) { /* 무시 */ }
    }
  }

  // ---------- 배경 ----------
  const bgState = { decor: [], edge: [], dash: 0 };

  function setupBackground(bg) {
    bgState.decor = [];
    for (let i = 0; i < 24; i++) {
      bgState.decor.push({ x: rand(30, W - 30), y: rand(0, 960), ch: bg.decor[i % bg.decor.length], size: rand(18, 30) });
    }
    bgState.edge = [];
    for (let i = 0; i < 12; i++) {
      bgState.edge.push({ x: i % 2 ? W - 14 : 14, y: Math.floor(i / 2) * 170 - 40 + rand(-10, 10), size: rand(50, 64) });
    }
  }

  function scrollBackground(dt) {
    const bg = chapter().bg;
    const sp = 120;
    bgState.dash = (bgState.dash + sp * dt) % 70;
    for (const d of bgState.decor) {
      d.y += sp * dt;
      if (d.y > H + 40) { d.y = -40; d.x = rand(30, W - 30); d.ch = bg.decor[Math.floor(rand(0, bg.decor.length))]; }
    }
    for (const e of bgState.edge) {
      e.y += sp * dt;
      if (e.y > H + 70) e.y -= 1020;
    }
  }

  function drawBackground() {
    const bg = chapter().bg;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, bg.top);
    grad.addColorStop(1, bg.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    if (bg.path) {
      ctx.fillStyle = bg.path;
      ctx.fillRect(W / 2 - 70, 0, 140, H);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let y = bgState.dash - 70; y < H; y += 70) ctx.fillRect(W / 2 - 3, y, 6, 30);
    }
    for (const d of bgState.decor) drawEmoji(d.ch, d.x, d.y, d.size, 0, 0.9);
    for (const e of bgState.edge) drawEmoji(bg.edge, e.x, e.y, e.size);
  }

  // ---------- 플레이 시작 ----------
  function newPlayer() {
    const up = {};
    for (const k of UP_KEYS) up[k] = { lv: 0, t: 0 };
    return {
      x: W / 2, y: H - 140, r: 12, speed: 340,
      hp: 3, maxHp: 5, bombs: 2, maxBombs: 5,
      fireT: 0, inv: 2, bombT: 0, bombTick: 0,
      shield: false, magnetT: 0, up,
    };
  }

  function startRun() {
    run = {
      phase: 'run',        // run -> warning -> boss -> clear
      phaseT: 0,
      spawnT: 1,
      player: newPlayer(),
      bullets: [], ebullets: [], enemies: [], items: [],
      particles: [], booms: [], rings: [],
      boss: null,
      shake: 0,
      toast: null,
    };
    input.bombReq = false;
    setupBackground(chapter().bg);
    setState('play');
  }

  // ---------- 적 생성 ----------
  function makeEnemy(type, x, y) {
    const d = ENEMY_DEFS[type];
    const baseX = clamp(x, 70, W - 70);
    return {
      ...d, type, x: d.move === 'sine' ? baseX : x, y, baseX,
      maxhp: d.hp, t: 0, phase: rand(0, 6.28), flash: 0,
      vx: rand(40, 90) * (Math.random() < 0.5 ? -1 : 1),
      fireT: rand(0.6, d.fireEvery || 2),
    };
  }

  function spawnPattern(entry) {
    const R = run;
    if (entry.pattern === 'line') {
      for (let i = 0; i < 5; i++) {
        R.enemies.push(makeEnemy(entry.type, 60 + i * (W - 120) / 4, -30 - Math.abs(i - 2) * 34));
      }
    } else {
      R.enemies.push(makeEnemy(entry.type, rand(50, W - 50), -40));
    }
  }

  function spawnLogic(dt) {
    const R = run;
    const ch = chapter();
    R.spawnT -= dt;
    if (R.spawnT > 0) return;
    const prog = clamp(R.phaseT / ch.duration, 0, 1);
    const pool = ch.spawns.filter((s) => prog >= (s.from || 0));
    spawnPattern(pickWeighted(pool, (s) => s.weight));
    R.spawnT = lerp(ch.interval[0], ch.interval[1], prog) * rand(0.8, 1.2);
  }

  function enemyBullet(x, y, vx, vy, opts = {}) {
    run.ebullets.push({ x, y, vx, vy, r: opts.r || 7, emoji: opts.emoji || null, size: opts.size || 0, spin: opts.spin || 0, ang: 0 });
  }

  function aimedBullet(x, y, speed, offset = 0, opts) {
    const p = run.player;
    const a = Math.atan2(p.y - y, p.x - x) + offset;
    enemyBullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, opts);
  }

  // ---------- 보스 ----------
  const BOSS_Y = 130;

  function spawnBoss() {
    const b = chapter().boss;
    run.boss = {
      ...b, isBoss: true, x: W / 2, y: -100, maxhp: b.hp,
      phase: 'enter', pt: 0, t: 0, idx: 0, n: 0, flash: 0, tx: W / 2, ring: 0,
    };
  }

  function bossRage() {
    return run.boss.hp < run.boss.maxhp * 0.5;
  }

  function bossIdle() {
    run.boss.phase = 'idle';
    run.boss.pt = bossRage() ? 0.7 : 1.2;
  }

  function bossNextPattern() {
    const bs = run.boss;
    const pat = bs.patterns[bs.idx++ % bs.patterns.length];
    if (pat === 'spread') { bs.phase = 'spread'; bs.n = bossRage() ? 4 : 3; bs.pt = 0; }
    else if (pat === 'ring') { bs.phase = 'ring'; bs.n = bossRage() ? 3 : 2; bs.pt = 0; bs.ring = 0; }
    else { bs.phase = 'telegraph'; bs.pt = 0.7; }
  }

  function updateBoss(dt) {
    const bs = run.boss;
    if (!bs) return;
    bs.t += dt;
    bs.flash = Math.max(0, bs.flash - dt);
    const rage = bossRage();
    const bulletOpts = { emoji: bs.bullet, size: 28, r: 9, spin: 6 };

    const sway = () => {
      const target = W / 2 + Math.sin(bs.t * 0.9) * (W / 2 - bs.r - 20);
      bs.x += (target - bs.x) * Math.min(1, 4 * dt);
    };

    switch (bs.phase) {
      case 'enter':
        bs.y += 120 * dt;
        if (bs.y >= BOSS_Y) { bs.y = BOSS_Y; bossIdle(); }
        break;
      case 'idle':
        sway();
        bs.pt -= dt;
        if (bs.pt <= 0) bossNextPattern();
        break;
      case 'spread':
        sway();
        bs.pt -= dt;
        if (bs.pt <= 0) {
          const count = rage ? 7 : 5;
          for (let i = 0; i < count; i++) {
            aimedBullet(bs.x, bs.y + 30, rage ? 250 : 210, (i - (count - 1) / 2) * 0.22, bulletOpts);
          }
          bs.n--;
          bs.pt = 0.4;
          if (bs.n <= 0) bossIdle();
        }
        break;
      case 'ring':
        sway();
        bs.pt -= dt;
        if (bs.pt <= 0) {
          const count = rage ? 20 : 16;
          const off = (bs.ring++ % 2) * (Math.PI / count);
          for (let i = 0; i < count; i++) {
            const a = off + (i / count) * Math.PI * 2;
            enemyBullet(bs.x, bs.y, Math.cos(a) * 150, Math.sin(a) * 150, bulletOpts);
          }
          bs.n--;
          bs.pt = 0.7;
          if (bs.n <= 0) bossIdle();
        }
        break;
      case 'telegraph':
        bs.pt -= dt;
        if (bs.pt <= 0) { bs.phase = 'dash'; bs.tx = run.player.x; }
        break;
      case 'dash':
        bs.y += 900 * dt;
        bs.x += (bs.tx - bs.x) * Math.min(1, 5 * dt);
        if (bs.y >= H - 200) bs.phase = 'return';
        break;
      case 'return':
        bs.y -= 380 * dt;
        if (bs.y <= BOSS_Y) { bs.y = BOSS_Y; bossIdle(); }
        break;
      default:
    }
  }

  function killBoss() {
    const R = run;
    const bs = R.boss;
    R.boss = null;
    R.phase = 'clear';
    R.phaseT = 0;
    R.ebullets = [];
    g.score += bs.score;
    for (let i = 0; i < 14; i++) {
      R.booms.push({ x: bs.x + rand(-bs.r, bs.r), y: bs.y + rand(-bs.r, bs.r), size: rand(50, 90), life: 0, max: 0.6, delay: i * 0.12 });
    }
    for (let i = 0; i < 3; i++) dropItem(bs.x + (i - 1) * 50, bs.y, true);
    R.shake = 0.8;
  }

  // ---------- 아이템 ----------
  function dropItem(x, y, forced) {
    const key = pickWeighted(ITEM_KEYS, (k) => ITEMS[k].weight);
    run.items.push({ key, x, y, vy: 90, t: forced ? 0 : rand(0, 6) });
  }

  function applyItem(key) {
    const p = run.player;
    const def = ITEMS[key];
    let msg = def.name;
    if (UP_KEYS.includes(key)) {
      const u = p.up[key];
      u.lv = Math.min(UP_MAX_LV, u.lv + 1);
      u.t = UP_SECONDS;
      msg += ` Lv${u.lv}`;
    } else if (key === 'shield') {
      p.shield = true;
    } else if (key === 'heal') {
      if (p.hp < p.maxHp) p.hp++;
      else g.score += 500;
    } else if (key === 'magnet') {
      p.magnetT = 12;
    } else if (key === 'bomb') {
      if (p.bombs < p.maxBombs) p.bombs++;
      else g.score += 500;
    }
    run.toast = { text: msg, color: def.color, t: 1.3 };
  }

  // ---------- 전투 ----------
  function explode(x, y, size, color = '#fbbf24') {
    run.booms.push({ x, y, size, life: 0, max: 0.4, delay: 0 });
    for (let i = 0; i < 8; i++) {
      const a = rand(0, 6.28);
      const s = rand(60, 200);
      run.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: rand(0.3, 0.6), size: rand(2, 5), color });
    }
  }

  function killEnemy(e) {
    e.dead = true;
    g.score += e.score;
    explode(e.x, e.y, e.size * 1.4);
    if (Math.random() < 0.1 * e.drop) dropItem(e.x, e.y, false);
  }

  function hitTarget(e, dmg) {
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.hp <= 0 && !e.dead) {
      if (e.isBoss) killBoss();
      else killEnemy(e);
    }
  }

  function hurt() {
    const R = run;
    const p = R.player;
    if (p.inv > 0 || p.bombT > 0 || R.phase === 'clear') return;
    if (p.shield) {
      p.shield = false;
      p.inv = 1;
      R.rings.push({ x: p.x, y: p.y, r: 20, max: 90, life: 0, dur: 0.4, color: '#60a5fa', follow: true });
      return;
    }
    p.hp--;
    p.inv = 1.6;
    // 공격을 받으면 강화 단계가 한 단계 내려간다
    for (const k of UP_KEYS) if (p.up[k].lv > 0) { p.up[k].lv--; p.up[k].t = UP_SECONDS; }
    explode(p.x, p.y, 50, '#f87171');
    R.shake = 0.35;
    if (p.hp <= 0) {
      saveBest();
      setState('gameover');
    }
  }

  function useBomb() {
    const R = run;
    const p = R.player;
    if (p.bombs <= 0 || p.bombT > 0 || R.phase === 'clear') return;
    p.bombs--;
    p.bombT = BOMB_SECONDS;
    p.bombTick = 0.25;
    R.ebullets = [];
    R.shake = 0.5;
    R.rings.push({ x: p.x, y: p.y, r: 20, max: 520, life: 0, dur: 0.6, color: '#fde047', follow: false });
    for (const e of R.enemies) if (e.y > -20) hitTarget(e, 30);
    if (R.boss) hitTarget(R.boss, 12);
  }

  // ---------- 업데이트 ----------
  function updatePlayer(dt) {
    const R = run;
    const p = R.player;

    // 이동: 키보드 > 스틱 > 마우스
    let vx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    let vy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      p.x += vx / len * p.speed * dt;
      p.y += vy / len * p.speed * dt;
    } else if (input.stick.x || input.stick.y) {
      p.x += input.stick.x * p.speed * dt;
      p.y += input.stick.y * p.speed * dt;
    } else if (input.mouse.active) {
      const dx = input.mouse.x - p.x;
      const dy = input.mouse.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.5) {
        const step = Math.min(d, 800 * dt);
        p.x += dx / d * step;
        p.y += dy / d * step;
      }
    }
    p.x = clamp(p.x, 20, W - 20);
    p.y = clamp(p.y, 70, H - 20);

    p.inv = Math.max(0, p.inv - dt);
    p.bombT = Math.max(0, p.bombT - dt);
    p.magnetT = Math.max(0, p.magnetT - dt);
    for (const k of UP_KEYS) {
      const u = p.up[k];
      if (u.lv > 0) {
        u.t -= dt;
        if (u.t <= 0) { u.lv--; u.t = UP_SECONDS; }
      }
    }

    // 발사: Q / 모바일 미사일 버튼
    p.fireT -= dt;
    if ((keys.KeyQ || input.touchFire) && p.fireT <= 0) {
      shoot();
      p.fireT = 0.18 * (1 - 0.14 * p.up.rapid.lv);
    }

    // 폭탄: W / 모바일 폭탄 버튼
    if (input.bombReq) { input.bombReq = false; useBomb(); }
    if (p.bombT > 0) {
      R.ebullets = [];
      p.bombTick -= dt;
      if (p.bombTick <= 0) {
        p.bombTick = 0.25;
        for (const e of R.enemies) if (e.y > -20) hitTarget(e, 4);
        if (R.boss && R.boss.phase !== 'enter') hitTarget(R.boss, 2.5);
      }
    }
  }

  function shoot() {
    const p = run.player;
    const u = p.up;
    const n = Math.min(4, 1 + u.multi.lv);
    const dmg = 1 + 0.5 * u.power.lv;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2;
      const a = k * 0.13;
      run.bullets.push({
        x: p.x + k * 9, y: p.y - 18,
        vx: Math.sin(a) * 700, vy: -Math.cos(a) * 700,
        dmg, r: 6 + u.power.lv, pierce: u.pierce.lv, homing: u.homing.lv, hit: new Set(),
        color: u.pierce.lv ? '#67e8f9' : u.homing.lv ? '#f9a8d4' : '#fde047',
      });
    }
  }

  function nearestTarget(b) {
    let best = null;
    let bd = Infinity;
    const consider = (e) => {
      if (e.dead || e.y < 0) return;
      const d = dist2(b, e);
      if (d < bd) { bd = d; best = e; }
    };
    run.enemies.forEach(consider);
    if (run.boss) consider(run.boss);
    return best;
  }

  function updateBullets(dt) {
    const R = run;
    for (const b of R.bullets) {
      if (b.homing) {
        const t = nearestTarget(b);
        if (t) {
          const cur = Math.atan2(b.vy, b.vx);
          let diff = Math.atan2(t.y - b.y, t.x - b.x) - cur;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          const turn = clamp(diff, -(1.5 + b.homing * 1.5) * dt * 3, (1.5 + b.homing * 1.5) * dt * 3);
          const sp = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(cur + turn) * sp;
          b.vy = Math.sin(cur + turn) * sp;
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -20 || b.y > H + 20 || b.x < -20 || b.x > W + 20) b.dead = true;
    }
    for (const b of R.ebullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.ang += b.spin * dt;
      if (b.y < -30 || b.y > H + 30 || b.x < -30 || b.x > W + 30) b.dead = true;
    }
  }

  function updateEnemies(dt) {
    const R = run;
    for (const e of R.enemies) {
      e.t += dt;
      e.flash = Math.max(0, e.flash - dt);
      if (e.move === 'sine') {
        e.y += e.speed * dt;
        e.x = e.baseX + Math.sin(e.t * 2.2 + e.phase) * 50;
      } else if (e.move === 'shoot') {
        e.y += e.speed * (e.y < 160 ? 1 : 0.4) * dt;
        e.fireT -= dt;
        if (e.fireT <= 0 && e.y > 0 && e.y < H - 200) {
          aimedBullet(e.x, e.y + 10, 190);
          e.fireT = e.fireEvery;
        }
      } else if (e.move === 'bounce') {
        e.y += e.speed * dt;
        e.x += e.vx * dt;
        if (e.x < e.r || e.x > W - e.r) { e.vx *= -1; e.x = clamp(e.x, e.r, W - e.r); }
      }
      if (e.y > H + 60) e.dead = true;
    }
  }

  function updateItems(dt) {
    const R = run;
    const p = R.player;
    for (const it of R.items) {
      it.t += dt;
      it.y += it.vy * dt;
      it.x += Math.sin(it.t * 3) * 25 * dt;
      if (p.magnetT > 0) {
        const dx = p.x - it.x;
        const dy = p.y - it.y;
        const d = Math.hypot(dx, dy);
        if (d < 240 && d > 1) { it.x += dx / d * 420 * dt; it.y += dy / d * 420 * dt; }
      }
      if (it.y > H + 30) it.dead = true;
    }
  }

  function collide() {
    const R = run;
    const p = R.player;
    const targets = R.boss ? [...R.enemies, R.boss] : R.enemies;

    for (const b of R.bullets) {
      for (const e of targets) {
        if (b.dead) break;
        if (e.dead || e.y < 0 || b.hit.has(e)) continue;
        const rr = b.r + e.r;
        if (dist2(b, e) < rr * rr) {
          b.hit.add(e);
          hitTarget(e, b.dmg);
          if (b.pierce > 0) b.pierce--;
          else b.dead = true;
        }
      }
    }

    for (const eb of R.ebullets) {
      const rr = eb.r + p.r;
      if (dist2(eb, p) < rr * rr) { eb.dead = true; hurt(); }
    }
    for (const e of R.enemies) {
      const rr = e.r + p.r;
      if (!e.dead && dist2(e, p) < rr * rr) { hurt(); hitTarget(e, 3); }
    }
    if (R.boss) {
      const rr = R.boss.r * 0.85 + p.r;
      if (dist2(R.boss, p) < rr * rr) hurt();
    }
    for (const it of R.items) {
      if (dist2(it, p) < 28 * 28) { it.dead = true; applyItem(it.key); }
    }
  }

  function updateFx(dt) {
    const R = run;
    for (const q of R.particles) {
      q.life += dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    for (const b of R.booms) {
      if (b.delay > 0) { b.delay -= dt; continue; }
      b.life += dt;
    }
    for (const r of R.rings) {
      r.life += dt;
      if (r.follow) { r.x = R.player.x; r.y = R.player.y; }
    }
    R.shake = Math.max(0, R.shake - dt);
    if (R.toast) { R.toast.t -= dt; if (R.toast.t <= 0) R.toast = null; }
  }

  function sweep() {
    const R = run;
    R.bullets = R.bullets.filter((o) => !o.dead);
    R.ebullets = R.ebullets.filter((o) => !o.dead);
    R.enemies = R.enemies.filter((o) => !o.dead);
    R.items = R.items.filter((o) => !o.dead);
    R.particles = R.particles.filter((q) => q.life < q.max);
    R.booms = R.booms.filter((b) => b.life < b.max);
    R.rings = R.rings.filter((r) => r.life < r.dur);
  }

  function updateRun(dt) {
    const R = run;
    const ch = chapter();
    R.phaseT += dt;
    scrollBackground(dt);

    if (R.phase === 'run') {
      spawnLogic(dt);
      if (R.phaseT >= ch.duration) { R.phase = 'warning'; R.phaseT = 0; }
    } else if (R.phase === 'warning') {
      if (R.phaseT >= 2.5) { spawnBoss(); R.phase = 'boss'; R.phaseT = 0; }
    } else if (R.phase === 'clear' && R.phaseT >= 3.2) {
      g.score += R.player.hp * 300;
      saveBest();
      setState('outro');
      return;
    }

    updatePlayer(dt);
    if (g.state !== 'play') return;
    updateBullets(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateItems(dt);
    collide();
    updateFx(dt);
    sweep();
  }

  // ---------- 그리기 ----------
  function drawBullet(b) {
    const s = 1 + (b.r - 6) * 0.12;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 4.5 * s, 11 * s, Math.atan2(b.vy, b.vx) + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 2 * s, 6 * s, Math.atan2(b.vy, b.vx) + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawEnemyBullet(b) {
    if (b.emoji) {
      drawEmoji(b.emoji, b.x, b.y, b.size, b.ang);
      return;
    }
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fecaca';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayer() {
    const p = run.player;
    const blink = p.inv > 0 && Math.floor(g.t * 20) % 2 === 0;
    if (p.bombT > 0) {
      const pulse = 1 + Math.sin(g.t * 18) * 0.08;
      const rg = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 70 * pulse);
      rg.addColorStop(0, 'rgba(253,224,71,0.55)');
      rg.addColorStop(1, 'rgba(253,224,71,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 70 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!blink) {
      drawEmoji('🐱', p.x, p.y, 44);
      drawEmoji('🗡️', p.x + 18, p.y + 6, 20);
    }
    if (p.shield) {
      ctx.strokeStyle = 'rgba(96,165,250,0.9)';
      ctx.fillStyle = 'rgba(96,165,250,0.18)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawItem(it) {
    const def = ITEMS[it.key];
    ctx.fillStyle = def.color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(it.x, it.y, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawEmoji(def.glyph, it.x, it.y, 20);
  }

  function drawHud() {
    const R = run;
    const p = R.player;
    const ch = chapter();

    // 진행도 바
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, 6);
    const prog = R.phase === 'run' ? R.phaseT / ch.duration : 1;
    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, W * clamp(prog, 0, 1), 6);

    // 체력
    const slots = Math.max(3, p.hp);
    for (let i = 0; i < slots; i++) drawEmoji(i < p.hp ? '❤️' : '🖤', 24 + i * 26, 26, 22);
    // 점수
    text(String(g.score).padStart(6, '0'), W - 14, 26, 22, '#fff', 'right');
    text(`챕터 ${ch.id} · ${ch.name}`, W - 14, 50, 13, '#fef9c3', 'right');

    // 폭탄
    drawEmoji('💣', 24, 56, 22);
    text(`x${p.bombs}`, 42, 57, 16, '#fff', 'left');
    // 활성 강화
    let ux = 100;
    for (const k of UP_KEYS) {
      const u = p.up[k];
      if (u.lv <= 0) continue;
      drawEmoji(ITEMS[k].glyph, ux, 56, 20);
      text(`${u.lv}`, ux + 11, 62, 12, '#fde047', 'left');
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(ux - 10, 68, 20, 3);
      ctx.fillStyle = ITEMS[k].color;
      ctx.fillRect(ux - 10, 68, 20 * clamp(u.t / UP_SECONDS, 0, 1), 3);
      ux += 38;
    }
    if (p.magnetT > 0) { drawEmoji('🧲', ux, 56, 20); ux += 38; }

    // 보스 체력
    if (R.boss) {
      const bs = R.boss;
      text(bs.name, W / 2, 92, 14, '#fecaca');
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(60, 102, W - 120, 10);
      ctx.fillStyle = bossRage() ? '#f97316' : '#ef4444';
      ctx.fillRect(60, 102, (W - 120) * clamp(bs.hp / bs.maxhp, 0, 1), 10);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, 102, W - 120, 10);
    }

    if (R.toast) text(R.toast.text, W / 2, 140 + (R.boss ? 0 : -20), 22, R.toast.color);
  }

  function drawFx() {
    const R = run;
    for (const q of R.particles) {
      ctx.globalAlpha = 1 - q.life / q.max;
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
    }
    ctx.globalAlpha = 1;
    for (const b of R.booms) {
      if (b.delay > 0) continue;
      const t = b.life / b.max;
      drawEmoji('💥', b.x, b.y, b.size * (0.5 + t * 0.7), 0, 1 - t * t);
    }
    for (const r of R.rings) {
      const t = r.life / r.dur;
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(r.x, r.y, lerp(r.r, r.max, t), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawPlay() {
    const R = run;
    ctx.save();
    if (R.shake > 0) ctx.translate(rand(-5, 5) * Math.min(1, R.shake * 2), rand(-5, 5) * Math.min(1, R.shake * 2));

    drawBackground();
    R.items.forEach(drawItem);
    for (const e of R.enemies) drawEmoji(e.emoji, e.x, e.y, e.size, 0, e.flash > 0 ? 0.55 : 1);
    if (R.boss) {
      const bs = R.boss;
      const shakeX = bs.phase === 'telegraph' ? rand(-5, 5) : 0;
      drawEmoji(bs.emoji, bs.x + shakeX, bs.y, bs.size, 0, bs.flash > 0 ? 0.6 : 1);
      if (bs.phase === 'telegraph') {
        ctx.fillStyle = 'rgba(239,68,68,0.25)';
        ctx.fillRect(clamp(run.player.x, 0, W) - bs.r, bs.y, bs.r * 2, H - bs.y);
      }
    }
    R.bullets.forEach(drawBullet);
    R.ebullets.forEach(drawEnemyBullet);
    drawPlayer();
    drawFx();
    ctx.restore();

    drawHud();

    if (R.phase === 'warning') {
      const on = Math.floor(R.phaseT * 4) % 2 === 0;
      ctx.fillStyle = 'rgba(220,38,38,0.28)';
      ctx.fillRect(0, H / 2 - 70, W, 140);
      if (on) text('⚠ WARNING ⚠', W / 2, H / 2 - 20, 40, '#fee2e2');
      text(`${chapter().boss.name} 등장!`, W / 2, H / 2 + 30, 22, '#fff');
    }
    if (R.phase === 'clear' && R.phaseT > 0.8) {
      text('CHAPTER CLEAR!', W / 2, H / 2 - 20, 40, '#fde047');
    }
    if (g.t < 1.6 && R.phase === 'run') {
      ctx.globalAlpha = 1 - clamp((g.t - 1) / 0.6, 0, 1);
      text(`챕터 ${chapter().id}  ${chapter().name}`, W / 2, H / 2 - 40, 30, '#fff');
      ctx.globalAlpha = 1;
    }
  }

  function dim(alpha = 0.62) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  function blinkText(str, y, size = 18) {
    if (Math.floor(g.t * 2) % 2 === 0) text(str, W / 2, y, size, '#fde047');
  }

  function confirmHint() {
    return isTouchDevice() ? '화면을 터치하세요' : 'Enter / 클릭';
  }

  function drawStory(lines) {
    dim();
    const lh = 36;
    const top = H / 2 - (lines.length * lh) / 2 + lh / 2;
    lines.forEach((ln, i) => {
      if (!ln) return;
      ctx.globalAlpha = clamp((g.t - i * 0.35) / 0.5, 0, 1);
      const size = i === 0 ? 34 : i === 1 && lines[0].startsWith('챕터') ? 26 : 20;
      text(ln, W / 2, top + i * lh, size, i === 0 ? '#fde047' : '#fff');
    });
    ctx.globalAlpha = 1;
    if (g.t > storyLength(lines)) blinkText(`${confirmHint()}  ·  계속`, H - 70);
  }

  function drawTitle() {
    dim(0.35);
    const bob = Math.sin(g.t * 3) * 6;
    drawEmoji('🐱', W / 2 - 14, 190 + bob, 96);
    drawEmoji('🗡️', W / 2 + 46, 214 + bob, 44);
    text('고양이 기사의', W / 2, 290, 44, '#fff');
    text('탐험', W / 2, 346, 56, '#fde047');

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(40, 400, W - 80, 156);
    const rows = isTouchDevice()
      ? ['왼쪽 원형 스틱: 이동', '🚀 버튼: 미사일   💣 버튼: 폭탄', '폭탄을 쓰는 동안은 무적!']
      : ['방향키 또는 마우스: 이동', 'Q: 미사일   W: 폭탄', '폭탄을 쓰는 동안은 무적!  P: 일시정지'];
    rows.forEach((r, i) => text(r, W / 2, 430 + i * 36, 19, '#fff'));
    if (g.best) text(`BEST ${String(g.best).padStart(6, '0')}`, W / 2, 530, 16, '#fef9c3');

    blinkText(`${confirmHint()} 으로 시작`, 610, 22);
  }

  function drawGameOver() {
    drawPlayBackdrop();
    dim(0.7);
    text('GAME OVER', W / 2, H / 2 - 80, 48, '#fca5a5');
    text('주인님 곁으로 가야 하는데...', W / 2, H / 2 - 20, 20, '#fff');
    text(`SCORE ${String(g.score).padStart(6, '0')}`, W / 2, H / 2 + 30, 24, '#fde047');
    if (g.best) text(`BEST ${String(g.best).padStart(6, '0')}`, W / 2, H / 2 + 64, 16, '#fef9c3');
    blinkText(`${confirmHint()}  ·  챕터 다시 시작`, H / 2 + 130);
  }

  function drawEnd() {
    dim(0.7);
    drawEmoji('🐱', W / 2, H / 2 - 140, 80);
    text('To be continued...', W / 2, H / 2 - 60, 36, '#fde047');
    text('중세 시대의 모험은', W / 2, H / 2 - 10, 20, '#fff');
    text('곧 이어집니다! (챕터 2~10 준비 중)', W / 2, H / 2 + 24, 20, '#fff');
    text(`SCORE ${String(g.score).padStart(6, '0')}`, W / 2, H / 2 + 80, 24, '#fde047');
    if (g.best) text(`BEST ${String(g.best).padStart(6, '0')}`, W / 2, H / 2 + 112, 16, '#fef9c3');
    blinkText(`${confirmHint()}  ·  타이틀로`, H / 2 + 170);
  }

  // 게임오버/일시정지 때 배경으로 깔리는 마지막 플레이 화면
  function drawPlayBackdrop() {
    if (run) drawPlay();
    else drawBackground();
  }

  function render() {
    ctx.setTransform(ratioX, 0, 0, ratioY, 0, 0);
    ctx.clearRect(0, 0, W, H);
    switch (g.state) {
      case 'title':
        drawBackground();
        drawTitle();
        break;
      case 'intro':
        drawBackground();
        drawStory(chapter().intro);
        break;
      case 'play':
        drawPlay();
        break;
      case 'paused':
        drawPlay();
        dim(0.6);
        text('일시정지', W / 2, H / 2 - 20, 44, '#fff');
        text(isTouchDevice() ? '화면을 터치하면 계속' : 'P / Esc / 클릭으로 계속', W / 2, H / 2 + 36, 18, '#fde047');
        break;
      case 'outro':
        drawBackground();
        drawStory(chapter().outro);
        break;
      case 'gameover':
        drawGameOver();
        break;
      case 'end':
        drawBackground();
        drawEnd();
        break;
      default:
    }
  }

  // ---------- 메인 루프 ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    g.t += dt;
    if (g.state === 'play') updateRun(dt);
    else if (g.state !== 'paused' && g.state !== 'gameover') scrollBackground(dt);
    render();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  setupBackground(chapter().bg);
  stage.dataset.state = 'title';
  requestAnimationFrame(frame);

  // 디버그/테스트용
  window.__catKnight = { g, input, keys, get run() { return run; } };
})();
