// ═══════════════════════════════════════════════════════
// ASTORIA HUB - Navigation & Logique Principale
// NOTE : se base sur Astoria utils pour éviter répétition
// ═══════════════════════════════════════════════════════

let currentPage = 'home';
let gameReturnPage = 'list-rep';

/**
 * Initialise les particules d'ambiance
 */
function initParticles() {
  const pContainer = Astoria.$('#particles');
  if (!pContainer) return;

  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random() * 100}%;bottom:${Math.random() * 40}%;`
      + `--dur:${6 + Math.random() * 8}s;--delay:${Math.random() * 8}s;`
      + `--drift:${(Math.random() - 0.5) * 60}px;`
      + `width:${1 + Math.random() * 2}px;height:${1 + Math.random() * 2}px;`;
    pContainer.appendChild(p);
  }
}

/**
 * Navigation entre pages
 */
function goTo(pageId) {
  Astoria.$$('.card-wrap.flipped').forEach(c => c.classList.remove('flipped'));
  Astoria.$$('.page').forEach(p => p.classList.remove('active'));

  const target = Astoria.$('#page-' + pageId);
  if (!target) return;

  target.classList.add('active');
  target.classList.remove('page-transition');
  void target.offsetWidth;
  target.classList.add('page-transition');

  currentPage = pageId;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (Astoria.isMobile()) {
    document.body.classList.add('mobile-active');
  } else {
    document.body.classList.remove('mobile-active');
  }
}

/**
 * Flip/Unflip les cartes d'accueil
 */
function handleFlip(card) {
  if (card.classList.contains('flipped')) return;
  card.classList.add('flipped');
  Astoria.sfx.positive();
}

function unflip(cardId) {
  const card = Astoria.$('#' + cardId);
  if (card) {
    card.classList.remove('flipped');
    Astoria.sfx.positive();
  }
}

/**
 * Catalogue des minijeux embarqués
 */
const GAMES = {
  bibliotheque: {
    title: 'La Bibliothèque Rebelle',
    returnPage: 'list-rep',
    url: 'minijeux/bibliotheque.html'
  }
};

/**
 * Lance un minijeu
 */
function launchGame(gameId, title) {
  const game = GAMES[gameId];
  if (!game) {
    console.error(`Jeu "${gameId}" non trouvé`);
    Astoria.sfx.negative();
    return;
  }

  gameReturnPage = game.returnPage;
  Astoria.$('#game-title').textContent = game.title;

  Astoria.$('#game-back-btn').onclick = () => {
    Astoria.$('#game-frame').src = 'about:blank';
    goTo(gameReturnPage);
  };

  Astoria.$('#game-frame').src = game.url;
  goTo('game');
  Astoria.sfx.positive();
}

/**
 * Initialisation au chargement
 */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  if (Astoria.isMobile()) {
    document.body.classList.add('mobile-mode');
  }
});
