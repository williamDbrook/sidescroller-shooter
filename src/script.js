const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const enemySpriteSheet = new Image();
enemySpriteSheet.src = 'enemy.png'; // Provide the correct path to your sprite sheet

const backgroundImage = new Image();
backgroundImage.src = 'bg.png';

let backgroundX = 0;
let gameState = 'playing'; // Possible states: 'playing', 'paused', 'mainMenu', 'storeScreen', 'gameOver'
let progressionChecked = false; // New flag to ensure checkLevelProgression logic runs only once

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
    frameHeight: 186,
    facingRight: true,
    animationTimer: 0,
    animationSpeed: 8,
    totalFrames: 14, 
    idleFrame: 13,  
    lastShootTime: 0,
    shootCooldown: 200,
    health: 100,
    maxHealth: 100,
    lastDamageTime: 0,
    damageInterval: 1000,
};
player.sprite.src = 'player.png';

const bullets = [];
const bulletSpeed = 10;
let shootCooldown = 200; 
let lastShootTime = 0;

const ESTABLISHMENTS = {
    STORE: 'store',
    RESTAURANT: 'restaurant',
    ROBBERY: 'robbery'
};

let currentEstablishment = null; // Tracks the current establishment

const ammoTypes = {
    standard: { damage: 15, penetration: false, cost: 0 },
    highDamage: { damage: 30, penetration: false, cost: 3 },
    penetration: { damage: 15, penetration: true, cost: 5 },
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

const spriteSheet = {
    frameWidth: 180,
    frameHeight: 150,
    frameCount: 14,
    currentFrame: 0,
    animationSpeed: 80,
    lastUpdateTime: 0,  
};

let enemies = [
    { x: 100, y: 100, dx: 0, dy: 0, animationTimer: 0, animationSpeed: 10, frameX: 0, totalFrames: 4, idleFrame: 0, speed: 1, facingLeft: false, width: 64, height: 64, health: 50, maxHealth: 50 },
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

let selectedEstablishment = null; // Define the variable at the appropriate scope

function checkLevelProgression() {
    // Remove unnecessary debugging statements
    // console.log("checkLevelProgression called");
    // console.log(`Enemies Length: ${enemies.length}, Enemies Cleared: ${enemiesCleared}, Progression Checked: ${progressionChecked}`);
    
    if (enemies.length === 0 && enemiesCleared && !progressionChecked) {
        // console.log("Enemies cleared condition met");
        playerCurrency += 2; // Grant currency when the level is cleared
        console.log(`Level cleared! Player currency: ${playerCurrency}`);

        // Generate a random number between 1 and 100
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        console.log(`Generated Random Number: ${randomNumber}`);

        // Set selectedEstablishment based on the random number
        if (randomNumber >= 1 && randomNumber <= 33) {
            selectedEstablishment = ESTABLISHMENTS.STORE;
        } else if (randomNumber >= 34 && randomNumber <= 66) {
            selectedEstablishment = ESTABLISHMENTS.RESTAURANT;
        } else if (randomNumber >= 67 && randomNumber <= 100) {
            selectedEstablishment = ESTABLISHMENTS.ROBBERY;
        }
        console.log(`Selected Establishment: ${selectedEstablishment}`);

        // Mark progression as checked to prevent re-execution
        progressionChecked = true;
    }

    // Check if player reaches the right edge of the canvas
    if (player.x > canvas.width - player.width && enemiesCleared) {
        currentLevel++;
        playerCurrency += 2;
        triggerLevelChange(currentLevel);
        player.x = 0; // Reset player position to the left side
        enemiesCleared = false;
        progressionChecked = false; // Reset progression check for the new level
        selectedEstablishment = null; // Reset establishment for the new level
        // console.log("Progressed to the next level. Establishment and progression reset.");
    }
}

function enterEstablishment() {
    console.log(`Entering establishment: ${selectedEstablishment}`);
    if (selectedEstablishment === ESTABLISHMENTS.STORE) {
        gameState = 'storeScreen';
        console.log("Entering store screen");
    } else if (selectedEstablishment === ESTABLISHMENTS.RESTAURANT) {
        gameState = 'restaurantScreen';
        console.log("Entering restaurant screen");
    } else if (selectedEstablishment === ESTABLISHMENTS.ROBBERY) {
        gameState = 'robberyScreen';
        console.log("Entering robbery screen");
    } else {
        console.log("Error: Invalid establishment selected.");
    }
}

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (gameState === 'playing') {
        if (e.code === 'Space') {
            shootBullet();
        }
        if (e.code === 'Enter' && enemiesCleared && isPlayerAtStorePosition()) {
            if (selectedEstablishment) {
                enterEstablishment();
            } else {
                console.log("No establishment selected.");
            }
        }
        if (e.code === 'Escape') {
            togglePause();
        }
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
    } else if (gameState === 'storeScreen' || gameState === 'restaurantScreen' || gameState === 'robberyScreen') {
        if (e.code === 'KeyB') {
            gameState = 'playing';
        } else {
            handleEstablishmentInput(e.code);
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
            resetGame();
            gameState = 'playing';
            console.log("Restarting the game");
        } else if (e.code === 'KeyM') {
            resetGame();
            gameState = 'mainMenu';
            console.log("Returning to main menu");
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function handleEstablishmentInput(keyCode) {
    if (gameState === 'storeScreen') {
        if (keyCode === 'Digit1') {
            purchaseItem('healthPotion');
        } else if (keyCode === 'Digit2') {
            purchaseItem('highDamageAmmo');
        } else if (keyCode === 'Digit3') {
            purchaseItem('penetrationAmmo');
        }
    } else if (gameState === 'restaurantScreen') {
        if (keyCode === 'Digit1') {
            purchaseMeal();
        }
    } else if (gameState === 'robberyScreen') {
        if (keyCode === 'Digit1') {
            robEstablishment();
        }
    }
}

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
            player.health = Infinity;
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

function detectPlayerEnemyCollision(player, enemy) {
    return player.x < enemy.x + enemy.width &&
           player.x + player.width > enemy.x &&
           player.y < enemy.y + enemy.height &&
           player.y + player.height > enemy.y;
}



function resolvePlayerEnemyCollision(player, enemy) {
    const overlapX = (player.width + enemy.width) / 2 - Math.abs(player.x + player.width / 2 - (enemy.x + enemy.width / 2));
    const overlapY = (player.height + enemy.height) / 2 - Math.abs(player.y + player.height / 2 - (enemy.y + enemy.height / 2));

    if (overlapX > overlapY) {
        // Separate vertically
        if (player.y < enemy.y) {
            enemy.y += overlapY;
        } else {
            enemy.y -= overlapY;
        }
    } else {
        // Separate horizontally
        if (player.x < enemy.x) {
            enemy.x += overlapX;
        } else {
            enemy.x -= overlapX;
        }
    }
}

function detectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function resolveCollision(enemy1, enemy2) {
    const overlapX = (enemy1.width + enemy2.width) / 2 - Math.abs(enemy1.x - enemy2.x);
    const overlapY = (enemy1.height + enemy2.height) / 2 - Math.abs(enemy1.y - enemy2.y);

    if (overlapX > overlapY) {
        // Separate vertically
        if (enemy1.y < enemy2.y) {
            enemy1.y -= overlapY / 2;
            enemy2.y += overlapY / 2;
        } else {
            enemy1.y += overlapY / 2;
            enemy2.y -= overlapY / 2;
        }
    } else {
        // Separate horizontally
        if (enemy1.x < enemy2.x) {
            enemy1.x -= overlapX / 2;
            enemy2.x += overlapX / 2;
        } else {
            enemy1.x += overlapX / 2;
            enemy2.x -= overlapX / 2;
        }
    }
}

function handlePlayerDamage(player, enemies, timestamp) {
    enemies.forEach(enemy => {
        if (detectCollision(player, enemy)) {
            if (timestamp - player.lastDamageTime > player.damageInterval) {
                player.health -= 10; // Reduce player's health by 10 (or any other amount)
                player.lastDamageTime = timestamp; // Update the last damage time
                console.log(`Player hit! Health: ${player.health}`);
            }
        }
    });
}

function checkGameOver() {
    if (player.health <= 0) {
        alert("Game Over! Restarting the game...");
        resetGame();
    }
}

function updateBullets() {
    bullets.forEach((bullet, bulletIndex) => {
        bullet.x += bullet.speed; // Update bullet position

        // Remove bullets that go off-screen
        if (bullet.x < 0 || bullet.x > canvas.width) {
            bullets.splice(bulletIndex, 1);
            return;
        }

        // Check for collisions with enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (!bullet.hitEnemies.includes(enemy) && detectCollision(bullet, enemy)) {
                enemy.health -= bullet.damage; // Reduce enemy health
                bullet.hitEnemies.push(enemy); // Mark this enemy as hit by this bullet

                // Remove the enemy if its health reaches zero
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                }

                // Remove the bullet if it has no penetration left
                if (bullet.penetration > 0) {
                    bullet.penetration--;
                } else {
                    bullets.splice(bulletIndex, 1);
                }
            }
        });
    });
}

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        // Calculate the distance between the player and the enemy
        const distance = distanceBetween(
            player.x + player.width / 2,
            player.y + player.height / 2,
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
        );

        // Move the enemy toward the player if not in attack range
        if (distance > enemyAttackRange) {
            moveTowardPlayer(enemy);
        }

        // Enemy attacks the player if within attack range
        if (distance <= enemyAttackRange) {
            const currentTime = Date.now();
            if (currentTime - enemy.lastAttackTime >= enemyAttackCooldown) {
                player.health--; // Reduce player's health
                enemy.lastAttackTime = currentTime;

                // Check if the player's health has reached zero
                if (player.health <= 0) {
                    alert("Game Over!");
                    resetGame();
                }
            }
        }

        // Check for collisions with bullets
        bullets.forEach((bullet, bulletIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemy.health -= bullet.damage; // Reduce enemy's health by bullet damage
                bullets.splice(bulletIndex, 1); // Remove bullet from the game
                if (enemy.health <= 0) {
                    enemies.splice(index, 1); // Remove enemy from the game
                }
            }
        });

        // Check for collisions with the player and resolve them
        if (detectPlayerEnemyCollision(player, enemy)) {
            resolvePlayerEnemyCollision(player, enemy);
        }
    });

    // Check for collisions between enemies and resolve them
    for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            if (detectCollision(enemies[i], enemies[j])) {
                resolveCollision(enemies[i], enemies[j]);
            }
        }
    }

    // Check if all enemies are cleared and handle level progression
    if (enemies.length === 0 && !enemiesCleared) {
        // console.log("All enemies defeated. Setting enemiesCleared to true.");
        enemiesCleared = true;
        checkLevelProgression(); // Call checkLevelProgression immediately after all enemies are cleared
    }
}

