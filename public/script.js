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

    // 履歴に新規エントリが追加されないようにする
    window.history.replaceState({}, '', window.location.pathname);
});

// 戻るボタン押下で検索モードに戻る
document.getElementById('backButton').addEventListener('click', function(e) {
    document.getElementById('proxyContainer').style.display = 'none';
    document.getElementById('proxyIframe').src = ''; // iframeをクリア
    document.getElementById('searchContainer').style.display = 'block';
});
