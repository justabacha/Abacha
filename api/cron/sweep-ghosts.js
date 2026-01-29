import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // 🚨 Security: Only Vercel or You should be able to trigger this
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(
        process.env.SUPABASE_URL, 
        process.env.SUPABASE_SERVICE_ROLE_KEY // Needs admin power to delete
    );

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 1. Find the ghosts that didn't vibe in time
        const { data: expiredProfiles, error: fetchError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('is_approved', false)
            .lt('otp_created_at', twentyFourHoursAgo);

        if (fetchError) throw fetchError;

        if (expiredProfiles.length === 0) {
            return res.status(200).json({ message: 'No ghost dust to sweep today! 🧹' });
        }

        const userIds = expiredProfiles.map(p => p.id);

        // 2. Delete from Auth (The hard part)
        for (const id of userIds) {
            await supabase.auth.admin.deleteUser(id);
        }

        // 3. Profiles usually delete automatically if you have "On Delete Cascade"
        // but let's be safe:
        await supabase.from('profiles').delete().in('id', userIds);

        return res.status(200).json({ success: true, swept: userIds.length });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
  
