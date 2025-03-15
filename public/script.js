document.getElementById('proxyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let url = document.getElementById('urlInput').value;

    // URLがプロトコルなしなら http:// を付ける
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }

    loadURL(url);
});

function loadURL(url) {
    document.getElementById('proxyIframe').src = '/fetch?url=' + encodeURIComponent(url);

    // 検索画面を非表示にして全画面表示
    document.getElementById('searchContainer').style.display = 'none';
    document.getElementById('proxyContainer').style.display = 'block';

    // 履歴を変更せずにURLを更新
    window.history.replaceState({}, '', window.location.pathname);
}

// 戻るボタンの処理
document.getElementById('backButton').addEventListener('click', function() {
    document.getElementById('proxyContainer').style.display = 'none';
    document.getElementById('proxyIframe').src = ''; // iframeリセット
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
