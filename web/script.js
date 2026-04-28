// ==========================================
// Pixel Art Top Down - Web Implementation
// COLLISION EDITOR + DEPTH ZONES + GAME
// ==========================================
localStorage.clear(); // TEMP: force use file data, remove this line when stable

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('reset-button');

// ===================== MOBILE DETECTION & CANVAS RESIZE =====================
const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
// Also listen to orientationchange for mobile
window.addEventListener('orientationchange', () => { setTimeout(resizeCanvas, 150); });

// ===================== ASSETS =====================
const sceneImg = new Image();
const infernoImg = new Image();
const animations = {
    idle: { down: new Image(), left: new Image(), right: new Image(), up: new Image() },
    run: { down: new Image(), left: new Image(), right: new Image(), up: new Image() }
};
const ASSETS_TOTAL = 11; // 2 scenes + 8 animations + 1 hojarasgada
let assetsLoaded = 0;

// Function zone assets
const hojarasgadaImg = new Image();

// YouTube videos for Function 1 (rows of up to 5 videos)
const function1Videos = [
    // Row 1
    { id: '_NS3U2nwk0g', title: 'Matemáticas' },
    { id: 'a-H0e27KNUk', title: 'Binomio' },
    { id: '6xGq9M1XW0U', title: 'Cuadrado de Binomio' }
];

// Preload YouTube thumbnails
const videoThumbnails = {};
function preloadVideoThumbnails() {
    for (const v of function1Videos) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`;
        videoThumbnails[v.id] = img;
    }
}

// Store computed thumbnail rects for click detection
let thumbnailRects = [];

// ===================== EXERCISE DATA =====================
const exerciseData = {
    easy: [
        // I. Suma
        { q: '(3x + 2y) + (4x + 5y)', a: '7x + 7y', topic: 'Suma' },
        { q: '7a - 3b + 2a + 8b', a: '9a + 5b', topic: 'Suma' },
        { q: '(x + y) + (x - y)', a: '2x', topic: 'Suma' },
        { q: '10m² + 5m² - 2m²', a: '13m²', topic: 'Suma' },
        // I. Multiplicación
        { q: '3(2x + 4)', a: '6x + 12', topic: 'Multiplicación' },
        { q: 'x(x - 5)', a: 'x² - 5x', topic: 'Multiplicación' },
        { q: '2a(3a + b)', a: '6a² + 2ab', topic: 'Multiplicación' },
        { q: '(x + 1)(x + 2)', a: 'x² + 3x + 2', topic: 'Multiplicación' },
        // I. División
        { q: '10x⁴ / 2x²', a: '5x²', topic: 'División' },
        { q: '15a³b / 3ab', a: '5a²', topic: 'División' },
        { q: '(x² + x) / x', a: 'x + 1', topic: 'División' },
        { q: '-20m⁵ / 4m²', a: '-5m³', topic: 'División' },
        // II. Binomio al cuadrado
        { q: '(x + 4)²', a: 'x² + 8x + 16', topic: 'Binomio²' },
        { q: '(y - 3)²', a: 'y² - 6y + 9', topic: 'Binomio²' },
        { q: '(a + 1)²', a: 'a² + 2a + 1', topic: 'Binomio²' },
        { q: '(2 - x)²', a: '4 - 4x + x²', topic: 'Binomio²' },
        // II. Diferencia de cuadrados
        { q: '(x + 5)(x - 5)', a: 'x² - 25', topic: 'Dif. Cuadrados' },
        { q: '(a - 8)(a + 8)', a: 'a² - 64', topic: 'Dif. Cuadrados' },
        { q: '(y + 1)(y - 1)', a: 'y² - 1', topic: 'Dif. Cuadrados' },
        { q: '(10 - b)(10 + b)', a: '100 - b²', topic: 'Dif. Cuadrados' }
    ],
    medium: [
        // I. Suma
        { q: '(x² - 5x + 6) + (3x² + 2x - 1)', a: '4x² - 3x + 5', topic: 'Suma' },
        { q: '(2ab + 3bc) + (5ab - bc + 4ac)', a: '7ab + 2bc + 4ac', topic: 'Suma' },
        { q: '4x²y - 2xy² + 3x²y + 8xy²', a: '7x²y + 6xy²', topic: 'Suma' },
        { q: '(3a - 2b + c) + (b - 5c + 4a)', a: '7a - b - 4c', topic: 'Suma' },
        // I. Multiplicación
        { q: '(2x - 3)(x + 4)', a: '2x² + 5x - 12', topic: 'Multiplicación' },
        { q: '3x²(4x² - 2x + 1)', a: '12x⁴ - 6x³ + 3x²', topic: 'Multiplicación' },
        { q: '(a + b)(a² - ab + b²)', a: 'a³ + b³', topic: 'Multiplicación' },
        { q: '-5ab²(2a²b - 3b + 4)', a: '-10a³b³ + 15ab³ - 20ab²', topic: 'Multiplicación' },
        // I. División
        { q: '(12x³ - 8x² + 4x) / 4x', a: '3x² - 2x + 1', topic: 'División' },
        { q: '(a²b² - ab³ + 2a²b) / ab', a: 'ab - b² + 2a', topic: 'División' },
        { q: '(x² + 7x + 10) ÷ (x + 2)', a: 'x + 5', topic: 'División' },
        { q: '(18x⁴y² - 9x²y³) / 9x²y', a: '2x²y - xy²', topic: 'División' },
        // II. Binomio al cuadrado
        { q: '(2x + 5)²', a: '4x² + 20x + 25', topic: 'Binomio²' },
        { q: '(3a - 4b)²', a: '9a² - 24ab + 16b²', topic: 'Binomio²' },
        { q: '(5y + 1)²', a: '25y² + 10y + 1', topic: 'Binomio²' },
        { q: '(x² - 2)²', a: 'x⁴ - 4x² + 4', topic: 'Binomio²' },
        // II. Diferencia de cuadrados
        { q: '(3x - 2)(3x + 2)', a: '9x² - 4', topic: 'Dif. Cuadrados' },
        { q: '(5a + 4b)(5a - 4b)', a: '25a² - 16b²', topic: 'Dif. Cuadrados' },
        { q: '(x² - 9)(x² + 9)', a: 'x⁴ - 81', topic: 'Dif. Cuadrados' },
        { q: '(2xy - 7)(2xy + 7)', a: '4x²y² - 49', topic: 'Dif. Cuadrados' }
    ],
    hard: [
        // I. Suma
        { q: '(1/2x² + 2/3x) + (3/4x² - 1/6x)', a: '5/4x² + 1/2x', topic: 'Suma' },
        { q: '(2√x + 5y) + (3√x - 8y)', a: '5√x - 3y', topic: 'Suma' },
        { q: '(aⁿ + 3bᵐ) + (2aⁿ - bᵐ + c)', a: '3aⁿ + 2bᵐ + c', topic: 'Suma' },
        { q: '5[x - (2y + 3)] + 2[3x - (y - 1)]', a: '11x - 12y - 13', topic: 'Suma' },
        // I. Multiplicación
        { q: '(2x² - 3x + 5)(x² + 2x - 1)', a: '2x⁴ + x³ - 3x² + 13x - 5', topic: 'Multiplicación' },
        { q: '(xⁿ + 1)(xⁿ - 2)', a: 'x²ⁿ - xⁿ - 2', topic: 'Multiplicación' },
        { q: '(a + b + c)(a - b - c)', a: 'a² - b² - 2bc - c²', topic: 'Multiplicación' },
        // I. División
        { q: '(2x³ - 5x² + 3x - 2) ÷ (x - 2)', a: '2x² - x + 1', topic: 'División' },
        { q: '(x² - 9) / (x + 3)', a: 'x - 3', topic: 'División' },
        { q: '(x⁴ - 1) ÷ (x - 1)', a: 'x³ + x² + x + 1', topic: 'División' },
        // II. Binomio al cuadrado
        { q: '(4x³ + 5y²)²', a: '16x⁶ + 40x³y² + 25y⁴', topic: 'Binomio²' },
        { q: '(xⁿ + 1)²', a: 'x²ⁿ + 2xⁿ + 1', topic: 'Binomio²' },
        { q: '(3a²b - 5c³)²', a: '9a⁴b² - 30a²bc³ + 25c⁶', topic: 'Binomio²' },
        // II. Diferencia de cuadrados
        { q: '(a³b² - 6c)(a³b² + 6c)', a: 'a⁶b⁴ - 36c²', topic: 'Dif. Cuadrados' },
        { q: '(x²ⁿ - yⁿ)(x²ⁿ + yⁿ)', a: 'x⁴ⁿ - y²ⁿ', topic: 'Dif. Cuadrados' },
        { q: '(11m⁴n⁵ - 1)(11m⁴n⁵ + 1)', a: '121m⁸n¹⁰ - 1', topic: 'Dif. Cuadrados' }
    ]
};

// ===================== EXERCISE DATA - FUNCIÓN 6 (Fracciones) =====================
const exercise6Data = {
    easy: [
        { q: '(x²-9)/(x-3)', a: 'x+3', topic: 'Simplificación' },
        { q: '(a²-4a+4)/(a-2)', a: 'a-2', topic: 'Simplificación' },
        { q: '(m²-16)/(m-4)', a: 'm+4', topic: 'Simplificación' }
    ],
    medium: [
        { q: 'x/(x-1)+1/(x+1)', a: '(x(x+1)+(x-1))/((x-1)(x+1))', topic: 'Suma de Fracciones' },
        { q: '2/(x-2)-1/(x+2)', a: '(2(x+2)-(x-2))/((x-2)(x+2))', topic: 'Suma de Fracciones' },
        { q: '3/x+2/(x+1)', a: '(3(x+1)+2x)/(x(x+1))', topic: 'Suma de Fracciones' }
    ],
    hard: [
        { q: '(x²-1)/x·x/(x+1)', a: 'x-1', topic: 'Multiplicación de Fracciones' },
        { q: '(a²-4)/a·a/(a+2)', a: 'a-2', topic: 'Multiplicación de Fracciones' },
        { q: '(m²-9)/m·m/(m+3)', a: 'm-3', topic: 'Multiplicación de Fracciones' }
    ]
};

// Track solved exercises { 'easy_0': true, 'medium_3': true, ... }
const solvedExercises = {};
// Track solved exercises for function 6 specifically
const solvedExercises6 = {};

// ===================== EXERCISE OVERLAY CONTROLLER =====================
let exerciseOverlayOpen = false;
let currentExerciseDifficulty = null;
let currentExerciseIndex = null;

function normalizeAnswer(str) {
    return str.replace(/\s+/g, '').toLowerCase()
        .replace(/\*\*/g, '^')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/[²]/g, '^2')
        .replace(/[³]/g, '^3')
        .replace(/[⁴]/g, '^4')
        .replace(/[⁵]/g, '^5')
        .replace(/[⁶]/g, '^6')
        .replace(/[⁷]/g, '^7')
        .replace(/[⁸]/g, '^8')
        .replace(/[⁹]/g, '^9')
        .replace(/[ⁿ]/g, '^n')
        .replace(/[ᵐ]/g, '^m')
        .replace(/[¹⁰]/g, '^10')
        .replace(/√/g, 'sqrt');
}

function openExerciseOverlay(difficulty) {
    exerciseOverlayOpen = true;
    currentExerciseDifficulty = difficulty;
    currentExerciseIndex = null;
    const overlay = document.getElementById('exercise-overlay');
    overlay.style.display = 'block';

    // Apply difficulty-specific background class
    const panel = document.getElementById('exercise-panel');
    panel.className = 'diff-' + difficulty;
    panel.scrollTop = 0; // Reset scroll position

    buildExerciseList(difficulty);
    document.getElementById('exercise-active').style.display = 'none';
    document.getElementById('exercise-list').style.display = 'grid';
}

function buildExerciseList(difficulty) {
    const list = document.getElementById('exercise-list');
    const exercises = exerciseData[difficulty];
    list.innerHTML = '';
    exercises.forEach((ex, i) => {
        const key = `${difficulty}_${i}`;
        const solved = solvedExercises[key];
        const card = document.createElement('div');
        card.className = 'exercise-card' + (solved ? ' solved' : '');
        card.innerHTML = `<div class="card-number">${solved ? '✅' : '#' + (i + 1)} — ${ex.topic}</div>${ex.q}`;
        card.addEventListener('click', () => selectExercise(difficulty, i));
        list.appendChild(card);
    });
}

function selectExercise(difficulty, index) {
    currentExerciseIndex = index;
    const ex = exerciseData[difficulty][index];
    document.getElementById('exercise-list').style.display = 'none';
    document.getElementById('exercise-active').style.display = 'block';
    document.getElementById('exercise-question').textContent = ex.q;
    const input = document.getElementById('exercise-answer');
    input.value = '';
    input.className = '';
    input.disabled = false;
    document.getElementById('exercise-feedback').textContent = '';
    document.getElementById('exercise-feedback').className = '';
    setTimeout(() => input.focus(), 100);
}

function checkAnswer() {
    if (currentExerciseIndex === null) return;
    const ex = exerciseData[currentExerciseDifficulty][currentExerciseIndex];
    const input = document.getElementById('exercise-answer');
    const feedback = document.getElementById('exercise-feedback');
    const userAnswer = normalizeAnswer(input.value.trim());
    const correctAnswer = normalizeAnswer(ex.a);

    // Reset animation
    feedback.className = '';
    input.className = '';
    void feedback.offsetWidth; // Force reflow for re-animation

    if (userAnswer === correctAnswer) {
        feedback.textContent = '🎉 ¡Felicidades crack!';
        feedback.className = 'correct';
        input.className = 'input-correct';
        input.disabled = true;
        solvedExercises[`${currentExerciseDifficulty}_${currentExerciseIndex}`] = true;
    } else {
        feedback.textContent = '📚 Sigue estudiando';
        feedback.className = 'incorrect';
        input.className = 'input-incorrect';
        // Remove shake class after animation ends so it can re-trigger
        setTimeout(() => { input.className = ''; }, 500);
    }
}

function closeExerciseOverlay() {
    exerciseOverlayOpen = false;
    currentExerciseDifficulty = null;
    currentExerciseIndex = null;
    document.getElementById('exercise-overlay').style.display = 'none';
    // Also close the canvas-based function overlay
    functionOverlay.active = false;
    functionOverlay.phase = 'none';
    functionOverlay.alpha = 0;
}

// Exercise overlay button handlers (set up after DOM ready)
function setupExerciseHandlers() {
    document.getElementById('exercise-submit').addEventListener('click', checkAnswer);
    document.getElementById('exercise-answer').addEventListener('keydown', (e) => {
        e.stopPropagation(); // Prevent game keys from firing
        if (e.key === 'Enter') checkAnswer();
    });
    document.getElementById('exercise-answer').addEventListener('keyup', (e) => e.stopPropagation());
    document.getElementById('exercise-back').addEventListener('click', () => {
        document.getElementById('exercise-active').style.display = 'none';
        document.getElementById('exercise-list').style.display = 'grid';
        buildExerciseList(currentExerciseDifficulty);
        currentExerciseIndex = null;
    });
    document.getElementById('exercise-close').addEventListener('click', closeExerciseOverlay);
}

// ===================== FUNCIÓN 6 - EXERCISE OVERLAY =====================
let exercise6OverlayOpen = false;
let currentExercise6Category = null; // 'easy' | 'medium' | 'hard' | null (list view)
let currentExercise6Index = null;

function allExercises6Solved() {
    for (const cat of ['easy', 'medium', 'hard']) {
        for (let i = 0; i < exercise6Data[cat].length; i++) {
            if (!solvedExercises6[`${cat}_${i}`]) return false;
        }
    }
    return true;
}

function openExercise6Overlay() {
    exercise6OverlayOpen = true;
    currentExercise6Category = null;
    currentExercise6Index = null;
    const overlay = document.getElementById('exercise6-overlay');
    overlay.style.display = 'flex';
    showExercise6List();
}

function showExercise6List() {
    document.getElementById('ex6-list-view').style.display = 'block';
    document.getElementById('ex6-active-view').style.display = 'none';
    buildExercise6List();
}

function buildExercise6List() {
    const container = document.getElementById('ex6-categories');
    container.innerHTML = '';
    const labels = { easy: 'Simplificación', medium: 'Suma de Fracciones', hard: 'Multiplicación' };
    for (const cat of ['easy', 'medium', 'hard']) {
        const section = document.createElement('div');
        section.className = 'ex6-section';
        const h = document.createElement('h3');
        h.textContent = labels[cat];
        section.appendChild(h);
        exercise6Data[cat].forEach((ex, i) => {
            const key = `${cat}_${i}`;
            const solved = solvedExercises6[key];
            const card = document.createElement('div');
            card.className = 'ex6-card' + (solved ? ' ex6-solved' : '');
            card.innerHTML = `<span class="ex6-num">${solved ? '✅' : '#' + (i + 1)}</span><span class="ex6-q">${ex.q}</span>`;
            card.addEventListener('click', () => selectExercise6(cat, i));
            section.appendChild(card);
        });
        container.appendChild(section);
    }
}

function selectExercise6(cat, index) {
    currentExercise6Category = cat;
    currentExercise6Index = index;
    const ex = exercise6Data[cat][index];
    document.getElementById('ex6-list-view').style.display = 'none';
    document.getElementById('ex6-active-view').style.display = 'block';
    document.getElementById('ex6-question').textContent = ex.q;
    const inp = document.getElementById('ex6-answer');
    inp.value = '';
    inp.className = '';
    inp.disabled = false;
    document.getElementById('ex6-feedback').textContent = '';
    document.getElementById('ex6-feedback').className = '';
    setTimeout(() => inp.focus(), 100);
}

function checkAnswer6() {
    if (currentExercise6Index === null) return;
    const ex = exercise6Data[currentExercise6Category][currentExercise6Index];
    const inp = document.getElementById('ex6-answer');
    const fb = document.getElementById('ex6-feedback');
    const user = normalizeAnswer(inp.value.trim());
    const correct = normalizeAnswer(ex.a);

    fb.className = '';
    inp.className = '';
    void fb.offsetWidth;

    if (user === correct) {
        fb.textContent = '🎉 ¡Correcto!';
        fb.className = 'correct';
        inp.className = 'input-correct';
        inp.disabled = true;
        solvedExercises6[`${currentExercise6Category}_${currentExercise6Index}`] = true;
        // Check if all 9 are done
        if (allExercises6Solved()) {
            setTimeout(() => {
                closeExercise6Overlay();
                startCredits();
            }, 1200);
        }
    } else {
        fb.textContent = '📚 Sigue estudiando';
        fb.className = 'incorrect';
        inp.className = 'input-incorrect';
        setTimeout(() => { inp.className = ''; }, 500);
    }
}

function closeExercise6Overlay() {
    exercise6OverlayOpen = false;
    currentExercise6Category = null;
    currentExercise6Index = null;
    document.getElementById('exercise6-overlay').style.display = 'none';
    functionOverlay.active = false;
    functionOverlay.phase = 'none';
    functionOverlay.alpha = 0;
}

function setupExercise6Handlers() {
    document.getElementById('ex6-submit').addEventListener('click', checkAnswer6);
    document.getElementById('ex6-answer').addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') checkAnswer6();
    });
    document.getElementById('ex6-answer').addEventListener('keyup', (e) => e.stopPropagation());
    document.getElementById('ex6-back').addEventListener('click', () => showExercise6List());
    document.getElementById('ex6-close').addEventListener('click', closeExercise6Overlay);
}

// ===================== CRÉDITOS =====================
const creditsLines = [
    { text: 'Has completado los Infiernos', style: 'credits-title' },
    { text: '', style: 'credits-blank' },
    { text: '✦ ✦ ✦', style: 'credits-stars' },
    { text: '', style: 'credits-blank' },
    { text: 'FRACCIONES ALGEBRAICAS', style: 'credits-section' },
    { text: 'Simplificación · Suma · Multiplicación', style: 'credits-sub' },
    { text: '', style: 'credits-blank' },
    { text: '✦ ✦ ✦', style: 'credits-stars' },
    { text: '', style: 'credits-blank' },
    { text: 'Diseño & Programación', style: 'credits-role' },
    { text: 'El estudiante que sobrevivió al infierno', style: 'credits-name' },
    { text: '', style: 'credits-blank' },
    { text: 'Matemáticas', style: 'credits-role' },
    { text: 'El profe que mandó al infierno', style: 'credits-name' },
    { text: '', style: 'credits-blank' },
    { text: '✦ ✦ ✦', style: 'credits-stars' },
    { text: '', style: 'credits-blank' },
    { text: '"Las matemáticas son el infierno...', style: 'credits-quote' },
    { text: 'pero tú las domaste."', style: 'credits-quote' },
    { text: '', style: 'credits-blank' },
    { text: '— FIN —', style: 'credits-fin' },
    { text: '', style: 'credits-blank' },
    { text: '', style: 'credits-blank' },
    { text: '', style: 'credits-blank' },
];

let creditsActive = false;
let creditsScrollY = 0;
let creditsSpeed = 35; // px/s
let creditsTotalHeight = 0;
let creditsFinished = false;

function startCredits() {
    creditsActive = true;
    creditsFinished = false;
    creditsScrollY = 0;
    const overlay = document.getElementById('credits-overlay');
    overlay.style.display = 'flex';

    // Build credits DOM
    const inner = document.getElementById('credits-inner');
    inner.innerHTML = '';
    creditsLines.forEach(line => {
        const el = document.createElement('div');
        el.className = line.style || 'credits-blank';
        el.textContent = line.text;
        inner.appendChild(el);
    });

    // Reset position — start below viewport
    const overlayH = overlay.clientHeight;
    inner.style.transform = `translateY(${overlayH}px)`;
    creditsTotalHeight = inner.scrollHeight;

    document.getElementById('credits-return-btn').style.display = 'none';

    // Animate
    let last = null;
    function tick(ts) {
        if (!creditsActive) return;
        if (!last) last = ts;
        const dt = (ts - last) / 1000;
        last = ts;
        creditsScrollY += creditsSpeed * dt;
        const translateY = overlayH - creditsScrollY;
        inner.style.transform = `translateY(${translateY}px)`;

        if (translateY < -(creditsTotalHeight + 40) && !creditsFinished) {
            creditsFinished = true;
            document.getElementById('credits-return-btn').style.display = 'inline-block';
        }
        if (!creditsFinished) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

function returnToLimbo() {
    creditsActive = false;
    document.getElementById('credits-overlay').style.display = 'none';
    // Trigger map transition back to limbo
    loadingScreen.active = true;
    loadingScreen.phase = 'fade_out';
    loadingScreen.alpha = 0;
    loadingScreen.targetMap = 'limbo';
    loadingScreen.spawnX = 600;
    loadingScreen.spawnY = 500;
    loadingScreen.text = 'Regresando al Limbo...';
}

// ===================== MAP SYSTEM =====================
let currentMap = 'limbo'; // 'limbo' or 'infierno'

// Loading screen state
const loadingScreen = {
    active: false,
    phase: 'none', // 'fade_out', 'loading', 'fade_in'
    alpha: 0,
    targetMap: null,
    spawnX: 0,
    spawnY: 0,
    text: ''
};

// Function overlay state (for displaying function zone content)
const functionOverlay = {
    active: false,
    phase: 'none', // 'fade_in', 'showing', 'fade_out'
    alpha: 0,
    functionId: 0
};

// Click handler for video thumbnails in function overlay
canvas.addEventListener('click', (e) => {
    if (!functionOverlay.active || functionOverlay.phase !== 'showing') return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    for (const tr of thumbnailRects) {
        if (clickX >= tr.x && clickX <= tr.x + tr.w && clickY >= tr.y && clickY <= tr.y + tr.h) {
            window.open(`https://www.youtube.com/watch?v=${tr.videoId}`, '_blank');
            return;
        }
    }
});

