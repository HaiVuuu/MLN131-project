import { GameEngine } from './engine.js';
import { audio } from './audio.js'; // Nhúng hệ thống âm thanh

window.onload = () => {
    const engine = new GameEngine('gameCanvas');
    
    // Mở khóa âm thanh ngay khi người dùng tương tác lần đầu
    const unlockAudio = () => {
        audio.init();
        window.removeEventListener('mousedown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
    
    window.addEventListener('mousedown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    requestAnimationFrame((ts) => engine.loop(ts));
};