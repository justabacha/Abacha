document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

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
            document.getElementById('profile-avatar-preview').style.backgroundSize = 'cover';
        }
    }

    // 2. INSTANT IMAGE PREVIEW
    document.getElementById('avatar-input').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('profile-avatar-preview');
                preview.style.backgroundImage = `url(${e.target.result})`;
                preview.style.backgroundSize = 'cover';
            };
            reader.readAsDataURL(file);
        }
    });
});

// --- CUSTOM MODAL LOGIC ---
const showSuccessModal = () => {
    const modalHTML = `
        <div class="ghost-modal-overlay" id="success-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(10px);">
            <div class="metamorphism-card" style="background:rgba(255,255,255,0.05); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.1); border-radius:25px; padding:25px; width:280px; text-align:center;">
                <div style="font-size:10px; color:gray; margin-bottom:15px; text-align:left;">|Just•Abacha😎|</div>
                <p style="color:white; font-size:18px; margin-bottom:20px; font-weight:500;">Identity locked up in ghost layer 🔏</p>
                <button onclick="closeSuccessModal()" style="width:100%; padding:15px; background:#007AFF; border:none; border-radius:15px; color:white; font-weight:bold; cursor:pointer;">vibe 😎</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.closeSuccessModal = () => {
    const modal = document.getElementById('success-modal');
    if(modal) modal.remove();
    
    // BACK PROTOCOL: If they came straight from the Hub (new user), go back to Hub.
    // If they came from Settings, go back to Settings.
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
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Syncing...";
    saveBtn.disabled = true;

    try {
        // --- AVATAR UPLOAD LOGIC ---
        if (avatarFile) {
            // Optional: Delete old one logic can go here
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(fileName, avatarFile);

            if (!uploadError) {
                const { data } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
                avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
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
        
        showSuccessModal();
        
    } catch (err) {
        // Use your ghostPrompt here if app.js is loaded, otherwise alert
        if (typeof ghostPrompt === "function") {
            ghostPrompt("Sync Error: " + err.message, "error");
        } else {
            alert("Sync Error: " + err.message);
        }
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
};
        
