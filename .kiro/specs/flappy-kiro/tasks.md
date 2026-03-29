# Implementation Plan: Flappy Kiro

## Overview

Implement Flappy Kiro as a browser-based game using vanilla HTML5, CSS, and the Canvas API. The implementation spans four files: `index.html`, `config.js`, `game.js`, and a `tests/` directory. No build tools required.

## Tasks

- [ ] 1. Project scaffold and constants
  - Create `index.html` with a `<canvas>` element, script tags for `config.js` and `game.js`, and basic CSS (full-viewport canvas, dark background)
  - Create `config.js` defining all constants: `GRAVITY`, `JUMP_VELOCITY`, `PIPE_SPEED`, `PIPE_INTERVAL`, `GAP_HEIGHT`, `GAP_MIN_Y`, `PIPE_WIDTH`, `FOOTER_HEIGHT`, `CLOUD_LAYERS`, and the `STATE` enum
  - _Requirements: 1.1, 3.5, 10.1_

- [ ] 2. Core physics and Kiro object
  - [ ] 2.1 Implement Kiro initialization and physics update function
    - Create the `Kiro` object with `x`, `y`, `vy`, `width`, `height`, `image` fields
    - Implement `updateKiro(kiro)`: apply `GRAVITY` to `vy`, then add `vy` to `y`
    - Implement `applyJump(kiro)`: set `kiro.vy = JUMP_VELOCITY`
    - Load `assets/ghosty.png`; fall back to a white filled rectangle if load fails
    - _Requirements: 2.1, 2.2, 2.3, 7.2_

  - [ ]* 2.2 Write property test for physics update (Property 1)
    - **Property 1: Physics update applies gravity and advances position**
    - For any `(y, vy)`, after `updateKiro`, assert `vy_new === vy + GRAVITY` and `y_new === y + vy_new`
    - **Validates: Requirements 2.1, 2.3**
    - Tag: `Feature: flappy-kiro, Property 1: physics update applies gravity and advances position`

  - [ ]* 2.3 Write property test for jump velocity (Property 2)
    - **Property 2: Jump sets upward velocity**
    - For any Kiro state, after `applyJump`, assert `kiro.vy === JUMP_VELOCITY`
    - **Validates: Requirements 2.2**
    - Tag: `Feature: flappy-kiro, Property 2: jump sets upward velocity`

- [ ] 3. Pipe generation and scrolling
  - [ ] 3.1 Implement pipe spawning and scroll update
    - Implement `spawnPipe(canvasWidth, canvasHeight)`: generate a `Pipe` object with randomized `gapTop` within `[GAP_MIN_Y, canvasHeight - FOOTER_HEIGHT - GAP_MIN_Y - GAP_HEIGHT]`, set `gapBottom = gapTop + GAP_HEIGHT`, `x = canvasWidth`, `scored = false`
    - Implement `updatePipes(pipes, canvasWidth, canvasHeight, frame)`: scroll each pipe left by `PIPE_SPEED`, remove pipes where `pipe.x + PIPE_WIDTH < 0`, spawn a new pipe every `PIPE_INTERVAL` frames
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Write property test for fixed gap height (Property 3)
    - **Property 3: Pipe gap height is always fixed**
    - For any random `gapTop`, assert `pipe.gapBottom - pipe.gapTop === GAP_HEIGHT`
    - **Validates: Requirements 3.5**
    - Tag: `Feature: flappy-kiro, Property 3: pipe gap height is always fixed`

  - [ ]* 3.3 Write property test for gap within canvas bounds (Property 4)
    - **Property 4: Pipe gap is always within canvas bounds**
    - For any canvas height, assert `gapTop >= GAP_MIN_Y` and `gapBottom <= canvasHeight - FOOTER_HEIGHT - GAP_MIN_Y`
    - **Validates: Requirements 3.4**
    - Tag: `Feature: flappy-kiro, Property 4: pipe gap is always within canvas bounds`

  - [ ]* 3.4 Write property test for pipe scrolling (Property 5)
    - **Property 5: Pipes scroll left every frame**
    - For any pipe at position `x`, after one update tick assert `pipe.x === x - PIPE_SPEED`
    - **Validates: Requirements 3.2**
    - Tag: `Feature: flappy-kiro, Property 5: pipes scroll left every frame`

  - [ ]* 3.5 Write property test for off-screen pipe removal (Property 6)
    - **Property 6: Off-screen pipes are removed from the active list**
    - For any pipe where `pipe.x + pipe.width < 0`, assert it is absent from the pipe list after the next update
    - **Validates: Requirements 3.3**
    - Tag: `Feature: flappy-kiro, Property 6: off-screen pipes are removed from the active list`

