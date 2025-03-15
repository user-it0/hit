document.getElementById('proxyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let url = document.getElementById('urlInput').value;

    // プロトコルがない場合は http:// を追加
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }

    // iframeにリモートURLを設定
    document.getElementById('proxyIframe').src = '/fetch?url=' + encodeURIComponent(url);

    // 検索モードを非表示にし、全画面モードを表示
    document.getElementById('searchContainer').style.display = 'none';
    document.getElementById('proxyContainer').style.display = 'block';

    // 履歴を増やさない
    window.history.replaceState({}, '', window.location.pathname);
});

// 戻るボタンで検索画面に戻る
document.getElementById('backButton').addEventListener('click', function() {
    document.getElementById('proxyContainer').style.display = 'none';
    document.getElementById('proxyIframe').src = ''; // iframeをクリア
    document.getElementById('searchContainer').style.display = 'block';
});

/* ====== 戻るボタンをドラッグで移動可能にする ====== */
const backButton = document.getElementById('backButton');

let isDragging = false;
let offsetX, offsetY;

backButton.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - backButton.getBoundingClientRect().left;
    offsetY = e.clientY - backButton.getBoundingClientRect().top;
    backButton.style.cursor = "grabbing";
});

backButton.addEventListener('touchstart', (e) => {
    isDragging = true;
    const touch = e.touches[0];
    offsetX = touch.clientX - backButton.getBoundingClientRect().left;
    offsetY = touch.clientY - backButton.getBoundingClientRect().top;
    backButton.style.cursor = "grabbing";
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        let x = e.clientX - offsetX;
        let y = e.clientY - offsetY;
        backButton.style.left = `${x}px`;
        backButton.style.top = `${y}px`;
    }
});

document.addEventListener('touchmove', (e) => {
    if (isDragging) {
        const touch = e.touches[0];
        let x = touch.clientX - offsetX;
        let y = touch.clientY - offsetY;
        backButton.style.left = `${x}px`;
        backButton.style.top = `${y}px`;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    backButton.style.cursor = "grab";
});

document.addEventListener('touchend', () => {
    isDragging = false;
    backButton.style.cursor = "grab";
});
