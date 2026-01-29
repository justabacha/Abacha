import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = req.body;
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Generate Ghost Code (JA-XXXX-ABA)
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const ghostCode = `JA-${randomDigits}-ABA`;

    try {
        // 🚨 SURGERY: Changed .update to .upsert
        // This ensures that even if the profile row doesn't exist yet, it gets created.
        const { error: dbError } = await supabase
            .from('profiles')
            .upsert({ 
                email: email, 
                otp_code: ghostCode, 
                otp_created_at: new Date().toISOString() 
            }, { onConflict: 'email' }); // This matches by email

        if (dbError) throw dbError;

        // 3. Setup Gmail Transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // 4. Send the Email
        await transporter.sendMail({
            from: `"Just•Abacha😎 Ghost Engine" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `|Just•Abacha😎| Your Ghost Access Code: ${ghostCode}`,
            html: `
                <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; text-align: center; border-radius: 20px;">
                    <h1 style="color: #fff;">Just•Abacha😎</h1>
                    <p style="font-size: 18px;">Your access code to the Hub is:</p>
                    <div style="background: #32D74B; color: #fff; font-size: 32px; font-weight: 900; padding: 20px; display: inline-block; border-radius: 12px; margin: 20px 0;">
                        ${ghostCode}
                    </div>
                    <p style="font-size: 14px; opacity: 0.7;">Enter this in the app to verify your vibe.</p>
                </div>
            `,
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
    
