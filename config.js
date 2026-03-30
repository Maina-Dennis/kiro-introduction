const CONFIG = {
  GRAVITY: 0.5,          // px/frame²
  JUMP_VELOCITY: -9,     // px/frame (negative = up)
  PIPE_SPEED: 3,         // px/frame
  PIPE_INTERVAL: 90,     // frames between pipe spawns
  GAP_HEIGHT: 160,       // px
  GAP_MIN_Y: 80,         // minimum gapTop from canvas top
  PIPE_WIDTH: 60,        // px
  FOOTER_HEIGHT: 40,     // px — dark bar at bottom
  CLOUD_LAYERS: [
    { speed: 0.4, alpha: 0.25, count: 4 }, // distant, slow, more transparent
    { speed: 1.0, alpha: 0.45, count: 3 }, // mid
    { speed: 1.8, alpha: 0.60, count: 2 }, // close, fast, more opaque
  ],
};

const STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
};
