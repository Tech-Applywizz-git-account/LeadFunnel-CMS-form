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
                        content: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #334155; line-height: 1.6; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                                    <div style="margin-bottom: 25px;">
                                        ${m.split('\n').map(line => {
                            const trimmed = line.trim();
                            const fullUrlRegex = /^(https?:\/\/[^\s]+)$/;
                            if (fullUrlRegex.test(trimmed)) {
                                const url = trimmed;
                                let icon = '🔗';
                                if (url.toLowerCase().endsWith('.pdf')) {
                                    icon = '🏷️';
                                } else if (url.toLowerCase().includes('form')) {
                                    icon = '📄';
                                }
                                return `<div style="display: flex; align-items: center; margin: 12px 0; background-color: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb;">
                                                            <div style="background-color: #eff6ff; border-radius: 8px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                                                                <span style="font-size: 20px;">${icon}</span>
                                                            </div>
                                                            <a href="${url}" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 14px; word-break: break-all;">${url}</a>
                                                        </div>`;
                            } else {
                                const inlineUrlRegex = /(https?:\/\/[^\s]+)/g;
                                const linkified = line.replace(inlineUrlRegex, '<a href="$1" style="color: #2563eb; text-decoration: underline;">$1</a>');
                                return `<p style="margin: 0 0 12px 0;">${linkified || '&nbsp;'}</p>`;
                            }
                        }).join('')}
                                    </div>
                                    <div style="margin-top: 30px; text-align: left;">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${f}" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="18%" stroke="f" fillcolor="#2563eb">
                                            <w:anchorlock/>
                                            <center>
                                        <![endif]-->
                                        <a href="${f}" style="background-color:#2563eb; border-radius:12px; color:#ffffff; display:inline-block; font-family:sans-serif; font-size:16px; font-weight:bold; line-height:50px; text-align:center; text-decoration:none; width:240px; -webkit-text-size-adjust:none; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Open Last Form</a>
                                        <!--[if mso]>
                                            </center>
                                        </v:roundrect>
                                        <![endif]-->
                                    </div>
                                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; text-align: center;">
                                        &copy; ${new Date().getFullYear()} Applywizz Support. All rights reserved.
                                    </div>
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
