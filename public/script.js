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

    // iframe 内のリンクやフォームもプロキシ化する
    setTimeout(enableProxyLinks, 2000);
});

// 戻るボタンで検索画面に戻る
document.getElementById('backButton').addEventListener('click', function() {
    document.getElementById('proxyContainer').style.display = 'none';
    document.getElementById('proxyIframe').src = ''; // iframeをクリア
    document.getElementById('searchContainer').style.display = 'block';
});

// iframe 内のリンクやフォームをすべてプロキシ経由にする
function enableProxyLinks() {
    let iframe = document.getElementById('proxyIframe');

    iframe.onload = function() {
        try {
            let doc = iframe.contentDocument || iframe.contentWindow.document;

            // すべてのリンクを書き換え
            let links = doc.getElementsByTagName('a');
            for (let i = 0; i < links.length; i++) {
                links[i].href = '/fetch?url=' + encodeURIComponent(links[i].href);
            }

            // すべてのフォームを書き換え
            let forms = doc.getElementsByTagName('form');
            for (let i = 0; i < forms.length; i++) {
                forms[i].action = '/fetch?url=' + encodeURIComponent(forms[i].action);
            }

            // JavaScript による URL 変更を監視
            let observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
                        let newUrl = mutation.target.href;
                        mutation.target.href = '/fetch?url=' + encodeURIComponent(newUrl);
                    }
                });
            });

            observer.observe(doc, { attributes: true, subtree: true });

        } catch (e) {
            console.error('iframe の変更に失敗しました:', e);
        }
    };
}
