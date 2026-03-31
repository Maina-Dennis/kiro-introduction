// game.js — Flappy Kiro main game file

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Game Object ---

const game = {
  state: STATE.MENU,
  score: 0,
  highScore: 0,   // loaded from localStorage on init
  kiro: null,     // Kiro object, initialized later
  pipes: [],      // active Pipe objects
  clouds: [],     // array of layers, each layer is an array of Cloud
  frame: 0,       // frame counter for pipe spawning
};

// --- Kiro ---

function initKiro() {
  const img = new Image();
  const kiro = {
    x: Math.floor(canvas.width / 4),
    y: Math.floor(canvas.height / 2),
    vy: 0,
    width: 40,
    height: 40,
    image: img,
  };

  img.onload = function () {
    kiro.image = img;
  };
  img.onerror = function () {
    kiro.image = null; // fall back to white rectangle (rendered in task 9)
  };
  img.src = 'assets/ghosty.png';

  game.kiro = kiro;
}

function updateKiro(kiro) {
  kiro.vy += CONFIG.GRAVITY;
  kiro.y  += kiro.vy;
}

function applyJump(kiro) {
  kiro.vy = CONFIG.JUMP_VELOCITY;
}

// --- Pipes ---

/**
 * spawnPipe(canvasWidth, canvasHeight) → Pipe
 * Pure factory: returns a new Pipe with a randomized gap position.
 * gapTop is clamped to [GAP_MIN_Y, canvasHeight - FOOTER_HEIGHT - GAP_MIN_Y - GAP_HEIGHT].
 */
function spawnPipe(canvasWidth, canvasHeight) {
  const maxGapTop = canvasHeight - CONFIG.FOOTER_HEIGHT - CONFIG.GAP_HEIGHT - CONFIG.GAP_MIN_Y;
  const range     = maxGapTop - CONFIG.GAP_MIN_Y;
  const gapTop    = CONFIG.GAP_MIN_Y + Math.floor(Math.random() * (range + 1));
  return {
    x: canvasWidth,
    gapTop,
    gapBottom: gapTop + CONFIG.GAP_HEIGHT,
    width: CONFIG.PIPE_WIDTH,
    scored: false,
  };
}

/**
 * updatePipes(pipes, canvasWidth, canvasHeight, frame) → Pipe[]
 * Pure update: scrolls pipes left, removes off-screen pipes, spawns a new
 * pipe every PIPE_INTERVAL frames.
 */
function updatePipes(pipes, canvasWidth, canvasHeight, frame) {
  // Scroll all pipes left
  const moved = pipes.map(p => ({ ...p, x: p.x - CONFIG.PIPE_SPEED }));

  // Remove pipes that have scrolled completely off the left edge
  const active = moved.filter(p => p.x + p.width >= 0);

  // Spawn a new pipe every PIPE_INTERVAL frames
  if (frame % CONFIG.PIPE_INTERVAL === 0) {
    active.push(spawnPipe(canvasWidth, canvasHeight));
  }

  return active;
}

// --- Collision Detection ---

/**
 * overlaps(rectA, rectB) → boolean
 * Returns true if two axis-aligned bounding boxes intersect.
 * Each rect must have { x, y, width, height }.
 */
