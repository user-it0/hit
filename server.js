const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// URLを日付ごとに変更するためのファイルパス
const urlFilePath = path.join(__dirname, 'current_url.txt');

// publicフォルダ内の静的ファイルを配信
app.use(express.static('public'));

/**
 * 新しいURLを生成する（例として日付による固定URL）
 */
function getNewUrl() {
  const today = new Date();
  // ※例: 毎日異なるドメイン名（実際の運用では適切なURL生成方法に変更してください）
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
 * axiosによるURL取得をリトライ付きで実施する関数
 */
async function fetchURL(targetUrl, retries = 3) {
  while (retries > 0) {
    try {
      return await axios.get(targetUrl, { responseType: 'arraybuffer', timeout: 10000 });
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw error;
      }
    }
  }
}

// /fetch?url=… でリモートURLの内容を取得するエンドポイント
app.get('/fetch', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('URLパラメータが必要です');
  }

  // URLに「category」または「カテゴリー」が含まれている場合はブロック
  if (/category|カテゴリー/i.test(targetUrl)) {
    return res.status(403).send('カテゴリーのアクセスは禁止されています');
  }

  try {
    const response = await fetchURL(targetUrl);
    const contentType = response.headers['content-type'] || 'text/html';
    res.set('Content-Type', contentType);

    // HTMLの場合はリンク・フォームの書き換えを行い、プロキシ経由でのアクセスを可能にする
    if (contentType.includes('text/html')) {
      let html = response.data.toString('utf8');
      const $ = cheerio.load(html);

      // <a>タグの書き換え
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          try {
            // 絶対パスでなければ、targetUrl を基準に解決
            const newHref = new URL(href, targetUrl).href;
            $(elem).attr('href', '/fetch?url=' + encodeURIComponent(newHref));
            // リンククリック時、現在のiframe内で読み込むようにする
            $(elem).attr('target', '_self');
          } catch (error) {
            // 書き換えできない場合はそのまま
          }
        }
      });

      // <form>タグの書き換え（action属性）
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

      // 変更後のHTMLを送信
      html = $.html();
      res.send(html);
    } else {
      // HTML以外のコンテンツはそのまま送信
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

// サーバー起動
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  // 24時間ごとにURLを更新（例として24時間毎に実施）
  setInterval(() => {
    saveNewUrl();
    console.log('新しいURLに更新されました');
  }, 24 * 60 * 60 * 1000);
});
