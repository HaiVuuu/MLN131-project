import { CONFIG, SETTINGS } from './config.js';

export class UIManager {
    constructor() { this.floatingTexts = []; }
    reset() { this.floatingTexts = []; }
    addFloatingText(text, color, size) { this.floatingTexts.push({ text: text, y: CONFIG.canvasHeight * 0.35, alpha: 1, color: color, size: size }); }
    
    updateFloatingTexts(fpsMultiplier) {
        for(let i=0; i < this.floatingTexts.length; i++) {
            let ft = this.floatingTexts[i]; ft.y -= (2.5 * fpsMultiplier); ft.alpha -= (0.02 * fpsMultiplier);
            if (ft.alpha <= 0) { this.floatingTexts.splice(i, 1); i--; }
        }
    }

    drawFloatingTexts(ctx) {
        for(let ft of this.floatingTexts) {
            ctx.fillStyle = ft.color; ctx.font = `bold ${ft.size}px Arial`; ctx.textAlign = "center"; 
            ctx.shadowBlur = 5; ctx.shadowColor = '#000'; 
            ctx.globalAlpha = Math.max(0, ft.alpha); ctx.fillText(ft.text, CONFIG.canvasWidth/2, ft.y); 
            ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
        }
    }

    // HÀM TRỢ GIÚP VẼ THANH VOLUME
    drawVolumeBar(ctx, yPos, label, volumeVal) {
        let cx = CONFIG.canvasWidth / 2;
        ctx.fillStyle = "white"; ctx.font = "bold 18px Arial"; ctx.textAlign = "center"; 
        ctx.fillText(label, cx, yPos);
        
        // Nút giảm [<]
        ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.roundRect(cx - 85, yPos + 10, 30, 30, 5); ctx.fill();
        ctx.fillStyle = "white"; ctx.fillText("-", cx - 70, yPos + 32);
        
        // Vẽ 10 nấc vạch
        let level = Math.round(volumeVal * 10);
        for(let i=0; i<10; i++) {
            ctx.fillStyle = i < level ? '#2ecc71' : '#555';
            ctx.fillRect(cx - 45 + (i * 9), yPos + 15, 6, 20);
        }

        // Nút tăng [>]
        ctx.fillStyle = "#3498db"; ctx.beginPath(); ctx.roundRect(cx + 55, yPos + 10, 30, 30, 5); ctx.fill();
        ctx.fillStyle = "white"; ctx.fillText("+", cx + 70, yPos + 32);
    }

    draw(ctx, state, player) {
        if (state === 'PLAYING') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(CONFIG.canvasWidth - 50, 60, 40, 40, 8); ctx.fill();
            ctx.fillStyle = 'white'; ctx.fillRect(CONFIG.canvasWidth - 38, 70, 6, 20); ctx.fillRect(CONFIG.canvasWidth - 28, 70, 6, 20);
        }

