import { SETTINGS } from './config.js'; // Nhúng SETTINGS vào Audio

export class AudioManager {
    constructor() {
        this.sounds = {};
        this.bgm = null;
        this.isInitialized = false;

        const audioFiles = {
            jump: 'asset/sounds/jump.wav',
            fall: 'asset/sounds/fall.wav',
            coin: 'asset/sounds/coin.wav',
            letter: 'asset/sounds/letter.wav',
            buff: 'asset/sounds/buff.wav',
            error: 'asset/sounds/error.wav',
            hit: 'asset/sounds/hit.wav',
            rush: 'asset/sounds/rush.wav',
            smash: 'asset/sounds/smash.wav',
            gameover: 'asset/sounds/gameover.wav',
            bgm: 'asset/sounds/bgm.mp3'
        };

        for (let key in audioFiles) {
            this.sounds[key] = new Audio(audioFiles[key]);
            this.sounds[key].preload = 'auto'; 
        }
        
        this.bgm = this.sounds['bgm'];
        if (this.bgm) {
            this.bgm.loop = true;
            this.bgm.volume = SETTINGS.bgmVolume * 0.4; // Giảm âm lượng gốc xuống để làm nền
        }
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
    }

    play(name, baseVolume = 0.5) {
        if (!this.sounds[name] || name === 'bgm') return;
        if (SETTINGS.sfxVolume <= 0) return; // Nếu tắt SFX thì không kêu
        
        let finalVolume = baseVolume * SETTINGS.sfxVolume;
        let soundClone = this.sounds[name].cloneNode();
        soundClone.volume = finalVolume;
        soundClone.play().catch(e => {}); 
    }

    playBGM() {
        if (!this.bgm || SETTINGS.bgmVolume <= 0) return;
        
        if (this.bgm.currentTime > 0 && this.bgm.paused) {
             // Chỉ play tiếp nếu đang bị dừng
        } else {
            this.bgm.currentTime = 0; // Chơi ván mới
        }
        
        this.bgm.play().catch(e => console.warn("Chưa load kịp BGM:", e));
    }

    pauseBGM() {
        if (!this.bgm) return;
        this.bgm.pause();
    }

    // HÀM MỚI: CẬP NHẬT TỨC THÌ KHI KÉO THANH ÂM LƯỢNG
    updateBGMVolume() {
        if (!this.bgm) return;
        if (SETTINGS.bgmVolume <= 0) {
            this.bgm.pause();
        } else {
            this.bgm.volume = SETTINGS.bgmVolume * 0.4; // 0.4 là hệ số âm lượng nền mặc định
            if (this.bgm.paused && this.isInitialized) {
                this.bgm.play().catch(e => {});
            }
        }
    }
}

export const audio = new AudioManager();