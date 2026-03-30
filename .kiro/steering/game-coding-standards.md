# JavaScript Game Coding Standards

## Game Loop Patterns

- Use `requestAnimationFrame` for all animation and game loops — never `setInterval` or `setTimeout`
- Keep the loop structure as: `update(dt)` → `render()` → `requestAnimationFrame(loop)`
- Compute delta time (`dt`) each frame and cap it (e.g. `Math.min(dt, 50)`) to avoid spiral-of-death on tab blur
- Separate update logic from render logic strictly — `update` mutates state, `render` only reads it
- Guard loop start with a check for `requestAnimationFrame` support and log a console error if missing

## Naming Conventions

### Functions
- Game lifecycle functions: `init`, `update`, `render`, `reset`
- Entity update functions: `updateKiro`, `updatePipes`, `updateClouds` (verb + noun)
- Entity render functions: `renderKiro`, `renderPipes`, `renderBackground` (verb + noun)
- Input handlers: `handleJump`, `handlePause`, `handleCollision` (handle + event)
- Factory/spawn functions: `spawnPipe`, `initClouds`, `initKiro` (verb + noun)

### Variables and Objects
- Game state object: `game` (singleton, lowercase)
- State enum: `STATE` (uppercase constant object)
- Config constants: `CONFIG` (uppercase constant object)
- Entity objects: camelCase nouns — `kiro`, `pipe`, `cloud`
- Arrays of entities: plural camelCase — `pipes`, `clouds`
- Boolean flags: prefix with `is` or past tense — `scored`, `isLoaded`

### Constants
- All tunable game constants go in `CONFIG` in `config.js`
- Use SCREAMING_SNAKE_CASE for keys: `CONFIG.GRAVITY`, `CONFIG.PIPE_SPEED`
- Never hardcode magic numbers in `game.js` — always reference `CONFIG`

## Code Organization

- `config.js` — all constants and the `STATE` enum; no logic
- `game.js` — all game logic, grouped in this order:
  1. Canvas setup
  2. State machine / game object
  3. Entity init functions
  4. Entity update functions
  5. Collision and scoring
  6. Render functions
  7. Input handlers
  8. Audio manager
  9. Game loop and init call
- Keep functions small and single-purpose
- Pure functions (no side effects) are preferred for physics and collision logic — easier to test

## Performance Guidelines

- **Avoid allocations in the hot path**: do not create new objects or arrays inside `update()` or `render()` per frame; mutate existing objects instead
- **Object pooling**: for frequently spawned/despawned entities (pipes), filter arrays rather than splicing to avoid GC pressure
- **Canvas state**: always restore `ctx.globalAlpha` and other canvas state after modifying them; use `ctx.save()` / `ctx.restore()` around scoped draw calls
- **Batch draw calls**: group fills of the same color together to minimize `ctx.fillStyle` changes
- **Avoid layout thrash**: do not read `canvas.width` / `canvas.height` inside tight loops — cache them in local variables
- **Image rendering**: pre-load all images before the loop starts; never create `new Image()` inside the game loop
- **Audio**: use `HTMLAudioElement` with try/catch on `.play()` — never let audio errors propagate to the game loop
- **Resize handling**: debounce or throttle the `resize` event listener; reinitialize position-dependent state (e.g. Kiro x) after resize

## Error Handling

- Wrap `localStorage` access in try/catch — it can throw in private browsing or when storage is full
- Wrap all `audio.play()` calls in try/catch or `.catch()` — autoplay policies vary by browser
- Provide visual fallbacks for missing assets (e.g. white rectangle if sprite fails to load)
- Log errors to `console.error` but never let them crash the game loop
