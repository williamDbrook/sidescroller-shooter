import { Player } from './player.js';
import { initializeEnemiesForLevel } from './enemy.js';
import { preloadImages, preloadSounds, images } from './graphics_loader.js';
import { gameState } from './constants.js';
import { keys, isKeyPressed, resetKeyStates } from './input.js';

let canvas = null;
let ctx = null;

let player;
let enemies = [];
let bullets = [];
let currentGameState = gameState.MAIN_MENU;

function ensureCanvasSize() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initializeGame() {
    // ensure canvas exists now (after assets loaded / DOM should be ready)
    if (!canvas) {
        canvas = document.getElementById('gameCanvas') || document.querySelector('canvas');
        ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    }

    ensureCanvasSize();
    player = new Player(50, (canvas ? canvas.height - 140 : 400), 40, 60, 100);

    // apply pending spriteRect safely (if any)
    if (window._pendingSpriteRect) {
        player.spriteRect = window._pendingSpriteRect;
        delete window._pendingSpriteRect;
    }

    enemies = initializeEnemiesForLevel(1);
    currentGameState = gameState.PLAYING;
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!ctx || !canvas) {
        // if canvas isn't available yet, keep trying next frame
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // DEBUG fallback: always draw a visible test rectangle so you know rendering works
    ctx.save();
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // dark background to spot sprites
    ctx.fillStyle = 'magenta';
    ctx.fillRect(30, 30, 120, 80);
    ctx.fillStyle = 'white';
    ctx.font = '18px sans-serif';
    ctx.fillText('FRAME OK', 40, 60);
    ctx.restore();

    if (currentGameState === gameState.MAIN_MENU) {
        drawMainMenu();
    } else if (currentGameState === gameState.PLAYING) {
        // pass current keyboard state into player.update
        updateGame();
        drawGame();
    }

    // reset per-frame key states tracked by input.js (pressed/released)
    resetKeyStates();

    requestAnimationFrame(gameLoop);
}

function updateGame() {
    if (player && typeof player.update === 'function') player.update(keys);
    enemies.forEach(enemy => enemy && typeof enemy.update === 'function' && enemy.update());
    updateBullets();

    // Process shooting: Space or KeyK etc. (use isKeyPressed so it fires once per press)
    if (isKeyPressed('Space') || isKeyPressed('KeyK')) {
        if (player && typeof player.shoot === 'function') player.shoot(bullets);
    }

    checkCollisions();
}

function updateBullets() {
    bullets.forEach(b => {
        b.x += b.speed;
    });
    // remove off-screen bullets
    bullets = bullets.filter(b => b.x > -50 && b.x < (canvas ? canvas.width + 50 : 2000));
}

function drawBullets() {
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y - b.height / 2, b.width, b.height);
    });
}

// Replace drawGame with this debug-aware implementation
function drawGame() {
    // draw background (scale to canvas). fallback if missing
    if (images && images.background instanceof HTMLImageElement && images.background.complete && images.background.naturalWidth > 0) {
        try {
            ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
        } catch (e) {
            // fallback fill if drawImage fails
            ctx.fillStyle = '#113';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else {
        // fallback background if not ready
        ctx.fillStyle = '#113';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // draw player
    if (player) {
        if (typeof player.draw === 'function') {
            try {
                player.draw(ctx);
            } catch (e) {
                console.warn('player.draw threw, drawing placeholder', e);
                ctx.fillStyle = 'cyan';
                ctx.fillRect(50, canvas.height - 120, 40, 60);
            }
        } else {
            ctx.fillStyle = 'cyan';
            ctx.fillRect(50, canvas.height - 120, 40, 60);
        }
    }

    // draw enemies placeholders / real draws
    enemies.forEach((enemy, i) => {
        const x = 200 + i * 80;
        const y = canvas.height - 120 - (i % 3) * 30;
        ctx.fillStyle = 'orange';
        ctx.fillRect(x, y, 40, 40);

        if (enemy && typeof enemy.draw === 'function') {
            try { enemy.draw(ctx); } catch (e) {}
        }
    });

    // draw bullets
    drawBullets();
}

function checkCollisions() {
    // Collision detection logic here
}

function drawMainMenu() {
    // Main menu drawing logic here
}

// initial debug draw to verify canvas is reachable
if (ctx && canvas) {
    ensureCanvasSize();
    // debugDrawOnce(ctx, canvas); // optional, function not present in repo
}

preloadImages()
  .then(() => preloadSounds())
  .then(() => {
      // images is defined here and has been populated by preloadImages()
      console.log('images loaded:', images);
      initializeGame();
  })
  .catch(err => {
      console.error('Failed to preload assets:', err);
  });

// after preloadImages() and player created:
// or compute frame from index:
function setPlayerFrame(frameIndex, frameW, frameH) {
  player.spriteRect = { x: frameIndex * frameW, y: 0, w: frameW, h: frameH };
}

// Instead of: player.spriteRect = { x:0, y:0, w:64, h:96 };  <-- remove this line if present

// Safe: set immediately if player exists, otherwise save for initializeGame
const defaultSpriteRect = { x: 0, y: 0, w: 186, h: 186 };
if (typeof player !== 'undefined' && player) {
    player.spriteRect = defaultSpriteRect;
} else {
    window._pendingSpriteRect = defaultSpriteRect;
}