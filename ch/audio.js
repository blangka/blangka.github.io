// 배경음악과 효과음 (외부 파일 없이 WebAudio로 직접 만든 소리)
// 챕터마다 박자·음계·악기·반주가 다른 곡이 나오고, 보스전에서는 더 빠르고 강한 편곡으로 바뀝니다.
window.Sound = (() => {
  let ac = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let noiseBuf = null;
  let muted = false;
  try { muted = localStorage.getItem('catKnightMute') === '1'; } catch (e) { /* 저장소 사용 불가 */ }

  let want = null;      // 재생하고 싶은 곡 이름 (소리가 막혀 있어도 기억해 둔다)
  let curName = null;
  let cur = null;
  let bossOn = false;
  let timer = null;
  let nextT = 0;
  let step = 0;
  let ducked = false;
  const lastSfx = {};

  // ---------- 곡 정보 ----------
  const SC = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixo: [0, 2, 4, 5, 7, 9, 10],
    phryg: [0, 1, 3, 5, 7, 8, 10],
    harm: [0, 2, 3, 5, 7, 8, 11],
    lydian: [0, 2, 4, 6, 7, 9, 11],
  };

  // bass: slow(느리게) / oompah(쿵짝) / drive(8분음표로 달림)
  // drums: 0 없음 / 1 가볍게 / 2 힘차게
  const THEMES = {
    title:  { bpm: 84,  root: 55, scale: SC.major,  prog: [0, 4, 5, 3], lead: 'triangle', vol: 0.24, dens: 0.45, bass: 'slow',   arp: 'sine',     drums: 0, seed: 11 },
    end:    { bpm: 92,  root: 55, scale: SC.major,  prog: [0, 5, 3, 4], lead: 'triangle', vol: 0.28, dens: 0.5,  bass: 'slow',   arp: 'sine',     drums: 0, seed: 12 },
    // 1 햇살 좋은 앞마당: 통통 튀는 경쾌한 곡
    ch1:    { bpm: 126, root: 55, scale: SC.major,  prog: [0, 4, 5, 3], lead: 'square',   vol: 0.1,  dens: 0.62, bass: 'oompah', arp: null,       drums: 1, seed: 21 },
    // 2 달빛 안개 숲: 신비롭고 느린 곡
    ch2:    { bpm: 96,  root: 57, scale: SC.dorian, prog: [0, 3, 0, 4], lead: 'sine',     vol: 0.3,  dens: 0.35, bass: 'slow',   arp: 'triangle', drums: 0, seed: 22 },
    // 3 북적이는 시장: 빠르고 흥겨운 쿵짝
    ch3:    { bpm: 140, root: 50, scale: SC.mixo,   prog: [0, 3, 4, 0], lead: 'triangle', vol: 0.28, dens: 0.68, bass: 'oompah', arp: null,       drums: 1, seed: 23 },
    // 4 밀밭과 풍차: 포근한 시골 민요풍
    ch4:    { bpm: 112, root: 55, scale: SC.major,  prog: [0, 4, 3, 0], lead: 'triangle', vol: 0.26, dens: 0.55, bass: 'oompah', arp: 'sine',     drums: 1, seed: 24 },
    // 5 독안개 늪: 느릿하고 끈적한 곡
    ch5:    { bpm: 90,  root: 52, scale: SC.phryg,  prog: [0, 1, 0, 3], lead: 'sawtooth', vol: 0.07, dens: 0.4,  bass: 'slow',   arp: null,       drums: 1, seed: 25 },
    // 6 폭풍 치는 바다: 거칠게 몰아치는 항해곡
    ch6:    { bpm: 146, root: 50, scale: SC.minor,  prog: [0, 5, 3, 4], lead: 'square',   vol: 0.09, dens: 0.7,  bass: 'drive',  arp: null,       drums: 2, seed: 26 },
    // 7 용암 화산: 강렬하고 뜨거운 곡
    ch7:    { bpm: 154, root: 52, scale: SC.harm,   prog: [0, 5, 4, 0], lead: 'sawtooth', vol: 0.075, dens: 0.7, bass: 'drive',  arp: null,       drums: 2, seed: 27 },
    // 8 어둠의 성: 오르간 같은 으스스한 곡
    ch8:    { bpm: 108, root: 48, scale: SC.harm,   prog: [0, 3, 5, 4], lead: 'square',   vol: 0.06, dens: 0.4,  bass: 'slow',   arp: 'sine',     drums: 1, seed: 28 },
    // 9 시간의 탑: 반짝이는 종소리 같은 곡
    ch9:    { bpm: 118, root: 53, scale: SC.lydian, prog: [0, 1, 4, 0], lead: 'triangle', vol: 0.26, dens: 0.55, bass: 'slow',   arp: 'sine',     drums: 1, seed: 29 },
    // 10 비 오는 동네: 따뜻하고 애틋한 곡
    ch10:   { bpm: 100, root: 57, scale: SC.major,  prog: [0, 5, 3, 4], lead: 'triangle', vol: 0.3,  dens: 0.45, bass: 'slow',   arp: 'sine',     drums: 1, seed: 30 },
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

  // 곡마다 정해진 씨앗으로 8마디짜리 멜로디를 만든다 (같은 곡은 항상 같은 멜로디)
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
      comp.threshold.value = -16;
      comp.ratio.value = 6;
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(comp);
      comp.connect(ac.destination);
      musicBus = ac.createGain();
      musicBus.gain.value = 0.36;
      musicBus.connect(master);
      sfxBus = ac.createGain();
      sfxBus.gain.value = 0.85;
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
    if (o.detune) osc.detune.value = o.detune;
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
  const stepDur = () => 60 / (cur.bpm * (bossOn ? 1.1 : 1)) / 4;

  function kick(t, v) { tone(150, t, 0.16, 'sine', v, musicBus, { slide: 45 }); }
  function snare(t, v) { noise(t, 0.12, v, { hp: 1400, bus: musicBus }); tone(210, t, 0.08, 'triangle', v * 0.5, musicBus); }
  function hat(t, v) { noise(t, 0.04, v, { hp: 7000, bus: musicBus }); }

  function scheduleStep(t) {
    const th = cur;
    const s = step;
    const pos = s % 16;
    const bar = Math.floor(s / 16) % th.prog.length;
    const cr = th.prog[bar];
    const sd = stepDur();

    // 베이스
    const bassHit = th.bass === 'drive' ? pos % 2 === 0
      : th.bass === 'oompah' ? pos % 4 === 0
        : pos === 0 || pos === 8 || (bossOn && pos % 4 === 0);
    if (bassHit) {
      const fifth = th.bass === 'oompah' && pos % 8 === 4;
      const f = midi(degToMidi(th, cr - 7 + (fifth ? 4 : 0)));
      tone(f, t, sd * (th.bass === 'drive' ? 1.7 : 3.4), th.bass === 'drive' ? 'sawtooth' : 'triangle', th.bass === 'drive' ? 0.17 : 0.5, musicBus, { attack: 0.01 });
    }
    // 부드러운 화음
    if (pos === 0) {
      [0, 2, 4].forEach((k) => tone(midi(degToMidi(th, cr + k)), t, sd * 15, 'sine', 0.07, musicBus, { attack: 0.3 }));
    }
    // 아르페지오
    if (th.arp && pos % 2 === 0) {
      const seq = [0, 2, 4, 7, 4, 2];
      const d = cr + seq[(s >> 1) % seq.length] + 7;
      tone(midi(degToMidi(th, d)), t, sd * 3, th.arp, 0.13, musicBus);
    }
    // 멜로디
    const n = th.mel[s % th.mel.length];
    if (n) {
      const f = midi(degToMidi(th, n.d));
      tone(f, t, n.len * sd, th.lead, th.vol, musicBus);
      if (th.lead === 'triangle' || th.lead === 'sine') tone(f * 2.005, t, n.len * sd * 0.6, 'sine', th.vol * 0.22, musicBus);
      if (bossOn) tone(f * 2, t, n.len * sd, 'triangle', th.vol * 0.35, musicBus);
    }
    // 드럼
    const style = bossOn ? 2 : th.drums;
    if (style === 1) {
      if (pos === 0 || pos === 8) kick(t, 0.5);
      if (pos % 4 === 2) hat(t, 0.1);
      if (pos === 12) snare(t, 0.12);
    } else if (style === 2) {
      if (pos === 0 || pos === 8 || pos === 10 || (bossOn && pos === 6)) kick(t, 0.65);
      if (pos === 4 || pos === 12) snare(t, 0.22);
      if (pos % 2 === 0) hat(t, 0.12);
    }
  }

  function tick() {
    if (!ac || !cur) return;
    if (nextT < ac.currentTime - 0.1) nextT = ac.currentTime + 0.05;   // 탭이 멈췄다 돌아오면 따라잡지 않고 새로 시작
    while (nextT < ac.currentTime + 0.25) {
      scheduleStep(nextT);
      nextT += stepDur();
      step++;
    }
  }

  function startWanted() {
    if (!ac || !want) return;
    const th = THEMES[want];
    if (!th) return;
    if (curName === want) return;
    curName = want;
    cur = th;
    step = 0;
    nextT = ac.currentTime + 0.1;
    const now = ac.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(0.0001, now);
    musicBus.gain.linearRampToValueAtTime(ducked ? 0.1 : 0.36, now + 0.4);
    if (!timer) timer = setInterval(tick, 60);
    tick();
  }

  // ---------- 효과음 ----------
  const SFX = {
    shoot(t) { tone(980, t, 0.07, 'square', 0.035, sfxBus, { slide: 520 }); },
    hit(t) { tone(720, t, 0.05, 'triangle', 0.09, sfxBus, { slide: 330 }); noise(t, 0.03, 0.05, { hp: 3000 }); },
    bosshit(t) { tone(210, t, 0.1, 'triangle', 0.16, sfxBus, { slide: 110 }); noise(t, 0.05, 0.07, { hp: 1500 }); },
    guard(t) { tone(1500, t, 0.12, 'triangle', 0.08, sfxBus, { slide: 1100 }); tone(2250, t, 0.1, 'sine', 0.04, sfxBus); },
    boom(t) { noise(t, 0.25, 0.22, { lp: 2600, lpTo: 250 }); tone(170, t, 0.2, 'sine', 0.2, sfxBus, { slide: 55 }); },
    bigboom(t) { noise(t, 0.9, 0.34, { lp: 2200, lpTo: 120 }); tone(130, t, 0.8, 'sine', 0.32, sfxBus, { slide: 38 }); },
    bomb(t) {
      noise(t, 1.1, 0.34, { lp: 3000, lpTo: 140 });
      tone(120, t, 1.0, 'sine', 0.38, sfxBus, { slide: 32 });
      tone(440, t, 0.5, 'sawtooth', 0.07, sfxBus, { slide: 110 });
    },
    hurt(t) { tone(420, t, 0.32, 'sawtooth', 0.16, sfxBus, { slide: 90 }); noise(t, 0.18, 0.12, { lp: 1800 }); },
    shield(t) { tone(900, t, 0.25, 'triangle', 0.14, sfxBus, { slide: 400 }); },
    item(t) { [660, 880, 1320].forEach((f, i) => tone(f, t + i * 0.06, 0.16, 'triangle', 0.15, sfxBus)); },
    warning(t) { for (let i = 0; i < 4; i++) tone(i % 2 ? 520 : 760, t + i * 0.3, 0.26, 'sawtooth', 0.1, sfxBus); },
    select(t) { tone(660, t, 0.08, 'triangle', 0.1, sfxBus); tone(990, t + 0.06, 0.1, 'triangle', 0.1, sfxBus); },
    clear(t) {
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => {
        tone(f, t + i * 0.13, 0.4, 'triangle', 0.2, sfxBus);
        tone(f * 2, t + i * 0.13, 0.3, 'sine', 0.05, sfxBus);
      });
    },
    gameover(t) { [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * 0.28, 0.5, 'triangle', 0.22, sfxBus)); },
  };
  const THROTTLE = { shoot: 0.07, hit: 0.045, bosshit: 0.07, guard: 0.1, boom: 0.05 };

  // ---------- 바깥에서 쓰는 함수 ----------
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
    stop() {
      want = null;
      curName = null;
      cur = null;
    },
    boss(on) { bossOn = on; },
    duck(on) {
      ducked = on;
      if (ac && cur) musicBus.gain.setTargetAtTime(on ? 0.1 : 0.36, ac.currentTime, 0.08);
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
      try { localStorage.setItem('catKnightMute', muted ? '1' : '0'); } catch (e) { /* 무시 */ }
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.03);
      return muted;
    },
    get muted() { return muted; },
    get running() { return !!ac && ac.state === 'running'; },
  };
})();