function moveTowardPlayer(enemy) {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    enemy.dx = Math.cos(angle) * enemy.speed;
    enemy.dy = Math.sin(angle) * enemy.speed;

    // Move the enemy
    enemy.x += enemy.dx;
    enemy.y += enemy.dy;

    // Check for the restricted y-coordinate range
    if (enemy.y < 170) {
        enemy.y = 170; // Prevent the enemy from moving into the restricted range
    }
}

function distanceBetween(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function resetGame() {
    // Reset player properties
    player.x = 50;
    player.y = canvas.height / 2;
    player.health = player.maxHealth;
    player.score = 0;

    // Clear enemies and bullets
    enemies.length = 0;
    bullets.length = 0;

    // Reset game state
    gameState = 'playing'; // Assuming 'playing' is the main game state
    currentLevel = 1;
    enemiesCleared = false;

    // Trigger the first level
    triggerLevelChange(currentLevel);
}

function isPlayerAtStorePosition() {
    return player.x >= STORE_POSITION.x &&
           player.x <= STORE_POSITION.x + STORE_POSITION.width &&
           player.y >= STORE_POSITION.y &&
           player.y <= STORE_POSITION.y + STORE_POSITION.height;
}

function triggerLevelChange(level) {
    // console.log(`Level changed to ${level}`);
    enemiesCleared = false; // Reset enemiesCleared for the new level
    progressionChecked = false; // Reset progression check for the new level
    enemies = initializeEnemiesForLevel(level); // Initialize enemies for the new level
    // console.log(`Enemies initialized for level ${level}:`, enemies); // Debugging statement

    // Add enemies based on the current level
    if (level === 1) {
        enemies.length = 0;
    }
    if (level <= 3) {
        addEnemies(1);
    }
    if (level >= 4) {
        addEnemies(2); // Add 2 enemies at level 4
    }
    if (level >= 8) {
        addEnemies(3); // Add 3 enemies at level 8
    }
    if (level >= 12) {
        addEnemies(4); // Add 4 enemies at level 12
    }

    // Additional level-specific logic (e.g., increasing difficulty)
    console.log(`Level ${level} started with ${enemies.length} enemies.`);
}

function addEnemies(numberOfEnemies) {
    for (let i = 0; i < numberOfEnemies; i++) {
        let enemyX = canvas.width + 64; // Start offscreen to the right
        let enemyY;

        do {
            enemyY = Math.random() * canvas.height;
        } while (enemyY < 170); // Ensure the enemy does not spawn within the restricted range

        enemies.push({
            x: enemyX,
            y: enemyY,
            dx: 0,
            dy: 0,
            animationTimer: 0,
            animationSpeed: 10,
            frameX: 0,
            totalFrames: 4,
            idleFrame: 0,
            speed: 2,
            facingLeft: false,
            width: 64,
            height: 64,
            health: 50,
            maxHealth: 50,
            lastAttackTime: 0
        });
    }
}

function purchaseMeal() {
    const mealCost = 5;
    const mealHealAmount = 20;
    if (playerCurrency >= mealCost) {
        playerCurrency -= mealCost;
        player.health = Math.min(player.maxHealth, player.health + mealHealAmount);
        console.log(`Purchased meal. Player health: ${player.health}, Player currency: ${playerCurrency}`);
    } else {
        console.log("Not enough currency to purchase a meal.");
    }
}

function robEstablishment() {
    const robberyPenalty = 10;
    const robberySuccess = Math.random() > 0.5; // 50% chance of success
    if (robberySuccess) {
        const stolenAmount = Math.floor(Math.random() * 10) + 1; // Random amount between 1 and 10
        playerCurrency += stolenAmount;
        console.log(`Robbery successful! Stolen amount: ${stolenAmount}, Player currency: ${playerCurrency}`);
    } else {
        player.health -= robberyPenalty;
        console.log(`Robbery failed! Player health: ${player.health}`);
    }
}

function initializeEnemiesForLevel(level) {
    const baseEnemyCount = 1; // Starting with 1 enemy
    const maxEnemyCount = 20; // Maximum number of enemies
    const enemyCount = Math.min(baseEnemyCount + level, maxEnemyCount); // Increase enemies based on level

    let enemies = [];

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
            dx: 0,
            dy: 0,
            animationTimer: 0,
            animationSpeed: 10,
            frameX: 0,
            totalFrames: 4,
            idleFrame: 0,
            speed: 1,
            facingLeft: false,
            width: 64,
            height: 64,
            health: 50,
            maxHealth: 50
        });
    }

    console.log("Enemies initialized for level " + level + ": ", enemies); // Debugging statement
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

