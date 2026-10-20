// Calendar + per-student feedback for each class.
// Saved in this browser's localStorage as { class1: { "YYYY-MM-DD": { Jini: "text", ... } } }.
// Use Export / Import to back up or move the data as a JSON file.
var STORE_KEY = "fet-feedback";
var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    return false;
  }
}

function pad(n) { return n < 10 ? "0" + n : "" + n; }
function dateKey(y, m, d) { return y + "-" + pad(m + 1) + "-" + pad(d); }

function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function initFeedback(root) {
  var classId = root.dataset.class;
  var students = CLASSES[classId] || [];
  var store = loadStore();

  // Weekdays the class meets, taken from the schedule ("Mon / Wed / Thu").
  var classDays = {};
  students.forEach(function (s) {
    s.days.split("/").forEach(function (d) {
      classDays[DAY_NAMES.indexOf(d.trim())] = true;
    });
  });

  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth();
  var selected = null;

  function classData() {
    if (!store[classId]) store[classId] = {};
    return store[classId];
  }

  function hasFeedback(key) {
    var entry = (store[classId] || {})[key];
    return !!entry && Object.keys(entry).some(function (n) { return entry[n]; });
  }

  // --- Layout ---
  root.appendChild(el("h4", "feedback-title", "Feedback Calendar"));

  var nav = el("div", "cal-nav");
  var prev = el("button", "cal-btn", "‹");
  var next = el("button", "cal-btn", "›");
  var label = el("strong", "cal-label");
  prev.type = next.type = "button";
  prev.setAttribute("aria-label", "Previous month");
  next.setAttribute("aria-label", "Next month");
  nav.appendChild(prev);
  nav.appendChild(label);
  nav.appendChild(next);
  root.appendChild(nav);

  var grid = el("div", "cal-grid");
  root.appendChild(grid);

  var panel = el("form", "fb-panel");
  panel.hidden = true;
  root.appendChild(panel);

  var tools = el("div", "fb-tools");
  var exportBtn = el("button", "btn-small", "Export JSON");
  var importBtn = el("button", "btn-small", "Import JSON");
  var fileInput = el("input");
  exportBtn.type = importBtn.type = "button";
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.hidden = true;
  tools.appendChild(exportBtn);
  tools.appendChild(importBtn);
  tools.appendChild(fileInput);
  tools.appendChild(el("span", "fb-hint", "Saved in this browser only. Export to back up."));
  root.appendChild(tools);

  // --- Calendar ---
  function renderCalendar() {
    label.textContent = MONTHS[month] + " " + year;
    grid.textContent = "";

    DAY_NAMES.forEach(function (n) { grid.appendChild(el("div", "cal-dow", n)); });

    var firstDow = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

    for (var i = 0; i < firstDow; i++) grid.appendChild(el("div", "cal-empty"));

    for (var d = 1; d <= daysInMonth; d++) {
      var key = dateKey(year, month, d);
      var btn = el("button", "cal-day", d);
      btn.type = "button";
      btn.dataset.date = key;
      if (classDays[new Date(year, month, d).getDay()]) btn.classList.add("is-class");
      if (key === todayKey) btn.classList.add("is-today");
      if (key === selected) btn.classList.add("is-selected");
      if (hasFeedback(key)) btn.classList.add("has-feedback");
      grid.appendChild(btn);
    }
  }

  function shiftMonth(delta) {
    month += delta;
    if (month < 0) { month = 11; year--; }
    if (month > 11) { month = 0; year++; }
    renderCalendar();
  }

  prev.addEventListener("click", function () { shiftMonth(-1); });
  next.addEventListener("click", function () { shiftMonth(1); });

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".cal-day");
    if (!btn) return;
    selected = btn.dataset.date;
    renderCalendar();
    renderPanel();
  });

  // --- Feedback panel ---
  function renderPanel() {
    panel.textContent = "";
    panel.hidden = false;

    var entry = (store[classId] || {})[selected] || {};
    panel.appendChild(el("h4", "fb-date", selected.replace(/-/g, "/") + " · Class feedback"));

    students.forEach(function (s) {
      var field = el("label", "fb-field");
      field.appendChild(el("span", "fb-name", s.name));
      var ta = el("textarea");
      ta.rows = 3;
      ta.name = s.name;
      ta.value = entry[s.name] || "";
      ta.placeholder = "Feedback for " + s.name;
      field.appendChild(ta);
      panel.appendChild(field);
    });

    var actions = el("div", "fb-actions");
    var save = el("button", "btn-small btn-primary", "Save");
    var clear = el("button", "btn-small btn-danger", "Delete");
    var status = el("span", "fb-status");
    save.type = "submit";
    clear.type = "button";
    actions.appendChild(save);
    actions.appendChild(clear);
    actions.appendChild(status);
    panel.appendChild(actions);

    clear.addEventListener("click", function () {
      if (!clear.dataset.armed) {
        clear.dataset.armed = "1";
        clear.textContent = "Click again to confirm";
        return;
      }
      delete classData()[selected];
      saveStore(store);
      renderCalendar();
      renderPanel();
    });
  }

  panel.addEventListener("submit", function (e) {
    e.preventDefault();
    var entry = {};
    var any = false;
    students.forEach(function (s) {
      var text = panel.elements[s.name].value.trim();
      if (text) { entry[s.name] = text; any = true; }
    });
    if (any) classData()[selected] = entry;
    else delete classData()[selected];

    var ok = saveStore(store);
    renderCalendar();
    var status = panel.querySelector(".fb-status");
    status.textContent = ok ? "Saved" : "Could not save (browser storage unavailable)";
    status.classList.toggle("is-error", !ok);
  });

  // --- Export / Import ---
  exportBtn.addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fet-feedback-" + dateKey(today.getFullYear(), today.getMonth(), today.getDate()) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  importBtn.addEventListener("click", function () { fileInput.click(); });

  fileInput.addEventListener("change", function () {
    var file = fileInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad format");
        store = data;
        saveStore(store);
        renderCalendar();
        if (selected) renderPanel();
      } catch (err) {
        alert("Invalid feedback file.");
      }
      fileInput.value = "";
    };
    reader.readAsText(file);
  });

  renderCalendar();
}

document.querySelectorAll(".feedback[data-class]").forEach(initFeedback);
