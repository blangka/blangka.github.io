// Shared picture-book reader. A book page defines window.BOOK = { title, pages: [...] } first.
// page = { art: "<svg>…" | "<img>", text: ["문장", …] }  or  { cover: true, art, title, sub }
// PC / landscape: two pages side by side. Phone / portrait: one page, swipe sideways.
(function () {
  var book = window.BOOK;
  var pages = book.pages;
  var N = pages.length;
  var mq = window.matchMedia("(min-width: 820px) and (orientation: landscape)");

  var root = document.getElementById("reader");
  var view = document.getElementById("view");
  var track = document.getElementById("track");
  var btnPrev = document.getElementById("prev");
  var btnNext = document.getElementById("next");
  var label = document.getElementById("label");

  var spread = mq.matches;
  var cur = 0;       // current page index (left page of a spread is cur or cur-1)
  var slideIdx = 0;
  var count = 0;

  function pageHTML(i) {
    if (i === null || i >= N) return '<div class="page blank"></div>';
    var p = pages[i];
    if (p.cover) {
      return '<section class="page cover"><div class="art">' + p.art + '</div>' +
        '<div class="cover-title"><h1>' + p.title + '</h1><p>' + p.sub + '</p></div></section>';
    }
    return '<section class="page"><div class="art">' + p.art + '</div>' +
      '<div class="text">' + p.text.map(function (t) { return "<p>" + t + "</p>"; }).join("") + '</div>' +
      '<span class="page-no">' + i + '</span></section>';
  }

  function build() {
    var slides = [];
    var i;
    if (spread) {
      slides.push([null, 0]);
      for (i = 1; i < N; i += 2) slides.push([i, i + 1 < N ? i + 1 : null]);
    } else {
      for (i = 0; i < N; i++) slides.push([i]);
    }
    count = slides.length;
    track.innerHTML = slides.map(function (pair) {
      return '<div class="slide">' + pair.map(pageHTML).join("") + "</div>";
    }).join("");
    root.classList.toggle("spread", spread);
    root.classList.toggle("single", !spread);
  }

  function slideOf(p) { return spread ? (p + 1) >> 1 : p; }
  function pageOf(s) { return spread ? (s === 0 ? 0 : 2 * s - 1) : s; }

  function show(s, animate) {
    s = Math.max(0, Math.min(count - 1, s));
    slideIdx = s;
    cur = pageOf(s);
    track.style.transition = animate === false ? "none" : "";
    track.style.transform = "translateX(" + (-s * 100) + "%)";

    if (cur === 0) {
      label.textContent = "표지";
    } else if (spread) {
      var l = cur, r = cur + 1;
      label.textContent = (r < N ? l + "-" + r : l) + " / " + (N - 1);
    } else {
      label.textContent = cur + " / " + (N - 1);
    }
    btnPrev.disabled = s === 0;
    btnNext.disabled = s === count - 1;
    try { history.replaceState(null, "", "#" + cur); } catch (e) {}
  }

  function rebuild() {
    spread = mq.matches;
    build();
    show(slideOf(cur), false);
  }

  // ---- Buttons & keyboard ----
  btnPrev.addEventListener("click", function () { show(slideIdx - 1); });
  btnNext.addEventListener("click", function () { show(slideIdx + 1); });

  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight") { e.preventDefault(); show(slideIdx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); show(slideIdx - 1); }
  });

  // ---- Swipe / drag ----
  var drag = null;

  view.addEventListener("pointerdown", function (e) {
    if (e.button > 0) return;
    drag = { x: e.clientX, y: e.clientY, dx: 0, mode: null, id: e.pointerId };
  });

  view.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x;
    var dy = e.clientY - drag.y;
    if (!drag.mode) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.mode = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (drag.mode === "h") {
        try { view.setPointerCapture(e.pointerId); } catch (err) {}
        track.style.transition = "none";
      }
    }
    if (drag.mode !== "h") return;
    if ((slideIdx === 0 && dx > 0) || (slideIdx === count - 1 && dx < 0)) dx *= 0.3;
    drag.dx = dx;
    track.style.transform = "translateX(calc(" + (-slideIdx * 100) + "% + " + dx + "px))";
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    if (d.mode !== "h") return;
    var threshold = Math.min(80, view.clientWidth * 0.15);
    if (d.dx < -threshold) show(slideIdx + 1);
    else if (d.dx > threshold) show(slideIdx - 1);
    else show(slideIdx);
  }
  view.addEventListener("pointerup", endDrag);
  view.addEventListener("pointercancel", endDrag);

  // ---- Start ----
  var m = /^#(\d+)$/.exec(location.hash);
  if (m) cur = Math.min(N - 1, parseInt(m[1], 10));

  if (mq.addEventListener) mq.addEventListener("change", rebuild);
  else if (mq.addListener) mq.addListener(rebuild);

  build();
  show(slideOf(cur), false);
})();
