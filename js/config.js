export const CONFIG = {
    canvasWidth: 400,
    canvasHeight: 700,
    horizonY: 240, 
    focalLength: 300,
    lanes: [-200, -100, 0, 100, 200], 
    laneDividers: [-150, -50, 50, 150], 
    roadWidth: 280, 
    baseSpeed: 12, 
    maxSpeed: 38,
    jumpVelocity: 25, 
    gravity: 1.5,
    targetWords: [
        ['T', 'U', 'H', 'A', 'O'],             // Nhiệt (5 chữ -> Rush 10s)
        ['B', 'A', 'N', 'L', 'I', 'N', 'H'],   // Bản lĩnh (7 chữ -> Rush 14s)
        ['S', 'A', 'N', 'G', 'T', 'A', 'O'],   // Sáng tạo (7 chữ -> Rush 14s)
        ['K', 'H', 'A', 'T', 'V', 'O', 'N', 'G'], // Khát vọng (8 chữ -> Rush 16s)
        ['T', 'I', 'E', 'N', 'P', 'H', 'O', 'N', 'G'], // Tiên phong (9 chữ -> Rush 18s)
        ['D', 'A', 'N', 'D', 'A', 'T'],       // Dẫn dắt (6 chữ -> Rush 12s)
        ['K', 'Y', 'L', 'U', 'A', 'T'],       // Kỷ luật (6 chữ -> Rush 12s)
        ['D', 'O', 'I', 'M', 'O', 'I'],       // Đổi mới (6 chữ -> Rush 12s)
    ]
};

export const SETTINGS = {
    screenShake: true 
};

export const GAME_DATA = {
    gateContent: {
        1: { good: "Tự học", bad: "Lười biếng" },
        2: { good: "Kỷ luật", bad: "Chây ì" },
        3: { good: "Đổi mới", bad: "Thành tích" },
        4: { good: "Dẫn dắt", bad: "Tự mãn" },
        5: { good: "Kiến thiết", bad: "Suy thoái" }
    },
    specialGates: {
        mul: [ { text: "Thành tựu", val: 2 }, { text: "Giải QG", val: 3 }, { text: "Đột phá AI", val: 4 } ],
        div: [ { text: "Phát ngôn bừa", val: 2 }, { text: "Khủng hoảng TT", val: 3 }, { text: "Bê bối", val: 4 } ]
    }
};