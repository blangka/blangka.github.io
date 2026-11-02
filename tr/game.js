// 태리가 만든 라부부랑 자동차 대결
// 왼쪽/오른쪽 키(모바일은 큰 버튼 두 개)만으로 하는 어린이용 자동차 경주 게임
// 규칙과 설명은 document/game-tr.md 참고
(() => {
  'use strict';

  const W = 480;          // 논리 해상도 너비 (높이 H는 화면 비율에 맞춰 달라짐)
  let H = 800;
  const FONT = '"Jua","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const INK = '#5a3a30';   // 모든 그림에 쓰는 따뜻한 갈색 윤곽선
  const PINK = '#ff5fa2';
  const MINT = '#9b7bec';   // 라부부 보라색

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // ---------- 유틸 ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pad2 = (n) => String(n).padStart(2, '0');

  function weighted(keys, weightOf) {
    let total = 0;
    for (const k of keys) total += weightOf(k);
    let r = Math.random() * total;
    for (const k of keys) {
      r -= weightOf(k);
      if (r <= 0) return k;
    }
    return keys[keys.length - 1];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- 도로 크기 ----------
  const LANES = 3;
  const LANE_W = 100;
  const ROAD_W = LANES * LANE_W;
  const ROAD_X = (W - ROAD_W) / 2;
  const laneX = (i) => ROAD_X + LANE_W * (i + 0.5);
  const BASE = 330;                 // 기본 속도 (1초에 달리는 거리)
  const carY = () => H - 250;       // 태리 자동차의 화면 위치

  // ---------- 코스 ----------
  const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc'];

  const COURSES = [
    {
      id: 1, name: '동네 놀이터 길', goal: '라부부보다 먼저 도착하자!',
      length: 10500, gap: [430, 560], laboo: 1.07, mistake: 0.15, music: 'c1',
      weights: { obs1: 3, obs2: 0.8, stars: 4, pad: 1.5, puddle: 1.4, empty: 1.2 },
      ground: ['#93dc6b', '#86d25f'], road: '#707689', curb: ['#ff5d6c', '#ffffff'],
      decor: ['🌳', '🌲', '🌷', '🌼', '🌻', '🏠', '🎠', '⛲'],
      obstacles: [{ kind: 'cone' }, { kind: 'emoji', ch: '🪨' }, { kind: 'emoji', ch: '🪵' }],
      puddle: '#7cc6ff',
    },
    {
      id: 2, name: '반짝반짝 바닷가', goal: '파도 소리를 들으며 달려요!',
      length: 13500, gap: [360, 480], laboo: 1.10, mistake: 0.12, music: 'c2', water: true,
      weights: { obs1: 3, obs2: 1.5, stars: 4, pad: 1.5, puddle: 1.5, empty: 1 },
      ground: ['#f8e3a1', '#f3d98b'], road: '#8f8a9c', curb: ['#3bc9db', '#ffffff'],
      decor: ['🌴', '🐚', '⛱️', '🌺', '🏖️', '🦩'],
      obstacles: [{ kind: 'emoji', ch: '🦀' }, { kind: 'emoji', ch: '🏐' }, { kind: 'emoji', ch: '🪣' }],
      puddle: '#6ec1ff',
    },
    {
      id: 3, name: '무지개 하늘길', goal: '구름 위 사탕 길을 달려요!',
      length: 16500, gap: [320, 430], laboo: 1.13, mistake: 0.1, music: 'c3', sky: true,
      weights: { obs1: 3, obs2: 2.2, stars: 4, pad: 1.5, puddle: 1.4, empty: 0.9 },
      ground: ['#d8c9ff', '#cfbffb'], road: '#ff9ed2', curb: RAINBOW,
      decor: ['☁️', '🎈', '🍭', '🍬', '🧁', '🎀', '🌈'],
      obstacles: [{ kind: 'emoji', ch: '🍭' }, { kind: 'emoji', ch: '🍩' }, { kind: 'emoji', ch: '🧁' }],
      puddle: '#ff8fc7',
    },
  ];

  // ---------- 이모지 그림 캐시 ----------
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

  function emoji(ch, x, y, size, rot = 0, alpha = 1) {
    const s = sprite(ch, size);
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.drawImage(s.c, -s.w / 2, -s.w / 2, s.w, s.w);
    ctx.restore();
  }

  // ---------- 그리기 도구 ----------
  function paint(fill, stroke, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  function oval(x, y, rx, ry, fill, stroke = INK, lw = 2.5, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    paint(fill, stroke, lw);
  }
  function poly(pts, fill, stroke = INK, lw = 2.5) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    paint(fill, stroke, lw);
  }
  function rrPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function rrect(x, y, w, h, r, fill, stroke = INK, lw = 2.5) {
    rrPath(x, y, w, h, r);
    paint(fill, stroke, lw);
  }

  // 말랑한 글씨: 흰 글자 + 굵은 색 테두리
  function bubble(str, x, y, size, fill = '#fff', stroke = PINK, align = 'center', maxW = W - 40) {
    ctx.font = `${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, size / 4.5);
    ctx.strokeStyle = stroke;
    ctx.strokeText(str, x, y, maxW);
    ctx.fillStyle = fill;
    ctx.fillText(str, x, y, maxW);
  }
  // 카드 위에 쓰는 갈색 글씨
  function ink(str, x, y, size, color = '#6b4336', align = 'center', maxW = W - 90) {
    ctx.font = `${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y, maxW);
  }

  function card(x, y, w, h) {
    ctx.save();
    ctx.shadowColor = 'rgba(80,30,70,0.4)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    rrPath(x, y, w, h, 26);
    ctx.fillStyle = '#fff8e8';
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 5;
    rrPath(x + 7, y + 7, w - 14, h - 14, 20);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,95,162,0.35)';
    ctx.lineWidth = 2;
    rrPath(x + 14, y + 14, w - 28, h - 28, 14);
    ctx.stroke();
  }

  // 키보드 방향키 모양 버튼 그림
  function keycap(label, x, y, size, pressed = false, color = PINK) {
    const w = size;
    ctx.save();
    ctx.translate(x, y + (pressed ? 3 : 0));
    rrect(-w / 2, -w / 2, w, w, w * 0.22, '#fff', color, 4);
    ctx.fillStyle = color;
    ctx.font = `${size * 0.55}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, size * 0.03);
    ctx.restore();
  }

  // ---------- 캐릭터: 임태리 (7살 여자아이) ----------
  function taeriHead(cx, cy, r, mood = 'smile') {
    const lw = Math.max(1.6, r * 0.09);
    const HAIR = '#4b2a22';
    const SKIN = '#ffdcc2';
    // 사과머리: 머리 위쪽 양옆으로 동그랗게 묶은 머리 뭉치와 분홍 리본
    for (const s of [-1, 1]) {
      const ax = cx + s * r * 0.7;
      const ay = cy - r * 1.08;
      // 묶은 머리 밑동
      poly([[cx + s * r * 0.5, cy - r * 0.78], [ax - s * r * 0.18, ay + r * 0.32], [ax + s * r * 0.12, ay + r * 0.38], [cx + s * r * 0.8, cy - r * 0.5]], HAIR, INK, lw);
      // 동그란 사과 모양 머리 뭉치
      oval(ax, ay, r * 0.46, r * 0.44, HAIR, INK, lw);
      // 머리 윤기
      ctx.beginPath();
      ctx.arc(ax - s * r * 0.04, ay - r * 0.04, r * 0.3, Math.PI * (s < 0 ? 1.15 : 1.1), Math.PI * (s < 0 ? 1.55 : 1.5));
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = lw * 1.1;
      ctx.stroke();
    }
    // 뒷머리
    oval(cx, cy - r * 0.04, r * 1.0, r * 0.98, HAIR, INK, lw);
    // 얼굴
    oval(cx, cy + r * 0.08, r * 0.96, r * 0.92, SKIN, INK, lw);
    // 앞머리
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.97, cy - r * 0.04);
    ctx.bezierCurveTo(cx - r * 1.02, cy - r * 1.3, cx + r * 1.02, cy - r * 1.3, cx + r * 0.97, cy - r * 0.04);
    ctx.quadraticCurveTo(cx + r * 0.72, cy - r * 0.5, cx + r * 0.46, cy - r * 0.1);
    ctx.quadraticCurveTo(cx + r * 0.22, cy - r * 0.55, cx - r * 0.02, cy - r * 0.1);
    ctx.quadraticCurveTo(cx - r * 0.28, cy - r * 0.55, cx - r * 0.54, cy - r * 0.1);
    ctx.quadraticCurveTo(cx - r * 0.78, cy - r * 0.5, cx - r * 0.97, cy - r * 0.04);
    ctx.closePath();
    paint(HAIR, INK, lw);
    // 머리 윤기
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.62, r * 0.42, Math.PI * 1.15, Math.PI * 1.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = lw * 1.2;
    ctx.stroke();
    // 사과머리 분홍 리본 (머리 뭉치를 묶은 자리, 맨 앞에 그려서 잘 보이게)
    for (const s of [-1, 1]) {
      const bx = cx + s * r * 0.74;
      const by = cy - r * 0.7;
      poly([[bx - r * 0.4, by - r * 0.26], [bx, by], [bx - r * 0.4, by + r * 0.26]], PINK, INK, lw * 0.8);
      poly([[bx + r * 0.4, by - r * 0.26], [bx, by], [bx + r * 0.4, by + r * 0.26]], PINK, INK, lw * 0.8);
      oval(bx, by, r * 0.13, r * 0.13, '#ff2e84', INK, lw * 0.7);
    }
    // 눈
    for (const s of [-1, 1]) {
      const ex = cx + s * r * 0.38;
      const ey = cy + r * 0.2;
      if (mood === 'happy') {
        ctx.beginPath();
        ctx.arc(ex, ey + r * 0.04, r * 0.15, Math.PI * 1.1, Math.PI * 1.9);
        ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.2; ctx.lineCap = 'round'; ctx.stroke();
      } else if (mood === 'dizzy') {
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.12, ey - r * 0.12); ctx.lineTo(ex + r * 0.12, ey + r * 0.12);
        ctx.moveTo(ex + r * 0.12, ey - r * 0.12); ctx.lineTo(ex - r * 0.12, ey + r * 0.12);
        ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.1; ctx.lineCap = 'round'; ctx.stroke();
      } else {
        oval(ex, ey, r * 0.125, r * 0.18, '#2b1b17', null);
        oval(ex - r * 0.04, ey - r * 0.07, r * 0.045, r * 0.045, '#fff', null);
      }
    }
    // 볼터치와 코
    oval(cx - r * 0.6, cy + r * 0.46, r * 0.17, r * 0.1, 'rgba(255,100,150,0.55)', null);
    oval(cx + r * 0.6, cy + r * 0.46, r * 0.17, r * 0.1, 'rgba(255,100,150,0.55)', null);
    oval(cx, cy + r * 0.36, r * 0.035, r * 0.03, '#d98b73', null);
    // 입
    ctx.lineCap = 'round';
    if (mood === 'happy') {
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.46, r * 0.24, 0, Math.PI);
      ctx.closePath();
      paint('#d6336c', INK, lw * 0.9);
      oval(cx, cy + r * 0.62, r * 0.11, r * 0.06, '#ff8fb1', null);
    } else if (mood === 'sad' || mood === 'dizzy') {
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.7, r * 0.17, Math.PI * 1.15, Math.PI * 1.85);
      ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke();
      if (mood === 'sad') oval(cx + r * 0.7, cy + r * 0.34, r * 0.07, r * 0.12, '#7fd0ff', INK, lw * 0.5);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.42, r * 0.2, Math.PI * 0.12, Math.PI * 0.88);
      ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke();
    }
  }

  // ---------- 캐릭터: 라부부 (알록달록 복슬복슬 토끼 후드를 쓴 인형) ----------
  function furGrad(x0, y0, x1, y1) {
    const gr = ctx.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, '#9fd6ff');
    gr.addColorStop(0.42, '#c7b6ff');
    gr.addColorStop(0.75, '#ffbbdf');
    gr.addColorStop(1, '#b9c8ff');
    return gr;
  }

  // 복슬복슬한 털뭉치: 둥근 털 조각을 가장자리에 빙 둘러 붙이고, 파랑·분홍으로 물든 느낌을 입힌다
  function furBlob(cx, cy, rx, ry, n, tuft, lw) {
    const TAU = Math.PI * 2;
    const circles = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      circles.push([cx + Math.cos(a) * rx * 0.9, cy + Math.sin(a) * ry * 0.9, tuft * (0.9 + 0.2 * Math.sin(i * 2.7))]);
    }
    ctx.fillStyle = INK;                                   // 바깥 윤곽선: 조금 더 큰 원을 먼저 깐다
    for (const c of circles) { ctx.beginPath(); ctx.arc(c[0], c[1], c[2] + lw, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.9 + lw, ry * 0.9 + lw, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = furGrad(cx - rx, cy - ry, cx + rx, cy + ry);
    for (const c of circles) { ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.9, ry * 0.9, 0, 0, TAU); ctx.fill();
    // 알록달록 물든 느낌 (털 모양 안쪽에만)
    ctx.save();
    ctx.beginPath();
    for (const c of circles) { ctx.moveTo(c[0] + c[2], c[1]); ctx.arc(c[0], c[1], c[2], 0, TAU); }
    ctx.moveTo(cx + rx * 0.9, cy);
    ctx.ellipse(cx, cy, rx * 0.9, ry * 0.9, 0, 0, TAU);
    ctx.clip();
    const m = Math.max(rx, ry);
    const pink = ctx.createRadialGradient(cx + rx * 0.4, cy + ry * 0.5, 0, cx + rx * 0.4, cy + ry * 0.5, m * 0.85);
    pink.addColorStop(0, 'rgba(255,150,205,0.6)');
    pink.addColorStop(1, 'rgba(255,150,205,0)');
    ctx.fillStyle = pink;
    ctx.fillRect(cx - rx * 1.2, cy - ry * 1.2, rx * 2.4, ry * 2.4);
    const blue = ctx.createRadialGradient(cx - rx * 0.5, cy - ry * 0.35, 0, cx - rx * 0.5, cy - ry * 0.35, m * 0.85);
    blue.addColorStop(0, 'rgba(130,200,255,0.65)');
    blue.addColorStop(1, 'rgba(130,200,255,0)');
    ctx.fillStyle = blue;
    ctx.fillRect(cx - rx * 1.2, cy - ry * 1.2, rx * 2.4, ry * 2.4);
    ctx.restore();
  }

  // 길고 둥근 토끼 귀 (안쪽은 살구색, 반짝이는 줄무늬가 있어요)
  function labooEar(r, side, wig, lw) {
    ctx.save();
    ctx.translate(side * r * 0.5, -r * 0.7);
    ctx.rotate(side * (0.16 + wig));
    ctx.beginPath();
    ctx.moveTo(-r * 0.36, r * 0.25);
    ctx.bezierCurveTo(-r * 0.5, -r * 0.6, -r * 0.38, -r * 1.6, 0, -r * 1.62);
    ctx.bezierCurveTo(r * 0.38, -r * 1.6, r * 0.5, -r * 0.6, r * 0.36, r * 0.25);
    ctx.closePath();
    ctx.fillStyle = furGrad(-r * 0.4, -r * 1.6, r * 0.4, r * 0.2);
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, r * 0.12);
    ctx.bezierCurveTo(-r * 0.3, -r * 0.5, -r * 0.22, -r * 1.3, 0, -r * 1.34);
    ctx.bezierCurveTo(r * 0.22, -r * 1.3, r * 0.3, -r * 0.5, r * 0.2, r * 0.12);
    ctx.closePath();
    ctx.fillStyle = '#f8e0c4';
    ctx.fill();
    ctx.lineWidth = lw * 0.5;
    ctx.strokeStyle = '#c9a07c';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.62, r * 0.065, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = side < 0 ? '#b9a6ee' : '#f39ac8';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -r * 0.9, r * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }

  // 머리: 후드 + 귀 + 살구색 얼굴 (큰 보라색 눈, 작은 보라색 코, 뾰족뾰족 이빨 웃음)
  function labooHead(cx, cy, r, mood = 'smile', t = 0) {
    const lw = Math.max(1.3, r * 0.065);
    const wig = Math.sin(t * 4) * 0.04;
    ctx.save();
    ctx.translate(cx, cy);
    labooEar(r, -1, -wig, lw);
    labooEar(r, 1, wig, lw);
    furBlob(0, 0, r * 1.02, r * 0.96, 20, r * 0.25, lw);
    // 후드 안쪽 그림자와 살구색 얼굴
    oval(0, r * 0.14, r * 0.8, r * 0.7, '#b7a2ee', null);
    oval(0, r * 0.16, r * 0.68, r * 0.57, '#f6cba6', INK, lw * 0.8);
    oval(0, r * 0.4, r * 0.5, r * 0.25, 'rgba(255,255,255,0.22)', null);
    // 볼터치와 코
    oval(-r * 0.5, r * 0.36, r * 0.14, r * 0.09, 'rgba(255,120,160,0.6)', null);
    oval(r * 0.5, r * 0.36, r * 0.14, r * 0.09, 'rgba(255,120,160,0.6)', null);
    poly([[-r * 0.07, r * 0.2], [r * 0.07, r * 0.2], [0, r * 0.29]], '#7c55cf', INK, lw * 0.5);
    // 눈
    for (const s of [-1, 1]) {
      const ex = s * r * 0.31;
      const ey = r * 0.07;
      if (mood === 'dizzy') {
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.13, ey - r * 0.13); ctx.lineTo(ex + r * 0.13, ey + r * 0.13);
        ctx.moveTo(ex + r * 0.13, ey - r * 0.13); ctx.lineTo(ex - r * 0.13, ey + r * 0.13);
        ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.3; ctx.lineCap = 'round'; ctx.stroke();
      } else if (mood === 'happy') {
        ctx.beginPath();
        ctx.arc(ex, ey + r * 0.07, r * 0.17, Math.PI * 1.1, Math.PI * 1.9);
        ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.5; ctx.lineCap = 'round'; ctx.stroke();
      } else if (mood === 'sad') {
        // 엉엉 우는 눈: 눈물이 가득 고여 반짝이고, 눈썹은 걱정스럽게 올라가 있어요
        oval(ex, ey + r * 0.02, r * 0.2, r * 0.22, '#fff', INK, lw * 0.7);
        const ig = ctx.createRadialGradient(ex, ey + r * 0.05, 0, ex, ey + r * 0.05, r * 0.17);
        ig.addColorStop(0, '#e08cff'); ig.addColorStop(0.7, '#9a3fd6'); ig.addColorStop(1, '#5d1f9a');
        ctx.beginPath(); ctx.ellipse(ex, ey + r * 0.05, r * 0.145, r * 0.165, 0, 0, Math.PI * 2);
        ctx.fillStyle = ig; ctx.fill();
        oval(ex, ey + r * 0.06, r * 0.06, r * 0.075, '#2c0a4a', null);
        oval(ex - r * 0.05, ey - r * 0.03, r * 0.06, r * 0.06, '#fff', null);
        oval(ex + r * 0.05, ey + r * 0.1, r * 0.035, r * 0.03, '#fff', null);
        // 눈 아래에 고인 눈물
        ctx.beginPath();
        ctx.ellipse(ex, ey + r * 0.2, r * 0.2, r * 0.06, 0, 0, Math.PI);
        ctx.fillStyle = 'rgba(140,215,255,0.9)'; ctx.fill();
        ctx.lineWidth = lw * 0.5; ctx.strokeStyle = 'rgba(70,150,220,0.9)'; ctx.stroke();
        // 걱정 눈썹
        ctx.beginPath();
        ctx.moveTo(ex + s * r * 0.2, ey - r * 0.22);
        ctx.lineTo(ex - s * r * 0.15, ey - r * 0.4);
        ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.1; ctx.lineCap = 'round'; ctx.stroke();
      } else {
        oval(ex, ey, r * 0.2, r * 0.235, '#fff', INK, lw * 0.7);
        const ig = ctx.createRadialGradient(ex, ey + r * 0.02, 0, ex, ey + r * 0.02, r * 0.19);
        ig.addColorStop(0, '#e08cff');
        ig.addColorStop(0.7, '#9a3fd6');
        ig.addColorStop(1, '#5d1f9a');
        ctx.beginPath(); ctx.ellipse(ex, ey + r * 0.02, r * 0.155, r * 0.19, 0, 0, Math.PI * 2);
        ctx.fillStyle = ig; ctx.fill();
        oval(ex, ey + r * 0.04, r * 0.07, r * 0.09, '#2c0a4a', null);
        oval(ex - r * 0.06, ey - r * 0.06, r * 0.055, r * 0.055, '#fff', null);
        oval(ex + r * 0.06, ey + r * 0.09, r * 0.028, r * 0.028, '#fff', null);
      }
    }
    // 입
    const mx0 = -r * 0.46;
    const mx1 = r * 0.46;
    const my = r * 0.36;
    const teeth = (qy) => {
      for (let i = 0; i < 8; i++) {
        const u = (i + 0.5) / 8;
        const px = (1 - u) * (1 - u) * mx0 + 2 * (1 - u) * u * 0 + u * u * mx1;
        const py = (1 - u) * (1 - u) * my + 2 * (1 - u) * u * qy + u * u * my;
        poly([[px - r * 0.052, py - r * 0.005], [px + r * 0.052, py - r * 0.005], [px, py + r * 0.085]], '#fff', INK, lw * 0.35);
      }
    };
    if (mood === 'sad') {
      const cy2 = r * 0.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, cy2 + r * 0.02);
      ctx.quadraticCurveTo(0, cy2 - r * 0.08, r * 0.3, cy2 + r * 0.02);
      ctx.quadraticCurveTo(r * 0.36, cy2 + r * 0.36, 0, cy2 + r * 0.4);
      ctx.quadraticCurveTo(-r * 0.36, cy2 + r * 0.36, -r * 0.3, cy2 + r * 0.02);
      ctx.closePath();
      paint('#8e2b3d', INK, lw);
      ctx.save();
      ctx.clip();
      oval(0, cy2 + r * 0.36, r * 0.2, r * 0.14, '#ff8fb1', null);
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        const tx = -r * 0.16 + i * r * 0.107;
        poly([[tx - r * 0.045, cy2 + r * 0.005], [tx + r * 0.045, cy2 + r * 0.005], [tx, cy2 + r * 0.08]], '#fff', INK, lw * 0.35);
      }
    } else if (mood === 'happy') {
      ctx.beginPath();
      ctx.moveTo(mx0, my);
      ctx.quadraticCurveTo(0, my + r * 0.12, mx1, my);
      ctx.quadraticCurveTo(0, my + r * 0.62, mx0, my);
      ctx.closePath();
      paint('#8e2b3d', INK, lw);
      ctx.save();
      ctx.clip();
      oval(0, my + r * 0.36, r * 0.22, r * 0.14, '#ff8fb1', null);
      ctx.restore();
      teeth(my + r * 0.12);
    } else {
      ctx.beginPath();
      ctx.moveTo(mx0, my);
      ctx.quadraticCurveTo(0, my + r * 0.3, mx1, my);
      ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
      teeth(my + r * 0.15);
    }
    if (mood === 'sad') {
      for (const s of [-1, 1]) {
        const wob = Math.sin(t * 9 + s) * r * 0.03;
        // 볼을 타고 흐르는 눈물줄기
        ctx.beginPath();
        ctx.moveTo(s * r * 0.31, r * 0.26);
        ctx.quadraticCurveTo(s * (r * 0.5 + wob), r * 0.5, s * (r * 0.55 + wob), r * 0.78);
        ctx.strokeStyle = 'rgba(120,205,255,0.95)'; ctx.lineWidth = r * 0.1; ctx.lineCap = 'round'; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = r * 0.03; ctx.stroke();
        // 뚝뚝 떨어지는 눈물방울 (시간에 따라 아래로 떨어져요)
        for (let k = 0; k < 2; k++) {
          const u = (t * 1.4 + k * 0.5 + (s > 0 ? 0.25 : 0)) % 1;
          oval(s * (r * 0.58 + wob), r * 0.78 + u * r * 0.7, r * 0.065, r * 0.095, 'rgba(140,215,255,' + (1 - u * 0.85).toFixed(2) + ')', 'rgba(70,150,220,' + (1 - u).toFixed(2) + ')', lw * 0.4);
        }
      }
    }
    ctx.restore();
  }

  // 온몸이 보이는 라부부 (복슬복슬한 몸, 작은 손, 보라색 발톱)
  function labooFull(cx, cy, r, mood = 'smile', t = 0) {
    const lw = Math.max(1.3, r * 0.065);
    ctx.save();
    ctx.translate(cx, cy + Math.sin(t * 3.2) * r * 0.03);
    for (const s of [-1, 1]) {
      furBlob(s * r * 0.46, r * 2.42, r * 0.34, r * 0.26, 9, r * 0.13, lw);
      for (let k = -1; k <= 1; k++) oval(s * r * 0.46 + k * r * 0.15, r * 2.66, r * 0.05, r * 0.075, '#7b5bd4', INK, lw * 0.5);
    }
    furBlob(0, r * 1.65, r * 0.94, r * 0.98, 18, r * 0.22, lw);
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * r * 1.0, r * 1.45);
      ctx.rotate(-s * 0.38);
      furBlob(0, 0, r * 0.3, r * 0.5, 10, r * 0.15, lw);
      ctx.restore();
      const hx = s * r * 1.22;
      const hy = r * 1.98;
      oval(hx, hy, r * 0.17, r * 0.15, '#f6cba6', INK, lw * 0.7);
      for (let k = -1; k <= 1; k++) oval(hx + k * r * 0.09, hy + r * 0.12, r * 0.05, r * 0.07, '#f6cba6', INK, lw * 0.5);
    }
    labooHead(0, 0, r, mood, t);
    ctx.restore();
  }

  // ---------- 자동차 (뒤에서 위로 비스듬히 본 모습) ----------
  function drawCar(x, y, o) {
    const t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    const sc = o.scale || 1;
    ctx.scale(sc, sc);
    ctx.rotate(o.tilt || 0);
    // 그림자
    oval(0, 30, 36, 50, 'rgba(0,0,0,0.2)', null);
    // 부스트 불꽃
    if (o.boost) {
      const fl = 16 + Math.sin(t * 50) * 6;
      poly([[-14, 38], [14, 38], [0, 38 + fl + 12]], '#ff9f1c', null);
      poly([[-8, 38], [8, 38], [0, 38 + fl]], '#ffe066', null);
    }
    // 바퀴
    for (const sx of [-1, 1]) {
      for (const wy of [-26, 24]) rrect(sx * 31 - 7, wy - 14, 14, 28, 6, '#3b3446', INK, 2);
    }
    // 몸체
    rrect(-29, -46, 58, 92, 20, o.body, INK, 3);
    rrect(-22, -42, 44, 34, 15, o.trim, null);
    // 앞 라이트
    oval(-17, -41, 6, 4, '#fff7b0', INK, 1.5);
    oval(17, -41, 6, 4, '#fff7b0', INK, 1.5);
    // 운전석
    oval(0, 2, 20, 22, o.cabin || '#fff3f8', INK, 2.5);
    // 뒤 라이트와 번호판 (이름이 붙어 있어요)
    rrect(-24, 33, 10, 7, 3, '#ff4d4d', INK, 1.5);
    rrect(14, 33, 10, 7, 3, '#ff4d4d', INK, 1.5);
    rrect(-19, 28, 38, 15, 4, '#fff', INK, 2);
    ctx.fillStyle = INK;
    ctx.font = `13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.plate, 0, 36.5, 34);
    // 운전하는 모습
    if (o.who === 'taeri') {
      // 몸통(분홍 티셔츠)
      oval(0, 3, 14, 10, '#ffd1e6', INK, 2);
      taeriHead(0, -13, 17, o.mood || 'smile');
    } else {
      furBlob(0, 6, 14, 10, 10, 5, 1.6);
      labooHead(0, -9, 13, o.mood || 'smile', t);
    }
    // 어지러운 별
    if (o.mood === 'dizzy') {
      for (let i = 0; i < 3; i++) {
        const a = t * 8 + i * 2.1;
        emoji('⭐', Math.cos(a) * 24, -36 + Math.sin(a) * 7, 15);
      }
    }
    ctx.restore();
  }

  // 자동차 위에 따라다니는 이름표
  function nameTag(x, y, label, color) {
    ctx.font = `15px ${FONT}`;
    const w = ctx.measureText(label).width + 20;
    rrect(x - w / 2, y - 12, w, 24, 12, color, '#fff', 3);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 1);
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
  }

  // 구글 폰트(Jua)에서 이 게임에 쓰는 한글을 미리 불러온다 (실패하면 기본 글꼴 사용)
  const FONT_TEXT = "태리가만든라부랑자동차대결왼쪽오른키모바일은큰버튼두개으로하는어린이용경주게임규칙과설명참고논해상도너비높화면율에맞춰달짐그림쓰따뜻한갈색윤곽선유틸크기본속초거의위치코스네놀터길보다먼저착반짝닷파소를들며려요무지늘구름사탕을캐시말글씨흰굵테카드방향양릭살여아뒷머묶와분홍얼굴앞눈볼입귀엽뾰족복슬털삐죽빨웃뒤서듬히습트불꽃퀴몸체운전석번호판붙있통티셔츠러별니표폰미온실패꼴같연진횟수조금씩천줘꾸력뿐처음누순간절눌움직효루행장애물알피끔꾹르계칸슝앗승점출발문건항밖야막등마신나작안내돼겼록까깝더했밟져봐엔챔언좋친되었잠깐멈춤메인프뮬레션배매텝봇훅디없빠끝돌률재못0123456789!?.,:←→◀▶";
  if (document.fonts && document.fonts.load) document.fonts.load('20px Jua', FONT_TEXT).catch(() => {});

  // ---------- 게임 상태 ----------
  const g = {
    state: 'title',      // title | count | race | paused | result | ending
    t: 0,
    courseIdx: 0,
    losses: 0,           // 같은 코스에서 연속으로 진 횟수 (라부부가 조금씩 천천히 달려 줘요)
    result: null,
  };
  let race = null;
  let confetti = [];

  function setState(s) {
    g.state = s;
    g.t = 0;
    stage.dataset.state = s;
    Sound.duck(s === 'paused');
  }

  // ---------- 코스 만들기 ----------
  function makeObs(c, lane, dist) {
    const o = pick(c.obstacles);
    return { type: 'obs', lane, dist, kind: o.kind, ch: o.ch || null, hitP: false, hitL: false, seen: false, ignore: false };
  }

  function genWorld(c) {
    const objs = [];
    const keys = Object.keys(c.weights);
    let d = 1000;
    while (d < c.length - 800) {
      const kind = weighted(keys, (k) => c.weights[k]);
      const lanes = shuffle([0, 1, 2]);
      if (kind === 'obs1') {
        objs.push(makeObs(c, lanes[0], d));
        if (Math.random() < 0.6) objs.push({ type: 'star', lane: lanes[1 + Math.floor(Math.random() * 2)], dist: d + rand(190, 240) });
      } else if (kind === 'obs2') {
        objs.push(makeObs(c, lanes[1], d));
        objs.push(makeObs(c, lanes[2], d));
        if (Math.random() < 0.55) objs.push({ type: 'star', lane: lanes[0], dist: d });
      } else if (kind === 'stars') {
        for (let i = 0; i < 3; i++) objs.push({ type: 'star', lane: lanes[0], dist: d + i * 85 });
      } else if (kind === 'pad') {
        objs.push({ type: 'pad', lane: lanes[0], dist: d });
      } else if (kind === 'puddle') {
        const n = Math.random() < 0.4 ? 2 : 1;
        for (let i = 0; i < n; i++) objs.push({ type: 'puddle', lane: lanes[i], dist: d, hitP: false, hitL: false });
      }
      d += rand(c.gap[0], c.gap[1]);
    }
    objs.sort((a, b) => a.dist - b.dist);

    // 길가 꾸미기
    const decor = [];
    for (let dd = -300; dd < c.length + 900; dd += rand(80, 150)) {
      const side = Math.random() < 0.5 ? -1 : 1;
      if (c.water && side < 0) continue;
      const room = ROAD_X - 22;
      const x = side < 0 ? rand(room * 0.3, room * 0.78) : W - rand(room * 0.3, room * 0.78);
      decor.push({ x, dist: dd, ch: pick(c.decor), size: rand(34, 52), rot: rand(-0.15, 0.15) });
    }
    return { objs, decor };
  }

  function newRace(c) {
    const w = genWorld(c);
    const labLane = pick([0, 2]);
    return {
      course: c, objs: w.objs, decor: w.decor,
      time: 0, started: false, goT: 0,
      winner: null, finishT: 0, timeP: 0,
      fx: [], toast: null,
      p: { dist: 0, lane: 1, x: laneX(1), mult: 1, slowT: 0, padT: 0, boostT: 0, starCount: 0, stars: 0, boosts: 0, tilt: 0, dizzyT: 0, holdT: 0 },
      L: { dist: 0, lane: labLane, x: laneX(labLane), mult: 1, slowT: 0, tripT: 0, tripCd: rand(7, 10), thinkT: 0 },
    };
  }

  function startCourse(idx) {
    g.courseIdx = idx;
    race = newRace(COURSES[idx]);
    Sound.music(COURSES[idx].music);
    Sound.fast(false);
    setState('count');
  }

  // ---------- 입력 (왼쪽 / 오른쪽 두 개뿐) ----------
  const keyDown = { left: false, right: false };
  const pointers = new Map();     // pointerId -> -1 (왼쪽) / 1 (오른쪽)

  function heldDir() {
    let l = keyDown.left;
    let r = keyDown.right;
    for (const d of pointers.values()) { if (d < 0) l = true; else r = true; }
    return l === r ? 0 : (l ? -1 : 1);
  }

  function steer(dir) {
    if (!race) return;
    const p = race.p;
    const lane = clamp(p.lane + dir, 0, LANES - 1);
    if (lane !== p.lane) { p.lane = lane; Sound.sfx('lane'); }
  }

  // 방향 버튼을 처음 누른 순간
  function press(dir) {
    Sound.unlock();
    if (g.state === 'race' || g.state === 'count') {
      steer(dir);
      if (race) race.p.holdT = 0.3;
    } else {
      confirm();
    }
  }

  function confirm() {
    if (g.t < 0.35) return;
    switch (g.state) {
      case 'title':
        g.losses = 0;
        Sound.sfx('select');
        startCourse(0);
        break;
      case 'paused':
        Sound.sfx('select');
        setState('race');
        g.t = 1;
        break;
      case 'result':
        Sound.sfx('select');
        if (g.result.win) {
          if (g.courseIdx + 1 < COURSES.length) { g.losses = 0; startCourse(g.courseIdx + 1); } else { Sound.music('ending'); setState('ending'); }
        } else {
          startCourse(g.courseIdx);
        }
        break;
      case 'ending':
        Sound.sfx('select');
        Sound.music('title');
        setState('title');
        break;
      default:
    }
  }

  function togglePause() {
    if (g.state === 'race') setState('paused');
    else if (g.state === 'paused') { setState('race'); g.t = 1; }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    Sound.unlock();
    if (e.code === 'KeyM' && !e.repeat) { toggleMute(); return; }
    if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) { togglePause(); return; }
    if (e.repeat) return;
    if (e.code === 'ArrowLeft') { keyDown.left = true; press(-1); }
    else if (e.code === 'ArrowRight') { keyDown.right = true; press(1); }
    else if (e.code === 'Enter' || e.code === 'Space') confirm();
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keyDown.left = false;
    if (e.code === 'ArrowRight') keyDown.right = false;
  });
  function releaseAll() {
    keyDown.left = keyDown.right = false;
    pointers.clear();
    document.querySelectorAll('#touch button').forEach((b) => b.classList.remove('down'));
  }
  window.addEventListener('blur', () => { releaseAll(); if (g.state === 'race') setState('paused'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && g.state === 'race') setState('paused'); });

  window.addEventListener('pointerdown', (e) => {
    Sound.unlock();
    if (e.pointerType === 'touch') stage.classList.add('touch');
  }, true);
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) stage.classList.add('touch');
  stage.addEventListener('contextmenu', (e) => e.preventDefault());

  // 화면의 왼쪽 절반 / 오른쪽 절반을 눌러도 움직여요
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const dir = (e.clientX - r.left) / r.width < 0.5 ? -1 : 1;
    if (g.state === 'race' || g.state === 'count') {
      pointers.set(e.pointerId, dir);
      press(dir);
    } else {
      confirm();
    }
  });

  // 모바일 큰 버튼
  function bindButton(id, dir) {
    const el = document.getElementById(id);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* 포인터를 잡지 못해도 버튼은 그대로 동작 */ }
      pointers.set(e.pointerId, dir);
      el.classList.add('down');
      press(dir);
    });
    const up = (e) => { pointers.delete(e.pointerId); el.classList.remove('down'); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }
  bindButton('btnLeft', -1);
  bindButton('btnRight', 1);
  window.addEventListener('pointerup', (e) => pointers.delete(e.pointerId));
  window.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));

  const muteEl = document.getElementById('btnMute');
  function refreshMute() { muteEl.textContent = Sound.muted ? '\u{1F507}' : '\u{1F50A}'; }
  function toggleMute() { Sound.toggleMute(); refreshMute(); }
  muteEl.addEventListener('pointerdown', (e) => e.stopPropagation());
  muteEl.addEventListener('click', () => { Sound.unlock(); toggleMute(); muteEl.blur(); });
  refreshMute();

  // ---------- 효과 (반짝이, 먼지, 꽃가루) ----------
  function spawnFx(R, x, y, kind, n = 6) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(40, 150);
      R.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0, max: rand(0.35, 0.7), size: rand(3, 6), kind });
    }
  }
  const FX_COLOR = { star: '#ffe066', dust: '#fff', hit: '#ff8fb1', splash: '#9ad7ff', boost: '#ff9f1c' };

  function floatText(R, str, x, y, color) {
    R.toast = { str, x, y, color, t: 0 };
  }

  // ---------- 경주 진행 ----------
  function laboOnObjs(R, dt) {
    const L = R.L;
    const c = R.course;
    // 라부부는 앞의 장애물을 보고 알아서 피해 가요 (가끔 실수도 해요)
    L.thinkT -= dt;
    if (L.thinkT > 0) return;
    L.thinkT = 0.12;
    const blocked = (lane) => R.objs.some((o) => o.type === 'obs' && o.lane === lane && !o.ignore && o.dist - L.dist > -30 && o.dist - L.dist < 330);
    for (const o of R.objs) {
      if (o.type === 'obs' && !o.seen && o.dist - L.dist < 330 && o.dist - L.dist > 0) {
        o.seen = true;
        o.ignore = Math.random() < c.mistake;
      }
    }
    if (blocked(L.lane)) {
      const options = [L.lane - 1, L.lane + 1].filter((l) => l >= 0 && l < LANES && !blocked(l));
      if (options.length) L.lane = pick(options);
    } else if (Math.random() < 0.025) {
      const options = [L.lane - 1, L.lane + 1].filter((l) => l >= 0 && l < LANES && !blocked(l));
      if (options.length) L.lane = pick(options);
    }
  }

  function updateRace(dt) {
    const R = race;
    const p = R.p;
    const L = R.L;
    const c = R.course;
    R.time += dt;
    R.goT += dt;

    // --- 태리: 버튼을 꾹 누르고 있으면 계속 한 칸씩 움직여요
    const hd = heldDir();
    if (hd && !R.winner) {
      p.holdT -= dt;
      if (p.holdT <= 0) { steer(hd); p.holdT = 0.22; }
    } else {
      p.holdT = 0;
    }
    const tx = laneX(p.lane);
    const dx = tx - p.x;
    p.x += Math.sign(dx) * Math.min(Math.abs(dx), 620 * dt);
    p.tilt = lerp(p.tilt, clamp(dx / 60, -1, 1) * 0.2, Math.min(1, 12 * dt));

    p.slowT = Math.max(0, p.slowT - dt);
    p.padT = Math.max(0, p.padT - dt);
    p.boostT = Math.max(0, p.boostT - dt);
    p.dizzyT = Math.max(0, p.dizzyT - dt);
    let target = 1;
    if (p.boostT > 0) target = 1.6;
    else if (p.padT > 0) target = 1.4;
    if (p.slowT > 0) target = Math.min(target, p.slowT > 0.5 ? 0.45 : 0.7);
    p.mult += (target - p.mult) * Math.min(1, (target < p.mult ? 14 : 3.5) * dt);
    if (R.winner) p.mult += (0.8 - p.mult) * Math.min(1, 2 * dt);
    p.dist += BASE * p.mult * dt;
    Sound.fast(p.boostT > 0);

    // 별, 속도판, 장애물
    for (const o of R.objs) {
      const dd = o.dist - p.dist;
      if (dd > 90 || dd < -90 || o.done) continue;
      const ox = laneX(o.lane);
      if (Math.abs(p.x - ox) > 40) continue;
      if (o.type === 'star' && Math.abs(dd) < 46) {
        o.done = true;
        p.stars++;
        p.starCount++;
        spawnFx(R, ox, carY() - dd, 'star', 8);
        Sound.sfx('star');
        if (p.starCount >= 5) {
          p.starCount = 0;
          p.boosts++;
          p.boostT = 2.4;
          Sound.sfx('boost');
          floatText(R, '부스트!', p.x, carY() - 80, '#ff9f1c');
        }
      } else if (o.type === 'pad' && Math.abs(dd) < 50) {
        o.done = true;
        p.padT = 1.1;
        Sound.sfx('pad');
        floatText(R, '슝~', p.x, carY() - 80, '#34c759');
      } else if (o.type === 'puddle' && !o.hitP && Math.abs(dd) < 38) {
        o.hitP = true;
        p.slowT = Math.max(p.slowT, 0.8);
        spawnFx(R, p.x, carY(), 'splash', 12);
        Sound.sfx('splash');
      } else if (o.type === 'obs' && !o.hitP && Math.abs(dd) < 40) {
        o.hitP = true;
        p.slowT = 1.1;
        p.dizzyT = 1.0;
        p.boostT = 0;
        spawnFx(R, p.x, carY() - 20, 'hit', 12);
        Sound.sfx('bonk');
        floatText(R, '앗!', p.x, carY() - 80, '#ff5fa2');
      }
    }

    // --- 라부부
    L.slowT = Math.max(0, L.slowT - dt);
    L.tripT = Math.max(0, L.tripT - dt);
    L.tripCd -= dt;
    if (L.tripCd <= 0 && L.dist > 700 && L.dist < c.length - 1100 && !R.winner) {
      L.tripT = 1.3;
      L.tripCd = rand(6.5, 10.5);
      Sound.sfx('boing');
    }
    laboOnObjs(R, dt);
    const lx = laneX(L.lane);
    const ldx = lx - L.x;
    L.x += Math.sign(ldx) * Math.min(Math.abs(ldx), 520 * dt);
    for (const o of R.objs) {
      if ((o.type !== 'obs' && o.type !== 'puddle') || o.hitL) continue;
      const dd = o.dist - L.dist;
      if (Math.abs(dd) < 36 && Math.abs(L.x - laneX(o.lane)) < 36) {
        o.hitL = true;
        L.slowT = o.type === 'obs' ? 1.0 : 0.7;
      }
    }
    const assist = Math.max(0.8, 1 - 0.045 * g.losses);   // 계속 지면 라부부가 조금씩 천천히 달려요
    let ls = BASE * c.laboo * assist;
    const gap = L.dist - p.dist;                            // 양수면 라부부가 앞
    if (gap > 500) ls *= 0.86;
    else if (gap > 260) ls *= 0.95;
    else if (gap < -420) ls *= 1.1;
    else if (gap < -200) ls *= 1.04;
    const lt = L.tripT > 0 ? 0.35 : (L.slowT > 0 ? 0.5 : 1);
    L.mult += (lt - L.mult) * Math.min(1, (lt < L.mult ? 14 : 4) * dt);
    if (R.winner) L.mult += (0.8 - L.mult) * Math.min(1, 2 * dt);
    L.dist += ls * L.mult * dt;

    // --- 결승선
    if (!R.winner) {
      const pf = p.dist >= c.length;
      const lf = L.dist >= c.length;
      if (pf || lf) {
        R.winner = pf && (!lf || p.dist >= L.dist) ? 'p' : 'l';
        R.finishT = 0;
        R.timeP = R.time;
        Sound.sfx(R.winner === 'p' ? 'win' : 'lose');
        if (R.winner === 'p') for (let i = 0; i < 3; i++) spawnFx(R, p.x, carY() - 60, 'star', 12);
      }
    } else {
      R.finishT += dt;
      if (R.finishT > 1.9) endRace();
    }

    // --- 먼지와 반짝이
    if (Math.random() < dt * 40 * p.mult) spawnFx(R, p.x + rand(-14, 14), carY() + 48, p.boostT > 0 ? 'boost' : 'dust', 1);
    for (const f of R.fx) { f.life += dt; f.x += f.vx * dt; f.y += (f.vy + (f.kind === 'dust' || f.kind === 'boost' ? 160 : 0)) * dt; }
    R.fx = R.fx.filter((f) => f.life < f.max);
    if (R.toast) { R.toast.t += dt; if (R.toast.t > 0.9) R.toast = null; }
  }

  function endRace() {
    const R = race;
    const win = R.winner === 'p';
    g.result = { win, time: R.timeP, stars: R.p.stars, boosts: R.p.boosts };
    if (win) { g.losses = 0; Sound.music('ending'); } else { g.losses++; }
    confetti = [];
    setState('result');
  }

  // ---------- 그리기: 도로 ----------
  const sy = (d, cam) => carY() - (d - cam);

  function drawGround(c, cam) {
    ctx.fillStyle = c.ground[0];
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = c.ground[1];
    const off = ((cam % 240) + 240) % 240;
    for (let y = -240 + off; y < H; y += 240) ctx.fillRect(0, y, W, 120);

    if (c.sky) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(255,214,235,0.5)');
      grad.addColorStop(1, 'rgba(180,220,255,0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // 반짝이는 별가루
      for (let i = 0; i < 18; i++) {
        const sx = (i * 97) % W;
        const sy2 = ((i * 211 + cam * 0.6) % (H + 40)) - 20;
        ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(g.t * 3 + i)})`;
        ctx.fillRect(sx, sy2, 3, 3);
      }
    }
    if (c.water) {
      const wx = ROAD_X - 30;
      const grad = ctx.createLinearGradient(0, 0, wx, 0);
      grad.addColorStop(0, '#2f9fe0');
      grad.addColorStop(1, '#6fd0f5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, wx, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let y = -10; y <= H + 10; y += 10) {
        const x = wx - 6 + Math.sin(y / 22 + cam / 60 + g.t * 2) * 5;
        if (y === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        for (let y = -10; y <= H + 10; y += 12) {
          const x = 14 + k * 20 + Math.sin(y / 30 + cam / 80 + k) * 6;
          if (y === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }

  function drawRoad(c, cam) {
    ctx.fillStyle = c.road;
    ctx.fillRect(ROAD_X, 0, ROAD_W, H);
    // 연석(도로 가장자리)
    const off = ((cam % (c.curb.length * 40)) + c.curb.length * 40) % (c.curb.length * 40);
    const seg = c.curb.length;
    for (let i = -seg - 1; i < H / 40 + 2; i++) {
      const y = i * 40 + off;
      const col = c.curb[((i % seg) + seg) % seg];
      ctx.fillStyle = col;
      ctx.fillRect(ROAD_X - 12, y, 12, 40);
      ctx.fillRect(ROAD_X + ROAD_W, y, 12, 40);
    }
    // 차선 점선
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const o2 = ((cam % 80) + 80) % 80;
    for (let k = 1; k < LANES; k++) {
      for (let y = -80 + o2; y < H; y += 80) ctx.fillRect(ROAD_X + LANE_W * k - 3, y, 6, 38);
    }
  }

  function checkerRow(y, h, cell) {
    const n = Math.ceil(ROAD_W / cell);
    for (let r = 0; r < Math.round(h / cell); r++) {
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = (i + r) % 2 ? '#fff' : '#2b2b3a';
        ctx.fillRect(ROAD_X + i * cell, y + r * cell, Math.min(cell, ROAD_X + ROAD_W - (ROAD_X + i * cell)), cell);
      }
    }
  }

  function drawLines(R, cam) {
    const c = R.course;
    // 출발선
    let y = sy(0, cam);
    if (y > -60 && y < H + 60) {
      checkerRow(y - 15, 30, 15);
      bubble('출발!', W / 2, y - 38, 24, '#fff', '#34c759');
    }
    // 도착선과 도착 문
    y = sy(c.length, cam);
    if (y > -140 && y < H + 100) {
      checkerRow(y - 15, 30, 15);
      for (const sx of [ROAD_X - 22, ROAD_X + ROAD_W + 22]) {
        rrect(sx - 7, y - 120, 14, 130, 6, '#fff', INK, 3);
      }
      rrect(ROAD_X - 22, y - 128, ROAD_W + 44, 38, 14, '#ff5fa2', '#fff', 4);
      ctx.fillStyle = '#fff';
      ctx.font = `26px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('도착! 🏁', W / 2, y - 108);
    }
  }

  // ---------- 그리기: 길 위의 물건 ----------
  function drawCone(x, y) {
    oval(x, y + 22, 24, 8, 'rgba(0,0,0,0.18)', null);
    rrect(x - 22, y + 12, 44, 12, 4, '#444a5a', INK, 2);
    poly([[x - 17, y + 14], [x + 17, y + 14], [x + 6, y - 24], [x - 6, y - 24]], '#ff8a3d', INK, 2.5);
    poly([[x - 12, y - 2], [x + 12, y - 2], [x + 9, y - 10], [x - 9, y - 10]], '#fff', null);
    poly([[x - 6, y - 24], [x + 6, y - 24], [x + 4, y - 31], [x - 4, y - 31]], '#ff8a3d', INK, 2);
  }

  function drawPuddle(x, y, color) {
    oval(x, y, 38, 24, color, 'rgba(255,255,255,0.8)', 3);
    oval(x - 10, y - 6, 12, 5, 'rgba(255,255,255,0.55)', null);
  }

  function drawPad(x, y) {
    rrect(x - 36, y - 30, 72, 60, 14, '#46d17a', '#fff', 3);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
      const yy = y + 18 - i * 18 - (g.t * 40 % 18);
      ctx.beginPath();
      ctx.moveTo(x - 17, yy + 4);
      ctx.lineTo(x, yy - 9);
      ctx.lineTo(x + 17, yy + 4);
      ctx.lineTo(x + 17, yy + 12);
      ctx.lineTo(x, yy);
      ctx.lineTo(x - 17, yy + 12);
      ctx.closePath();
      ctx.globalAlpha = 0.9 - i * 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawObjs(R, cam) {
    const c = R.course;
    for (const o of R.objs) {
      const y = sy(o.dist, cam);
      if (y < -70 || y > H + 70 || o.done) continue;
      const x = laneX(o.lane);
      if (o.type === 'pad') drawPad(x, y);
      else if (o.type === 'puddle') drawPuddle(x, y, c.puddle);
    }
    for (const o of R.objs) {
      const y = sy(o.dist, cam);
      if (y < -70 || y > H + 70 || o.done) continue;
      const x = laneX(o.lane);
      if (o.type === 'star') {
        const bob = Math.sin(g.t * 5 + o.dist) * 3;
        emoji('⭐', x, y + bob, 40, Math.sin(g.t * 3 + o.dist) * 0.2);
      } else if (o.type === 'obs') {
        if (o.kind === 'cone') drawCone(x, y);
        else {
          oval(x, y + 20, 24, 8, 'rgba(0,0,0,0.18)', null);
          emoji(o.ch, x, y, 54, o.hitP ? 0.3 : 0);
        }
      }
    }
  }

  function drawDecor(R, cam) {
    for (const d of R.decor) {
      const y = sy(d.dist, cam);
      if (y < -60 || y > H + 60) continue;
      emoji(d.ch, d.x, y, d.size, d.rot);
    }
  }

  function drawFx(R) {
    for (const f of R.fx) {
      const a = 1 - f.life / f.max;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = FX_COLOR[f.kind] || '#fff';
      if (f.kind === 'star') {
        emoji('✨', f.x, f.y, 14 + a * 8);
      } else {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * (f.kind === 'dust' ? (1.4 - a * 0.4) : 1), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------- 그리기: 경주 화면 ----------
  function drawRace(R) {
    const c = R.course;
    const p = R.p;
    const L = R.L;
    const cam = p.dist;
    drawGround(c, cam);
    drawRoad(c, cam);
    drawLines(R, cam);
    drawDecor(R, cam);
    drawObjs(R, cam);

    // 자동차: 위에 있는 차부터 그린다
    const pY = carY();
    const lY = sy(L.dist, cam);
    const cars = [
      { y: lY, draw: () => drawCar(L.x, lY, { body: '#a98cf3', trim: '#e6dcff', plate: '라부부', who: 'laboo', tilt: 0, t: g.t, boost: false, mood: L.tripT > 0 ? 'dizzy' : (R.winner === 'l' ? 'happy' : (R.winner === 'p' ? 'sad' : 'smile')) }) },
      { y: pY, draw: () => drawCar(p.x + (p.dizzyT > 0 ? Math.sin(g.t * 40) * 3 : 0), pY, { body: '#ff6fae', trim: '#ffd1e6', plate: '임태리', who: 'taeri', tilt: p.tilt + (p.dizzyT > 0 ? Math.sin(g.t * 30) * 0.12 : 0), t: g.t, boost: p.boostT > 0, mood: p.dizzyT > 0 ? 'dizzy' : (R.winner === 'p' || p.boostT > 0 ? 'happy' : 'smile') }) },
    ].sort((a, b) => a.y - b.y);
    for (const car of cars) { if (car.y > -90 && car.y < H + 90) car.draw(); }

    drawFx(R);

    // 이름표 (항상 "임태리" 라고 붙어 있어요)
    if (lY > -40 && lY < H + 40) nameTag(L.x, lY - 66, '라부부', MINT);
    nameTag(p.x, pY - 66, '임태리', PINK);

    // 화면 밖에 있는 라부부 알려 주기
    if (lY <= -60) {
      ctx.globalAlpha = 0.95;
      oval(L.x, 120, 22, 22, '#fff', MINT, 3);
      labooHead(L.x, 126, 11, 'smile', g.t);
      bubble('앞이야!', L.x, 154, 14, '#fff', MINT);
      ctx.globalAlpha = 1;
    } else if (lY >= H + 40) {
      oval(L.x, H - 190, 22, 22, '#fff', MINT, 3);
      labooHead(L.x, H - 184, 11, 'smile', g.t);
    }

    if (R.toast) {
      const t = R.toast;
      bubble(t.str, t.x, t.y - t.t * 40, 30, '#fff', t.color);
    }
    drawHud(R);
  }

  function drawHud(R) {
    const c = R.course;
    const p = R.p;
    const L = R.L;
    // 진행 막대 (출발 -> 도착)
    const x0 = 44;
    const x1 = W - 44;
    const by = 32;
    rrect(x0 - 10, by - 11, x1 - x0 + 20, 22, 11, 'rgba(255,255,255,0.88)', '#fff', 2);
    rrect(x0 - 4, by - 5, x1 - x0 + 8, 10, 5, '#e6e6ef', null);
    rrect(x0 - 4, by - 5, Math.max(10, (x1 - x0 + 8) * clamp(p.dist / c.length, 0, 1)), 10, 5, PINK, null);
    emoji('🚩', x0 - 6, by - 2, 22);
    emoji('🏁', x1 + 6, by - 2, 22);
    const mx = (d) => lerp(x0, x1, clamp(d / c.length, 0, 1));
    oval(mx(L.dist), by, 14, 14, '#fff', MINT, 3);
    labooHead(mx(L.dist), by + 2, 7, 'smile', 0);
    oval(mx(p.dist), by, 14, 14, '#fff', PINK, 3);
    taeriHead(mx(p.dist), by + 1, 8.5, 'smile');

    // 등수
    const first = p.dist >= L.dist;
    rrect(14, 62, 74, 34, 17, first ? '#ffb703' : '#74c0fc', '#fff', 3);
    ctx.fillStyle = '#fff';
    ctx.font = `22px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(first ? '1등!' : '2등', 51, 80);
    // 별 모으기 칸 (5개 모으면 부스트!)
    for (let i = 0; i < 5; i++) {
      const sx = W / 2 - 60 + i * 30;
      oval(sx, 80, 13, 13, i < p.starCount ? '#ffe066' : 'rgba(255,255,255,0.7)', i < p.starCount ? '#ff9f1c' : '#fff', 3);
      if (i < p.starCount) emoji('⭐', sx, 80, 18);
    }
    if (p.boostT > 0) bubble('부스트!', W / 2, 112, 20, '#fff', '#ff9f1c');
  }

  // ---------- 그리기: 화면별 ----------
  function drawCount() {
    const R = race;
    drawRace(R);
    const t = g.t;
    if (t < 1.5) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, W, H);
      card(50, H / 2 - 130, W - 100, 230);
      ink(`${R.course.id}번 코스`, W / 2, H / 2 - 82, 24, PINK);
      ink(R.course.name, W / 2, H / 2 - 30, 38, '#6b4336', 'center', W - 140);
      ink(R.course.goal, W / 2, H / 2 + 30, 21, '#8a6a58', 'center', W - 140);
      if (g.losses > 0) ink('라부부가 조금 천천히 달려요!', W / 2, H / 2 + 68, 17, '#2fa88b');
    } else {
      const n = t < 2.3 ? 3 : t < 3.1 ? 2 : t < 3.9 ? 1 : 0;
      const label = n ? String(n) : 'GO!';
      const local = (t - 1.5) % 0.8;
      const sc = 1 + Math.max(0, 0.35 - local) * 1.2;
      ctx.save();
      ctx.translate(W / 2, H / 2 - 40);
      ctx.scale(sc, sc);
      bubble(label, 0, 0, n ? 130 : 96, '#fff', n ? PINK : '#34c759');
      ctx.restore();
      drawKeyHint(H - 200 - (stage.classList.contains('touch') ? 0 : -40));
      const beepN = n ? n : 0;
      if (beepN !== R.lastBeep) {
        R.lastBeep = beepN;
        Sound.sfx(n ? 'beep' : 'go');
      }
    }
    if (t >= 3.9) {
      race.started = true;
      race.goT = 0;
      setState('race');
    }
  }

  function drawKeyHint(y) {
    const pulse = Math.floor(g.t * 2) % 2 === 0;
    rrect(W / 2 - 150, y - 34, 300, 68, 22, 'rgba(255,255,255,0.88)', '#fff', 3);
    keycap('◀', W / 2 - 100, y, 44, pulse, PINK);
    keycap('▶', W / 2 + 100, y, 44, !pulse, '#2fa8e0');
    ink('로 움직여요!', W / 2, y + 1, 21, '#6b4336', 'center', 130);
  }

  function drawPlay() {
    drawRace(race);
    if (race.goT < 0.8 && race.started) {
      bubble('GO!', W / 2, H / 2 - 40, 96 - race.goT * 30, '#fff', '#34c759');
    }
  }

  function drawTitle() {
    const c = COURSES[0];
    const cam = g.t * 120;
    drawGround(c, cam);
    drawRoad(c, cam);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, 0, W, H);

    card(26, 30, W - 52, 500);
    ink('태리가 만든', W / 2, 84, 28, '#8a6a58');
    ink('라부부랑', W / 2, 132, 44, PINK, 'center', W - 90);
    ink('자동차 대결', W / 2, 186, 44, '#2fa8e0', 'center', W - 90);

    // 태리와 라부부가 마주 보고 있어요
    const bob = Math.sin(g.t * 3) * 4;
    taeriHead(140, 345 + bob, 46, 'happy');
    labooFull(336, 330 - bob, 33, 'happy', g.t);
    // 이름표
    rrect(78, 441, 124, 38, 12, '#fff', PINK, 3);
    ink('임태리', 140, 461, 25, PINK);
    rrect(276, 441, 120, 38, 12, '#fff', MINT, 3);
    ink('라부부', 336, 461, 25, '#6c49c9');
    bubble('VS', W / 2, 352, 36, '#fff', '#ffb703');

    ink('7살 태리의 신나는 자동차 경주', W / 2, 504, 17, '#8a6a58');

    // 시작 안내: 방향키 두 개만 쓰면 돼요
    const pulse = Math.floor(g.t * 2) % 2 === 0;
    keycap('◀', W / 2 - 62, 586, 62, pulse, PINK);
    keycap('▶', W / 2 + 62, 586, 62, !pulse, '#2fa8e0');
    bubble(stage.classList.contains('touch') ? '화면을 눌러서 시작!' : '← → 키를 눌러서 시작!', W / 2, 652, 26, '#fff', PINK);
  }

  function addConfetti(n) {
    for (let i = 0; i < n; i++) {
      confetti.push({ x: rand(0, W), y: rand(-60, -10), vx: rand(-30, 30), vy: rand(90, 220), r: rand(0, 6.28), vr: rand(-6, 6), size: rand(6, 11), color: pick(RAINBOW.concat(['#ff5fa2', '#ffffff'])) });
    }
  }
  function updateConfetti(dt) {
    for (const c of confetti) { c.x += c.vx * dt + Math.sin(g.t * 3 + c.r) * 20 * dt; c.y += c.vy * dt; c.r += c.vr * dt; }
    confetti = confetti.filter((c) => c.y < H + 20);
  }
  function drawConfetti() {
    for (const c of confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.r);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      ctx.restore();
    }
  }

  function drawResult() {
    const res = g.result;
    drawRace(race);
    ctx.fillStyle = 'rgba(40,10,50,0.4)';
    ctx.fillRect(0, 0, W, H);
    const top = H / 2 - 220;
    card(36, top, W - 72, 440);
    if (res.win) {
      ink('와! 태리가 이겼어요!', W / 2, top + 62, 32, PINK, 'center', W - 130);
      taeriHead(W / 2 - 78, top + 160, 50, 'happy');
      labooFull(W / 2 + 84, top + 168, 26, 'sad', g.t);
      emoji('🏆', W / 2, top + 150, 52, Math.sin(g.t * 4) * 0.15);
      ink(`기록  ${res.time.toFixed(1)}초`, W / 2, top + 262, 26);
      ink(`모은 별  ⭐ ${res.stars}개   부스트 ${res.boosts}번`, W / 2, top + 304, 21, '#8a6a58');
      const last = g.courseIdx + 1 >= COURSES.length;
      ink(last ? '마지막 코스까지 모두 이겼어요!' : `다음은 ${COURSES[g.courseIdx + 1].name}!`, W / 2, top + 350, 19, '#2fa88b', 'center', W - 130);
    } else {
      ink('아깝다! 한 번 더!', W / 2, top + 62, 34, '#2fa8e0');
      taeriHead(W / 2 - 78, top + 160, 50, 'sad');
      labooFull(W / 2 + 84, top + 168, 26, 'happy', g.t);
      ink('라부부가 먼저 도착했어요', W / 2, top + 262, 24);
      const tips = ['별 5개를 모으면 부스트!', '초록 화살표를 밟으면 슝~ 빨라져요', '장애물을 피해서 달려 봐요'];
      ink(tips[g.losses % tips.length], W / 2, top + 308, 20, '#8a6a58', 'center', W - 130);
      ink('이번엔 라부부가 조금 천천히 달려요', W / 2, top + 350, 18, '#2fa88b', 'center', W - 130);
    }
    const pulse = Math.floor(g.t * 2) % 2 === 0;
    keycap('◀', W / 2 - 48, top + 396, 46, pulse, PINK);
    keycap('▶', W / 2 + 48, top + 396, 46, !pulse, '#2fa8e0');
    if (res.win) { if (Math.random() < 0.5) addConfetti(2); drawConfetti(); }
  }

  function drawEnding() {
    const c = COURSES[2];
    drawGround(c, g.t * 80);
    drawRoad(c, g.t * 80);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(0, 0, W, H);
    const top = H / 2 - 270;
    card(30, top, W - 60, 540);
    const bob = Math.sin(g.t * 3) * 4;
    ink('태리는 챔피언!', W / 2, top + 66, 44, PINK);
    emoji('🏆', W / 2, top + 156 + bob, 74, Math.sin(g.t * 3) * 0.1);
    taeriHead(W / 2 - 88, top + 258 + bob, 56, 'happy');
    labooFull(W / 2 + 92, top + 238 - bob, 33, 'happy', g.t);
    rrect(W / 2 - 150, top + 346, 120, 38, 12, '#fff', PINK, 3);
    ink('임태리', W / 2 - 90, top + 366, 25, PINK);
    rrect(W / 2 + 36, top + 346, 112, 38, 12, '#fff', MINT, 3);
    ink('라부부', W / 2 + 92, top + 366, 25, '#6c49c9');
    ink('태리와 라부부는 사이좋은 친구가 되었어요', W / 2, top + 414, 20, '#8a6a58', 'center', W - 110);
    ink('코스 3개를 모두 이겼어요!', W / 2, top + 448, 20, '#2fa88b');
    const pulse = Math.floor(g.t * 2) % 2 === 0;
    keycap('◀', W / 2 - 48, top + 498, 46, pulse, PINK);
    keycap('▶', W / 2 + 48, top + 498, 46, !pulse, '#2fa8e0');
    if (Math.random() < 0.6) addConfetti(2);
    drawConfetti();
  }

  function render() {
    ctx.setTransform(ratioX, 0, 0, ratioY, 0, 0);
    ctx.clearRect(0, 0, W, H);
    switch (g.state) {
      case 'title': drawTitle(); break;
      case 'count': drawCount(); break;
      case 'race': drawPlay(); break;
      case 'paused':
        drawPlay();
        ctx.fillStyle = 'rgba(40,10,50,0.45)';
        ctx.fillRect(0, 0, W, H);
        card(80, H / 2 - 100, W - 160, 180);
        ink('잠깐 멈춤', W / 2, H / 2 - 40, 42, PINK);
        ink(stage.classList.contains('touch') ? '화면을 누르면 계속해요' : '← → 키를 누르면 계속해요', W / 2, H / 2 + 24, 20, '#6b4336', 'center', W - 200);
        break;
      case 'result': drawResult(); break;
      case 'ending': drawEnding(); break;
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
    if (g.state === 'race') {
      for (let i = 0; i < debug.steps && g.state === 'race'; i++) {
        if (debug.onStep) debug.onStep();
        updateRace(dt);
      }
    } else if (g.state === 'result' || g.state === 'ending') {
      updateConfetti(dt);
    }
    render();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  setState('title');
  Sound.music('title');
  requestAnimationFrame(frame);

  // ---------- 디버그 / 테스트용 ----------
  // 화면 없이 경주를 빠르게 끝까지 돌려서 승률을 재 본다
  function simulate(courseIdx, mode, losses = 0) {
    const savedLosses = g.losses;
    g.losses = losses;
    const R = newRace(COURSES[courseIdx]);
    const saved = race;
    race = R;
    const dt = 1 / 60;
    let guard = 0;
    while (guard++ < 60 * 200) {
      botStep(R, mode, dt);
      updateRace(dt);
      if (R.winner && R.finishT > 0.1) break;
    }
    race = saved;
    g.losses = savedLosses;
    return { win: R.winner === 'p', time: R.timeP, stars: R.p.stars, boosts: R.p.boosts };
  }
  let botT = 0;
  function botStep(R, mode, dt) {
    const p = R.p;
    botT -= dt;
    if (mode === 'idle') return;
    if (mode === 'random') {
      if (botT <= 0) { steer(pick([-1, 0, 1])); botT = 0.5; }
      return;
    }
    if (botT > 0) return;
    botT = 0.08;
    const danger = (lane) => R.objs.some((o) => (o.type === 'obs' || (mode === 'clean' && o.type === 'puddle')) && o.lane === lane && !o.hitP && o.dist - p.dist > -30 && o.dist - p.dist < 300);
    const want = (lane) => R.objs.some((o) => o.type === 'star' && o.lane === lane && !o.done && o.dist - p.dist > 20 && o.dist - p.dist < 260);
    if (mode === 'sloppy' && Math.random() < 0.04) return;   // 가끔 못 보는 어린이
    if (danger(p.lane)) {
      const opts = [p.lane - 1, p.lane + 1].filter((l) => l >= 0 && l < LANES && !danger(l));
      if (opts.length) {
        const star = opts.find(want);
        steer((star !== undefined ? star : pick(opts)) - p.lane);
      }
    } else {
      const opts = [p.lane - 1, p.lane + 1].filter((l) => l >= 0 && l < LANES && !danger(l) && want(l));
      if (opts.length && !want(p.lane)) steer(opts[0] - p.lane);
    }
  }

  window.__tr = {
    g, debug, keyDown, simulate,
    get race() { return race; },
    get courses() { return COURSES; },
    jump(idx) { g.losses = 0; startCourse(idx); },
    skipCount() { if (g.state === 'count') { g.t = 3.95; } },
    finishNow(win) {
      if (!race) return;
      race.p.dist = win ? race.course.length + 5 : 0;
      race.L.dist = win ? 0 : race.course.length + 5;
    },
  };
})();