function restartGame() {
    player.health = 100; // Reset player health
    // Reset other game variables as needed
    gameState = 'playing'; // Change the game state to playing
}

function drawBullets() {
    ctx.fillStyle = 'red';
    bullets.forEach(bullet => {
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
    ctx.fillRect(10, 10, 200, 20); // Background of the health bar
    
    ctx.fillStyle = 'green';
    const healthWidth = (player.health / player.maxHealth) * 200; // Calculate the width of the health bar based on current health
    ctx.fillRect(10, 10, healthWidth, 20); // Health bar
    
    ctx.strokeStyle = 'white';
    ctx.strokeRect(10, 10, 200, 20); // Outline of the health bar
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
    ctx.fillText('Press M to Main Menu', canvas.width / 2, canvas.height / 2 + 150);
}

const STORE_POSITION = {
    x: canvas.width / 2 - 75 / 2, // Center the store horizontally
    y: 125, // Center the store vertically
    width: 75,
    height: 100
};

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

function drawRestaurantScreen() {
    ctx.clearRect(400, 0, canvas.width, canvas.height);
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('Restaurant - Press B to go back', 400, 30);
    ctx.fillText('1. Buy Meal (Price: 5, Heal: 20 Health)', 400, 60);
    ctx.fillText(`Current Currency: ${playerCurrency}`, 400, 90);
    ctx.fillText(`Current Health: ${player.health}/${player.maxHealth}`, 20, 120);
}

function drawRobberyScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('Robbery - Press B to go back', 400, 30);
    ctx.fillText('1. Attempt Robbery', 400, 60);
}

function drawStorePosition() {
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)'; // Blue color with 50% opacity
    ctx.fillRect(STORE_POSITION.x, STORE_POSITION.y, STORE_POSITION.width, STORE_POSITION.height);
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

function drawGameOverScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the background

    ctx.fillStyle = 'white';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 50);

    ctx.font = '24px sans-serif';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2);
}

