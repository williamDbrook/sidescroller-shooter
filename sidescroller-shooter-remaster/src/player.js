import { images } from './graphics_loader.js'; // or adjust path to match your loader

export class Player {
    constructor(x = 50, y = 0, width = 40, height = 60, health = 100, weight = 1.5) {
        this.x = x;
        this.y = y; // logical baseline (anchored to ground later)
        this.width = width;
        this.height = height;
        this.health = health;

        // physics / weight
        this.mass = Math.max(0.2, weight);      // heavier -> slower acceleration
        this.maxSpeed = 5.2;                    // horizontal top speed
        this.acceleration = 0.6 / this.mass;    // applied while pressing left/right
        this.friction = 0.15 * this.mass;       // deceleration when no input
        this.vx = 0;                             // horizontal velocity

        // depth (into/out of scene)
        this.depth = 0;                          // 0=foreground, 1=far
        this.vDepth = 0;                         // velocity for depth movement
        this.depthAccel = 0.03 / this.mass;     // how fast depth velocity changes
        this.depthFriction = 0.02 * this.mass;  // damping for depth movement
        this.minScale = 0.55;                    // smallest scale at depth=1

        // shooting / sprite
        this.facingRight = true;
        this.lastShootTime = 0;
        this.shootCooldown = 200;
        this._warnedMissingImage = false;

        // source rectangle in the player sprite sheet (sx,sy,swidth,sheight)
        this.spriteRect = { x: 3248, y: 186, w: 186, h: 186 }; // adjust to your sprite sheet frame size

        // draw metrics (computed each frame)
        this._drawX = this.x;
        this._drawY = this.y;
        this._drawW = this.width;
        this._drawH = this.height;

        // animation / spritesheet
        this.sheetFrameW = 186;    // provided by you
        this.sheetFrameH = 186;    // provided by you
        this.sheetFrameIndex = 0;
        this.sheetFrameCount = 0;  // computed after image loads
        this.animFps = 9;         // frames per second for walk animation
        this._lastAnimTime = performance.now();
        this.idleFrame = 0;        // which frame to show when idle
        this.animatingWhenMoving = true;
    }

    // accepts keysState and performs physics integration each frame
    update(keysState = {}) {
        const left = keysState.ArrowLeft || keysState.a || keysState.A;
        const right = keysState.ArrowRight || keysState.d || keysState.D;
        const up = keysState.ArrowUp || keysState.w || keysState.W;     // move "back" (away)
        const down = keysState.ArrowDown || keysState.s || keysState.S; // move "closer"

        // Horizontal acceleration
        if (left) {
            this.vx -= this.acceleration;
            this.facingRight = false;
        } else if (right) {
            this.vx += this.acceleration;
            this.facingRight = true;
        } else {
            // apply friction (damping) when no horizontal input
            if (this.vx > 0) {
                this.vx = Math.max(0, this.vx - this.friction);
            } else if (this.vx < 0) {
                this.vx = Math.min(0, this.vx + this.friction);
            }
        }

        // Clamp horizontal speed and integrate position
        this.vx = Math.max(-this.maxSpeed, Math.min(this.vx, this.maxSpeed));
        this.x += this.vx;

        // Depth control: make vertical (depth) movement produce the same drawn-pixel speed
        const canvas = (typeof document !== 'undefined') ? (document.getElementById('gameCanvas') || document.querySelector('canvas')) : null;
        const groundOffset = 20;
        const topY = 60;
        let drawRange = 1;
        let groundY = 0;
        if (canvas) {
            groundY = Math.max(0, canvas.height - this.height - groundOffset);
            drawRange = Math.max(1, groundY - topY);
        }

        // Determine desired vertical pixel speed: prefer current horizontal speed, fall back to maxSpeed
        const horizSpeed = Math.max(Math.abs(this.vx), this.maxSpeed * 0.6);

        // desiredDY: positive means move "up" on screen (away), negative means move "down" (closer)
        let desiredDY = 0;
        if (up) desiredDY = horizSpeed;      // Up -> away (positive)
        else if (down) desiredDY = -horizSpeed; // Down -> closer (negative)

        // convert desired pixel change to depth delta (depth is 0..1)
        const depthDelta = desiredDY / drawRange;

        // Apply depth change directly (clamped). This ties drawn Y speed to horizontal speed.
        if (up || down) {
            this.depth = Math.max(0, Math.min(1, this.depth + depthDelta));
            // small damping to avoid jitter
            this.vDepth *= 0.6;
        } else {
            // gentle damping of any leftover vDepth to stabilize depth over time
            this.vDepth *= 0.85;
            this.depth = Math.max(0, Math.min(1, this.depth + this.vDepth));
        }

        // compute draw coordinates and scale based on depth (perspective)
        if (canvas) {
            // scale smaller as depth increases (farther away)
            const scale = 1 - this.depth * (1 - this.minScale);

            this._drawW = Math.max(4, Math.round(this.width * scale));
            this._drawH = Math.max(4, Math.round(this.height * scale));

            // slight perspective shift: moving away pulls X toward center a bit
            const xOffset = (canvas.width / 2 - this.x) * (this.depth * 0.06);
            this._drawX = Math.round(this.x + xOffset);
            this._drawY = Math.round(groundY - (groundY - topY) * this.depth);

            // clamp drawn X so sprite stays onscreen
            this._drawX = Math.max(0, Math.min(this._drawX, canvas.width - this._drawW));
        } else {
            this._drawX = this.x;
            this._drawY = this.y;
            this._drawW = this.width;
            this._drawH = this.height;
        }

        // compute whether we should animate (simple rule: animate when moving horizontally or depth changing)
        const isMoving = Math.abs(this.vx) > 0.1 || Math.abs(this.vDepth || 0) > 0.001;

        // update animation based on time
        const now = performance.now();
        // compute frame count if not yet set and image is available
        const img = (typeof images !== 'undefined' && images && images.player) ? images.player : (window._images && window._images.player) ? window._images.player : null;
        if (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0 && this.sheetFrameCount === 0) {
            this.sheetFrameCount = Math.floor(img.naturalWidth / this.sheetFrameW) || 1;
            // clamp idleFrame
            if (this.idleFrame >= this.sheetFrameCount) this.idleFrame = 0;
        }

        if (this.animatingWhenMoving && isMoving && this.sheetFrameCount > 1) {
            const msPerFrame = 1000 / Math.max(1, this.animFps);
            if (now - this._lastAnimTime >= msPerFrame) {
                // advance by however many frames elapsed (handles frame drops)
                const framesElapsed = Math.floor((now - this._lastAnimTime) / msPerFrame);
                this.sheetFrameIndex = (this.sheetFrameIndex + framesElapsed) % this.sheetFrameCount;
                this._lastAnimTime = now;
            }
        } else {
            // not moving: snap to idle frame
            this.sheetFrameIndex = this.idleFrame;
            this._lastAnimTime = now;
        }
    }

