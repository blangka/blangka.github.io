// 고양이 기사의 탐험 - 비행기 슈팅 게임
// 데이터(챕터/적/보스)는 chapters.js, 규칙은 document/game-ch.md 참고
(() => {
  'use strict';

  const { chapters, enemies: ENEMY_DEFS } = window.GAME_DATA;

  const W = 480;          // 논리 해상도 너비 (높이 H는 화면 비율에 맞춰 달라짐)
  let H = 720;
  const FONT = '"Jua","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
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

  function shuffled(n) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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
  const SLOW_FACTOR = 0.55;    // 시간 감속(챕터 9 보스) 중 이동 속도 배율

  // ---------- 이모지 스프라이트 캐시 ----------
  let ratioX = 1;
  let ratioY = 1;
  const sprites = new Map();

  function sprite(ch, size, filter) {
    size = Math.max(8, Math.round(size / 4) * 4);
    const key = ch + size + (filter || '');
    let s = sprites.get(key);
    if (!s) {
      const px = Math.ceil(size * 1.4 * ratioX);
      const c = document.createElement('canvas');
      c.width = c.height = px;
      const g2 = c.getContext('2d');
      if (filter) g2.filter = filter;
      g2.font = `${size * ratioX}px ${EMOJI_FONT}`;
      g2.textAlign = 'center';
      g2.textBaseline = 'middle';
      g2.fillText(ch, px / 2, px / 2 + size * ratioX * 0.04);
      s = { c, w: px / ratioX };
      sprites.set(key, s);
    }
    return s;
  }

  function drawEmoji(ch, x, y, size, rot = 0, alpha = 1, filter) {
    const s = sprite(ch, size, filter);
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

  // 동화책 느낌의 글씨(갈색 잉크)와 양피지 카드
  function ink(str, x, y, size, color = '#5b3a29', align = 'center', maxWidth = W - 90) {
    ctx.font = `700 ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y, maxWidth);
  }

  function roundRectPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function card(x, y, w, h) {
    ctx.save();
    ctx.shadowColor = 'rgba(40,20,10,0.45)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#fbf1d6';
    roundRectPath(x, y, w, h, 22);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#c99a5b';
    ctx.lineWidth = 4;
    roundRectPath(x + 7, y + 7, w - 14, h - 14, 17);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(201,154,91,0.5)';
    ctx.lineWidth = 1.5;
    roundRectPath(x + 13, y + 13, w - 26, h - 26, 12);
    ctx.stroke();
  }

  // 구글 폰트(Jua)를 게임에 쓰는 한글 전체로 미리 불러온다 (실패하면 기본 글꼴 사용)
  if (document.fonts && document.fonts.load) {
    const uiText = '고양이 기사의 탐험일시정지계속시작챕터클리어다시타이틀로방향키마우스이동미사일폭탄무적화면터치버튼원형스틱동안은소리';
    document.fonts.load('20px Jua', uiText + JSON.stringify(window.GAME_DATA)).catch(() => {});
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
    Sound.unlock();
    keys[e.code] = true;
    if (e.repeat) return;
    if (e.code === 'KeyM') toggleMute();
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
    Sound.unlock();   // 브라우저 규칙상 첫 터치/클릭 뒤에야 소리를 낼 수 있다
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

  const muteEl = document.getElementById('btnMute');
  function refreshMute() { muteEl.textContent = Sound.muted ? '\u{1F507}' : '\u{1F50A}'; }
  function toggleMute() { Sound.toggleMute(); refreshMute(); }
  muteEl.addEventListener('click', () => { Sound.unlock(); toggleMute(); muteEl.blur(); });
  refreshMute();

  // ---------- 게임 상태 ----------
  const g = {
    state: 'title',   // title | intro | play | paused | outro | gameover | end
    t: 0,
    chapterIdx: 0,
    score: 0,
    chapterStartScore: 0,
    best: 0,
    carry: null,      // 다음 챕터로 넘어갈 때 이어받는 체력/폭탄
  };
  try { g.best = Number(localStorage.getItem('catKnightBest')) || 0; } catch (e) { /* 저장소 사용 불가 */ }

  let run = null;

  function setState(s) {
    g.state = s;
    g.t = 0;
    stage.dataset.state = s;
    syncMusic();
  }

  // 화면 상태에 맞는 배경음악 (챕터마다 다른 곡, 보스전은 같은 곡의 빠른 편곡)
  function syncMusic() {
    switch (g.state) {
      case 'title': Sound.music('title'); break;
      case 'end': Sound.music('end'); break;
      case 'gameover': Sound.stop(); break;
      default: Sound.music('ch' + chapter().id);
    }
    Sound.duck(g.state === 'paused');
  }

  const chapter = () => chapters[g.chapterIdx];
  const isLastChapter = () => g.chapterIdx === chapters.length - 1;
  const storyLength = (lines) => lines.length * 0.35 + 0.6;

  function confirm() {
    if (g.t < 0.25) return;
    Sound.sfx('select');
    switch (g.state) {
      case 'title':
        g.chapterIdx = 0;
        g.score = 0;
        g.chapterStartScore = 0;
        g.carry = null;
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
        g.chapterIdx = 0;
        setupBackground(chapter().bg);
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
      const p = run.player;
      g.carry = { hp: clamp(p.hp + 1, 3, p.maxHp), bombs: Math.max(2, p.bombs) };
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
  const bgState = { decor: [], edge: [], weather: [], wtype: null, dash: 0, scroll: 0, clock: 0 };
  const WEATHER_COUNT = { fog: 8, rain: 70, embers: 40, sparkle: 44, clouds: 7 };

  function setupBackground(bg) {
    bgState.decor = [];
    for (let i = 0; i < 24; i++) {
      bgState.decor.push({ x: rand(30, W - 30), y: rand(0, 960), ch: bg.decor[i % bg.decor.length], size: rand(18, 30) });
    }
    bgState.edge = [];
    if (bg.edge) {
      for (let i = 0; i < 12; i++) {
        bgState.edge.push({ x: i % 2 ? W - 14 : 14, y: Math.floor(i / 2) * 170 - 40 + rand(-10, 10), size: rand(50, 64) });
      }
    }
    bgState.wtype = bg.weather || null;
    bgState.weather = [];
    for (let i = 0; i < (WEATHER_COUNT[bg.weather] || 0); i++) {
      bgState.weather.push({ x: rand(0, W), y: rand(0, 960), a: rand(0, 6.28), s: rand(0.5, 1) });
    }
  }

  function scrollBackground(dt) {
    const bg = chapter().bg;
    const sp = 120;
    bgState.clock += dt;
    bgState.scroll += sp * dt;
    bgState.dash = (bgState.dash + sp * dt) % 70;
    for (const d of bgState.decor) {
      d.y += sp * dt;
      if (d.y > H + 40) { d.y = -40; d.x = rand(30, W - 30); d.ch = bg.decor[Math.floor(rand(0, bg.decor.length))]; }
    }
    for (const e of bgState.edge) {
      e.y += sp * dt;
      if (e.y > H + 70) e.y -= 1020;
    }
    for (const w of bgState.weather) {
      switch (bgState.wtype) {
        case 'fog':
          w.y += (20 + w.s * 20) * dt;
          w.x += (w.s - 0.75) * 30 * dt;
          if (w.y > H + 150) { w.y = -150; w.x = rand(0, W); }
          break;
        case 'rain':
          w.y += (650 + w.s * 350) * dt;
          w.x -= 80 * dt;
          if (w.y > H + 20) { w.y = -20; w.x = rand(0, W + 100); }
          break;
        case 'embers':
          w.y -= (30 + w.s * 70) * dt;
          w.x += Math.sin(w.a + bgState.clock * 2) * 20 * dt;
          if (w.y < -10) { w.y = H + 10; w.x = rand(0, W); }
          break;
        case 'sparkle':
          w.y += 20 * w.s * dt;
          w.a += dt * 3;
          if (w.y > H + 10) { w.y = -10; w.x = rand(0, W); }
          break;
        case 'clouds':
          w.y += 70 * w.s * dt;
          w.x += 8 * dt;
          if (w.y > H + 80) { w.y = -80; w.x = rand(0, W); }
          break;
        default:
      }
    }
  }

  function drawWeather() {
    for (const w of bgState.weather) {
      switch (bgState.wtype) {
        case 'fog': {
          const r = 90 + w.s * 70;
          const rg = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, r);
          rg.addColorStop(0, 'rgba(220,230,255,0.15)');
          rg.addColorStop(1, 'rgba(220,230,255,0)');
          ctx.fillStyle = rg;
          ctx.fillRect(w.x - r, w.y - r, r * 2, r * 2);
          break;
        }
        case 'rain':
          ctx.strokeStyle = 'rgba(200,220,255,0.38)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(w.x, w.y);
          ctx.lineTo(w.x - 5, w.y + 10 + w.s * 12);
          ctx.stroke();
          break;
        case 'embers':
          ctx.fillStyle = `rgba(255,${Math.floor(120 + w.s * 100)},40,${0.35 + 0.4 * w.s})`;
          ctx.beginPath();
          ctx.arc(w.x, w.y, 1.5 + w.s * 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'sparkle':
          ctx.fillStyle = `rgba(233,213,255,${0.25 + 0.5 * Math.abs(Math.sin(w.a))})`;
          ctx.fillRect(w.x - 1.5, w.y - 1.5, 3, 3);
          break;
        case 'clouds':
          drawEmoji('☁️', w.x, w.y, 70 + w.s * 60, 0, 0.8);
          break;
        default:
      }
    }
  }

  function drawWaves() {
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 3;
    const off = bgState.scroll % 60;
    for (let y = -60 + off; y < H + 20; y += 60) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) {
        const yy = y + Math.sin(x / 40 + y / 30 + bgState.clock * 2) * 6;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  function drawBackground() {
    const bg = chapter().bg;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, bg.top);
    grad.addColorStop(1, bg.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    if (bg.waves) drawWaves();
    if (bg.path) {
      ctx.fillStyle = bg.path;
      ctx.fillRect(W / 2 - 70, 0, 140, H);
      if (bg.dash) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let y = bgState.dash - 70; y < H; y += 70) ctx.fillRect(W / 2 - 3, y, 6, 30);
      }
    }
    for (const d of bgState.decor) drawEmoji(d.ch, d.x, d.y, d.size, 0, 0.9);
    for (const e of bgState.edge) drawEmoji(bg.edge, e.x, e.y, e.size);
    drawWeather();
    // 동화책 그림처럼 가장자리를 은은하게 어둡게
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.82);
    vg.addColorStop(0, 'rgba(60,30,20,0)');
    vg.addColorStop(1, 'rgba(60,30,20,0.3)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------- 플레이 시작 ----------
  function newPlayer() {
    const up = {};
    for (const k of UP_KEYS) up[k] = { lv: 0, t: 0 };
    return {
      x: W / 2, y: H - 140, r: 12, speed: 340,
      hp: 3, maxHp: 5, bombs: 2, maxBombs: 5,
      fireT: 0, inv: 2, bombT: 0, bombTick: 0, bank: 0,
      shield: false, magnetT: 0, up,
    };
  }

  function startRun() {
    const player = newPlayer();
    if (g.carry) {
      player.hp = g.carry.hp;
      player.bombs = g.carry.bombs;
    }
    run = {
      phase: 'run',        // run -> warning -> boss -> clear
      phaseT: 0,
      spawnT: 1,
      player,
      bullets: [], ebullets: [], enemies: [], items: [], hazards: [],
      particles: [], booms: [], rings: [],
      boss: null,
      slowT: 0,
      shake: 0,
      toast: null,
    };
    input.bombReq = false;
    setupBackground(chapter().bg);
    Sound.boss(false);
    setState('play');
  }

  // ---------- 적 생성 ----------
  function makeEnemy(type, x, y, extra = {}) {
    const d = ENEMY_DEFS[type];
    const amp = d.amp || 50;
    const dir = extra.dir || (Math.random() < 0.5 ? -1 : 1);
    const baseX = d.move === 'sine' ? clamp(x, amp + 20, W - amp - 20) : clamp(x, 30, W - 30);
    return {
      ...d, type, x: baseX, y, baseX, dir,
      maxhp: d.hp, t: 0, phase: rand(0, 6.28), flash: 0, ang: 0,
      vx: d.move === 'zig' ? dir * d.speed * 0.9 : rand(40, 90) * dir,
      zt: rand(0.3, 0.8),
      fireT: rand(0.6, d.fireEvery || 2),
      hoverY: rand(110, 250), hold: rand(3.2, 4.6), hovering: false,
    };
  }

  function spawnPattern(entry) {
    const R = run;
    const type = entry.type;
    switch (entry.pattern) {
      case 'line':
        for (let i = 0; i < 5; i++) {
          R.enemies.push(makeEnemy(type, 60 + i * (W - 120) / 4, -30 - Math.abs(i - 2) * 34));
        }
        break;
      case 'column': {
        const x = rand(70, W - 70);
        const dir = Math.random() < 0.5 ? -1 : 1;
        for (let i = 0; i < 3; i++) R.enemies.push(makeEnemy(type, x, -30 - i * 55, { dir }));
        break;
      }
      case 'pair': {
        const x = rand(60, 170);
        R.enemies.push(makeEnemy(type, x, -40));
        R.enemies.push(makeEnemy(type, W - x, -40));
        break;
      }
      case 'side': {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const e = makeEnemy(type, dir > 0 ? -30 : W + 30, rand(80, 320), { dir });
        e.x = dir > 0 ? -30 : W + 30;
        e.vx = dir * e.speed;
        R.enemies.push(e);
        break;
      }
      default:
        R.enemies.push(makeEnemy(type, rand(50, W - 50), -40));
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
    run.ebullets.push({
      x, y, vx, vy, r: opts.r || 7, emoji: opts.emoji || null, size: opts.size || 0,
      spin: opts.spin || 0, ang: 0, fuse: opts.fuse, burst: opts.burst, child: opts.child,
    });
  }

  function aimedBullet(x, y, speed, offset = 0, opts) {
    const p = run.player;
    const a = Math.atan2(p.y - y, p.x - x) + offset;
    enemyBullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, opts);
  }

  function enemyFire(e) {
    const fan = e.fan || 1;
    const opts = e.bullet ? { emoji: e.bullet, size: 22, r: 7, spin: 3 } : undefined;
    for (let i = 0; i < fan; i++) {
      aimedBullet(e.x, e.y + 10, e.bspeed || 190, (i - (fan - 1) / 2) * 0.3, opts);
    }
  }

  // ---------- 보스 ----------
  const BOSS_Y = 190;

  function spawnBoss() {
    const b = chapter().boss;
    run.boss = {
      ...b, isBoss: true, x: W / 2, y: -140, maxhp: b.hp,
      phase: 'enter', pt: 0, t: 0, idx: 0, n: 0, flash: 0, tx: W / 2, ring: 0,
      alpha: 1, ghost: false, guarded: false, sub: '',
    };
  }

  function bossRage() {
    return run.boss.hp < run.boss.maxhp * 0.5;
  }

  function bossIdle() {
    const bs = run.boss;
    bs.phase = 'idle';
    bs.alpha = 1;
    bs.ghost = false;
    bs.pt = (bs.idleT || 1.1) * (bossRage() ? 0.65 : 1);
  }

  function bossNextPattern() {
    const bs = run.boss;
    const rage = bossRage();
    const pat = bs.patterns[bs.idx++ % bs.patterns.length];
    bs.phase = pat;
    bs.pt = 0;
    bs.ring = 0;
    switch (pat) {
      case 'spread': bs.n = rage ? 4 : 3; break;
      case 'ring': bs.n = rage ? 3 : 2; break;
      case 'aimed': bs.n = rage ? 12 : 8; break;
      case 'charge': bs.phase = 'telegraph'; bs.pt = bs.tele || 0.7; break;
      case 'summon': bs.n = 1; bs.pt = 0.3; break;
      case 'wall': bs.n = rage ? 3 : 2; bs.pt = 0.3; break;
      case 'wind': bs.n = rage ? 11 : 8; break;
      case 'rain': bs.n = rage ? 28 : 20; break;
      case 'bubbles': bs.n = rage ? 6 : 4; break;
      case 'tentacle': bs.n = rage ? 13 : 9; break;
      case 'lava': bs.n = rage ? 3 : 2; bs.pt = 0.3; break;
      case 'teleport': bs.n = rage ? 3 : 2; bs.sub = 'out'; break;
      case 'magic': bs.n = 2; bs.pt = 0.3; break;
      case 'slow': bs.n = 2; bs.pt = 0.4; run.slowT = 3.8; break;
      case 'lightning': bs.n = rage ? 5 : 4; bs.pt = 0.3; break;
      default: bossIdle();
    }
  }

  function addHazardRect(x, y, w, h, warn, active, style) {
    run.hazards.push({ kind: 'rect', x, y, w, h, warn, active, t: 0, style });
  }

  function updateBoss(dt) {
    const bs = run.boss;
    if (!bs) return;
    const R = run;
    const p = R.player;
    bs.t += dt;
    bs.flash = Math.max(0, bs.flash - dt);
    const rage = bossRage();
    const bo = { emoji: bs.bullet, size: 28, r: 9, spin: 6 };

    if (bs.guard) bs.guarded = bs.phase !== 'enter' && bs.t % (bs.guard[0] + bs.guard[1]) < bs.guard[0];

    const sway = () => {
      const target = W / 2 + Math.sin(bs.t * 0.9) * (W / 2 - bs.r - 20);
      bs.x += (target - bs.x) * Math.min(1, 4 * dt);
      bs.y += (BOSS_Y - bs.y) * Math.min(1, 2 * dt);
    };
    // 일정 간격으로 fn을 실행하고, n번 끝나면 대기 상태로 돌아간다
    const tick = (interval, fn) => {
      sway();
      bs.pt -= dt;
      if (bs.pt > 0) return;
      fn();
      bs.pt = interval;
      if (--bs.n <= 0) bossIdle();
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
        tick(0.4, () => {
          const count = rage ? 7 : 5;
          for (let i = 0; i < count; i++) {
            aimedBullet(bs.x, bs.y + 30, rage ? 220 : 180, (i - (count - 1) / 2) * 0.24, bo);
          }
        });
        break;
      case 'ring':
        tick(0.7, () => {
          const count = rage ? 20 : 16;
          const off = (bs.ring++ % 2) * (Math.PI / count);
          for (let i = 0; i < count; i++) {
            const a = off + (i / count) * Math.PI * 2;
            enemyBullet(bs.x, bs.y, Math.cos(a) * 130, Math.sin(a) * 130, bo);
          }
        });
        break;
      case 'aimed':
        tick(0.2, () => aimedBullet(bs.x, bs.y + 30, rage ? 260 : 225, rand(-0.07, 0.07), bo));
        break;
      case 'summon':
        tick(1, () => {
          const count = rage ? 4 : 3;
          for (let i = 0; i < count; i++) {
            R.enemies.push(makeEnemy(bs.minion, bs.x + (i - (count - 1) / 2) * 64, bs.y + 50));
          }
        });
        break;
      case 'wall':
        tick(1.5, () => {
          const gap = Math.floor(rand(2, 11));
          for (let i = 0; i < 13; i++) {
            if (Math.abs(i - gap) <= 1) continue;
            enemyBullet(18 + i * 37, bs.y + 45, 0, 150, { emoji: bs.bullet, size: 26, r: 9, spin: 3 });
          }
        });
        break;
      case 'wind':
        tick(0.32, () => {
          const side = bs.n % 2 ? 1 : -1;
          const y = clamp(p.y + rand(-150, 150), 160, H - 60);
          enemyBullet(side > 0 ? -20 : W + 20, y, side * 210, rand(-15, 15), bo);
        });
        break;
      case 'rain':
        tick(0.13, () => {
          const x = bs.n % 4 === 0 ? clamp(p.x + rand(-30, 30), 20, W - 20) : rand(20, W - 20);
          enemyBullet(x, 60, 0, 240, { emoji: bs.bullet, size: 22, r: 7 });
        });
        break;
      case 'bubbles':
        tick(0.75, () => {
          const a = Math.atan2(p.y - bs.y, p.x - bs.x) + rand(-0.3, 0.3);
          enemyBullet(bs.x, bs.y + 40, Math.cos(a) * 125, Math.sin(a) * 125, {
            emoji: bs.bubble || bs.bullet, size: 44, r: 16, fuse: 1.1, burst: rage ? 10 : 8,
            child: { emoji: bs.bullet, size: 22, r: 7, spin: 4 },
          });
        });
        break;
      case 'tentacle':
        tick(rage ? 0.3 : 0.42, () => {
          const side = Math.floor(rand(0, 3));
          let sx;
          let sy;
          if (side === 0) { sx = -10; sy = rand(160, H - 260); }
          else if (side === 1) { sx = W + 10; sy = rand(160, H - 260); }
          else { sx = rand(40, W - 40); sy = -10; }
          const opts = { emoji: bs.bullet, size: 30, r: 10, spin: 5 };
          aimedBullet(sx, sy, rage ? 250 : 215, 0, opts);
          if (rage) aimedBullet(sx, sy, 250, 0.22, opts);
        });
        break;
      case 'lava':
        tick(3.0, () => {
          const cols = 5;
          const cw = W / cols;
          const count = rage ? 3 : 2;
          shuffled(cols).slice(0, count).forEach((i) => addHazardRect(i * cw, 110, cw, H - 110, 1.1, 1.8, 'lava'));
        });
        break;
      case 'magic':
        tick(1.7, () => {
          const count = rage ? 5 : 4;
          for (let i = 0; i < count; i++) {
            const x = i === 0 ? p.x : rand(50, W - 50);
            const y = i === 0 ? p.y : rand(220, H - 160);
            R.hazards.push({ kind: 'circle', x, y, r: 46, warn: 1.1 + i * 0.12, t: 0, burst: rage ? 12 : 10 });
          }
        });
        break;
      case 'slow':
        tick(1.0, () => {
          const count = 5;
          for (let i = 0; i < count; i++) {
            aimedBullet(bs.x, bs.y + 30, 160, (i - (count - 1) / 2) * 0.26, bo);
          }
        });
        break;
      case 'lightning':
        tick(0.95, () => {
          addHazardRect(clamp(p.x - 30, 0, W - 60), 0, 60, H, 0.9, 0.25, 'bolt');
          if (rage) {
            addHazardRect(clamp(p.x - 160, 0, W - 60), 0, 60, H, 1.1, 0.25, 'bolt');
            addHazardRect(clamp(p.x + 100, 0, W - 60), 0, 60, H, 1.1, 0.25, 'bolt');
          }
        });
        break;
      case 'teleport':
        if (bs.sub === 'out') {
          bs.alpha = Math.max(0, bs.alpha - dt / 0.3);
          bs.ghost = bs.alpha < 0.6;
          if (bs.alpha <= 0) { bs.x = rand(70, W - 70); bs.y = rand(110, 230); bs.sub = 'in'; }
        } else if (bs.sub === 'in') {
          bs.alpha = Math.min(1, bs.alpha + dt / 0.3);
          bs.ghost = bs.alpha < 0.6;
          if (bs.alpha >= 1) {
            const count = rage ? 7 : 5;
            for (let i = 0; i < count; i++) {
              aimedBullet(bs.x, bs.y + 20, 230, (i - (count - 1) / 2) * 0.26, bo);
            }
            if (--bs.n <= 0) bossIdle();
            else { bs.sub = 'wait'; bs.pt = 0.5; }
          }
        } else {
          bs.pt -= dt;
          if (bs.pt <= 0) bs.sub = 'out';
        }
        break;
      case 'telegraph':
        bs.pt -= dt;
        if (bs.pt <= 0) { bs.phase = 'dash'; bs.tx = p.x; }
        break;
      case 'dash':
        bs.y += (bs.dashSpeed || 900) * dt;
        bs.x += (bs.tx - bs.x) * Math.min(1, 5 * dt);
        if (bs.y >= H - 200) bs.phase = 'return';
        break;
      case 'return':
        bs.y -= 380 * dt;
        if (bs.y <= BOSS_Y) { bs.y = BOSS_Y; bossIdle(); }
        break;
      default:
        bossIdle();
    }
  }

  function killBoss() {
    const R = run;
    const bs = R.boss;
    if (!bs) return;   // 같은 프레임에 여러 발이 동시에 맞아도 한 번만 처리
    bs.dead = true;
    R.boss = null;
    Sound.boss(false);
    Sound.sfx('bigboom');
    Sound.sfx('clear');
    R.phase = 'clear';
    R.phaseT = 0;
    R.ebullets = [];
    R.hazards = [];
    R.slowT = 0;
    for (const e of R.enemies) { e.dead = true; explode(e.x, e.y, e.size * 1.2); }
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
    Sound.sfx('item');
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

  function spark(x, y) {
    for (let i = 0; i < 3; i++) {
      const a = rand(0, 6.28);
      run.particles.push({ x, y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0, max: 0.25, size: 3, color: '#fff' });
    }
  }

  function killEnemy(e) {
    e.dead = true;
    g.score += e.score;
    explode(e.x, e.y, e.size * 1.4);
    Sound.sfx('boom');
    if (Math.random() < 0.1 * e.drop) dropItem(e.x, e.y, false);
  }

  function hitTarget(e, dmg) {
    if (e.dead) return;
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
      Sound.sfx('shield');
      return;
    }
    p.hp--;
    p.inv = 1.6;
    Sound.sfx('hurt');
    // 공격을 받으면 강화 단계가 한 단계 내려간다
    for (const k of UP_KEYS) if (p.up[k].lv > 0) { p.up[k].lv--; p.up[k].t = UP_SECONDS; }
    explode(p.x, p.y, 50, '#f87171');
    R.shake = 0.35;
    if (p.hp <= 0) {
      saveBest();
      setState('gameover');
      Sound.sfx('gameover');
    }
  }

  function useBomb() {
    const R = run;
    const p = R.player;
    if (p.bombs <= 0 || p.bombT > 0 || R.phase === 'clear') return;
    p.bombs--;
    p.bombT = BOMB_SECONDS;
    p.bombTick = 0.25;
    Sound.sfx('bomb');
    R.ebullets = [];
    R.hazards = R.hazards.filter((h) => h.kind === 'rect' && h.style === 'lava');   // 마법진/번개는 폭탄으로 제거
    R.shake = 0.5;
    R.rings.push({ x: p.x, y: p.y, r: 20, max: 520, life: 0, dur: 0.6, color: '#fde047', follow: false });
    for (const e of R.enemies) if (e.y > -20) hitTarget(e, 30);
    if (R.boss && !R.boss.ghost) hitTarget(R.boss, 12);
  }

  // ---------- 업데이트 ----------
  function updatePlayer(dt) {
    const R = run;
    const p = R.player;
    const spd = p.speed * (R.slowT > 0 ? SLOW_FACTOR : 1);
    const px0 = p.x;

    // 이동: 키보드 > 스틱 > 마우스
    const vx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    const vy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      p.x += vx / len * spd * dt;
      p.y += vy / len * spd * dt;
    } else if (input.stick.x || input.stick.y) {
      p.x += input.stick.x * spd * dt;
      p.y += input.stick.y * spd * dt;
    } else if (input.mouse.active) {
      const dx = input.mouse.x - p.x;
      const dy = input.mouse.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.5) {
        const step = Math.min(d, 800 * (spd / p.speed) * dt);
        p.x += dx / d * step;
        p.y += dy / d * step;
      }
    }
    p.x = clamp(p.x, 20, W - 20);
    p.y = clamp(p.y, 70, H - 20);
    // 좌우로 움직이면 비행기가 살짝 기울어진다
    p.bank += (clamp((p.x - px0) / (spd * dt || 1), -1, 1) - p.bank) * Math.min(1, 10 * dt);

    p.inv =Math.max(0, p.inv - dt);
    p.bombT = Math.max(0, p.bombT - dt);
    p.magnetT = Math.max(0, p.magnetT - dt);
    R.slowT = Math.max(0, R.slowT - dt);
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
        if (R.boss && R.boss.phase !== 'enter' && !R.boss.ghost) hitTarget(R.boss, 2.5);
      }
    }
  }

  function shoot() {
    const p = run.player;
    const u = p.up;
    Sound.sfx('shoot');
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
      if (e.dead || e.y < 0 || e.ghost) return;
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
      if (b.fuse !== undefined) {
        b.fuse -= dt;
        if (b.fuse <= 0 && !b.dead) {
          b.dead = true;
          for (let i = 0; i < b.burst; i++) {
            const a = (i / b.burst) * Math.PI * 2;
            enemyBullet(b.x, b.y, Math.cos(a) * 125, Math.sin(a) * 125, b.child);
          }
        }
      }
      if (b.y < -30 || b.y > H + 30 || b.x < -30 || b.x > W + 30) b.dead = true;
    }
  }

  function updateEnemies(dt) {
    const R = run;
    const p = R.player;
    for (const e of R.enemies) {
      e.t += dt;
      e.flash = Math.max(0, e.flash - dt);
      e.ang += (e.spin || 0) * dt;
      switch (e.move) {
        case 'sine':
          e.y += e.speed * dt;
          e.x = clamp(e.baseX + Math.sin(e.t * 2.2 + e.phase) * (e.amp || 50), 16, W - 16);
          break;
        case 'zig':
          e.zt -= dt;
          if (e.zt <= 0) { e.dir *= -1; e.vx = e.dir * e.speed * 0.9; e.zt = rand(0.7, 1.2); }
          e.x += e.vx * dt;
          e.y += e.speed * 0.8 * dt;
          if (e.x < 20 || e.x > W - 20) { e.dir *= -1; e.vx *= -1; e.x = clamp(e.x, 20, W - 20); }
          break;
        case 'chase':
          e.y += e.speed * dt;
          if (e.y < p.y - 30) e.x += clamp((p.x - e.x) * 4, -e.steer, e.steer) * dt;
          break;
        case 'strafe':
          e.x += e.vx * dt;
          e.y += (25 + Math.sin(e.t * 5 + e.phase) * 50) * dt;
          if (e.x < -70 || e.x > W + 70) e.dead = true;
          break;
        case 'fall':
          e.y += e.speed * dt;
          e.x += (e.drift || 0) * e.dir * dt;
          break;
        case 'hop':
          if (e.t % 1.1 < 0.4) { e.y += e.speed * 2.2 * dt; e.x += e.vx * dt; }
          else e.y += e.speed * 0.12 * dt;
          if (e.x < 30 || e.x > W - 30) { e.vx *= -1; e.x = clamp(e.x, 30, W - 30); }
          break;
        case 'bounce':
          e.y += e.speed * dt;
          e.x += e.vx * dt;
          if (e.x < e.r || e.x > W - e.r) { e.vx *= -1; e.x = clamp(e.x, e.r, W - e.r); }
          break;
        case 'shoot':
          e.y += e.speed * (e.y < 160 ? 1 : 0.4) * dt;
          e.fireT -= dt;
          if (e.fireT <= 0 && e.y > 0 && e.y < H - 200) {
            enemyFire(e);
            e.fireT = e.fireEvery;
          }
          break;
        case 'hover':
          if (!e.hovering) {
            e.y += e.speed * 1.1 * dt;
            if (e.y >= e.hoverY) e.hovering = true;
          } else if (e.hold > 0) {
            e.hold -= dt;
            e.x += e.vx * 0.35 * dt;
            if (e.x < 30 || e.x > W - 30) { e.vx *= -1; e.x = clamp(e.x, 30, W - 30); }
            e.fireT -= dt;
            if (e.fireT <= 0) { enemyFire(e); e.fireT = e.fireEvery; }
          } else {
            e.y += e.speed * 1.6 * dt;
          }
          break;
        default:
          e.y += e.speed * dt;
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

  function updateHazards(dt) {
    const R = run;
    const p = R.player;
    for (const h of R.hazards) {
      h.t += dt;
      if (h.kind === 'rect') {
        if (h.t > h.warn + h.active) { h.dead = true; continue; }
        if (h.t > h.warn) {
          const cx = clamp(p.x, h.x, h.x + h.w);
          const cy = clamp(p.y, h.y, h.y + h.h);
          if ((p.x - cx) ** 2 + (p.y - cy) ** 2 < p.r * p.r) hurt();
        }
      } else if (h.t >= h.warn) {
        h.dead = true;
        const bs = R.boss;
        const opts = { emoji: bs ? bs.bullet : null, size: 24, r: 8, spin: 4 };
        for (let i = 0; i < h.burst; i++) {
          const a = (i / h.burst) * Math.PI * 2 + h.x;
          enemyBullet(h.x, h.y, Math.cos(a) * 165, Math.sin(a) * 165, opts);
        }
        R.rings.push({ x: h.x, y: h.y, r: 10, max: 80, life: 0, dur: 0.35, color: '#c084fc', follow: false });
      }
    }
    R.hazards = R.hazards.filter((h) => !h.dead);
  }

  function collide() {
    const R = run;
    const p = R.player;
    const targets = R.boss ? [...R.enemies, R.boss] : R.enemies;

    for (const b of R.bullets) {
      for (const e of targets) {
        if (b.dead) break;
        if (e.dead || e.y < 0 || e.ghost || b.hit.has(e)) continue;
        const rr = b.r + e.r;
        if (dist2(b, e) < rr * rr) {
          b.hit.add(e);
          if (e.isBoss && e.guarded) {   // 풍차 날개가 막아 준다
            b.dead = true;
            spark(b.x, b.y);
            Sound.sfx('guard');
            continue;
          }
          Sound.sfx(e.isBoss ? 'bosshit' : 'hit');   // 미사일이 맞는 소리
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
    if (R.boss && !R.boss.ghost) {
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
      if (R.phaseT >= ch.duration) {
        R.phase = 'warning';
        R.phaseT = 0;
        Sound.boss(true);
        Sound.sfx('warning');
      }
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
    updateHazards(dt);
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
      ctx.save();
      ctx.translate(p.x, p.y + 3);
      ctx.scale(0.64, 0.64);
      Art.player(ctx, g.t, p.bank);
      ctx.restore();
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

  function drawHazard(h) {
    if (h.kind === 'rect') {
      if (h.t <= h.warn) {
        const pulse = 0.14 + 0.1 * Math.sin(h.t * 18);
        ctx.fillStyle = h.style === 'bolt' ? `rgba(253,224,71,${pulse})` : `rgba(255,70,20,${pulse + 0.08})`;
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.strokeStyle = h.style === 'bolt' ? 'rgba(253,224,71,0.6)' : 'rgba(255,120,60,0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(h.x + 1, h.y + 1, h.w - 2, h.h - 2);
        ctx.setLineDash([]);
      } else if (h.style === 'bolt') {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillRect(h.x + h.w * 0.2, h.y, h.w * 0.6, h.h);
        ctx.fillStyle = 'rgba(253,224,71,0.5)';
        ctx.fillRect(h.x, h.y, h.w, h.h);
      } else {
        const lg = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
        lg.addColorStop(0, 'rgba(253,224,71,0.9)');
        lg.addColorStop(0.15, 'rgba(255,110,20,0.88)');
        lg.addColorStop(1, 'rgba(200,40,10,0.9)');
        ctx.fillStyle = lg;
        ctx.fillRect(h.x, h.y, h.w, h.h);
      }
    } else {
      const prog = clamp(h.t / h.warn, 0, 1);
      ctx.strokeStyle = `rgba(192,132,252,${0.5 + 0.4 * prog})`;
      ctx.fillStyle = `rgba(147,51,234,${0.1 + 0.2 * prog})`;
      ctx.lineWidth = 3;
      const r = h.r * (0.4 + 0.6 * prog);
      ctx.beginPath();
      ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) {
        const a = h.t * 3 + (i * 2 * Math.PI * 2) / 5;
        const px = h.x + Math.cos(a) * r;
        const py = h.y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  function drawBoss(bs) {
    const shakeX = bs.phase === 'telegraph' ? rand(-5, 5) : 0;
    // 바닥 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(bs.x, bs.y + bs.size * 0.62, bs.size * 0.42, bs.size * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    // 전신 그림 (살짝 위아래로 숨 쉬듯 움직인다)
    ctx.save();
    ctx.translate(bs.x + shakeX, bs.y + Math.sin(bs.t * 2.2) * 3);
    const sc = bs.size / 125;
    ctx.scale(sc, sc);
    ctx.globalAlpha = bs.alpha;
    if (bs.flash > 0) ctx.filter = 'brightness(1.7)';   // 맞으면 번쩍
    Art.boss(ctx, bs.art, bs.t);
    ctx.restore();
    if (bs.phase === 'telegraph') {
      ctx.fillStyle = 'rgba(239,68,68,0.25)';
      ctx.fillRect(clamp(run.player.x, 0, W) - bs.r, bs.y, bs.r * 2, H - bs.y);
    }
    if (bs.guard) {   // 풍차 날개
      const closed = bs.guarded;
      ctx.save();
      ctx.translate(bs.x, bs.y);
      if (closed) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, bs.r + 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.rotate(closed ? bs.t * 4 : Math.PI / 4);
      ctx.globalAlpha = closed ? 0.95 : 0.3;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#f5e6c8';
        ctx.strokeStyle = '#8a5a2b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(-9, -(bs.r + 64), 18, 64);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
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
      if (bs.guarded) text('🛡 풍차 날개! 공격이 막힌다', W / 2, 126, 14, '#fde68a');
    }

    if (R.slowT > 0) text('⏳ 시간 감속! 이동이 느려진다', W / 2, R.boss ? 148 : 100, 16, '#e9d5ff');
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
    R.hazards.forEach(drawHazard);
    R.items.forEach(drawItem);
    for (const e of R.enemies) drawEmoji(e.emoji, e.x, e.y, e.size, e.ang, e.flash > 0 ? 0.55 : 1);
    if (R.boss) drawBoss(R.boss);
    R.bullets.forEach(drawBullet);
    R.ebullets.forEach(drawEnemyBullet);
    drawPlayer();
    drawFx();
    ctx.restore();

    if (R.slowT > 0) {
      ctx.fillStyle = 'rgba(168,85,247,0.14)';
      ctx.fillRect(0, 0, W, H);
    }

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

  function blinkText(str, y, size = 18, onCard = false) {
    if (Math.floor(g.t * 2) % 2 !== 0) return;
    if (onCard) ink(str, W / 2, y, size, '#d9622b');
    else text(str, W / 2, y, size, '#fde047');
  }

  function confirmHint() {
    return isTouchDevice() ? '화면을 터치하세요' : 'Enter / 클릭';
  }

  // 떠오르는 하트 (마지막 챕터 엔딩)
  function drawHearts() {
    for (let i = 0; i < 12; i++) {
      const t = (g.t * 0.35 + i * 0.137) % 1;
      const x = 40 + ((i * 97) % (W - 80)) + Math.sin(g.t * 2 + i) * 14;
      drawEmoji('❤️', x, H + 20 - t * (H + 60), 20 + (i % 3) * 8, 0, Math.sin(t * Math.PI));
    }
  }

  function drawStory(lines) {
    dim(0.3);
    if (isLastChapter() && g.state === 'outro') drawHearts();
    const lh = 36;
    const ch = lines.length * lh + 70;
    const top = H / 2 - ch / 2;
    card(30, top, W - 60, ch);
    lines.forEach((ln, i) => {
      if (!ln) return;
      ctx.globalAlpha = clamp((g.t - i * 0.35) / 0.5, 0, 1);
      const chapterTitle = i === 1 && lines[0].startsWith('챕터');
      const size = i === 0 ? 34 : chapterTitle ? 26 : 20;
      const color = i === 0 ? '#d9622b' : chapterTitle ? '#8a5a2b' : '#5b3a29';
      ink(ln, W / 2, top + 35 + lh / 2 + i * lh, size, color);
    });
    ctx.globalAlpha = 1;
    if (g.t > storyLength(lines)) blinkText(`${confirmHint()}  ·  계속`, top + ch + 34, 18);
  }

  function drawTitle() {
    dim(0.18);
    const bob = Math.sin(g.t * 3) * 6;
    ctx.save();
    ctx.translate(W / 2, 148 + bob);
    ctx.scale(1.5, 1.5);
    Art.player(ctx, g.t, Math.sin(g.t * 1.5) * 0.6);
    ctx.restore();

    card(30, 250, W - 60, 360);
    ink('고양이 기사의', W / 2, 305, 40, '#5b3a29');
    ink('탐험', W / 2, 362, 58, '#d9622b');
    ctx.strokeStyle = 'rgba(201,154,91,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, 408);
    ctx.lineTo(W - 90, 408);
    ctx.stroke();
    const rows = isTouchDevice()
      ? ['왼쪽 원형 스틱: 이동', '🚀 버튼: 미사일   💣 버튼: 폭탄', '폭탄을 쓰는 동안은 무적!']
      : ['방향키 또는 마우스: 이동', 'Q: 미사일   W: 폭탄', '폭탄을 쓰는 동안은 무적!  P: 일시정지  M: 소리'];
    rows.forEach((r, i) => ink(r, W / 2, 440 + i * 34, 18));
    if (g.best) ink(`BEST ${String(g.best).padStart(6, '0')}`, W / 2, 548, 16, '#8a6a4a');

    blinkText(`${confirmHint()} 으로 시작`, 585, 20, true);
  }

  function drawGameOver() {
    drawPlayBackdrop();
    dim(0.5);
    card(40, H / 2 - 150, W - 80, 300);
    ink('GAME OVER', W / 2, H / 2 - 100, 46, '#c0392b');
    ink('주인님 곁으로 가야 하는데...', W / 2, H / 2 - 45, 20);
    ink(`SCORE ${String(g.score).padStart(6, '0')}`, W / 2, H / 2 + 8, 26, '#d9622b');
    if (g.best) ink(`BEST ${String(g.best).padStart(6, '0')}`, W / 2, H / 2 + 44, 16, '#8a6a4a');
    blinkText(`${confirmHint()}  ·  챕터 다시 시작`, H / 2 + 100, 18, true);
  }

  function drawEnd() {
    dim(0.4);
    drawHearts();
    const top = H / 2 - 250;
    card(30, top, W - 60, 500);
    const bob = Math.sin(g.t * 3) * 5;
    drawEmoji('🧑', W / 2 - 40, top + 100 + bob, 84);
    drawEmoji('🐱', W / 2 + 34, top + 120 + bob, 64);
    drawEmoji('❤️', W / 2 - 2, top + 48 + bob, 34);
    ink('THE END', W / 2, top + 200, 50, '#d9622b');
    ink('고양이 기사는 주인님의 품에서', W / 2, top + 258, 20);
    ink('오래오래 행복하게 살았답니다.', W / 2, top + 292, 20);
    ink(`SCORE ${String(g.score).padStart(6, '0')}`, W / 2, top + 352, 26, '#d9622b');
    if (g.best) ink(`BEST ${String(g.best).padStart(6, '0')}`, W / 2, top + 388, 16, '#8a6a4a');
    blinkText(`${confirmHint()}  ·  타이틀로`, top + 450, 18, true);
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
        dim(0.4);
        card(80, H / 2 - 90, W - 160, 170);
        ink('일시정지', W / 2, H / 2 - 35, 44);
        ink(isTouchDevice() ? '화면을 터치하면 계속' : 'P / Esc / 클릭으로 계속', W / 2, H / 2 + 30, 18, '#d9622b');
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
  const debug = { steps: 1, onStep: null };   // 테스트용: 시뮬레이션 배속, 매 스텝 호출되는 봇 훅
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    g.t += dt;
    if (g.state === 'play') {
      for (let i = 0; i < debug.steps && g.state === 'play'; i++) {
        if (debug.onStep) debug.onStep();
        updateRun(dt);
      }
    } else if (g.state !== 'paused' && g.state !== 'gameover') {
      scrollBackground(dt);
    }
    render();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  setupBackground(chapter().bg);
  stage.dataset.state = 'title';
  syncMusic();
  requestAnimationFrame(frame);

  // 디버그/테스트용
  window.__catKnight = {
    g, input, keys, debug,
    get run() { return run; },
    jump(n) {   // 챕터 n을 바로 시작
      g.chapterIdx = n - 1;
      g.score = 0;
      g.chapterStartScore = 0;
      g.carry = null;
      startRun();
    },
  };
})();
