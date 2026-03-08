import { CONFIG } from './config.js';
import { Utils } from './utils.js';

export class Environment {
    constructor() {
        this.farCity = []; this.nearCity = []; this.clouds = []; 
        this.timeCycle = 0.25; this.fogTimer = 0; this.fogIntensity = 0; this.currentFogColor = '#87CEEB'; 
        this.initDecor();
    }
    
    initDecor() {
        for(let i=0; i<20; i++) this.farCity.push({ x: i * 60 - 200, width: 40 + Math.random() * 40, height: 80 + Math.random() * 60 });
        for(let i=0; i<15; i++) this.nearCity.push({ x: i * 100 - 200, width: 60 + Math.random() * 40, height: 100 + Math.random() * 120, windows: Math.random() > 0.3, neonColor: ['rgba(0,255,200,0.8)', 'rgba(255,0,100,0.8)', 'rgba(241,196,15,0.8)'][Math.floor(Math.random()*3)] });
        for(let i=0; i<8; i++) this.clouds.push({ x: Math.random() * CONFIG.canvasWidth, y: 20 + Math.random() * 100, s: 15 + Math.random() * 30, speed: 0.1 + Math.random() * 0.4 });
    }
    
    update(fpsMultiplier, frameCount, playerPhase) {
        this.timeCycle = (frameCount * 0.0005) % 1; 
        this.clouds.forEach(c => { c.x -= (c.speed * fpsMultiplier); if (c.x < -100) c.x = CONFIG.canvasWidth + 100; });
        this.farCity.forEach(b => { b.x -= 0.1 * fpsMultiplier; if(b.x < -200) b.x = CONFIG.canvasWidth + 200; });
        this.nearCity.forEach(b => { b.x -= 0.3 * fpsMultiplier; if(b.x < -200) b.x = CONFIG.canvasWidth + 200; });
        
        if (playerPhase >= 3) { if (Math.random() < 0.001) this.fogTimer = 400; }
        if (this.fogTimer > 0) { this.fogTimer -= fpsMultiplier; this.fogIntensity = Math.min(1, this.fogIntensity + 0.015 * fpsMultiplier); } 
        else { this.fogIntensity = Math.max(0, this.fogIntensity - 0.01 * fpsMultiplier); }
    }
    
    draw(ctx) {
        let isDay = this.timeCycle < 0.5;
        let cycleIntensity = isDay ? Math.sin(this.timeCycle * Math.PI * 2) : Math.sin((this.timeCycle - 0.5) * Math.PI * 2);
        let skyTop = isDay ? Utils.lerpColor('#2980b9', '#87CEEB', cycleIntensity) : Utils.lerpColor('#050510', '#1a1a3a', cycleIntensity);
        let skyBot = isDay ? Utils.lerpColor('#87CEEB', '#f39c12', 1-cycleIntensity) : Utils.lerpColor('#1a1a3a', '#000000', 1-cycleIntensity);
        this.currentFogColor = skyBot; 
        
        let skyGradient = ctx.createLinearGradient(0, 0, 0, CONFIG.horizonY);
        skyGradient.addColorStop(0, skyTop); skyGradient.addColorStop(1, skyBot);
        ctx.fillStyle = skyGradient; ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.horizonY);

        let arcProgress = isDay ? (this.timeCycle / 0.5) : ((this.timeCycle - 0.5) / 0.5);
        let astroX = CONFIG.canvasWidth + 50 - (arcProgress * (CONFIG.canvasWidth + 100));
        let astroY = CONFIG.horizonY + 20 - Math.sin(arcProgress * Math.PI) * 150;

