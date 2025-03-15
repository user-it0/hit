const express = require('express');
const fetch = require('node-fetch'); // node-fetch を使用
const app = express();
const port = process.env.PORT || 3000;

// 静的ファイルを提供
app.use(express.static('public'));

// プロキシリクエスト処理
app.get('/fetch', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL is required');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            redirect: 'follow', // リダイレクトを許可
            follow: 200, // 最大リダイレクト回数
        });

        if (!response.ok) {
            return res.status(response.status).send(`Error: ${response.statusText}`);
        }

        let body = await response.text();

        // すべてのリンクをプロキシ経由に変更
        body = body.replace(/href="(.*?)"/g, (match, link) => {
            if (link.startsWith('http')) {
                return `href="/fetch?url=${encodeURIComponent(link)}"`;
            }
            return match;
        });

        res.type('text/html'); // コンテンツタイプを HTML に設定
        res.send(body);
    } catch (error) {
        console.error('Fetch error:', error.message);
        res.status(500).send(`Error fetching URL: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
