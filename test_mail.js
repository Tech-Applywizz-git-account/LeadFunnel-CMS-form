// Using global fetch (Node 18+)

async function sendTestMail() {
    const az = {
        t: "80f623c2-c2f9-424a-a62a-46206627846f",
        c: "7c0d3393-66cf-460e-908b-9a9bcbf1d982",
        s: "l3j8Q~QzkmN4hvH3RaeJna4eTJVhugkUpsXlQdxv",
        e: "support@readytowork.agency"
    };

    const e = "Dinesh@applywizz.com";
    const m = `HI

[digital resume](https://bhanu-digital-resume.vercel.app/SAMPLE_RESUME__DIGITAL_RESUME.pdf)`;

    const f = "https://lead-funnel-cms-form.vercel.app/second_form?s=CI5Y7&email=Dinesh@applywizz.com";

    console.log("Starting test email send to:", e);

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
        console.log("Token obtained successfully.");

        // 2. Format Body
        const formattedContent = `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #334155; line-height: 1.6; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                                    <div style="margin-bottom: 25px;">
                                        ${(() => {
                const firstPdfUrl = m.match(/https?:\/\/[^\s]+\.pdf/i)?.[0];
                const hasKeyword = /digital[_ ]resume/gi.test(m);

                return m.split('\n').map(line => {
                    const trimmed = line.trim();
                    const fullUrlRegex = /^(https?:\/\/[^\s]+)$/;
                    if (fullUrlRegex.test(trimmed)) {
                        const url = trimmed;
                        if (hasKeyword && url === firstPdfUrl) return '';

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
                        const combinedRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(digital[_ ]resume)|(https?:\/\/[^\s]+)/gi;
                        const processedLine = line.replace(combinedRegex, (match, mText, mUrl, keyword, standardUrl) => {
                            if (mText && mUrl) return `<a href="${mUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${mText} &#8599;&#65038;</a>`;
                            if (keyword && firstPdfUrl) return `<a href="${firstPdfUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${keyword} &#8599;&#65038;</a>`;
                            if (standardUrl) {
                                if (hasKeyword && standardUrl === firstPdfUrl) return standardUrl;
                                return `<a href="${standardUrl}" style="color: #2563eb; text-decoration: underline;">${standardUrl}</a>`;
                            }
                            return match;
                        });
                        return `<p style="margin: 0 0 12px 0;">${processedLine || '&nbsp;'}</p>`;
                    }
                }).filter(l => l !== '').join('');
            })()}
                                    </div>
                                    <div style="margin-top: 30px; text-align: left;">
                                        <a href="${f}" style="background-color:#2563eb; border-radius:12px; color:#ffffff; display:inline-block; font-family:sans-serif; font-size:16px; font-weight:bold; line-height:50px; text-align:center; text-decoration:none; width:240px; -webkit-text-size-adjust:none; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Open Last Form</a>
                                    </div>
                                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; text-align: center;">
                                        &copy; ${new Date().getFullYear()} Support. All rights reserved.
                                    </div>
                                  </div>`;

        // 3. Send Email
        const mailRes = await fetch(`https://graph.microsoft.com/v1.0/users/${az.e}/sendMail`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'Prefer': 'outlook.body-content-type="html"'
            },
            body: JSON.stringify({
                message: {
                    subject: "Template Test",
                    body: {
                        contentType: "HTML",
                        content: formattedContent
                    },
                    toRecipients: [{ emailAddress: { address: e } }]
                }
            })
        });

        if (!mailRes.ok) {
            const mailErr = await mailRes.json();
            throw new Error(mailErr.error?.message || 'Mail send failed');
        }

        console.log("Success! Sample mail sent with new credentials to Dinesh@applywizz.com via support@readytowork.agency");
    } catch (error) {
        console.error("Error sending mail:", error.message);
    }
}

sendTestMail();
