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

// --- CUSTOM MODAL LOGIC ---
const showSuccessModal = () => {
    const modalHTML = `
        <div class="ghost-modal-overlay" id="success-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(5px);">
            <div class="metamorphism-card" style="background:rgba(255,255,255,0.05); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.1); border-radius:25px; padding:25px; width:280px; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                <div class="modal-header-mini" style="font-size:12px; color:rgba(255,255,255,0.5); margin-bottom:15px; font-weight:bold;">Just•Abacha😎</div>
                <div class="modal-body-ghost">
                    <p style="color:white; font-size:18px; margin-bottom:20px; font-weight:500;">Identity locked up in ghost layer 🔏</p>
                    <button class="vibe-btn" onclick="closeSuccessModal()" style="width:100%; padding:15px; background:#007AFF; border:none; border-radius:15px; color:white; font-weight:bold; cursor:pointer; box-shadow: 0 5px 15px rgba(0,122,255,0.3);">vibe 😎</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.closeSuccessModal = () => {
    const modal = document.getElementById('success-modal');
    if(modal) modal.remove();
    
    // BACK PROTOCOL: Go to hub if we just set up, otherwise settings
    if (document.referrer.includes('settings.html')) {
        window.location.href = 'settings.html';
    } else {
        window.location.href = 'hub.html';
    }
};
// 3. THE BIG SAVE FUNCTION
window.saveGhostProfile = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const avatarFile = document.getElementById('avatar-input').files[0];
    let avatarUrl = null;

    const saveBtn = document.querySelector('.lock-identity-btn');
    saveBtn.innerText = "Syncing...";
    saveBtn.disabled = true;

    try {
        // --- 1. AUTO-DELETE OLD AVATAR ---
        if (avatarFile) {
            // Fetch current profile to find the old image path
            const { data: oldProfile } = await supabaseClient
                .from('profiles')
                .select('avatar_url')
                .eq('id', user.id)
                .single();

            if (oldProfile?.avatar_url) {
                try {
                    // Extract filename from URL (e.g., "12345/image.png")
                    const urlParts = oldProfile.avatar_url.split('/avatars/');
                    if (urlParts.length > 1) {
                        const filePath = urlParts[1].split('?')[0]; // Remove cache buster ?v=...
                        await supabaseClient.storage.from('avatars').remove([filePath]);
                        console.log("🗑️ Old Ghost Identity purged.");
                    }
                } catch (purgeError) {
                    console.error("Purge failed (might be first upload):", purgeError);
                }
            }

            // --- 2. UPLOAD NEW AVATAR ---
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(fileName, avatarFile);

            if (uploadError) throw uploadError;

            const { data } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
            avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
        }

        // --- 3. DATABASE UPDATE ---
        const updates = {
            username: document.getElementById('username-input').value.trim(),
            bio: document.getElementById('status-input').value.trim(),
            favourite_user: document.getElementById('fav-input').value.trim(),
            city: document.getElementById('city-input').value,
            phone: document.getElementById('phone-input').value.trim(),
            updated_at: new Date()
        };

        if (avatarUrl) updates.avatar_url = avatarUrl;

        const { error } = await supabaseClient.from('profiles').update(updates).eq('id', user.id);
        if (error) throw error;

        // Force Hub/Settings refresh
        localStorage.setItem('ghost_identity_updated', Date.now());
        showSuccessModal();
        
    } catch (err) {
        alert("Sync Error: " + err.message);
    } finally {
        saveBtn.innerText = "Update Identity 👌";
        saveBtn.disabled = false;
    }
};
        
