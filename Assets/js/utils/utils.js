// ═══════════════════════════════════════════════════════
// UTILS JS - aide réutilisable pour DOM, events, sound, responsive
// ═══════════════════════════════════════════════════════

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const on = (target, event, handler, opts) => {
  if (target && target.addEventListener) {
    target.addEventListener(event, handler, opts);
  }
};

const off = (target, event, handler, opts) => {
  if (target && target.removeEventListener) {
    target.removeEventListener(event, handler, opts);
  }
};

const isMobile = () => /Mobi|Android|iP(hone|od|ad)|IEMobile/i.test(navigator.userAgent);

const vibrate = (pattern = 30) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext || null)();

const tone = (freq = 440, duration = 0.08, volume = 0.12, type = 'sine') => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

const sfx = {
  positive: () => tone(520, 0.1, 0.15, 'triangle'),
  negative: () => tone(220, 0.15, 0.18, 'square'),
  win: () => {
    tone(660, 0.08, 0.12, 'sine');
    setTimeout(() => tone(780, 0.08, 0.12, 'sine'), 90);
    setTimeout(() => tone(880, 0.08, 0.14, 'sine'), 180);
  }
};

const once = (callback) => {
  let done = false;
  return (...args) => {
    if (done) return;
    done = true;
    return callback(...args);
  };
};

const dropConfetti = (count = 24) => {
  const colors = ['#f5d061', '#a86cff', '#76f7f5', '#ff6f8f', '#9fdc6a'];
  const zone = document.body;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-drop';
    c.style.left = `${Math.random() * 96 + 2}%`;
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = `${Math.random() * 0.6}s`;
    c.style.opacity = '0';
    zone.appendChild(c);
    setTimeout(() => c.remove(), 2400);
  }
};

window.Astoria = {
  $, $$, on, off, isMobile, vibrate, sfx, once, dropConfetti
};