function overlaps(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width  &&
    rectA.x + rectA.width  > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

/**
 * checkCollision(kiro, pipes, canvasHeight) → boolean
 * Returns true if Kiro is out of bounds or overlaps any pipe body.
 */
function checkCollision(kiro, pipes, canvasHeight) {
  // Out-of-bounds: above top edge
  if (kiro.y < 0) return true;
  // Out-of-bounds: below footer
  if (kiro.y + kiro.height > canvasHeight - CONFIG.FOOTER_HEIGHT) return true;

  for (const pipe of pipes) {
    // Top pipe body: from y=0 down to gapTop
    const topBody = { x: pipe.x, y: 0, width: pipe.width, height: pipe.gapTop };
    // Bottom pipe body: from gapBottom down to canvasHeight
    const botBody = { x: pipe.x, y: pipe.gapBottom, width: pipe.width, height: canvasHeight - pipe.gapBottom };

    if (overlaps(kiro, topBody) || overlaps(kiro, botBody)) return true;
  }

  return false;
}

// --- ScoreStore ---

const ScoreStore = {
  load() {
    try {
      const val = localStorage.getItem('flappyKiroHighScore');
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 0 : parsed;
    } catch (e) {
      return 0;
    }
  },
  save(score) {
    try {
      localStorage.setItem('flappyKiroHighScore', String(score));
    } catch (e) {
      // silently ignore (e.g. private browsing, storage full)
    }
  },
};

// --- Scoring ---

/**
 * updateScore(pipes, kiro, game)
 * For each unscored pipe that Kiro has passed, increment score and mark pipe.
 */
function updateScore(pipes, kiro, game) {
  for (const pipe of pipes) {
    if (!pipe.scored && kiro.x > pipe.x + CONFIG.PIPE_WIDTH) {
      game.score++;
      pipe.scored = true;
      AudioManager.play('score');
    }
  }
}

// --- Clouds ---

/**
 * initClouds(canvasWidth, canvasHeight) → Cloud[][]
 * Creates cloud objects for each layer defined in CONFIG.CLOUD_LAYERS.
 * Returns a flat array of Cloud objects (each carries its own speed/alpha).
 */
function initClouds(canvasWidth, canvasHeight) {
  const clouds = [];
  for (const layer of CONFIG.CLOUD_LAYERS) {
    for (let i = 0; i < layer.count; i++) {
      const width  = 60 + Math.floor(Math.random() * 80);   // 60–139 px
      const height = 20 + Math.floor(Math.random() * 30);   // 20–49 px
      clouds.push({
        x:      Math.floor(Math.random() * canvasWidth),
        y:      Math.floor(Math.random() * (canvasHeight * 0.6)),
        width,
        height,
        speed:  layer.speed,
        alpha:  layer.alpha,
      });
    }
  }
  return clouds;
}

/**
 * updateClouds(clouds, canvasWidth)
 * Scrolls each cloud left by its speed; wraps to the right edge when off-screen.
 */
function updateClouds(clouds, canvasWidth) {
  for (const cloud of clouds) {
    cloud.x -= cloud.speed;
    if (cloud.x + cloud.width < 0) {
      cloud.x = canvasWidth;
    }
  }
}

// --- AudioManager ---

const AudioManager = (function () {
  function makeAudio(src) {
    const el = new Audio();
    el.src = src;
    return el;
  }

  const sounds = {
    jump:     makeAudio('assets/jump.wav'),
    score:    makeAudio('assets/jump.wav'),
    gameOver: null,                           // no game over sound — message shown on screen instead
    music:    makeAudio('https://opengameart.org/sites/default/files/Fluffing%20a%20Duck.mp3'),
  };

  return {
    play(name) {
      const el = sounds[name];
      if (!el) return;
      try {
        const p = el.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {
        // silently discard
      }
    },
    playLoop(name) {
      const el = sounds[name];
      if (!el) return;
      el.loop = true;
      this.play(name);
    },
    stopLoop() {
      const el = sounds.music;
      if (!el) return;
      try {
        el.pause();
        el.currentTime = 0;
      } catch (e) {
        // silently discard
      }
    },
  };
})();

// --- State Machine ---

/**
 * resetGame() — reinitialise all mutable game state for a fresh run.
 */
function resetGame() {
  game.score  = 0;
  game.pipes  = [];
  game.frame  = 0;
  initKiro();
  game.clouds = initClouds(canvas.width, canvas.height);
}

/**
 * handleJump(game)
 * MENU / GAME_OVER → PLAYING (with full reset on GAME_OVER)
 * PLAYING          → apply jump impulse to Kiro
 */
function handleJump(game) {
  if (game.state === STATE.MENU) {
    game.state = STATE.PLAYING;
    AudioManager.playLoop('music');
  } else if (game.state === STATE.GAME_OVER) {
    resetGame();
    game.state = STATE.PLAYING;
    AudioManager.playLoop('music');
  } else if (game.state === STATE.PLAYING) {
    applyJump(game.kiro);
    AudioManager.play('jump');
  }
  // PAUSED: ignore jump input
}

/**
 * handlePause(game)
 * Toggles between PLAYING and PAUSED.
 */
function handlePause(game) {
  if (game.state === STATE.PLAYING) {
    game.state = STATE.PAUSED;
    AudioManager.stopLoop();
  } else if (game.state === STATE.PAUSED) {
    game.state = STATE.PLAYING;
    AudioManager.playLoop('music');
  }
}

/**
 * handleCollision(game)
 * Transitions to GAME_OVER, persists high score if beaten.
 */
function handleCollision(game) {
  if (game.score > game.highScore) {
    game.highScore = game.score;
    ScoreStore.save(game.highScore);
  }
  game.state = STATE.GAME_OVER;
  AudioManager.stopLoop();
  AudioManager.play('gameOver');
}

// --- Input Handlers ---

canvas.addEventListener('keydown', function (e) {
  if (e.code === 'Space') {
    e.preventDefault();
    handleJump(game);
  } else if (e.code === 'Escape') {
    handlePause(game);
  }
});

canvas.addEventListener('click', function () {
  handleJump(game);
});

canvas.addEventListener('touchstart', function (e) {
  e.preventDefault();
  handleJump(game);
}, { passive: false });

// Make canvas focusable so keydown events fire on it
canvas.setAttribute('tabindex', '0');
canvas.focus();

// --- Render Functions ---

/**
 * renderBackground(ctx, canvas)
 * Fills the canvas with a light blue sky and draws a few sketchy ground-line details.
 */
function renderBackground(ctx, canvas) {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sketchy horizon lines for a retro feel
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  const horizons = [canvas.height * 0.55, canvas.height * 0.65];
  for (const y of horizons) {
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 18) {
      ctx.moveTo(x, y + (Math.sin(x * 0.05) * 3));
      ctx.lineTo(x + 10, y + (Math.sin((x + 10) * 0.05) * 3));
    }
    ctx.stroke();
  }
}

/**
 * renderClouds(ctx, clouds)
 * Draws each cloud as a semi-transparent rounded rectangle.
 */
function renderClouds(ctx, clouds) {
  const prevAlpha = ctx.globalAlpha;
  for (const cloud of clouds) {
    ctx.globalAlpha = cloud.alpha;
    ctx.fillStyle = '#ffffff';
    const r = Math.min(cloud.height / 2, 20);
    ctx.beginPath();
    ctx.roundRect(cloud.x, cloud.y, cloud.width, cloud.height, r);
    ctx.fill();
  }
  ctx.globalAlpha = prevAlpha;
}

/**
 * renderPipes(ctx, pipes, canvasHeight)
 * Draws each pipe pair: top body + cap, bottom body + cap.
 */
function renderPipes(ctx, pipes, canvasHeight) {
  const capH = 14;
  const capExtra = 6; // cap is slightly wider than the pipe body

  ctx.save();
  for (const pipe of pipes) {
    const pw = pipe.width;
    const px = pipe.x;

    // --- Top pipe ---
    // Body
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(px, 0, pw, pipe.gapTop - capH);
    // Cap (slightly wider, sits at the bottom of the top pipe)
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(px - capExtra / 2, pipe.gapTop - capH, pw + capExtra, capH);

    // --- Bottom pipe ---
    // Cap (sits at the top of the bottom pipe)
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(px - capExtra / 2, pipe.gapBottom, pw + capExtra, capH);
    // Body
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(px, pipe.gapBottom + capH, pw, canvasHeight - pipe.gapBottom - capH);
  }
  ctx.restore();
}

/**
 * renderKiro(ctx, kiro)
 * Draws the ghost sprite; falls back to a white rectangle if image is unavailable.
 */
function renderKiro(ctx, kiro) {
  if (kiro.image && kiro.image.complete && kiro.image.naturalWidth > 0) {
    ctx.drawImage(kiro.image, kiro.x, kiro.y, kiro.width, kiro.height);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(kiro.x, kiro.y, kiro.width, kiro.height);
  }
}

/**
 * renderHUD(ctx, canvas, score, highScore)
 * Draws the dark footer bar and score text.
 */
function renderHUD(ctx, canvas, score, highScore) {
  const fh = CONFIG.FOOTER_HEIGHT;
  const fy = canvas.height - fh;

  // Dark footer bar
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, fy, canvas.width, fh);

  // Score text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Score: ${score} | High: ${highScore}`, canvas.width / 2, fy + fh / 2);
}

