// Student schedules. Edit this list to change the tables on the page.
// Times: Philippines time (PHT, UTC+8) and Korea time (KST, UTC+9, always +1 hour).
// paidUntil: last date the tuition is paid for (YYYY-MM-DD).
var CLASSES = {
  class1: [
    { name: "Jini",  pht: "7:00 PM - 7:20 PM", kst: "8:00 PM - 8:20 PM", days: "Mon / Wed / Thu", paidUntil: "2026-12-25" },
    { name: "Jun",   pht: "7:30 PM - 7:50 PM", kst: "8:30 PM - 8:50 PM", days: "Mon / Wed / Thu", paidUntil: "2026-12-25" },
    { name: "Tom",   pht: "8:00 PM - 8:20 PM", kst: "9:00 PM - 9:20 PM", days: "Mon / Wed / Thu", paidUntil: "2026-12-25" },
    { name: "Derek", pht: "8:30 PM - 8:50 PM", kst: "9:30 PM - 9:50 PM", days: "Mon / Wed / Thu", paidUntil: "2026-12-04" }
  ]
};

function cell(text, label) {
  var td = document.createElement("td");
  td.textContent = text;
  td.dataset.label = label;
  return td;
}

document.querySelectorAll("tbody[data-class]").forEach(function (tbody) {
  (CLASSES[tbody.dataset.class] || []).forEach(function (s, i) {
    var tr = document.createElement("tr");
    tr.appendChild(cell(i + 1, "#"));
    tr.appendChild(cell(s.name, "Student"));
    tr.appendChild(cell(s.pht, "Philippines Time"));
    tr.appendChild(cell(s.kst, "Korea Time"));
    tr.appendChild(cell(s.days, "Days"));
    tr.appendChild(cell(s.paidUntil.replace(/-/g, "/"), "Paid Until"));
    tbody.appendChild(tr);
  });
});