        if (state === 'MENU') {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
            ctx.fillStyle = "white"; ctx.font = "bold 32px Arial"; ctx.textAlign = "center"; ctx.fillText("VAI TRÒ THANH NIÊN", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 - 50);
            ctx.fillStyle = "#f1c40f"; ctx.font = "bold 16px Arial"; ctx.fillText("Chạm/Vuốt để Bùng Cháy", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 - 20);
            ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.roundRect(CONFIG.canvasWidth/2 - 80, CONFIG.canvasHeight/2 + 30, 160, 50, 25); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "bold 20px Arial"; ctx.fillText("DẤN THÂN", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 + 62);
        } else if (state === 'GAMEOVER') {
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)"; ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
            ctx.fillStyle = "#e74c3c"; ctx.font = "bold 35px Arial"; ctx.textAlign = "center"; ctx.fillText("BẠN ĐÃ LÙI BƯỚC", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 - 60);
            ctx.font = "20px Arial"; ctx.fillStyle = "#f1c40f"; ctx.fillText("Tổng điểm: " + Math.max(0, player.score).toLocaleString(), CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 - 20);
            ctx.fillStyle = "#3498db"; ctx.beginPath(); ctx.roundRect(CONFIG.canvasWidth/2 - 80, CONFIG.canvasHeight/2 + 60, 160, 50, 25); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "bold 20px Arial"; ctx.fillText("RÈN LUYỆN LẠI", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 + 92);
        } else if (state === 'PAUSED') {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
            ctx.fillStyle = "white"; ctx.font = "bold 35px Arial"; ctx.textAlign = "center"; ctx.fillText("TẠM DỪNG", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 - 80);
            ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.roundRect(CONFIG.canvasWidth/2 - 90, CONFIG.canvasHeight/2 - 30, 180, 50, 25); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "bold 20px Arial"; ctx.fillText("TIẾP TỤC", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 + 2);
            ctx.fillStyle = "#95a5a6"; ctx.beginPath(); ctx.roundRect(CONFIG.canvasWidth/2 - 90, CONFIG.canvasHeight/2 + 40, 180, 50, 25); ctx.fill();
            ctx.fillStyle = "white"; ctx.fillText("CÀI ĐẶT", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 + 72);
        } else if (state === 'SETTINGS') {
            ctx.fillStyle = "rgba(0, 0, 0, 0.95)"; ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
            ctx.fillStyle = "white"; ctx.font = "bold 32px Arial"; ctx.textAlign = "center"; ctx.fillText("CÀI ĐẶT", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 - 150);
            
            // RUNG MÀN HÌNH
            ctx.font = "bold 18px Arial"; ctx.fillText("Rung Màn Hình", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 - 100);
            ctx.fillStyle = SETTINGS.screenShake ? '#2ecc71' : '#e74c3c'; 
            ctx.beginPath(); ctx.roundRect(CONFIG.canvasWidth/2 - 40, CONFIG.canvasHeight/2 - 90, 80, 30, 15); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "bold 14px Arial"; ctx.fillText(SETTINGS.screenShake ? "BẬT" : "TẮT", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 - 70);

            // THANH ÂM THANH
            this.drawVolumeBar(ctx, CONFIG.canvasHeight/2 - 30, "Nhạc Nền (BGM)", SETTINGS.bgmVolume);
            this.drawVolumeBar(ctx, CONFIG.canvasHeight/2 + 50, "Hiệu Ứng (SFX)", SETTINGS.sfxVolume);

            // NÚT TRỞ LẠI
            ctx.fillStyle = "#95a5a6"; ctx.beginPath(); ctx.roundRect(CONFIG.canvasWidth/2 - 70, CONFIG.canvasHeight/2 + 130, 140, 40, 20); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "bold 18px Arial"; ctx.fillText("TRỞ LẠI", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2 + 156);
        } else {
            // HUD IN-GAME (Giữ nguyên)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.beginPath(); ctx.roundRect(10, 10, 220, 35, 8); ctx.roundRect(CONFIG.canvasWidth - 130, 10, 120, 35, 8); ctx.fill();
            ctx.fillStyle = '#f1c40f'; ctx.textAlign = "left"; ctx.font = "bold 18px Arial"; ctx.fillText("Điểm XH: " + Math.max(0, player.score).toLocaleString(), 20, 34);
            ctx.fillStyle = '#3498db'; ctx.textAlign = "right"; ctx.fillText("Level: " + player.phase, CONFIG.canvasWidth - 20, 34);

            if(player.currentWord) {
                let word = player.currentWord; let letterW = word.length > 7 ? 20 : 26; let startX = CONFIG.canvasWidth/2 - (word.length * letterW)/2;
                for(let i=0; i<word.length; i++) {
                    ctx.fillStyle = i < player.collectedLetters ? '#f1c40f' : 'rgba(255,255,255,0.2)'; ctx.font = `bold ${letterW-4}px Arial`; ctx.textAlign = "center"; ctx.fillText(word[i], startX + i*letterW + letterW/2, 85);
                    ctx.strokeStyle = i < player.collectedLetters ? '#f1c40f' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.strokeRect(startX + i*letterW, 65, letterW-4, 25);
                }
            }
            if (player.rushHourTimer > 0) { ctx.fillStyle = '#ff4757'; ctx.font = "bold 22px Arial"; ctx.textAlign = "center"; ctx.shadowBlur = 15; ctx.shadowColor = '#ff4757'; ctx.fillText(`RUSH HOUR (${Math.ceil(player.rushHourTimer/1000)}s)`, CONFIG.canvasWidth/2, 120); ctx.shadowBlur = 0; }

            let buffY = 65; ctx.textAlign = "left";
            if (player.buffs.shield > 0) { ctx.fillStyle = '#3498db'; ctx.font = "bold 12px Arial"; ctx.fillText("KHIÊN", 10, buffY); ctx.fillRect(60, buffY - 10, (player.buffs.shield / 6000) * 100, 10); buffY += 20; }
            if (player.buffs.x2 > 0) { ctx.fillStyle = '#f1c40f'; ctx.font = "bold 12px Arial"; ctx.fillText("X2 ĐIỂM", 10, buffY); ctx.fillRect(60, buffY - 10, (player.buffs.x2 / 6000) * 100, 10); buffY += 20; }
            if (player.buffs.magnet > 0) { ctx.fillStyle = '#9b59b6'; ctx.font = "bold 12px Arial"; ctx.fillText("NAM CHÂM", 10, buffY); ctx.fillRect(80, buffY - 10, (player.buffs.magnet / 6000) * 80, 10); buffY += 20; }
            if (player.buffs.dash > 0) { ctx.fillStyle = '#00ffff'; ctx.font = "bold 12px Arial"; ctx.fillText("ĐỘT PHÁ", 10, buffY); ctx.fillRect(70, buffY - 10, (player.buffs.dash / 3000) * 90, 10); buffY += 20; }
        }
    }
}