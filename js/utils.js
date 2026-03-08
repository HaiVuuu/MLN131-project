import { CONFIG } from './config.js';

export class Utils {
    static lerpColor(a, b, amount) { 
        let ah = parseInt(a.replace(/#/g, ''), 16), ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff;
        let bh = parseInt(b.replace(/#/g, ''), 16), br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff;
        let rr = ar + amount * (br - ar), rg = ag + amount * (bg - ag), rb = ab + amount * (bb - ab);
        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
    }
    static hexToRgba(hex, alpha) {
        let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    static project(x, y_height, z) {
        if (z < 10) return null; 
        const scale = CONFIG.focalLength / (z + CONFIG.focalLength);
        const px = CONFIG.canvasWidth / 2 + x * scale;
        const py = CONFIG.horizonY + (CONFIG.canvasHeight - CONFIG.horizonY) * scale - y_height * scale; 
        return { x: px, y: py, scale: scale };
    }
}