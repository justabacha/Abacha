// --- 1. HANDLE IMAGE SELECTION & PREVIEW ---
document.getElementById('avatar-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        // Show instant preview
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('profile-avatar-preview').style.backgroundImage = `url(${event.target.result})`;
        };
        reader.readAsDataURL(file);
    }
});

// --- 2. THE BIG SAVE (Identity & Image) ---
window.saveGhostProfile = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const avatarFile = document.getElementById('avatar-input').files[0];
    let avatarUrl = null;

    // A. Upload Avatar to Storage if selected
    if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabaseClient.storage
            .from('avatars')
            .upload(fileName, avatarFile);

        if (!uploadError) {
            const { data } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
            avatarUrl = data.publicUrl;
        }
    }

    // B. Push all 5 tabs to Profiles Table
    const updates = {
        username: document.getElementById('username-input').value,
        bio: document.getElementById('status-input').value, // Status
        favourite_user: document.getElementById('fav-input').value, // Favourite
        city: document.getElementById('city-input').value, // City
        phone: document.getElementById('phone-input').value, // Contact
        avatar_url: avatarUrl || undefined,
        updated_at: new Date()
    };

    const { error } = await supabaseClient.from('profiles').upsert(updates).eq('id', user.id);

    if (error) alert("Ghost Sync Failed 😞");
    else alert("Identity Locked in the Ghost Layer 👌");
};
        
