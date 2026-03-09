import { CONFIG, GAME_DATA } from './config.js';
import { Utils } from './utils.js';

export class ObjectManager {
    constructor() { this.reset(); }
    reset() { this.objects = []; this.spawnTimer = 0; this.decorTimer = 0; }

    transformToGold(obj, player) {
        if (obj.type === 'wall' || obj.type === 'trap' || obj.type === 'moving_trap' || obj.type === 'fakenews') {
            obj.type = 'gate'; obj.isGood = true; obj.value = Math.max(1, player.phase) * 100; obj.text = "+" + obj.value; obj.sub = "VÀNG MƯỜI"; obj.color = '#f1c40f'; 
        } else if (obj.type === 'gate' && !obj.isGood) {
            obj.isGood = true; obj.value = Math.abs(obj.value); obj.text = "+" + obj.value; obj.sub = "CHUYỂN HÓA"; obj.color = '#f1c40f';
        } else if (obj.type === 'gate_special' && !obj.isMul) {
            obj.isMul = true; obj.text = "CƠ HỘI LỚN"; obj.color = '#f1c40f';
        } else if (obj.type === 'blinking_gate') {
            obj.type = 'gate'; obj.isGood = true; obj.value = obj.val; obj.text = "+" + obj.value; obj.sub = "THỜI CƠ"; obj.color = '#f1c40f';
        }
    }

    pushObject(obj, player) {
        if (player.rushHourTimer > 0 && obj.type !== 'decor' && obj.type !== 'crack') this.transformToGold(obj, player);
        this.objects.push(obj);
    }

    spawnDecor() {
        for (let side of [-1, 1]) {
            if (Math.random() < 0.95) { 
                let clusterSize = Math.floor(Math.random() * 4) + 3; 
                for(let i = 0; i < clusterSize; i++) {
                    let decorType = Math.random(); let xOffset = side * (CONFIG.roadWidth + 10 + Math.random() * 250); let zOffset = 4000 + (Math.random() * 800 - 400);
                    if (decorType < 0.50) this.objects.push({ type: 'decor', decor: 'tree', x: xOffset, z: zOffset });
                    else if (decorType < 0.85) this.objects.push({ type: 'decor', decor: 'npc', x: xOffset + (side*20), z: zOffset, color: ['#e74c3c','#9b59b6','#f1c40f', '#3498db'][Math.floor(Math.random()*4)] });
                    else if (decorType < 0.95) this.objects.push({ type: 'decor', decor: 'lamp', x: xOffset, z: zOffset, side: side });
                    else this.objects.push({ type: 'decor', decor: 'billboard', x: xOffset, z: zOffset });
                }
            }
        }
    }