/**
 * renderMenu(ctx, canvas, highScore)
 * Draws the main menu overlay.
 */
function renderMenu(ctx, canvas, highScore) {
  ctx.save();

  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, canvas.width, canvas.height - CONFIG.FOOTER_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = canvas.width / 2;
  const cy = (canvas.height - CONFIG.FOOTER_HEIGHT) / 2;

  // Title
  ctx.font = 'bold 52px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Flappy Kiro', cx, cy - 60);

  // High score
  ctx.font = '22px monospace';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`Best: ${highScore}`, cx, cy);

  // Start prompt
  ctx.font = '20px monospace';
  ctx.fillStyle = '#cccccc';
  ctx.fillText('Press Space / Click / Tap to Start', cx, cy + 50);

  ctx.restore();
}

/**
 * renderPaused(ctx, canvas)
 * Draws a semi-transparent pause overlay.
 */
function renderPaused(ctx, canvas) {
  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height - CONFIG.FOOTER_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = canvas.width / 2;
  const cy = (canvas.height - CONFIG.FOOTER_HEIGHT) / 2;

  ctx.font = 'bold 48px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PAUSED', cx, cy);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText('Press Escape to Resume', cx, cy + 55);

  ctx.restore();
}

/**
 * renderGameOver(ctx, canvas, score, highScore)
 * Draws the game over overlay with final score and restart prompt.
 */