// ===================== COLLISION DATA (per layer) =====================
// RED boxes - block player movement
let layerCollisions = {
    1: [
        { x: 0, y: 0, w: 120, h: 1200 },
        { x: 990, y: 0, w: 210, h: 1200 },
        { x: 0, y: 1040, w: 1200, h: 160 },
        { x: 0, y: 0, w: 1200, h: 500 },
        { x: 216, y: 0, w: 674, h: 805 },
        { x: 230, y: 700, w: 85, h: 40 },
        { x: 802, y: 170, w: 60, h: 30 }
    ],
    2: [
        { x: -178, y: -68, w: 1200, h: 120 },
        { x: 35, y: 0, w: 130, h: 1200 },
        { x: 1047, y: 25, w: 300, h: 1200 },
        { x: 142, y: 816, w: 86, h: 400 },
        { x: 983, y: 846, w: 70, h: 400 },
        { x: 123, y: 394, w: 170, h: 75 },
        { x: 137, y: 120, w: 156, h: 295 },
        { x: 404, y: 275, w: 5, h: 3 },
        { x: 854, y: 1008, w: 136, h: 66 },
        { x: 919, y: 719, w: 135, h: 134 },
        { x: 1024, y: 378, w: 0, h: 12 },
        { x: 221, y: 810, w: 72, h: 42 },
        { x: 155, y: 655, w: 138, h: 156 },
        { x: 151, y: 451, w: 77, h: 17 },
        { x: 272, y: 220, w: 53, h: 121 },
        { x: 321, y: 251, w: 100, h: 26 },
        { x: 418, y: 271, w: 90, h: 5 },
        { x: 503, y: 272, w: 6, h: 98 },
        { x: 439, y: 367, w: 70, h: 4 },
        { x: 439, y: 373, w: 6, h: 59 },
        { x: 319, y: 331, w: 6, h: 39 },
        { x: 319, y: 367, w: 69, h: 5 },
        { x: 319, y: 375, w: 68, h: 40 },
        { x: 444, y: 372, w: 64, h: 42 },
        { x: 383, y: 413, w: 6, h: 19 },
        { x: 415, y: 143, w: 6, h: 124 },
        { x: 416, y: 142, w: 228, h: 5 },
        { x: 575, y: 79, w: 6, h: 65 },
        { x: 574, y: 149, w: 70, h: 35 },
        { x: 564, y: 189, w: 29, h: 37 },
        { x: 565, y: 188, w: 29, h: 1 },
        { x: 566, y: 228, w: 27, h: 2 },
        { x: 567, y: 185, w: 25, h: 3 },
        { x: 638, y: 182, w: 8, h: 32 },
        { x: 695, y: 143, w: 6, h: 73 },
        { x: 695, y: 143, w: 71, h: 42 },
        { x: 575, y: 46, w: 38, h: 38 },
        { x: 727, y: 42, w: 42, h: 42 },
        { x: 759, y: 85, w: 118, h: 63 },
        { x: 824, y: 132, w: 76, h: 112 },
        { x: 887, y: 207, w: 84, h: 133 },
        { x: 920, y: 332, w: 137, h: 168 },
        { x: 919, y: 468, w: 6, h: 63 },
        { x: 919, y: 570, w: 6, h: 151 },
        { x: 931, y: 506, w: 20, h: 14 },
        { x: 934, y: 620, w: 19, h: 48 },
        { x: 929, y: 609, w: 9, h: 20 },
        { x: 1023, y: 673, w: 6, h: 35 },
        { x: 926, y: 571, w: 5, h: 12 },
        { x: 932, y: 573, w: 4, h: 12 },
        { x: 938, y: 576, w: 3, h: 12 },
        { x: 943, y: 580, w: 4, h: 11 },
        { x: 949, y: 582, w: 3, h: 11 },
        { x: 980, y: 600, w: 7, h: 9 },
        { x: 972, y: 595, w: 6, h: 13 },
        { x: 965, y: 591, w: 5, h: 12 },
        { x: 959, y: 587, w: 4, h: 13 },
        { x: 953, y: 585, w: 4, h: 13 },
        { x: 979, y: 598, w: 3, h: 8 },
        { x: 964, y: 590, w: 4, h: 7 },
        { x: 953, y: 584, w: 3, h: 8 },
        { x: 941, y: 583, w: 14, h: 6 },
        { x: 932, y: 535, w: 15, h: 3 },
        { x: 946, y: 543, w: 17, h: 3 },
        { x: 964, y: 550, w: 16, h: 4 },
        { x: 980, y: 559, w: 8, h: 4 },
        { x: 928, y: 528, w: 6, h: 8 },
        { x: 945, y: 539, w: 7, h: 5 },
        { x: 962, y: 547, w: 6, h: 4 },
        { x: 979, y: 555, w: 4, h: 5 },
        { x: 953, y: 540, w: 4, h: 5 },
        { x: 935, y: 531, w: 5, h: 6 },
        { x: 849, y: 367, w: 30, h: 25 },
        { x: 799, y: 336, w: 6, h: 37 },
        { x: 800, y: 334, w: 108, h: 6 },
        { x: 799, y: 426, w: 5, h: 73 },
        { x: 799, y: 495, w: 69, h: 5 },
        { x: 863, y: 495, w: 6, h: 101 },
        { x: 799, y: 591, w: 70, h: 6 },
        { x: 799, y: 599, w: 7, h: 134 },
        { x: 856, y: 655, w: 12, h: 77 },
        { x: 864, y: 729, w: 5, h: 154 },
        { x: 863, y: 879, w: 62, h: 17 },
        { x: 867, y: 898, w: 53, h: 41 },
        { x: 876, y: 940, w: 21, h: 17 },
        { x: 847, y: 893, w: 9, h: 32 },
        { x: 844, y: 907, w: 15, h: 15 },
        { x: 841, y: 913, w: 20, h: 6 },
        { x: 938, y: 873, w: 30, h: 44 },
        { x: 941, y: 861, w: 23, h: 15 },
        { x: 957, y: 987, w: 21, h: 15 },
        { x: 919, y: 853, w: 6, h: 28 },
        { x: 799, y: 1045, w: 29, h: 17 },
        { x: 735, y: 1014, w: 28, h: 15 },
        { x: 709, y: 1044, w: 18, h: 15 },
        { x: 644, y: 1030, w: 9, h: 35 },
        { x: 607, y: 1070, w: 254, h: 5 },
        { x: 607, y: 1007, w: 6, h: 69 },
        { x: 375, y: 933, w: 387, h: 7 },
        { x: 759, y: 815, w: 5, h: 127 },
        { x: 510, y: 335, w: 224, h: 7 },
        { x: 727, y: 336, w: 6, h: 36 },
        { x: 650, y: 474, w: 6, h: 18 },
        { x: 727, y: 425, w: 5, h: 87 },
        { x: 631, y: 495, w: 6, h: 69 },
        { x: 574, y: 496, w: 8, h: 70 },
        { x: 689, y: 540, w: 25, h: 38 },
        { x: 808, y: 536, w: 30, h: 39 },
        { x: 800, y: 502, w: 62, h: 54 },
        { x: 638, y: 495, w: 92, h: 45 },
        { x: 733, y: 426, w: 17, h: 62 },
        { x: 783, y: 426, w: 19, h: 62 },
        { x: 733, y: 367, w: 16, h: 6 },
        { x: 782, y: 367, w: 23, h: 6 },
        { x: 777, y: 628, w: 19, h: 48 },
        { x: 793, y: 619, w: 5, h: 11 },
        { x: 879, y: 704, w: 29, h: 25 },
        { x: 879, y: 838, w: 30, h: 25 },
        { x: 451, y: 921, w: 53, h: 28 },
        { x: 547, y: 921, w: 54, h: 29 },
        { x: 375, y: 879, w: 390, h: 5 },
        { x: 375, y: 885, w: 6, h: 50 },
        { x: 319, y: 879, w: 6, h: 72 },
        { x: 375, y: 935, w: 6, h: 18 },
        { x: 536, y: 987, w: 4, h: 15 },
        { x: 236, y: 983, w: 20, h: 18 },
        { x: 288, y: 879, w: 37, h: 61 },
        { x: 295, y: 941, w: 19, h: 7 },
        { x: 297, y: 950, w: 6, h: 0 },
        { x: 302, y: 945, w: 5, h: 10 },
        { x: 299, y: 946, w: 11, h: 6 },
        { x: 288, y: 843, w: 5, h: 35 },
        { x: 231, y: 852, w: 21, h: 23 },
        { x: 252, y: 851, w: 9, h: 24 },
        { x: 262, y: 860, w: 25, h: 37 },
        { x: 228, y: 1006, w: 385, h: 5 },
        { x: 450, y: 753, w: 24, h: 26 },
        { x: 555, y: 793, w: 10, h: 21 },
        { x: 588, y: 837, w: 30, h: 26 },
        { x: 710, y: 834, w: 30, h: 28 },
        { x: 407, y: 814, w: 358, h: 7 },
        { x: 339, y: 792, w: 51, h: 10 },
        { x: 345, y: 804, w: 40, h: 2 },
        { x: 356, y: 807, w: 24, h: 4 },
        { x: 350, y: 807, w: 33, h: 3 },
        { x: 344, y: 797, w: 40, h: 8 },
        { x: 340, y: 775, w: 7, h: 22 },
        { x: 349, y: 786, w: 2, h: 5 },
        { x: 379, y: 768, w: 8, h: 17 },
        { x: 387, y: 774, w: 5, h: 13 },
        { x: 378, y: 789, w: 13, h: 8 },
        { x: 348, y: 764, w: 7, h: 14 },
        { x: 342, y: 769, w: 4, h: 5 },
        { x: 407, y: 751, w: 6, h: 67 },
        { x: 343, y: 750, w: 70, h: 7 },
        { x: 386, y: 683, w: 23, h: 32 },
        { x: 343, y: 559, w: 6, h: 190 },
        { x: 287, y: 537, w: 6, h: 120 },
        { x: 350, y: 559, w: 126, h: 44 },
        { x: 396, y: 605, w: 18, h: 23 },
        { x: 414, y: 603, w: 0, h: 25 },
        { x: 398, y: 628, w: 14, h: 4 },
        { x: 450, y: 640, w: 22, h: 45 },
        { x: 176, y: 626, w: 21, h: 20 },
        { x: 256, y: 480, w: 37, h: 19 },
        { x: 287, y: 469, w: 6, h: 13 },
        { x: 256, y: 500, w: 29, h: 4 },
        { x: 256, y: 506, w: 17, h: 4 },
        { x: 220, y: 526, w: 15, h: 2 },
        { x: 229, y: 521, w: 14, h: 3 },
        { x: 238, y: 517, w: 12, h: 3 },
        { x: 247, y: 513, w: 13, h: 2 },
        { x: 254, y: 509, w: 2, h: 6 },
        { x: 245, y: 514, w: 4, h: 5 },
        { x: 235, y: 518, w: 5, h: 5 },
        { x: 227, y: 523, w: 5, h: 4 },
        { x: 223, y: 525, w: 7, h: 5 },
        { x: 228, y: 565, w: 61, h: 5 },
        { x: 241, y: 559, w: 51, h: 4 },
        { x: 250, y: 554, w: 40, h: 14 },
        { x: 257, y: 550, w: 33, h: 17 },
        { x: 267, y: 547, w: 27, h: 13 },
        { x: 271, y: 544, w: 22, h: 10 },
        { x: 277, y: 541, w: 14, h: 7 },
        { x: 285, y: 537, w: 8, h: 8 },
        { x: 236, y: 562, w: 22, h: 6 },
        { x: 211, y: 464, w: 7, h: 30 },
        { x: 470, y: 495, w: 7, h: 77 },
        { x: 471, y: 494, w: 109, h: 48 },
        { x: 548, y: 546, w: 24, h: 33 },
        { x: 446, y: 515, w: 8, h: 35 },
        { x: 332, y: 345, w: 22, h: 15 },
        { x: 396, y: 310, w: 35, h: 23 },
        { x: 475, y: 346, w: 22, h: 14 },
        { x: 476, y: 282, w: 21, h: 15 },
        { x: 333, y: 282, w: 20, h: 16 },
        { x: 633, y: 792, w: 31, h: 24 },
        { x: 623, y: 679, w: 30, h: 29 },
        { x: 559, y: 367, w: 31, h: 25 },
        { x: 654, y: 367, w: 31, h: 27 },
        { x: 862, y: 249, w: 21, h: 15 },
        { x: 808, y: 231, w: 9, h: 32 },
        { x: 607, y: 277, w: 21, h: 35 },
        { x: 629, y: 283, w: 7, h: 32 },
        { x: 637, y: 287, w: 5, h: 17 },
        { x: 641, y: 289, w: 6, h: 12 },
        { x: 636, y: 304, w: 7, h: 9 },
        { x: 602, y: 281, w: 18, h: 25 },
        { x: 598, y: 287, w: 19, h: 18 },
        { x: 594, y: 296, w: 10, h: 9 },
        { x: 595, y: 291, w: 9, h: 5 },
        { x: 737, y: 195, w: 18, h: 24 },
        { x: 734, y: 204, w: 22, h: 11 },
        { x: 776, y: 237, w: 16, h: 21 },
        { x: 427, y: 156, w: 21, h: 10 },
        { x: 495, y: 158, w: 10, h: 30 },
        { x: 478, y: 534, w: 101, h: 14 },
        { x: 638, y: 529, w: 93, h: 19 }
    ],
    3: [
        { x: 0, y: 0, w: 1200, h: 80 },
        { x: 0, y: 0, w: 395, h: 1200 },
        { x: 510, y: 70, w: 90, h: 90 },
        { x: 422, y: 155, w: 50, h: 40 },
        { x: 636, y: 155, w: 50, h: 40 },
        { x: 405, y: 110, w: 30, h: 25 },
        { x: 670, y: 110, w: 30, h: 25 },
        { x: 398, y: 879, w: 48, h: 8 }
    ]
};