    spawnEntity(player) {
        let lane = Math.floor(Math.random() * 5); 
        let rand = Math.random(); let phase = Math.max(1, player.phase); let gateVal = phase * 50; 
        let isLetterOnTrack = this.objects.some(obj => obj.type === 'letter');

        let chanceCrack = phase >= 3 ? 0.05 + (phase * 0.01) : 0; 
        let chanceSpecial = phase >= 2 ? (phase * 0.03) - 0.04 : 0; if (phase >= 5) chanceSpecial = 0.12; 
        let chanceWall = phase >= 3 ? 0.04 + (phase * 0.01) : 0; 
        let chanceFakeNews = phase >= 4 ? 0.04 + (phase * 0.01) : 0; 
        let chanceTrap = phase >= 2 ? 0.05 + (phase * 0.01) : 0; 
        let chanceBlink = phase >= 3 ? 0.05 + (phase * 0.01) : 0; 
        let chanceBuff = phase >= 2 ? 0.1 : 0; 
        let chanceLetter = (phase >= 1 && player.rushHourTimer <= 0 && !isLetterOnTrack) ? 0.08 : 0;

        let pCrack = chanceCrack; let pWall = pCrack + chanceWall; let pFake = pWall + chanceFakeNews; 
        let pSpec = pFake + chanceSpecial; let pBlink = pSpec + chanceBlink; let pBuff = pBlink + chanceBuff; 
        let pTrap = pBuff + chanceTrap; let pLetter = pTrap + chanceLetter;

        if (rand < pCrack) {
            let numLanes = Math.floor(Math.random() * 4) + 2; 
            let startLane = Math.floor(Math.random() * (6 - numLanes));
            let crackLanes = []; for(let i=0; i<numLanes; i++) crackLanes.push(startLane + i);
            this.pushObject({ type: 'crack', lanes: crackLanes, z: 4000, depth: 150 }, player);
            if (Math.random() < 0.7) {
                let floatLane = crackLanes[Math.floor(Math.random() * crackLanes.length)]; let floatType = Math.random();
                if (floatType < 0.5) this.pushObject({ type: 'gate', lane: floatLane, z: 4000, value: gateVal*3, text: "+" + (gateVal*3), sub: "LIỀU LĨNH", color: '#f1c40f', isGood: true, isFloating: true }, player);
                else this.pushObject({ type: 'buff', buffType: 'x2', lane: floatLane, z: 4000, color: '#f1c40f', text: "NĂNG SUẤT", isFloating: true }, player);
            }
        }
        else if (rand < pWall) this.pushObject({ type: 'wall', lane: lane, z: 4000, text: "Pháp luật", color: '#8b0000' }, player);
        else if (rand < pFake) this.pushObject({ type: 'fakenews', lane: lane, dir: 1, z: 4000, color: '#9b59b6' }, player);
        else if (rand < pSpec) {
            let isMul = Math.random() > 0.5; let spec = isMul ? GAME_DATA.specialGates.mul[Math.floor(Math.random()*GAME_DATA.specialGates.mul.length)] : GAME_DATA.specialGates.div[Math.floor(Math.random()*GAME_DATA.specialGates.div.length)];
            this.pushObject({ type: 'gate_special', lane: lane, z: 4000, isMul: isMul, multiplier: spec.val, text: spec.text, color: isMul ? '#f39c12' : '#8e44ad' }, player);
        } else if (rand < pBlink) this.pushObject({ type: 'blinking_gate', lane: lane, z: 4000, timer: 0, val: gateVal * 2 }, player);
        else if (rand < pBuff) {
            let bType = Math.random();
            if (bType < 0.33) this.pushObject({ type: 'buff', buffType: 'x2', lane: lane, z: 4000, color: '#f1c40f', text: "NĂNG SUẤT x2" }, player);
            else if (bType < 0.66) this.pushObject({ type: 'buff', buffType: 'shield', lane: lane, z: 4000, color: '#3498db', text: "BẢN LĨNH" }, player);
            else if (bType < 0.85) this.pushObject({ type: 'buff', buffType: 'magnet', lane: lane, z: 4000, color: '#9b59b6', text: "KẾT NỐI (HÚT)" }, player);
            else this.pushObject({ type: 'buff', buffType: 'dash', lane: lane, z: 4000, color: '#00ffff', text: "ĐỘT PHÁ TỐC ĐỘ" }, player);
        } else if (rand < pTrap) this.pushObject({ type: 'moving_trap', lane: lane, z: 4000, dir: Math.random() > 0.5 ? 1 : -1, color: '#e84118', text: "CÁM DỖ" }, player);
        else if (rand < pLetter) {
            if (player.collectedLetters < player.currentWord.length) this.pushObject({ type: 'letter', letter: player.currentWord[player.collectedLetters], lane: lane, z: 4000, color: '#f1c40f' }, player);
            else this.pushObject({ type: 'gate', lane: lane, z: 4000, value: gateVal, text: "+" + gateVal, sub: GAME_DATA.gateContent[phase].good, color: '#2ecc71', isGood: true }, player);
        } else if (rand < pLetter + 0.35) this.pushObject({ type: 'gate', lane: lane, z: 4000, value: gateVal, text: "+" + gateVal, sub: GAME_DATA.gateContent[phase].good, color: '#2ecc71', isGood: true }, player);
        else this.pushObject({ type: 'gate', lane: lane, z: 4000, value: -gateVal, text: "-" + gateVal, sub: GAME_DATA.gateContent[phase].bad, color: '#e74c3c', isGood: false }, player);
    }

