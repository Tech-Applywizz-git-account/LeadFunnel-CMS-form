const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        // Using is.gd for potentially shorter slugs (usually 5-6 chars)
        const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Shortener service failed');
        const shortUrl = await response.text();
        res.status(200).json({ shortUrl });
    } catch (error) {
        // Fallback to TinyURL if is.gd fails
        try {
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            const shortUrl = await response.text();
            res.status(200).json({ shortUrl });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
};