// ===================== DEPTH ZONES (per layer) =====================
// PURPLE boxes - when player.y < base_y, the map image in this rect
// is redrawn ON TOP of the player, making them "go behind" things
let depthZones = {
    1: [
        { x: 387, y: 792, w: 91, h: 63, base_y: 855 }
    ],
    2: [
        { x: 727, y: 367, w: 80, h: 76, base_y: 466 },
        { x: 957, y: 967, w: 20, h: 19, base_y: 986 },
        { x: 804, y: 1036, w: 20, h: 12, base_y: 1048 },
        { x: 739, y: 994, w: 23, h: 21, base_y: 1015 },
        { x: 743, y: 990, w: 14, h: 6, base_y: 996 },
        { x: 715, y: 1020, w: 6, h: 28, base_y: 1048 },
        { x: 705, y: 1027, w: 24, h: 8, base_y: 1035 },
        { x: 639, y: 933, w: 18, h: 101, base_y: 1034 },
        { x: 618, y: 946, w: 58, h: 89, base_y: 1035 },
        { x: 599, y: 979, w: 101, h: 31, base_y: 1010 },
        { x: 676, y: 950, w: 8, h: 28, base_y: 978 },
        { x: 608, y: 958, w: 10, h: 22, base_y: 980 },
        { x: 627, y: 941, w: 43, h: 5, base_y: 946 },
        { x: 641, y: 462, w: 25, h: 12, base_y: 474 },
        { x: 881, y: 654, w: 26, h: 30, base_y: 684 },
        { x: 885, y: 686, w: 18, h: 18, base_y: 704 },
        { x: 881, y: 788, w: 24, h: 31, base_y: 819 },
        { x: 904, y: 788, w: 4, h: 32, base_y: 820 },
        { x: 885, y: 821, w: 19, h: 16, base_y: 837 },
        { x: 524, y: 978, w: 25, h: 11, base_y: 989 },
        { x: 236, y: 966, w: 20, h: 21, base_y: 987 },
        { x: 450, y: 743, w: 23, h: 11, base_y: 754 },
        { x: 532, y: 741, w: 60, h: 57, base_y: 799 },
        { x: 549, y: 717, w: 20, h: 26, base_y: 743 },
        { x: 570, y: 725, w: 10, h: 18, base_y: 743 },
        { x: 539, y: 728, w: 9, h: 16, base_y: 744 },
        { x: 524, y: 760, w: 8, h: 32, base_y: 792 },
        { x: 589, y: 786, w: 27, h: 30, base_y: 813 },
        { x: 569, y: 847, w: 19, h: 29, base_y: 876 },
        { x: 561, y: 852, w: 10, h: 22, base_y: 874 },
        { x: 589, y: 852, w: 3, h: 20, base_y: 872 },
        { x: 665, y: 856, w: 18, h: 17, base_y: 873 },
        { x: 717, y: 807, w: 18, h: 30, base_y: 837 },
        { x: 688, y: 808, w: 29, h: 32, base_y: 840 },
        { x: 733, y: 821, w: 20, h: 25, base_y: 846 },
        { x: 386, y: 665, w: 24, h: 20, base_y: 685 },
        { x: 449, y: 620, w: 23, h: 22, base_y: 642 },
        { x: 176, y: 610, w: 21, h: 21, base_y: 631 },
        { x: 260, y: 571, w: 25, h: 24, base_y: 595 },
        { x: 275, y: 602, w: 12, h: 17, base_y: 619 },
        { x: 292, y: 334, w: 28, h: 28, base_y: 362 },
        { x: 309, y: 361, w: 11, h: 16, base_y: 377 },
        { x: 295, y: 393, w: 18, h: 17, base_y: 410 },
        { x: 349, y: 408, w: 33, h: 27, base_y: 435 },
        { x: 369, y: 423, w: 13, h: 24, base_y: 447 },
        { x: 349, y: 436, w: 28, h: 3, base_y: 439 },
        { x: 419, y: 429, w: 51, h: 93, base_y: 522 },
        { x: 440, y: 414, w: 14, h: 19, base_y: 433 },
        { x: 455, y: 418, w: 9, h: 14, base_y: 432 },
        { x: 470, y: 426, w: 3, h: 84, base_y: 510 },
        { x: 405, y: 470, w: 95, h: 22, base_y: 492 },
        { x: 399, y: 470, w: 18, h: 16, base_y: 486 },
        { x: 474, y: 434, w: 7, h: 35, base_y: 469 },
        { x: 483, y: 450, w: 6, h: 21, base_y: 471 },
        { x: 490, y: 460, w: 6, h: 10, base_y: 470 },
        { x: 501, y: 471, w: 4, h: 19, base_y: 490 },
        { x: 410, y: 444, w: 16, h: 27, base_y: 471 },
        { x: 400, y: 464, w: 22, h: 8, base_y: 472 },
        { x: 405, y: 492, w: 26, h: 21, base_y: 513 },
        { x: 400, y: 496, w: 21, h: 15, base_y: 511 },
        { x: 333, y: 325, w: 20, h: 21, base_y: 346 },
        { x: 476, y: 325, w: 21, h: 22, base_y: 347 },
        { x: 476, y: 262, w: 21, h: 26, base_y: 288 },
        { x: 561, y: 317, w: 26, h: 50, base_y: 367 },
        { x: 541, y: 329, w: 20, h: 8, base_y: 337 },
        { x: 533, y: 336, w: 29, h: 24, base_y: 360 },
        { x: 551, y: 389, w: 10, h: 17, base_y: 406 },
        { x: 545, y: 394, w: 20, h: 11, base_y: 405 },
        { x: 599, y: 368, w: 15, h: 28, base_y: 396 },
        { x: 590, y: 374, w: 34, h: 22, base_y: 396 },
        { x: 661, y: 336, w: 18, h: 33, base_y: 369 },
        { x: 679, y: 347, w: 21, h: 23, base_y: 370 },
        { x: 779, y: 226, w: 9, h: 11, base_y: 237 },
        { x: 777, y: 128, w: 84, h: 103, base_y: 231 },
        { x: 772, y: 153, w: 35, h: 43, base_y: 196 },
        { x: 763, y: 172, w: 45, h: 51, base_y: 223 },
        { x: 427, y: 133, w: 21, h: 24, base_y: 157 },
        { x: 483, y: 144, w: 34, h: 8, base_y: 152 },
        { x: 494, y: 148, w: 11, h: 12, base_y: 160 },
        { x: 490, y: 147, w: 20, h: 8, base_y: 155 },
        { x: 553, y: 140, w: 24, h: 27, base_y: 167 },
        { x: 403, y: 278, w: 24, h: 34, base_y: 312 },
        { x: 398, y: 291, w: 6, h: 14, base_y: 305 },
        { x: 623, y: 44, w: 16, h: 14, base_y: 58 },
        { x: 733, y: 111, w: 28, h: 33, base_y: 144 },
        { x: 725, y: 113, w: 13, h: 25, base_y: 138 },
        { x: 579, y: 75, w: 24, h: 22, base_y: 97 },
        { x: 999, y: 618, w: 54, h: 54, base_y: 671 },
        { x: 1016, y: 593, w: 23, h: 24, base_y: 617 },
        { x: 1008, y: 603, w: 13, h: 18, base_y: 621 },
        { x: 1034, y: 603, w: 12, h: 17, base_y: 620 },
        { x: 991, y: 635, w: 17, h: 32, base_y: 667 },
        { x: 1016, y: 670, w: 5, h: 10, base_y: 680 },
        { x: 1030, y: 665, w: 6, h: 15, base_y: 680 },
        { x: 852, y: 318, w: 25, h: 28, base_y: 346 },
        { x: 855, y: 343, w: 18, h: 24, base_y: 367 },
        { x: 800, y: 336, w: 37, h: 31, base_y: 367 },
        { x: 895, y: 364, w: 21, h: 18, base_y: 382 },
        { x: 805, y: 439, w: 23, h: 21, base_y: 460 },
        { x: 807, y: 466, w: 41, h: 23, base_y: 489 },
        { x: 854, y: 470, w: 19, h: 16, base_y: 486 },
        { x: 807, y: 455, w: 38, h: 10, base_y: 465 },
        { x: 419, y: 929, w: 22, h: 30, base_y: 958 },
        { x: 413, y: 933, w: 11, h: 23, base_y: 956 },
        { x: 440, y: 932, w: 5, h: 22, base_y: 954 },
        { x: 595, y: 787, w: 17, h: 49, base_y: 836 },
        { x: 590, y: 788, w: 27, h: 27, base_y: 815 }
    ],
    3: [
    ]
};



