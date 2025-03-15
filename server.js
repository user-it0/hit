const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// URLを日付ごとに変更するためのファイルパス
const urlFilePath = path.join(__dirname, 'current_url.txt');

// publicフォルダ内の静的ファイルを配信
app.use(express.static('public'));

// 新しいURLを生成する関数（例として日付を含めた固定URL）
function getNewUrl() {
    const today = new Date();
    // 月は0起算なので +1
    const newUrl = `https://example-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.com`;
    return newUrl;
}

// URLを変更するたびにファイルに保存
function saveNewUrl() {
    const newUrl = getNewUrl();
    fs.writeFileSync(urlFilePath, newUrl, 'utf8');
}

// サーバー起動時、または初回起動時にURLを生成して保存
if (!fs.existsSync(urlFilePath)) {
    saveNewUrl();
}

// URLを取得する関数
function getCurrentUrl() {
    try {
        return fs.readFileSync(urlFilePath, 'utf8');
    } catch (err) {
        console.error('URL読み込みエラー:', err);
        return null;
    }
}

// /fetch?url=... でリモートURLの内容を取得するエンドポイント
app.get('/fetch', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URLパラメータが必要です');
    }

    // URLの妥当性チェック
    try {
        new URL(targetUrl);
    } catch (e) {
        return res.status(400).send('無効なURLです');
    }
    
    // 「category」や「カテゴリー」が含まれるURLはブロック
    if (/category|カテゴリー/i.test(targetUrl)) {
        return res.status(403).send('カテゴリーのアクセスは禁止されています');
    }

    try {
        // axiosでURL取得（タイムアウト15秒、バイナリデータとして受信）
        const response = await axios.get(targetUrl, { responseType: 'arraybuffer', timeout: 15000 });
        res.set('Content-Type', response.headers['content-type'] || 'text/html');
        res.send(response.data);
    } catch (error) {
        console.error('URL取得エラー:', error.message);
        if (error.response) {
            return res.status(error.response.status).send(`URL取得エラー: ${error.response.statusText}`);
        }
        return res.status(500).send('指定URLの取得に失敗しました');
    }
});

// 古いURLでアクセスがあった場合に、新しいURLへリダイレクトする処理
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
    
    // 24時間ごとにURLを更新（例：毎日自動更新）
    setInterval(() => {
        saveNewUrl();
        console.log('新しいURLに更新されました');
    }, 24 * 60 * 60 * 1000);
});
