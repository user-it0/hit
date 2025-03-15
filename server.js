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

/**
 * 新しいURLを生成する（例として日付による固定URL）
 */
function getNewUrl() {
    const today = new Date();
    // ※例：毎日異なるドメイン名（実際には運用に合わせたURL生成に変更してください）
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
        res.set('Content-Type', response.headers['content-type'] || 'text/html');
        res.send(response.data);
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