// localStorage cleared above - always using file data

// ===================== STAIR TRIGGERS =====================
const stairTriggers = {
    limbo: [
        { x: 155, y: 440, w: 60, h: 80, fromLayer: 2, toLayer: 1 },
        { x: 155, y: 440, w: 60, h: 80, fromLayer: 1, toLayer: 2 },
        { x: 896, y: 440, w: 60, h: 80, fromLayer: 2, toLayer: 1 },
        { x: 896, y: 440, w: 60, h: 80, fromLayer: 1, toLayer: 2 },
        { x: 520, y: 200, w: 70, h: 80, fromLayer: 2, toLayer: 3 },
        { x: 520, y: 200, w: 70, h: 80, fromLayer: 3, toLayer: 2 },
    ],
    infierno: []
};

// ===================== PORTAL ZONES =====================
// YELLOW boxes - press E to travel to another map
let portalZones = {
    limbo: [
        { x: 631, y: 66, w: 77, h: 67, targetMap: 'infierno', spawnX: 500, spawnY: 500, text: 'Descendiendo al Infierno...' }
    ],
    infierno: [
        { x: 509, y: 543, w: 51, h: 53, targetMap: 'limbo', spawnX: 500, spawnY: 500, text: 'Regresando al Limbo...' }
    ]
};

// ===================== INFERNO COLLISION DATA =====================
let infernoCollisions = {
    1: [
    ],
    2: [
        { x: 0, y: 0, w: 1024, h: 50 },
        { x: 0, y: 0, w: 50, h: 1024 },
        { x: 0, y: 974, w: 1024, h: 50 },
        { x: 394, y: 406, w: 5, h: 50 },
        { x: 394, y: 406, w: 94, h: 4 },
        { x: 532, y: 407, w: 87, h: 4 },
        { x: 615, y: 386, w: 5, h: 23 },
        { x: 616, y: 343, w: 7, h: 11 },
        { x: 538, y: 342, w: 78, h: 5 },
        { x: 537, y: 266, w: 3, h: 80 },
        { x: 491, y: 266, w: 4, h: 79 },
        { x: 368, y: 338, w: 122, h: 7 },
        { x: 368, y: 338, w: 6, h: 36 },
        { x: 376, y: 346, w: 56, h: 13 },
        { x: 363, y: 425, w: 23, h: 22 },
        { x: 291, y: 450, w: 105, h: 5 },
        { x: 291, y: 456, w: 7, h: 179 },
        { x: 291, y: 632, w: 63, h: 5 },
        { x: 350, y: 632, w: 6, h: 58 },
        { x: 350, y: 688, w: 65, h: 4 },
        { x: 321, y: 735, w: 122, h: 6 },
        { x: 305, y: 189, w: 103, h: 5 },
        { x: 304, y: 222, w: 105, h: 4 },
        { x: 461, y: 266, w: 33, h: 4 },
        { x: 537, y: 267, w: 34, h: 4 },
        { x: 354, y: 370, w: 16, h: 4 },
        { x: 134, y: 393, w: 116, h: 4 },
        { x: 245, y: 378, w: 4, h: 44 },
        { x: 246, y: 377, w: 49, h: 5 },
        { x: 266, y: 372, w: 21, h: 17 },
        { x: 218, y: 408, w: 26, h: 17 },
        { x: 134, y: 394, w: 5, h: 163 },
        { x: 134, y: 554, w: 115, h: 6 },
        { x: 152, y: 399, w: 42, h: 23 },
        { x: 246, y: 453, w: 4, h: 106 },
        { x: 184, y: 448, w: 7, h: 3 },
        { x: 190, y: 445, w: 7, h: 4 },
        { x: 195, y: 442, w: 8, h: 4 },
        { x: 202, y: 438, w: 8, h: 5 },
        { x: 209, y: 435, w: 7, h: 5 },
        { x: 215, y: 431, w: 6, h: 7 },
        { x: 219, y: 429, w: 7, h: 6 },
        { x: 226, y: 426, w: 12, h: 5 },
        { x: 185, y: 485, w: 10, h: 4 },
        { x: 194, y: 480, w: 6, h: 6 },
        { x: 199, y: 477, w: 7, h: 6 },
        { x: 205, y: 475, w: 7, h: 7 },
        { x: 209, y: 472, w: 6, h: 6 },
        { x: 214, y: 469, w: 5, h: 6 },
        { x: 220, y: 466, w: 7, h: 6 },
        { x: 226, y: 462, w: 7, h: 7 },
        { x: 232, y: 459, w: 7, h: 7 },
        { x: 238, y: 456, w: 10, h: 9 },
        { x: 149, y: 526, w: 17, h: 22 },
        { x: 222, y: 483, w: 21, h: 20 },
        { x: 245, y: 554, w: 4, h: 184 },
        { x: 123, y: 720, w: 121, h: 5 },
        { x: 172, y: 712, w: 24, h: 35 },
        { x: 223, y: 732, w: 21, h: 25 },
        { x: 246, y: 735, w: 30, h: 4 },
        { x: 272, y: 736, w: 4, h: 68 },
        { x: 320, y: 736, w: 4, h: 68 },
        { x: 125, y: 722, w: 4, h: 80 },
        { x: 136, y: 726, w: 32, h: 19 },
        { x: 245, y: 736, w: 28, h: 62 },
        { x: 325, y: 742, w: 120, h: 60 },
        { x: 188, y: 846, w: 256, h: 5 },
        { x: 181, y: 843, w: 9, h: 7 },
        { x: 176, y: 838, w: 8, h: 7 },
        { x: 170, y: 834, w: 9, h: 7 },
        { x: 164, y: 830, w: 11, h: 8 },
        { x: 158, y: 828, w: 11, h: 7 },
        { x: 152, y: 824, w: 11, h: 8 },
        { x: 146, y: 820, w: 10, h: 9 },
        { x: 141, y: 816, w: 10, h: 7 },
        { x: 136, y: 814, w: 10, h: 7 },
        { x: 131, y: 811, w: 9, h: 6 },
        { x: 126, y: 808, w: 12, h: 9 },
        { x: 121, y: 804, w: 13, h: 10 },
        { x: 167, y: 841, w: 19, h: 10 },
        { x: 197, y: 820, w: 20, h: 22 },
        { x: 463, y: 856, w: 56, h: 5 },
        { x: 458, y: 854, w: 8, h: 8 },
        { x: 453, y: 852, w: 8, h: 8 },
        { x: 450, y: 851, w: 6, h: 7 },
        { x: 445, y: 847, w: 6, h: 7 },
        { x: 500, y: 736, w: 36, h: 4 },
        { x: 532, y: 701, w: 4, h: 38 },
        { x: 391, y: 624, w: 23, h: 25 },
        { x: 327, y: 572, w: 24, h: 20 },
        { x: 513, y: 550, w: 41, h: 38 },
        { x: 484, y: 408, w: 4, h: 62 },
        { x: 532, y: 408, w: 4, h: 62 },
        { x: 408, y: 429, w: 24, h: 43 },
        { x: 460, y: 452, w: 19, h: 20 },
        { x: 391, y: 458, w: 6, h: 57 },
        { x: 299, y: 511, w: 96, h: 8 },
        { x: 311, y: 554, w: 8, h: 64 },
        { x: 313, y: 549, w: 40, h: 7 },
        { x: 348, y: 541, w: 8, h: 11 },
        { x: 353, y: 535, w: 9, h: 10 },
        { x: 357, y: 530, w: 7, h: 7 },
        { x: 362, y: 524, w: 7, h: 9 },
        { x: 365, y: 514, w: 4, h: 9 },
        { x: 311, y: 609, w: 52, h: 11 },
        { x: 377, y: 624, w: 7, h: 45 },
        { x: 371, y: 620, w: 7, h: 8 },
        { x: 366, y: 615, w: 8, h: 10 },
        { x: 359, y: 611, w: 8, h: 11 },
        { x: 379, y: 664, w: 64, h: 6 },
        { x: 448, y: 670, w: 10, h: 12 },
        { x: 438, y: 665, w: 12, h: 10 },
        { x: 369, y: 535, w: 24, h: 23 },
        { x: 485, y: 474, w: 6, h: 48 },
        { x: 531, y: 472, w: 6, h: 45 },
        { x: 539, y: 510, w: 92, h: 4 },
        { x: 630, y: 511, w: 4, h: 35 },
        { x: 630, y: 545, w: 22, h: 4 },
        { x: 658, y: 553, w: 8, h: 6 },
        { x: 651, y: 550, w: 9, h: 6 },
        { x: 410, y: 672, w: 4, h: 15 },
        { x: 445, y: 735, w: 57, h: 6 },
        { x: 501, y: 740, w: 35, h: 60 },
        { x: 532, y: 793, w: 124, h: 4 },
        { x: 569, y: 800, w: 23, h: 6 },
        { x: 534, y: 848, w: 35, h: 56 },
        { x: 560, y: 863, w: 22, h: 41 },
        { x: 570, y: 879, w: 16, h: 23 },
        { x: 515, y: 856, w: 5, h: 31 },
        { x: 522, y: 871, w: 15, h: 5 },
        { x: 578, y: 927, w: 166, h: 4 },
        { x: 572, y: 905, w: 6, h: 25 },
        { x: 609, y: 873, w: 5, h: 25 },
        { x: 606, y: 887, w: 11, h: 12 },
        { x: 628, y: 853, w: 24, h: 21 },
        { x: 686, y: 886, w: 17, h: 16 },
        { x: 862, y: 866, w: 26, h: 24 },
        { x: 915, y: 812, w: 20, h: 24 },
        { x: 903, y: 768, w: 11, h: 6 },
        { x: 940, y: 774, w: 13, h: 7 },
        { x: 884, y: 743, w: 15, h: 7 },
        { x: 785, y: 719, w: 203, h: 4 },
        { x: 981, y: 721, w: 5, h: 144 },
        { x: 744, y: 923, w: 8, h: 6 },
        { x: 749, y: 919, w: 10, h: 6 },
        { x: 756, y: 915, w: 8, h: 5 },
        { x: 760, y: 910, w: 9, h: 8 },
        { x: 765, y: 907, w: 165, h: 6 },
        { x: 927, y: 904, w: 10, h: 7 },
        { x: 933, y: 900, w: 10, h: 8 },
        { x: 938, y: 897, w: 10, h: 7 },
        { x: 942, y: 893, w: 12, h: 9 },
        { x: 948, y: 890, w: 11, h: 5 },
        { x: 953, y: 887, w: 8, h: 5 },
        { x: 957, y: 883, w: 8, h: 8 },
        { x: 962, y: 879, w: 8, h: 6 },
        { x: 965, y: 875, w: 12, h: 9 },
        { x: 972, y: 871, w: 7, h: 7 },
        { x: 977, y: 867, w: 9, h: 9 },
        { x: 978, y: 864, w: 15, h: 10 },
        { x: 911, y: 725, w: 67, h: 24 },
        { x: 840, y: 724, w: 35, h: 15 },
        { x: 798, y: 724, w: 31, h: 25 },
        { x: 735, y: 724, w: 7, h: 69 },
        { x: 780, y: 720, w: 7, h: 74 },
        { x: 734, y: 722, w: 53, h: 6 },
        { x: 743, y: 787, w: 38, h: 5 },
        { x: 746, y: 794, w: 24, h: 13 },
        { x: 764, y: 809, w: 16, h: 13 },
        { x: 638, y: 760, w: 10, h: 32 },
        { x: 644, y: 752, w: 5, h: 8 },
        { x: 646, y: 746, w: 10, h: 8 },
        { x: 653, y: 741, w: 7, h: 6 },
        { x: 658, y: 737, w: 6, h: 7 },
        { x: 661, y: 734, w: 12, h: 9 },
        { x: 674, y: 735, w: 61, h: 10 },
        { x: 700, y: 747, w: 11, h: 17 },
        { x: 685, y: 765, w: 14, h: 10 },
        { x: 770, y: 891, w: 11, h: 7 },
        { x: 948, y: 849, w: 16, h: 16 },
        { x: 447, y: 795, w: 52, h: 6 },
        { x: 293, y: 644, w: 3, h: 22 },
        { x: 293, y: 668, w: 33, h: 4 },
        { x: 328, y: 654, w: 3, h: 19 },
        { x: 305, y: 133, w: 6, h: 57 },
        { x: 405, y: 131, w: 4, h: 63 },
        { x: 407, y: 129, w: 250, h: 6 },
        { x: 651, y: 132, w: 5, h: 79 },
        { x: 533, y: 697, w: 26, h: 6 },
        { x: 569, y: 650, w: 6, h: 38 },
        { x: 558, y: 692, w: 6, h: 6 },
        { x: 563, y: 686, w: 9, h: 8 },
        { x: 572, y: 644, w: 15, h: 12 },
        { x: 583, y: 638, w: 17, h: 10 },
        { x: 599, y: 633, w: 54, h: 11 },
        { x: 648, y: 628, w: 12, h: 9 },
        { x: 657, y: 621, w: 7, h: 9 },
        { x: 661, y: 615, w: 9, h: 9 },
        { x: 665, y: 609, w: 12, h: 9 },
        { x: 671, y: 602, w: 14, h: 15 },
        { x: 678, y: 595, w: 7, h: 12 },
        { x: 682, y: 589, w: 11, h: 11 },
        { x: 689, y: 584, w: 12, h: 9 },
        { x: 697, y: 579, w: 13, h: 7 },
        { x: 690, y: 574, w: 13, h: 13 },
        { x: 684, y: 569, w: 12, h: 8 },
        { x: 677, y: 565, w: 9, h: 8 },
        { x: 670, y: 560, w: 10, h: 10 },
        { x: 663, y: 551, w: 9, h: 15 },
        { x: 397, y: 451, w: 85, h: 11 },
        { x: 597, y: 348, w: 15, h: 9 },
        { x: 782, y: 425, w: 4, h: 28 },
        { x: 781, y: 484, w: 5, h: 240 },
        { x: 734, y: 540, w: 6, h: 185 },
        { x: 750, y: 688, w: 22, h: 22 },
        { x: 750, y: 584, w: 22, h: 20 },
        { x: 635, y: 538, w: 101, h: 7 },
        { x: 687, y: 443, w: 28, h: 37 },
        { x: 624, y: 343, w: 92, h: 7 },
        { x: 711, y: 352, w: 21, h: 18 },
        { x: 726, y: 371, w: 20, h: 18 },
        { x: 538, y: 414, w: 78, h: 49 },
        { x: 578, y: 464, w: 19, h: 11 },
        { x: 545, y: 464, w: 24, h: 10 },
        { x: 665, y: 374, w: 7, h: 6 },
        { x: 658, y: 370, w: 8, h: 7 },
        { x: 651, y: 367, w: 9, h: 6 },
        { x: 644, y: 363, w: 9, h: 8 },
        { x: 639, y: 361, w: 9, h: 6 },
        { x: 633, y: 358, w: 9, h: 6 },
        { x: 628, y: 355, w: 8, h: 8 },
        { x: 621, y: 350, w: 6, h: 9 },
        { x: 661, y: 409, w: 7, h: 7 },
        { x: 654, y: 405, w: 9, h: 6 },
        { x: 648, y: 403, w: 7, h: 5 },
        { x: 642, y: 400, w: 8, h: 7 },
        { x: 636, y: 397, w: 9, h: 9 },
        { x: 630, y: 394, w: 7, h: 8 },
        { x: 626, y: 394, w: 8, h: 3 },
        { x: 622, y: 388, w: 8, h: 8 },
        { x: 787, y: 426, w: 42, h: 5 },
        { x: 874, y: 425, w: 22, h: 6 },
        { x: 894, y: 431, w: 22, h: 7 },
        { x: 897, y: 458, w: 9, h: 3 },
        { x: 902, y: 453, w: 8, h: 7 },
        { x: 908, y: 448, w: 6, h: 7 },
        { x: 912, y: 445, w: 5, h: 6 },
        { x: 913, y: 442, w: 7, h: 8 },
        { x: 914, y: 438, w: 7, h: 6 },
        { x: 897, y: 459, w: 6, h: 141 },
        { x: 787, y: 597, w: 116, h: 6 },
        { x: 849, y: 549, w: 47, h: 30 },
        { x: 915, y: 216, w: 7, h: 79 },
        { x: 781, y: 206, w: 143, h: 10 },
        { x: 876, y: 217, w: 38, h: 9 },
        { x: 890, y: 228, w: 19, h: 16 },
        { x: 849, y: 217, w: 25, h: 21 },
        { x: 856, y: 241, w: 21, h: 11 },
        { x: 871, y: 295, w: 17, h: 15 },
        { x: 824, y: 324, w: 4, h: 106 },
        { x: 870, y: 324, w: 5, h: 106 },
        { x: 910, y: 295, w: 9, h: 10 },
        { x: 904, y: 302, w: 8, h: 10 },
        { x: 898, y: 309, w: 8, h: 8 },
        { x: 891, y: 313, w: 9, h: 9 },
        { x: 884, y: 319, w: 6, h: 6 },
        { x: 879, y: 319, w: 7, h: 9 },
        { x: 874, y: 321, w: 8, h: 7 },
        { x: 772, y: 212, w: 8, h: 8 },
        { x: 765, y: 222, w: 7, h: 8 },
        { x: 765, y: 219, w: 9, h: 5 },
        { x: 759, y: 229, w: 8, h: 8 },
        { x: 753, y: 236, w: 8, h: 7 },
        { x: 748, y: 243, w: 10, h: 8 },
        { x: 647, y: 210, w: 7, h: 6 },
        { x: 642, y: 213, w: 8, h: 9 },
        { x: 636, y: 217, w: 10, h: 8 },
        { x: 598, y: 249, w: 10, h: 6 },
        { x: 592, y: 251, w: 8, h: 7 },
        { x: 587, y: 253, w: 8, h: 9 },
        { x: 581, y: 257, w: 10, h: 8 },
        { x: 576, y: 260, w: 8, h: 8 },
        { x: 568, y: 261, w: 10, h: 9 },
        { x: 780, y: 346, w: 46, h: 7 },
        { x: 730, y: 281, w: 5, h: 32 },
        { x: 713, y: 243, w: 34, h: 6 },
        { x: 687, y: 238, w: 28, h: 6 },
        { x: 669, y: 230, w: 22, h: 7 },
        { x: 641, y: 226, w: 30, h: 4 },
        { x: 685, y: 279, w: 49, h: 5 },
        { x: 652, y: 274, w: 38, h: 5 },
        { x: 629, y: 268, w: 30, h: 6 },
        { x: 613, y: 262, w: 27, h: 8 },
        { x: 604, y: 255, w: 23, h: 8 },
        { x: 772, y: 342, w: 9, h: 10 },
        { x: 766, y: 337, w: 9, h: 12 },
        { x: 760, y: 333, w: 10, h: 11 },
        { x: 751, y: 332, w: 13, h: 8 },
        { x: 747, y: 326, w: 9, h: 11 },
        { x: 740, y: 321, w: 12, h: 12 },
        { x: 726, y: 313, w: 15, h: 16 },
        { x: 777, y: 420, w: 10, h: 12 },
        { x: 771, y: 413, w: 9, h: 13 },
        { x: 763, y: 406, w: 12, h: 14 },
        { x: 756, y: 398, w: 11, h: 13 },
        { x: 740, y: 390, w: 18, h: 13 },
        { x: 805, y: 566, w: 27, h: 25 },
        { x: 798, y: 516, w: 16, h: 38 },
        { x: 823, y: 504, w: 9, h: 10 },
        { x: 816, y: 501, w: 9, h: 10 },
        { x: 809, y: 497, w: 9, h: 10 },
        { x: 801, y: 494, w: 10, h: 9 },
        { x: 794, y: 491, w: 11, h: 11 },
        { x: 787, y: 486, w: 10, h: 10 },
        { x: 834, y: 471, w: 7, h: 7 },
        { x: 828, y: 469, w: 8, h: 6 },
        { x: 824, y: 466, w: 6, h: 7 },
        { x: 818, y: 465, w: 6, h: 4 },
        { x: 812, y: 460, w: 8, h: 7 },
        { x: 806, y: 459, w: 8, h: 6 },
        { x: 803, y: 456, w: 6, h: 6 },
        { x: 797, y: 454, w: 9, h: 6 },
        { x: 792, y: 452, w: 8, h: 5 },
        { x: 783, y: 450, w: 10, h: 4 },
        { x: 792, y: 430, w: 18, h: 16 },
        { x: 450, y: 137, w: 49, h: 30 },
        { x: 441, y: 147, w: 23, h: 23 },
        { x: 417, y: 137, w: 18, h: 14 },
        { x: 520, y: 139, w: 21, h: 15 },
        { x: 567, y: 137, w: 84, h: 20 },
        { x: 595, y: 159, w: 55, h: 13 },
        { x: 611, y: 180, w: 26, h: 19 },
        { x: 554, y: 248, w: 16, h: 10 },
        { x: 677, y: 511, w: 6, h: 28 },
        { x: 611, y: 464, w: 7, h: 48 },
        { x: 662, y: 419, w: 18, h: 97 },
        { x: 266, y: 132, w: 40, h: 6 },
        { x: 275, y: 140, w: 20, h: 10 },
        { x: 256, y: 158, w: 16, h: 16 },
        { x: 160, y: 193, w: 23, h: 23 },
        { x: 176, y: 246, w: 19, h: 19 },
        { x: 140, y: 175, w: 46, h: 18 },
        { x: 140, y: 195, w: 20, h: 12 },
        { x: 89, y: 165, w: 52, h: 18 },
        { x: 120, y: 184, w: 20, h: 8 },
        { x: 84, y: 128, w: 13, h: 12 },
        { x: 90, y: 135, w: 15, h: 10 },
        { x: 100, y: 142, w: 10, h: 6 },
        { x: 104, y: 143, w: 13, h: 8 },
        { x: 101, y: 138, w: 10, h: 8 },
        { x: 110, y: 148, w: 14, h: 6 },
        { x: 119, y: 152, w: 12, h: 7 },
        { x: 125, y: 156, w: 13, h: 5 },
        { x: 134, y: 160, w: 11, h: 7 },
        { x: 142, y: 158, w: 10, h: 10 },
        { x: 147, y: 156, w: 11, h: 9 },
        { x: 151, y: 156, w: 14, h: 7 },
        { x: 163, y: 154, w: 7, h: 7 },
        { x: 165, y: 152, w: 11, h: 6 },
        { x: 172, y: 148, w: 11, h: 7 },
        { x: 176, y: 147, w: 11, h: 7 },
        { x: 185, y: 147, w: 5, h: 5 },
        { x: 190, y: 155, w: 7, h: 10 },
        { x: 193, y: 162, w: 7, h: 9 },
        { x: 197, y: 170, w: 8, h: 8 },
        { x: 201, y: 173, w: 7, h: 11 },
        { x: 204, y: 181, w: 6, h: 11 },
        { x: 206, y: 189, w: 8, h: 8 },
        { x: 207, y: 193, w: 9, h: 11 },
        { x: 230, y: 134, w: 5, h: 9 },
        { x: 227, y: 131, w: 7, h: 6 },
        { x: 233, y: 142, w: 6, h: 7 },
        { x: 237, y: 148, w: 6, h: 8 },
        { x: 241, y: 153, w: 6, h: 11 },
        { x: 243, y: 160, w: 9, h: 9 },
        { x: 247, y: 165, w: 6, h: 11 },
        { x: 250, y: 174, w: 7, h: 8 },
        { x: 228, y: 124, w: 47, h: 9 },
        { x: 85, y: 122, w: 7, h: 8 },
        { x: 155, y: 118, w: 7, h: 48 },
        { x: 211, y: 97, w: 7, h: 8 },
        { x: 214, y: 103, w: 9, h: 11 },
        { x: 218, y: 110, w: 8, h: 12 },
        { x: 222, y: 116, w: 11, h: 11 },
        { x: 205, y: 90, w: 10, h: 10 },
        { x: 145, y: 109, w: 41, h: 7 },
        { x: 180, y: 102, w: 15, h: 6 },
        { x: 192, y: 93, w: 17, h: 8 },
        { x: 92, y: 186, w: 10, h: 9 },
        { x: 85, y: 193, w: 10, h: 7 },
        { x: 77, y: 197, w: 13, h: 7 },
        { x: 70, y: 201, w: 10, h: 7 },
        { x: 77, y: 206, w: 7, h: 9 },
        { x: 81, y: 213, w: 9, h: 9 },
        { x: 86, y: 217, w: 14, h: 8 },
        { x: 96, y: 221, w: 10, h: 8 },
        { x: 100, y: 223, w: 14, h: 10 },
        { x: 108, y: 234, w: 15, h: 10 },
        { x: 116, y: 240, w: 17, h: 10 },
        { x: 128, y: 246, w: 18, h: 13 },
        { x: 140, y: 255, w: 17, h: 12 },
        { x: 151, y: 262, w: 15, h: 14 },
        { x: 158, y: 269, w: 19, h: 14 },
        { x: 167, y: 271, w: 21, h: 16 },
        { x: 183, y: 275, w: 20, h: 9 },
        { x: 182, y: 272, w: 32, h: 7 },
        { x: 204, y: 267, w: 13, h: 9 },
        { x: 212, y: 262, w: 10, h: 9 },
        { x: 218, y: 270, w: 8, h: 10 },
        { x: 222, y: 278, w: 8, h: 13 },
        { x: 226, y: 285, w: 9, h: 15 },
        { x: 232, y: 296, w: 5, h: 13 },
        { x: 236, y: 305, w: 7, h: 13 },
        { x: 240, y: 318, w: 9, h: 9 },
        { x: 244, y: 325, w: 9, h: 11 },
        { x: 297, y: 225, w: 11, h: 4 },
        { x: 291, y: 228, w: 8, h: 4 },
        { x: 284, y: 229, w: 8, h: 4 },
        { x: 277, y: 232, w: 10, h: 4 },
        { x: 270, y: 234, w: 11, h: 6 },
        { x: 266, y: 239, w: 8, h: 5 },
        { x: 261, y: 242, w: 9, h: 7 },
        { x: 265, y: 248, w: 5, h: 11 },
        { x: 269, y: 256, w: 7, h: 11 },
        { x: 273, y: 264, w: 4, h: 12 },
        { x: 276, y: 272, w: 5, h: 12 },
        { x: 279, y: 280, w: 6, h: 11 },
        { x: 282, y: 286, w: 8, h: 13 },
        { x: 455, y: 264, w: 10, h: 6 },
        { x: 449, y: 259, w: 8, h: 9 },
        { x: 444, y: 256, w: 9, h: 7 },
        { x: 438, y: 251, w: 9, h: 8 },
        { x: 433, y: 246, w: 7, h: 8 },
        { x: 428, y: 242, w: 9, h: 9 },
        { x: 424, y: 239, w: 8, h: 9 },
        { x: 419, y: 234, w: 7, h: 8 },
        { x: 413, y: 232, w: 8, h: 8 },
        { x: 403, y: 229, w: 12, h: 8 },
        { x: 297, y: 378, w: 11, h: 10 },
        { x: 291, y: 372, w: 9, h: 6 },
        { x: 285, y: 368, w: 8, h: 7 },
        { x: 280, y: 364, w: 8, h: 7 },
        { x: 249, y: 337, w: 8, h: 6 },
        { x: 255, y: 342, w: 9, h: 7 },
        { x: 259, y: 348, w: 11, h: 9 },
        { x: 266, y: 352, w: 11, h: 12 },
        { x: 272, y: 359, w: 10, h: 8 },
        { x: 349, y: 366, w: 10, h: 7 },
        { x: 345, y: 360, w: 7, h: 6 },
        { x: 341, y: 357, w: 8, h: 6 },
        { x: 338, y: 353, w: 7, h: 8 },
        { x: 334, y: 350, w: 8, h: 7 },
        { x: 330, y: 345, w: 8, h: 9 },
        { x: 324, y: 341, w: 12, h: 7 },
        { x: 321, y: 336, w: 8, h: 8 },
        { x: 316, y: 332, w: 10, h: 9 },
        { x: 311, y: 329, w: 11, h: 7 },
        { x: 307, y: 324, w: 10, h: 8 },
        { x: 303, y: 320, w: 9, h: 7 },
        { x: 298, y: 317, w: 12, h: 9 },
        { x: 294, y: 312, w: 6, h: 7 },
        { x: 291, y: 308, w: 8, h: 9 },
        { x: 288, y: 304, w: 8, h: 5 },
        { x: 286, y: 295, w: 9, h: 8 },
        { x: 437, y: 533, w: 31, h: 26 }
    ],
    3: [
    ]
};

