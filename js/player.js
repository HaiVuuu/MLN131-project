import { CONFIG } from './config.js';
import { Utils } from './utils.js';

export class Player {
    constructor() { this.reset(); }
    
    reset() {
        this.lane = 2; this.z = 50; this.score = 0; this.phase = 1; 
        this.color = '#3498db'; this.headColor = '#f1c27d'; this.isDead = false;
        this.buffs = { x2: 0, shield: 0, magnet: 0, dash: 0 };
        this.collectedLetters = 0; this.rushHourTimer = 0;
        this.jumpY = 0; this.velocityY = 0; this.isJumping = false;
        this.pickNextWord();
    }
    
    pickNextWord() { let randomIndex = Math.floor(Math.random() * CONFIG.targetWords.length); this.currentWord = CONFIG.targetWords[randomIndex]; this.collectedLetters = 0; }
    moveLeft() { if (this.lane > 0 && !this.isDead) this.lane--; }
    moveRight() { if (this.lane < 4 && !this.isDead) this.lane++; }
    
    jump(currentSpeed = CONFIG.baseSpeed) {
        if (!this.isJumping && !this.isDead) {
            this.isJumping = true;
            let speedBonus = (currentSpeed - CONFIG.baseSpeed) * 0.6;
            this.velocityY = CONFIG.jumpVelocity + speedBonus;
        }
    }

    update(deltaTime) {
        let fpsMult = deltaTime / 16.6667;
        if (this.isJumping) {
            this.jumpY += this.velocityY * fpsMult; this.velocityY -= CONFIG.gravity * fpsMult;
            if (this.jumpY <= 0) { this.jumpY = 0; this.isJumping = false; this.velocityY = 0; }
        }

        if (this.buffs.x2 > 0) this.buffs.x2 -= deltaTime; if (this.buffs.shield > 0) this.buffs.shield -= deltaTime;
        if (this.buffs.magnet > 0) this.buffs.magnet -= deltaTime; if (this.buffs.dash > 0) this.buffs.dash -= deltaTime;
        if (this.rushHourTimer > 0) this.rushHourTimer -= deltaTime;

        if (this.score >= 100000) { this.phase = 5; this.color = '#f1c40f'; } 
        else if (this.score >= 30000) { this.phase = 4; this.color = '#2c3e50'; } 
        else if (this.score >= 5000) { this.phase = 3; this.color = '#27ae60'; } 
        else if (this.score >= 1000) { this.phase = 2; this.color = '#ecf0f1'; } 
        else if (this.score < 0 && this.buffs.dash <= 0 && this.rushHourTimer <= 0) { this.isDead = true; return 'DIED'; } 
        else { this.phase = 1; this.color = '#3498db'; } 
        
        return 'ALIVE';
    }