    // ĐÃ THÊM THAM SỐ `engine` VÀO HÀM UPDATE ĐỂ GỌI RUNG
    update(fpsMultiplier, player, ui, frameCount, speed, engine) {
        let isRush = player.rushHourTimer > 0; let rushMult = isRush ? 3 : 1; 
        let finalSpeed = speed * Math.max(player.buffs.dash > 0 ? 1.8 : 1, isRush ? 2.2 : 1);

        this.decorTimer += fpsMultiplier;
        if (this.decorTimer >= 8) { this.spawnDecor(); this.decorTimer = 0; }
        this.spawnTimer += fpsMultiplier;
        if (this.spawnTimer >= Math.max(12, 65 - speed * 1.5)) { this.spawnEntity(player); this.spawnTimer = 0; }

        this.objects.sort((a, b) => b.z - a.z);

        for (let i = 0; i < this.objects.length; i++) {
            let obj = this.objects[i]; obj.z -= (finalSpeed * fpsMultiplier); 
            
            if (obj.type === 'fakenews' || obj.type === 'moving_trap') {
                let moveSpeed = obj.type === 'fakenews' ? 40 : 25; 
                if (Math.floor(frameCount) % moveSpeed === 0) { obj.lane += obj.dir; if (obj.lane >= 4) obj.dir = -1; else if (obj.lane <= 0) obj.dir = 1; }
            }
            if (obj.type === 'blinking_gate') obj.timer += fpsMultiplier;

            if (player.buffs.magnet > 0 && obj.z > player.z && obj.z < player.z + 1000) {
                if ((obj.type === 'gate' && obj.isGood) || obj.type === 'buff' || (obj.type === 'gate_special' && obj.isMul) || obj.type === 'letter') {
                    if (obj.lane !== undefined && Math.abs(obj.lane - player.lane) === 1) obj.lane = player.lane; 
                }
            }

            if (obj.type === 'crack') {
                if (obj.z > 20 && obj.z < 80 && obj.lanes.includes(player.lane)) {
                    if (player.jumpY < 40 && player.buffs.dash <= 0 && !isRush) {
                        player.isDead = true; ui.addFloatingText("SỤP HỐ GÀ!", '#e74c3c', 35);
                    }
                }
                if (obj.z < 10) { this.objects.splice(i, 1); i--; }
                continue; 
            }

            if (obj.type !== 'decor' && obj.z > 20 && obj.z < 80 && obj.lane === player.lane) {
                
                let isDodged = false;
                if (obj.type === 'moving_trap' && player.jumpY > 40) isDodged = true;
                let isBadGate = (obj.type === 'gate' && !obj.isGood) || (obj.type === 'gate_special' && !obj.isMul) || (obj.type === 'blinking_gate' && Math.floor(obj.timer / 25) % 2 !== 0);
                if (isBadGate && player.jumpY > 140) isDodged = true;
                if (obj.type === 'fakenews' && player.jumpY > 100) isDodged = true;

                let isGoodItem = (obj.type === 'gate' && obj.isGood) || (obj.type === 'gate_special' && obj.isMul) || (obj.type === 'buff') || (obj.type === 'letter');
                if (isGoodItem && !obj.isFloating && player.jumpY > 200) { ui.addFloatingText("NHẢY QUÁ TRỚN!", '#95a5a6', 20); this.objects.splice(i, 1); i--; continue; }

                if (isDodged && player.buffs.dash <= 0 && !isRush) { ui.addFloatingText("NÉ ĐẸP!", '#fff', 24); this.objects.splice(i, 1); i--; continue; }

                let isFloating = obj.isFloating || false;
                if (isFloating && player.jumpY < 60 && player.buffs.dash <= 0 && !isRush) { continue; }

                if ((player.buffs.dash > 0 || isRush) && (obj.type === 'wall' || obj.type === 'trap' || obj.type === 'moving_trap' || obj.type === 'fakenews' || (obj.type === 'gate' && !obj.isGood) || (obj.type === 'gate_special' && !obj.isMul) || obj.type === 'blinking_gate')) {
                    player.score += 150; ui.addFloatingText("PHÁ VỠ!", isRush ? '#ff4757' : '#00ffff', 30); 
                    engine.triggerShake(10, 8); // RUNG NHẸ KHI ĐÂM NÁT CHƯỚNG NGẠI VẬT
                    this.objects.splice(i, 1); i--; continue;
                }

                if (obj.type === 'letter') {
                    player.collectedLetters++; ui.addFloatingText(obj.letter, '#f1c40f', 40);
                    if (player.collectedLetters >= player.currentWord.length) {
                        player.rushHourTimer = player.currentWord.length * 2000; ui.addFloatingText("BÙNG CHÁY!", '#ff4757', 45); player.pickNextWord();
                        engine.triggerShake(20, 12); // RUNG MẠNH KHI VÀO RUSH HOUR
                        this.objects.forEach(o => { if (o.type !== 'decor' && o.type !== 'buff' && o.type !== 'letter' && o.type !== 'crack') this.transformToGold(o, player); });
                    }
                }
                else if (obj.type === 'gate') {
                    if (obj.isGood) { let gained = (player.buffs.x2 > 0 ? obj.value * 2 : obj.value) * rushMult; player.score += gained; ui.addFloatingText("+" + gained, '#2ecc71', 28); } 
                    else { if (player.buffs.shield > 0) { ui.addFloatingText("BẢO VỆ!", '#3498db', 28); engine.triggerShake(5, 5); } else { player.score += obj.value; ui.addFloatingText(obj.value, '#e74c3c', 28); engine.triggerShake(15, 10); } }
                } else if (obj.type === 'blinking_gate') {
                    let isGoodNow = Math.floor(obj.timer / 25) % 2 === 0;
                    if (isGoodNow) { let gained = (player.buffs.x2 > 0 ? obj.val * 2 : obj.val) * rushMult; player.score += gained; ui.addFloatingText("+" + gained + " NẮM CƠ HỘI!", '#2ecc71', 32); } 
                    else { if (player.buffs.shield > 0) { ui.addFloatingText("BẢO VỆ!", '#3498db', 28); engine.triggerShake(5, 5); } else { player.score -= obj.val; ui.addFloatingText("-" + obj.val + " SẬP BẪY!", '#e74c3c', 32); engine.triggerShake(15, 10); } }
                } else if (obj.type === 'buff') {
                    if (obj.buffType === 'x2') player.buffs.x2 = 6000; else if (obj.buffType === 'shield') player.buffs.shield = 6000; else if (obj.buffType === 'magnet') player.buffs.magnet = 6000; else if (obj.buffType === 'dash') player.buffs.dash = 3000; 
                    ui.addFloatingText(obj.text, obj.color, 30);
                } else if (obj.type === 'gate_special') {
                    if (obj.isMul) { let flatBonus = ((Math.max(1, player.phase) * 50) * obj.multiplier) * rushMult; if (player.buffs.x2 > 0) flatBonus *= 2; player.score += flatBonus; ui.addFloatingText("+" + flatBonus + " ĐIỂM!", obj.color, 36); engine.triggerShake(10, 5); } 
                    else { if (player.buffs.shield > 0) { ui.addFloatingText("BẢO VỆ BÊ BỐI!", '#3498db', 30); engine.triggerShake(5, 5); } else { player.score = Math.floor(player.score / obj.multiplier); ui.addFloatingText("CHIA " + obj.multiplier + " TÀI SẢN!", obj.color, 36); engine.triggerShake(20, 15); } }
                } else if (obj.type === 'trap' || obj.type === 'moving_trap' || obj.type === 'fakenews') { 
                    if (player.buffs.shield > 0) { ui.addFloatingText("BẢO VỆ!", '#3498db', 26); engine.triggerShake(5, 5); } else { player.score -= (player.phase * 50); ui.addFloatingText("Trừ điểm!", obj.color, 26); engine.triggerShake(15, 10); }
                } else if (obj.type === 'wall') { player.isDead = true; }
                
                this.objects.splice(i, 1); i--; continue;
            }
            if (obj.z < 10) { this.objects.splice(i, 1); i--; }
        }
    }