let infernoDepthZones = {
    1: [
    ],
    2: [
        { x: 203, y: 797, w: 6, h: 22, base_y: 819 },
        { x: 199, y: 803, w: 5, h: 18, base_y: 821 },
        { x: 208, y: 804, w: 4, h: 18, base_y: 822 },
        { x: 209, y: 810, w: 5, h: 12, base_y: 822 },
        { x: 196, y: 812, w: 6, h: 9, base_y: 821 },
        { x: 391, y: 618, w: 23, h: 6, base_y: 624 },
        { x: 394, y: 613, w: 17, h: 5, base_y: 618 },
        { x: 328, y: 565, w: 23, h: 7, base_y: 572 },
        { x: 331, y: 560, w: 16, h: 4, base_y: 564 },
        { x: 373, y: 526, w: 20, h: 9, base_y: 535 },
        { x: 549, y: 809, w: 5, h: 39, base_y: 848 },
        { x: 554, y: 834, w: 8, h: 12, base_y: 846 },
        { x: 550, y: 823, w: 8, h: 17, base_y: 840 },
        { x: 529, y: 836, w: 5, h: 16, base_y: 852 },
        { x: 531, y: 844, w: 7, h: 9, base_y: 853 },
        { x: 581, y: 852, w: 8, h: 16, base_y: 868 },
        { x: 568, y: 840, w: 6, h: 17, base_y: 857 },
        { x: 581, y: 872, w: 7, h: 15, base_y: 887 },
        { x: 584, y: 882, w: 8, h: 10, base_y: 892 },
        { x: 609, y: 866, w: 5, h: 9, base_y: 875 },
        { x: 601, y: 873, w: 20, h: 5, base_y: 878 },
        { x: 631, y: 840, w: 20, h: 12, base_y: 852 },
        { x: 686, y: 879, w: 17, h: 8, base_y: 887 },
        { x: 862, y: 856, w: 26, h: 11, base_y: 867 },
        { x: 917, y: 803, w: 15, h: 6, base_y: 809 },
        { x: 953, y: 821, w: 6, h: 27, base_y: 848 },
        { x: 947, y: 830, w: 18, h: 18, base_y: 848 },
        { x: 446, y: 742, w: 54, h: 59, base_y: 801 },
        { x: 446, y: 347, w: 26, h: 15, base_y: 362 },
        { x: 364, y: 412, w: 21, h: 12, base_y: 424 },
        { x: 752, y: 551, w: 19, h: 34, base_y: 585 },
        { x: 686, y: 486, w: 21, h: 19, base_y: 505 },
        { x: 859, y: 492, w: 6, h: 57, base_y: 549 },
        { x: 867, y: 513, w: 30, h: 36, base_y: 549 },
        { x: 847, y: 523, w: 13, h: 25, base_y: 548 },
        { x: 872, y: 281, w: 14, h: 13, base_y: 294 },
        { x: 181, y: 228, w: 11, h: 19, base_y: 247 },
        { x: 177, y: 231, w: 6, h: 15, base_y: 246 },
        { x: 189, y: 232, w: 6, h: 14, base_y: 246 },
        { x: 182, y: 223, w: 6, h: 6, base_y: 229 },
        { x: 94, y: 184, w: 41, h: 28, base_y: 212 }
    ],
    3: [
    ]
};

