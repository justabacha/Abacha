document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // 1. INITIAL DATA LOAD
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile) {
        document.getElementById('username-input').value = profile.username || '';
        document.getElementById('status-input').value = profile.bio || '';
        document.getElementById('fav-input').value = profile.favourite_user || '';
        document.getElementById('city-input').value = profile.city || 'Nairobi';
        document.getElementById('phone-input').value = profile.phone || '';
        
        if (profile.avatar_url) {
            document.getElementById('profile-avatar-preview').style.backgroundImage = `url(${profile.avatar_url})`;
        }
    }

    // 2. INSTANT IMAGE PREVIEW
    document.getElementById('avatar-input').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('profile-avatar-preview').style.backgroundImage = `url(${e.target.result})`;
            };
            reader.readAsDataURL(file);
        }
    });
});

// 3. THE BIG SAVE FUNCTION
window.saveGhostProfile = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const avatarFile = document.getElementById('avatar-input').files[0];
    let avatarUrl = null;

    // Show loading state on button
    const saveBtn = document.querySelector('.lock-identity-btn');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Syncing...";
    saveBtn.disabled = true;

    try {
        // Upload Avatar if a new one was selected
        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(fileName, avatarFile);

            if (!uploadError) {
                const { data } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
                avatarUrl = data.publicUrl;
            }
        }

        // Prepare the updates
        const updates = {
            username: document.getElementById('username-input').value,
            bio: document.getElementById('status-input').value,
            favourite_user: document.getElementById('fav-input').value,
            city: document.getElementById('city-input').value,
            phone: document.getElementById('phone-input').value,
            updated_at: new Date()
        };

        if (avatarUrl) updates.avatar_url = avatarUrl;

        const { error } = await supabaseClient.from('profiles').update(updates).eq('id', user.id);

        if (error) throw error;
        alert("Identity Locked in the Ghost Layer 👌");
        
    } catch (err) {
        alert("Sync Error: " + err.message);
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
};
    
