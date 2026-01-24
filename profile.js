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
    window.location.href = 'settings.html'; 
};

// 3. THE BIG SAVE FUNCTION
window.saveGhostProfile = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const avatarFile = document.getElementById('avatar-input').files[0];
    let avatarUrl = null;

    const saveBtn = document.querySelector('.lock-identity-btn');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Syncing...";
    saveBtn.disabled = true;

    try {
        // --- AUTO-DELETE OLD AVATAR LOGIC ---
        if (avatarFile) {
            const { data: oldProfile } = await supabaseClient.from('profiles').select('avatar_url').eq('id', user.id).single();
            if (oldProfile?.avatar_url) {
                const oldFileName = oldProfile.avatar_url.split('/').pop().split('?')[0]; // Clean URL
                await supabaseClient.storage.from('avatars').remove([`${user.id}/${oldFileName}`]);
            }

            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`; // Added folder path
            const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(fileName, avatarFile);

            if (!uploadError) {
                const { data } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
                avatarUrl = `${data.publicUrl}?v=${Date.now()}`; // Added Cache Buster
            }
        }

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
        
        // REPLACED ALERT WITH CUSTOM MODAL
        showSuccessModal();
        
    } catch (err) {
        alert("Sync Error: " + err.message);
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
};
        
