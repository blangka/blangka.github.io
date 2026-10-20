// Default student schedules. Edits made on the page are saved in the browser
// (localStorage) and override these defaults; "Reset to default" brings them back.
// Times: Philippines time (PHT, UTC+8) and Korea time (KST, UTC+9, always +1 hour).
// paidUntil: last date the tuition is paid for (YYYY-MM-DD), or any text like "Free Trial".
var DEFAULT_CLASSES = {
  class1: [
    { name: "Jini",  pht: "7:00 PM - 7:20 PM", kst: "8:00 PM - 8:20 PM", days: "Mon / Wed / Thu", paidUntil: "2026-12-25" },
    { name: "Jun",   pht: "7:30 PM - 7:50 PM", kst: "8:30 PM - 8:50 PM", days: "Mon / Wed / Thu", paidUntil: "2026-12-25" },
    { name: "Tom",   pht: "8:00 PM - 8:20 PM", kst: "9:00 PM - 9:20 PM", days: "Mon / Wed / Thu", paidUntil: "2026-12-25" },
    { name: "Derek", pht: "8:30 PM - 8:50 PM", kst: "9:30 PM - 9:50 PM", days: "Mon / Wed / Thu", paidUntil: "2026-12-04" }
  ],
  class2: [
    { name: "Joohyuk", pht: "7:00 PM - 7:20 PM", kst: "8:00 PM - 8:20 PM",   days: "Tue / Wed / Thu", paidUntil: "Free Trial" },
    { name: "Jihoon",  pht: "9:00 PM - 9:20 PM", kst: "10:00 PM - 10:20 PM", days: "Tue / Wed / Thu", paidUntil: "Free Trial" }
  ]
};

var ROSTER_KEY = "fet-roster";
var EDIT_PASSWORD = "0000";
var unlocked = false; // stays true until the page is reloaded

