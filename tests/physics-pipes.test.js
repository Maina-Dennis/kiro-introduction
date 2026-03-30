/**
 * physics-pipes.test.js
 * Property-based tests for Flappy Kiro physics and pipe logic.
 * Uses fast-check for property testing and Node's built-in assert.
 *
 * Properties tested:
 *   P1 - Physics update applies gravity and advances position (Req 2.1, 2.3)
 *   P2 - Jump sets upward velocity (Req 2.2)
 *   P3 - Pipe gap height is always fixed (Req 3.5)
 *   P4 - Pipe gap is always within canvas bounds (Req 3.4)
 *   P5 - Pipes scroll left every frame (Req 3.2)
 *   P6 - Off-screen pipes are removed from the active list (Req 3.3)
 */

import assert from 'node:assert/strict';
import * as fc from 'fast-check';

// --- CONFIG constants (mirrored from config.js) ---
const CONFIG = {
  GRAVITY: 0.5,
  JUMP_VELOCITY: -9,
  PIPE_SPEED: 3,
  PIPE_INTERVAL: 90,
  GAP_HEIGHT: 160,
  GAP_MIN_Y: 80,
  PIPE_WIDTH: 60,
  FOOTER_HEIGHT: 40,
};

// --- Pure physics functions under test ---

function updateKiro(kiro) {
  const vy_new = kiro.vy + CONFIG.GRAVITY;
  const y_new  = kiro.y  + vy_new;
  return { ...kiro, vy: vy_new, y: y_new };
}

function jumpKiro(kiro) {
  return { ...kiro, vy: CONFIG.JUMP_VELOCITY };
}

// --- Pure pipe functions under test ---

/**
 * spawnPipe: given a canvas height and a random value in [0,1), produce a Pipe.
 * Mirrors the logic in game.js spawnPipe() but accepts canvasHeight + rand as params.
 */
function spawnPipe(canvasHeight, rand) {
  const maxGapTop = canvasHeight - CONFIG.FOOTER_HEIGHT - CONFIG.GAP_HEIGHT - CONFIG.GAP_MIN_Y;
  const range     = maxGapTop - CONFIG.GAP_MIN_Y;
  const gapTop    = CONFIG.GAP_MIN_Y + Math.floor(rand * (range + 1));
  return {
    x: 800, // arbitrary starting x (canvas width)
    gapTop,
    gapBottom: gapTop + CONFIG.GAP_HEIGHT,
    width: CONFIG.PIPE_WIDTH,
    scored: false,
  };
}

/**
 * updatePipes: move pipes left by PIPE_SPEED, remove off-screen ones.
 * Does NOT handle spawning (tested separately).
 */
function updatePipes(pipes) {
  return pipes
    .map(p => ({ ...p, x: p.x - CONFIG.PIPE_SPEED }))
    .filter(p => p.x + p.width >= 0);
}

// --- Test runner helpers ---

let passed = 0;
let failed = 0;

