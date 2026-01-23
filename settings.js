document.addEventListener('DOMContentLoaded', async () => {
    // 1. GHOST THEME ENGINE
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

    // 2. HELP & CREDITS MODAL CONTENT
    window.openHelp = () => {
        const helpHTML = `
            <div class="ghost-modal-tile" style="width: 85vw; max-height: 80vh; overflow-y: auto;">
                <h3 style="color: #32D74B;">😎 How to get started</h3>
                <ul style="font-size: 13px; line-height: 1.6; padding-left: 20px;">
                    <li><b>Networking:</b> Go to "Chat Requests" to search usernames and send an invite.</li>
                    <li><b>Customization:</b> Tap "Profile" or "Theme" to swap alias or wallpapers.</li>
                    <li><b>Visuals:</b> Long-press messages to pop the menu and set pins.</li>
                    <li><b>Pins:</b> Max 2 pins allowed. Unpin one to add a new one.</li>
                </ul>
                <hr style="opacity: 0.1; margin: 20px 0;">
                <p style="font-size: 12px; opacity: 0.9;">
                    <b>Just•Abacha😎</b> was created by <b>Phestone</b> on January 16, 2026.<br><br>
                    <b>Purpose:</b> To provide a secure, ephemeral "Inner Circle" where conversations breathe and vanish.<br><br>
                    <i>“Design is not just what it looks like; it’s how it works in the shadows.”</i> — <b>Mr. Nice Guy</b>
                </p>
                <button class="modal-btn btn-no" onclick="closeModal()" style="width: 100%; margin-top: 10px;">Close</button>
            </div>
        `;
        showGlobalModal(helpHTML);
    };

    // 3. CONTACT US (TALK TO THE BOSS)
    window.openContact = () => {
        const contactHTML = `
            <div class="ghost-modal-tile">
                <div class="modal-header">Talk to the Boss</div>
                <p style="font-size: 14px;">WhatsApp: +254768946798<br>Email: its.phestone@gmail.com</p>
                <div class="modal-header" style="margin-top:20px;">Directline Just•Abacha</div>
                <p style="font-size: 14px;">Email: just1abacha@gmail.com</p>
                <button class="modal-btn btn-no" onclick="closeModal()" style="width: 100%; margin-top: 15px;">Back</button>
            </div>
        `;
        showGlobalModal(contactHTML);
    };

    // 4. STORAGE LOGIC
    window.openStorage = () => {
        const storageHTML = `
            <div class="ghost-modal-tile">
                <div class="modal-header">Storage Timer</div>
                <div class="pin-options-list">
                    <div class="pin-opt" onclick="setPurge(24)">24 Hours</div>
                    <div class="pin-opt" onclick="setPurge(168)">7 Days</div>
                    <div class="pin-opt" onclick="setPurge(720)">30 Days</div>
                </div>
                <p style="color: #FF3B30; font-size: 10px; margin-top: 20px; text-align: center; font-weight: bold;">
                    🚨 Messages are permanently deleted from the database every 30-day cycle.
                </p>
                <button class="modal-btn btn-no" onclick="closeModal()" style="width: 100%; margin-top: 10px;">Close</button>
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
        document.getElementById('global-modal-overlay').style.display = 'none';
    };

    // LOGOUT LOGIC
    window.showLogoutModal = () => { document.getElementById('logout-modal').style.display = 'flex'; };
    window.closeLogoutModal = () => { document.getElementById('logout-modal').style.display = 'none'; };
    window.executeLogout = async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    };
});
