// script.js — Fortune Animals demo
const animals = [
  { id: "tiger", label: "Tigre 🐯", emoji: "🐯", weight: 8, multiplier: 5 },
  { id: "bull", label: "Touro 🐂", emoji: "🐂", weight: 25, multiplier: 2 },
  { id: "rabbit", label: "Coelho 🐇", emoji: "🐇", weight: 40, multiplier: 1.5 },
  { id: "rat", label: "Rato 🐀", emoji: "🐀", weight: 27, multiplier: 1.8 }
];

// state
let balance = Number(localStorage.getItem("fa_balance") || 1000);
let selectedAnimal = animals[0].id;
const wheel = document.getElementById("wheel");
const balanceEl = document.getElementById("balance");
const betInput = document.getElementById("bet-input");
const animalsSelect = document.getElementById("animals-select");
const logList = document.getElementById("log-list");
const spinBtn = document.getElementById("spin-btn");
const resetBtn = document.getElementById("reset-btn");
const betDecrease = document.getElementById("bet-decrease");
const betIncrease = document.getElementById("bet-increase");

// helper
function save() {
  localStorage.setItem("fa_balance", balance);
}
function addLog(text) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} — ${text}`;
  logList.prepend(li);
  if (logList.children.length > 200) logList.removeChild(logList.lastChild);
}

// build UI animals selection
function buildAnimalsUI() {
  animalsSelect.innerHTML = "";
  animals.forEach(a => {
    const btn = document.createElement("div");
    btn.className = "animal-btn" + (a.id === selectedAnimal ? " selected" : "");
    btn.dataset.id = a.id;
    btn.innerHTML = `<div class="animal-emoji">${a.emoji}</div>
                     <div class="animal-meta"><div>${a.label}</div><div>x${a.multiplier}</div></div>`;
    btn.addEventListener("click", () => {
      selectedAnimal = a.id;
      document.querySelectorAll(".animal-btn").forEach(n => n.classList.remove("selected"));
      btn.classList.add("selected");
    });
    animalsSelect.appendChild(btn);
  });
}

// build wheel sectors visually (for effect)
function buildWheel() {
  wheel.innerHTML = `<div class="pointer"></div><div class="center"><strong>GIRAR</strong></div>`;
  const total = animals.reduce((s, a) => s + a.weight, 0);
  let start = 0;
  animals.forEach((a, idx) => {
    const angle = (a.weight / total) * 360;
    const sector = document.createElement("div");
    sector.className = "sector";
    sector.style.transform = `rotate(${start}deg)`;
    sector.innerHTML = `<div class="label" style="transform:translateY(-120px) rotate(${start + angle/2}deg)">${a.emoji} ${a.label}</div>`;
    wheel.appendChild(sector);
    start += angle;
  });
}

// pick random by weight
function pickByWeight() {
  const total = animals.reduce((s,a)=> s + a.weight, 0);
  let r = Math.random() * total;
  for (let a of animals) {
    if (r < a.weight) return a;
    r -= a.weight;
  }
  return animals[animals.length-1];
}

// spin behaviour
let spinning = false;
async function spin() {
  if (spinning) return;
  const bet = Math.max(1, Math.floor(Number(betInput.value) || 0));
  if (bet <= 0) { alert("Aposta inválida"); return; }
  if (bet > balance) { alert("Saldo insuficiente"); return; }
  spinning = true;
  spinBtn.disabled = true;

  balance -= bet;
  updateBalanceDisplay();
  addLog(`Apostou ${bet} pts no ${selectedAnimal}`);

  // animate: rotate wheel for a while and land on winner
  const winner = pickByWeight();
  const baseRotations = 6; // full spins
  // compute angle to land winner — find sector middle angle
  const total = animals.reduce((s,a)=> s + a.weight, 0);
  let start = 0;
  let targetMid = 0;
  for (let a of animals) {
    const angle = (a.weight / total) * 360;
    if (a.id === winner.id) {
      targetMid = start + angle/2;
      break;
    }
    start += angle;
  }
  // we want pointer at top (0deg) — wheel rotates, so compute rotation
  // add small random offset within sector
  const sectorOffset = (Math.random() - 0.5) * ( ( (winner.weight/total) * 360 ) * 0.6 );
  const finalAngle = 360 * baseRotations + (360 - targetMid) + sectorOffset;

  // animate using CSS transition
  wheel.style.transition = "transform 4s cubic-bezier(.15,.8,.25,1)";
  wheel.style.transform = `rotate(${finalAngle}deg)`;

  // wait for animation end
  await new Promise(res => setTimeout(res, 4200));

  // reset transform to small angle to avoid large accumulative rotations
  wheel.style.transition = "none";
  const normalized = finalAngle % 360;
  wheel.style.transform = `rotate(${normalized}deg)`;

  // resolve result
  let won = false;
  let payout = 0;
  if (selectedAnimal === winner.id) {
    won = true;
    const prize = Math.floor(bet * winner.multiplier);
    payout = prize;
    balance += prize;
    addLog(`GANHOU! ${prize} pts com ${winner.label}`);
  } else {
    addLog(`Perdeu. Saiu ${winner.label}`);
  }
  updateBalanceDisplay();
  save();

  // flash result
  alert(won ? `Parabéns! Saiu ${winner.label}. Você ganhou ${payout} pts.` : `Saiu ${winner.label}. Você perdeu ${bet} pts.`);

  spinning = false;
  spinBtn.disabled = false;
}

// UI helpers
function updateBalanceDisplay() {
  balanceEl.textContent = balance.toString();
}

function wireEvents() {
  spinBtn.addEventListener("click", spin);
  resetBtn.addEventListener("click", () => {
    if (!confirm("Resetar saldo para 1000 pts?")) return;
    balance = 1000;
    save(); updateBalanceDisplay(); addLog("Saldo resetado");
  });
  betDecrease.addEventListener("click", ()=> {
    betInput.value = Math.max(1, Number(betInput.value || 1) - 10);
  });
  betIncrease.addEventListener("click", ()=> {
    betInput.value = Math.max(1, Number(betInput.value || 1) + 10);
  });
}

// init
buildAnimalsUI();
buildWheel();
wireEvents();
updateBalanceDisplay();
addLog("Jogo inicializado — saldo carregado");
