/**
 * MINIJEU : LA BIBLIOTHÈQUE REBELLE
 * Logique du jeu
 */

const CELL = 18;
const N = 13;
const COLS = N * 2 + 1;
const ROWS = N * 2 + 1;
const OVERLAY_DURATION = 15000;
const PULSE_DURATION = 800;
const PULSE_MAGNITUDE = 0.08;

const BOOKS = [
  { id: 'violet', color: '#9b59b6', label: 'Violet', shadow: '#9b59b6' },
  { id: 'cyan', color: '#00bcd4', label: 'Cyan', shadow: '#00bcd4' },
  { id: 'blue', color: '#2855c8', label: 'Bleu', shadow: '#4a7aff' },
  { id: 'magenta', color: '#e91e8c', label: 'Magenta', shadow: '#e91e8c' },
  { id: 'green', color: '#27ae60', label: 'Vert', shadow: '#27ae60' },
];

let maze, player, bookOrder, bookPositions, collectedCount;
let timerInterval, startTime, elapsed = 0, tries = 0, gameRunning = false;
let overlayBarInterval;

const canvas = document.getElementById('maze-canvas');
const ctx = canvas.getContext('2d');

function sizeCanvas() {
  const maxW = Math.min(window.innerWidth - 16, 560);
  const maxH = window.innerHeight - 175;
  const sz = Math.min(maxW, maxH);
  const cell = Math.floor(sz / Math.max(COLS, ROWS));
  canvas.width = cell * COLS;
  canvas.height = cell * ROWS;
  canvas._cell = cell;
}

function generateMaze(cols, rows) {
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const lC = (cols - 1) / 2;
  const lR = (rows - 1) / 2;
  const vis = Array.from({ length: lR }, () => new Array(lC).fill(false));

  function carve(lx, ly) {
    vis[ly][lx] = true;
    const rx = lx * 2 + 1;
    const ry = ly * 2 + 1;
    grid[ry][rx] = 1;

    for (const [dx, dy] of shuffle([
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])) {
      const nlx = lx + dx;
      const nly = ly + dy;
      if (nlx >= 0 && nly >= 0 && nlx < lC && nly < lR && !vis[nly][nlx]) {
        grid[ry + dy][rx + dx] = 1;
        carve(nlx, nly);
      }
    }
  }

  carve(0, 0);

  const wH = [];
  const wV = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (grid[y][x] === 0) {
        if (y % 2 === 1 && x % 2 === 0) wH.push([x, y]);
        if (y % 2 === 0 && x % 2 === 1) wV.push([x, y]);
      }
    }
  }

  shuffle(wH);
  shuffle(wV);
  const nH = Math.floor(wH.length * 0.25);
  const nV = Math.floor(wV.length * 0.25);

  for (let i = 0; i < nH; i++) grid[wH[i][1]][wH[i][0]] = 1;
  for (let i = 0; i < nV; i++) grid[wV[i][1]][wV[i][0]] = 1;

  return grid;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function placeBooks(grid) {
  const cells = [];
  for (let y = 1; y < ROWS; y += 2) {
    for (let x = 1; x < COLS; x += 2) {
      if (grid[y][x] === 1) cells.push({ x, y });
    }
  }

  const start = { x: 1, y: 1 };
  const exit = { x: COLS - 2, y: ROWS - 2 };
  const minD = 5;
  const chosen = [];

  for (const book of BOOKS) {
    let t = 0;
    while (t++ < 500) {
      const c = cells[(Math.random() * cells.length) | 0];
      const ds = Math.abs(c.x - start.x) + Math.abs(c.y - start.y);
      const de = Math.abs(c.x - exit.x) + Math.abs(c.y - exit.y);
      if (
        ds > 4 &&
        de > 4 &&
        !chosen.some((o) => Math.abs(o.x - c.x) + Math.abs(o.y - c.y) < minD)
      ) {
        chosen.push({ ...c, ...book });
        break;
      }
    }
  }

  return chosen;
}

function initGame() {
  clearInterval(timerInterval);
  clearInterval(overlayBarInterval);
  sizeCanvas();
  maze = generateMaze(COLS, ROWS);
  player = { x: 1, y: 1 };
  bookPositions = placeBooks(maze);
  bookOrder = shuffle([...BOOKS]).map((b) => b.id);
  collectedCount = 0;
  elapsed = 0;
  gameRunning = false;
  updateHUD();
  renderOrderDisplay();
  draw();
  if (!window.bibliothequeAnimateLoop) {
    window.bibliothequeAnimateLoop = true;
    requestAnimationFrame(animate);
  }
  showBriefing();
}

function animate() {
  draw();
  requestAnimationFrame(animate);
}

