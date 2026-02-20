const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const restartBtn = document.getElementById("restartBtn");
const hudStatus = document.getElementById("hudStatus");

const emailForm = document.getElementById("emailForm");
const formStatus = document.getElementById("formStatus");

// Mobile D-pad buttons (exist on page, may be hidden by CSS on desktop)
const dpadUp = document.querySelector(".dpad-btn.up");
const dpadDown = document.querySelector(".dpad-btn.down");
const dpadLeft = document.querySelector(".dpad-btn.left");
const dpadRight = document.querySelector(".dpad-btn.right");

// --- Load horse image ---
const horseImg = new Image();
horseImg.src = "assets/horse.png";
let horseReady = false;
horseImg.onload = () => { horseReady = true; };

const COLORS = {
  bg: "#05060a",
  floor: "#070910",
  wallCore: "#0b2a24",
  mint: "rgba(184,255,231,1)",
  mintGlow: "rgba(184,255,231,0.55)",
  pink: "rgba(255,79,179,1)",
  pinkGlow: "rgba(255,79,179,0.55)",
  text: "rgba(238,243,255,0.85)",
};

// 0 floor, 1 wall, 2 exit
const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,2,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1],
  [1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,1,1,1,1,0,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,1,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,0,1,1,0,1,1,1,1,0,1],
  [1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const rows = map.length;
const cols = map[0].length;

let paused = false;
let hasWon = false;

const playerStart = { r: 1, c: 1 };
const player = { r: playerStart.r, c: playerStart.c };

function tileAt(r, c) {
  if (r < 0 || r >= rows || c < 0 || c >= cols) return 1;
  return map[r][c];
}

function setHud() {
  hudStatus.textContent = hasWon ? "WON" : (paused ? "PAUSED" : "RUNNING");
}

function resetGame() {
  player.r = playerStart.r;
  player.c = playerStart.c;
  hasWon = false;
  paused = false;
  setHud();
}

function openWinOverlay() {
  hasWon = true;
  paused = true;
  setHud();

  overlay.hidden = false;
  formStatus.textContent = "";

  const inp = document.getElementById("emailInput");
  if (inp) inp.focus();
}

// Always closes overlay + returns to playable state
function closeOverlayAndReset() {
  overlay.hidden = true;
  resetGame();
}

// Robust movement gate: no movement while overlay is open
function canPlay() {
  return !paused && !hasWon && overlay.hidden;
}

function tryMove(dr, dc) {
  if (!canPlay()) return;

  const nr = player.r + dr;
  const nc = player.c + dc;

  const t = tileAt(nr, nc);
  if (t === 1) return; // wall

  player.r = nr;
  player.c = nc;

  if (t === 2) openWinOverlay();
}

function computeGrid() {
  const tileSize = Math.floor(Math.min(canvas.width / cols, canvas.height / rows));
  const offsetX = Math.floor((canvas.width - cols * tileSize) / 2);
  const offsetY = Math.floor((canvas.height - rows * tileSize) / 2);
  return { tileSize, offsetX, offsetY };
}

function drawWalls(x, y, size) {
  ctx.save();
  ctx.shadowColor = COLORS.mintGlow;
  ctx.shadowBlur = 16;
  ctx.fillStyle = COLORS.wallCore;
  ctx.fillRect(x, y, size, size);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(184,255,231,0.65)";
  ctx.lineWidth = Math.max(2, Math.floor(size * 0.07));
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  ctx.restore();
}

function drawExit(x, y, size) {
  ctx.save();
  ctx.shadowColor = COLORS.pinkGlow;
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(255,79,179,0.18)";
  ctx.fillRect(x, y, size, size);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,79,179,0.75)";
  ctx.lineWidth = Math.max(2, Math.floor(size * 0.08));
  ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(238,243,255,0.85)";
  ctx.font = `${Math.max(12, Math.floor(size * 0.28))}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXIT", x + size / 2, y + size / 2);
  ctx.restore();
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.22;

  ctx.beginPath();
  ctx.fillStyle = "rgba(255,79,179,0.18)";
  ctx.arc(canvas.width * 0.22, canvas.height * 0.22, canvas.width * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(184,255,231,0.16)";
  ctx.beginPath();
  ctx.arc(canvas.width * 0.78, canvas.height * 0.35, canvas.width * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMap() {
  const { tileSize, offsetX, offsetY } = computeGrid();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * tileSize;
      const y = offsetY + r * tileSize;
      const t = map[r][c];

      ctx.fillStyle = COLORS.floor;
      ctx.fillRect(x, y, tileSize, tileSize);

      if (t === 1) drawWalls(x, y, tileSize);
      if (t === 2) drawExit(x, y, tileSize);
    }
  }
}

function drawPlayer() {
  const { tileSize, offsetX, offsetY } = computeGrid();

  const px = offsetX + player.c * tileSize + tileSize / 2;
  const py = offsetY + player.r * tileSize + tileSize / 2;

  if (horseReady) {
    const sw = horseImg.width;
    const sh = horseImg.height;

    const cropX = Math.floor(sw * 0.32);
    const cropY = Math.floor(sh * 0.34);
    const cropW = Math.floor(sw * 0.62);
    const cropH = Math.floor(sh * 0.46);

    const w = tileSize * 1.25;
    const h = tileSize * 1.05;

    ctx.save();
    ctx.shadowColor = COLORS.mintGlow;
    ctx.shadowBlur = 14;
    ctx.drawImage(horseImg, cropX, cropY, cropW, cropH, px - w/2, py - h/2, w, h);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(px, py, tileSize * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.mint;
    ctx.fill();
  }
}

function loop() {
  drawBackground();
  drawMap();
  drawPlayer();
  requestAnimationFrame(loop);
}

// --- Keyboard Controls ---
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();

  // ESC always closes overlay if open
  if (e.key === "Escape" && !overlay.hidden) {
    closeOverlayAndReset();
    return;
  }

  if (k === "arrowup" || k === "w") tryMove(-1, 0);
  if (k === "arrowdown" || k === "s") tryMove(1, 0);
  if (k === "arrowleft" || k === "a") tryMove(0, -1);
  if (k === "arrowright" || k === "d") tryMove(0, 1);
});

// --- Buttons ---
restartBtn.addEventListener("click", () => {
  closeOverlayAndReset(); // also closes overlay if it’s open
});

closeBtn.addEventListener("click", closeOverlayAndReset);
playAgainBtn.addEventListener("click", closeOverlayAndReset);

// --- Mobile D-pad (tap/press) ---
function bindDpad(btn, dr, dc) {
  if (!btn) return;

  const press = (e) => {
    e.preventDefault();
    tryMove(dr, dc);
  };

  btn.addEventListener("click", press);
  btn.addEventListener("touchstart", press, { passive: false });
}

bindDpad(dpadUp, -1, 0);
bindDpad(dpadDown, 1, 0);
bindDpad(dpadLeft, 0, -1);
bindDpad(dpadRight, 0, 1);

// --- Netlify form submit (stay on page, show status) ---
emailForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formStatus.textContent = "Submitting...";

  try {
    const formData = new FormData(emailForm);
    const res = await fetch("/", {
      method: "POST",
      body: new URLSearchParams(formData).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (res.ok) {
  formStatus.textContent = "Unlocked. You’re on the list.";

  // close the overlay + restart the game after a short beat
  setTimeout(() => {
    closeOverlayAndReset();   // <-- this is the key
    emailForm.reset();
  }, 600);

} else {
  formStatus.textContent = "Form submit failed — try again.";
}

// Ensure correct initial state
overlay.hidden = true;
setHud();
loop();


