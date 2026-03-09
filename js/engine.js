import { CONFIG, SETTINGS } from './config.js';
import { Player } from './player.js';
import { Environment } from './environment.js';
import { UIManager } from './ui.js';
import { ObjectManager } from './objectManager.js';
import { audio } from './audio.js';

export class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId); this.ctx = this.canvas.getContext('2d');
        this.player = new Player(); this.env = new Environment(); this.ui = new UIManager(); this.objManager = new ObjectManager();
        this.state = 'MENU'; this.frameCount = 0; this.speed = CONFIG.baseSpeed; this.lastTime = 0; this.deathTimer = 0;
        this.touchStartX = 0; this.touchStartY = 0; this.touchIsHandled = false;
        this.shakeTimer = 0; this.shakeIntensity = 0;
        this.bindEvents();
    }

    triggerShake(durationFrames, intensity = 10) {
        if (SETTINGS.screenShake) { this.shakeTimer = durationFrames; this.shakeIntensity = intensity; }
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state === 'PLAYING') { this.state = 'PAUSED'; audio.pauseBGM(); }
            if (this.state !== 'PLAYING') return;
            if (e.key === 'ArrowLeft' || e.key === 'a') this.player.moveLeft();
            if (e.key === 'ArrowRight' || e.key === 'd') this.player.moveRight();
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') this.player.jump(this.speed);
            if (e.key === 'ArrowDown' || e.key === 's') this.player.fastFall();
        });

        const handleTap = (clientX, clientY) => {
            let rect = this.canvas.getBoundingClientRect(); 
            let x = clientX - rect.left; let y = clientY - rect.top;
            let cx = CONFIG.canvasWidth / 2; let cy = CONFIG.canvasHeight / 2;

            if (this.state === 'MENU' || this.state === 'GAMEOVER') { 
                this.startGame(); 
            } else if (this.state === 'PLAYING') { 
                // Hitbox nút Pause
                if (x > CONFIG.canvasWidth - 60 && y > 50 && y < 110) { this.state = 'PAUSED'; audio.pauseBGM(); } 
            } else if (this.state === 'PAUSED') {
                if (y > cy - 30 && y < cy + 20) { this.state = 'PLAYING'; audio.playBGM(); }
                if (y > cy + 40 && y < cy + 90) this.state = 'SETTINGS';
            } else if (this.state === 'SETTINGS') {
                // Hitbox Rung màn hình
                if (y > cy - 90 && y < cy - 60) SETTINGS.screenShake = !SETTINGS.screenShake;

                // Hitbox BGM Volume (Nút [-] và [+])
                let bgmY = cy - 30 + 10; // yPos + 10 của BGM
                if (y > bgmY && y < bgmY + 30) {
                    if (x > cx - 85 && x < cx - 55) { SETTINGS.bgmVolume = Math.max(0, Math.round((SETTINGS.bgmVolume - 0.1)*10)/10); audio.updateBGMVolume(); } // Nút [-]
                    if (x > cx + 55 && x < cx + 85) { SETTINGS.bgmVolume = Math.min(1, Math.round((SETTINGS.bgmVolume + 0.1)*10)/10); audio.updateBGMVolume(); } // Nút [+]
                }

                // Hitbox SFX Volume (Nút [-] và [+])
                let sfxY = cy + 50 + 10; // yPos + 10 của SFX
                if (y > sfxY && y < sfxY + 30) {
                    if (x > cx - 85 && x < cx - 55) { SETTINGS.sfxVolume = Math.max(0, Math.round((SETTINGS.sfxVolume - 0.1)*10)/10); audio.play('coin', 1); } // Nút [-] phát tiếng ping test
                    if (x > cx + 55 && x < cx + 85) { SETTINGS.sfxVolume = Math.min(1, Math.round((SETTINGS.sfxVolume + 0.1)*10)/10); audio.play('coin', 1); } // Nút [+] phát tiếng ping test
                }

                // Hitbox Nút TRỞ LẠI
                if (y > cy + 130 && y < cy + 170) this.state = 'PAUSED';
            }
        };

        this.canvas.addEventListener('mousedown', (e) => { handleTap(e.clientX, e.clientY); });
        this.canvas.addEventListener('touchstart', (e) => { this.touchStartX = e.touches[0].clientX; this.touchStartY = e.touches[0].clientY; this.touchIsHandled = false; }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); 
            if (this.state !== 'PLAYING' || this.touchIsHandled) return;
            let swipeDistX = e.touches[0].clientX - this.touchStartX; let swipeDistY = e.touches[0].clientY - this.touchStartY;
            let threshold = 30; 
            if (Math.abs(swipeDistX) > Math.abs(swipeDistY)) {
                if (swipeDistX > threshold) { this.player.moveRight(); this.touchIsHandled = true; } else if (swipeDistX < -threshold) { this.player.moveLeft(); this.touchIsHandled = true; }
            } else {
                if (swipeDistY < -threshold) { this.player.jump(this.speed); this.touchIsHandled = true; } else if (swipeDistY > threshold) { this.player.fastFall(); this.touchIsHandled = true; }
            }
        }, { passive: false }); 
        this.canvas.addEventListener('touchend', (e) => { if (!this.touchIsHandled) handleTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY); });
    }

    startGame() { 
        audio.init(); 
        this.player.reset(); this.objManager.reset(); this.ui.reset(); 
        this.speed = CONFIG.baseSpeed; this.frameCount = 0; this.deathTimer = 0; 
        this.lastTime = performance.now(); this.state = 'PLAYING'; 
        audio.playBGM(); 
    }
    
    setGameOver() { this.state = 'DYING'; audio.pauseBGM(); audio.play('gameover', 0.8); }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp || performance.now();
        let deltaTime = (timestamp || performance.now()) - this.lastTime; this.lastTime = timestamp || performance.now();
        if (deltaTime > 100) deltaTime = 100; let fpsMultiplier = deltaTime / 16.6667; 
        this.ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        if (this.state === 'PLAYING') {
            this.frameCount += fpsMultiplier;
            let targetSpeed = CONFIG.baseSpeed + (Math.sqrt(Math.max(0, this.player.score)) / 316) * (CONFIG.maxSpeed - CONFIG.baseSpeed);
            this.speed += (Math.min(CONFIG.maxSpeed, targetSpeed) - this.speed) * 0.02 * fpsMultiplier;

            if (this.player.update(deltaTime) === 'DIED') this.setGameOver();
            this.objManager.update(fpsMultiplier, this.player, this.ui, this.frameCount, this.speed, this);
            if (this.player.isDead && this.state !== 'DYING') this.setGameOver();
            this.ui.updateFloatingTexts(fpsMultiplier);
        } else if (this.state === 'DYING') {
            this.deathTimer += fpsMultiplier; if (this.deathTimer > 60) this.state = 'GAMEOVER';
        }

        this.ctx.save();
        if (this.shakeTimer > 0 && SETTINGS.screenShake) { let dx = (Math.random() - 0.5) * this.shakeIntensity; let dy = (Math.random() - 0.5) * this.shakeIntensity; this.ctx.translate(dx, dy); this.shakeTimer -= fpsMultiplier; }
        this.env.update(this.state === 'PLAYING' ? fpsMultiplier : 0, this.frameCount, this.player.phase); this.env.draw(this.ctx);

        if (this.state !== 'MENU') {
            this.env.drawFog(this.ctx);
            let finalSpeed = this.speed * Math.max(this.player.buffs.dash > 0 ? 1.8 : 1, this.player.rushHourTimer > 0 ? 2.2 : 1);
            this.env.drawRoadLines(this.ctx, this.frameCount, this.state === 'PLAYING' ? finalSpeed : 0);
            this.objManager.draw(this.ctx, this.env, this.frameCount);
            this.player.draw(this.ctx, this.frameCount, this.speed);
            this.ui.drawFloatingTexts(this.ctx);
        }
        this.ctx.restore(); 
        this.ui.draw(this.ctx, this.state, this.player);
        requestAnimationFrame((ts) => this.loop(ts));
    }
}