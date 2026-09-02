// ご自身のバケット名に合わせています
const BUCKET_URL = "https://storage.googleapis.com/ecmwf-images";

let manifestData = null;
let playInterval = null;

// DOM要素の取得
const slider = document.getElementById("time-slider");
const playBtn = document.getElementById("play-btn");
const cycleSelect = document.getElementById("cycle-select");
const initTimeDisplay = document.getElementById("init-time-display");
const validTimeDisplay = document.getElementById("valid-time-display");
const stepDisplay = document.getElementById("step-display");
const img500 = document.getElementById("img-500");
const img850 = document.getElementById("img-850");

// 1. バケットルートから cycles.json を取得してプルダウンを作る
async function initApp() {
    try {
        const res = await fetch(`${BUCKET_URL}/cycles.json?t=${new Date().getTime()}`);
        const cycles = await res.json();
        
        cycleSelect.innerHTML = "";
        cycles.forEach((cycle) => {
            const option = document.createElement("option");
            option.value = cycle;
            // "2026090200" -> "2026/09/02 00Z" のように見やすく整形
            const yyyy = cycle.substring(0, 4);
            const mm = cycle.substring(4, 6);
            const dd = cycle.substring(6, 8);
            const hh = cycle.substring(8, 10);
            option.textContent = `${yyyy}/${mm}/${dd} ${hh}Z`;
            cycleSelect.appendChild(option);
        });
        cycleSelect.disabled = false;
        
        // 最新のサイクル（リストの先頭）を読み込む
        if (cycles.length > 0) {
            loadManifest(cycles[0]);
        }
    } catch (error) {
        console.error("サイクルの読み込みエラー:", error);
        cycleSelect.innerHTML = "<option>データ取得エラー</option>";
    }
}

// 2. 選んだ初期時刻のフォルダから manifest.json を取得
async function loadManifest(cycleStr) {
    stopAnimation();
    manifestData = null;
    slider.disabled = true;
    
    try {
        const res = await fetch(`${BUCKET_URL}/${cycleStr}/manifest.json`);
        manifestData = await res.json();
        
        initTimeDisplay.textContent = `初期値: ${manifestData.init_time_jst}`;
        slider.max = manifestData.figures.length - 1;
        slider.value = 0;
        slider.disabled = false;
        
        preloadImages();
        updateDisplay(0);
    } catch (error) {
        console.error("マニフェストの読み込みエラー:", error);
        initTimeDisplay.textContent = "データの読み込みに失敗しました。";
    }
}

// 3. 画面の更新（2枚の画像を同時に切り替え）
function updateDisplay(index) {
    if (!manifestData) return;
    
    const frame = manifestData.figures[index];
    validTimeDisplay.textContent = frame.valid_time;
    stepDisplay.textContent = `FT=${String(frame.step).padStart(3, '0')}h`;
    
    // manifest.json内のパス(例: 2026090200/500hPa_006.png) をそのまま結合
    img500.src = `${BUCKET_URL}/${frame.file_500}`;
    img850.src = `${BUCKET_URL}/${frame.file_850}`;
}

// 4. 裏側で画像を事前読み込み（スライダーを滑らかにするため）
function preloadImages() {
    manifestData.figures.forEach(frame => {
        const i1 = new Image();
        const i2 = new Image();
        i1.src = `${BUCKET_URL}/${frame.file_500}`;
        i2.src = `${BUCKET_URL}/${frame.file_850}`;
    });
}

// 5. アニメーション制御
function startAnimation() {
    playBtn.textContent = "■ 停止";
    playInterval = setInterval(() => {
        let nextIndex = parseInt(slider.value) + 1;
        if (nextIndex >= manifestData.figures.length) {
            nextIndex = 0;
        }
        slider.value = nextIndex;
        updateDisplay(nextIndex);
    }, 800);
}

function stopAnimation() {
    playBtn.textContent = "▶ 再生";
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
}

// イベントリスナー
cycleSelect.addEventListener("change", (e) => loadManifest(e.target.value));
slider.addEventListener("input", (e) => {
    updateDisplay(parseInt(e.target.value));
    stopAnimation();
});
playBtn.addEventListener("click", () => {
    if (playInterval) stopAnimation();
    else startAnimation();
});

// アプリの起動
initApp();
