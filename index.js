/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

/** @type {AudioContext} */
let audioCtx;
/** @type {OscillatorNode} */
let oscillator;
/** @type {GainNode} */
let gainNode;

/** @type {HTMLSelectElement} */
let algorithmsSelect = document.getElementById('algorithms');

/** @type {HTMLInputElement} */
let speedInput = document.getElementById('speed');

/** @type {HTMLInputElement} */
let nInput = document.getElementById('n');

/** @type {HTMLInputElement} */
let volumeInput = document.getElementById('volume');

/** @type {HTMLSelectElement} */
let soundTypeInput = document.getElementById('soundType');

/** @type {HTMLButtonElement} */
let startBtn = document.getElementById('startBtn');

/** @type {HTMLHeadingElement} */
let algNameElem = document.getElementById('algName');

/** @type {HTMLHeadingElement} */
let timeElapsedElem = document.getElementById('timeElapsed');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const COLORS = {
        BG: 'hsl(0, 0%, 94%)',
        FG: 'hsl(220, 50%, 50%)',
        HIGHLIGHT: 'hsl(220, 50%, 40%)',
    },
    MIN_FREQ = 110,
    MAX_FREQ = 880;

let n = nInput.value,
    highlight = 0;

let arr = [],
    algs = {
        'Bubble Sort': BubbleSort,
        'Selection Sort': SelectionSort,
        'Merge Sort': MergeSort,
    },
    isRunning = false,
    startTime;

for (let alg of Object.keys(algs)) {
    let elem = document.createElement('option');
    elem.textContent = alg;
    algorithmsSelect.add(elem);
}

init();
setInterval(frame, 1000 / 60);

// click canvas to randomize
canvas.onclick = function () {
    if (isRunning) return;
    init();
};

// press start button or space to start
window.onkeydown = function (ev) {
    if (isRunning) return;

    if (ev.key === ' ') start();
};

window.onresize = function (ev) {
    canvas.width = ev.target.innerWidth;
    canvas.height = ev.target.innerHeight;
};

startBtn.onclick = start;

function init() {
    n = nInput.value;

    // fill array
    arr = [];
    for (let i = 1; i <= n; ++i) arr.push(i);

    // shuffle array
    let i = n;
    while (i != 0) {
        let j = Math.floor(Math.random() * i--);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    frame();
    timeElapsedElem.textContent = '0 ms';
}

async function start() {
    if (isRunning) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = volumeInput.value;

    oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    oscillator.connect(gainNode);
    oscillator.start();

    isRunning = true;
    startTime = performance.now();

    let algName =
        algorithmsSelect.options[algorithmsSelect.options.selectedIndex]
            .textContent;

    algNameElem.textContent = algName;

    await algs[algName]();
    frame();
    oscillator.disconnect();
    isRunning = false;
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function playSound(i) {
    let freq;
    if (soundTypeInput.selectedIndex === 0) {
        // index
        freq = (i / n) * (MAX_FREQ - MIN_FREQ) + MIN_FREQ;
    } else {
        //value
        freq = (arr[i] / n) * (MAX_FREQ - MIN_FREQ) + MIN_FREQ;
    }

    gainNode.gain.value = volumeInput.value;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
}

function frame() {
    if (isRunning) {
        playSound(highlight);
        let timeElapsed = Math.round(performance.now() - startTime);

        if (!isNaN(timeElapsed)) {
            timeElapsedElem.textContent =
                Math.round(performance.now() - startTime) + ' ms';
        }
    }

    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < n; ++i) {
        if (i === highlight) ctx.fillStyle = COLORS.HIGHLIGHT;
        else ctx.fillStyle = COLORS.FG;

        let w = canvas.width / n;
        ctx.fillRect(
            i * w,
            canvas.height - arr[i] * (canvas.height / n),
            Math.ceil(w),
            arr[i] * (canvas.height / n)
        );
    }
}

async function BubbleSort() {
    for (let i = 0; i < n - 1; ++i) {
        for (let j = 0; j < n - i - 1; ++j) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }

            highlight = j;
            await wait(speedInput.max - speedInput.value);
        }
    }
}

async function SelectionSort() {
    let iMin;

    for (let i = 0; i < n; ++i) {
        iMin = i;

        for (let j = i; j < n; ++j) if (arr[j] < arr[iMin]) iMin = j;

        if (iMin != i) {
            let temp = arr[i];
            arr[i] = arr[iMin];
            arr[iMin] = temp;
        }

        highlight = iMin;
        await wait(speedInput.max - speedInput.value);
    }
}

async function MergeSort(left = 0, right = n) {
    if (right - left < 1) return;

    let mid = Math.floor(left + (right - left) / 2);

    await MergeSort(left, mid);
    await MergeSort(mid + 1, right);

    await merge(left, mid, right);
}

async function merge(left, mid, right) {
    let LHalf = arr.slice(left, mid + 1),
        RHalf = arr.slice(mid + 1, right + 1);

    let i = 0;
    let j = 0;
    let k = left;

    // keep appending elements to beginning of main array until one half is expended
    while (i < LHalf.length && j < RHalf.length) {
        if (LHalf[i] < RHalf[j]) {
            arr[k] = LHalf[i];
            ++i;
        } else {
            arr[k] = RHalf[j];
            ++j;
        }
        ++k;

        highlight = k;
        await wait(speedInput.max - speedInput.value);
    }

    // copy leftover values from halves, if necessary
    while (i < LHalf.length) {
        arr[k] = LHalf[i];
        ++i;
        ++k;
    }
    while (j < RHalf.length) {
        arr[k] = RHalf[j];
        ++j;
        ++k;
    }
}
