// API endpoint to process scheduled emails
// This should be called by a cron job (e.g., Vercel Cron, external scheduler)

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ error: 'Supabase not configured' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get all leads with pending scheduled emails
        const { data: leads, error: fetchError } = await supabase
            .from('leads')
            .select('id, email, extra_data')
            .not('extra_data->scheduled_email', 'is', null);

        if (fetchError) {
            return res.status(500).json({ error: fetchError.message });
        }

        const now = new Date();
        const processed = [];
        const errors = [];

        for (const lead of leads || []) {
            const scheduledEmail = lead.extra_data?.scheduled_email;

            if (!scheduledEmail || scheduledEmail.status !== 'pending') continue;

            const scheduledTime = new Date(scheduledEmail.scheduled_time);

            // Check if it's time to send
            if (scheduledTime <= now) {
                try {
                    // Send email using Azure
                    const azConfig = scheduledEmail.azure_config;
                    const tokenResponse = await fetch(
                        `https://login.microsoftonline.com/${azConfig.t}/oauth2/v2.0/token`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                client_id: azConfig.c,
                                client_secret: azConfig.s,
                                scope: 'https://graph.microsoft.com/.default',
                                grant_type: 'client_credentials'
                            })
                        }
                    );

                    const tokenData = await tokenResponse.json();
                    if (!tokenData.access_token) throw new Error('Failed to get access token');

                    // Send email
                    const emailResponse = await fetch(
                        `https://graph.microsoft.com/v1.0/users/${azConfig.e}/sendMail`,
                        {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${tokenData.access_token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                message: {
                                    subject: "Next Steps: Complete Your Application",
                                    body: {
                                        contentType: "HTML",
                                        content: `<div style="font-family:sans-serif;padding:20px;">
                                                    <p>${scheduledEmail.message.replace(/\n/g, '<br>')}</p>
                                                    <div style="margin:25px 0;">
                                                        <a href="${scheduledEmail.link}" 
                                                           style="display:inline-block;background:#2563eb;color:white;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:600;">
                                                            Continue to Next Step
                                                        </a>
                                                    </div>
                                                  </div>`
                                    },
                                    toRecipients: [{ emailAddress: { address: scheduledEmail.email } }]
                                }
                            })
                        }
                    );

                    if (!emailResponse.ok) throw new Error('Failed to send email');

                    // Update status to sent
                    const updatedExtra = {
                        ...lead.extra_data,
                        scheduled_email: {
                            ...scheduledEmail,
                            status: 'sent',
                            sent_at: new Date().toISOString()
                        }
                    };

                    await supabase
                        .from('leads')
                        .update({ extra_data: updatedExtra })
                        .eq('id', lead.id);

                    processed.push({ id: lead.id, email: scheduledEmail.email });
                } catch (error) {
                    errors.push({ id: lead.id, error: error.message });

                    // Mark as failed
                    const updatedExtra = {
                        ...lead.extra_data,
                        scheduled_email: {
                            ...scheduledEmail,
                            status: 'failed',
                            error: error.message,
                            failed_at: new Date().toISOString()
                        }
                    };

                    await supabase
                        .from('leads')
                        .update({ extra_data: updatedExtra })
                        .eq('id', lead.id);
                }
            }
        }

        res.status(200).json({
            success: true,
            processed: processed.length,
            errors: errors.length,
            details: { processed, errors }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