- [ ] 4. Collision detection
  - [ ] 4.1 Implement AABB collision detection and out-of-bounds check
    - Implement `overlaps(rectA, rectB)`: return true if the two axis-aligned rectangles intersect
    - Implement `checkCollision(kiro, pipes, canvasHeight)`: return true if Kiro overlaps any pipe rect (top body or bottom body), or if `kiro.y < 0`, or if `kiro.y + kiro.height > canvasHeight - FOOTER_HEIGHT`
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 4.2 Write property test for AABB symmetry (Property 12)
    - **Property 12: AABB collision detection is symmetric**
    - For any two rectangles A and B, assert `overlaps(A, B) === overlaps(B, A)`
    - **Validates: Requirements 4.1**
    - Tag: `Feature: flappy-kiro, Property 12: AABB collision detection is symmetric`

  - [ ]* 4.3 Write property test for out-of-bounds collision (Property 13)
    - **Property 13: Out-of-bounds Kiro triggers collision**
    - For any Kiro y where `y < 0` or `y + kiro.height > canvasHeight - FOOTER_HEIGHT`, assert `checkCollision` returns true
    - **Validates: Requirements 2.4, 4.2, 4.3**
    - Tag: `Feature: flappy-kiro, Property 13: out-of-bounds Kiro triggers collision`

  - [ ]* 4.4 Write unit tests for collision edge cases
    - Test Kiro exactly at top boundary (y === 0, no collision) and one pixel above (y === -1, collision)
    - Test Kiro exactly at bottom boundary and one pixel below
    - Test Kiro bounding box touching but not overlapping a pipe (no collision)
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5. Scoring and high score persistence
  - [ ] 5.1 Implement score increment logic and ScoreStore
    - Implement `updateScore(pipes, kiro, game)`: for each pipe where `!pipe.scored` and `kiro.x > pipe.x + PIPE_WIDTH`, increment `game.score` and set `pipe.scored = true`
    - Implement `ScoreStore`: `load()` reads from `localStorage` (returns 0 on error), `save(score)` writes to `localStorage` (silently catches errors)
    - On game init, call `ScoreStore.load()` to populate `game.highScore`
    - On game over, if `game.score > game.highScore`, update and call `ScoreStore.save()`
    - _Requirements: 5.1, 5.3, 5.4, 6.7_

  - [ ]* 5.2 Write property test for score idempotence (Property 7)
    - **Property 7: Score increments exactly once per pipe**
    - For any pipe and Kiro x crossing, assert score increments by exactly 1 and `pipe.scored` prevents further increments
    - **Validates: Requirements 5.1**
    - Tag: `Feature: flappy-kiro, Property 7: score increments exactly once per pipe`

  - [ ]* 5.3 Write property test for non-decreasing high score (Property 8)
    - **Property 8: High score is non-decreasing across sessions**
    - For any sequence of session scores, assert the stored high score after each session is `>=` the previous stored value
    - **Validates: Requirements 6.7**
    - Tag: `Feature: flappy-kiro, Property 8: high score is non-decreasing across sessions`

  - [ ]* 5.4 Write property test for localStorage round-trip (Property 9)
    - **Property 9: localStorage round-trip preserves high score**
    - For any non-negative integer score, assert `ScoreStore.load()` after `ScoreStore.save(score)` returns the same value
    - **Validates: Requirements 5.3, 5.4**
    - Tag: `Feature: flappy-kiro, Property 9: localStorage round-trip preserves high score`

  - [ ]* 5.5 Write unit tests for score and high score logic
    - Test score resets to 0 on restart
    - Test high score updates only when current score exceeds it
    - Test `ScoreStore.load()` returns 0 when localStorage is unavailable
    - _Requirements: 5.1, 5.3, 5.4, 6.7_

- [ ] 6. Checkpoint — core logic verified
  - Ensure all tests written so far pass. Confirm physics, pipes, collision, and scoring behave correctly before wiring into the game loop.

- [ ] 7. Cloud parallax system
  - [ ] 7.1 Implement cloud initialization and scroll update
    - Implement `initClouds(canvasWidth, canvasHeight)`: for each entry in `CLOUD_LAYERS`, create `count` Cloud objects with randomized `x`, `y`, `width`, `height`, and assign `speed` and `alpha` from the layer config
    - Implement `updateClouds(clouds, canvasWidth)`: for each cloud, decrement `cloud.x` by `cloud.speed`; if `cloud.x + cloud.width < 0`, reset `cloud.x` to `canvasWidth`
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 7.2 Write property test for cloud scroll speed (Property 10)
    - **Property 10: Cloud layers scroll at their configured speeds**
    - For any cloud with configured speed `s`, after one update tick assert `cloud.x` decreased by exactly `s`
    - **Validates: Requirements 10.2**
    - Tag: `Feature: flappy-kiro, Property 10: cloud layers scroll at their configured speeds`

  - [ ]* 7.3 Write property test for cloud wrap-around (Property 11)
    - **Property 11: Clouds wrap around to the right edge**
    - For any cloud where `cloud.x + cloud.width < 0` before update, assert `cloud.x >= canvasWidth` after update
    - **Validates: Requirements 10.3**
    - Tag: `Feature: flappy-kiro, Property 11: clouds wrap around to the right edge`

