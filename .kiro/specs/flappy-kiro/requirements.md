# Requirements Document

## Introduction

Flappy Kiro is a browser-based endless scroller game inspired by Flappy Bird. The player controls a ghost character named Kiro, guiding it through gaps between pipes by tapping, clicking, or pressing the spacebar. The game features a retro sketchy art style with a light blue background, green pipes, floating cloud decorations, and a score display. The game ends when Kiro collides with a pipe or goes out of bounds, and the player's score increases each time Kiro successfully passes through a pipe gap.

## Glossary

- **Game**: The Flappy Kiro browser-based application
- **Kiro**: The ghost character controlled by the player
- **Pipe**: A green obstacle extending from the top or bottom of the screen with a cap
- **Pipe_Pair**: A set of two pipes (top and bottom) with a gap between them
- **Gap**: The vertical opening between a top pipe and bottom pipe that Kiro must fly through
- **Score**: The count of Pipe_Pairs Kiro has successfully passed through in the current session
- **High_Score**: The highest Score achieved across all sessions, persisted in local storage
- **Gravity**: The constant downward acceleration applied to Kiro
- **Jump**: The upward velocity impulse applied to Kiro when the player inputs a command
- **Canvas**: The HTML5 canvas element used to render the game
- **Game_Loop**: The continuous update-render cycle that drives the game
- **Collision**: Contact between Kiro and a pipe or the screen boundary

## Requirements

### Requirement 1: Core Game Loop

**User Story:** As a player, I want the game to run continuously with smooth animation, so that I can enjoy a responsive gameplay experience.

#### Acceptance Criteria

1. THE Game SHALL render at a consistent frame rate using the browser's requestAnimationFrame API
2. WHEN the game starts, THE Game_Loop SHALL begin updating and rendering game state
3. WHILE the game is active, THE Game_Loop SHALL update Kiro's position, pipe positions, and score each frame
4. WHEN the game is over, THE Game_Loop SHALL stop updating game state and display the game over screen

### Requirement 2: Kiro Physics

**User Story:** As a player, I want Kiro to fall due to gravity and rise when I input a jump command, so that I can control the ghost's vertical position.

#### Acceptance Criteria

1. WHILE the game is active, THE Game SHALL apply a constant downward Gravity to Kiro each frame
2. WHEN the player presses the spacebar, clicks the mouse, or taps the screen, THE Game SHALL apply an upward velocity impulse to Kiro
3. WHILE the game is active, THE Game SHALL update Kiro's vertical position based on its current velocity each frame
4. WHEN Kiro's vertical position exceeds the top or bottom boundary of the Canvas, THE Game SHALL trigger a Collision

### Requirement 3: Pipe Generation and Scrolling

**User Story:** As a player, I want pipes to appear continuously from the right side of the screen and scroll left, so that I face an ongoing challenge.

#### Acceptance Criteria

1. WHILE the game is active, THE Game SHALL generate new Pipe_Pairs at regular horizontal intervals from the right edge of the Canvas
2. WHILE the game is active, THE Game SHALL scroll all Pipe_Pairs leftward at a constant speed each frame
3. WHEN a Pipe_Pair scrolls completely off the left edge of the Canvas, THE Game SHALL remove it from the active pipe list
4. THE Game SHALL randomize the vertical position of each Pipe_Pair's Gap within defined minimum and maximum bounds
5. THE Game SHALL maintain a fixed Gap height for all Pipe_Pairs

### Requirement 4: Collision Detection

**User Story:** As a player, I want the game to detect when Kiro hits a pipe or goes out of bounds, so that the game ends appropriately.

#### Acceptance Criteria

1. WHEN Kiro's bounding box overlaps with any pipe's bounding box, THE Game SHALL trigger a Collision
2. WHEN Kiro's vertical position goes above the top edge of the Canvas, THE Game SHALL trigger a Collision
3. WHEN Kiro's vertical position goes below the bottom edge of the Canvas, THE Game SHALL trigger a Collision
4. WHEN a Collision is triggered, THE Game SHALL transition to the game over state

### Requirement 5: Scoring

**User Story:** As a player, I want my score to increase as I pass through pipes and my high score to be saved, so that I can track my progress.