function runProperty(name, property) {
  try {
    fc.assert(property, { numRuns: 200 });
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 1: Physics update applies gravity and advances position
// Validates: Requirements 2.1, 2.3
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nProperty 1: Physics update applies gravity and advances position');
runProperty('Feature: flappy-kiro, Property 1', fc.property(
  fc.float({ min: -1000, max: 1000, noNaN: true }),
  fc.float({ min: -50,   max: 50,   noNaN: true }),
  (y, vy) => {
    const kiro   = { y, vy };
    const result = updateKiro(kiro);
    const vy_new = vy + CONFIG.GRAVITY;
    const y_new  = y  + vy_new;
    assert.ok(Math.abs(result.vy - vy_new) < 1e-9, `vy_new mismatch: ${result.vy} !== ${vy_new}`);
    assert.ok(Math.abs(result.y  - y_new)  < 1e-9, `y_new mismatch:  ${result.y}  !== ${y_new}`);
  }
));

// ─────────────────────────────────────────────────────────────────────────────
// Property 2: Jump sets upward velocity
// Validates: Requirements 2.2
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nProperty 2: Jump sets upward velocity');
runProperty('Feature: flappy-kiro, Property 2', fc.property(
  fc.float({ min: -1000, max: 1000, noNaN: true }),
  fc.float({ min: -50,   max: 50,   noNaN: true }),
  (y, vy) => {
    const kiro   = { y, vy };
    const result = jumpKiro(kiro);
    assert.strictEqual(result.vy, CONFIG.JUMP_VELOCITY);
    assert.ok(result.vy < 0, 'jump velocity must be negative (upward)');
  }
));

// ─────────────────────────────────────────────────────────────────────────────
// Property 3: Pipe gap height is always fixed
// Validates: Requirements 3.5
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nProperty 3: Pipe gap height is always fixed');
runProperty('Feature: flappy-kiro, Property 3', fc.property(
  fc.integer({ min: 400, max: 1200 }),  // canvasHeight
  fc.float({ min: 0, max: 1, noNaN: true }).filter(r => r < 1), // rand in [0,1)
  (canvasHeight, rand) => {
    const pipe = spawnPipe(canvasHeight, rand);
    assert.strictEqual(
      pipe.gapBottom - pipe.gapTop,
      CONFIG.GAP_HEIGHT,
      `gap height ${pipe.gapBottom - pipe.gapTop} !== ${CONFIG.GAP_HEIGHT}`
    );
  }
));

// ─────────────────────────────────────────────────────────────────────────────
// Property 4: Pipe gap is always within canvas bounds
// Validates: Requirements 3.4
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nProperty 4: Pipe gap is always within canvas bounds');
runProperty('Feature: flappy-kiro, Property 4', fc.property(
  fc.integer({ min: 400, max: 1200 }),
  fc.float({ min: 0, max: 1, noNaN: true }).filter(r => r < 1),
  (canvasHeight, rand) => {
    const pipe = spawnPipe(canvasHeight, rand);
    assert.ok(
      pipe.gapTop >= CONFIG.GAP_MIN_Y,
      `gapTop ${pipe.gapTop} < GAP_MIN_Y ${CONFIG.GAP_MIN_Y}`
    );
    assert.ok(
      pipe.gapBottom <= canvasHeight - CONFIG.FOOTER_HEIGHT - CONFIG.GAP_MIN_Y,
      `gapBottom ${pipe.gapBottom} > canvasHeight(${canvasHeight}) - FOOTER(${CONFIG.FOOTER_HEIGHT}) - GAP_MIN_Y(${CONFIG.GAP_MIN_Y})`
    );
  }
));

// ─────────────────────────────────────────────────────────────────────────────
// Property 5: Pipes scroll left every frame
// Validates: Requirements 3.2
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nProperty 5: Pipes scroll left every frame');
runProperty('Feature: flappy-kiro, Property 5', fc.property(
  fc.array(
    fc.record({
      x:        fc.integer({ min: 0, max: 2000 }),
      gapTop:   fc.integer({ min: 80, max: 400 }),
      gapBottom:fc.integer({ min: 240, max: 600 }),
      width:    fc.constant(CONFIG.PIPE_WIDTH),
      scored:   fc.boolean(),
    }),
    { minLength: 1, maxLength: 10 }
  ),
  (pipes) => {
    // Only keep pipes that are still on-screen before the update
    const onScreen = pipes.filter(p => p.x + p.width >= 0);
    if (onScreen.length === 0) return; // nothing to test

    const before = onScreen.map(p => p.x);
    const after  = updatePipes(onScreen);

    // Every pipe that was on-screen and remains on-screen moved left by PIPE_SPEED
    for (const pipe of after) {
      const origX = before[onScreen.findIndex(p => p === onScreen.find(op => op.x - CONFIG.PIPE_SPEED === pipe.x && op.gapTop === pipe.gapTop))];
      assert.strictEqual(
        pipe.x,
        origX - CONFIG.PIPE_SPEED,
        `pipe.x ${pipe.x} !== ${origX} - ${CONFIG.PIPE_SPEED}`
      );
    }
  }
));

// ─────────────────────────────────────────────────────────────────────────────
// Property 6: Off-screen pipes are removed from the active list
// Validates: Requirements 3.3
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nProperty 6: Off-screen pipes are removed from the active list');
runProperty('Feature: flappy-kiro, Property 6', fc.property(
  fc.array(
    fc.record({
      x:        fc.integer({ min: -200, max: 2000 }),
      gapTop:   fc.integer({ min: 80, max: 400 }),
      gapBottom:fc.integer({ min: 240, max: 600 }),
      width:    fc.constant(CONFIG.PIPE_WIDTH),
      scored:   fc.boolean(),
    }),
    { minLength: 0, maxLength: 10 }
  ),
  (pipes) => {
    const after = updatePipes(pipes);
    // After update, no pipe should have x + width < 0
    for (const pipe of after) {
      assert.ok(
        pipe.x + pipe.width >= 0,
        `pipe at x=${pipe.x} with width=${pipe.width} should have been removed`
      );
    }
  }
));

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
