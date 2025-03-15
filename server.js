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

// 新しいURLを生成する関数（仮）
function getNewUrl() {
    // 現在の日付に基づいてURLを変更（例：日付による固定URL）
    const today = new Date();
    const newUrl = `https://example-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.com`;
    return newUrl;
}

// URLが変更されるときにファイルに保存
function saveNewUrl() {
    const newUrl = getNewUrl();
    fs.writeFileSync(urlFilePath, newUrl, 'utf8');
}

// サーバーが起動するたびにURLを更新
if (!fs.existsSync(urlFilePath)) {
    saveNewUrl();  // 最初にURLを生成して保存
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

// /fetch?url=… でリモートURLの内容を取得する
app.get('/fetch', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URLパラメータが必要です');
    }

    // ここでURLに「category」または「カテゴリー」が含まれている場合はブロック
    if (/category|カテゴリー/i.test(targetUrl)) {
        return res.status(403).send('カテゴリーのアクセスは禁止されています');
    }

    try {
        // axiosで指定URLを取得（バイナリデータとして受信）
        const response = await axios.get(targetUrl, { responseType: 'arraybuffer' });
        // 取得したコンテンツのContent-Typeをそのまま設定
        res.set('Content-Type', response.headers['content-type'] || 'text/html');
        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('指定URLの取得に失敗しました');
    }
});

// 古いURLでアクセスがあった場合に新しいURLにリダイレクトする処理
app.get('/old-url', (req, res) => {
    const currentUrl = getCurrentUrl();
    if (currentUrl) {
        // 新しいURLにリダイレクト
        res.redirect(301, `/fetch?url=${encodeURIComponent(currentUrl)}`);
    } else {
        res.status(500).send('URLが更新されていません');
    }
});

// サーバー起動
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    
    // 定期的にURLを更新（例：毎日午前0時にURLを変更）
    setInterval(() => {
        saveNewUrl();
        console.log('新しいURLに更新されました');
    }, 24 * 60 * 60 * 1000);  // 24時間毎に更新
});