function drawEnemyHealthBar(enemy) {
    const barWidth = 200; // Width of the health bar
    const barHeight = 5; // Height of the health bar
    const barX = enemy.x + enemy.width / 2 - barWidth / 2; // Center the health bar above the enemy
    const barY = enemy.y - 10; // Position the health bar above the enemy

    // Background of the health bar (gray)
    ctx.fillStyle = 'gray';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Current health (green)
    const healthWidth = (enemy.health / enemy.maxHealth) * barWidth;
    ctx.fillStyle = 'green';
    ctx.fillRect(barX, barY, healthWidth, barHeight);

    // Border of the health bar (black)
    ctx.strokeStyle = 'black';
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'r' || event.key === 'R') {
        restartGame(); // Implement the restartGame function to reset game state
    }
});

function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'mainMenu') {
        drawMainMenu();
    } else if (gameState === 'playing') {
        drawBackground();

        updateSprite(player); // Update player sprite
        drawPlayer(); // Ensure drawPlayer uses player.frameX for animation

        updateBullets(); // Update bullet positions and check for collisions
        drawBullets(); // Draw bullets

        updateEnemyAnimation(spriteSheet, timestamp); // Update enemy animation frame
        updateEnemyPositions(enemies, player); // Update enemy positions to hunt the player

        // Update and draw each enemy
        enemies.forEach(enemy => {
            updateSprite(enemy); // Update enemy sprite
            drawEnemyFrame(ctx, spriteSheet, enemy, enemy.frameX, 0); // Draw enemy frame
            drawEnemyHealthBar(enemy); // Draw the enemy's health bar
        });

        handlePlayerDamage(player, enemies, timestamp); // Check for collisions and handle damage
        checkGameOver(); // Check if the player's health is zero and handle game over

        drawPlayerHealth(); // Display player's health
        drawLevelInfo();
        updatePlayer();   // Handle player movement
        handleShooting(); // Handle player shooting
        updateEnemies();  // Update enemies and check if all are cleared
        checkLevelProgression(); // Check if the player has progressed to the next level
        drawAmmoType(); // Display the current ammo type and counts
        drawCurrency(); // Display the player's currency

        // Draw the shop entry point if all enemies are cleared
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
    } else if (gameState === 'restaurantScreen') {
        drawRestaurantScreen();
    } else if (gameState === 'robberyScreen') {
        drawRobberyScreen();
    } else if (gameState === 'gameOver') {
        drawGameOverScreen(); // Display the game over screen
    }

    requestAnimationFrame(gameLoop);
}

// Start the game loop only after the sprite sheet has loaded
enemySpriteSheet.onload = () => {
    requestAnimationFrame(gameLoop);
};