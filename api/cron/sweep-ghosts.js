import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const authHeader = req.headers['authorization']; 
    
    // 🛡️ Security Check
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized: Ghost access only.' });
    }

    // 🔑 Using the Service Role Key from your Vault
    const supabase = createClient(
        process.env.SUPABASE_URL, 
        process.env.SUPABASE_SERVICE_ROLE_KEY 
    );

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 1. Fetch unverified ghosts older than 24h
        const { data: expiredProfiles, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('is_approved', false)
            .lt('otp_created_at', twentyFourHoursAgo);

        if (fetchError) throw fetchError;
        if (!expiredProfiles || expiredProfiles.length === 0) {
            return res.status(200).json({ message: 'No ghost dust to sweep today! 🧹' });
        }

        const userIds = expiredProfiles.map(p => p.id);

        // 2. Wipe them from the Auth system (Service Role required here)
        for (const id of userIds) {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
            if (deleteError) console.error(`Failed to delete ghost ${id}:`, deleteError.message);
        }

        return res.status(200).json({ 
            success: true, 
            message: `Cleared ${userIds.length} unverified ghosts from the engine.` 
        });

    } catch (error) {
        console.error("Sweeper Crash:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