    draw(ctx, env, frameCount) {
        let isNight = env.timeCycle >= 0.5;
        for (let obj of this.objects) {
            
            let pX = 0;
            if (obj.type === 'decor') pX = obj.x;
            else if (obj.type === 'crack') pX = CONFIG.lanes[Math.floor((obj.lanes[0] + obj.lanes[obj.lanes.length-1])/2)]; 
            else pX = CONFIG.lanes[obj.lane];

            let yHover = obj.isFloating ? 130 + Math.sin(frameCount*0.1)*15 : 0;
            let p = Utils.project(pX, yHover, obj.z); 
            if (!p) continue;
            let s = p.scale; ctx.shadowBlur = 0; 
            
            if (obj.type === 'crack') {
                let minLane = Math.min(...obj.lanes); let maxLane = Math.max(...obj.lanes);
                let holeWidth = (maxLane - minLane) * 100 + 80; let w = holeWidth * s; let h = 60 * s; 
                ctx.fillStyle = isNight ? '#222' : '#555'; ctx.beginPath(); ctx.ellipse(p.x, p.y, w/2 + 5*s, h/2 + 5*s, 0, 0, Math.PI*2); ctx.fill();
                let holeGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, w/2); holeGrad.addColorStop(0, '#000'); holeGrad.addColorStop(0.7, '#111'); holeGrad.addColorStop(1, isNight ? '#222' : '#333'); ctx.fillStyle = holeGrad;
                ctx.beginPath(); ctx.ellipse(p.x - 10*s, p.y + 2*s, (w/2)*0.9, (h/2)*1.1, 0.1, 0, Math.PI*2); ctx.ellipse(p.x + 15*s, p.y - 3*s, (w/2)*0.8, (h/2)*0.9, -0.2, 0, Math.PI*2); ctx.ellipse(p.x, p.y, w/2, h/2, 0, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = isNight ? '#111' : '#333'; ctx.lineWidth = 2*s; ctx.beginPath(); ctx.moveTo(p.x - w/2, p.y); ctx.lineTo(p.x - w/2 - 25*s, p.y - 10*s); ctx.moveTo(p.x + w/2, p.y); ctx.lineTo(p.x + w/2 + 20*s, p.y + 5*s); ctx.moveTo(p.x, p.y - h/2); ctx.lineTo(p.x - 15*s, p.y - h/2 - 20*s); ctx.stroke();
            }
            else if (obj.type === 'decor') {
                if (obj.decor === 'tree') { let w = 120 * s; let h = 250 * s; ctx.fillStyle = isNight ? '#050a05' : '#2d140e'; ctx.fillRect(p.x - w/6, p.y - h/4, w/3, h/4); ctx.fillStyle = isNight ? '#0a1f0d' : '#1e4d22'; ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x - w/2, p.y - h/4); ctx.lineTo(p.x + w/2, p.y - h/4); ctx.fill(); }
                else if (obj.decor === 'lamp') { let w = 25 * s; let h = 300 * s; ctx.fillStyle = isNight ? '#222' : '#7f8c8d'; ctx.fillRect(p.x - w/4, p.y - h, w/2, h); ctx.fillRect(p.x - w, p.y - h, w*3 * -obj.side, w/2); if (isNight) { ctx.fillStyle = 'rgba(241, 196, 15, 0.8)'; ctx.beginPath(); ctx.arc(p.x + (w*1.5 * -obj.side), p.y - h + w, w*1.5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(241, 196, 15, 0.15)'; ctx.beginPath(); ctx.moveTo(p.x + (w*1.5 * -obj.side), p.y - h + w); ctx.lineTo(p.x - 100*s, p.y); ctx.lineTo(p.x + 100*s, p.y); ctx.fill(); } else { ctx.fillStyle = '#bdc3c7'; ctx.beginPath(); ctx.arc(p.x + (w*1.5 * -obj.side), p.y - h + w, w*1.2, 0, Math.PI*2); ctx.fill(); } }
                else if (obj.decor === 'billboard') { let w = 180 * s; let h = 120 * s; ctx.fillStyle = isNight ? '#111' : '#555'; ctx.fillRect(p.x - 8*s, p.y - h*1.5, 16*s, h*1.5); ctx.fillStyle = isNight ? '#0a1b2a' : '#3498db'; ctx.fillRect(p.x - w/2, p.y - h*2, w, h); if (isNight) { ctx.fillStyle = 'rgba(0, 255, 200, 0.8)'; ctx.font = `bold ${20*s}px Arial`; ctx.textAlign="center"; ctx.fillText("TƯƠNG LAI", p.x, p.y - h*1.4); } }
                else if (obj.decor === 'npc') { ctx.fillStyle = isNight ? '#2a1f10' : '#f1c27d'; ctx.beginPath(); ctx.arc(p.x, p.y - 45*s, 12*s, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = isNight ? '#0a0a0a' : obj.color; ctx.fillRect(p.x - 10*s, p.y - 33*s, 20*s, 24*s); ctx.fillStyle = '#000'; ctx.fillRect(p.x - 8*s, p.y - 9*s, 6*s, 10*s); ctx.fillRect(p.x + 2*s, p.y - 9*s, 6*s, 10*s); }
            }
            else {
                if (obj.isFloating) { let pShadow = Utils.project(pX, 0, obj.z); if(pShadow) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(pShadow.x, pShadow.y, 25*pShadow.scale, 8*pShadow.scale, 0, 0, Math.PI*2); ctx.fill(); } }
                if (obj.type === 'letter') { let w = 35 * s; ctx.fillStyle = 'rgba(241, 196, 15, 0.4)'; ctx.beginPath(); ctx.arc(p.x, p.y - w, w, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 3*s; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `bold ${30*s}px Arial`; ctx.textAlign="center"; ctx.fillText(obj.letter, p.x, p.y - w + 10*s); }
                else if (obj.type === 'buff') { let w = 40 * s; let buffGrad = ctx.createRadialGradient(p.x, p.y - w, 0, p.x, p.y - w, w); buffGrad.addColorStop(0, '#fff'); buffGrad.addColorStop(1, obj.color); ctx.shadowBlur = 15 * s; ctx.shadowColor = obj.color; if (obj.buffType === 'magnet') { ctx.strokeStyle = buffGrad; ctx.lineWidth = 15*s; ctx.beginPath(); ctx.arc(p.x, p.y - w, w*0.6, 0, Math.PI); ctx.stroke(); ctx.fillStyle = '#e74c3c'; ctx.fillRect(p.x - w*0.6 - 7.5*s, p.y - w - 10*s, 15*s, 10*s); ctx.fillRect(p.x + w*0.6 - 7.5*s, p.y - w - 10*s, 15*s, 10*s); } else if (obj.buffType === 'dash') { ctx.fillStyle = buffGrad; ctx.beginPath(); ctx.moveTo(p.x, p.y - w*2); ctx.lineTo(p.x+w*0.5, p.y-w); ctx.lineTo(p.x, p.y); ctx.lineTo(p.x-w*0.5, p.y-w); ctx.fill(); } else { ctx.fillStyle = buffGrad; ctx.beginPath(); ctx.ellipse(p.x, p.y - w, w, w*0.6, 0, 0, Math.PI*2); ctx.fill(); } ctx.shadowBlur = 0; ctx.fillStyle = 'white'; ctx.font = `bold ${Math.max(10, 14*s)}px Arial`; ctx.textAlign="center"; ctx.fillText(obj.buffType.toUpperCase(), p.x, p.y - w + 5*s); }
                else if (obj.type === 'gate' || obj.type === 'gate_special' || obj.type === 'blinking_gate') { let w = 95 * s; let h = 180 * s; let color = obj.color; let text = obj.text; let sub = obj.sub || ""; if (obj.type === 'blinking_gate') { let isGoodNow = Math.floor(obj.timer / 25) % 2 === 0; color = isGoodNow ? '#2ecc71' : '#e74c3c'; text = isGoodNow ? "+? CƠ HỘI" : "-? CẠM BẪY"; ctx.shadowBlur = 20 * s; ctx.shadowColor = color; } let glassGrad = ctx.createLinearGradient(p.x - w/2, p.y - h, p.x + w/2, p.y); glassGrad.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ', 0.5)')); glassGrad.addColorStop(1, 'rgba(255,255,255,0.05)'); ctx.fillStyle = glassGrad; ctx.fillRect(p.x - w/2, p.y - h, w, h); ctx.strokeStyle = color; ctx.lineWidth = (obj.type === 'gate_special' ? 12 : 8) * s; ctx.strokeRect(p.x - w/2, p.y - h, w, h); ctx.shadowBlur = 0; ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(p.x - w/2, p.y - h - (45 * s), w, 45 * s, 5*s); ctx.fill(); ctx.fillStyle = 'white'; ctx.textAlign = "center"; ctx.font = `bold ${Math.max(10, (obj.type === 'gate_special' ? 20 : 16) * s)}px Arial`; if (obj.type === 'gate_special') { let opSymbol = obj.isMul ? 'x' : '/'; ctx.fillText(`${opSymbol}${obj.multiplier}`, p.x, p.y - h - (20 * s)); ctx.font = `bold ${Math.max(6, 9 * s)}px Arial`; ctx.fillText(obj.text, p.x, p.y - h - (5 * s)); } else { ctx.fillText(text, p.x, p.y - h - (20 * s)); ctx.font = `bold ${Math.max(6, 9 * s)}px Arial`; ctx.fillText(sub, p.x, p.y - h - (5 * s)); } } 
                else if (obj.type === 'wall') { let w = 110 * s; let h = 320 * s; ctx.fillStyle = obj.color; ctx.fillRect(p.x - w/2, p.y - h, w, h); ctx.strokeStyle = '#500000'; ctx.lineWidth = 2*s; for(let wy = p.y - h; wy < p.y; wy += 20*s) { ctx.beginPath(); ctx.moveTo(p.x - w/2, wy); ctx.lineTo(p.x + w/2, wy); ctx.stroke(); } ctx.strokeStyle = '#fff'; ctx.lineWidth = 10 * s; ctx.strokeRect(p.x - w/2, p.y - h, w, h); ctx.fillStyle = 'white'; ctx.font = `bold ${Math.max(10, 16 * s)}px Arial`; ctx.textAlign = "center"; ctx.fillText(obj.text, p.x, p.y - h/1.5); }
                else if (obj.type === 'moving_trap') { let w = 45 * s; ctx.fillStyle = obj.color; ctx.shadowBlur = 15*s; ctx.shadowColor = obj.color; ctx.beginPath(); let rot = frameCount * 0.1; for(let i=0; i<10; i++) { let angle = (i * Math.PI * 2) / 10 + rot; let rad = (i % 2 === 0) ? w : w/2; ctx.lineTo(p.x + Math.cos(angle)*rad, p.y - w + Math.sin(angle)*rad); } ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = 'white'; ctx.font = `bold ${Math.max(10, 14*s)}px Arial`; ctx.textAlign="center"; ctx.fillText(obj.text, p.x, p.y - w*2.2); }
                else if (obj.type === 'fakenews') { let size = 80 * s; let glitch = (Math.random() * 10 - 5) * s; ctx.fillStyle = obj.color; ctx.fillRect(p.x - size/2 + glitch, p.y - size - 20*s, size, size); ctx.fillStyle = '#00ffcc'; ctx.font = `bold ${Math.max(10, 16 * s)}px Arial`; ctx.textAlign = "center"; ctx.fillText("TIN GIẢ", p.x + glitch, p.y - size - 30*s); }
                else if (obj.type === 'trap') { let w = 90 * s; let h = 30 * s; let trapGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, w); trapGrad.addColorStop(0, '#000'); trapGrad.addColorStop(1, 'rgba(20, 30, 40, 0)'); ctx.fillStyle = trapGrad; ctx.beginPath(); ctx.ellipse(p.x, p.y, w, h, 0, 0, Math.PI*2); ctx.fill(); }
            }
        }
    }
}