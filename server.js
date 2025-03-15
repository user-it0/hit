const express = require('express');
const request = require('request');
const app = express();
const port = process.env.PORT || 3000;

// 静的ファイルを提供
app.use(express.static('public'));

// プロキシリクエスト処理
app.get('/fetch', (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL is required');

    request(url, (error, response, body) => {
        if (error) return res.status(500).send('Error fetching URL');
        res.send(body.replace(/href="(.*?)"/g, (match, link) => {
            return `href="/fetch?url=${encodeURIComponent(link)}"`;
        }));
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
