// GCSバケットのベースURL（ローカル開発時は 'https://storage.googleapis.com/weather-dashboard-507311' 等に書き換えてください）
const BASE_URL = "https://storage.googleapis.com/ecmwf-images-dev"; 

// 利用可能な変数の定義
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

// DOM要素
const cycleSelect = document.getElementById("cycle-select");
const validTimeDisplay = document.getElementById("valid-time-display");
const stepDisplay = document.getElementById("step-display");
const imgLeft = document.getElementById("img-left");
const imgRight = document.getElementById("img-right");
const varSelectLeft = document.getElementById("var-select-left");
const varSelectRight = document.getElementById("var-select-right");
const timeSlider = document.getElementById("time-slider");
const playBtn = document.getElementById("play-btn");

let frames = [];
let currentIndex = 0;
let isPlaying = false;
let playInterval;

// 初期化
async function init() {
    populateVarSelects();
    await loadCycles();
    
    // イベントリスナー
    cycleSelect.addEventListener("change", () => loadManifest(cycleSelect.value));
    timeSlider.addEventListener("input", (e) => updateView(parseInt(e.target.value)));
    playBtn.addEventListener("click", togglePlay);
    
    // 変数が変更されたら、必要な画像をプリロードして現在のビューを更新
    varSelectLeft.addEventListener("change", () => {
        preloadVariables();
        updateView(currentIndex);
    });
    varSelectRight.addEventListener("change", () => {
        preloadVariables();
        updateView(currentIndex);
    });
}

// プルダウンに要素を追加し、デフォルト値をセット
function populateVarSelects() {
    for (const [key, name] of Object.entries(VARIABLES)) {
        const optL = new Option(name, key);
        const optR = new Option(name, key);
        varSelectLeft.add(optL);
        varSelectRight.add(optR);
    }
    // デフォルトセット
    varSelectLeft.value = "z500-vort";
    varSelectRight.value = "mslp-t850";
}

// cycles.jsonの取得
async function loadCycles() {
    try {
        const res = await fetch(`${BASE_URL}/cycles.json`);
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

// 選択された初期値のmanifestを読み込む
async function loadManifest(cyclePrefix) {
    pause();
    try {
        const res = await fetch(`${BASE_URL}/${cyclePrefix}/manifest.json`);
        const manifest = await res.json();
        frames = manifest.figures;
        
        timeSlider.max = frames.length - 1;
        timeSlider.value = 0;
        timeSlider.disabled = false;
        
        preloadVariables(); // 初期表示に必要な変数だけをプリロード
        updateView(0);
    } catch (e) {
        console.error("Manifest load error", e);
    }
}

// 現在プルダウンで選択されている変数のみを全ステップ分キャッシュ（オンデマンド読み込み）
function preloadVariables() {
    if (!frames.length) return;
    const vLeft = varSelectLeft.value;
    const vRight = varSelectRight.value;
    
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

// 画面の更新
function updateView(index) {
    if (!frames.length || index < 0 || index >= frames.length) return;
    currentIndex = index;
    timeSlider.value = index;
    
    const frame = frames[index];
    validTimeDisplay.textContent = frame.valid_time;
    stepDisplay.textContent = `FT=${String(frame.step).padStart(3, '0')}`;
    
    const vLeft = varSelectLeft.value;
    const vRight = varSelectRight.value;
    
    imgLeft.src = frame[`file_${vLeft}`] ? `${BASE_URL}/${frame[`file_${vLeft}`]}` : "";
    imgRight.src = frame[`file_${vRight}`] ? `${BASE_URL}/${frame[`file_${vRight}`]}` : "";
}

// 再生コントロール
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
    }, 600); // 0.6秒間隔
}

function pause() {
    isPlaying = false;
    playBtn.textContent = "▶ 再生";
    clearInterval(playInterval);
}

// 実行
document.addEventListener("DOMContentLoaded", init);
