const express = require('express');
const fetch = require('node-fetch'); // 修正: request -> node-fetch に変更
const app = express();
const port = process.env.PORT || 3000;

// 静的ファイルを提供
app.use(express.static('public'));

// プロキシリクエスト処理
app.get('/fetch', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL is required');

    try {
        const response = await fetch(url);
        let body = await response.text();

        // すべてのリンクをプロキシ経由に変更
        body = body.replace(/href="(.*?)"/g, (match, link) => {
            return `href="/fetch?url=${encodeURIComponent(link)}"`;
        });

        res.send(body);
    } catch (error) {
        res.status(500).send('Error fetching URL');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