    draw(ctx) {
        // computed draw coordinates/size: this._drawX/_drawY/_drawW/_drawH
        const dx = this._drawX || 0;
        const dy = this._drawY || 0;
        const dw = this._drawW || this.width || 40;
        const dh = this._drawH || this.height || 60;

        const img = (typeof images !== 'undefined' && images && images.player) ? images.player : (window._images && window._images.player) ? window._images.player : null;
        const validImage = img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;

        if (validImage) {
            // ensure frameCount is computed (safety)
            if (!this.sheetFrameCount) this.sheetFrameCount = Math.max(1, Math.floor(img.naturalWidth / this.sheetFrameW));

            // compute source rect for current frame (clamp index)
            const fi = Math.max(0, Math.min(this.sheetFrameIndex, this.sheetFrameCount - 1));
            const sx = fi * this.sheetFrameW;
            const sy = 0;
            const sw = this.sheetFrameW;
            const sh = this.sheetFrameH;

            try {
                if (this.facingRight) {
                    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
                } else {
                    ctx.save();
                    ctx.translate(dx + dw, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, sx, sy, sw, sh, 0, dy, dw, dh);
                    ctx.restore();
                }
            } catch (e) {
                // fallback placeholder (keeps silent after first warning)
                if (!this._warnedMissingImage) {
                    console.warn('player.draw: drawImage failed, using placeholder', e);
                    this._warnedMissingImage = true;
                }
                ctx.fillStyle = 'cyan';
                ctx.fillRect(dx, dy, dw, dh);
            }
        } else {
            // placeholder if image isn't ready
            ctx.fillStyle = 'cyan';
            ctx.fillRect(dx, dy, dw, dh);
        }
    }

    shoot(bullets) {
        const currentTime = Date.now();
        if (currentTime - this.lastShootTime >= this.shootCooldown) {
            const bullet = {
                x: this.facingRight ? this.x + this.width : this.x - 10,
                y: this._drawY + this._drawH / 2,
                width: 10,
                height: 5,
                speed: this.facingRight ? 10 : -10,
                damage: 15
            };
            bullets.push(bullet);
            this.lastShootTime = currentTime;
        }
    }
}