// ===================== FUNCTION ZONES =====================
// BLUE boxes - press E to trigger unique functions, each has a unique ID
let functionZones = {
    limbo: [
        { x: 613, y: 671, w: 48, h: 45, id: 1 },
        { x: 438, y: 749, w: 47, h: 38, id: 2 },
        { x: 373, y: 679, w: 49, h: 43, id: 3 },
        { x: 439, y: 640, w: 44, h: 51, id: 4 },
        { x: 387, y: 303, w: 53, h: 40, id: 5 }
    ],
    infierno: [
        { x: 158, y: 80, w: 60, h: 60, id: 6 }
    ]
};

// ===================== EDITOR CONFIG =====================
const EDITOR_MODE = false; // Set false when done editing

// ===================== INPUTS =====================
const keys = {};
const mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false, button: 0 };

// ===================== EDITOR STATE =====================
const editor = {
    tool: 'collision', // 'collision', 'depth', 'portal', or 'funcion'
    selectedBox: null,
    action: null,       // 'move', 'resize', 'create', 'base_y'
    dragOffX: 0,
    dragOffY: 0,
    createStartX: 0,
    createStartY: 0,
    newBox: null,
    saved: true
};

// Returns the active array for the current tool + layer
function getActiveArray() {
    const colls = getCollisions();
    const depths = getDepthZones();
    if (editor.tool === 'collision') return colls[player.layer] || [];
    if (editor.tool === 'portal') return getPortalZones();
    if (editor.tool === 'funcion') return getFunctionZones();
    return depths[player.layer] || [];
}

function ensureLayerExists() {
    const colls = getCollisions();
    const depths = getDepthZones();
    if (!colls[player.layer]) colls[player.layer] = [];
    if (!depths[player.layer]) depths[player.layer] = [];
}

// ===================== KEY EVENTS =====================
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();

    if (EDITOR_MODE) {
        // Switch layer
        if (e.key === '1') { player.layer = 1; ensureLayerExists(); }
        if (e.key === '2') { player.layer = 2; ensureLayerExists(); }
        if (e.key === '3') { player.layer = 3; ensureLayerExists(); }

        // Switch tool
        if (e.key === 'c' || e.key === 'C') editor.tool = 'collision';
        if (e.key === 'v' || e.key === 'V') editor.tool = 'depth';
        if (e.key === 'p' || e.key === 'P') editor.tool = 'portal';
        if (e.key === 'f' || e.key === 'F') editor.tool = 'funcion';

        // Delete selected
        if ((e.key === 'Delete' || e.key === 'Backspace') && editor.selectedBox) {
            const arr = getActiveArray();
            const idx = arr.indexOf(editor.selectedBox);
            if (idx > -1) arr.splice(idx, 1);
            editor.selectedBox = null;
            saveLocal();
        }

        // Ctrl+S save to file
        if (e.key === 's' && e.ctrlKey) {
            e.preventDefault();
            saveToFile();
        }

        // Adjust base_y of selected depth zone with arrow keys
        if (editor.tool === 'depth' && editor.selectedBox) {
            if (e.key === 'ArrowUp') { editor.selectedBox.base_y -= 2; saveLocal(); e.preventDefault(); }
            if (e.key === 'ArrowDown') { editor.selectedBox.base_y += 2; saveLocal(); e.preventDefault(); }
        }
    }
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
window.addEventListener('blur', () => { for (let k in keys) keys[k] = false; mouse.down = false; });

// ===================== MOUSE EVENTS =====================
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    mouse.down = true;
    mouse.button = e.button;
    if (EDITOR_MODE) onEditorMouseDown(e);
});

canvas.addEventListener('mouseup', () => {
    if (EDITOR_MODE) onEditorMouseUp();
    mouse.down = false;
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

// ===================== COORDINATE CONVERSION =====================
function screenToWorld(sx, sy) {
    const scale = canvas.width / 400;
    return { x: (sx / scale) + player.camX, y: (sy / scale) + player.camY };
}

// ===================== BOX OPERATIONS =====================
function findBoxAt(wx, wy) {
    const boxes = getActiveArray();
    for (let i = boxes.length - 1; i >= 0; i--) {
        const b = boxes[i];
        if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) return b;
    }
    return null;
}

function isOnResizeHandle(wx, wy, box) {
    return Math.abs(wx - (box.x + box.w)) < 8 && Math.abs(wy - (box.y + box.h)) < 8;
}

function isOnBaseYHandle(wx, wy, box) {
    if (editor.tool !== 'depth' || box.base_y === undefined) return false;
    return wy >= box.base_y - 5 && wy <= box.base_y + 5 && wx >= box.x && wx <= box.x + box.w;
}

function onEditorMouseDown(e) {
    const { x: wx, y: wy } = screenToWorld(mouse.x, mouse.y);

    // Right click = delete
    if (e.button === 2) {
        const box = findBoxAt(wx, wy);
        if (box) {
            const arr = getActiveArray();
            arr.splice(arr.indexOf(box), 1);
            editor.selectedBox = null;
            saveLocal();
        }
        return;
    }

    const box = findBoxAt(wx, wy);
    if (box) {
        editor.selectedBox = box;
        if (isOnBaseYHandle(wx, wy, box)) {
            editor.action = 'base_y';
        } else if (isOnResizeHandle(wx, wy, box)) {
            editor.action = 'resize';
        } else {
            editor.action = 'move';
            editor.dragOffX = wx - box.x;
            editor.dragOffY = wy - box.y;
        }
    } else {
        // Create new box by dragging on empty space
        editor.action = 'create';
        editor.createStartX = Math.floor(wx);
        editor.createStartY = Math.floor(wy);

        ensureLayerExists();
        const colls = getCollisions();
        const depths = getDepthZones();
        if (editor.tool === 'collision') {
            editor.newBox = { x: editor.createStartX, y: editor.createStartY, w: 1, h: 1 };
            colls[player.layer].push(editor.newBox);
        } else if (editor.tool === 'depth') {
            editor.newBox = { x: editor.createStartX, y: editor.createStartY, w: 1, h: 1, base_y: editor.createStartY + 1 };
            depths[player.layer].push(editor.newBox);
        } else if (editor.tool === 'portal') {
            const target = currentMap === 'limbo' ? 'infierno' : 'limbo';
            editor.newBox = { x: editor.createStartX, y: editor.createStartY, w: 1, h: 1, targetMap: target, spawnX: 500, spawnY: 500, text: target === 'infierno' ? 'Descendiendo al Infierno...' : 'Regresando al Limbo...' };
            getPortalZones().push(editor.newBox);
        } else if (editor.tool === 'funcion') {
            const nextId = getNextFunctionId();
            editor.newBox = { x: editor.createStartX, y: editor.createStartY, w: 1, h: 1, id: nextId };
            getFunctionZones().push(editor.newBox);
        }
        editor.selectedBox = editor.newBox;
    }
}

function onEditorMouseUp() {
    if (editor.action === 'create' && editor.newBox) {
        if (editor.newBox.w < 5 && editor.newBox.h < 5) {
            // Too small, remove it
            const arr = getActiveArray();
            const idx = arr.indexOf(editor.newBox);
            if (idx > -1) arr.splice(idx, 1);
            editor.selectedBox = null;
        } else if (editor.tool === 'depth' && editor.newBox.base_y !== undefined) {
            // Set base_y to bottom of the new box
            editor.newBox.base_y = editor.newBox.y + editor.newBox.h;
        }
    }
    editor.action = null;
    editor.newBox = null;
    saveLocal();
}

function updateEditor() {
    const { x: wx, y: wy } = screenToWorld(mouse.x, mouse.y);
    mouse.worldX = wx;
    mouse.worldY = wy;

    if (!mouse.down || !editor.action) return;

    if (editor.action === 'move' && editor.selectedBox) {
        editor.selectedBox.x = Math.floor(wx - editor.dragOffX);
        editor.selectedBox.y = Math.floor(wy - editor.dragOffY);
    } else if (editor.action === 'resize' && editor.selectedBox) {
        editor.selectedBox.w = Math.max(5, Math.floor(wx - editor.selectedBox.x));
        editor.selectedBox.h = Math.max(5, Math.floor(wy - editor.selectedBox.y));
    } else if (editor.action === 'base_y' && editor.selectedBox) {
        editor.selectedBox.base_y = Math.floor(wy);
    } else if (editor.action === 'create' && editor.newBox) {
        const sx = editor.createStartX, sy = editor.createStartY;
        editor.newBox.x = Math.min(sx, Math.floor(wx));
        editor.newBox.y = Math.min(sy, Math.floor(wy));
        editor.newBox.w = Math.abs(Math.floor(wx) - sx);
        editor.newBox.h = Math.abs(Math.floor(wy) - sy);
    }
}

// ===================== SAVE =====================
function saveLocal() {
    localStorage.setItem('col_data', JSON.stringify({
        collisions: getCollisions(),
        depths: getDepthZones(),
        portals: getPortalZones(),
        functions: getFunctionZones(),
        map: currentMap
    }));
    editor.saved = false;
}

async function saveToFile() {
    try {
        const res = await fetch('/save-collisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                collisions: getCollisions(),
                depths: getDepthZones(),
                portals: getPortalZones(),
                functions: getFunctionZones(),
                map: currentMap
            })
        });
        if (res.ok) {
            editor.saved = true;
            alert('✅ Guardado en script.js! Recargando...');
            // Force hard reload to bypass browser cache and load updated script.js
            window.location.reload(true);
        } else {
            alert('❌ Error. ¿Usas server.py?');
        }
    } catch (e) {
        alert('❌ No se pudo conectar. Usa: python server.py');
    }
}

// ===================== PLAYER =====================
const HITBOX = { offsetX: -7, offsetY: -5, w: 14, h: 10 };
const player = {
    x: 600, y: 500, speed: 130, dir: 'down', state: 'idle', frameIndex: 0,
    animTime: 0, layer: 2, moving: false,
    camX: 0, camY: 0
};

// Helper to get current map's data
function getSceneImage() { return currentMap === 'limbo' ? sceneImg : infernoImg; }
function getCollisions() { return currentMap === 'limbo' ? layerCollisions : infernoCollisions; }
function getDepthZones() { return currentMap === 'limbo' ? depthZones : infernoDepthZones; }
function getStairTriggers() { return (currentMap === 'limbo' ? stairTriggers.limbo : stairTriggers.infierno) || []; }
function getPortalZones() { return portalZones[currentMap] || []; }
function getFunctionZones() { return functionZones[currentMap] || []; }

// Get next unique function ID across ALL maps
function getNextFunctionId() {
    let maxId = 0;
    for (const map of ['limbo', 'infierno']) {
        for (const fz of (functionZones[map] || [])) {
            if (fz.id > maxId) maxId = fz.id;
        }
    }
    return maxId + 1;
}

