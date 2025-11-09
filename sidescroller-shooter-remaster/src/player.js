class Player {
    constructor(x, y, width, height, health) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.health = health;
        this.speed = 4.5;
        this.facingRight = true;
        this.sprite = null; // Placeholder for player sprite
        this.lastShootTime = 0;
        this.shootCooldown = 200;
        this.ammoInventory = {
            standard: Infinity,
            highDamage: 0,
            penetration: 0,
        };
        this.selectedAmmoType = 'standard';
    }

    update(keys) {
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['w']) dy = -this.speed;
        if (keys['ArrowDown'] || keys['s']) dy = this.speed;
        if (keys['ArrowLeft'] || keys['a']) {
            dx = -this.speed;
            this.facingRight = false;
        }
        if (keys['ArrowRight'] || keys['d']) {
            dx = this.speed;
            this.facingRight = true;
        }

        this.x += dx;
        this.y += dy;

        // Keep the player within the bounds of the canvas
        const minY = 200;
        const maxY = 440;
        if (this.x < 0) this.x = 0;
        if (this.y < minY) this.y = minY;
        if (this.y > maxY) this.y = maxY;
    }

    draw(ctx) {
        ctx.save();
        if (!this.facingRight) {
            ctx.scale(-1, 1);
            ctx.drawImage(this.sprite, this.x + this.width, this.y, -this.width, this.height);
        } else {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }

    shoot(bullets) {
        const currentTime = Date.now();
        if (currentTime - this.lastShootTime >= this.shootCooldown) {
            if (this.ammoInventory[this.selectedAmmoType] > 0 || this.selectedAmmoType === 'standard') {
                const bullet = {
                    x: this.facingRight ? this.x + this.width : this.x,
                    y: this.y + this.height / 2,
                    width: 10,
                    height: 5,
                    speed: this.facingRight ? 10 : -10,
                    damage: this.selectedAmmoType === 'highDamage' ? 30 : 15,
                };
                bullets.push(bullet);
                this.lastShootTime = currentTime;

                if (this.selectedAmmoType !== 'standard') {
                    this.ammoInventory[this.selectedAmmoType]--;
                }
            }
        }
    }
}

export default Player;