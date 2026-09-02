// バケットのルートURL（ご自身のバケット名に変更してください）
const BUCKET_URL = "https://storage.googleapis.com/ecmwf-images";

let manifestData = null;
let playInterval = null;

// DOM要素
const slider = document.getElementById("time-slider");
const playBtn = document.getElementById("play-btn");
const initTimeDisplay = document.getElementById("init-time-display");
const validTimeDisplay = document.getElementById("valid-time-display");
const stepDisplay = document.getElementById("step-display");
const img500 = document.getElementById("img-500");
const img850 = document.getElementById("img-850");

// 1. マニフェストの取得と初期化
async function loadManifest() {
    try {
        // キャッシュ回避のためタイムスタンプを付与
        const response = await fetch(`${BUCKET_URL}/manifest.json?t=${new Date().getTime()}`);
        manifestData = await response.json();
        
        // 初期値の表示
        initTimeDisplay.textContent = `初期値: ${manifestData.init_time_jst}`;
        
        // スライダーの設定 (0 から 配列の最後のインデックスまで)
        slider.max = manifestData.figures.length - 1;
        slider.disabled = false;
        
        // 事前読み込みと最初の画像表示
        preloadImages();
        updateDisplay(0);
        
    } catch (error) {
        console.error("マニフェストの読み込みに失敗しました:", error);
        initTimeDisplay.textContent = "データの読み込みに失敗しました。";
    }
}

// 2. 画面の更新処理
function updateDisplay(index) {
    if (!manifestData) return;
    
    const frame = manifestData.figures[index];
    
    // テキストの更新
    validTimeDisplay.textContent = frame.valid_time;
    stepDisplay.textContent = `FT=${String(frame.step).padStart(3, '0')}h`;
    
    // 画像URLの更新（キャッシュ回避用のパラメータを付与してチラつきを防ぐ）
    const cacheBuster = `?init=${manifestData.init_time}`;
    img500.src = `${BUCKET_URL}/${frame.file_500}${cacheBuster}`;
    img850.src = `${BUCKET_URL}/${frame.file_850}${cacheBuster}`;
}

// 3. 全画像の裏側での事前読み込み
function preloadImages() {
    const cacheBuster = `?init=${manifestData.init_time}`;
    manifestData.figures.forEach(frame => {
        const i1 = new Image();
        const i2 = new Image();
        i1.src = `${BUCKET_URL}/${frame.file_500}${cacheBuster}`;
        i2.src = `${BUCKET_URL}/${frame.file_850}${cacheBuster}`;
    });
}

// 4. アニメーション制御
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
    clearInterval(playInterval);
    playInterval = null;
}

// イベントリスナー
slider.addEventListener("input", (e) => {
    updateDisplay(parseInt(e.target.value));
    stopAnimation();
});

playBtn.addEventListener("click", () => {
    if (playInterval) stopAnimation();
    else startAnimation();
});

// 起動
loadManifest();
