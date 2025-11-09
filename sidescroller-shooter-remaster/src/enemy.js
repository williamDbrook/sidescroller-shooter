class Enemy {
    constructor(x, y, width, height, health) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.health = health;
        this.speed = 2.5;
        this.facingLeft = true;
        this.animationTimer = 0;
        this.animationSpeed = 25;
        this.frameX = 0;
        this.totalFrames = 10;
        this.image = null; // This will be set when loading the enemy sprite
    }

    update() {
        // Update enemy logic here (e.g., movement, animation)
        this.animationTimer++;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            this.frameX = (this.frameX + 1) % this.totalFrames;
        }
    }

    draw(ctx) {
        if (!this.image) return;

        ctx.save();
        if (this.facingLeft) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.image,
                this.frameX * this.width, 0, this.width, this.height,
                -this.x - this.width, this.y, this.width, this.height
            );
        } else {
            ctx.drawImage(
                this.image,
                this.frameX * this.width, 0, this.width, this.height,
                this.x, this.y, this.width, this.height
            );
        }
        ctx.restore();
    }

    moveTowardPlayer(player) {
        const directionX = player.x - this.x;
        const directionY = player.y - this.y;
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);

        if (magnitude > 0) {
            this.x += (directionX / magnitude) * this.speed;
            this.y += (directionY / magnitude) * this.speed;
            this.facingLeft = directionX < 0;
        }
    }
}

// If you already have enemy initialization logic, replace this stub with it.
// Otherwise this exported function provides initializeEnemiesForLevel so main.js can call it.
export function initializeEnemiesForLevel(level = 1) {
    const enemies = [];
    for (let i = 0; i < level; i++) {
        enemies.push({
            x: 800 + i * 160,
            y: 80 + (i % 4) * 48,
            hp: 1,
            type: 'grunt'
        });
    }
    return enemies;
}

export default Enemy;