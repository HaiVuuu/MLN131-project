import { GameEngine } from './engine.js';
window.onload = () => {
    const engine = new GameEngine('gameCanvas');
    requestAnimationFrame((ts) => engine.loop(ts));
};