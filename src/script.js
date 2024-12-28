const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const backgroundImage = new Image();
backgroundImage.src = 'bg.png';

let backgroundX = 0;
let gameState = 'mainMenu'; // 'mainMenu', 'playing', 'paused', 'storeScreen'

const player = {
    x: 100,
    y: canvas.height / 2 - 25,
    width: 100,
    height: 100,
    speed: 5,
    dx: 0,
    dy: 0,
    sprite: new Image(),
    frameX: 0,
    frameY: 0,
    frameWidth: 230,
    frameHeight: 170,
    facingRight: true,
    animationTimer: 0,
    animationSpeed: 3.4,
    totalFrames: 14, 
    idleFrame: 13,  
};
player.sprite.src = 'player.png';

const playerHealth = {
    current: 10,
    max: 10,
};

let currentLevel = 1;
let enemiesCleared = false;

const enemyAttackRange = 50;
const enemyAttackCooldown = 1000;

const bullets = [];
const bulletSpeed = 10;
let shootCooldown = 200; 
let lastShotTime = 0;

let enemies = [];
let isMovingToNextLevel = false;

const MIN_SAFE_DISTANCE = 100; 

const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

window.addEventListener('keydown', (e) => {
    if (gameState === 'playing') {
        if (e.code === 'Space') shootBullet();
        if (enemiesCleared && e.code === 'Enter' && isPlayerAtStorePosition()) {
            gameState = 'storeScreen'; // Enter store screen
            console.log("Entering store screen");
        }
        if (e.code === 'Escape') {
            togglePause();
        }
    } else if (gameState === 'storeScreen') {
        if (e.code === 'KeyB') {
            gameState = 'playing'; // Return to game
            console.log("Returning from store to game");
        }
    } else if (gameState === 'mainMenu') {
        if (e.code === 'Enter') {
            gameState = 'playing';
            enemies = initializeEnemiesForLevel(currentLevel);
        }
    } else if (gameState === 'paused') {
        if (e.code === 'Escape') {
            togglePause();
        } else if (e.code === 'KeyR') {
            gameState = 'playing';
            resetGame();
        } else if (e.code === 'KeyM') {
            gameState = 'mainMenu';
            resetGame();
        }
    }
});

const cheatConsole = document.createElement('input');
cheatConsole.type = 'text';
cheatConsole.style.position = 'absolute';
cheatConsole.style.bottom = '10px';
cheatConsole.style.left = '50%';
cheatConsole.style.transform = 'translateX(-50%)';
cheatConsole.style.width = '300px';
cheatConsole.style.zIndex = 10;
document.body.appendChild(cheatConsole);

cheatConsole.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = cheatConsole.value.trim().toLowerCase();
        processCheatCode(command);
        cheatConsole.value = ''; // Clear the input
    }
});

function processCheatCode(command) {
    switch (command) {
        case 'godmode':
            playerHealth.current = Infinity;
            console.log('God mode activated!');
            break;
        case 'infiniteammo':
            bullets.length = Infinity;
            console.log('Infinite ammo activated!');
            break;
        case 'nextlevel':
            console.log('Next level cheat code activated!');
            triggerLevelChange();
            break;
        case 'killall':
            enemies = [];
            console.log('All enemies killed!');
            break;
        case 'fastshoot':
            shootCooldown = 2;
            console.log('Shoot cooldown set to 2!');
            break;
        default:
            console.log('Unknown cheat code!');
    }
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
    } else if (gameState === 'paused') {
        gameState = 'playing';
    }
}

function updatePlayerSprite() {
    player.animationTimer++;
    if (player.animationTimer >= player.animationSpeed) {
        player.animationTimer = 0;
        if (player.dx !== 0 || player.dy !== 0) {
            player.frameX = (player.frameX + 1) % (player.totalFrames - 1); 
        } else {
            player.frameX = player.idleFrame; 
        }
    }
}

