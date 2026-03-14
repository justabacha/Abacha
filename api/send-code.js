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
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 30px; border-radius: 24px; max-width: 500px; margin: auto; border: 1px solid #1a1a1a;">
                    <div style="color: #888; font-weight: 900; font-size: 14px; margin-bottom: 25px; text-align: left;">|Just•Abacha😎|</div>
                    
                    <p style="font-size: 16px; line-height: 1.5; color: #ffffff;">
                        Dear <strong>${email.split('@')[0]}</strong>,<br><br>
                        This is to inform you that we have received your Email ID verification request on <strong>Vibe</strong>.<br>
                        Use the following OTP for further proceeding:
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background: #111; border: 1px solid #32D74B; color: #32D74B; font-size: 20px; font-weight: 900; padding: 20px; display: inline-block; border-radius: 16px; letter-spacing: 1px; user-select: all; -webkit-user-select: all;">
                            ${ghostCode}
                        </div>
                        <p style="font-size: 12px; color: #32D74B; margin-top: 10px; font-weight: bold; opacity: 0.8;">long press to copy</p>
                    </div>
                    <div style="margin: 25px 0;">
                        <a href="${process.env.APP_URL || 'https://abacha-smoky.vercel.app'}" 
                           style="background: #ffffff; color: #000000; padding: 14px 30px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(255,255,255,0.1);">
                           Verify Now
                        </a>
                    </div>

                    <p style="font-size: 14px; color: #888; line-height: 1.5;">
                        Please note that this OTP will expire after <strong>24 Hours</strong>.<br><br>
                        If you have NOT made any request, kindly ignore this email or contact Just•Abacha Support Service Centre at:
                    </p>

                    <div style="background: #111; padding: 15px; border-radius: 12px; margin-top: 20px; text-align: left;">
                        <div style="margin-bottom: 10px;">
                            <a href="mailto:just1abacha@gmail.com" style="color: #007AFF; text-decoration: none; font-size: 14px; display: block;">📧 Email: just1abacha@gmail.com</a>
                        </div>
                        <div>
                            <a href="https://wa.me/254768946798" style="color: #32D74B; text-decoration: none; font-size: 14px; display: block;">💬 WhatsApp: +254768946798</a>
                        </div>
                    </div>

                    <div style="margin-top: 35px; border-top: 1px solid #1a1a1a; padding-top: 20px; font-size: 13px; color: #555;">
                        Thank You.<br>
                        Regards,<br>
                        <strong style="color: #fff;">Phestone O.</strong><br>
                        Just•Abacha CEO.
                    </div>
                </div>
            `,
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("GHOST ENGINE ERROR:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
