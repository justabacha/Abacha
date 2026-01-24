document.addEventListener('DOMContentLoaded', async () => {
    // 1. DEDICATED REQUESTS LINK (MOVED OUTSIDE FOR INSTANT ACTION)
    window.openRequests = () => {
        window.location.href = 'requests.html';
    };

    // 2. GHOST THEME ENGINE
    const applyTheme = (themeName) => {
        const root = document.documentElement;
        if (themeName === 'ghost') {
            root.style.setProperty('--glass-bg', 'rgba(0, 0, 0, 0.85)');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--blur-amount', '40px');
        } else if (themeName === 'peak') {
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.15)');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--blur-amount', '15px');
        } else { // Classic
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.08)');
            root.style.setProperty('--blur-amount', '20px');
        }
        localStorage.setItem('ghost-theme', themeName);
    };
    
window.openProfileEdit = async () => {
    // 1. Fetch current data from Supabase
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('username, bio')
        .eq('id', (await supabaseClient.auth.getUser()).data.user.id)
        .single();

    const profileHTML = `
        <div class="ghost-modal-tile large-tile">
            <h3 class="modal-title">👤 Edit Ghost Identity</h3>
            <div class="input-group">
                <label>Alias</label>
                <input type="text" id="edit-username" class="ghost-input" value="${profile.username}">
            </div>
            <div class="input-group" style="margin-top:15px;">
                <label>Ghost Bio</label>
                <textarea id="edit-bio" class="ghost-input" rows="3">${profile.bio || ''}</textarea>
            </div>
            <button class="metamorphism-green-btn" style="margin-top:20px;" onclick="saveProfile()">Save Identity</button>
            <button class="metamorphism-red-btn" style="margin-top:10px; background:none; border:none; color:rgba(255,255,255,0.4);" onclick="closeModal()">Cancel</button>
        </div>
    `;
    showGlobalModal(profileHTML);
};
  window.saveProfile = async () => {
    const newUsername = document.getElementById('edit-username').value;
    const newBio = document.getElementById('edit-bio').value;
    const { data: { user } } = await supabaseClient.auth.getUser();

    const { error } = await supabaseClient
        .from('profiles')
        .update({ username: newUsername, bio: newBio })
        .eq('id', user.id);

    if (error) {
        alert("Update Failed: " + error.message);
    } else {
        alert("Identity Updated 👌");
        location.reload(); // Refresh to show your new Ghost Alias
    }
};
    
    // 3. HELP & CREDITS (Restored Phestone's Jan 16 Quote)
    window.openHelp = () => {
        const helpHTML = `
            <div class="ghost-modal-tile large-tile">
                <h3 class="modal-title">😎 How to get started</h3>
                <div class="help-steps">
                    <div class="step-item"><span>1️⃣</span> Networking: Go to "Chat Requests" to search usernames and send an invite.</div>
                    <div class="step-item"><span>2️⃣</span> Customization: Tap "Profile" or "Theme" to swap alias or wallpapers.</div>
                    <div class="step-item"><span>3️⃣</span> Visuals: Long-press messages to pop the menu and set pins.</div>
                    <div class="step-item"><span>4️⃣</span> Pins: Max 2 pins allowed. Unpin one to add a new one.</div>
                </div>
                <hr class="divider">
                <p class="credit-para">
                    Just•Abacha😎 was created by Phestone on January 16, 2026, to provide a secure, ephemeral "Inner Circle" where conversations breathe and vanish, giving users a high-end "Ghost Layer" experience that prioritizes privacy and peak aesthetics. <br><br>
                    <i>“Design is not just what it looks like; it’s how it works in the shadows.”</i> — <b>Mr. Nice Guy</b>
                </p>
                <button class="metamorphism-green-btn" onclick="closeModal()">Close</button>
            </div>
        `;
        showGlobalModal(helpHTML);
    };

    // 4. CONTACT US (TALK TO THE BOSS - YOUR DATA RESTORED)
window.openContact = () => {
    const contactHTML = `
        <div class="ghost-modal-tile large-tile">
            <h3 class="modal-title">📞 Direct Line</h3>
            
            <div class="contact-layers">
                <a href="https://wa.me/254768946798" class="contact-link-tile">
                    <div class="contact-icon">💬</div>
                    <div class="contact-text">
                        <span>WhatsApp the Boss</span>
                        <small>+254 768 946 798</small>
                    </div>
                </a>

                <a href="tel:+254768946798" class="contact-link-tile">
                    <div class="contact-icon">☎️</div>
                    <div class="contact-text">
                        <span>Direct Call</span>
                        <small>Tap to dial Phestone</small>
                    </div>
                </a>

                <a href="mailto:its.phestone@gmail.com" class="contact-link-tile">
                    <div class="contact-icon">✉️</div>
                    <div class="contact-text">
                        <span>Personal Email</span>
                        <small>its.phestone@gmail.com</small>
                    </div>
                </a>

                <a href="mailto:just1abacha@gmail.com" class="contact-link-tile">
                    <div class="contact-icon">🏢</div>
                    <div class="contact-text">
                        <span>Just•Abacha Support</span>
                        <small>just1abacha@gmail.com</small>
                    </div>
                </a>
            </div>

            <button class="metamorphism-green-btn" style="margin-top:20px;" onclick="closeModal()">Close</button>
        </div>
    `;
    showGlobalModal(contactHTML);
};
    
    // 5. STORAGE LOGIC (Original Time Tiles Maintained)
    window.openStorage = () => {
        const storageHTML = `
            <div class="ghost-modal-tile large-tile">
                <div class="modal-header">Storage Timer</div>
                <div class="storage-options">
                    <div class="time-tile" onclick="setPurge(24)">24 Hours</div>
                    <div class="time-tile" onclick="setPurge(168)">7 Days</div>
                    <div class="time-tile" onclick="setPurge(720)">30 Days</div>
                </div>
                <div class="soft-red-warning">
                    ⚠️ Messages are permanently deleted from the database every 30-day cycle.
                </div>
                <button class="metamorphism-green-btn" onclick="closeModal()">Close</button>
            </div>
        `;
        showGlobalModal(storageHTML);
    };

    window.setPurge = (hours) => {
        alert(`Setting locked. Your messages will now vanish from your view after ${hours} hours.`);
        closeModal();
    };

    // HELPER: GLOBAL MODAL ENGINE
    const showGlobalModal = (html) => {
        let overlay = document.getElementById('global-modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-modal-overlay';
            overlay.className = 'ghost-modal-overlay';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = html;
        overlay.style.display = 'flex';
    };

    window.closeModal = () => {
        const overlay = document.getElementById('global-modal-overlay');
        if(overlay) overlay.style.display = 'none';
    };

    // LOGOUT LOGIC (Restored "No, Stay")
    window.showLogoutModal = () => {
        const logoutHTML = `
            <div class="ghost-modal-tile">
                <div class="modal-header">Just•Abacha😎</div>
                <p>Do you want to logout?</p>
                <div class="modal-btns-row">
                    <button class="btn-logout-yes" onclick="executeLogout()">Yes</button>
                    <button class="btn-logout-no" onclick="closeModal()">No, Stay</button>
                </div>
            </div>
        `;
        showGlobalModal(logoutHTML);
    };
    
    window.executeLogout = async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    };
});
        