    draw(ctx, frameCount, speed) {
        let p = Utils.project(CONFIG.lanes[this.lane], this.jumpY, this.z);
        if (!p) return;
        let s = p.scale;
        
        ctx.save();
        if (this.isDead) { ctx.translate(p.x, p.y - 20*s); ctx.rotate(Math.PI / 2); p.x = 0; p.y = 0; }
        
        let bounce = this.isDead ? 0 : Math.abs(Math.sin(frameCount * (speed*0.03))) * 12 * s; 
        let legSwing = this.isDead ? 20*s : Math.sin(frameCount * (speed*0.03)) * 18 * s;
        let armSwing = this.isDead ? -20*s : Math.cos(frameCount * (speed*0.03)) * 15 * s;
        let py = p.y - bounce; let bY = py - 80*s; let bW = 36*s; let bH = 55*s;

        // VẼ BÓNG
        ctx.shadowBlur = 0; 
        if (!this.isDead) { 
            let shadowP = Utils.project(CONFIG.lanes[this.lane], 0, this.z); 
            let shadowAlpha = Math.max(0.1, 0.6 - (this.jumpY / 200));
            let shadowSize = Math.max(10, 28 - (this.jumpY / 10));
            if(shadowP) { ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`; ctx.beginPath(); ctx.ellipse(shadowP.x, shadowP.y + 10*shadowP.scale, shadowSize*shadowP.scale, 10*shadowP.scale, 0, 0, Math.PI*2); ctx.fill(); }
        }

        // HIỆU ỨNG BUFFS QUANH NGƯỜI/XE
        if (!this.isDead) {
            if (this.buffs.magnet > 0) { ctx.strokeStyle = `rgba(155, 89, 182, ${0.5 + Math.sin(frameCount*0.4)*0.5})`; ctx.lineWidth = 5*s; ctx.beginPath(); ctx.ellipse(p.x, py - 40*s, 90*s + bounce, 40*s, 0, 0, Math.PI*2); ctx.stroke(); }
            if (this.buffs.shield > 0) { ctx.fillStyle = `rgba(52, 152, 219, 0.3)`; ctx.beginPath(); ctx.arc(p.x, py - 40*s, 70*s, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#3498db'; ctx.lineWidth = 2*s; ctx.stroke(); }
        }

        // ==========================================
        // VẼ XE HƠI THỂ THAO KHI DASH HOẶC RUSH HOUR
        // ==========================================
        if (this.rushHourTimer > 0 || this.buffs.dash > 0) {
            let carW = 80 * s; let carH = 50 * s; let carY = py - carH + 10*s;
            let carColor = this.rushHourTimer > 0 ? '#ff4757' : '#00ffff';

            // Hiệu ứng lửa/khói phản lực
            ctx.fillStyle = '#ffa502';
            ctx.beginPath(); ctx.arc(p.x - 25*s, carY + carH, (10 + Math.random()*10)*s, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + 25*s, carY + carH, (10 + Math.random()*10)*s, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath(); ctx.arc(p.x, carY + carH + 15*s, (15 + Math.random()*15)*s, 0, Math.PI*2); ctx.fill();

            // Thân xe dưới
            ctx.fillStyle = carColor;
            ctx.beginPath(); ctx.roundRect(p.x - carW/2, carY, carW, carH, 10*s); ctx.fill();
            
            // Mui xe trên (Kính sau)
            ctx.fillStyle = '#2f3640';
            ctx.beginPath(); ctx.roundRect(p.x - carW/2 + 10*s, carY - 20*s, carW - 20*s, 25*s, 5*s); ctx.fill();
            ctx.fillStyle = '#7f8fa6'; // Phản quang kính
            ctx.fillRect(p.x - carW/2 + 15*s, carY - 15*s, carW - 30*s, 15*s);

            // Đèn đuôi (Taillights)
            ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000'; ctx.fillStyle = '#ff0000';
            ctx.fillRect(p.x - carW/2 + 5*s, carY + 10*s, 15*s, 8*s);
            ctx.fillRect(p.x + carW/2 - 20*s, carY + 10*s, 15*s, 8*s);
            ctx.shadowBlur = 0;

            // Bánh xe
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.roundRect(p.x - carW/2 - 5*s, carY + carH - 10*s, 15*s, 20*s, 3*s); ctx.fill();
            ctx.beginPath(); ctx.roundRect(p.x + carW/2 - 10*s, carY + carH - 10*s, 15*s, 20*s, 3*s); ctx.fill();

        } 
        // ==========================================
        // VẼ NGƯỜI (CÓ PHỤ KIỆN THEO PHASE)
        // ==========================================
        else {
            let bodyGrad = ctx.createLinearGradient(p.x - bW/2, bY, p.x + bW/2, bY + bH); 
            bodyGrad.addColorStop(0, this.color); bodyGrad.addColorStop(1, Utils.lerpColor(this.color, '#000000', 0.4)); 

            // Chân & Tay
            ctx.strokeStyle = '#111'; ctx.lineWidth = 12 * s; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(p.x - 5*s, py - 30*s); ctx.lineTo(p.x - 5*s - legSwing, py); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x + 5*s, py - 30*s); ctx.lineTo(p.x + 5*s + legSwing, py); ctx.stroke();
            ctx.strokeStyle = this.headColor; ctx.lineWidth = 10 * s;
            ctx.beginPath(); ctx.moveTo(p.x - 15*s, py - 70*s); ctx.lineTo(p.x - 20*s - armSwing, py - 40*s); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x + 15*s, py - 70*s); ctx.lineTo(p.x + 20*s + armSwing, py - 40*s); ctx.stroke();

            // BALO (Dành cho Phase 1 và 2)
            if (this.phase <= 2) {
                ctx.fillStyle = '#8b4513'; // Balo da nâu
                ctx.beginPath(); ctx.roundRect(p.x - bW/2 - 5*s, bY + 10*s, bW + 10*s, bH - 15*s, 5*s); ctx.fill();
            }

            // Thân
            ctx.fillStyle = bodyGrad; ctx.beginPath(); ctx.roundRect(p.x - bW/2, bY, bW, bH, 8*s); ctx.fill();
            
            // Đầu & Tóc
            ctx.fillStyle = this.headColor; ctx.beginPath(); ctx.arc(p.x, py - 95*s, 18*s, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(p.x, py - 100*s, 18*s, 0, Math.PI, true); ctx.fill();

            // PHỤ KIỆN ĐẦU (Phase 3 trở lên)
            if (this.phase === 3 || this.phase === 4) {
                // Đeo Headband thanh niên tình nguyện
                ctx.fillStyle = '#27ae60'; ctx.fillRect(p.x - 18*s, py - 105*s, 36*s, 6*s);
            } else if (this.phase === 5) {
                // Kính Cyberpunk Neon
                ctx.shadowBlur = 10; ctx.shadowColor = '#00ffff'; ctx.fillStyle = '#00ffff';
                ctx.fillRect(p.x - 15*s, py - 98*s, 30*s, 8*s); ctx.shadowBlur = 0;
            }
        }
        ctx.restore();
    }
}