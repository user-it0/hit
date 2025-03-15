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

// リンククリック時にプロキシ経由で開くようにする
document.getElementById('proxyIframe').addEventListener('load', function() {
    // iframe内のコンテンツを取得
    const iframe = document.getElementById('proxyIframe');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // iframe内のすべてのリンクをプロキシ経由に変更
    const links = iframeDoc.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // デフォルトのリンク遷移を防ぐ
            let targetUrl = link.href;

            // リンク先URLが外部であればプロキシ経由で開く
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                targetUrl = 'http://' + targetUrl;
            }

            iframe.src = '/fetch?url=' + encodeURIComponent(targetUrl); // プロキシ経由でURLを設定
        });
    });
});

// 戻るボタンをドラッグで移動可能にするコード（変更なし）
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
