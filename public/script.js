document.getElementById('proxyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let url = document.getElementById('urlInput').value;

    // プロトコルがない場合は http:// を追加
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }

    // iframeにURLをセット
    const iframe = document.getElementById('proxyIframe');
    iframe.src = '/fetch?url=' + encodeURIComponent(url);

    // 履歴に新しいエントリを追加しないようにする
    window.history.replaceState({}, '', window.location.pathname);
});