// ===================== INIT =====================
function init() {
    sceneImg.src = 'assets/Scene Overview.png';
    sceneImg.onload = onAssetLoaded;
    sceneImg.onerror = () => console.error('FAILED to load scene image!');

    hojarasgadaImg.src = 'assets/hojarasgada.png';
    hojarasgadaImg.onload = onAssetLoaded;
    hojarasgadaImg.onerror = () => console.error('FAILED to load hojarasgada!');

    // Preload YouTube video thumbnails
    preloadVideoThumbnails();

    // Setup exercise overlay handlers
    setupExerciseHandlers();
    setupExercise6Handlers();

    infernoImg.src = 'assets/infierno.png';
    infernoImg.onload = onAssetLoaded;
    infernoImg.onerror = () => console.error('FAILED to load infierno image!');

    const loadAnim = (state, dir, filename) => {
        animations[state][dir].src = `assets/personaje/${state.toUpperCase()}/${filename}`;
        animations[state][dir].onload = onAssetLoaded;
        animations[state][dir].onerror = () => console.error(`FAILED to load ${filename}!`);
    };

    loadAnim('idle', 'down', 'idle_down.png');
    loadAnim('idle', 'left', 'idle_left.png');
    loadAnim('idle', 'right', 'idle_right.png');
    loadAnim('idle', 'up', 'idle_up.png');

    loadAnim('run', 'down', 'run_down.png');
    loadAnim('run', 'left', 'run_left.png');
    loadAnim('run', 'right', 'run_right.png');
    loadAnim('run', 'up', 'run_up.png');

    // E key for portal/function interaction
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        if (e.key.toLowerCase() === 'e') {
            // If exercise overlay is open, close it (but not if typing)
            if (exerciseOverlayOpen) {
                const answerInput = document.getElementById('exercise-answer');
                if (document.activeElement !== answerInput) {
                    closeExerciseOverlay();
                }
            } else if (exercise6OverlayOpen) {
                const inp6 = document.getElementById('ex6-answer');
                if (document.activeElement !== inp6) {
                    closeExercise6Overlay();
                }
            } else if (functionOverlay.active) {
                // Close the canvas overlay
                functionOverlay.phase = 'fade_out';
            } else if (!loadingScreen.active) {
                // Try portal first, then function zones
                if (!tryPortal()) tryFunction();
            }
        }
    });
    document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

    document.querySelectorAll('.key').forEach(el => {
        const map = { 'W': 'w', 'A': 'a', 'S': 's', 'D': 'd' };
        el.addEventListener('mousedown', () => keys[map[el.innerText]] = true);
        el.addEventListener('mouseup', () => keys[map[el.innerText]] = false);
        el.addEventListener('mouseleave', () => keys[map[el.innerText]] = false);
    });
    resetButton.addEventListener('click', () => { player.x = 550; player.y = 350; player.layer = 2; });

    // ===================== MOBILE CONTROLS SETUP =====================
    if (isMobile) {
        const mobileControls = document.getElementById('mobile-controls');
        mobileControls.classList.add('visible');

        // --- Floating Joystick (appears at touch location) ---
        const joystickZone = document.getElementById('joystick-zone');
        const joystickBase = document.getElementById('joystick-base');
        const joystickKnob = document.getElementById('joystick-knob');
        let joystickTouchId = null;
        let jsCenterX = 0, jsCenterY = 0; // center of joystick base in page coords
        const jsMaxDist = 45; // max knob travel from center
        const jsDeadZone = 6;

        function moveJoystick(touchX, touchY) {
            let dx = touchX - jsCenterX;
            let dy = touchY - jsCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > jsMaxDist) {
                dx = (dx / dist) * jsMaxDist;
                dy = (dy / dist) * jsMaxDist;
            }

            // Move knob relative to base center (base is already centered via CSS transform)
            joystickKnob.style.left = (55 + dx - 23) + 'px'; // 55 = base half, 23 = knob half
            joystickKnob.style.top = (55 + dy - 23) + 'px';

            // Set movement keys
            keys['w'] = dy < -jsDeadZone;
            keys['s'] = dy > jsDeadZone;
            keys['a'] = dx < -jsDeadZone;
            keys['d'] = dx > jsDeadZone;
        }

        function hideJoystick() {
            joystickBase.classList.remove('active');
            joystickKnob.style.left = '50%';
            joystickKnob.style.top = '50%';
            joystickKnob.style.transform = 'translate(-50%, -50%)';
            keys['w'] = false;
            keys['s'] = false;
            keys['a'] = false;
            keys['d'] = false;
        }

        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (joystickTouchId !== null) return;
            const t = e.changedTouches[0];
            joystickTouchId = t.identifier;

            // Position the base at the touch point
            jsCenterX = t.clientX;
            jsCenterY = t.clientY;
            joystickBase.style.left = t.clientX + 'px';
            joystickBase.style.top = t.clientY + 'px';
            joystickBase.classList.add('active');

            // Reset knob to center (using px positioning now)
            joystickKnob.style.transform = 'none';
            joystickKnob.style.left = (55 - 23) + 'px';
            joystickKnob.style.top = (55 - 23) + 'px';
        }, { passive: false });

        joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                if (t.identifier === joystickTouchId) {
                    moveJoystick(t.clientX, t.clientY);
                    break;
                }
            }
        }, { passive: false });

        const onJoystickEnd = (e) => {
            for (const t of e.changedTouches) {
                if (t.identifier === joystickTouchId) {
                    joystickTouchId = null;
                    hideJoystick();
                    break;
                }
            }
        };
        joystickZone.addEventListener('touchend', onJoystickEnd);
        joystickZone.addEventListener('touchcancel', onJoystickEnd);

        // --- Action Button E ---
        const btnE = document.getElementById('btn-e');
        btnE.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btnE.classList.add('pressed');
            const ev = new KeyboardEvent('keydown', { key: 'e', bubbles: true });
            document.dispatchEvent(ev);
        }, { passive: false });

        btnE.addEventListener('touchend', (e) => {
            e.preventDefault();
            btnE.classList.remove('pressed');
            const ev = new KeyboardEvent('keyup', { key: 'e', bubbles: true });
            document.dispatchEvent(ev);
        }, { passive: false });

        // --- Prevent scroll/zoom on canvas touch ---
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

        // Handle tap on canvas for video thumbnail click
        canvas.addEventListener('touchend', (e) => {
            if (!functionOverlay.active || functionOverlay.phase !== 'showing') return;
            const t = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const clickX = t.clientX - rect.left;
            const clickY = t.clientY - rect.top;
            for (const tr of thumbnailRects) {
                if (clickX >= tr.x && clickX <= tr.x + tr.w && clickY >= tr.y && clickY <= tr.y + tr.h) {
                    window.open(`https://www.youtube.com/watch?v=${tr.videoId}`, '_blank');
                    return;
                }
            }
        });

        // Prevent pull-to-refresh and pinch zoom on the whole page
        document.body.addEventListener('touchmove', (e) => {
            // Allow scroll inside exercise overlays
            if (e.target.closest('#exercise-content-area') || e.target.closest('#ex6-list-view') || e.target.closest('#credits-inner')) return;
            e.preventDefault();
        }, { passive: false });
    }
}

// ===================== PORTAL LOGIC =====================
function tryPortal() {
    const portals = getPortalZones();
    const px = player.x, py = player.y;
    for (const p of portals) {
        if (px > p.x && px < p.x + p.w && py > p.y && py < p.y + p.h) {
            loadingScreen.active = true;
            loadingScreen.phase = 'fade_out';
            loadingScreen.alpha = 0;
            loadingScreen.targetMap = p.targetMap;
            loadingScreen.spawnX = p.spawnX;
            loadingScreen.spawnY = p.spawnY;
            loadingScreen.text = p.text;
            return true;
        }
    }
    return false;
}

// ===================== FUNCTION ZONE LOGIC =====================
function tryFunction() {
    const funcs = getFunctionZones();
    const px = player.x, py = player.y;
    for (const fz of funcs) {
        if (px > fz.x && px < fz.x + fz.w && py > fz.y && py < fz.y + fz.h) {
            functionOverlay.active = true;
            functionOverlay.phase = 'fade_in';
            functionOverlay.alpha = 0;
            functionOverlay.functionId = fz.id;
            return;
        }
    }
}

function updateFunctionOverlay(dt) {
    if (!functionOverlay.active) return;

    if (functionOverlay.phase === 'fade_in') {
        functionOverlay.alpha += dt * 2.5; // Fade in ~0.4s
        if (functionOverlay.alpha >= 1) {
            functionOverlay.alpha = 1;
            functionOverlay.phase = 'showing';
        }
    } else if (functionOverlay.phase === 'fade_out') {
        functionOverlay.alpha -= dt * 3; // Fade out ~0.33s
        if (functionOverlay.alpha <= 0) {
            functionOverlay.alpha = 0;
            functionOverlay.active = false;
            functionOverlay.phase = 'none';
        }
    }
}

