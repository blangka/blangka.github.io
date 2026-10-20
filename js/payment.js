// Payment info shown after the password is entered. Edit the values here.
var PASSWORD = "1828";
var PAYMENT = [
  { label: "Deposit", amount: 7500 },
  { label: "Additional payment", amount: 0 }
];

var lock = document.getElementById("lock");
var content = document.getElementById("content");
var list = document.getElementById("payment-list");
var error = document.getElementById("error");

function show() {
  PAYMENT.forEach(function (p) {
    var dt = document.createElement("dt");
    dt.textContent = p.label;
    var dd = document.createElement("dd");
    dd.textContent = p.amount.toLocaleString("en-US") + " peso";
    list.appendChild(dt);
    list.appendChild(dd);
  });
  lock.hidden = true;
  content.hidden = false;
}

lock.addEventListener("submit", function (e) {
  e.preventDefault();
  var input = document.getElementById("pw");
  if (input.value === PASSWORD) {
    show();
  } else {
    error.hidden = false;
    input.value = "";
    input.focus();
  }
});
