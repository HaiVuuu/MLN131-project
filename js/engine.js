import { CONFIG } from './config.js';
import { Player } from './player.js';
import { Environment } from './environment.js';
import { UIManager } from './ui.js';
import { ObjectManager } from './objectManager.js';

export class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId); this.ctx = this.canvas.getContext('2d');
        this.player = new Player(); this.env = new Environment(); this.ui = new UIManager(); this.objManager = new ObjectManager();
        this.state = 'MENU'; this.frameCount = 0; this.speed = CONFIG.baseSpeed; this.lastTime = 0; this.deathTimer = 0;
        this.touchStartX = 0; this.touchStartY = 0; this.touchEndX = 0; this.touchEndY = 0;
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'PLAYING') return;
            if (e.key === 'ArrowLeft' || e.key === 'a') this.player.moveLeft();
            if (e.key === 'ArrowRight' || e.key === 'd') this.player.moveRight();
            // TRUYỀN TỐC ĐỘ HIỆN TẠI VÀO HÀM JUMP
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') this.player.jump(this.speed);
        });

        this.canvas.addEventListener('mousedown', () => { if (this.state === 'MENU' || this.state === 'GAMEOVER') this.startGame(); });

        this.canvas.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX; this.touchStartY = e.changedTouches[0].screenY; 
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX; this.touchEndY = e.changedTouches[0].screenY;
            let swipeDistX = this.touchEndX - this.touchStartX; let swipeDistY = this.touchEndY - this.touchStartY;
            
            if (this.state === 'PLAYING') {
                if (Math.abs(swipeDistX) > Math.abs(swipeDistY)) {
                    if (swipeDistX > 40) this.player.moveRight(); else if (swipeDistX < -40) this.player.moveLeft();
                } else {
                    // TRUYỀN TỐC ĐỘ HIỆN TẠI VÀO HÀM JUMP QUA ĐIỆN THOẠI
                    if (swipeDistY < -40) this.player.jump(this.speed); 
                }
            } else if (Math.abs(swipeDistX) < 40 && Math.abs(swipeDistY) < 40) {
                if (this.state === 'MENU' || this.state === 'GAMEOVER') this.startGame();
            }
        }, { passive: true });
    }

    startGame() { this.player.reset(); this.objManager.reset(); this.ui.reset(); this.speed = CONFIG.baseSpeed; this.frameCount = 0; this.deathTimer = 0; this.lastTime = performance.now(); this.state = 'PLAYING'; }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp || performance.now();
        let deltaTime = (timestamp || performance.now()) - this.lastTime; this.lastTime = timestamp || performance.now();
        if (deltaTime > 100) deltaTime = 100; let fpsMultiplier = deltaTime / 16.6667; 
        this.ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        if (this.state === 'PLAYING') {
            this.frameCount += fpsMultiplier;
            let targetSpeed = CONFIG.baseSpeed + (Math.sqrt(Math.max(0, this.player.score)) / 316) * (CONFIG.maxSpeed - CONFIG.baseSpeed);
            this.speed += (Math.min(CONFIG.maxSpeed, targetSpeed) - this.speed) * 0.02 * fpsMultiplier;

            if (this.player.update(deltaTime) === 'DIED') this.state = 'DYING';
            this.objManager.update(fpsMultiplier, this.player, this.ui, this.frameCount, this.speed);
            if (this.player.isDead) this.state = 'DYING';
            this.ui.updateFloatingTexts(fpsMultiplier);
        } else if (this.state === 'DYING') {
            this.deathTimer += fpsMultiplier; if (this.deathTimer > 60) this.state = 'GAMEOVER';
        }

        this.env.update(fpsMultiplier, this.frameCount, this.player.phase); this.env.draw(this.ctx);

        if (this.state !== 'MENU') {
            this.env.drawFog(this.ctx);
            let finalSpeed = this.speed * Math.max(this.player.buffs.dash > 0 ? 1.8 : 1, this.player.rushHourTimer > 0 ? 2.2 : 1);
            this.env.drawRoadLines(this.ctx, this.frameCount, finalSpeed);
            this.objManager.draw(this.ctx, this.env, this.frameCount);
            this.player.draw(this.ctx, this.frameCount, this.speed);
            this.ui.drawFloatingTexts(this.ctx);
        }
        this.ui.draw(this.ctx, this.state, this.player);
        requestAnimationFrame((ts) => this.loop(ts));
    }
}