const BASE_URL = "https://storage.googleapis.com/ecmwf-images-dev"; 

const VARIABLES = {
    "z500-vort": "500hPa 高度・絶対渦度",
    "mslp-t850": "地上気圧・850hPa 気温・風",
    "cam": "寒気質量 (Cold Air Mass) [θ<280K]",
    "cam293": "寒気質量 (Cold Air Mass) [θ<293K]",
    "ivt": "水蒸気フラックス (IVT)",
    "ept850": "850hPa 相当温位",
    "qvec850": "850hPa Qベクトル・発散",
    "qgomg700": "700hPa QG-Omega",
    "col-index": "500hPa 寒冷渦指標"
};

const cycleSelect = document.getElementById("cycle-select");
const validTimeDisplay = document.getElementById("valid-time-display");
const stepDisplay = document.getElementById("step-display");
const imgLeft = document.getElementById("img-left");
const imgRight = document.getElementById("img-right");
const varSelectLeft = document.getElementById("var-select-left");
const varSelectRight = document.getElementById("var-select-right");
const ftBand = document.getElementById("ft-band");
const playBtn = document.getElementById("play-btn");

let frames = [];
let currentIndex = 0;
let isPlaying = false;
let playInterval;

async function init() {
    populateVarSelects();
    await loadCycles();
    
    cycleSelect.addEventListener("change", () => loadManifest(cycleSelect.value));
    playBtn.addEventListener("click", togglePlay);
    
    // 変数変更時に該当変数の全ステップをバックグラウンドでプリロード
    varSelectLeft.addEventListener("change", () => {
        preloadVariables();
        updateView(currentIndex);
    });
    varSelectRight.addEventListener("change", () => {
        preloadVariables();
        updateView(currentIndex);
    });
}

function populateVarSelects() {
    for (const [key, name] of Object.entries(VARIABLES)) {
        varSelectLeft.add(new Option(name, key));
        varSelectRight.add(new Option(name, key));
    }
    varSelectLeft.value = "z500-vort";
    varSelectRight.value = "mslp-t850";
}

async function loadCycles() {
    try {
        // 設定ファイルのみキャッシュ回避で最新を取得
        const res = await fetch(`${BASE_URL}/cycles.json?t=${Date.now()}`);
        const cycles = await res.json();
        
        cycleSelect.innerHTML = "";
        cycles.forEach(cycle => {
            cycleSelect.add(new Option(cycle, cycle));
        });
        
        cycleSelect.disabled = false;
        if (cycles.length > 0) {
            await loadManifest(cycles[0]);
        }
    } catch (e) {
        cycleSelect.innerHTML = "<option>読み込み失敗</option>";
    }
}

async function loadManifest(cyclePrefix) {
    pause();
    try {
        // マニフェストのみキャッシュ回避
        const res = await fetch(`${BASE_URL}/${cyclePrefix}/manifest.json?t=${Date.now()}`);
        const manifest = await res.json();
        frames = manifest.figures;
        
        ftBand.innerHTML = "";
        frames.forEach((frame, index) => {
            const el = document.createElement("div");
            el.className = "ft-tick";
            
            if (frame.step % 24 === 0) {
                el.textContent = frame.step; 
            } else {
                const dot = document.createElement("div");
                dot.className = "tick-dot";
                el.appendChild(dot);
            }
            
            el.addEventListener("mouseover", () => {
                if (!isPlaying) updateView(index);
            });
            
            ftBand.appendChild(el);
        });
        
        preloadVariables();
        updateView(0);
    } catch (e) {
        console.error("Manifest load error", e);
    }
}

function preloadVariables() {
    if (!frames.length) return;
    const vLeft = varSelectLeft.value;
    const vRight = varSelectRight.value;
    
    // 画像はキャッシュパラメータを付与せず、ブラウザのキャッシュを最大限利用する
    frames.forEach(frame => {
        if (frame[`file_${vLeft}`]) {
            const imgL = new Image();
            imgL.src = `${BASE_URL}/${frame[`file_${vLeft}`]}`;
        }
        if (frame[`file_${vRight}`] && vLeft !== vRight) {
            const imgR = new Image();
            imgR.src = `${BASE_URL}/${frame[`file_${vRight}`]}`;
        }
    });
}

function updateView(index) {
    if (!frames.length || index < 0 || index >= frames.length) return;
    currentIndex = index;
    
    const frame = frames[index];
    validTimeDisplay.textContent = frame.valid_time;
    stepDisplay.textContent = `FT=${String(frame.step).padStart(3, '0')}`;
    
    const vLeft = varSelectLeft.value;
    const vRight = varSelectRight.value;
    
    // プリロード時と完全に一致するURLを指定し、キャッシュから即座に表示させる
    imgLeft.src = frame[`file_${vLeft}`] ? `${BASE_URL}/${frame[`file_${vLeft}`]}` : "";
    imgRight.src = frame[`file_${vRight}`] ? `${BASE_URL}/${frame[`file_${vRight}`]}` : "";
    
    Array.from(ftBand.children).forEach((el, idx) => {
        if (idx === index) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
    });
}

function togglePlay() {
    isPlaying ? pause() : play();
}

function play() {
    isPlaying = true;
    playBtn.textContent = "■ 停止";
    playInterval = setInterval(() => {
        let next = currentIndex + 1;
        if (next >= frames.length) next = 0;
        updateView(next);
    }, 600);
}

function pause() {
    isPlaying = false;
    playBtn.textContent = "▶ 再生";
    clearInterval(playInterval);
}

document.addEventListener("DOMContentLoaded", init);