function updatePlayer() {
    // Calculate player dimensions based on the y-coordinate
    const playerHeight = calculatePlayerHeight(player.y);
    const playerWidth = calculatePlayerWidth(player.y);

    player.dx = 0;
    player.dy = 0;

    // Handle movement
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

    // Move player
    player.x += player.dx;
    player.y += player.dy;

    // Prevent player from moving off the screen (left, right, top, bottom)
    const minY = 170;
    const maxY = 445;
    if (player.x < 0) player.x = 0;
    if (player.x + playerWidth > canvas.width) player.x = canvas.width - playerWidth;
    if (player.y < minY) player.y = minY;
    if (player.y > maxY) player.y = maxY;

    // Check if player is at the right edge of the screen to proceed to the next level
    if (enemiesCleared && player.x + playerWidth >= canvas.width) {
        console.log("Player reached the right edge, proceeding to next level");
        triggerLevelChange();
    }

    updatePlayerSprite();
}

// Example functions to calculate player dimensions based on the y-coordinate
function calculatePlayerHeight(y) {
    // Replace this with your actual logic for calculating player height
    return 50 + (y / canvas.height) * 20; // Example: player height increases with y-coordinate
}

function calculatePlayerWidth(y) {
    // Replace this with your actual logic for calculating player width
    return 50 + (y / canvas.height) * 20; // Example: player width increases with y-coordinate
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

function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.speed;
        if (bullet.x < 0 || bullet.x > canvas.width) bullets.splice(index, 1);
    });
}

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        if (distanceBetween(player.x + player.width / 2, player.y + player.height / 2, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2) > enemyAttackRange) {
            moveTowardPlayer(enemy);
        }

        if (distanceBetween(player.x + player.width / 2, player.y + player.height / 2, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2) <= enemyAttackRange) {
            const currentTime = Date.now();
            if (currentTime - enemy.lastAttackTime >= enemyAttackCooldown) {
                playerHealth.current--;
                enemy.lastAttackTime = currentTime;

                if (playerHealth.current <= 0) {
                    alert("Game Over!");
                    resetGame();
                }
            }
        }

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

    checkLevelProgression();
}

function moveTowardPlayer(enemy) {
    const angle = Math.atan2(player.y + player.height / 2 - (enemy.y + enemy.height / 2), player.x + player.width / 2 - (enemy.x + enemy.width / 2));
    const speed = 2;
    enemy.x += Math.cos(angle) * speed;
    enemy.y += Math.sin(angle) * speed;

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
    currentLevel = 1; 
    enemies = initializeEnemiesForLevel(currentLevel);
    bullets.length = 0; 
    backgroundX = 0; 
    shootCooldown = 200; 
}

function checkLevelProgression() {
    if (enemies.length === 0 && !enemiesCleared) {
        enemiesCleared = true;
        // Player can now move to the upper middle part of the screen to visit the store or proceed to the next level.
    }
}

function isPlayerAtStorePosition() {
    return player.x >= STORE_POSITION.x - player.width / 2 &&
           player.x <= STORE_POSITION.x + player.width / 2 &&
           player.y >= STORE_POSITION.y - player.height / 2 &&
           player.y <= STORE_POSITION.y + player.height / 2;
}

function triggerLevelChange() {
    console.log("Triggering level change");
    backgroundX = 0;  // Reset background position
    currentLevel++;
    console.log("Current Level: " + currentLevel);
    enemies = initializeEnemiesForLevel(currentLevel);
    player.x = 0;  // Reset player position to the left side
    enemiesCleared = false;
    gameState = 'playing'; // Ensure game state is set to playing
    console.log("Level changed successfully");
}

function initializeEnemiesForLevel(level) {
    const baseEnemyCount = 1; // Starting with 1 enemy
    const maxEnemyCount = 20; // Maximum number of enemies
    const enemyCount = Math.min(baseEnemyCount + level, maxEnemyCount); // Increase enemies based on level

    const baseHealth = 3; // Base health for enemies
    const baseSpeed = 1; // Base speed for enemies

    const enemies = [];

    for (let i = 0; i < enemyCount; i++) {
        let spawnX, spawnY;
        let safeDistance = false;

        // Ensure the enemy spawns at a safe distance from the player
        while (!safeDistance) {
            spawnX = Math.random() * (canvas.width - 50);
            spawnY = Math.random() * (canvas.height - 50);
            const distance = distanceBetween(player.x + player.width / 2, player.y + player.height / 2, spawnX + 25, spawnY + 25);

            if (distance >= MIN_SAFE_DISTANCE) {
                safeDistance = true;
            }
        }

        enemies.push({
            x: spawnX,
            y: spawnY,
            width: 50,
            height: 50,
            health: baseHealth,
            lastAttackTime: 0,
        });
    }

    console.log("Enemies initialized for level " + level + ": ", enemies);
    return enemies;
}