- [ ] 8. Game state machine
  - [ ] 8.1 Implement state transitions and input handler
    - Implement the `Game` object with fields: `state`, `score`, `highScore`, `kiro`, `pipes`, `clouds`, `frame`
    - Implement `handleJump(game)`: in `MENU` or `GAME_OVER` state transition to `PLAYING` (reset state on `GAME_OVER`); in `PLAYING` state apply jump to Kiro
    - Implement `handlePause(game)`: toggle between `PLAYING` and `PAUSED`
    - Implement `handleCollision(game)`: transition to `GAME_OVER`, update high score if needed, stop background music
    - Attach event listeners for `keydown` (spacebar, Escape), `click`, and `touchstart` on the canvas
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 8.2 Write unit tests for state machine transitions
    - Test MENU → PLAYING on jump input
    - Test PLAYING → PAUSED on Escape, PAUSED → PLAYING on Escape again
    - Test PLAYING → GAME_OVER on collision
    - Test GAME_OVER → PLAYING (with full reset) on jump input
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 8.3 Write unit tests for input event registration
    - Test spacebar keydown registers jump in PLAYING state
    - Test click registers jump in PLAYING state
    - Test touchstart registers jump in PLAYING state
    - Test inputs are ignored in PAUSED state (no jump applied)
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 9. Audio manager
  - [ ] 9.1 Implement AudioManager
    - Implement `AudioManager` with `HTMLAudioElement` instances for `jump`, `score`, `gameOver`, and `music`
    - Implement `play(name)`: call `.play()` on the named element, catch and silently discard any errors
    - Implement `playLoop(name)`: set `loop = true` and call `play(name)`
    - Implement `stopLoop()`: pause the music element and reset `currentTime`
    - Wire audio calls into game events: jump → `play('jump')`, score → `play('score')`, collision → `play('gameOver')`, PLAYING state enter → `playLoop('music')`, PLAYING state exit → `stopLoop()`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 9.2 Write unit tests for audio error handling
    - Test that `AudioManager.play()` does not throw when the audio element rejects the play promise
    - Test that `AudioManager.play()` does not throw when the audio element is missing
    - _Requirements: 8.6_

- [ ] 10. Rendering
  - [ ] 10.1 Implement all render functions
    - Implement `renderBackground(ctx, canvas)`: fill canvas with light blue, draw sketchy background details
    - Implement `renderClouds(ctx, clouds)`: for each cloud, set `ctx.globalAlpha = cloud.alpha` and draw a rounded rectangle
    - Implement `renderPipes(ctx, pipes, canvasHeight)`: for each pipe draw the top body, top cap, bottom body, and bottom cap as green rectangles
    - Implement `renderKiro(ctx, kiro)`: draw `kiro.image` at `(kiro.x, kiro.y)`; fall back to a white filled rectangle if image is not loaded
    - Implement `renderHUD(ctx, canvas, score, highScore)`: draw the dark footer bar and render `"Score: N | High: N"` text
    - Implement `renderMenu(ctx, canvas, highScore)`: draw title, high score, and start prompt
    - Implement `renderPaused(ctx, canvas)`: draw a semi-transparent overlay with "PAUSED" text
    - Implement `renderGameOver(ctx, canvas, score, highScore)`: draw final score, high score, and restart prompt
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 5.2, 6.1, 6.5_

- [ ] 11. Game loop wiring
  - [ ] 11.1 Implement the main game loop and wire all components together
    - Implement `update(game, canvas)`: if state is `PLAYING`, call `updateKiro`, `updatePipes`, `updateClouds`, `updateScore`, `checkCollision` (trigger `handleCollision` if true), increment `game.frame`; if state is `MENU` or `GAME_OVER`, still call `updateClouds` for background animation
    - Implement `render(game, ctx, canvas)`: call all render functions appropriate to the current state
    - Implement `gameLoop(timestamp)`: compute `dt`, call `update` and `render`, schedule next frame via `requestAnimationFrame`
    - Implement `init()`: load high score, initialize Kiro, clouds, and pipes, attach input listeners, start the game loop
    - Guard against missing `requestAnimationFrame` with a console error
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 12. Final checkpoint — full integration
  - Ensure all tests pass. Open `index.html` in a browser and verify: menu displays, jump starts game, pipes scroll, score increments, collision ends game, high score persists across page reloads, pause toggles correctly, clouds parallax at different speeds, audio plays (or fails silently).

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** and run a minimum of 100 iterations each
- Unit tests and property tests live in the `tests/` directory
- Each property test references its design document property number via the tag format `Feature: flappy-kiro, Property N: <text>`
- All requirements are traceable through the `_Requirements:` annotations on each task
