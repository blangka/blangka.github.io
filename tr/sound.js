// 배경음악과 효과음 (외부 파일 없이 WebAudio로 직접 만든 소리)
// 어린이 게임이라 밝고 통통 튀는 곡만 쓰고, 큰 소리나 거친 소리는 쓰지 않습니다.
window.Sound = (() => {
  let ac = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let noiseBuf = null;
  let muted = false;
  try { muted = localStorage.getItem('taeriMute') === '1'; } catch (e) { /* 저장소 사용 불가 */ }

  let want = null;      // 재생하고 싶은 곡 (소리가 막혀 있어도 기억해 둔다)
  let curName = null;
  let cur = null;
  let timer = null;
  let nextT = 0;
  let step = 0;
  let ducked = false;
  let fast = false;
  const lastSfx = {};

  const SC = {
    major: [0, 2, 4, 5, 7, 9, 11],
    pent: [0, 2, 4, 7, 9],
    mixo: [0, 2, 4, 5, 7, 9, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
  };

  // bass: slow / oompah(쿵짝)  drums: 0 없음 / 1 가볍게
  const THEMES = {
    title:  { bpm: 104, root: 53, scale: SC.major,  prog: [0, 4, 5, 3], lead: 'triangle', vol: 0.3,  dens: 0.55, bass: 'oompah', arp: 'sine',     drums: 1, seed: 41 },
    c1:     { bpm: 126, root: 55, scale: SC.major,  prog: [0, 3, 4, 0], lead: 'square',   vol: 0.085, dens: 0.66, bass: 'oompah', arp: null,       drums: 1, seed: 42 },
    c2:     { bpm: 112, root: 50, scale: SC.mixo,   prog: [0, 3, 0, 4], lead: 'triangle', vol: 0.3,  dens: 0.6,  bass: 'oompah', arp: 'sine',     drums: 1, seed: 43 },
    c3:     { bpm: 132, root: 57, scale: SC.lydian, prog: [0, 1, 4, 0], lead: 'triangle', vol: 0.28, dens: 0.62, bass: 'oompah', arp: 'sine',     drums: 1, seed: 44 },
    ending: { bpm: 96,  root: 55, scale: SC.pent,   prog: [0, 3, 4, 0], lead: 'triangle', vol: 0.3,  dens: 0.5,  bass: 'slow',   arp: 'sine',     drums: 0, seed: 45 },
  };

  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const degToMidi = (th, d) => {
    const n = th.scale.length;
    return th.root + Math.floor(d / n) * 12 + th.scale[((d % n) + n) % n];
  };

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 곡마다 정해진 씨앗으로 멜로디를 만든다 (같은 곡은 항상 같은 멜로디)
  function buildMelody(th) {
    const r = rng(th.seed);
    const out = [];
    let prev = th.prog[0] + 9;
    const bars = th.prog.length * 2;
    for (let i = 0; i < bars * 16; i++) {
      const pos = i % 16;
      const chord = th.prog[Math.floor(i / 16) % th.prog.length];
      const p = pos % 4 === 0 ? 0.9 : pos % 2 === 0 ? th.dens : th.dens * 0.3;
      if (r() > p) { out.push(null); continue; }
      let d;
      if (pos % 4 === 0) d = chord + 7 + [0, 2, 4, 7][Math.floor(r() * 4)];
      else d = prev + Math.floor(r() * 5) - 2;
      d = Math.max(th.prog[0] + 5, Math.min(d, th.prog[0] + 16));
      prev = d;
      out.push({ d, len: r() < 0.3 ? 4 : 2 });
    }
    th.mel = out;
  }
  Object.values(THEMES).forEach(buildMelody);

  // ---------- 소리 만들기 ----------
  function init() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ac = new AC();
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(comp);
      comp.connect(ac.destination);
      musicBus = ac.createGain();
      musicBus.gain.value = 0.34;
      musicBus.connect(master);
      sfxBus = ac.createGain();
      sfxBus.gain.value = 0.8;
      sfxBus.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) {
      ac = null;
      return false;
    }
  }

  function tone(freq, t, dur, type, vol, bus, o = {}) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + (o.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(bus || sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(t, dur, vol, o = {}) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = src;
    if (o.hp) {
      const f = ac.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = o.hp;
      node.connect(f);
      node = f;
    }
    if (o.lp) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(o.lp, t);
      if (o.lpTo) f.frequency.exponentialRampToValueAtTime(o.lpTo, t + dur);
      node.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(o.bus || sfxBus);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // ---------- 배경음악 ----------
  const stepDur = () => 60 / (cur.bpm * (fast ? 1.08 : 1)) / 4;

  function scheduleStep(t) {
    const th = cur;
    const s = step;
    const pos = s % 16;
    const bar = Math.floor(s / 16) % th.prog.length;
    const cr = th.prog[bar];
    const sd = stepDur();

    // 베이스
    const bassHit = th.bass === 'oompah' ? pos % 4 === 0 : pos === 0 || pos === 8;
    if (bassHit) {
      const fifth = th.bass === 'oompah' && pos % 8 === 4;
      tone(midi(degToMidi(th, cr - 7 + (fifth ? 4 : 0))), t, sd * 3.2, 'triangle', 0.5, musicBus, { attack: 0.01 });
    }
    // 부드러운 화음
    if (pos === 0) {
      [0, 2, 4].forEach((k) => tone(midi(degToMidi(th, cr + k)), t, sd * 15, 'sine', 0.07, musicBus, { attack: 0.3 }));
    }
    // 아르페지오
    if (th.arp && pos % 2 === 0) {
      const seq = [0, 2, 4, 7, 4, 2];
      tone(midi(degToMidi(th, cr + seq[(s >> 1) % seq.length] + 7)), t, sd * 3, th.arp, 0.12, musicBus);
    }
    // 멜로디
    const n = th.mel[s % th.mel.length];
    if (n) {
      const f = midi(degToMidi(th, n.d));
      tone(f, t, n.len * sd, th.lead, th.vol, musicBus);
      if (th.lead === 'triangle') tone(f * 2.005, t, n.len * sd * 0.6, 'sine', th.vol * 0.22, musicBus);
    }
    // 가벼운 드럼
    if (th.drums) {
      if (pos === 0 || pos === 8) tone(150, t, 0.14, 'sine', 0.42, musicBus, { slide: 50 });
      if (pos % 4 === 2) noise(t, 0.04, 0.08, { hp: 7000, bus: musicBus });
      if (pos === 12) { noise(t, 0.1, 0.09, { hp: 1500, bus: musicBus }); tone(210, t, 0.07, 'triangle', 0.2, musicBus); }
    }
  }

  function tick() {
    if (!ac || !cur) return;
    if (nextT < ac.currentTime - 0.1) nextT = ac.currentTime + 0.05;   // 탭이 멈췄다 돌아오면 새로 시작
    while (nextT < ac.currentTime + 0.25) {
      scheduleStep(nextT);
      nextT += stepDur();
      step++;
    }
  }

  function startWanted() {
    if (!ac || !want) return;
    const th = THEMES[want];
    if (!th || curName === want) return;
    curName = want;
    cur = th;
    step = 0;
    nextT = ac.currentTime + 0.1;
    const now = ac.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(0.0001, now);
    musicBus.gain.linearRampToValueAtTime(ducked ? 0.1 : 0.34, now + 0.4);
    if (!timer) timer = setInterval(tick, 60);
    tick();
  }

  // ---------- 효과음 ----------
  const SFX = {
    lane(t) { tone(520, t, 0.05, 'triangle', 0.05, sfxBus, { slide: 700 }); },
    beep(t) { tone(660, t, 0.18, 'triangle', 0.22, sfxBus); },
    go(t) { [880, 1109, 1319].forEach((f, i) => tone(f, t + i * 0.05, 0.4, 'triangle', 0.2, sfxBus)); },
    star(t) { tone(1320, t, 0.1, 'triangle', 0.16, sfxBus); tone(1760, t + 0.07, 0.18, 'triangle', 0.16, sfxBus); },
    boost(t) {
      noise(t, 0.7, 0.14, { lp: 600, lpTo: 5000 });
      tone(280, t, 0.6, 'sawtooth', 0.07, sfxBus, { slide: 1300 });
      [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.07, 0.3, 'triangle', 0.14, sfxBus));
    },
    pad(t) { noise(t, 0.3, 0.1, { lp: 800, lpTo: 4000 }); tone(400, t, 0.25, 'triangle', 0.12, sfxBus, { slide: 1000 }); },
    bonk(t) { tone(190, t, 0.22, 'triangle', 0.3, sfxBus, { slide: 70 }); noise(t, 0.08, 0.1, { lp: 1800 }); },
    splash(t) { noise(t, 0.35, 0.16, { lp: 3000, lpTo: 400 }); tone(500, t, 0.2, 'sine', 0.1, sfxBus, { slide: 200 }); },
    boing(t) { tone(280, t, 0.28, 'triangle', 0.2, sfxBus, { slide: 760 }); tone(760, t + 0.26, 0.18, 'triangle', 0.14, sfxBus, { slide: 300 }); },
    select(t) { tone(660, t, 0.08, 'triangle', 0.12, sfxBus); tone(990, t + 0.06, 0.1, 'triangle', 0.12, sfxBus); },
    win(t) {
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => {
        tone(f, t + i * 0.12, 0.4, 'triangle', 0.2, sfxBus);
        tone(f * 2, t + i * 0.12, 0.3, 'sine', 0.05, sfxBus);
      });
    },
    lose(t) { [392, 349, 311, 262].forEach((f, i) => tone(f, t + i * 0.28, 0.5, 'triangle', 0.2, sfxBus)); },
  };
  const THROTTLE = { lane: 0.06, star: 0.05, bonk: 0.15, splash: 0.15 };

  return {
    unlock() {
      if (!init()) return;
      if (ac.state === 'suspended') ac.resume().then(startWanted).catch(() => {});
      else startWanted();
    },
    music(name) {
      want = name;
      if (ac && ac.state === 'running') startWanted();
    },
    stop() { want = null; curName = null; cur = null; },
    fast(on) { fast = on; },
    duck(on) {
      ducked = on;
      if (ac && cur) musicBus.gain.setTargetAtTime(on ? 0.1 : 0.34, ac.currentTime, 0.08);
    },
    sfx(name) {
      if (!ac || muted || ac.state !== 'running') return;
      const f = SFX[name];
      if (!f) return;
      const now = ac.currentTime;
      if (THROTTLE[name] && now - (lastSfx[name] || -1) < THROTTLE[name]) return;
      lastSfx[name] = now;
      f(now + 0.005);
    },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('taeriMute', muted ? '1' : '0'); } catch (e) { /* 무시 */ }
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.03);
      return muted;
    },
    get muted() { return muted; },
    get running() { return !!ac && ac.state === 'running'; },
  };
})();