function readSavedRoster() {
  try {
    return JSON.parse(localStorage.getItem(ROSTER_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function writeSavedRoster(saved) {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(saved));
    return true;
  } catch (e) {
    return false;
  }
}

function copy(value) { return JSON.parse(JSON.stringify(value)); }

var CLASSES = (function () {
  var saved = readSavedRoster();
  var out = {};
  Object.keys(DEFAULT_CLASSES).forEach(function (id) {
    out[id] = Array.isArray(saved[id]) ? saved[id] : copy(DEFAULT_CLASSES[id]);
  });
  return out;
})();

// "7:00 PM - 7:20 PM" (PHT) -> "8:00 PM - 8:20 PM" (KST). Returns "" if it can't parse.
function toKst(pht) {
  var m = pht.match(/^\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*[-–]\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*$/i);
  if (!m) return "";
  function shift(h, min, ap) {
    h = (h % 12) + (/p/i.test(ap) ? 12 : 0);
    h = (h + 1) % 24;
    return (h % 12 || 12) + ":" + min + " " + (h >= 12 ? "PM" : "AM");
  }
  return shift(+m[1], m[2], m[3]) + " - " + shift(+m[4], m[5], m[6]);
}

function formatPaid(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.replace(/-/g, "/") : value;
}

function cell(text, label) {
  var td = document.createElement("td");
  td.textContent = text;
  td.dataset.label = label;
  return td;
}

function inputCell(value, label, field, placeholder) {
  var td = document.createElement("td");
  var input = document.createElement("input");
  td.dataset.label = label;
  input.type = "text";
  input.value = value;
  input.dataset.field = field;
  input.placeholder = placeholder || "";
  input.setAttribute("aria-label", label);
  td.appendChild(input);
  return td;
}

function setupClass(article) {
  var classId = article.dataset.class;
  var tbody = article.querySelector("tbody");
  var count = article.querySelector("[data-count]");
  var tools = document.createElement("div");
  tools.className = "roster-tools";
  article.querySelector(".table-wrap").insertAdjacentElement("afterend", tools);

  function button(text, className, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn-small" + (className ? " " + className : "");
    b.textContent = text;
    b.addEventListener("click", onClick);
    return b;
  }

  function notify(renames) {
    document.dispatchEvent(new CustomEvent("roster-change", {
      detail: { classId: classId, renames: renames || {} }
    }));
  }

  // --- View mode ---
  function showView() {
    tbody.textContent = "";
    CLASSES[classId].forEach(function (s, i) {
      var tr = document.createElement("tr");
      tr.appendChild(cell(i + 1, "#"));
      tr.appendChild(cell(s.name, "Student"));
      tr.appendChild(cell(s.pht, "Philippines Time"));
      tr.appendChild(cell(s.kst, "Korea Time"));
      tr.appendChild(cell(s.days, "Days"));
      tr.appendChild(cell(formatPaid(s.paidUntil), "Paid Until"));
      tbody.appendChild(tr);
    });
    if (count) count.textContent = CLASSES[classId].length;

    tools.textContent = "";
    tools.appendChild(button("Edit students & schedule", "", function () {
      if (unlocked) showEdit();
      else showLock();
    }));
  }

  // --- Password prompt ---
  function showLock() {
    var input = document.createElement("input");
    var msg = document.createElement("span");
    input.type = "password";
    input.inputMode = "numeric";
    input.placeholder = "Password";
    input.className = "roster-pw";
    input.setAttribute("aria-label", "Password");
    msg.className = "roster-msg";

    function submit() {
      if (input.value === EDIT_PASSWORD) {
        unlocked = true;
        showEdit();
      } else {
        msg.textContent = "Wrong password.";
        input.value = "";
        input.focus();
      }
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
    });

    tools.textContent = "";
    tools.appendChild(input);
    tools.appendChild(button("OK", "btn-primary", submit));
    tools.appendChild(button("Cancel", "", showView));
    tools.appendChild(msg);
    input.focus();
  }

  // --- Edit mode ---
  function renumber() {
    tbody.querySelectorAll(".row-num").forEach(function (n, i) { n.textContent = i + 1; });
  }

  function editRow(s) {
    var tr = document.createElement("tr");
    tr.dataset.orig = s.name;

    var first = document.createElement("td");
    first.dataset.label = "#";
    first.className = "row-ctrl";
    var num = document.createElement("span");
    num.className = "row-num";
    var del = document.createElement("button");
    del.type = "button";
    del.className = "row-del";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Delete student");
    del.addEventListener("click", function () { tr.remove(); renumber(); });
    first.appendChild(num);
    first.appendChild(del);

    tr.appendChild(first);
    tr.appendChild(inputCell(s.name, "Student", "name", "Name"));
    tr.appendChild(inputCell(s.pht, "Philippines Time", "pht", "7:00 PM - 7:20 PM"));
    tr.appendChild(inputCell(s.kst, "Korea Time", "kst", "auto (PHT + 1h)"));
    tr.appendChild(inputCell(s.days, "Days", "days", "Mon / Wed / Thu"));
    tr.appendChild(inputCell(s.paidUntil, "Paid Until", "paidUntil", "YYYY-MM-DD or Free Trial"));
    return tr;
  }

  function showEdit() {
    tbody.textContent = "";
    CLASSES[classId].forEach(function (s) { tbody.appendChild(editRow(s)); });
    renumber();

    var msg = document.createElement("span");
    msg.className = "roster-msg";

    var reset = button("Reset to default", "btn-danger", function () {
      if (!reset.dataset.armed) {
        reset.dataset.armed = "1";
        reset.textContent = "Click again to confirm";
        return;
      }
      var saved = readSavedRoster();
      delete saved[classId];
      writeSavedRoster(saved);
      CLASSES[classId] = copy(DEFAULT_CLASSES[classId]);
      notify();
      showView();
    });

    tools.textContent = "";
    tools.appendChild(button("+ Add student", "", function () {
      var tr = editRow({ name: "", pht: "", kst: "", days: "", paidUntil: "" });
      tbody.appendChild(tr);
      renumber();
      tr.querySelector("input").focus();
    }));
    tools.appendChild(button("Save", "btn-primary", function () { save(msg); }));
    tools.appendChild(button("Cancel", "", showView));
    tools.appendChild(reset);
    tools.appendChild(msg);
  }

  function save(msg) {
    var rows = [];
    var seen = {};
    var renames = {};
    var error = "";

    tbody.querySelectorAll("tr").forEach(function (tr) {
      var v = {};
      tr.querySelectorAll("input").forEach(function (input) {
        v[input.dataset.field] = input.value.trim();
      });
      if (!v.name && !v.pht && !v.kst && !v.days && !v.paidUntil) return; // blank row

      if (!v.name) error = "Every student needs a name.";
      else if (seen[v.name.toLowerCase()]) error = "Duplicate name: " + v.name;
      seen[v.name.toLowerCase()] = true;

      rows.push({ name: v.name, pht: v.pht, kst: v.kst || toKst(v.pht), days: v.days, paidUntil: v.paidUntil });
      if (tr.dataset.orig && tr.dataset.orig !== v.name) renames[tr.dataset.orig] = v.name;
    });

    if (error) {
      msg.textContent = error;
      return;
    }

    var saved = readSavedRoster();
    saved[classId] = rows;
    if (!writeSavedRoster(saved)) {
      msg.textContent = "Could not save (browser storage unavailable)";
      return;
    }
    CLASSES[classId] = rows;
    notify(renames);
    showView();
  }

  showView();
}

document.querySelectorAll("article[data-class]").forEach(setupClass);
