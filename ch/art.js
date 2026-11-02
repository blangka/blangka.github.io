// 동화책 그림 같은 캐릭터 (캔버스 벡터로 직접 그림)
// 주인공: 비행기를 탄 고양이 기사 / 보스 10종: 전신 캐릭터
// 보스는 가로세로 150 정도의 상자(중심 0,0) 안에 그려지고, game.js가 크기에 맞춰 확대/축소합니다.
window.Art = (() => {
  const TAU = Math.PI * 2;
  const LINE = '#4a2f27';       // 모든 그림에 쓰는 따뜻한 갈색 윤곽선
  let c = null;                 // 현재 그리는 컨텍스트

  function paint(fill, lw = 3.5) {
    if (fill) { c.fillStyle = fill; c.fill(); }
    c.lineWidth = lw;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = LINE;
    c.stroke();
  }
  const oval = (x, y, rx, ry, fill, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); paint(fill); };
  const circ = (x, y, r, fill) => oval(x, y, r, r, fill);
  const poly = (pts, fill) => {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.closePath();
    paint(fill);
  };
  const line = (pts, w = 3.5, col = LINE) => {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke();
  };
  // 오른쪽 절반만 그리면 왼쪽은 거울처럼 자동으로 그려진다
  const mirror = (fn) => { fn(); c.save(); c.scale(-1, 1); fn(); c.restore(); };
  function eye(x, y, r, px = 0, py = 0, iris = '#2b1b17') {
    circ(x, y, r, '#fff');
    c.beginPath(); c.arc(x + px, y + py, r * 0.58, 0, TAU); c.fillStyle = iris; c.fill();
    c.beginPath(); c.arc(x + px - r * 0.18, y + py - r * 0.22, r * 0.2, 0, TAU); c.fillStyle = '#fff'; c.fill();
  }
  const brow = (x1, y1, x2, y2, w = 4) => line([[x1, y1], [x2, y2]], w);

  // ---------------- 주인공: 비행기를 탄 고양이 기사 ----------------
  // 위쪽이 앞(프로펠러). bank: 좌우로 기울기 (-1 ~ 1)
  function player(ctx, t, bank = 0) {
    c = ctx;
    c.save();
    c.rotate(bank * 0.14);
    // 엔진 불꽃
    const fl = 6 + Math.sin(t * 45) * 3;
    poly([[-5, 30], [5, 30], [0, 32 + fl + 6]], '#ffd36e');
    // 고양이 꼬리 모양 꼬리날개
    const sw = Math.sin(t * 5) * 5;
    c.beginPath(); c.moveTo(0, 30); c.quadraticCurveTo(15 + sw, 38, 10 + sw, 54);
    c.strokeStyle = LINE; c.lineWidth = 10; c.lineCap = 'round'; c.stroke();
    c.strokeStyle = '#f4a259'; c.lineWidth = 6; c.stroke();
    c.beginPath(); c.arc(10 + sw, 54, 3.2, 0, TAU); c.fillStyle = '#fff4d6'; c.fill();
    // 꼬리 수평날개
    mirror(() => poly([[5, 22], [24, 30], [22, 36], [5, 33]], '#fff4d6'));
    // 큰 날개
    mirror(() => {
      poly([[9, -6], [44, 4], [48, 17], [9, 16]], '#fff4d6');
      poly([[38, 2], [48, 17], [36, 15]], '#e85f5f');
      circ(26, 8, 4, '#f6c945');
    });
    // 동체
    oval(0, 8, 13, 30, '#e86a5a');
    oval(0, 14, 7, 18, '#f58f7f');
    // 프로펠러
    c.save();
    c.translate(0, -24);
    c.rotate(t * 38);
    c.fillStyle = 'rgba(74,47,39,0.28)';
    c.beginPath(); c.ellipse(0, 0, 25, 4.5, 0, 0, TAU); c.fill();
    c.restore();
    circ(0, -24, 5, '#f6c945');
    // 고양이 조종사 (귀 -> 얼굴 -> 기사 투구)
    mirror(() => {
      poly([[6, -9], [13, -23], [15, -7]], '#f4a259');
      poly([[8.5, -10], [12.5, -19], [13, -9]], '#f7b6c2');
    });
    oval(0, -2, 13, 11.5, '#f4a259');
    mirror(() => { line([[4, -9], [5, -5]], 1.8, '#c4722d'); line([[8, -8], [9, -4]], 1.8, '#c4722d'); });
    mirror(() => { circ(5.4, -1, 2.8, '#2b1b17'); circ(4.6, -2, 0.9, '#fff'); });
    poly([[-2, 3], [2, 3], [0, 5.5]], '#f58a9b');
    line([[0, 5.5], [0, 7.5]], 1.5);
    mirror(() => { line([[8, 5], [16, 3]], 1.2); line([[8, 7], [16, 8]], 1.2); });
    c.beginPath(); c.arc(0, -8, 13.5, Math.PI, 0); c.closePath(); paint('#c5cfdd');
    line([[-13, -8], [13, -8]], 2.5, '#8793a5');
    line([[0, -21], [0, -8]], 2, '#8793a5');
    oval(0, -25, 3.4, 7, '#e04f4f');
    c.restore();
  }

  // ---------------- 보스 10종 ----------------
  const bosses = {
    // 챕터 1: 이웃집 개
    dog(t) {
      const TAN = '#e8b86d';
      const CREAM = '#f8e6bd';
      const BRN = '#9a5f2c';
      oval(48, 34, 9, 22, TAN, 0.7 + Math.sin(t * 9) * 0.35);
      oval(0, 40, 44, 40, TAN);
      oval(0, 48, 26, 28, CREAM);
      mirror(() => oval(24, 72, 14, 9, CREAM));
      c.beginPath(); c.ellipse(0, 22, 30, 8, 0, 0, Math.PI); paint('#d94b4b');
      circ(0, 33, 5, '#f4c542');
      mirror(() => oval(44, -10, 13, 28, BRN, 0.3));
      oval(0, -12, 41, 35, TAN);
      oval(0, 4, 23, 17, CREAM);
      oval(0, -5, 8, 5.5, '#2f2222');
      oval(0, 16, 12, 10, '#8f2c3d');
      oval(0, 21, 7, 6, '#f58a9b');
      mirror(() => poly([[5, 11], [9, 19], [2, 15]], '#fff'));
      mirror(() => { eye(16, -22, 7.5, -1, 1); brow(8, -25, 26, -35); });
    },

    // 챕터 2: 늑대 대장
    wolf(t) {
      const G = '#8e98ac';
      const L = '#dde2ec';
      oval(-54, 36, 14, 30, G, -0.6 + Math.sin(t * 3) * 0.12);
      oval(0, 42, 40, 38, G);
      oval(0, 50, 22, 26, L);
      mirror(() => {
        oval(40, 44, 11, 26, G, -0.15);
        poly([[35, 66], [39, 77], [43, 66], [47, 77], [49, 64]], '#fff');
      });
      mirror(() => { poly([[14, -38], [24, -74], [36, -32]], G); poly([[19, -40], [25, -60], [31, -38]], '#f2b5c1'); });
      oval(0, -14, 38, 32, G);
      mirror(() => poly([[32, -6], [54, 8], [30, 16]], G));
      oval(0, 4, 19, 22, L);
      oval(0, -8, 7, 5, '#222');
      oval(0, 14, 11, 7, '#7a1f2b');
      mirror(() => poly([[5, 10], [10, 25], [1, 12]], '#fff'));
      mirror(() => { oval(15, -22, 9, 6, '#ffe066', 0.35); oval(15, -22, 2, 5, '#222'); brow(7, -24, 26, -35, 4.5); });
      line([[-6, -44], [0, -36], [6, -44]], 3, '#5a6479');
    },

    // 챕터 3: 쥐 왕
    rat(t) {
      const R = '#b9a08c';
      const P = '#f4a6b5';
      const C = '#efe0d0';
      poly([[-46, -6], [-60, 72], [60, 72], [46, -6]], '#c0392b');
      c.beginPath(); c.ellipse(0, 72, 60, 6, 0, 0, TAU); paint('#fff8e8');
      const tw = Math.sin(t * 4) * 6;
      line([[34, 62], [56, 54 + tw], [68, 36], [60, 22 - tw]], 8, LINE);
      line([[34, 62], [56, 54 + tw], [68, 36], [60, 22 - tw]], 4.5, P);
      oval(0, 38, 38, 36, R);
      oval(0, 44, 22, 24, C);
      mirror(() => oval(22, 70, 12, 8, P));
      mirror(() => { circ(34, -36, 18, R); circ(34, -36, 10, P); });
      oval(0, -12, 34, 30, R);
      oval(0, 4, 22, 16, C);
      circ(0, -3, 6, P);
      c.beginPath(); c.rect(-5, 6, 10, 10); paint('#fff');
      line([[0, 6], [0, 16]], 2.5);
      mirror(() => {
        line([[12, 3], [36, -3]], 2);
        line([[12, 8], [36, 11]], 2);
        eye(14, -20, 6, -0.5, 1);
        brow(7, -23, 22, -31, 3.5);
      });
      poly([[-22, -38], [-24, -62], [-11, -50], [0, -68], [11, -50], [24, -62], [22, -38]], '#f6c945');
      circ(0, -50, 3.5, '#d94b4b');
      circ(-14, -46, 2.5, '#4a90d9');
      circ(14, -46, 2.5, '#4a90d9');
    },

    // 챕터 4: 멧돼지 장군
    boar() {
      const B = '#9a6a4a';
      const D = '#6b4430';
      const S = '#e8a7a0';
      const M = '#aab6c6';
      oval(0, 38, 48, 42, B);
      poly([[-26, -8], [-20, -24], [-12, -12], [-4, -26], [4, -12], [12, -24], [20, -12], [26, -24], [30, -6]], D);
      oval(0, 44, 34, 28, M);
      [-14, 0, 14].forEach((x) => circ(x, 44, 2.6, '#f5f8fb'));
      line([[-22, 30], [22, 30]], 2.5, '#7c8a9c');
      mirror(() => oval(30, 74, 13, 8, D));
      mirror(() => poly([[26, -36], [48, -50], [44, -20]], B));
      oval(0, -10, 38, 32, B);
      oval(0, 8, 22, 16, S);
      mirror(() => {
        oval(7, 8, 3.5, 5, '#6b3a3a');
        poly([[15, 12], [32, -2], [28, 22]], '#fffaf0');
        eye(18, -18, 5.5, -1, 1, '#a02020');
        brow(10, -21, 27, -30, 4.5);
      });
      c.beginPath(); c.arc(0, -24, 32, Math.PI, 0); c.closePath(); paint(M);
      mirror(() => poly([[26, -26], [42, -46], [34, -24]], '#f5f0dc'));
      oval(0, -24, 35, 5, '#8793a5');
      oval(0, -58, 5, 10, '#e04f4f');
    },

    // 챕터 5: 늪의 두꺼비
    toad(t) {
      const G = '#7fbf5a';
      const L = '#d4eaa2';
      const D = '#4d8a3c';
      const br = Math.sin(t * 3) * 2;
      mirror(() => oval(54, 48, 14, 24, G, 0.5));
      oval(0, 28, 58, 46 + br, G);
      oval(0, 40, 40, 30, L);
      [[-30, 10], [34, 16], [-12, -6], [20, -4], [-44, 34], [46, 36]].forEach(([x, y]) => circ(x, y, 4, D));
      circ(-18, 4, 6, '#b07be0');
      mirror(() => oval(48, 66, 17, 9, G));
      oval(0, 50, 15, 9 + br * 0.5, '#e9f4b8');
      c.beginPath(); c.moveTo(-42, 12); c.quadraticCurveTo(0, 40, 42, 12); c.quadraticCurveTo(0, 22, -42, 12);
      paint('#7a2b3b');
      mirror(() => {
        circ(30, -24, 19, G);
        eye(30, -26, 12, -1, 2, '#d9a400');
        c.beginPath(); c.arc(30, -26, 13, Math.PI, 0); c.closePath(); paint(G);
        circ(8, -6, 2.6, D);
      });
    },

    // 챕터 6: 문어 선장
    octo(t) {
      const P = '#9b6bd1';
      const L = '#cdb0f0';
      for (let i = 0; i < 8; i++) {
        const a = (i - 3.5) / 3.5;
        const pts = [];
        for (let k = 0; k <= 6; k++) {
          const u = k / 6;
          pts.push([a * 34 + a * u * 30 + Math.sin(t * 4 + i + u * 4) * 8 * u, 14 + u * 58]);
        }
        line(pts, 16, LINE);
        line(pts, 10.5, P);
        for (let k = 2; k <= 6; k += 2) { c.beginPath(); c.arc(pts[k][0], pts[k][1], 2, 0, TAU); c.fillStyle = L; c.fill(); }
      }
      oval(0, -10, 46, 44, P);
      [[-22, -30], [16, -34], [32, -12]].forEach(([x, y]) => circ(x, y, 4, L));
      eye(-16, -6, 11, 1, 1);
      brow(-29, -22, -6, -14, 4.5);
      circ(16, -6, 11, '#222');
      line([[8, -14], [46, -28]], 3);
      line([[26, -2], [46, 2]], 3);
      c.beginPath(); c.moveTo(-22, 16); c.quadraticCurveTo(0, 34, 22, 16); c.quadraticCurveTo(0, 24, -22, 16);
      paint('#5b1f3a');
      poly([[-9, 20], [-4, 27], [0, 21]], '#fff');
      poly([[3, 21], [8, 27], [12, 20]], '#fff');
      poly([[-46, -38], [-30, -54], [0, -72], [30, -54], [46, -38], [30, -32], [-30, -32]], '#2f2f45');
      line([[-34, -40], [34, -40]], 4, '#f6c945');
      circ(0, -52, 7, '#fff');
      circ(-2.5, -53, 1.6, '#222');
      circ(2.5, -53, 1.6, '#222');
    },

    // 챕터 7: 불꽃 전갈
    scorpion(t) {
      const O = '#e5873a';
      const D = '#a24d1a';
      const L = '#f9c47a';
      const gl = c.createRadialGradient(0, 10, 10, 0, 10, 82);
      gl.addColorStop(0, 'rgba(255,140,40,0.5)');
      gl.addColorStop(1, 'rgba(255,140,40,0)');
      c.fillStyle = gl;
      c.fillRect(-90, -80, 180, 180);
      mirror(() => {
        line([[18, 16], [44, 8], [52, 26]], 4);
        line([[20, 28], [48, 30], [54, 48]], 4);
        line([[16, 40], [40, 52], [44, 68]], 4);
      });
      const sw = Math.sin(t * 3) * 4;
      const tail = [[0, -2], [16, -16], [24, -38], [16, -58 + sw], [-4, -64 + sw]];
      tail.forEach(([x, y], i) => circ(x, y, 14 - i * 1.3, O));
      poly([[-12, -62 + sw], [2, -62 + sw], [-5, -40 + sw]], '#c0392b');
      oval(0, 16, 34, 30, O);
      [4, 16, 28].forEach((y) => line([[-22, y], [22, y]], 2.5, D));
      mirror(() => {
        line([[28, 20], [50, 36]], 11, LINE);
        line([[28, 20], [50, 36]], 6.5, O);
        oval(58, 52, 15, 11, O, 0.5);
        poly([[56, 44], [72, 64], [62, 68], [52, 56]], L);
      });
      oval(0, 44, 24, 18, O);
      mirror(() => { eye(10, 42, 5, 0, 1.5, '#222'); brow(5, 36, 16, 33, 3); poly([[6, 58], [15, 70], [3, 64]], L); });
    },

    // 챕터 8: 까마귀 마법사
    raven(t) {
      const K = '#3d2a5c';
      const Wg = '#2a1a45';
      const fl = Math.sin(t * 5) * 8;
      mirror(() => {
        poly([[22, 0], [76, -26 - fl], [72, 8], [64, 30], [50, 22], [36, 44], [26, 30]], Wg);
        line([[40, 6], [64, -10 - fl * 0.5]], 2.5, '#6a4aa5');
      });
      poly([[-26, -6], [26, -6], [42, 70], [-42, 70]], '#6a45b0');
      [[-12, 20], [14, 36], [-6, 54], [18, 58]].forEach(([x, y]) => circ(x, y, 2.6, '#ffe066'));
      line([[-58, -22], [-52, 70]], 5, '#8a5a2b');
      const gl = c.createRadialGradient(-58, -28, 2, -58, -28, 22);
      gl.addColorStop(0, 'rgba(127,224,255,0.8)');
      gl.addColorStop(1, 'rgba(127,224,255,0)');
      c.fillStyle = gl;
      c.fillRect(-82, -52, 48, 48);
      circ(-58, -28, 8, '#7fe0ff');
      circ(0, -24, 23, K);
      poly([[-8, -19], [8, -19], [0, 1]], '#f2a23a');
      mirror(() => { circ(11, -30, 6.5, '#ffe066'); circ(11, -30, 2.5, '#222'); brow(5, -34, 19, -40, 3.5); });
      oval(0, -42, 37, 8, Wg);
      poly([[-25, -42], [25, -42], [11, -62], [5, -76], [-12, -60]], Wg);
      line([[-24, -45], [24, -45]], 4, '#f6c945');
    },

    // 챕터 9: 시간의 용
    dragon(t) {
      const T = '#5fb3a1';
      const B = '#f2e2a9';
      const fl = Math.sin(t * 3) * 6;
      mirror(() => poly([[26, 10], [78, -30 - fl], [74, 6], [66, 12], [62, 36], [50, 28], [42, 50], [30, 34]], '#3f8f86'));
      oval(-52, 52, 14, 26, T, 0.7);
      oval(0, 36, 40, 42, T);
      oval(0, 44, 26, 32, B);
      poly([[-9, 28], [9, 28], [0, 44]], '#f6e8b0');
      poly([[-9, 62], [9, 62], [0, 46]], '#e8a0d0');
      line([[-11, 27], [11, 27]], 3, '#d4a82a');
      line([[-11, 63], [11, 63]], 3, '#d4a82a');
      mirror(() => { oval(40, 48, 10, 22, T, -0.3); poly([[36, 66], [40, 77], [46, 66]], B); });
      mirror(() => poly([[16, -42], [22, -74], [32, -38]], '#f5efd2'));
      oval(0, -18, 34, 30, T);
      oval(0, -4, 21, 14, T);
      mirror(() => circ(7, -4, 2.6, '#3f8f86'));
      mirror(() => {
        oval(15, -26, 8, 6, '#ffe066');
        circ(15, -26, 2.5, '#222');
        line([[6, -33], [27, -37]], 7, LINE);
        line([[6, -33], [27, -37]], 3.5, '#fff');
      });
      c.beginPath(); c.arc(15, -26, 11, 0, TAU); c.strokeStyle = '#d4a82a'; c.lineWidth = 2.5; c.stroke();
      line([[26, -22], [34, -2]], 1.5, '#d4a82a');
      poly([[-14, 2], [14, 2], [10, 28], [0, 46], [-10, 28]], '#f4f4f4');
    },

    // 챕터 10: 폭풍 구름
    storm(t) {
      const puffs = [[-46, 14, 28], [-18, -8, 36], [22, -10, 36], [48, 14, 28], [-24, 30, 28], [22, 32, 30], [0, 22, 34]];
      puffs.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r + 4, 0, TAU); c.fillStyle = LINE; c.fill(); });
      puffs.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#6d7a99'; c.fill(); });
      c.beginPath(); c.arc(-14, -18, 17, Math.PI * 1.1, Math.PI * 1.7);
      c.strokeStyle = '#9fabc7'; c.lineWidth = 5; c.lineCap = 'round'; c.stroke();
      mirror(() => {
        oval(16, 6, 11, 13, '#fff');
        circ(14, 8, 5.5, '#222');
        brow(5, -10, 28, -20, 5);
        circ(30, 24, 6, '#f2a2b8');
      });
      line([[-24, 36], [-13, 27], [-2, 38], [9, 27], [20, 38], [28, 30]], 4.5, '#222');
      mirror(() => poly([[56, 34], [78, 34], [68, 48], [82, 48], [58, 78], [64, 54], [52, 54]], '#ffe45e'));
      for (let i = 0; i < 5; i++) oval(-40 + i * 20, ((t * 120 + i * 37) % 44) + 56, 3, 6, '#7fc3ff');
    },
  };

  function boss(ctx, key, t) {
    c = ctx;
    const fn = bosses[key];
    if (fn) fn(t);
  }

  return { player, boss };
})();