#### Acceptance Criteria

1. WHEN Kiro passes through the Gap of a Pipe_Pair, THE Game SHALL increment the Score by 1
2. WHILE in the gameplay state, THE Game SHALL display the current Score in real time on the Canvas
3. THE Game SHALL persist the High_Score to browser local storage whenever it is updated
4. WHEN the game loads, THE Game SHALL retrieve the High_Score from browser local storage

### Requirement 6: Game State Management

**User Story:** As a player, I want clear transitions between menu, gameplay, pause, and game over states, so that I can navigate the game intuitively.

#### Acceptance Criteria

1. WHEN the game loads, THE Game SHALL enter the main menu state and display the game title, the current High_Score, and a prompt to start
2. WHEN the player provides a Jump input from the main menu state, THE Game SHALL transition to the gameplay state
3. WHILE in the gameplay state, WHEN the player presses the Escape key or a designated pause button, THE Game SHALL transition to the paused state and halt all game updates
4. WHILE in the paused state, WHEN the player presses the Escape key or the pause button again, THE Game SHALL resume the gameplay state
5. WHEN a Collision is triggered, THE Game SHALL transition to the game over state and display the final Score, the High_Score, and a prompt to restart
6. WHEN the player provides a Jump input from the game over state, THE Game SHALL reset all game state and transition to the gameplay state
7. WHEN the game transitions to the game over state and the current Score exceeds the stored High_Score, THE Game SHALL update and persist the High_Score before displaying the game over screen

### Requirement 7: Visual Rendering

**User Story:** As a player, I want the game to have a retro sketchy visual style, so that I enjoy an aesthetically pleasing experience.

#### Acceptance Criteria

1. THE Game SHALL render a light blue sketchy background on the Canvas
2. THE Game SHALL render Kiro using the ghost sprite from assets/ghosty.png
3. THE Game SHALL render Pipe_Pairs as green rectangles with pipe caps extending from the top and bottom edges
4. THE Game SHALL render decorative cloud-like rounded rectangle shapes in the background with semi-transparent fill
5. THE Game SHALL render a dark footer bar at the bottom of the Canvas displaying the Score and High_Score in the format "Score: N | High: N"

### Requirement 10: Parallax Cloud Layers

**User Story:** As a player, I want background clouds to move at different speeds, so that the scene has a sense of depth and perspective.

#### Acceptance Criteria

1. THE Game SHALL maintain at least two distinct layers of cloud decorations, each scrolling leftward at a different speed
2. WHILE the game is active, THE Game SHALL scroll each cloud layer at a speed proportional to its perceived depth, with closer layers moving faster than distant layers
3. WHEN a cloud scrolls completely off the left edge of the Canvas, THE Game SHALL reposition it to the right edge to maintain continuous cloud coverage
4. THE Game SHALL render clouds with semi-transparent fill so that background elements remain visible through them

### Requirement 8: Audio Feedback

**User Story:** As a player, I want audio feedback for game events and background music, so that the game feels more engaging.

#### Acceptance Criteria

1. WHEN the player triggers a Jump, THE Game SHALL play the sound from assets/jump.wav
2. WHEN Kiro passes through a Pipe_Pair Gap and the Score increments, THE Game SHALL play a scoring sound effect
3. WHEN a Collision is triggered, THE Game SHALL play the sound from assets/game_over.wav
4. WHILE in the gameplay state, THE Game SHALL play looping background music
5. WHEN the game transitions out of the gameplay state, THE Game SHALL stop the background music
6. IF the browser does not support audio playback, THEN THE Game SHALL continue functioning without audio

### Requirement 9: Input Handling

**User Story:** As a player, I want to control Kiro using keyboard, mouse, or touch input, so that I can play on any device.

#### Acceptance Criteria

1. WHEN the player presses the spacebar key, THE Game SHALL register a Jump input
2. WHEN the player clicks anywhere on the Canvas, THE Game SHALL register a Jump input
3. WHEN the player taps anywhere on the Canvas on a touch device, THE Game SHALL register a Jump input
4. WHEN the game has not yet started, THE Game SHALL display a start prompt and begin the game on the first Jump input
