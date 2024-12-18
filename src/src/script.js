const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ball properties
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 5;
let ballSpeedY = 5;
const ballRadius = 10;

// Background properties
const backgroundImage = new Image();
backgroundImage.src = 'bg.png'; 
let backgroundX = 0; 

// Player properties
const playerWidth = 50;
const playerHeight = 30;
let playerX = canvas.width / 2 - playerWidth / 2;
let playerY = canvas.height - playerHeight - 20;
const playerSpeed = 5;

// Handle keypresses
let keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Draw background function
function drawBackground() {
  // Draw the background image
  ctx.drawImage(backgroundImage, backgroundX, 0, 1600, canvas.height);

  // bg reset
  if (backgroundX <= -canvas.width) {
    backgroundX = 0;
  }
}

// Draw the player
function drawPlayer() {
  ctx.fillStyle = "blue"; 
  ctx.fillRect(playerX, playerY, playerWidth, playerHeight);
}

// Draw the ball
function drawBall() {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2, true);
  ctx.fill();
}

// Update game logic
function updateGame() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Bounce off walls for the ball
  if (ballX + ballRadius > canvas.width || ballX - ballRadius < 0) {
    ballSpeedX = -ballSpeedX;
  }
  if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
    ballSpeedY = -ballSpeedY;
  }

  // Scroll the background
  backgroundX -= 2; 

  // player controlls
  if (keys['ArrowLeft'] || keys['a']) {
    playerX -= playerSpeed;
  }
  if (keys['ArrowRight'] || keys['d']) {
    playerX += playerSpeed;
  }
  if (keys['ArrowUp'] || keys['w']) {
    playerY -= playerSpeed;
  }
  if (keys['ArrowDown'] || keys['s']) {
    playerY += playerSpeed;
  }

  // Keep the player within the canvas bounds
  if (playerX < 0) playerX = 0;
  if (playerX + playerWidth > canvas.width) playerX = canvas.width - playerWidth;
  if (playerY < 0) playerY = 0;
  if (playerY + playerHeight > canvas.height) playerY = canvas.height - playerHeight;
}

// Game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();   
  drawPlayer();       
  drawBall();         
  updateGame();
  requestAnimationFrame(gameLoop); 
}

// Start the game loop once the background image is loaded
backgroundImage.onload = function() {
  gameLoop();
};
