const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const enemySpriteSheet = new Image();
enemySpriteSheet.src = 'enemy.png'; // Provide the correct path to your sprite sheet

const spriteSheet = {
    frameWidth: 180,
    frameHeight: 150,
    frameCount: 14,
    currentFrame: 0,
    animationSpeed: 80,
    lastUpdateTime: 0,  
};

const enemies = [
    { x: 100, y: 100, dx: 0, dy: 0, animationTimer: 0, animationSpeed: 5, frameX: 0, totalFrames: 10, idleFrame: 0, speed: 2, facingLeft: false },
    // Add more enemies if needed
];

function drawEnemyFrame(ctx, spriteSheet, enemy, frameX, frameY) {
    if (enemy.facingLeft) {
        // Save the current context state
        ctx.save();

        // Flip the context horizontally
        ctx.scale(-1, 1);

        // Draw the sprite with flipped coordinates
        ctx.drawImage(
            enemySpriteSheet,
            frameX * spriteSheet.frameWidth, // Source X
            frameY * spriteSheet.frameHeight, // Source Y
            spriteSheet.frameWidth, // Source Width
            spriteSheet.frameHeight, // Source Height
            -enemy.x - spriteSheet.frameWidth, // Destination X (flipped)
            enemy.y, // Destination Y
            spriteSheet.frameWidth, // Destination Width
            spriteSheet.frameHeight // Destination Height
        );

        // Restore the context state
        ctx.restore();
    } else {
        ctx.drawImage(
            enemySpriteSheet,
            frameX * spriteSheet.frameWidth, // Source X
            frameY * spriteSheet.frameHeight, // Source Y
            spriteSheet.frameWidth, // Source Width
            spriteSheet.frameHeight, // Source Height
            enemy.x, // Destination X
            enemy.y, // Destination Y
            spriteSheet.frameWidth, // Destination Width
            spriteSheet.frameHeight // Destination Height
        );
    }
}

// Function to update the current frame of the sprite
function updateEnemyAnimation(spriteSheet, timestamp) {
    if (timestamp - spriteSheet.lastUpdateTime > spriteSheet.animationSpeed) {
        spriteSheet.currentFrame = (spriteSheet.currentFrame + 1) % spriteSheet.frameCount;
        spriteSheet.lastUpdateTime = timestamp;
    }
}

function updateEnemyPositions(enemies, player) {
    enemies.forEach(enemy => {
        // Calculate direction vector from enemy to player
        const directionX = player.x - enemy.x;
        const directionY = player.y - enemy.y;
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
        
        // Normalize direction vector
        if (magnitude > 0) {
            enemy.dx = (directionX / magnitude) * enemy.speed;
            enemy.dy = (directionY / magnitude) * enemy.speed;
        } else {
            enemy.dx = 0;
            enemy.dy = 0;
        }

        // Update enemy position
        enemy.x += enemy.dx;
        enemy.y += enemy.dy;

        // Update facing direction
        if (enemy.dx > 0) {
            enemy.facingLeft = false; // Facing right
        } else if (enemy.dx < 0) {
            enemy.facingLeft = true;  // Facing left
        }

        // Ensure x and y remain numbers
        if (isNaN(enemy.x) || isNaN(enemy.y)) {
            console.error('Invalid position values:', enemy.x, enemy.y);
        }
    });
}

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
    frameWidth: 231,
    frameHeight: 170,
    facingRight: true,
    animationTimer: 0,
    animationSpeed: 8,
    totalFrames: 14, 
    idleFrame: 13,  
    lastShootTime: 0,
    shootCooldown: 200
};
player.sprite.src = 'player.png';

const playerHealth = {
    current: 10,
    max: 12,
};

const bullets = [];
const bulletSpeed = 10;
let shootCooldown = 200; 
let lastShootTime = 0;

const ammoTypes = {
    standard: { damage: 1, penetration: false, cost: 0 },
    highDamage: { damage: 3, penetration: false, cost: 3 },
    penetration: { damage: 1, penetration: true, cost: 5 },
};

let selectedAmmoType = 'standard';
const ammoInventory = {
    standard: Infinity, // Infinite ammo for standard
    highDamage: 0,
    penetration: 0,
};

const storeItems = {
    healthPotion: { price: 5, effect: () => { player.health += 20; } },
    highDamageAmmo: { price: 3, effect: () => { ammoInventory.highDamage += 5; } },
    penetrationAmmo: { price: 5, effect: () => { ammoInventory.penetration += 5; } },
};

