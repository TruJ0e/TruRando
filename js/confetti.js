/* TruRando celebration layer — pure local canvas confetti, dice-roll flourish,
   and playful shuffle shouts. No network, no storage, no dependencies.
   All styling hooks are CSS classes (CSP style-src 'self' safe). */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PALETTE = ['#ff3d7f', '#ff7a1a', '#ffd21f', '#7c3aed', '#0db5a6', '#2f6bff', '#a3e635'];

const SHOUTS = [
  'The dice have spoken.',
  'No favorites were harmed.',
  'Chaos, but make it fair.',
  'Shuffled like a Vegas dealer.',
  'Fate loves a fresh roster.',
  'Randomness you can trust.',
  'May the odds be ever even.',
  'Fresh mix, zero bias.',
  'Destiny, dealt face-up.',
  'Luck favors the well-mixed.'
];

const canvas = document.querySelector('#confettiCanvas');
const results = document.querySelector('#results');
const shout = document.querySelector('#shuffleShout');
const randomizeButton = document.querySelector('#randomizeButton');

if (!reduceMotion && canvas && results) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  let rafId = 0;

  const sizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  const burst = (x, y, count) => {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 5 + Math.random() * 7,
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.3,
        circle: Math.random() < 0.35,
        life: 70 + Math.random() * 50
      });
    }
    if (!rafId) tick();
  };

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter((p) => p.life > 0 && p.y < canvas.height + 30);
    for (const p of particles) {
      p.vy += 0.22;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life -= 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life / 40);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.circle) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
    if (particles.length) {
      rafId = window.requestAnimationFrame(tick);
    } else {
      rafId = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const celebrate = () => {
    const w = window.innerWidth;
    burst(w / 2, window.innerHeight * 0.18, 90);
    burst(w * 0.2, window.innerHeight * 0.3, 35);
    burst(w * 0.8, window.innerHeight * 0.3, 35);
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        celebrate();
        break;
      }
    }
  });
  observer.observe(results, { childList: true });
}

const sayShout = () => {
  if (!shout) return;
  shout.textContent = SHOUTS[(Math.random() * SHOUTS.length) | 0];
  shout.classList.remove('bounce');
  void shout.offsetWidth;
  shout.classList.add('bounce');
};

const rollDice = () => {
  if (!randomizeButton || reduceMotion) return;
  randomizeButton.classList.remove('rolling');
  void randomizeButton.offsetWidth;
  randomizeButton.classList.add('rolling');
  window.setTimeout(() => randomizeButton.classList.remove('rolling'), 700);
};

for (const id of ['#randomizeButton', '#rerollAllButton', '#rerollMembersButton', '#rerollTopicsButton']) {
  const button = document.querySelector(id);
  if (button) {
    button.addEventListener('click', () => {
      rollDice();
      sayShout();
    });
  }
}