function renderGameOver(ctx, canvas, score, highScore) {
  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height - CONFIG.FOOTER_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = canvas.width / 2;
  const cy = (canvas.height - CONFIG.FOOTER_HEIGHT) / 2;

  // Bold flashing-style banner
  ctx.font = 'bold 56px monospace';
  ctx.fillStyle = '#ff4444';
  ctx.fillText('💀 GAME OVER 💀', cx, cy - 70);

  ctx.font = '22px monospace';
  ctx.fillStyle = '#ffcccc';
  ctx.fillText('Ghosty has been squished!', cx, cy - 20);

  ctx.font = '26px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Score: ${score}`, cx, cy + 30);

  ctx.font = '22px monospace';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`Best: ${highScore}`, cx, cy + 70);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#cccccc';
  ctx.fillText('Press Space / Click / Tap to Restart', cx, cy + 115);

  ctx.restore();
}

// --- Update / Render ---

/**
 * update(game, canvas)
 * Advances all game logic by one frame.
 * Only mutates state — never reads from the DOM.
 */
function update(game, canvas) {
  if (game.state === STATE.PLAYING) {
    updateKiro(game.kiro);
    game.pipes = updatePipes(game.pipes, canvas.width, canvas.height, game.frame);
    updateClouds(game.clouds, canvas.width);
    updateScore(game.pipes, game.kiro, game);
    if (checkCollision(game.kiro, game.pipes, canvas.height)) {
      handleCollision(game);
    }
    game.frame++;
  } else if (game.state === STATE.MENU || game.state === STATE.GAME_OVER) {
    // Keep clouds animating on non-playing screens
    updateClouds(game.clouds, canvas.width);
  }
}

/**
 * render(game, ctx, canvas)
 * Draws the current frame. Reads state only — never mutates it.
 */
function render(game, ctx, canvas) {
  const h = canvas.height;

  renderBackground(ctx, canvas);
  renderClouds(ctx, game.clouds);

  if (game.state === STATE.PLAYING || game.state === STATE.PAUSED || game.state === STATE.GAME_OVER) {
    renderPipes(ctx, game.pipes, h);
    renderKiro(ctx, game.kiro);
  }

  renderHUD(ctx, canvas, game.score, game.highScore);

  if (game.state === STATE.MENU) {
    renderMenu(ctx, canvas, game.highScore);
  } else if (game.state === STATE.PAUSED) {
    renderPaused(ctx, canvas);
  } else if (game.state === STATE.GAME_OVER) {
    renderGameOver(ctx, canvas, game.score, game.highScore);
  }
}

// --- Game Loop ---

let lastTimestamp = 0;

/**
 * gameLoop(timestamp)
 * Computes dt (capped to avoid spiral-of-death on tab blur), then updates and renders.
 */
function gameLoop(timestamp) {
  const dt = Math.min(timestamp - lastTimestamp, 50);
  lastTimestamp = timestamp;

  update(game, canvas);
  render(game, ctx, canvas);

  requestAnimationFrame(gameLoop);
}

/**
 * init()
 * Bootstraps the game: loads high score, initialises entities, attaches input
 * listeners, and starts the game loop.
 */
function init() {
  game.highScore = ScoreStore.load();
  initKiro();
  game.clouds = initClouds(canvas.width, canvas.height);
  game.pipes  = [];
  game.frame  = 0;

  if (typeof requestAnimationFrame === 'undefined') {
    console.error('requestAnimationFrame is not supported in this browser. Game cannot start.');
    return;
  }

  requestAnimationFrame(gameLoop);
}

init();