let playerCurrency = 0; 

let currentLevel = 1;
let enemiesCleared = false;

const enemyAttackRange = 50;
const enemyAttackCooldown = 1000;


let isMovingToNextLevel = false;

const MIN_SAFE_DISTANCE = 100; 

const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    console.log(`Key down: ${e.code}`); // Debugging statement

    // Handle specific key events based on game state
    if (gameState === 'playing') {
        if (e.code === 'Space') { // Space bar is bound to shooting
            shootBullet();
        }
        if (e.code === 'Enter' && enemiesCleared && isPlayerAtStorePosition()) {
            gameState = 'storeScreen'; // Enter store screen
            console.log("Entering store screen");
        }
        if (e.code === 'Escape') {
            togglePause();
        }
        // Switch ammo types
        if (e.code === 'Digit1') {
            selectedAmmoType = 'standard';
            console.log('Switched to standard ammo.');
        } else if (e.code === 'Digit2') {
            selectedAmmoType = 'highDamage';
            console.log('Switched to high damage ammo.');
        } else if (e.code === 'Digit3') {
            selectedAmmoType = 'penetration';
            console.log('Switched to penetration ammo.');
        }
    } else if (gameState === 'storeScreen') {
        if (e.code === 'Digit1') {
            purchaseItem('healthPotion');
        } else if (e.code === 'Digit2') {
            purchaseItem('highDamageAmmo');
        } else if (e.code === 'Digit3') {
            purchaseItem('penetrationAmmo');
        } else if (e.code === 'KeyB') {
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

    // Handle player entering store position
    if (gameState === 'playing' && enemiesCleared && e.code === 'Enter' && isPlayerAtStorePosition()) {
        gameState = 'storeScreen'; // Enter store screen
    }
});

// Add a single event listener for keyup
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    console.log(`Key up: ${e.code}`); // Debugging statement
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
    switch (command.toLowerCase()) {
        case 'god':
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
        case 'ammo':
            activateInfiniteAmmoTypes();
            console.log('Infinite ammo types activated!');
            break;
        case 'money':
            addCurrency(1000);
            console.log('Added 1000 currency!');
            break;
        default:
            console.log('Unknown cheat code!');
    }
}

function activateInfiniteAmmoTypes() {
    ammoInventory.highDamage = Infinity;
    ammoInventory.penetration = Infinity;
    console.log('Infinite ammo activated for high damage and penetration ammo.');
}

function addCurrency(amount) {
    playerCurrency += amount;
    console.log(`Added ${amount} currency. Current currency: ${playerCurrency}`);
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
    if (currentTime - player.lastShootTime >= player.shootCooldown) {
        if (ammoInventory[selectedAmmoType] > 0 || selectedAmmoType === 'standard') {
            const ammo = ammoTypes[selectedAmmoType];
            bullets.push({
                x: player.facingRight ? player.x + player.width : player.x,
                y: player.y + player.height / 2,
                width: 10,
                height: 5,
                speed: player.facingRight ? 10 : -10, // Assuming a bullet speed of 10
                damage: ammo.damage,
                penetration: ammo.penetration,
                hitEnemies: [] // Track enemies hit by this bullet
            });
            player.lastShootTime = currentTime; // Update the last shoot time

            if (selectedAmmoType !== 'standard') {
                ammoInventory[selectedAmmoType]--; // Reduce ammo count for non-standard ammo
            }
        }
    }
}

function purchaseAmmo(type, amount) {
    const ammo = ammoTypes[type];
    const totalCost = ammo.cost * amount;
    if (playerCurrency >= totalCost) {
        playerCurrency -= totalCost;
        ammoInventory[type] += amount;
        console.log(`Purchased ${amount} ${type} ammo for ${totalCost} currency.`);
    } else {
        console.log('Not enough currency to purchase ammo.');
    }
}

function purchaseItem(itemKey) {
    const item = storeItems[itemKey];
    if (playerCurrency >= item.price) {
        playerCurrency -= item.price;
        item.effect();
        console.log(`Purchased ${itemKey}. Current currency: ${playerCurrency}`);
    } else {
        console.log(`Not enough currency to buy ${itemKey}. Current currency: ${playerCurrency}`);
    }
}

