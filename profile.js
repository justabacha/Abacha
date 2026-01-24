document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Load current data
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('username, bio')
        .eq('id', user.id)
        .single();

    if (profile) {
        document.getElementById('username-input').value = profile.username;
        document.getElementById('bio-input').value = profile.bio || '';
    }
});

window.saveGhostProfile = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const username = document.getElementById('username-input').value;
    const bio = document.getElementById('bio-input').value;

    const { error } = await supabaseClient
        .from('profiles')
        .update({ username, bio })
        .eq('id', user.id);

    if (error) alert("Sync Error: " + error.message);
    else alert("Identity Synced to Ghost Layer 👌");
};
