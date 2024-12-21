const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const backgroundImage = new Image();
backgroundImage.src = 'bg.png';
let backgroundX = 0;

// --- Player properties ---
const player = {
    x: 100,
    y: canvas.height / 2 - 25,
    width: 50,
    height: 50,
    speed: 3.5,
    dx: 0,
    dy: 0,
    sprite: new Image(),
    frameX: 0,
    frameY: 0,
    frameWidth: 341,
    frameHeight: 268,
    facingRight: true,
    animationTimer: 0,
    animationSpeed: 15,
};
player.sprite.src = 'player.png';

const playerHealth = {
    current: 10,
    max: 10,
};

function drawPlayerHealth() {
    ctx.fillStyle = 'black';
    ctx.fillRect(10, 10, 200, 20); // Background of the health bar
    ctx.fillStyle = 'green';
    ctx.fillRect(10, 10, (playerHealth.current / playerHealth.max) * 200, 20); // Health bar
    ctx.strokeStyle = 'white';
    ctx.strokeRect(10, 10, 200, 20); // Border
}

const enemyAttackRange = 50;
const enemyAttackCooldown = 1000;

// --- Bullets ---
const bullets = [];
const bulletSpeed = 10;
const shootCooldown = 200;
let lastShotTime = 0;

// --- Enemies ---
let enemies = initializeEnemies();
let enemiesCleared = false;

// --- Functions for Initialization ---
function initializeEnemies() {
    return [
        { x: 400, y: 200, width: 50, height: 50, health: 3, dx: 1, dy: 1, lastAttackTime: 0 },
        { x: 600, y: 300, width: 50, height: 50, health: 3, dx: -1, dy: -1, lastAttackTime: 0 },
    ];
}

// --- Input tracking ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// --- Background ---
function drawBackground() {
    ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
}


function drawPlayer() {
  ctx.save();
  if (!player.facingRight) {
      ctx.scale(-1, 1);
      ctx.drawImage(
          player.sprite,
          player.frameX * player.frameWidth, 0, player.frameWidth, player.frameHeight,
          -player.x - player.width, player.y, player.width, player.height
      );
  } else {
      ctx.drawImage(
          player.sprite,
          player.frameX * player.frameWidth, 0, player.frameWidth, player.frameHeight,
          player.x, player.y, player.width, player.height
      );
  }
  ctx.restore();
}

function updatePlayerSprite() {
  player.animationTimer++;
  if (player.animationTimer >= player.animationSpeed) {
      player.animationTimer = 0;
      if (player.dx !== 0 || player.dy !== 0) {
          player.frameX = (player.frameX + 1) % 4;
      } else {
          player.frameX = 0;
      }
  }
}

function updatePlayer() {
  player.dx = 0;
  player.dy = 0;

  if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
  if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;
  if (keys['ArrowLeft'] || keys['a']) {
      player.dx = -player.speed;
      player.facingRight = false;
  }
  if (keys['ArrowRight'] || keys['d']) {
      player.dx = player.speed;
      player.facingRight = true;
  }

  player.x += player.dx;
  player.y += player.dy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

  updatePlayerSprite();
}

function shootBullet() {
  const currentTime = Date.now();
  if (currentTime - lastShotTime >= shootCooldown) {
      bullets.push({
          x: player.facingRight ? player.x + player.width : player.x,
          y: player.y + player.height / 2,
          width: 10,
          height: 5,
          speed: player.facingRight ? bulletSpeed : -bulletSpeed,
      });
      lastShotTime = currentTime;
  }
}

function drawBullets() {
  bullets.forEach(bullet => {
      ctx.fillStyle = 'yellow';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function updateBullets() {
  bullets.forEach((bullet, index) => {
      bullet.x += bullet.speed;
      if (bullet.x < 0 || bullet.x > canvas.width) bullets.splice(index, 1);
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      ctx.fillStyle = 'black';
      ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
      ctx.fillStyle = 'green';
      ctx.fillRect(enemy.x, enemy.y - 10, (enemy.health / 3) * enemy.width, 5);
  });
}

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        // Enemy Movement
        if (distanceBetween(player.x + player.width / 2, player.y + player.height / 2, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2) > enemyAttackRange) {
            moveTowardPlayer(enemy);
        }

        // Enemy Attacks
        if (distanceBetween(player.x + player.width / 2, player.y + player.height / 2, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2) <= enemyAttackRange) {
            const currentTime = Date.now();
            if (currentTime - enemy.lastAttackTime >= enemyAttackCooldown) {
                playerHealth.current--;
                enemy.lastAttackTime = currentTime;

                // Check if player health reaches zero
                if (playerHealth.current <= 0) {
                    alert("Game Over!"); // Replace this with a better game-over screen
                    resetGame();
                }
            }
        }

        // Enemy Bullet Collision
        bullets.forEach((bullet, bulletIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemy.health--;
                bullets.splice(bulletIndex, 1);
                if (enemy.health <= 0) enemies.splice(index, 1);
            }
        });
    });

    // Check for cleared enemies
    if (enemies.length === 0 && !enemiesCleared) {
        enemiesCleared = true;
        backgroundX -= canvas.width;
        enemies = initializeEnemies(); // Reinitialize enemies
    }
}

function moveTowardPlayer(enemy) {
    const angle = Math.atan2(player.y + player.height / 2 - (enemy.y + enemy.height / 2), player.x + player.width / 2 - (enemy.x + enemy.width / 2));
    const speed = 2;
    enemy.x += Math.cos(angle) * speed;
    enemy.y += Math.sin(angle) * speed;

    // Boundary check
    if (enemy.x < 0) enemy.x = 0;
    if (enemy.x + enemy.width > canvas.width) enemy.x = canvas.width - enemy.width;
    if (enemy.y < 0) enemy.y = 0;
    if (enemy.y + enemy.height > canvas.height) enemy.y = canvas.height - enemy.height;
}

function distanceBetween(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function resetGame() {
    player.x = 100;
    player.y = canvas.height / 2 - 25;
    playerHealth.current = playerHealth.max;
    enemies = initializeEnemies();
    bullets.length = 0; // Clear bullets
    backgroundX = 0; // Reset background
}

// --- Game loop ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawPlayerHealth();

  updatePlayer();
  updateBullets();
  updateEnemies();

  requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') shootBullet();
});

// --- Start game ---
gameLoop();