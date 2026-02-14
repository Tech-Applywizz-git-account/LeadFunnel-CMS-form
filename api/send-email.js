const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { az, e, m, f } = req.body;

    try {
        // 1. Get Azure Token
        const tokenRes = await fetch(`https://login.microsoftonline.com/${az.t}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: az.c,
                scope: 'https://graph.microsoft.com/.default',
                client_secret: az.s,
                grant_type: 'client_credentials'
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Auth failed');

        const access_token = tokenData.access_token;

        // 2. Send Email
        const mailRes = await fetch(`https://graph.microsoft.com/v1.0/users/${az.e}/sendMail`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: {
                    subject: "Next Steps: Complete Your Application",
                    body: {
                        contentType: "HTML",
                        content: `<div style="font-family:sans-serif;padding:20px;">
                                    <p>${m.replace(/\n/g, '<br>')}</p>
                                    <div style="margin:25px 0;"><a href="${f}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Open Last Form</a></div>
                                  </div>`
                    },
                    toRecipients: [{ emailAddress: { address: e } }]
                }
            })
        });

        if (!mailRes.ok) {
            const mailErr = await mailRes.json();
            throw new Error(mailErr.error?.message || 'Mail send failed');
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