        ctx.shadowBlur = 40;
        if (isDay) { ctx.shadowColor = '#f1c40f'; ctx.fillStyle = '#fff200'; ctx.beginPath(); ctx.arc(astroX, astroY, 35, 0, Math.PI*2); ctx.fill(); } 
        else { ctx.shadowColor = '#ecf0f1'; ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.arc(astroX, astroY, 30, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(astroX - 10, astroY - 5, 5, 0, Math.PI*2); ctx.arc(astroX + 8, astroY + 10, 8, 0, Math.PI*2); ctx.arc(astroX + 12, astroY - 8, 4, 0, Math.PI*2); ctx.fill(); }
        ctx.shadowBlur = 0;

        ctx.fillStyle = isDay ? `rgba(255, 255, 255, ${0.4 + cycleIntensity*0.4})` : `rgba(200, 200, 220, 0.15)`;
        this.clouds.forEach(c => { ctx.beginPath(); ctx.arc(c.x, c.y, c.s, 0, Math.PI*2); ctx.arc(c.x + c.s*0.8, c.y - c.s*0.4, c.s*0.8, 0, Math.PI*2); ctx.arc(c.x + c.s*1.5, c.y, c.s*0.9, 0, Math.PI*2); ctx.fill(); });

        let bldgBaseColor = isDay ? Utils.lerpColor('#2c3e50', '#87CEEB', 0.5) : '#0a0a0f';
        ctx.fillStyle = Utils.lerpColor(bldgBaseColor, '#000', 0.7);
        this.farCity.forEach(b => { ctx.fillRect(b.x, CONFIG.horizonY - b.height, b.width, b.height); });
        
        this.nearCity.forEach(b => { 
            let bldgGrad = ctx.createLinearGradient(0, CONFIG.horizonY - b.height, 0, CONFIG.horizonY);
            bldgGrad.addColorStop(0, Utils.lerpColor(bldgBaseColor, '#000', 0.3)); bldgGrad.addColorStop(1, '#000');
            ctx.fillStyle = bldgGrad; ctx.fillRect(b.x, CONFIG.horizonY - b.height, b.width, b.height); 
            if (b.windows && !isDay) { ctx.fillStyle = b.neonColor; for(let wy = 10; wy < b.height - 15; wy += 15) { for(let wx = 5; wx < b.width - 10; wx += 12) { if (Math.random() > 0.3) ctx.fillRect(b.x + wx, CONFIG.horizonY - b.height + wy, 6, 8); } } }
        });
        
        let grassCol = isDay ? Utils.lerpColor('#1e4d2b', '#27ae60', cycleIntensity) : '#051208';
        let roadCol = isDay ? Utils.lerpColor('#5e686b', '#7f8c8d', cycleIntensity) : '#111518';

        let groundGrad = ctx.createLinearGradient(0, CONFIG.horizonY, 0, CONFIG.canvasHeight);
        groundGrad.addColorStop(0, Utils.lerpColor(grassCol, '#000', 0.8)); groundGrad.addColorStop(1, grassCol);
        ctx.fillStyle = groundGrad; ctx.fillRect(0, CONFIG.horizonY, CONFIG.canvasWidth, CONFIG.canvasHeight - CONFIG.horizonY);

        ctx.fillStyle = roadCol; ctx.beginPath();
        let tl = Utils.project(-CONFIG.roadWidth, 0, 4000); let tr = Utils.project(CONFIG.roadWidth, 0, 4000);
        let bl = Utils.project(-CONFIG.roadWidth, 0, 10);   let br = Utils.project(CONFIG.roadWidth, 0, 10);
        ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y); ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y); ctx.fill();
    }
    
    drawRoadLines(ctx, frameCount, speed) {
        let isDay = this.timeCycle < 0.5;
        ctx.strokeStyle = isDay ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = 3;
        let offset = (frameCount * speed) % 200;
        for (let i = 0; i < 20; i++) {
            let z = i * 200 - offset;
            if (z > 20) {
                for(let lineX of CONFIG.laneDividers) {
                    let pL = Utils.project(lineX, 0, z); let pR = Utils.project(lineX, 0, z+100); 
                    if(pL && pR) { ctx.beginPath(); ctx.moveTo(pL.x, pL.y); ctx.lineTo(pR.x, pR.y); ctx.stroke(); }
                }
            }
        }
    }
    
    drawFog(ctx) {
        let horizonFog = ctx.createLinearGradient(0, CONFIG.horizonY - 80, 0, CONFIG.horizonY + 150);
        horizonFog.addColorStop(0, Utils.hexToRgba(this.currentFogColor, 0));
        horizonFog.addColorStop(0.5, Utils.hexToRgba(this.currentFogColor, 0.95)); 
        horizonFog.addColorStop(1, Utils.hexToRgba(this.currentFogColor, 0));
        ctx.fillStyle = horizonFog; ctx.fillRect(0, CONFIG.horizonY - 80, CONFIG.canvasWidth, 230);

        if (this.fogIntensity > 0) {
            let fogReachY = CONFIG.horizonY + (this.fogIntensity * 300); 
            let dynamicFog = ctx.createLinearGradient(0, CONFIG.horizonY - 50, 0, fogReachY);
            dynamicFog.addColorStop(0, Utils.hexToRgba(this.currentFogColor, this.fogIntensity));
            dynamicFog.addColorStop(1, Utils.hexToRgba(this.currentFogColor, 0));
            ctx.fillStyle = dynamicFog; ctx.fillRect(0, 0, CONFIG.canvasWidth, fogReachY);
        }
    }
}