function checkLevelProgression() {
    if (enemies.length === 0 && !enemiesCleared) {
        enemiesCleared = true;
    }
}

window.addEventListener('keydown', (e) => {
    if (gameState === 'playing' && enemiesCleared) {
        if (e.code === 'Enter' && isPlayerAtStorePosition()) {
            gameState = 'storeScreen'; // Enter store screen
        }
    } else if (gameState === 'storeScreen') {
        if (e.code === 'KeyB') {
            gameState = 'playing'; // Return to game
        }
    }
    // Other key event listeners...
});

function isPlayerInStoreEntryZone() {
    return (
        player.x + player.width / 2 >= storeEntryZone.x &&
        player.x + player.width / 2 <= storeEntryZone.x + storeEntryZone.width &&
        player.y <= storeEntryZone.y + storeEntryZone.height
    );
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawBackground() {
    let backgroundWidth = canvas.width;
    let backgroundHeight = canvas.height;

    let x = backgroundX % backgroundWidth;
    if (x > 0) x -= backgroundWidth; 

    while (x < canvas.width) {
        ctx.drawImage(backgroundImage, x, 0, backgroundWidth, backgroundHeight);
        x += backgroundWidth;
    }
}

function drawPlayer() {
    ctx.save();

    
    const maxScale = 2;     
    const minScale = 0.5;  
    const scale = minScale + ((maxScale - minScale) * (player.y / canvas.height));
    
    const drawWidth = player.width * scale;
    const drawHeight = player.height * scale;

    if (!player.facingRight) {
        ctx.scale(-1, 1);
        ctx.drawImage(
            player.sprite,
            player.frameX * player.frameWidth, 0, player.frameWidth, player.frameHeight,
            -player.x - drawWidth, player.y, drawWidth, drawHeight
        );
    } else {
        ctx.drawImage(
            player.sprite,
            player.frameX * player.frameWidth, 0, player.frameWidth, player.frameHeight,
            player.x, player.y, drawWidth, drawHeight
        );
    }
    ctx.restore();
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

function drawPlayerHealth() {
    ctx.fillStyle = 'black';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = 'green';
    ctx.fillRect(10, 10, (playerHealth.current / playerHealth.max) * 200, 20); 
    ctx.strokeStyle = 'white';
    ctx.strokeRect(10, 10, 200, 20); 
}

function drawLevelInfo() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Level: ${currentLevel}`, canvas.width - 100, 30);
}

function drawMainMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Welcome to the Game', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = 'yellow';
    ctx.font = '30px Arial';
    ctx.fillText('Press Enter to Start', canvas.width / 2, canvas.height / 2 + 50);
}

function drawPauseMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Paused', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = 'yellow';
    ctx.font = '30px Arial';
    ctx.fillText('Press Escape to Resume', canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 100);
    ctx.fillText('Press M to Main Menu', canvas.width / 2, canvas.height / 2 + 150);
}

const STORE_POSITION = { x: canvas.width / 2 - 37.5, y: 160 }; // Upper middle part of the screen

function drawStoreScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Store', canvas.width / 2, 50);

    ctx.font = '30px Arial';
    ctx.fillText('1. Buy Health Potion (Press 1)', canvas.width / 2, 150);
    ctx.fillText('2. Buy Ammo (Press 2)', canvas.width / 2, 200);
    ctx.fillText('Press B to go back', canvas.width / 2, 300);
}

function drawStorePosition() {
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)'; // Blue color with 50% opacity
    ctx.fillRect(STORE_POSITION.x, 110, 75, 100);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'mainMenu') {
        drawMainMenu();
    } else if (gameState === 'playing') {
        console.log("Game state: playing");
        drawBackground();
        drawPlayer();
        drawBullets();
        drawEnemies();
        drawPlayerHealth();
        drawLevelInfo();
        updatePlayer();
        updateBullets();
        updateEnemies();
        checkLevelProgression();
        if (enemiesCleared) {
            drawStorePosition();
        }
    } else if (gameState === 'paused') {
        console.log("Game state: paused");
        drawBackground();
        drawPlayer();
        drawBullets();
        drawEnemies();
        drawPlayerHealth();
        drawLevelInfo();
        drawPauseMenu();
    } else if (gameState === 'storeScreen') {
        console.log("Game state: storeScreen");
        drawStoreScreen();
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();