import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = req.body;
    // Use the SERVICE ROLE KEY here to bypass RLS
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Generate Ghost Code
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const ghostCode = `JA-${randomDigits}-ABA`;

    try {
        // 2. Find the User ID from the Auth table first
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        const user = userData.users.find(u => u.email === email);

        if (!user) throw new Error("User not found in Auth system");

        // 3. Save code using UPSERT with the ID
        const { error: dbError } = await supabase
            .from('profiles')
            .upsert({ 
                id: user.id, // Linking the ID is the key!
                email: email, 
                otp_code: ghostCode, 
                otp_created_at: new Date().toISOString() 
            }, { onConflict: 'id' });

        if (dbError) throw dbError;

        // 4. Setup Gmail Transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // 5. Send the Email
        await transporter.sendMail({
            from: `"Just•Abacha😎 Ghost Engine" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `|Just•Abacha😎| Your Ghost Access Code: ${ghostCode}`,
            html: `
                <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; text-align: center; border-radius: 20px; border: 1px solid #333;">
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
        console.error("GHOST ENGINE ERROR:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
