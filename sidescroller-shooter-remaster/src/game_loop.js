const gameLoop = (timestamp) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentGameState === gameState.MAIN_MENU) {
        drawMainMenu();
    } else if (currentGameState === gameState.CONTROLS) {
        drawControlsScreen();
    } else if (currentGameState === gameState.PLAYING) {
        drawBackground();

        updateEnemyAnimation(timestamp);
        enemies.forEach(enemy => {
            moveTowardPlayer(enemy);
            drawEnemy(enemy);
            drawEnemyHealthBar(enemy);
        });

        ctx.drawImage(images.hud, 0, 120);

        updatePlayer();
        handlePlayerDamage(player, enemies, timestamp);

        updateBullets();
        drawBullets();
        updateEnemyPositions(enemies, player);

        drawPlayer();
        checkGameOver();
        drawPlayerHealth();
        drawLevelInfo();
        handleShooting();
        updateEnemies();
        checkLevelProgression();
        drawAmmoType();
        drawCurrency();

        checkBulletCollisions();

        updateArrowPosition();

        if (enemiesCleared) {
            drawMarkPosition();
        }
    } else if (currentGameState === gameState.PAUSED) {
        drawBackground();
        drawPlayer();
        drawBullets();
        enemies.forEach(enemy => drawEnemy(enemy));
        drawPlayerHealth();
        drawLevelInfo();
        drawPauseMenu();
    } else if (currentGameState === gameState.STORE_SCREEN) {
        drawStoreScreen();
        ctx.drawImage(images.hud, 0, 120);
        drawCurrency();
        drawPlayerHealth();
        drawAmmoType();
    } else if (currentGameState === gameState.RESTAURANT_SCREEN) {
        drawRestaurantScreen();
        ctx.drawImage(images.hud, 0, 120);
        drawCurrency();
        drawPlayerHealth();
        drawAmmoType();
    } else if (currentGameState === gameState.ROBBERY_SCREEN) {
        drawRobberyScreen();
        ctx.drawImage(images.hud, 0, 120);
        drawCurrency();
        drawPlayerHealth();
        drawAmmoType();
    } else if (currentGameState === gameState.ROBBERY_SUCCESS) {
        drawRobberySuccessScreen();
        ctx.drawImage(images.hud, 0, 120);
        drawCurrency();
        drawPlayerHealth();
        drawAmmoType();
    } else if (currentGameState === gameState.ROBBERY_FAILURE) {
        drawRobberyFailureScreen();
        ctx.drawImage(images.hud, 0, 120);
        drawCurrency();
        drawPlayerHealth();
        drawAmmoType();
    } else if (currentGameState === gameState.GAME_OVER) {
        drawGameOverScreen();
    }

    requestAnimationFrame(gameLoop);
};

requestAnimationFrame(gameLoop);