function handleShooting() {
    if (keys['Space']) { // Check if space bar is pressed
        shootBullet();
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.speed;

        // Check for collisions with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];

            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                
                if (!bullet.hitEnemies.includes(enemy)) {
                    enemy.health -= bullet.damage;
                    bullet.hitEnemies.push(enemy); // Track this enemy as hit

                    if (enemy.health <= 0) {
                        enemies.splice(j, 1); // Remove enemy if health is zero or less
                    }

                    // If the bullet is not a penetration bullet, remove it
                    if (!bullet.penetration) {
                        bullets.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Remove bullet if it goes off-screen
        if (bullet.x < 0 || bullet.x > canvas.width) {
            bullets.splice(i, 1);
        }
    }
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
        playerCurrency += 2; // Grant 2 currency when the level is cleared
        console.log(`Level cleared! Player currency: ${playerCurrency}`); // Debugging statement
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
            height: 100, // Make enemies taller by increasing the height
            health: baseHealth,
            lastAttackTime: 0,
        });
    }

    console.log("Enemies initialized for level " + level + ": ", enemies);
    return enemies;
}

function isPlayerInStoreEntryZone() {
    return (
        player.x + player.width / 2 >= storeEntryZone.x &&
        player.x + player.width / 2 <= storeEntryZone.x + storeEntryZone.width &&
        player.y <= storeEntryZone.y + storeEntryZone.height
    );
}

function updateSprite(sprite) {
    sprite.animationTimer++;
    if (sprite.animationTimer >= sprite.animationSpeed) {
        sprite.animationTimer = 0;
        if (sprite.dx !== 0 || sprite.dy !== 0) {
            sprite.frameX = (sprite.frameX + 1) % sprite.totalFrames; 
        } else {
            sprite.frameX = sprite.idleFrame; 
        }
    }
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

        // Draw health bar
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
    ctx.clearRect(400, 0, canvas.width, canvas.height);
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('Store - Press B to go back', 400, 30);

    const items = Object.keys(storeItems);
    items.forEach((item, index) => {
        ctx.fillText(`${index + 1}. Buy ${item} (Price: ${storeItems[item].price})`, 400, 60 + index * 30);
    });

    ctx.fillText(`Current Currency: ${playerCurrency}`, 400, 60 + items.length * 30);
}
function drawStorePosition() {
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)'; // Blue color with 50% opacity
    ctx.fillRect(STORE_POSITION.x, 110, 75, 100);
}

function drawAmmoType() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Ammo Type: ${selectedAmmoType}`, 90, 50); // Display the selected ammo type

    // Display ammo counts for each type
    ctx.fillText(`Standard Ammo: ${ammoInventory.standard === Infinity ? '∞' : ammoInventory.standard}`, 90, 80);
    ctx.fillText(`High Damage Ammo: ${ammoInventory.highDamage}`, 110, 110);
    ctx.fillText(`Penetration Ammo: ${ammoInventory.penetration}`, 100, 140);
}

function drawCurrency() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Currency: ${playerCurrency}`, 700, 60); // Display the currency at the top-left corner
}

function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'mainMenu') {
        drawMainMenu();
    } else if (gameState === 'playing') {
        drawBackground();
        
        updateSprite(player); // Update player sprite
        drawPlayer(); // Ensure drawPlayer uses player.frameX for animation

        drawBullets();
        updateEnemyAnimation(spriteSheet, timestamp); // Update enemy animation frame
        updateEnemyPositions(enemies, player); // Update enemy positions to hunt the player

        // Update and draw each enemy
        enemies.forEach(enemy => {
            updateSprite(enemy); // Update enemy sprite
            drawEnemyFrame(ctx, spriteSheet, enemy, enemy.frameX, 0); // Draw enemy frame
        });

        drawPlayerHealth();
        drawLevelInfo();
        updatePlayer();   // Handle player movement
        handleShooting(); // Handle player shooting
        updateBullets();
        updateEnemies();
        checkLevelProgression();
        drawAmmoType(); // Display the current ammo type and counts
        drawCurrency(); // Display the player's currency
        if (enemiesCleared) {
            drawStorePosition();
        }
    } else if (gameState === 'paused') {
        drawBackground();
        drawPlayer();
        drawBullets();
        drawEnemies();
        drawPlayerHealth();
        drawLevelInfo();
        drawPauseMenu();
    } else if (gameState === 'storeScreen') {
        drawStoreScreen();
    }

    requestAnimationFrame(gameLoop);
}

// Start the game loop only after the sprite sheet has loaded
enemySpriteSheet.onload = () => {
    requestAnimationFrame(gameLoop);
};