function drawFunctionOverlay() {
    if (!functionOverlay.active && functionOverlay.alpha <= 0) return;

    // Functions 2, 3, 4 use HTML exercise overlay
    if (functionOverlay.functionId >= 2 && functionOverlay.functionId <= 4) {
        if (functionOverlay.phase === 'fade_in' && !exerciseOverlayOpen) {
            const diffMap = { 2: 'easy', 3: 'medium', 4: 'hard' };
            openExerciseOverlay(diffMap[functionOverlay.functionId]);
            functionOverlay.phase = 'showing';
            functionOverlay.alpha = 1;
        }
        return;
    }

    // Function 6 uses its own exercise overlay (fracciones) + credits
    if (functionOverlay.functionId === 6) {
        if (functionOverlay.phase === 'fade_in' && !exercise6OverlayOpen) {
            openExercise6Overlay();
            functionOverlay.phase = 'showing';
            functionOverlay.alpha = 1;
        }
        return;
    }

    const a = functionOverlay.alpha;

    // Semi-transparent dark backdrop
    ctx.fillStyle = `rgba(0, 0, 0, ${a * 0.75})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (functionOverlay.functionId === 1) {
        drawFunction1(a);
    } else {
        // Default: show function ID
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Función #${functionOverlay.functionId}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '14px monospace';
        ctx.fillText('(Sin implementar aún)', canvas.width / 2, canvas.height / 2 + 15);
        ctx.font = '12px monospace';
        ctx.fillStyle = `rgba(180, 180, 180, ${a})`;
        ctx.fillText(isMobile ? 'Toca E para cerrar' : 'Presiona E para cerrar', canvas.width / 2, canvas.height / 2 + 45);
        ctx.textAlign = 'left';
    }
}

function drawFunction1(a) {
    // Function 1: Hoja rasgada with videos
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Clear thumbnail rects each frame
    thumbnailRects = [];

    // Draw the paper image centered - scale to fit nicely
    let paperX = 0, paperY = 0, paperW = 0, paperH = 0;
    if (hojarasgadaImg.complete && hojarasgadaImg.naturalWidth > 0) {
        const maxW = canvas.width * 0.55;
        const maxH = canvas.height * 0.65;
        const imgRatio = hojarasgadaImg.naturalWidth / hojarasgadaImg.naturalHeight;
        if (maxW / maxH > imgRatio) {
            paperH = maxH;
            paperW = paperH * imgRatio;
        } else {
            paperW = maxW;
            paperH = paperW / imgRatio;
        }

        // The paper slides up slightly as it fades in
        const slideOffset = (1 - a) * 30;
        paperX = cx - paperW / 2;
        paperY = cy - paperH / 2 + slideOffset + 20;

        ctx.globalAlpha = a;
        ctx.drawImage(hojarasgadaImg, paperX, paperY, paperW, paperH);
        ctx.globalAlpha = 1;
    }

    // Text above the paper
    ctx.fillStyle = `rgba(255, 220, 150, ${a})`;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Este es un regalo para que puedas', cx, cy - canvas.height * 0.28);
    ctx.fillText('emprender tu batalla en los infiernos.', cx, cy - canvas.height * 0.28 + 22);

    // Draw video thumbnails inside the paper
    if (paperW > 0 && a > 0.3) {
        const contentPadX = paperW * 0.12; // Padding inside paper edges
        const contentPadTop = paperH * 0.15;
        const contentPadBot = paperH * 0.10;
        const contentX = paperX + contentPadX;
        const contentY = paperY + contentPadTop;
        const contentW = paperW - contentPadX * 2;
        const contentH = paperH - contentPadTop - contentPadBot;

        const videosPerRow = 5;
        const thumbAspect = 16 / 9;
        const gap = 8;
        const totalRows = Math.ceil(function1Videos.length / videosPerRow);

        // Calculate thumbnail size to fit within content area
        const availW = contentW - gap * (videosPerRow - 1);
        let thumbW = availW / videosPerRow;
        let thumbH = thumbW / thumbAspect;

        // If only fewer videos in a row, still size them as if 5 per row
        // This keeps consistency when more videos are added

        // Check if total rows exceed content height, scale down if needed
        const totalH = totalRows * thumbH + (totalRows - 1) * gap;
        if (totalH > contentH) {
            const scale = contentH / totalH;
            thumbW *= scale;
            thumbH *= scale;
        }

        ctx.globalAlpha = a;

        for (let i = 0; i < function1Videos.length; i++) {
            const video = function1Videos[i];
            const row = Math.floor(i / videosPerRow);
            const col = i % videosPerRow;
            const videosInThisRow = Math.min(videosPerRow, function1Videos.length - row * videosPerRow);

            // Center each row horizontally within content area
            const rowW = videosInThisRow * thumbW + (videosInThisRow - 1) * gap;
            const rowStartX = contentX + (contentW - rowW) / 2;

            const tx = rowStartX + col * (thumbW + gap);
            const ty = contentY + row * (thumbH + gap);

            // Draw thumbnail background
            ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
            ctx.fillRect(tx, ty, thumbW, thumbH);

            // Draw thumbnail image
            const thumb = videoThumbnails[video.id];
            if (thumb && thumb.complete && thumb.naturalWidth > 0) {
                ctx.drawImage(thumb, tx, ty, thumbW, thumbH);
            } else {
                // Fallback: show loading text
                ctx.fillStyle = 'rgba(100, 100, 100, 1)';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Cargando...', tx + thumbW / 2, ty + thumbH / 2 + 3);
            }

            // Draw play button icon (triangle) in the center
            const btnSize = Math.min(thumbW, thumbH) * 0.25;
            const btnCx = tx + thumbW / 2;
            const btnCy = ty + thumbH / 2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(btnCx, btnCy, btnSize * 0.75, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.moveTo(btnCx - btnSize * 0.3, btnCy - btnSize * 0.4);
            ctx.lineTo(btnCx - btnSize * 0.3, btnCy + btnSize * 0.4);
            ctx.lineTo(btnCx + btnSize * 0.45, btnCy);
            ctx.closePath();
            ctx.fill();

            // Draw subtle border
            ctx.strokeStyle = 'rgba(255, 220, 150, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(tx, ty, thumbW, thumbH);

            // Draw title below thumbnail
            if (video.title) {
                ctx.fillStyle = 'rgba(50, 40, 30, 0.9)';
                ctx.font = 'bold 7px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(video.title, tx + thumbW / 2, ty + thumbH - 4);
            }

            // Store the rect for click detection (in canvas pixel coords)
            thumbnailRects.push({
                x: tx, y: ty, w: thumbW, h: thumbH,
                videoId: video.id
            });
        }

        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }

    // Close hint
    ctx.fillStyle = `rgba(150, 150, 150, ${a * (0.5 + Math.sin(Date.now() / 500) * 0.3)})`;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isMobile ? 'Toca E para cerrar' : 'Presiona E para cerrar', cx, canvas.height - 30);
    ctx.textAlign = 'left';
}

function updateLoadingScreen(dt) {
    if (!loadingScreen.active) return;

    if (loadingScreen.phase === 'fade_out') {
        loadingScreen.alpha += dt * 2; // Fade to black in 0.5s
        if (loadingScreen.alpha >= 1) {
            loadingScreen.alpha = 1;
            loadingScreen.phase = 'loading';
            // Perform the map swap
            currentMap = loadingScreen.targetMap;
            player.x = loadingScreen.spawnX;
            player.y = loadingScreen.spawnY;
            player.layer = 2;
            player.dir = 'down';
            player.state = 'idle';
            // Small delay before fade in
            setTimeout(() => { loadingScreen.phase = 'fade_in'; }, 1500);
        }
    } else if (loadingScreen.phase === 'fade_in') {
        loadingScreen.alpha -= dt * 2; // Fade in from black in 0.5s
        if (loadingScreen.alpha <= 0) {
            loadingScreen.alpha = 0;
            loadingScreen.active = false;
            loadingScreen.phase = 'none';
        }
    }
}

function drawLoadingScreen() {
    if (!loadingScreen.active && loadingScreen.alpha <= 0) return;

    ctx.fillStyle = `rgba(0, 0, 0, ${loadingScreen.alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (loadingScreen.phase === 'loading' || loadingScreen.phase === 'fade_out') {
        const textAlpha = Math.min(loadingScreen.alpha * 2, 1);
        ctx.fillStyle = `rgba(255, 120, 30, ${textAlpha})`;
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        // Animated dots
        const dots = '.'.repeat(Math.floor(Date.now() / 400) % 4);
        ctx.fillText(loadingScreen.text + dots, canvas.width / 2, canvas.height / 2);

        // Flame emoji decoration
        ctx.font = '40px serif';
        ctx.fillText('🔥', canvas.width / 2, canvas.height / 2 + 60);
        ctx.textAlign = 'left';
    }
}

function onAssetLoaded() {
    assetsLoaded++;
    if (assetsLoaded === ASSETS_TOTAL) {
        // Find safe spawn if default is blocked
        if (isBoxBlocked(player.x, player.y, player.layer)) {
            console.log('Spawn blocked! Searching for safe spot...');
            for (let r = 1; r < 200; r += 5) {
                for (let a = 0; a < 360; a += 15) {
                    const tx = player.x + Math.cos(a * Math.PI / 180) * r;
                    const ty = player.y + Math.sin(a * Math.PI / 180) * r;
                    if (!isBoxBlocked(tx, ty, player.layer)) {
                        player.x = tx; player.y = ty;
                        console.log(`Safe spawn at (${tx}, ${ty})`);
                        r = 999; break;
                    }
                }
            }
        }
        requestAnimationFrame(gameLoop);
    }
}

// ===================== COLLISION =====================
function isPointBlocked(px, py, layer) {
    const colls = getCollisions();
    for (const r of (colls[layer] || [])) {
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return true;
    }
    return false;
}

function isBoxBlocked(cx, cy, layer) {
    const l = cx + HITBOX.offsetX, r = cx + HITBOX.offsetX + HITBOX.w;
    const t = cy + HITBOX.offsetY, b = cy + HITBOX.offsetY + HITBOX.h;
    const mx = (l + r) / 2, my = (t + b) / 2;
    return isPointBlocked(l, t, layer) || isPointBlocked(r, t, layer) ||
        isPointBlocked(l, b, layer) || isPointBlocked(r, b, layer) ||
        isPointBlocked(mx, t, layer) || isPointBlocked(mx, b, layer) ||
        isPointBlocked(l, my, layer) || isPointBlocked(r, my, layer);
}

function sweepAxis(px, py, delta, axis, layer) {
    if (delta === 0) return axis === 'x' ? px : py;
    const sign = Math.sign(delta);
    let cur = axis === 'x' ? px : py, rem = Math.abs(delta);
    while (rem > 0) {
        const step = Math.min(1, rem);
        const next = cur + sign * step;
        if (isBoxBlocked(axis === 'x' ? next : px, axis === 'y' ? next : py, layer)) return cur;
        cur = next; rem -= step;
    }
    return cur;
}

// ===================== UPDATE =====================
let lastTime = 0;

function update(dt) {
    const scale = canvas.width / 400;
    if (EDITOR_MODE) updateEditor();

    let dx = 0, dy = 0;
    // Only use WASD for movement (arrows reserved for base_y adjust in depth mode)
    if (keys['w']) dy = -1;
    if (keys['s']) dy = 1;
    if (keys['a']) dx = -1;
    if (keys['d']) dx = 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

    if (dx !== 0) player.x = sweepAxis(player.x, player.y, dx * player.speed * dt, 'x', player.layer);
    if (dy !== 0) player.y = sweepAxis(player.x, player.y, dy * player.speed * dt, 'y', player.layer);

    if (dy > 0) player.dir = 'down';
    else if (dy < 0) player.dir = 'up';
    else if (dx > 0) player.dir = 'right';
    else if (dx < 0) player.dir = 'left';
    player.moving = (dx !== 0 || dy !== 0);
    player.state = player.moving ? 'run' : 'idle';

    const stairs = getStairTriggers();
    for (const t of stairs) {
        if (player.x > t.x && player.x < t.x + t.w && player.y > t.y && player.y < t.y + t.h && player.layer === t.fromLayer)
            player.layer = t.toLayer;
    }

    // Animation logic
    player.animTime += dt * (player.moving ? 12 : 8); // 12 FPS run, 8 FPS idle
    player.frameIndex = Math.floor(player.animTime) % 8; // Both run and idle have 8 frames

    // Loading screen update
    updateLoadingScreen(dt);

    const curScene = getSceneImage();
    const vw = canvas.width / scale, vh = canvas.height / scale;
    player.camX = Math.min(Math.max(0, Math.round(player.x - vw / 2)), Math.max(0, curScene.width - vw));
    player.camY = Math.min(Math.max(0, Math.round(player.y - vh / 2)), Math.max(0, curScene.height - vh));
}

// ===================== DRAW =====================
function draw() {
    ctx.imageSmoothingEnabled = false;
    const scale = canvas.width / 400;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-player.camX, -player.camY);

    // 1. Map
    const curScene = getSceneImage();
    ctx.drawImage(curScene, 0, 0);

    // 2. Player
    const currentImg = animations[player.state][player.dir];
    const fw = 96; // 768px sheet width / 8 frames
    const fh = 80; // 80px height
    const ps = 1; // pixel scale (96x80 is already large enough)

    // Draw origin at feet center
    const drawX = Math.floor(player.x - (fw * ps) / 2);
    const drawY = Math.floor(player.y - (fh * ps) + 26);

    ctx.drawImage(currentImg, player.frameIndex * fw, 0, fw, fh, drawX, drawY, fw * ps, fh * ps);

    // 3. Depth zones: redraw map ON TOP of player only when player overlaps the zone
    const curDepth = getDepthZones();
    const dz = curDepth[player.layer] || [];
    for (const z of dz) {
        if (player.y < z.base_y) {
            const playerLeft = drawX, playerRight = drawX + fw * ps;
            const playerTop = drawY, playerBottom = drawY + fh * ps;
            if (playerRight > z.x && playerLeft < z.x + z.w &&
                playerBottom > z.y && playerTop < z.y + z.h) {
                ctx.drawImage(curScene, z.x, z.y, z.w, z.h, z.x, z.y, z.w, z.h);
            }
        }
    }

    // 4. Portal zone indicators (YELLOW - always visible when near)
    const portals = getPortalZones();
    for (const p of portals) {
        const dist = Math.hypot(player.x - (p.x + p.w / 2), player.y - (p.y + p.h / 2));
        if (dist < 100) {
            // Pulsating yellow glow
            const pulse = 0.3 + Math.sin(Date.now() / 300) * 0.15;
            const glowFade = Math.max(0, Math.min(1, (100 - dist) / 50)); // Fades in smoothly from 100 to 50

            if (EDITOR_MODE) {
                ctx.fillStyle = `rgba(255, 200, 0, ${pulse})`;
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.strokeStyle = '#ff0';
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x, p.y, p.w, p.h);
            } else {
                const cx = p.x + p.w / 2;
                const cy = p.y + p.h / 2;
                const radius = Math.max(p.w, p.h) * 0.8;
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                grad.addColorStop(0, `rgba(255, 200, 0, ${pulse * 1.5 * glowFade})`);
                grad.addColorStop(1, 'rgba(255, 200, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
            }

            // "Press E" prompt
            if (dist < 50) {
                const textFade = Math.max(0, Math.min(1, (50 - dist) / 30)); // Fades in from 50 to 20
                ctx.fillStyle = `rgba(255, 255, 255, ${textFade})`;
                ctx.font = 'bold 8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(isMobile ? 'Toca E' : 'Presiona E', p.x + p.w / 2, p.y - 5);
                ctx.textAlign = 'left';
            }
        }
    }

    // 4b. Function zone indicators (BLUE - always visible when near)
    const funcNear = getFunctionZones();
    for (const fz of funcNear) {
        const dist = Math.hypot(player.x - (fz.x + fz.w / 2), player.y - (fz.y + fz.h / 2));
        if (dist < 80) {
            // Pulsating blue glow
            const pulse = 0.25 + Math.sin(Date.now() / 350) * 0.15;
            const glowFade = Math.max(0, Math.min(1, (80 - dist) / 40)); // Fades in smoothly from 80 to 40

            if (EDITOR_MODE) {
                ctx.fillStyle = `rgba(30, 120, 255, ${pulse})`;
                ctx.fillRect(fz.x, fz.y, fz.w, fz.h);
                ctx.strokeStyle = '#1e90ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(fz.x, fz.y, fz.w, fz.h);
            } else {
                const cx = fz.x + fz.w / 2;
                const cy = fz.y + fz.h / 2;
                const radius = Math.max(fz.w, fz.h) * 0.8;
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                grad.addColorStop(0, `rgba(30, 120, 255, ${pulse * 1.5 * glowFade})`);
                grad.addColorStop(1, 'rgba(30, 120, 255, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
            }

            // "Press E" prompt
            if (dist < 50) {
                const textFade = Math.max(0, Math.min(1, (50 - dist) / 30)); // Fades in from 50 to 20
                // Equivalent loosely to #aaddff using rgba
                ctx.fillStyle = `rgba(170, 221, 255, ${textFade})`;
                ctx.font = 'bold 8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(isMobile ? 'Toca E' : 'Presiona E', fz.x + fz.w / 2, fz.y - 5);
                ctx.textAlign = 'left';
            }
        }
    }

    // 5. Editor overlay
    if (EDITOR_MODE) {
        const curColls = getCollisions();
        const curDepths = getDepthZones();

        // Draw collision boxes (RED)
        const collBoxes = curColls[player.layer] || [];
        for (const r of collBoxes) {
            const isSel = (r === editor.selectedBox && editor.tool === 'collision');
            ctx.fillStyle = isSel ? 'rgba(255,80,80,0.5)' : 'rgba(255,0,0,0.2)';
            ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.strokeStyle = isSel ? '#ff0' : '#f00';
            ctx.lineWidth = isSel ? 2 : 1;
            ctx.strokeRect(r.x, r.y, r.w, r.h);
            ctx.fillStyle = '#fff';
            ctx.fillRect(r.x + r.w - 3, r.y + r.h - 3, 6, 6);
            if (isSel) {
                ctx.fillStyle = '#ff0'; ctx.font = '7px monospace';
                ctx.fillText(`${r.w}x${r.h}`, r.x + 2, r.y - 2);
            }
        }

        // Draw depth zones (PURPLE)
        const depBoxes = curDepths[player.layer] || [];
        for (const z of depBoxes) {
            const isSel = (z === editor.selectedBox && editor.tool === 'depth');
            ctx.fillStyle = isSel ? 'rgba(180,80,255,0.45)' : 'rgba(128,0,255,0.2)';
            ctx.fillRect(z.x, z.y, z.w, z.h);
            ctx.strokeStyle = isSel ? '#ff0' : '#a040ff';
            ctx.lineWidth = isSel ? 2 : 1;
            ctx.strokeRect(z.x, z.y, z.w, z.h);
            ctx.fillStyle = '#fff';
            ctx.fillRect(z.x + z.w - 3, z.y + z.h - 3, 6, 6);
            if (z.base_y !== undefined) {
                ctx.strokeStyle = '#0f0';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(z.x, z.base_y);
                ctx.lineTo(z.x + z.w, z.base_y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#0f0';
                ctx.fillRect(z.x + z.w / 2 - 4, z.base_y - 4, 8, 8);
            }
            if (isSel) {
                ctx.fillStyle = '#ff0'; ctx.font = '7px monospace';
                ctx.fillText(`${z.w}x${z.h} base:${z.base_y}`, z.x + 2, z.y - 2);
            }
        }

        // Portal zones (YELLOW) - editable
        for (const p of portals) {
            const isSel = (p === editor.selectedBox && editor.tool === 'portal');
            ctx.fillStyle = isSel ? 'rgba(255,200,0,0.5)' : 'rgba(255,200,0,0.3)';
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.strokeStyle = isSel ? '#fff' : '#ff0';
            ctx.lineWidth = isSel ? 2 : 1;
            ctx.strokeRect(p.x, p.y, p.w, p.h);
            // Resize handle
            ctx.fillStyle = '#fff';
            ctx.fillRect(p.x + p.w - 3, p.y + p.h - 3, 6, 6);
            ctx.fillStyle = '#ff0'; ctx.font = '6px monospace';
            ctx.fillText(`→${p.targetMap}`, p.x + 2, p.y - 2);
            if (isSel) {
                ctx.fillStyle = '#ff0'; ctx.font = '7px monospace';
                ctx.fillText(`${p.w}x${p.h} → ${p.targetMap}`, p.x + 2, p.y - 10);
            }
        }

        // Function zones (BLUE) - editable
        const funcZones = getFunctionZones();
        for (const fz of funcZones) {
            const isSel = (fz === editor.selectedBox && editor.tool === 'funcion');
            ctx.fillStyle = isSel ? 'rgba(30,120,255,0.5)' : 'rgba(30,120,255,0.25)';
            ctx.fillRect(fz.x, fz.y, fz.w, fz.h);
            ctx.strokeStyle = isSel ? '#fff' : '#1e90ff';
            ctx.lineWidth = isSel ? 2 : 1;
            ctx.strokeRect(fz.x, fz.y, fz.w, fz.h);
            // Resize handle
            ctx.fillStyle = '#fff';
            ctx.fillRect(fz.x + fz.w - 3, fz.y + fz.h - 3, 6, 6);
            // ID number centered in the box
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${fz.id}`, fz.x + fz.w / 2, fz.y + fz.h / 2);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            if (isSel) {
                ctx.fillStyle = '#1e90ff'; ctx.font = '7px monospace';
                ctx.fillText(`F${fz.id} ${fz.w}x${fz.h}`, fz.x + 2, fz.y - 2);
            }
        }

        // Stair triggers (green transparent)
        ctx.fillStyle = 'rgba(0,255,0,0.15)';
        const stairs = getStairTriggers();
        for (const t of stairs) {
            if (t.fromLayer === player.layer) ctx.fillRect(t.x, t.y, t.w, t.h);
        }

        // Player hitbox
        ctx.strokeStyle = '#0ff'; ctx.lineWidth = 1;
        ctx.strokeRect(player.x + HITBOX.offsetX, player.y + HITBOX.offsetY, HITBOX.w, HITBOX.h);

        // Cursor
        ctx.fillStyle = '#ff0';
        ctx.fillRect(Math.floor(mouse.worldX) - 1, Math.floor(mouse.worldY) - 1, 2, 2);
    }

    ctx.restore();

    // HUD
    if (EDITOR_MODE) {
        const bh = 110;
        ctx.fillStyle = 'rgba(0,0,0,0.92)';
        ctx.fillRect(8, canvas.height - bh - 8, 500, bh);
        ctx.font = 'bold 12px monospace';

        // Tool indicator
        const toolColors = { collision: '#ff6b6b', depth: '#b860ff', portal: '#ffc800', funcion: '#1e90ff' };
        const toolNames = { collision: '🔴 COLISIÓN', depth: '🟣 PROFUNDIDAD', portal: '🟡 PORTAL', funcion: '🔵 FUNCIÓN' };
        const toolColor = toolColors[editor.tool];
        const toolName = toolNames[editor.tool];
        ctx.fillStyle = toolColor;
        ctx.fillText(`TOOL: ${toolName}  |  LAYER: ${player.layer}  |  MAP: ${currentMap.toUpperCase()}  |  POS: (${Math.floor(player.x)}, ${Math.floor(player.y)})`, 16, canvas.height - bh + 16);

        ctx.fillStyle = '#ccc';
        ctx.fillText(`Clic vacío = CREAR  |  Arrastra = MOVER  |  Esquina blanca = ESCALAR`, 16, canvas.height - bh + 34);
        ctx.fillText(`Clic Derecho/Delete = BORRAR  |  1/2/3 = Layer`, 16, canvas.height - bh + 50);

        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`C = Colisión`, 16, canvas.height - bh + 68);
        ctx.fillStyle = '#b860ff';
        ctx.fillText(`V = Profundidad`, 130, canvas.height - bh + 68);
        ctx.fillStyle = '#ffc800';
        ctx.fillText(`P = Portal`, 275, canvas.height - bh + 68);
        ctx.fillStyle = '#1e90ff';
        ctx.fillText(`F = Función`, 380, canvas.height - bh + 68);

        if (editor.tool === 'depth') {
            ctx.fillStyle = '#50fa7b';
            ctx.fillText(`↑↓ = Mover línea verde (base_y) | Arrastrar cuadrito verde`, 16, canvas.height - bh + 86);
        } else {
            ctx.fillStyle = '#555';
            ctx.fillText(`Cambia a V para editar zonas de profundidad`, 16, canvas.height - bh + 86);
        }

        ctx.fillStyle = editor.saved ? '#50fa7b' : '#ff5555';
        ctx.fillText(editor.saved ? '✅ Ctrl+S = GUARDAR EN ARCHIVO' : '⚠️  CAMBIOS SIN GUARDAR → Ctrl+S', 16, canvas.height - bh + 104);
    }
}

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05) || 0.016;
    lastTime = timestamp;
    update(dt);
    updateFunctionOverlay(dt);
    draw();
    // Draw overlays ON TOP of everything
    drawLoadingScreen();
    drawFunctionOverlay();
    requestAnimationFrame(gameLoop);
}

init();
