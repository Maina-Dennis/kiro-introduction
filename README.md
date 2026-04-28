# Flappy Kiro

A browser-based endless scroller game built with vanilla HTML5 Canvas and JavaScript — no frameworks, no build tools required. Guide Kiro the ghost through an endless gauntlet of pipes by tapping, clicking, or pressing Space.

![Flappy Kiro UI](img/example-ui.png)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [How to Play](#how-to-play)
- [Configuration](#configuration)
- [Architecture](#architecture)
  - [Game States](#game-states)
  - [Game Loop](#game-loop)
  - [Physics](#physics)
  - [Pipe System](#pipe-system)
  - [Collision Detection](#collision-detection)
  - [Scoring and Persistence](#scoring-and-persistence)
  - [Audio](#audio)
  - [Rendering](#rendering)
- [Testing](#testing)
- [Assets](#assets)
- [Browser Compatibility](#browser-compatibility)
- [License](#license)

---

## Overview

Flappy Kiro is a Flappy Bird-inspired game where you control a ghost character named Kiro. The game runs entirely in the browser using the HTML5 Canvas API — no dependencies, no bundler, no server required. Just open `index.html` and play.

The project was built as part of the **Kiro Introduction** starter kit, demonstrating how Kiro can scaffold, implement, and test a complete game from a structured spec.

---

## Features

- Smooth 60 fps game loop powered by `requestAnimationFrame`
- Gravity-based physics with jump impulse control
- Procedurally generated pipes with randomized gap positions
- Parallax cloud layers for a sense of depth (3 speed layers)
- AABB collision detection against pipes and screen boundaries
- Score tracking with high score persistence via `localStorage`
- Full game state machine: Menu → Playing → Paused → Game Over
- Keyboard, mouse, and touch input support
- Audio feedback for jumps, scoring, and game over events
- Graceful fallbacks for missing sprites and audio errors
- Fully responsive — adapts to any viewport size

---

## Project Structure

```
flappy-kiro/
├── index.html                  # Entry point — canvas + script tags
├── config.js                   # All tunable constants and the STATE enum
├── game.js                     # All game logic (physics, rendering, loop)
├── assets/
│   ├── ghosty.png              # Kiro sprite
│   ├── jump.wav                # Jump / score sound effect
│   └── game_over.wav           # Game over sound effect
├── img/
│   └── example-ui.png          # Screenshot for documentation
├── tests/
│   ├── physics-pipes.test.js   # Property-based tests (fast-check)
│   ├── package.json            # Test runner config
│   └── package-lock.json
└── README.md
```

---

## Getting Started

No installation or build step is needed.

**Option 1 — Open directly in a browser:**

```bash
# Clone the repository
git clone https://github.com/your-username/kiro-introduction.git
cd kiro-introduction

# Open the game
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

**Option 2 — Serve locally (recommended for audio):**

Some browsers block audio on `file://` URLs. A simple local server avoids this:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8080` in your browser.

---

## How to Play

| Action | Input |
|---|---|
| Start game | Space / Click / Tap |
| Jump | Space / Click / Tap |
| Pause / Resume | Escape |
| Restart after game over | Space / Click / Tap |

- Kiro falls continuously due to gravity. Tap or click to flap upward.
- Navigate through the gaps between green pipes.
- Each pipe pair you clear earns 1 point.
- Hitting a pipe or flying out of bounds ends the run.
- Your high score is saved automatically and persists across sessions.

---

## Configuration

All tunable game constants live in `config.js`. Adjust these to change the feel of the game:

```js
const CONFIG = {
  GRAVITY: 0.5,          // Downward acceleration (px/frame²)
  JUMP_VELOCITY: -9,     // Upward impulse on jump (px/frame)
  PIPE_SPEED: 3,         // Horizontal scroll speed (px/frame)
  PIPE_INTERVAL: 90,     // Frames between pipe spawns
  GAP_HEIGHT: 260,       // Vertical gap between pipe pairs (px)
  GAP_MIN_Y: 80,         // Minimum gap distance from top edge (px)
  PIPE_WIDTH: 60,        // Pipe width (px)
  FOOTER_HEIGHT: 40,     // HUD bar height at the bottom (px)
  CLOUD_LAYERS: [
    { speed: 0.4, alpha: 0.25, count: 4 }, // Distant layer
    { speed: 1.0, alpha: 0.45, count: 3 }, // Mid layer
    { speed: 1.8, alpha: 0.60, count: 2 }, // Close layer
  ],
};
```

> Never hardcode magic numbers in `game.js` — always reference `CONFIG`.

---

## Architecture

### Game States

The game uses a simple state machine with four states defined in `config.js`:

```
MENU ──(jump)──► PLAYING ──(collision)──► GAME_OVER ──(jump)──► PLAYING
                    │                                               ▲
                 (escape)                                           │
                    ▼                                               │
                 PAUSED ──(escape)──────────────────────────────────┘
```

| State | Description |
|---|---|
| `MENU` | Title screen, shows high score and start prompt |
| `PLAYING` | Active gameplay — physics, pipes, and scoring update each frame |
| `PAUSED` | All updates halted; clouds continue animating |
| `GAME_OVER` | Final score displayed; awaiting restart input |

### Game Loop

The loop follows a strict update → render → schedule pattern:

```js
function gameLoop(timestamp) {
  const dt = Math.min(timestamp - lastTimestamp, 50); // cap to avoid spiral-of-death
  lastTimestamp = timestamp;
  update(game, canvas);   // mutates state
  render(game, ctx, canvas); // reads state only
  requestAnimationFrame(gameLoop);
}
```

Delta time is capped at 50 ms to prevent large physics jumps when the tab loses focus.

### Physics

Kiro's vertical motion is governed by two values: position `y` and velocity `vy`.

Each frame while playing:

```
vy += GRAVITY       // apply gravity
y  += vy            // advance position
```

A jump sets `vy = JUMP_VELOCITY` (a negative value, meaning upward).

### Pipe System

Pipes are plain objects: `{ x, gapTop, gapBottom, width, scored }`.

- A new pipe is spawned every `PIPE_INTERVAL` frames at the right edge of the canvas.
- `gapTop` is randomized within `[GAP_MIN_Y, canvasHeight - FOOTER_HEIGHT - GAP_MIN_Y - GAP_HEIGHT]` to keep the gap reachable.
- `gapBottom = gapTop + GAP_HEIGHT` — the gap height is always fixed.
- Pipes scroll left by `PIPE_SPEED` each frame and are removed once fully off-screen.

### Collision Detection

Collision uses axis-aligned bounding box (AABB) intersection:

```js
function overlaps(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width  &&
    rectA.x + rectA.width  > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}
```

A collision is triggered when Kiro overlaps any pipe body (top or bottom) or exits the canvas bounds (above the top edge or below the footer).

### Scoring and Persistence

Score increments by 1 each time Kiro's `x` passes a pipe's right edge. Each pipe carries a `scored` flag to ensure it is counted exactly once.

High score is persisted to `localStorage` under the key `flappyKiroHighScore`. All `localStorage` access is wrapped in `try/catch` to handle private browsing and storage quota errors gracefully.

### Audio

`AudioManager` is an IIFE that manages `HTMLAudioElement` instances for:

| Sound | Trigger |
|---|---|
| `jump.wav` | Player jumps |
| `jump.wav` | Score increments (reused) |
| `game_over.wav` | Collision occurs |
| Background music | Looped while in `PLAYING` state |

All `.play()` calls are wrapped in `try/catch` with `.catch()` on the returned Promise to silently handle autoplay policy rejections.

### Rendering

Render functions are pure — they only read state and draw to the canvas. They never mutate game state.

| Function | Draws |
|---|---|
| `renderBackground` | Light blue sky with sketchy horizon lines |
| `renderClouds` | Semi-transparent rounded rectangles at varying opacity |
| `renderPipes` | Green pipe bodies with darker caps |
| `renderKiro` | Ghost sprite, or white rectangle fallback |
| `renderHUD` | Dark footer bar with `Score: N \| High: N` |
| `renderMenu` | Title, best score, and start prompt overlay |
| `renderPaused` | Semi-transparent pause overlay |
| `renderGameOver` | Final score, high score, and restart prompt overlay |

Canvas state (`globalAlpha`, transforms) is always saved and restored with `ctx.save()` / `ctx.restore()` to prevent bleed between draw calls.

---

## Testing

The `tests/` directory contains property-based tests using [fast-check](https://github.com/dubzzz/fast-check). Tests run against pure functions extracted from the game logic, so no browser environment is needed.

**Run the tests:**

```bash
cd tests
npm install
npm test
```

**Properties covered:**

| # | Property | Requirements |
|---|---|---|
| P1 | Physics update applies gravity and advances position | 2.1, 2.3 |
| P2 | Jump sets upward velocity | 2.2 |
| P3 | Pipe gap height is always fixed | 3.5 |
| P4 | Pipe gap is always within canvas bounds | 3.4 |
| P5 | Pipes scroll left every frame | 3.2 |
| P6 | Off-screen pipes are removed from the active list | 3.3 |

Each property runs 200 iterations with randomly generated inputs to surface edge cases that unit tests might miss.

---

## Assets

| File | Description |
|---|---|
| `assets/ghosty.png` | Kiro ghost sprite (40×40 px) |
| `assets/jump.wav` | Jump and score sound effect |
| `assets/game_over.wav` | Game over sound effect |

If `ghosty.png` fails to load, Kiro renders as a white rectangle. If audio fails, the game continues silently.

---

## Browser Compatibility

Flappy Kiro requires:

- `requestAnimationFrame` (all modern browsers)
- HTML5 Canvas 2D API
- `localStorage` (optional — high score falls back to 0 if unavailable)
- `HTMLAudioElement` (optional — audio fails silently if unsupported)

Tested in Chrome, Firefox, Safari, and Edge. Works on desktop and mobile.

---

## License

See [LICENCE.md](LICENCE.md) for details.
