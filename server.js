const express = require('express');
const request = require('request');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// プロキシリクエスト処理
app.get('/fetch', (req, res) => {
    let targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URLが指定されていません');
    }

    request(targetUrl, (error, response, body) => {
        if (error) {
            return res.status(500).send('エラーが発生しました');
        }

        // すべてのリンクをプロキシURLに書き換え
        body = body.replace(/href="(https?:\/\/[^"]+)"/g, (match, p1) => {
            return `href="/fetch?url=${encodeURIComponent(p1)}"`;
        });

        // すべてのフォーム送信もプロキシ化
        body = body.replace(/action="(https?:\/\/[^"]+)"/g, (match, p1) => {
            return `action="/fetch?url=${encodeURIComponent(p1)}"`;
        });

        res.send(body);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
