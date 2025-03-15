document.getElementById('proxyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let url = document.getElementById('urlInput').value;

    // プロトコルが無い場合は http:// を追加
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }

    const iframe = document.getElementById('proxyIframe');
    iframe.src = '/fetch?url=' + encodeURIComponent(url);

    // 履歴に新たなエントリを追加しないため、URLを親ページで変更しない
    window.history.replaceState({}, '', window.location.pathname);
});

// iframe読み込み完了後、コンテンツの高さに合わせてiframeの高さを調整
document.getElementById('proxyIframe').addEventListener('load', function() {
    try {
        // proxiedコンテンツは同一オリジンとして扱われるため高さ取得が可能
        const iframeDoc = this.contentDocument || this.contentWindow.document;
        const newHeight = iframeDoc.documentElement.scrollHeight;
        this.style.height = newHeight + 'px';
    } catch (error) {
        console.error('iframeサイズ調整エラー:', error);
    }
});
