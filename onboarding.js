const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null; // Stored globally so the vibe function can use it

document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. REAL AUTHENTICATION ---
    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
    currentUser = authData?.user;

    if (!currentUser || authError) {
        console.error("Ghost Layer Access Denied: No session found.");
        window.location.href = 'index.html'; // Kick 'em to login if they aren't real
        return;
    }

    console.log("👻 Ghost Engine: Real Mode Active for", currentUser.email);

    // --- 2. LOAD EXISTING PROFILE ---
    const { data: profile } = await supabaseClient.from('profiles').select('avatar_url, username').eq('id', currentUser.id).single();
    if (profile && profile.avatar_url) {
        document.getElementById('avatar-preview').innerHTML = `<img src="${profile.avatar_url}" style="width:100%; height:100%; object-fit:cover;">`;
    }

    // Pre-fill username safely
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        if (profile && profile.username) {
            usernameInput.value = profile.username;
        } else if (currentUser.email) {
            usernameInput.value = currentUser.email.split('@')[0];
        }
    }

    // --- 3. IMAGE PREVIEW ---
    document.getElementById('avatar-input').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = document.getElementById('avatar-preview');
                preview.innerHTML = `<img src="${ev.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
            };
            reader.readAsDataURL(file);
        }
    };

    // --- 4. SAVE IDENTITY & CLEVER UPLOAD ---
    document.getElementById('save-identity').onclick = async () => {
        const inputs = document.querySelectorAll('.must-fill');
        let isValid = true;

        const phoneVal = document.getElementById('phone').value;
        const kePhoneRegex = /^\+254(7|1)\d{8}$/;

        inputs.forEach(input => {
            if (!input.value || (input.id === 'phone' && !kePhoneRegex.test(phoneVal))) {
                input.classList.add('error-blink');
                setTimeout(() => input.classList.remove('error-blink'), 2000);
                isValid = false;
            }
        });

        if (!isValid) return;

        const btn = document.getElementById('save-identity');
        btn.innerText = "Syncing...";

        let avatarUrl = profile?.avatar_url || null; // Keep old URL if no new file
        const file = document.getElementById('avatar-input').files[0];
        
        if (file) {
            // The Clever Fix: Dynamic extension + Timestamp to break cache
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileName = `${currentUser.id}_avatar_${Date.now()}.${fileExt}`; 
            
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(fileName, file, { 
                    upsert: true,
                    contentType: file.type // Tells DB exactly if it's PNG or JPG
                });

            if (uploadError) {
                console.error("Upload Failed:", uploadError.message);
            } else {
                const { data: publicUrl } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
                avatarUrl = publicUrl.publicUrl;
            }
        }

        // Update Profiles
        const { error } = await supabaseClient.from('profiles').update({
            username: document.getElementById('username').value,
            phone: phoneVal,
            city: document.getElementById('city').value,
            bio: document.getElementById('bio').value,
            avatar_url: avatarUrl,
            is_approved: true
        }).eq('id', currentUser.id);

        if (error) {
            console.error("Profile Update Failed:", error.message);
            btn.innerText = "Try Again"; 
            alert("Error: " + error.message);
        } else {
            document.getElementById('step-1').classList.remove('active');
            document.getElementById('step-2').classList.add('active');
        }
    };

    // --- 5. SUGGESTIONS & VIBES ---
    const suggModal = document.getElementById('suggestions-modal');
    const suggList = document.getElementById('suggestions-list');

    document.getElementById('view-suggestions').onclick = async () => {
        suggModal.classList.add('active');
        suggList.innerHTML = '<p class="loading-text">Scanning the layer...</p>';

        const { data: ghosts, error } = await supabaseClient
            .from('profiles')
            .select('id, username, avatar_url, city')
            .neq('id', currentUser.id)
            .limit(5);

        if (error || !ghosts.length) {
            suggList.innerHTML = '<p class="loading-text">No ghosts nearby yet...</p>';
            return;
        }

        suggList.innerHTML = ghosts.map(ghost => `
            <div class="suggestion-item">
                <img src="${ghost.avatar_url || 'https://zvkretqhqmxuhgspddpu.supabase.co/storage/v1/object/public/avatars/default.png'}" class="sugg-avatar">
                <div class="sugg-info">
                    <span class="sugg-name">@${ghost.username}</span>
                    <span class="sugg-city">${ghost.city || 'Ghost Layer'}</span>
                </div>
                <button class="vibe-btn" onclick="sendOnboardingVibe('${ghost.id}', this)">Vibe</button>
            </div>
        `).join('');
    };

    document.getElementById('close-suggestions').onclick = () => {
        suggModal.classList.remove('active');
    };

    // --- 6. NAVIGATION ---
    const nextToCredits = document.getElementById('next-to-credits');
    if (nextToCredits) {
        nextToCredits.onclick = () => {
            document.getElementById('step-2').classList.remove('active');
            document.getElementById('step-3').classList.add('active');
            window.scrollTo(0,0);
        };
    }

    document.getElementById('skip-to-end').onclick = () => {
        document.getElementById('step-2').classList.remove('active');
        document.getElementById('step-3').classList.add('active');
        window.scrollTo(0,0);
    };

    document.getElementById('enter-hub').onclick = () => {
        window.location.href = 'hub.html';
    };
});

// GLOBAL VIBE FUNCTION
window.sendOnboardingVibe = async (targetId, btn) => {
    if (btn.disabled || !currentUser) return;
    
    btn.disabled = true;
    btn.innerText = "Syncing...";

    const { data, error } = await supabaseClient
        .from('friendships')
        .insert([
            { 
                sender_id: currentUser.id, 
                receiver_id: targetId, 
                status: 'pending' 
            }
        ])
        .select();

    if (error) {
        console.error("Vibe Failed:", error);
        btn.innerText = error.code === '23505' ? "Already Sent" : "Auth Error";
        btn.style.opacity = "0.6";
    } else {
        btn.innerText = "Vibing 🤓";
        btn.style.background = "var(--ghost-green)";
        btn.style.color = "white";
    }
};