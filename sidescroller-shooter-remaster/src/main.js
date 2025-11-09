const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { preloadImages, preloadSounds } from './graphics_loader.js';
import { gameState } from './constants.js';

let player;
let enemies = [];
let currentGameState = gameState.MAIN_MENU;

function initializeGame() {
    player = new Player();
    enemies = initializeEnemiesForLevel(1);
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentGameState === gameState.MAIN_MENU) {
        drawMainMenu();
    } else if (currentGameState === gameState.PLAYING) {
        updateGame();
        drawGame();
    }

    requestAnimationFrame(gameLoop);
}

function updateGame() {
    player.update();
    enemies.forEach(enemy => enemy.update());
    checkCollisions();
}

function drawGame() {
    player.draw(ctx);
    enemies.forEach(enemy => enemy.draw(ctx));
}

function checkCollisions() {
    // Collision detection logic here
}

function drawMainMenu() {
    // Main menu drawing logic here
}

preloadImages().then(() => {
    preloadSounds().then(() => {
        initializeGame();
    });
});