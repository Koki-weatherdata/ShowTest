const BUCKET_URL = "https://storage.googleapis.com/ecmwf-images";

let manifestData = null;
let playInterval = null;

const slider = document.getElementById("time-slider");
const playBtn = document.getElementById("play-btn");
const cycleSelect = document.getElementById("cycle-select");
const validTimeDisplay = document.getElementById("valid-time-display");
const stepDisplay = document.getElementById("step-display");
const img500 = document.getElementById("img-500");
const img850 = document.getElementById("img-850");

// 1. 利用可能なサイクルのリストを取得
async function initApp() {
    try {
        const res = await fetch(`${BUCKET_URL}/cycles.json?t=${new Date().getTime()}`);
        const cycles = await res.json();
        
        // プルダウンの生成
        cycleSelect.innerHTML = "";
        cycles.forEach((cycle, index) => {
            const option = document.createElement("option");
            option.value = cycle;
            // 例: 2026090200 -> 2026年09月02日 00Z (JST 09:00) のように成形可能
            option.textContent = `${cycle.substring(0,4)}/${cycle.substring(4,6)}/${cycle.substring(6,8)} ${cycle.substring(8,10)}Z`;
            cycleSelect.appendChild(option);
        });
        cycleSelect.disabled = false;
        
        // 最新サイクルを読み込む
        loadManifest(cycles[0]);
    } catch (error) {
        cycleSelect.innerHTML = "<option>データ取得エラー</option>";
    }
}

// 2. 選択されたサイクルのマニフェストを読み込む
async function loadManifest(cycleStr) {
    stopAnimation();
    manifestData = null;
    slider.disabled = true;
    
    const res = await fetch(`${BUCKET_URL}/${cycleStr}/manifest.json`);
    manifestData = await res.json();
    
    slider.max = manifestData.figures.length - 1;
    slider.value = 0;
    slider.disabled = false;
    
    preloadImages();
    updateDisplay(0);
}

// (updateDisplay等のその他の関数は以前と同じです)

// プルダウン変更時のイベント
cycleSelect.addEventListener("change", (e) => {
    loadManifest(e.target.value);
});

// 起動
initApp();
