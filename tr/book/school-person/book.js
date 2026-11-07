// 책 1: 학교 사람 (학교 괴담 동화)
// 삽화는 모두 SVG로 직접 그렸고(400x280), 글은 text 배열에 있습니다.
// 내용을 고치면 tr/document/book-school-person.md 도 같이 고칠 것.
(function () {
  var uid = 0;
  function id(p) { return p + (++uid); }

  function svg(label, body, vb, par) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (vb || "0 0 400 280") + '"' +
      (par ? ' preserveAspectRatio="' + par + '"' : "") + ' role="img" aria-label="' + label + '">' + body + "</svg>";
  }

  function stars(list) {
    return list.map(function (s) {
      return '<circle class="tw" cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '" fill="#fff" style="animation-delay:' + s[3] + 's"/>';
    }).join("");
  }

  // lit(r,c) -> false | true | "f" (flickering)
  function wins(x0, y0, cols, rows, w, h, gx, gy, lit, color) {
    var out = "";
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var on = lit ? lit(r, c) : false;
        out += '<rect x="' + (x0 + c * (w + gx)) + '" y="' + (y0 + r * (h + gy)) + '" width="' + w + '" height="' + h +
          '" fill="' + (on ? (color || "#ffcf6b") : "#0f0a26") + '"' + (on === "f" ? ' class="flick"' : "") + "/>";
      }
    }
    return out;
  }

  function bat(x, y, s, delay) {
    return '<g class="float" style="animation-delay:' + delay + 's"><g transform="translate(' + x + " " + y + ") scale(" + s + ')">' +
      '<path d="M-9 -3 Q-4.5 -9 0 -2 Q4.5 -9 9 -3 Q4.5 -4 0 3 Q-4.5 -4 -9 -3z" fill="#06040f"/></g></g>';
  }

  function bubble(x, y, w, lines, size, tail, fill, ink) {
    var h = lines.length * (size + 3) + 10;
    fill = fill || "#fffaf0";
    ink = ink || "#2d2540";
    var t = lines.map(function (l, i) {
      return '<text x="' + (x + w / 2) + '" y="' + (y + 5 + size + i * (size + 3)) + '" text-anchor="middle" font-size="' + size +
        '" fill="' + ink + '" font-family="Jua, sans-serif">' + l + "</text>";
    }).join("");
    var tx = x + (tail != null ? tail : w / 2);
    return '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="' + fill + '"/>' +
      '<path d="M' + (tx - 5) + " " + (y + h - 1) + " L" + tx + " " + (y + h + 9) + " L" + (tx + 6) + " " + (y + h - 1) + 'z" fill="' + fill + '"/>' + t + "</g>";
  }

  // 하준이 (주인공). 원점 = 발 아래 가운데, 키 약 70
  function kid(x, y, s, o) {
    o = o || {};
    var skin = "#f7d3b0", jacket = "#f2b632", ink = "#2a1d1a";
    var eyes, mouth, arms;
    if (o.closed) {
      eyes = '<path d="M-8 -62 l5 2.5 l-5 2.5 M8 -62 l-5 2.5 l5 2.5" fill="none" stroke="' + ink + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
      mouth = '<path d="M-4 -49 q2 -3 4 0 q2 3 4 0" fill="none" stroke="#7a2a2a" stroke-width="1.3" stroke-linecap="round"/>';
    } else if (o.scared) {
      eyes = '<circle cx="-4.5" cy="-58" r="3.2" fill="#fff" stroke="' + ink + '" stroke-width=".8"/><circle cx="4.5" cy="-58" r="3.2" fill="#fff" stroke="' + ink + '" stroke-width=".8"/>' +
        '<circle cx="-4.5" cy="-58" r="1.3" fill="' + ink + '"/><circle cx="4.5" cy="-58" r="1.3" fill="' + ink + '"/>';
      mouth = '<ellipse cx="0" cy="-50.5" rx="2.2" ry="3" fill="#7a2a2a"/>';
    } else {
      eyes = '<circle cx="-4.5" cy="-58" r="1.7" fill="' + ink + '"/><circle cx="4.5" cy="-58" r="1.7" fill="' + ink + '"/>';
      mouth = o.smile
        ? '<path d="M-4 -52 q4 5 8 0" fill="none" stroke="#7a2a2a" stroke-width="1.4" stroke-linecap="round"/>'
        : '<path d="M-3 -51 h6" fill="none" stroke="#7a2a2a" stroke-width="1.3" stroke-linecap="round"/>';
    }
    var arm = function (x1, y1, x2, y2) {
      return '<path d="M' + x1 + " " + y1 + " L" + x2 + " " + y2 + '" stroke="' + jacket + '" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="' + x2 + '" cy="' + y2 + '" r="3.3" fill="' + skin + '"/>';
    };
    if (o.arms === "up") arms = arm(-11, -44, -18, -68) + arm(11, -44, 18, -68);
    else if (o.arms === "wave") arms = arm(-11, -44, -15, -26) + arm(11, -44, 20, -68);
    else arms = arm(-11, -44, -15, -26) + arm(11, -44, 15, -26);
    return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')">' +
      '<ellipse cx="0" cy="0" rx="15" ry="3" fill="rgba(0,0,0,.35)"/>' +
      '<rect x="-16" y="-46" width="6" height="19" rx="3" fill="#e0533d"/><rect x="10" y="-46" width="6" height="19" rx="3" fill="#e0533d"/>' +
      '<rect x="-8" y="-24" width="6.5" height="21" rx="2" fill="#3a4a8a"/><rect x="1.5" y="-24" width="6.5" height="21" rx="2" fill="#3a4a8a"/>' +
      '<rect x="-10" y="-4" width="9" height="4" rx="2" fill="#222"/><rect x="1" y="-4" width="9" height="4" rx="2" fill="#222"/>' +
      '<rect x="-11" y="-49" width="22" height="28" rx="6" fill="' + jacket + '"/>' +
      '<path d="M-5 -49 L-5 -30 M5 -49 L5 -30" stroke="#fff" stroke-width="1.4" opacity=".7"/>' +
      arms +
      '<circle cx="0" cy="-58" r="11.5" fill="' + skin + '"/>' +
      '<path d="M-12 -59 a12 12 0 0 1 24 0 q-4 -5 -12 -5 q-8 0 -12 5z" fill="' + ink + '"/>' +
      '<circle cx="-7" cy="-53" r="2.4" fill="#ff9a9a" opacity=".5"/><circle cx="7" cy="-53" r="2.4" fill="#ff9a9a" opacity=".5"/>' +
      eyes + mouth + "</g>";
  }

  // 학교 사람. 원점 = 발 아래 가운데, 키 약 145
  function figure(x, y, s, o) {
    o = o || {};
    var face = "";
    if (o.smile) {
      face = '<path d="M-9 -131 q3.5 -4 7 0 M2 -131 q3.5 -4 7 0" fill="none" stroke="#5a4a3a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M-6 -122 q6 6 12 0" fill="none" stroke="#5a4a3a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<circle cx="-10" cy="-124" r="3" fill="#ffb8a0" opacity=".6"/><circle cx="10" cy="-124" r="3" fill="#ffb8a0" opacity=".6"/>';
    } else if (o.sad) {
      face = '<path d="M-9 -129 q3.5 3 7 0 M2 -129 q3.5 3 7 0" fill="none" stroke="#5a4a3a" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M-4 -120 q4 -3 8 0" fill="none" stroke="#5a4a3a" stroke-width="1.6" stroke-linecap="round"/>';
    }
    var tear = o.tear ? '<g class="tear"><path d="M-5 -125 q-3.5 6 0 8.5 q3.5 -2.5 0 -8.5z" fill="#8fd0ff"/></g>' : "";
    var rim = o.rim ? ' stroke="#17122c" stroke-width="2"' : "";
    return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')">' +
      '<rect x="-10" y="-48" width="8" height="48" rx="2" fill="#0b0816"/><rect x="2" y="-48" width="8" height="48" rx="2" fill="#0b0816"/>' +
      '<path d="M-19 -108 Q-32 -75 -27 -44" stroke="#17122c" stroke-width="8" fill="none" stroke-linecap="round"/>' +
      '<path d="M19 -108 Q32 -75 27 -44" stroke="#17122c" stroke-width="8" fill="none" stroke-linecap="round"/>' +
      '<circle cx="-27" cy="-41" r="4.5" fill="#e9e2cc"/><circle cx="27" cy="-41" r="4.5" fill="#e9e2cc"/>' +
      '<path d="M-20 -112 Q0 -118 20 -112 L24 -38 L-24 -38 Z" fill="#17122c"/>' +
      '<path d="M-8 -114 L0 -102 L8 -114 Z" fill="#e9e2cc"/>' +
      '<g fill="#cdbb7a"><circle cx="0" cy="-94" r="1.7"/><circle cx="0" cy="-82" r="1.7"/><circle cx="0" cy="-70" r="1.7"/><circle cx="0" cy="-58" r="1.7"/></g>' +
      '<rect x="-4" y="-120" width="8" height="8" fill="#e9e2cc"/>' +
      '<g transform="rotate(' + (o.bow || 0) + ' 0 -112)">' +
      '<circle cx="0" cy="-128" r="27" fill="#fff6d0" opacity=".18"/>' +
      '<circle cx="0" cy="-128" r="17" fill="#f6f1e0"' + rim + "/>" + face + tear + "</g></g>";
  }

  function ghost(x, y, s, o) {
    o = o || {};
    return '<g class="float" style="animation-delay:' + (o.d || 0) + 's"><g transform="translate(' + x + " " + y + ") scale(" + s + ')" opacity="' + (o.op || 0.72) + '">' +
      '<path d="M-13 0 V-28 a13 13 0 0 1 26 0 V0 l-4.3 -5 l-4.3 5 l-4.4 -5 l-4.4 5 l-4.3 -5 z" fill="#cfe9ff"/>' +
      '<ellipse cx="-5" cy="-30" rx="2" ry="3" fill="#1a1a3a"/><ellipse cx="5" cy="-30" rx="2" ry="3" fill="#1a1a3a"/>' +
      '<ellipse cx="0" cy="-22" rx="2" ry="2.6" fill="#1a1a3a"/>' +
      '<path d="M13 -16 q9 -3 9 -17" stroke="#cfe9ff" stroke-width="5" fill="none" stroke-linecap="round"/></g></g>';
  }

  function desk(x, y, w) {
    var h = w * 0.16;
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="#8a6a45"/>' +
      '<rect x="' + (x + 3) + '" y="' + (y + h) + '" width="3" height="' + (w * 0.5) + '" fill="#3a2a22"/>' +
      '<rect x="' + (x + w - 6) + '" y="' + (y + h) + '" width="3" height="' + (w * 0.5) + '" fill="#3a2a22"/>';
  }
  function rowA() { return [50, 120, 190, 260, 330].map(function (x) { return desk(x, 170, 44); }).join(""); }
  function rowB() { return [20, 110, 200, 290].map(function (x) { return desk(x, 232, 62); }).join(""); }

  // 어두운 교실 배경 (칠판 + 창문)
  function room(boardInner) {
    return '<rect width="400" height="280" fill="#1c2346"/>' +
      '<rect y="188" width="400" height="92" fill="#2b2140"/><rect y="184" width="400" height="5" fill="#3d3058"/>' +
      '<rect x="86" y="26" width="228" height="100" rx="4" fill="#6b4a2f"/><rect x="92" y="32" width="216" height="88" fill="#1f4d40"/>' +
      '<rect x="92" y="120" width="216" height="5" fill="#8a6a45"/>' + (boardInner || "") +
      '<rect x="332" y="40" width="56" height="86" fill="#0d0a24" stroke="#4a4070" stroke-width="3"/>' +
      '<path d="M360 40 v86 M332 83 h56" stroke="#4a4070" stroke-width="2"/><circle cx="347" cy="62" r="9" fill="#f6f1d8"/>';
  }

  // ---------------- 표지 ----------------
  function cover() {
    var g = id("cv");
    var b = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07051a"/><stop offset=".55" stop-color="#2b1b5e"/><stop offset="1" stop-color="#6a2f78"/></linearGradient>' +
      '<radialGradient id="' + g + 'm"><stop offset="0" stop-color="#fff6c8" stop-opacity=".85"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="500" height="700" fill="url(#' + g + ')"/>';
    var st = [];
    for (var i = 0; i < 34; i++) st.push([(i * 97 + 31) % 500, (i * 53 + 17) % 330, i % 3 ? 1.1 : 1.7, (i % 7) * 0.5]);
    b += stars(st);
    b += '<circle cx="110" cy="300" r="120" fill="url(#' + g + 'm)"/><circle cx="110" cy="300" r="68" fill="#f7f2da"/>' +
      '<circle cx="90" cy="285" r="11" fill="#e6dfc0"/><circle cx="132" cy="320" r="8" fill="#e6dfc0"/><circle cx="104" cy="326" r="5" fill="#e6dfc0"/>';
    b += bat(380, 300, 2.2, 0) + bat(430, 360, 1.7, 1) + bat(60, 450, 1.8, 2);
    // 학교
    b += '<rect x="40" y="480" width="420" height="145" fill="#2c2160"/>' +
      '<rect x="205" y="395" width="90" height="230" fill="#322769"/>' +
      '<path d="M193 397 L250 335 L307 397 Z" fill="#241a4e"/>' +
      '<circle cx="250" cy="432" r="21" fill="#f6e9c0"/><path d="M250 432 V418 M250 432 L260 437" stroke="#2d2540" stroke-width="2.6" stroke-linecap="round"/>' +
      wins(58, 498, 4, 1, 22, 28, 12, 0, function (r, c) { return c === 2 ? "f" : false; }) +
      wins(58, 556, 4, 1, 22, 28, 12, 0, function (r, c) { return c === 0; }) +
      wins(315, 498, 4, 1, 22, 28, 12, 0, function (r, c) { return c === 1; }) +
      wins(315, 556, 4, 1, 22, 28, 12, 0, function (r, c) { return c === 3 ? "f" : false; }) +
      '<rect x="228" y="560" width="44" height="65" rx="3" fill="#0f0a26"/>';
    // 땅 + 철문
    b += '<rect y="620" width="500" height="80" fill="#120c2a"/><polygon points="215,620 285,620 350,700 150,700" fill="#1d1540"/>';
    var bars = "";
    for (var x = 4; x < 500; x += 22) {
      bars += '<rect x="' + x + '" y="630" width="5" height="70" fill="#07050f"/><path d="M' + (x - 1) + " 630 L" + (x + 2.5) + " 620 L" + (x + 6) + ' 630z" fill="#07050f"/>';
    }
    b += bars + '<rect y="652" width="500" height="6" fill="#07050f"/>';
    b += figure(345, 700, 2.0, { rim: true });
    b += kid(120, 692, 1.8, { scared: true, arms: "up" });
    return svg("달밤의 학교 앞에 키 큰 학교 사람이 서 있어요", b, "0 0 500 700", "xMidYMid slice");
  }

  // ---------------- 1. 해 질 녘 ----------------
  function s1() {
    var g = id("g");
    var b = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a78"/><stop offset=".55" stop-color="#c25a8c"/><stop offset="1" stop-color="#ffb35c"/></linearGradient>' +
      '<radialGradient id="' + g + 's"><stop offset="0" stop-color="#fff2b0"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="400" height="280" fill="url(#' + g + ')"/>' +
      stars([[40, 25, 1.2, 0], [95, 52, 1, 1], [155, 18, 1.3, .5], [250, 40, 1, 1.2], [345, 30, 1.2, 1.5]]) +
      '<circle cx="352" cy="196" r="72" fill="url(#' + g + 's)"/><circle cx="352" cy="196" r="30" fill="#ffe08a"/>' +
      '<g fill="#2b2050"><rect x="85" y="125" width="235" height="95"/><rect x="175" y="82" width="60" height="138"/><path d="M169 83 L205 56 L241 83z"/></g>' +
      '<circle cx="205" cy="104" r="13" fill="#f6e9c0"/><path d="M205 104 V95 M205 104 L212 108" stroke="#2b2050" stroke-width="1.8" stroke-linecap="round"/>' +
      wins(100, 140, 3, 2, 18, 22, 14, 14, function (r, c) { return (r + c) % 2 === 0 ? "f" : false; }) +
      wins(250, 140, 3, 2, 18, 22, 14, 14, function (r, c) { return r === 0 && c === 1; }) +
      '<rect x="190" y="184" width="30" height="36" rx="3" fill="#150f2e"/>' +
      '<rect y="220" width="400" height="60" fill="#241a40"/><rect y="244" width="400" height="36" fill="#31245a"/>' +
      '<ellipse cx="118" cy="266" rx="46" ry="4" fill="rgba(20,10,40,.45)"/>' +
      kid(76, 266, 1.15, { scared: true, arms: "up" }) +
      bubble(104, 150, 54, ["앗!"], 20, 16, "#fffaf0");
    return svg("해가 지는 학교 앞에서 하준이가 깜짝 놀라요", b);
  }

  // ---------------- 2. 밤의 학교 ----------------
  function s2() {
    var g = id("g");
    var b = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07051a"/><stop offset="1" stop-color="#2a2060"/></linearGradient></defs>' +
      '<rect width="400" height="280" fill="url(#' + g + ')"/>' +
      stars([[30, 20, 1.2, 0], [100, 38, 1, 1], [200, 15, 1.3, .6], [260, 30, 1, 1.4], [370, 22, 1.2, .3]]) +
      '<circle cx="330" cy="52" r="34" fill="#fff6c8" opacity=".18"/><circle cx="330" cy="52" r="24" fill="#f6f1d8"/>' +
      '<rect x="36" y="92" width="328" height="140" fill="#181236"/><rect x="30" y="86" width="340" height="9" fill="#120d2c"/>' +
      wins(54, 108, 6, 2, 30, 34, 20, 18, function (r, c) { return false; }) +
      // 눈처럼 보이는 창문
      '<rect x="144" y="108" width="30" height="34" fill="#d9f5a8" class="flick"/><rect x="224" y="108" width="30" height="34" fill="#d9f5a8" class="flick" style="animation-delay:.4s"/>' +
      '<circle cx="159" cy="128" r="6" fill="#0f0a26"/><circle cx="239" cy="128" r="6" fill="#0f0a26"/>' +
      '<rect x="304" y="108" width="30" height="34" fill="#cfe3ff" class="tw"/><ellipse cx="319" cy="128" rx="7" ry="11" fill="#fff"/>' +
      '<path d="M180 232 V196 a20 20 0 0 1 40 0 V232z" fill="#0b0818"/>' +
      '<path d="M0 230 Q40 170 60 232z M340 232 Q380 160 400 232z" fill="#07050f"/>' +
      bat(70, 60, 1, 0) + bat(130, 85, 0.8, 1.2) + bat(280, 70, 0.9, .6);
    // 철문
    var bars = "";
    for (var x = 2; x < 400; x += 18) bars += '<rect x="' + x + '" y="214" width="5" height="66" fill="#04030a"/><path d="M' + (x - 1) + " 214 L" + (x + 2.5) + " 205 L" + (x + 6) + ' 214z" fill="#04030a"/>';
    b += bars + '<rect y="236" width="400" height="5" fill="#04030a"/><rect y="262" width="400" height="5" fill="#04030a"/>';
    b += kid(88, 276, 1.15, { scared: true });
    return svg("까만 창문이 눈처럼 보이는 밤의 학교", b);
  }

  // ---------------- 3. 복도 ----------------
  function s3() {
    function leftDoor(x1, x2, c) {
      var t = function (x) { return 0.6 * x; }, bt = function (x) { return 280 - 0.7333 * x; };
      var tr = function (x) { return 400 - x; };
      var pts = function (a, b2, mirror) {
        var X1 = mirror ? tr(a) : a, X2 = mirror ? tr(b2) : b2;
        return X1 + "," + t(a) * 1 + " " + X2 + "," + t(b2) + " " + X2 + "," + (bt(b2) - 55 * (1 - b2 / 150)) + " " + X1 + "," + (bt(a) - 55 * (1 - a / 150));
      };
      return '<polygon points="' + pts(x1, x2, false) + '" fill="' + c + '"/><polygon points="' + pts(x1, x2, true) + '" fill="' + c + '"/>';
    }
    var b = '<rect width="400" height="280" fill="#151128"/>' +
      '<polygon points="0,0 400,0 250,90 150,90" fill="#1c1838"/>' +
      '<polygon points="0,280 400,280 250,170 150,170" fill="#2c2548"/>' +
      '<polygon points="0,0 150,90 150,170 0,280" fill="#3a3260"/>' +
      '<polygon points="400,0 250,90 250,170 400,280" fill="#342c58"/>' +
      '<rect x="150" y="90" width="100" height="80" fill="#0e0a20"/>' +
      '<rect x="180" y="104" width="40" height="34" fill="#4a6fb0" opacity=".55"/>' +
      leftDoor(22, 78, "#1f4d5a") + leftDoor(100, 132, "#1f4d5a") +
      '<ellipse cx="200" cy="25" rx="62" ry="6" fill="#fff7c9" class="flick"/>' +
      '<ellipse cx="200" cy="56" rx="38" ry="4" fill="#fff7c9" class="flick" style="animation-delay:.7s"/>' +
      '<ellipse cx="200" cy="76" rx="24" ry="3" fill="#fff7c9"/>' +
      '<ellipse cx="200" cy="215" rx="90" ry="26" fill="#fff7c9" opacity=".07"/>' +
      '<rect x="196" y="122" width="8" height="48" fill="#05030c"/><circle cx="200" cy="119" r="5" fill="#05030c"/>' +
      '<g class="tw" fill="#9fc8ff"><ellipse cx="186" cy="196" rx="5" ry="2.6" opacity=".6"/><ellipse cx="214" cy="186" rx="4" ry="2" opacity=".5"/><ellipse cx="190" cy="177" rx="3" ry="1.6" opacity=".4"/></g>' +
      kid(200, 272, 1.2, { scared: true });
    return svg("불빛이 깜빡이는 어두운 복도를 하준이가 걸어요", b);
  }

  // ---------------- 4. 음악실 ----------------
  function s4() {
    var keys = "", blacks = "";
    for (var i = 0; i < 14; i++) {
      var kx = 190 + i * 13.57, pressed = i === 4 || i === 9;
      keys += '<rect x="' + kx.toFixed(1) + '" y="' + (pressed ? 185 : 182) + '" width="13.57" height="' + (pressed ? 23 : 26) + '" fill="' + (pressed ? "#fff3a8" : "#f5f1e6") + '" stroke="#8f887a" stroke-width=".6"' + (pressed ? ' class="flick"' : "") + "/>";
      if ([0, 1, 3, 4, 5].indexOf(i % 7) >= 0 && i < 13) blacks += '<rect x="' + (kx + 13.57 - 4.5).toFixed(1) + '" y="182" width="9" height="15" fill="#15121f"/>';
    }
    var b = '<rect width="400" height="280" fill="#241c4a"/><rect y="210" width="400" height="70" fill="#3b2a3a"/>' +
      '<rect y="206" width="400" height="5" fill="#2a1d2c"/>' +
      '<polygon points="30,130 140,130 330,262 100,262" fill="#dfe8ff" opacity=".08"/>' +
      '<rect x="30" y="28" width="110" height="102" fill="#0d0a24" stroke="#5a4e88" stroke-width="4"/><path d="M85 28 v102 M30 79 h110" stroke="#5a4e88" stroke-width="3"/>' +
      '<circle cx="62" cy="54" r="15" fill="#f6f1d8"/>' +
      '<rect x="190" y="92" width="190" height="84" rx="6" fill="#11101c"/>' +
      '<rect x="228" y="106" width="116" height="52" fill="#e9e2cc"/><path d="M234 118 h104 M234 128 h104 M234 138 h104 M234 148 h104" stroke="#8a8470" stroke-width=".8"/>' +
      '<g fill="#2d2540"><circle cx="252" cy="133" r="3"/><path d="M255 133 v-14"stroke="#2d2540" stroke-width="1.2"/><circle cx="290" cy="123" r="3"/><circle cx="318" cy="143" r="3"/></g>' +
      '<rect x="180" y="172" width="210" height="10" fill="#0b0a12"/>' + keys + blacks +
      '<rect x="195" y="208" width="8" height="56" fill="#0b0a12"/><rect x="367" y="208" width="8" height="56" fill="#0b0a12"/>' +
      '<rect x="252" y="236" width="76" height="9" rx="2" fill="#2a2038"/><rect x="258" y="245" width="5" height="20" fill="#2a2038"/><rect x="317" y="245" width="5" height="20" fill="#2a2038"/>' +
      '<g font-family="sans-serif" fill="#9fd8ff" font-size="24">' +
      '<text class="float" x="200" y="82" style="animation-delay:0s">&#9834;</text>' +
      '<text class="float" x="262" y="66" style="animation-delay:.8s" font-size="30">&#9835;</text>' +
      '<text class="float" x="330" y="82" style="animation-delay:1.6s">&#9834;</text>' +
      '<text class="float" x="364" y="60" style="animation-delay:2.2s" font-size="20">&#9835;</text></g>' +
      kid(66, 274, 1.1, { scared: true });
    return svg("아무도 없는 음악실에서 피아노가 혼자 울려요", b);
  }

  // ---------------- 5. 화장실 ----------------
  function s5() {
    var g = id("t");
    var doors = "";
    for (var i = 0; i < 4; i++) {
      var x0 = 28 + i * 88, third = i === 2;
      doors += '<rect x="' + (x0 - 4) + '" y="54" width="5" height="178" fill="#2f6e70"/>';
      doors += (third ? '<g class="knock">' : "<g>") +
        '<rect x="' + x0 + '" y="62" width="76" height="150" fill="' + (third ? "#4aa3a0" : "#3f8f91") + '"/>' +
        '<rect x="' + (x0 + 5) + '" y="68" width="66" height="138" fill="none" stroke="#2f6e70" stroke-width="2"/>' +
        '<circle cx="' + (x0 + 62) + '" cy="140" r="3.5" fill="#d9d2b8"/>' +
        '<rect x="' + (x0 + 28) + '" y="78" width="20" height="16" rx="3" fill="#e8dcb0"/>' +
        '<text x="' + (x0 + 38) + '" y="91" text-anchor="middle" font-size="12" fill="#2d2540" font-family="Jua, sans-serif">' + (i + 1) + "</text></g>";
    }
    doors += '<rect x="372" y="54" width="5" height="178" fill="#2f6e70"/>';
    var b = '<defs><pattern id="' + g + '" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#2e4a52"/><path d="M0 0 H24 V24" fill="none" stroke="#3d5d66" stroke-width="1.5"/></pattern></defs>' +
      '<rect width="400" height="280" fill="url(#' + g + ')"/>' +
      '<rect y="232" width="400" height="48" fill="#1d2f36"/><path d="M0 232 H400" stroke="#14232a" stroke-width="3"/>' +
      doors +
      // 세 번째 칸 아래로 새어 나오는 빛과 발
      '<polygon points="190,214 252,214 270,272 172,272" fill="#e6ffd0" opacity=".16" class="flick"/>' +
      '<ellipse cx="216" cy="224" rx="9" ry="4" fill="#eaf6e0" opacity=".9"/><ellipse cx="236" cy="224" rx="9" ry="4" fill="#eaf6e0" opacity=".9"/>' +
      '<text class="tw" x="218" y="48" text-anchor="middle" font-size="19" fill="#ffe27a" font-family="Jua, sans-serif">똑 똑 똑</text>' +
      '<rect x="0" y="16" width="400" height="9" fill="#5a6b70"/><rect x="118" y="25" width="6" height="8" fill="#5a6b70"/><rect x="298" y="25" width="6" height="8" fill="#5a6b70"/>' +
      '<g fill="#8fd0ff"><path class="tear" d="M121 36 q-3 6 0 8 q3 -2 0 -8z"/><path class="tear" style="animation-delay:.9s" d="M301 36 q-3 6 0 8 q3 -2 0 -8z"/></g>' +
      '<ellipse cx="121" cy="262" rx="14" ry="3" fill="#35525c"/><ellipse cx="301" cy="256" rx="16" ry="3" fill="#35525c"/>' +
      kid(352, 278, 1.1, { scared: true });
    return svg("세 번째 화장실 칸에서 똑똑똑 소리가 나요", b);
  }

  // ---------------- 6. 과학실 ----------------
  function s6() {
    var jars = "";
    for (var r = 0; r < 2; r++) {
      jars += '<rect x="18" y="' + (84 + r * 58) + '" width="150" height="6" fill="#6b4a2f"/>';
      for (var i = 0; i < 5; i++) {
        var jx = 28 + i * 28, jy = 50 + r * 58;
        jars += '<rect x="' + jx + '" y="' + jy + '" width="19" height="34" rx="4" fill="#7dffa4" opacity=".4" class="tw" style="animation-delay:' + (i * 0.4) + 's"/>' +
          '<rect x="' + jx + '" y="' + jy + '" width="19" height="34" rx="4" fill="none" stroke="#b6ffd0" stroke-width="1.2"/>' +
          '<circle cx="' + (jx + 9.5) + '" cy="' + (jy + 20) + '" r="' + (4 + (i % 2) * 2) + '" fill="#e9ffd9" opacity=".7"/>';
      }
    }
    var ribs = "";
    for (var k = 0; k < 4; k++) {
      var ry = 102 + k * 9;
      ribs += '<path d="M255 ' + ry + " q-22 0 -24 12 M255 " + ry + ' q22 0 24 12" fill="none" stroke="#efe9d6" stroke-width="3" stroke-linecap="round"/>';
    }
    var b = '<rect width="400" height="280" fill="#1b2b3a"/><rect y="236" width="400" height="44" fill="#14202c"/>' +
      '<rect x="328" y="30" width="60" height="90" fill="#0d0a24" stroke="#46607a" stroke-width="3"/><circle cx="358" cy="62" r="13" fill="#f6f1d8"/>' +
      '<path d="M328 46 h60 M328 62 h60 M328 78 h60 M328 94 h60 M328 110 h60" stroke="#46607a" stroke-width="2"/>' +
      jars +
      '<rect x="253" y="84" width="4" height="170" fill="#555"/><ellipse cx="255" cy="256" rx="32" ry="6" fill="#333"/>' +
      '<rect x="253" y="88" width="4" height="62" fill="#efe9d6"/>' + ribs +
      '<path d="M232 97 H278" stroke="#efe9d6" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M233 98 L222 130 L226 164 M277 98 L288 130 L284 164" fill="none" stroke="#efe9d6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<ellipse cx="255" cy="158" rx="19" ry="9" fill="#efe9d6"/>' +
      '<path d="M246 164 L243 206 L245 246 M264 164 L267 206 L265 246" fill="none" stroke="#efe9d6" stroke-width="4" stroke-linecap="round"/>' +
      '<rect x="237" y="246" width="13" height="5" rx="2" fill="#efe9d6"/><rect x="260" y="246" width="13" height="5" rx="2" fill="#efe9d6"/>' +
      '<g class="sway" style="animation-duration:4s"><circle cx="255" cy="66" r="17" fill="#efe9d6"/><rect x="247" y="78" width="16" height="10" rx="2" fill="#efe9d6"/>' +
      '<circle cx="249" cy="64" r="5.2" fill="#1a1424"/><circle cx="261" cy="64" r="5.2" fill="#1a1424"/>' +
      '<circle cx="249" cy="64" r="1.9" fill="#ff5a5a" class="flick"/><circle cx="261" cy="64" r="1.9" fill="#ff5a5a" class="flick"/>' +
      '<path d="M255 70 l-2.2 5 h4.4z" fill="#1a1424"/><path d="M250 83 v4 M255 83 v4 M260 83 v4" stroke="#8a8470" stroke-width="1"/></g>' +
      kid(78, 276, 1.25, { scared: true, arms: "up" });
    return svg("과학실의 인체 모형이 하준이를 쳐다봐요", b);
  }

  // ---------------- 7. 끝없는 계단 ----------------
  function s7() {
    var steps = "M20 280 L20 228";
    for (var i = 0; i < 9; i++) {
      var yi = 250 - 22 * (i + 1);
      steps += " L" + (20 + 34 * (i + 1)) + " " + yi;
      if (i < 8) steps += " L" + (20 + 34 * (i + 1)) + " " + (250 - 22 * (i + 2));
    }
    steps += " L326 280 Z";
    var treads = "";
    for (var j = 0; j < 9; j++) treads += '<path d="M' + (20 + 34 * j) + " " + (228 - 22 * j) + " h34" + '" stroke="#5a4fa0" stroke-width="3"/>';
    function plate(x, y, t, red) {
      return '<g' + (red ? ' class="pulse"' : "") + '><rect x="' + x + '" y="' + y + '" width="44" height="24" rx="4" fill="' + (red ? "#e0533d" : "#e8dcb0") + '"/>' +
        '<text x="' + (x + 22) + '" y="' + (y + 17) + '" text-anchor="middle" font-size="15" fill="' + (red ? "#fff" : "#2d2540") + '" font-family="Jua, sans-serif">' + t + "</text></g>";
    }
    var b = '<rect width="400" height="280" fill="#1c2a3c"/>' +
      '<path d="M0 0 H400 V40 H0z" fill="#142030"/>' +
      '<rect x="190" y="6" width="40" height="8" rx="3" fill="#fff7c9" class="flick"/>' +
      '<path d="' + steps + '" fill="#26204a"/>' + treads +
      plate(30, 100, "2층") + plate(112, 72, "3층") + plate(196, 44, "4층") + plate(336, 100, "5층", true) +
      '<path d="M140 118 h-26 M146 132 h-34 M142 146 h-22" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>' +
      kid(176, 140, 0.95, { scared: true, arms: "up" });
    return svg("올라가도 끝이 없는 계단", b);
  }

  // ---------------- 8. 칠판 글씨 ----------------
  function s8() {
    var board = '<text class="chalk" x="200" y="82" text-anchor="middle" font-size="22" fill="#f4f1e6" font-family="Jua, sans-serif">출석을 부르겠습니다</text>' +
      '<g class="tw" fill="#f4f1e6" opacity=".7"><circle cx="110" cy="100" r="1.5"/><circle cx="292" cy="56" r="1.5"/><circle cx="270" cy="104" r="1.2"/></g>';
    var b = room(board) +
      '<circle cx="46" cy="58" r="20" fill="#efe6c8"/><path d="M46 58 v-11 M46 58 l8 4" stroke="#2d2540" stroke-width="2.2" stroke-linecap="round"/>' +
      rowA() + rowB() + kid(60, 276, 1.2, { scared: true });
    return svg("칠판에 출석을 부르겠다는 글씨가 나타나요", b);
  }

  // ---------------- 9. 출석 ----------------
  function s9() {
    var board = '<text x="200" y="64" text-anchor="middle" font-size="15" fill="#f4f1e6" font-family="Jua, sans-serif" opacity=".85">하준 · 서연 · 민수 · 지아</text>' +
      '<text x="200" y="92" text-anchor="middle" font-size="15" fill="#f4f1e6" font-family="Jua, sans-serif" opacity=".85">도윤 · 하늘 · 예린 · …</text>';
    var b = room(board) + rowA() +
      ghost(72, 168, 1.15, { d: 0 }) + ghost(142, 168, 1.15, { d: .8 }) + ghost(262, 168, 1.15, { d: 1.4 }) + ghost(346, 168, 1.15, { d: .4 }) +
      bubble(102, 100, 44, ["네…"], 14, 18, "#e8f2ff") + bubble(238, 100, 44, ["네…"], 14, 22, "#e8f2ff") +
      rowB() +
      kid(116, 270, 1.3, { scared: true, arms: "wave" }) +
      bubble(138, 168, 46, ["네…"], 15, 8);
    return svg("빈 자리에서 대답이 들려와요", b);
  }

  // ---------------- 10. 학교 사람 등장 ----------------
  function s10() {
    var b = room("") + '<polygon points="332,60 332,126 150,250 70,205" fill="#dfe8ff" opacity=".1"/>' + rowA() +
      '<polygon points="290,214 350,214 160,276 80,276" fill="#000" opacity=".3"/>' +
      '<g class="float" style="animation-duration:4.5s">' + figure(318, 214, 1.4, { bow: 8 }) + "</g>" +
      rowB() +
      bubble(26, 74, 112, ["그리고… 나."], 17, 74, "#1a1530", "#d9d2f5") +
      kid(80, 274, 1.25, { scared: true, arms: "up" });
    return svg("교실 구석에서 키가 아주 큰 학교 사람이 일어나요", b);
  }

  // ---------------- 11. 눈 감은 하준 ----------------
  function s11() {
    var g = id("g");
    var b = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d5a"/><stop offset="1" stop-color="#5a3a7a"/></linearGradient></defs>' +
      '<rect width="400" height="280" fill="url(#' + g + ')"/>' +
      stars([[30, 30, 1.2, 0], [70, 90, 1, 1], [20, 150, 1.3, .6]]) +
      '<g opacity=".7">' + figure(352, 280, 1.0, {}) + "</g>" +
      kid(120, 288, 2.5, { closed: true }) +
      '<circle cx="204" cy="150" r="5" fill="#fff6dc"/><circle cx="222" cy="128" r="8" fill="#fff6dc"/>' +
      '<g fill="#fff6dc"><circle cx="262" cy="64" r="30"/><circle cx="296" cy="48" r="32"/><circle cx="332" cy="62" r="30"/><circle cx="288" cy="86" r="30"/><circle cx="324" cy="92" r="24"/></g>' +
      // 아빠
      '<circle cx="262" cy="64" r="11" fill="#f7d3b0"/><path d="M251 62 a11 11 0 0 1 22 0 q-5 -5 -11 -5 q-6 0 -11 5z" fill="#4a3a30"/>' +
      '<rect x="251" y="75" width="22" height="26" rx="6" fill="#5a86d8"/>' +
      '<circle cx="258" cy="66" r="1.4" fill="#2a1d1a"/><circle cx="266" cy="66" r="1.4" fill="#2a1d1a"/><path d="M258 71 q4 4 8 0" fill="none" stroke="#7a2a2a" stroke-width="1.2" stroke-linecap="round"/>' +
      '<text x="310" y="64" text-anchor="middle" font-size="13" fill="#5a3a7a" font-family="Jua, sans-serif">무서울 땐</text>' +
      '<text x="310" y="82" text-anchor="middle" font-size="13" fill="#5a3a7a" font-family="Jua, sans-serif">이름을 불러</text>' +
      '<text x="310" y="100" text-anchor="middle" font-size="13" fill="#5a3a7a" font-family="Jua, sans-serif">보렴</text>';
    return svg("눈을 꼭 감은 하준이가 아빠의 말을 떠올려요", b);
  }

  // ---------------- 12. 백 년의 외로움 ----------------
  function s12() {
    var board = '<text class="chalk" x="200" y="84" text-anchor="middle" font-size="34" fill="#f4f1e6" font-family="Jua, sans-serif">100년</text>';
    var frames = "";
    for (var i = 0; i < 2; i++) {
      var fx = 8 + i * 36;
      frames += '<rect x="' + fx + '" y="22" width="30" height="22" fill="#6b4a2f"/><rect x="' + (fx + 3) + '" y="25" width="24" height="16" fill="#c9b48a"/>';
      for (var d = 0; d < 6; d++) frames += '<circle cx="' + (fx + 7 + (d % 3) * 7) + '" cy="' + (30 + Math.floor(d / 3) * 7) + '" r="2" fill="#5a4a3a"/>';
    }
    var b = room(board) + frames + rowA() +
      '<polygon points="290,214 360,214 230,276 150,276" fill="#000" opacity=".28"/>' +
      figure(268, 222, 1.3, { bow: 20, sad: true, tear: true }) +
      rowB() + kid(96, 274, 1.25, {});
    return svg("백 년 동안 혼자였던 학교 사람이 눈물을 흘려요", b);
  }

  // ---------------- 13. 친구 ----------------
  function s13() {
    var g = id("g");
    var b = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a78"/><stop offset="1" stop-color="#8a5aa0"/></linearGradient>' +
      '<radialGradient id="' + g + 'm"><stop offset="0" stop-color="#fff6c8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="400" height="280" fill="url(#' + g + ')"/>' +
      '<circle cx="200" cy="80" r="110" fill="url(#' + g + 'm)"/><circle cx="200" cy="80" r="52" fill="#fff4c4"/>' +
      stars([[40, 40, 1.6, 0], [90, 110, 1.2, .5], [330, 50, 1.6, 1], [370, 130, 1.2, .3], [150, 30, 1.2, 1.5], [270, 20, 1.4, .8]]) +
      '<rect y="244" width="400" height="36" fill="#3a2a5a"/>' +
      '<g class="float" style="animation-duration:4.5s">' + figure(305, 250, 1.5, { smile: true, bow: -12 }) + "</g>" +
      kid(108, 280, 1.35, { arms: "up", smile: true }) +
      '<g transform="rotate(-5 105 150)"><rect x="56" y="98" width="100" height="92" rx="4" fill="#f8f2e0" stroke="#c9b98a" stroke-width="2"/>' +
      '<rect x="56" y="98" width="10" height="92" rx="3" fill="#e0533d"/>' +
      '<path d="M76 118 H146 M76 132 H146 M76 176 H146" stroke="#d7cdb0" stroke-width="1.2"/>' +
      '<text x="111" y="164" text-anchor="middle" font-size="36" fill="#2d2540" font-family="Jua, sans-serif">친구</text></g>' +
      '<circle cx="78" cy="188" r="5.5" fill="#f7d3b0"/><circle cx="140" cy="182" r="5.5" fill="#f7d3b0"/>' +
      '<g class="tw" fill="#ffe27a"><path d="M232 120 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M370 150 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" style="animation-delay:1s"/><path d="M168 60 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" style="animation-delay:.5s"/></g>';
    return svg("하준이가 친구라고 쓴 공책을 보여 주자 학교 사람이 웃어요", b);
  }

  // ---------------- 14. 다음 날 아침 ----------------
  function backKid(x, y, s, hair, shirt) {
    return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')"><rect x="-13" y="-22" width="26" height="24" rx="8" fill="' + shirt + '"/>' +
      '<circle cx="0" cy="-32" r="11" fill="' + hair + '"/></g>';
  }
  function s14() {
    var g = id("g");
    var kids = "";
    var hairs = ["#2a1d1a", "#5a3a22", "#1c1c28", "#7a4a2a"], shirts = ["#e0533d", "#5a86d8", "#7fc47a", "#d58ac8"];
    for (var i = 0; i < 4; i++) {
      if (i !== 3) kids += backKid(68 + i * 80, 204, 1.0, hairs[i], shirts[i]);
      kids += desk(36 + i * 80, 206, 54);
    }
    var b = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#d8f0ff"/></linearGradient></defs>' +
      '<rect width="400" height="280" fill="#fdf0d0"/><rect y="200" width="400" height="80" fill="#e6c996"/>' +
      '<rect x="14" y="26" width="76" height="100" fill="url(#' + g + ')" stroke="#b58f5a" stroke-width="4"/><path d="M52 26 v100 M14 76 h76" stroke="#b58f5a" stroke-width="3"/>' +
      '<circle cx="70" cy="48" r="13" fill="#ffd95a"/><ellipse cx="36" cy="100" rx="16" ry="6" fill="#fff"/><ellipse cx="46" cy="96" rx="12" ry="7" fill="#fff"/>' +
      '<rect x="106" y="26" width="180" height="86" rx="4" fill="#8a6a45"/><rect x="111" y="31" width="170" height="76" fill="#2f6a56"/>' +
      '<text x="196" y="74" text-anchor="middle" font-size="19" fill="#f4f1e6" font-family="Jua, sans-serif">좋은 아침!</text>' +
      '<rect x="318" y="30" width="58" height="42" fill="#fff" stroke="#b58f5a" stroke-width="3"/><path d="M326 42 h42 M326 52 h42 M326 62 h30" stroke="#c9b48a" stroke-width="2"/>' +
      // 선생님
      '<g transform="translate(330 200)"><rect x="-13" y="-70" width="26" height="46" rx="8" fill="#e58aa8"/><rect x="-9" y="-24" width="7" height="24" fill="#3a3a58"/><rect x="2" y="-24" width="7" height="24" fill="#3a3a58"/>' +
      '<circle cx="0" cy="-84" r="12" fill="#f7d3b0"/><path d="M-13 -86 a13 13 0 0 1 26 0 q-6 -6 -13 -6 q-7 0 -13 6z" fill="#4a3a30"/><circle cx="0" cy="-99" r="6" fill="#4a3a30"/>' +
      '<circle cx="-4.5" cy="-84" r="1.5" fill="#2a1d1a"/><circle cx="4.5" cy="-84" r="1.5" fill="#2a1d1a"/><path d="M-4 -78 q4 4 8 0" fill="none" stroke="#7a2a2a" stroke-width="1.3" stroke-linecap="round"/>' +
      '<rect x="-22" y="-50" width="18" height="24" rx="2" fill="#4a6fb0"/></g>' +
      bubble(212, 126, 112, ["스물다섯 명,", "모두 왔구나!"], 13, 100, "#fffaf0") +
      // 맨 뒷자리의 친구
      '<g opacity=".5">' + figure(364, 214, 0.5, { smile: true }) + "</g>" +
      kids +
      bubble(226, 214, 120, ["하준아, 안녕!"], 12, 100, "#fff7c9") +
      kid(34, 274, 1.1, { smile: true, arms: "wave" });
    return svg("다음 날 아침 교실에서 보이지 않던 친구가 인사해요", b);
  }

  var pages = [
    { cover: true, art: cover(), title: "학교 사람", sub: "오싹오싹 학교 괴담 동화" },
    { art: s1(), text: ["방과 후, 해가 뉘엿뉘엿 지는 시간.", "하준이는 가방을 메고 집으로 가다가 우뚝 멈췄어요.", "“앗! 숙제 공책을 교실에 두고 왔네!”"] },
    { art: s2(), text: ["다시 돌아온 학교는 낮과 전혀 달랐어요.", "운동장은 텅 비었고, 까만 창문들은 하준이를 빤히 바라보는 것 같았지요.", "우리 학교에는 이런 소문이 있어요. “해가 지면 ‘학교 사람’이 나온대.”"] },
    { art: s3(), text: ["복도의 불빛이 깜빡깜빡.", "저벅, 저벅. 하준이의 발소리 뒤로 또 하나의 발소리가 따라왔어요.", "하준이가 멈추면, 그 발소리도 뚝 멈췄어요."] },
    { art: s4(), text: ["음악실에서 피아노 소리가 들려왔어요.", "도… 레… 미… 아무도 없는데 건반이 혼자 눌렸지요.", "작은 노랫소리도 들렸어요. “같이 놀자… 같이 놀자…”"] },
    { art: s5(), text: ["화장실 앞을 지날 때였어요.", "똑, 똑, 똑. 세 번째 칸에서 문 두드리는 소리가 났어요.", "“거, 거기 누구 있어요?” 대답 대신 물방울만 똑… 똑… 떨어졌어요."] },
    { art: s6(), text: ["과학실 안에서 인체 모형이 보였어요.", "분명히 아까는 벽 쪽을 보고 서 있었는데…", "어? 지금은 하준이를 똑바로 쳐다보고 있잖아요!"] },
    { art: s7(), text: ["하준이는 계단을 힘껏 뛰어 올라갔어요.", "2층, 3층, 4층… 그런데 이상해요. 우리 학교는 3층까지밖에 없는데!", "올라가도 올라가도 계단이 끝나지 않았어요."] },
    { art: s8(), text: ["겨우겨우 교실에 도착했어요.", "그때 칠판에 하얀 분필 글씨가 스르르 나타났어요.", "‘출석을 부르겠습니다.’"] },
    { art: s9(), text: ["텅 빈 교실에 목소리가 울렸어요.", "“김하준.” “…네.” 하준이는 떨리는 목소리로 대답했어요.", "“이서연.” “…네….” 아무도 없는 자리에서 대답이 들려왔어요! 아주 오래전 이 학교를 다녔던 아이들 같았어요."] },
    { art: s10(), text: ["마지막으로 목소리가 말했어요. “그리고… 나.”", "교실 맨 뒤 어두운 구석에서, 키가 천장에 닿을 만큼 큰 그림자가 천천히 일어났어요.", "얼굴은 하얀 보름달처럼 동그랗고 아무것도 없었어요. 바로 ‘학교 사람’이었어요!"] },
    { art: s11(), text: ["하준이는 눈을 꼭 감았어요.", "그때 아빠가 해 주신 말이 떠올랐어요. “무서울 땐 이름을 불러 보렴. 이름이 있으면 괴물이 아니란다.”", "하준이는 용기를 내어 물었어요. “너… 이름이 뭐니?”"] },
    { art: s12(), text: ["학교 사람은 한참 동안 가만히 서 있다가 아주 작은 목소리로 말했어요.", "“몰라… 아무도 나를 불러 준 적이 없어서 잊어버렸단다. 백 년 동안 이 학교에서 계속 혼자였어.”", "하얀 얼굴 위로 눈물이 똑 떨어졌어요."] },
    { art: s13(), text: ["하준이는 공책 맨 앞 장에 연필로 큰 글씨를 썼어요.", "“그럼 오늘부터 네 이름은 ‘친구’야. 나는 하준이야.”", "학교 사람의 얼굴이 환한 보름달처럼 활짝 웃었어요."] },
    { art: s14(), text: ["다음 날 아침, 선생님이 출석을 불렀어요. “스물다섯 명, 모두 왔구나!”", "그런데 맨 뒷자리 책상 위에는 하얀 분필 글씨가 있었어요. ‘하준아, 안녕! 오늘도 같이 놀자.’", "출석부 맨 끝에는 새 이름이 하나 늘어 있었답니다. ‘친구’.", "— 끝 —"] }
  ];
  (window.BOOKS = window.BOOKS || {})["school-person"] = {
    slug: "school-person",
    title: "학교 사람",
    sub: "오싹오싹 학교 괴담 동화",
    summary: "해가 진 학교에 숙제 공책을 가지러 간 하준이가 ‘학교 사람’을 만나는 이야기",
    cover: pages[0].art,
    pages: pages
  };
})();
