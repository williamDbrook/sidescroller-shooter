// Get the canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Background properties ---
const backgroundImage = new Image();
backgroundImage.src = 'bg.png'; // Replace with your background image path
let backgroundX = 0;

// --- Player properties ---
const player = {
  x: 100, // Player starts 100px from the left
  y: canvas.height / 2 - 25, // Centered vertically
  width: 100,
  height: 100,
  speed: 2,
  dx: 0,
  dy: 0,
  spriteSheet: new Image(),
  currentFrame: 1,
  frameWidth: 341, // Width of each frame in the sprite sheet
  frameHeight: 268, // Height of each frame in the sprite sheet
  totalFrames: 4, // Total number of frames in the sprite sheet
  animationSpeed: 250, // How fast the frame changes (lower is faster)
  lastFrameChangeTime: 0,
  isMoving: false // Tracks whether the player is moving or not
};

// Load the sprite sheet
player.spriteSheet.src = 'player.png'; // Replace with your sprite sheet path

// Handle sprite sheet loading errors
player.spriteSheet.onerror = function() {
  console.error('Failed to load sprite sheet image.');
};

// Add a load event listener to ensure the image is loaded
player.spriteSheet.onload = function() {
  console.log('Sprite sheet loaded successfully');
  // Now we can start the game loop
  gameLoop();
};

// --- Draw the player (with sprite sheet) ---
function drawPlayer() {
  if (!player.spriteSheet.complete) {
    return; // Don't draw if the image is not fully loaded
  }

  const currentTime = Date.now();

  // Check if the player is moving (update isMoving flag)
  player.isMoving = player.dx !== 0 || player.dy !== 0;

  // If the player is moving, change frames. If not, stay on the idle frame.
  if (player.isMoving) {
    // Check if it's time to change the frame (animation speed)
    if (currentTime - player.lastFrameChangeTime >= player.animationSpeed) {
      player.currentFrame = (player.currentFrame + 1) % player.totalFrames;
      player.lastFrameChangeTime = currentTime;
    }
  } else {
    // If player is not moving, stay on the first frame (idle frame)
    player.currentFrame = 0;
  }

  // Draw the appropriate frame from the sprite sheet
  ctx.drawImage(
    player.spriteSheet, 
    player.currentFrame * player.frameWidth, 0, // x and y of the frame in the sprite sheet
    player.frameWidth, player.frameHeight, // width and height of the frame
    player.x, player.y, player.width, player.height // where to draw it on the canvas
  );
}

// --- Bullet properties ---
const bullets = [];
const bulletSpeed = 10;

// --- Input tracking ---
const keys = {};

// Movement keys state
let moveUp = false;
let moveDown = false;
let moveRight = false;
let moveLeft = false;

// --- Event listeners for movement ---
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// --- Draw the background ---
function drawBackground() {
  // Draw two copies of the background
  ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);

  // Handle looping logic (only scroll left when the player moves to the right)
  if (backgroundX <= -canvas.width) {
    backgroundX += canvas.width; // Reset position to the right
  }
}

// --- Draw the player ---
function drawPlayer() {
  const currentTime = Date.now();

  // Check if it's time to change the frame (animation speed)
  if (currentTime - player.lastFrameChangeTime >= player.animationSpeed) {
    player.currentFrame = (player.currentFrame + 1) % player.totalFrames;
    player.lastFrameChangeTime = currentTime;
  }

  ctx.drawImage(
    player.spriteSheet, 
    player.currentFrame * player.frameWidth, 0, // x and y of the frame in the sprite sheet
    player.frameWidth, player.frameHeight, // width and height of the frame
    player.x, player.y, player.width, player.height // where to draw it on the canvas
  );
}

// --- Update player movement ---
function updatePlayer() {
  player.dx = 0;
  player.dy = 0;

  // Movement controls (up, down, left, right)
  if (keys['ArrowUp'] || keys['w']) {
    player.dy = -player.speed;
  }
  if (keys['ArrowDown'] || keys['s']) {
    player.dy = player.speed;
  }
  if (keys['ArrowLeft'] || keys['a']) {
    player.dx = -player.speed;
  }
  if (keys['ArrowRight'] || keys['d']) {
    player.dx = player.speed;
  }

  // Update player position
  player.x += player.dx;
  player.y += player.dy;

  // Prevent player from leaving the canvas (left, right, up, down)
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

  // Scroll the background only if the player reaches the right side
  if (player.x >= canvas.width - player.width) {
    backgroundX -= player.speed / 2; // Scroll the background to the left as the player moves right
  }
}

// --- Bullet firing cooldown ---
let lastShotTime = 0;  // Time of the last shot
const shootCooldown = 200; // Cooldown time in milliseconds (200ms means one shot every 200ms)

// --- Shoot bullets ---
function shootBullet() {
  const currentTime = Date.now();

  // Only allow shooting if enough time has passed
  if (currentTime - lastShotTime >= shootCooldown) {
    const bullet = {
      x: player.x + player.width, // Start the bullet at the right edge of the player
      y: player.y + player.height / 2 - 5, // Center the bullet relative to the player
      width: 10,
      height: 5,
      speed: bulletSpeed
    };
    bullets.push(bullet);
    lastShotTime = currentTime; // Update the last shot time
  }
}

// --- Event listener for shooting (Space bar) ---
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    shootBullet();
  }
});

// --- Draw bullets ---
function drawBullets() {
  bullets.forEach(bullet => {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

// --- Update bullets ---
function updateBullets() {
  bullets.forEach((bullet, index) => {
    bullet.x += bullet.speed; // Move the bullet to the right

    // Remove bullet if it goes off-screen
    if (bullet.x > canvas.width) {
      bullets.splice(index, 1);
    }
  });
}

// --- Game loop ---
function gameLoop() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw and update all objects
  drawBackground();
  drawPlayer();
  drawBullets();
  updatePlayer();
  updateBullets();
  requestAnimationFrame(gameLoop);
}

// --- Start the game loop ---
gameLoop();
