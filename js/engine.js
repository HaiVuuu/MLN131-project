import { CONFIG, SETTINGS } from './config.js';
import { Player } from './player.js';
import { Environment } from './environment.js';
import { UIManager } from './ui.js';
import { ObjectManager } from './objectManager.js';

export class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId); this.ctx = this.canvas.getContext('2d');
        this.player = new Player(); this.env = new Environment(); this.ui = new UIManager(); this.objManager = new ObjectManager();
        this.state = 'MENU'; this.frameCount = 0; this.speed = CONFIG.baseSpeed; this.lastTime = 0; this.deathTimer = 0;
        this.touchStartX = 0; this.touchStartY = 0; this.touchIsHandled = false;
        
        // BIẾN RUNG MÀN HÌNH
        this.shakeTimer = 0; 
        this.shakeIntensity = 0;

        this.bindEvents();
    }

    triggerShake(durationFrames, intensity = 10) {
        if (SETTINGS.screenShake) {
            this.shakeTimer = durationFrames;
            this.shakeIntensity = intensity;
        }
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state === 'PLAYING') this.state = 'PAUSED';
            if (this.state !== 'PLAYING') return;
            if (e.key === 'ArrowLeft' || e.key === 'a') this.player.moveLeft();
            if (e.key === 'ArrowRight' || e.key === 'd') this.player.moveRight();
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') this.player.jump(this.speed);
        });

        // XỬ LÝ CLICK CHUỘT / TAP VÀO UI
        const handleTap = (clientX, clientY) => {
            let rect = this.canvas.getBoundingClientRect();
            let x = clientX - rect.left; let y = clientY - rect.top;

            if (this.state === 'MENU' || this.state === 'GAMEOVER') {
                this.startGame();
            } else if (this.state === 'PLAYING') {
                // Click nút Pause (Góc phải trên)
                if (x > CONFIG.canvasWidth - 60 && y > 50 && y < 110) {
                    this.state = 'PAUSED';
                }
            } else if (this.state === 'PAUSED') {
                // Click TIẾP TỤC
                if (y > CONFIG.canvasHeight/2 - 30 && y < CONFIG.canvasHeight/2 + 20) this.state = 'PLAYING';
                // Click CÀI ĐẶT
                if (y > CONFIG.canvasHeight/2 + 40 && y < CONFIG.canvasHeight/2 + 90) this.state = 'SETTINGS';
            } else if (this.state === 'SETTINGS') {
                // Click Toggle Rung
                if (y > CONFIG.canvasHeight/2 && y < CONFIG.canvasHeight/2 + 40) SETTINGS.screenShake = !SETTINGS.screenShake;
                // Click TRỞ LẠI
                if (y > CONFIG.canvasHeight/2 + 80 && y < CONFIG.canvasHeight/2 + 125) this.state = 'PAUSED';
            }
        };

        this.canvas.addEventListener('mousedown', (e) => { handleTap(e.clientX, e.clientY); });

        this.canvas.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX; this.touchStartY = e.touches[0].clientY; this.touchIsHandled = false;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); 
            if (this.state !== 'PLAYING' || this.touchIsHandled) return;

            let touchCurrentX = e.touches[0].clientX; let touchCurrentY = e.touches[0].clientY;
            let swipeDistX = touchCurrentX - this.touchStartX; let swipeDistY = touchCurrentY - this.touchStartY;
            let threshold = 30; 

            if (Math.abs(swipeDistX) > Math.abs(swipeDistY)) {
                if (swipeDistX > threshold) { this.player.moveRight(); this.touchIsHandled = true; } 
                else if (swipeDistX < -threshold) { this.player.moveLeft(); this.touchIsHandled = true; }
            } else {
                if (swipeDistY < -threshold) { this.player.jump(this.speed); this.touchIsHandled = true; }
            }
        }, { passive: false }); 

        this.canvas.addEventListener('touchend', (e) => {
            if (!this.touchIsHandled) {
                // Lấy tọa độ cuối cùng để check nút bấm (Tap)
                handleTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
        });
    }

    startGame() {
        this.player.reset(); this.objManager.reset(); this.ui.reset();
        this.speed = CONFIG.baseSpeed; this.frameCount = 0; this.deathTimer = 0; 
        this.lastTime = performance.now(); this.state = 'PLAYING';
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp || performance.now();
        let deltaTime = (timestamp || performance.now()) - this.lastTime; this.lastTime = timestamp || performance.now();
        if (deltaTime > 100) deltaTime = 100; let fpsMultiplier = deltaTime / 16.6667; 

        this.ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        // NẾU PAUSE, KHÔNG CẬP NHẬT LOGIC, CHỈ VẼ LẠI MÀN HÌNH ĐỨNG IM
        if (this.state === 'PLAYING') {
            this.frameCount += fpsMultiplier;
            let targetSpeed = CONFIG.baseSpeed + (Math.sqrt(Math.max(0, this.player.score)) / 316) * (CONFIG.maxSpeed - CONFIG.baseSpeed);
            this.speed += (Math.min(CONFIG.maxSpeed, targetSpeed) - this.speed) * 0.02 * fpsMultiplier;

            if (this.player.update(deltaTime) === 'DIED') { this.state = 'DYING'; this.triggerShake(30, 15); }
            
            // TRUYỀN ENGINE VÀO OBJ_MANAGER ĐỂ KÍCH HOẠT RUNG
            this.objManager.update(fpsMultiplier, this.player, this.ui, this.frameCount, this.speed, this);
            
            if (this.player.isDead && this.state !== 'DYING') { this.state = 'DYING'; this.triggerShake(30, 15); }
            this.ui.updateFloatingTexts(fpsMultiplier);
        } else if (this.state === 'DYING') {
            this.deathTimer += fpsMultiplier; if (this.deathTimer > 60) this.state = 'GAMEOVER';
        }

        // ==========================================
        // ÁP DỤNG RUNG MÀN HÌNH (SCREEN SHAKE) TRƯỚC KHI VẼ
        // ==========================================
        this.ctx.save();
        if (this.shakeTimer > 0 && SETTINGS.screenShake) {
            let dx = (Math.random() - 0.5) * this.shakeIntensity;
            let dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(dx, dy);
            this.shakeTimer -= fpsMultiplier;
        }

        this.env.update(this.state === 'PLAYING' ? fpsMultiplier : 0, this.frameCount, this.player.phase);
        this.env.draw(this.ctx);

        if (this.state !== 'MENU') {
            this.env.drawFog(this.ctx);
            let finalSpeed = this.speed * Math.max(this.player.buffs.dash > 0 ? 1.8 : 1, this.player.rushHourTimer > 0 ? 2.2 : 1);
            this.env.drawRoadLines(this.ctx, this.frameCount, this.state === 'PLAYING' ? finalSpeed : 0);
            
            this.objManager.draw(this.ctx, this.env, this.frameCount);
            this.player.draw(this.ctx, this.frameCount, this.speed);
            this.ui.drawFloatingTexts(this.ctx);
        }
        
        this.ctx.restore(); // KẾT THÚC RUNG (UI Menu KHÔNG BỊ RUNG THEO)
        
        this.ui.draw(this.ctx, this.state, this.player);
        requestAnimationFrame((ts) => this.loop(ts));
    }
}