function showBriefing() {
  const overlay = document.getElementById('overlay');
  const card = document.getElementById('overlay-card');
  card.classList.remove('congrats');
  overlay.classList.remove('hidden');

  const bHTML = bookOrder
    .map((id, i) => {
      const b = BOOKS.find((b) => b.id === id);
      return `${i > 0 ? '<div class="overlay-arrow">→</div>' : ''}<div class="overlay-book"><div class="overlay-book-square" style="background:${b.color};box-shadow:0 0 10px ${b.shadow};"></div><div class="overlay-book-label">${b.label}</div></div>`;
    })
    .join('');

  card.innerHTML = `<div class="overlay-title">📚 Consigne</div>
<div class="overlay-subtitle">Les livres refusent de rester en rayon.<br>Ramassez-les <strong style="color:var(--gold)">dans l'ordre exact</strong>, puis rejoignez la sortie.<br>Un mauvais choix... et tout recommence.</div>
<div class="overlay-order">${bHTML}</div>
<div class="overlay-hint">→ Puis rejoignez la sortie <span style="color:var(--gold)">✦</span></div>
<div class="overlay-timer-bar-wrap"><div class="overlay-timer-bar" id="briefing-bar"></div></div>
<div class="overlay-hint" id="briefing-countdown">Départ dans 15s — appuyez sur une touche pour commencer</div>`;

  let remaining = OVERLAY_DURATION;
  const bar = document.getElementById('briefing-bar');
  const cd = document.getElementById('briefing-countdown');

  overlayBarInterval = setInterval(() => {
    remaining -= 100;
    bar.style.width = Math.max(0, (remaining / OVERLAY_DURATION) * 100) + '%';
    const s = Math.ceil(remaining / 1000);
    cd.textContent = `Départ dans ${s}s — appuyez sur une touche pour commencer`;
    if (remaining <= 0) {
      clearInterval(overlayBarInterval);
      startRound();
    }
  }, 100);
}

function startRound() {
  clearInterval(overlayBarInterval);
  document.getElementById('overlay').classList.add('hidden');
  gameRunning = true;
  startTime = performance.now() - elapsed * 1000;
  timerInterval = setInterval(() => {
    elapsed = (performance.now() - startTime) / 1000;
    updateHUD();
  }, 100);
}

