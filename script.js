// === 設定 ===
const baseUrl = "https://storage.googleapis.com/ecmwf-images/msl";
const steps = [];
for (let i = 6; i <= 144; i += 6) {
    steps.push(i); // [6, 12, 18 ... 144]
}

// ページ読み込み時のタイムスタンプ（キャッシュ回避用）
// ※スライダーを動かす度に変わると画像が再ダウンロードされてチラつくため、固定する
const sessionCacheBuster = new Date().getTime();

// === DOM要素の取得 ===
const slider = document.getElementById("time-slider");
const ftDisplay = document.getElementById("ft-display");
const imgElement = document.getElementById("weather-image");
const loadingText = document.getElementById("loading");
const playBtn = document.getElementById("play-btn");

let playInterval = null;

// === 画像の更新処理 ===
function updateImage(index) {
    const stepVal = steps[index];
    // 3桁のゼロ埋め (例: 6 -> 006, 12 -> 012)
    const stepStr = String(stepVal).padStart(3, '0');
    
    ftDisplay.textContent = `FT=${stepStr}h`;
    
    // 画像URLの組み立て
    const imageUrl = `${baseUrl}/msl_${stepStr}.png?t=${sessionCacheBuster}`;
    
    imgElement.src = imageUrl;
    
    // 読み込み完了後にloading表示を消す
    imgElement.onload = () => {
        imgElement.style.display = "block";
        loadingText.style.display = "none";
    };
}

// === イベントリスナー ===
// スライダーを手動で動かした時
slider.addEventListener("input", (e) => {
    updateImage(parseInt(e.target.value));
    stopAnimation(); // 手動操作時は自動再生を停止
});

// 再生/停止ボタン
playBtn.addEventListener("click", () => {
    if (playInterval) {
        stopAnimation();
    } else {
        startAnimation();
    }
});

function startAnimation() {
    playBtn.textContent = "■ 停止";
    playInterval = setInterval(() => {
        let nextIndex = parseInt(slider.value) + 1;
        if (nextIndex >= steps.length) {
            nextIndex = 0; // 最後まで行ったら最初に戻る
        }
        slider.value = nextIndex;
        updateImage(nextIndex);
    }, 800); // 0.8秒間隔で切り替え
}

function stopAnimation() {
    playBtn.textContent = "▶ 再生";
    clearInterval(playInterval);
    playInterval = null;
}

// === 初期化 ===
// 背景で全画像を事前読み込み（キャッシュ）してスライダーを滑らかにする
steps.forEach(step => {
    const img = new Image();
    const stepStr = String(step).padStart(3, '0');
    img.src = `${baseUrl}/msl_${stepStr}.png?t=${sessionCacheBuster}`;
});

// 最初の画像を表示
updateImage(0);