function draw() {
  const C = canvas._cell || CELL;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f5edd8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (maze[y][x] === 0) {
        ctx.fillStyle = '#1a1208';
        ctx.fillRect(x * C, y * C, C, C);
      }
    }
  }

  const ex = COLS - 2;
  const ey = ROWS - 2;
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(ex * C + C * 0.1, ey * C + C * 0.1, C * 0.8, C * 0.8);
  ctx.fillStyle = 'rgba(201,168,76,.25)';
  ctx.beginPath();
  ctx.arc((ex + 0.5) * C, (ey + 0.5) * C, C * 1.1, 0, Math.PI * 2);
  ctx.fill();

  const pulseFactor = 1 + Math.sin((performance.now() % PULSE_DURATION) / PULSE_DURATION * Math.PI * 2) * PULSE_MAGNITUDE;
  const nextId = bookOrder[collectedCount];
  for (const b of bookPositions) {
    const isNext = b.id === nextId;
    if (isNext) {
      ctx.shadowColor = b.shadow;
      ctx.shadowBlur = 10;
    }

    ctx.fillStyle = b.color;
    const baseSize = C * 0.8;
    const size = isNext ? baseSize * pulseFactor : baseSize;
    const offset = (C - size) / 2;
    ctx.fillRect(b.x * C + offset, b.y * C + offset, size, size);

    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = '#e8dcc8';
  ctx.shadowColor = 'rgba(232,220,200,.8)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc((player.x + 0.5) * C, (player.y + 0.5) * C, C * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0a0806';
  ctx.beginPath();
  ctx.arc((player.x + 0.5) * C, (player.y + 0.5) * C, C * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function tryMove(dx, dy) {
  if (!gameRunning) return;
  Astoria.vibrate(2);

  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || maze[ny][nx] === 0) return;

  player.x = nx;
  player.y = ny;

  const bIdx = bookPositions.findIndex((b) => b.x === nx && b.y === ny);
  if (bIdx !== -1) {
    const book = bookPositions[bIdx];
    if (book.id === bookOrder[collectedCount]) {
      Astoria.sfx.positive();
      bookPositions.splice(bIdx, 1);
      collectedCount++;
      updateHUD();
      renderOrderDisplay();
    } else {
      wrongOrder();
      return;
    }
  }

  if (nx === COLS - 2 && ny === ROWS - 2) {
    if (collectedCount === BOOKS.length) {
      winGame();
    } else {
      wrongOrder();
      return;
    }
  }

  draw();
}

function wrongOrder() {
  tries++;
  Astoria.sfx.negative();
  Astoria.vibrate(5);
  canvas.classList.add('flash-wrong');
  setTimeout(() => canvas.classList.remove('flash-wrong'), 250);
  clearInterval(timerInterval);
  elapsed = 0;
  gameRunning = false;
  maze = generateMaze(COLS, ROWS);
  bookPositions = placeBooks(maze);
  player = { x: 1, y: 1 };
  collectedCount = 0;
  updateHUD();
  renderOrderDisplay();
  draw();
  setTimeout(() => showBriefing(), 400);
}

function winGame() {
  clearInterval(timerInterval);
  gameRunning = false;
  tries++;
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(Math.floor(elapsed % 60)).padStart(2, '0');

  const overlay = document.getElementById('overlay');
  const card = document.getElementById('overlay-card');
  overlay.classList.remove('hidden');
  card.className = 'overlay-card congrats';

  card.innerHTML = `<div class="result-icon">🎉</div>
<div class="overlay-title">Ordre restauré</div>
<div class="overlay-subtitle">La bibliothèque s'est calmée... pour l'instant.<br>Vous avez rangé tous les ouvrages rebelles.</div>
<div style="margin:14px 0;display:flex;gap:24px;justify-content:center;">
<div><div class="hud-label" style="font-size:.58rem;">TEMPS</div><div class="hud-value">${mins}:${secs}</div></div>
<div><div class="hud-label" style="font-size:.58rem;">ESSAIS</div><div class="hud-value">${tries}</div></div>
</div>
<div class="overlay-hint">Bravo ! Appuie sur Rejouer ou récupère ton courage pour le prochain défi.</div>
<button class="btn-restart" onclick="initGame()">↺ Rejouer</button>`;

  Astoria.sfx.win();
  Astoria.dropConfetti(26);
  Astoria.vibrate([30, 20, 30]);

  setTimeout(() => {
    card.classList.remove('congrats');
  }, 1800);
}

function updateHUD() {
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(Math.floor(elapsed % 60)).padStart(2, '0');
  document.getElementById('timer-display').textContent = m + ':' + s;
  document.getElementById('books-display').textContent = collectedCount + ' / ' + BOOKS.length;
  document.getElementById('tries-display').textContent = tries;
}

function renderOrderDisplay() {
  const el = document.getElementById('order-display');
  el.innerHTML = bookOrder
    .map((id, i) => {
      const b = BOOKS.find((b) => b.id === id);
      const col = i < collectedCount;
      const nxt = i === collectedCount;
      return `${i > 0 ? '<span class="order-arrow">›</span>' : ''}<div class="order-book ${col ? 'collected' : ''} ${nxt ? 'next' : ''}" style="background:${b.color};box-shadow:${nxt ? '0 0 8px ' + b.shadow : 'none'}">${i + 1}</div>`;
    })
    .join('');
}

document.addEventListener('keydown', (e) => {
  if (!gameRunning) {
    const ov = document.getElementById('overlay');
    if (!ov.classList.contains('hidden') && document.getElementById('briefing-bar')) {
      startRound();
      return;
    }
  }
  switch (e.key) {
    case 'ArrowUp':
    case 'z':
    case 'Z':
      e.preventDefault();
      tryMove(0, -1);
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      e.preventDefault();
      tryMove(0, 1);
      break;
    case 'ArrowLeft':
    case 'q':
    case 'Q':
      e.preventDefault();
      tryMove(-1, 0);
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      e.preventDefault();
      tryMove(1, 0);
      break;
  }
});

document.getElementById('btn-up').addEventListener('click', () => tryMove(0, -1));
document.getElementById('btn-down').addEventListener('click', () => tryMove(0, 1));
document.getElementById('btn-left').addEventListener('click', () => tryMove(-1, 0));
document.getElementById('btn-right').addEventListener('click', () => tryMove(1, 0));

canvas.addEventListener('click', (e) => {
  if (!gameRunning) return;
  const r = canvas.getBoundingClientRect();
  const C = canvas._cell;
  const cx = Math.floor((e.clientX - r.left) / C);
  const cy = Math.floor((e.clientY - r.top) / C);
  const dx = cx - player.x;
  const dy = cy - player.y;
  if (Math.abs(dx) >= Math.abs(dy)) tryMove(Math.sign(dx), 0);
  else tryMove(0, Math.sign(dy));
});

window.addEventListener('resize', () => {
  sizeCanvas();
  draw();
});

initGame();
