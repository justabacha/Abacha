document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. NAVIGATION (Independent from Help)
    window.openRequests = () => {
        window.location.href = 'requests.html';
    };

    // 2. THEME ENGINE
    window.applyTheme = (themeName) => {
        const root = document.documentElement;
        if (themeName === 'ghost') {
            root.style.setProperty('--glass-bg', 'rgba(0, 0, 0, 0.85)');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--blur-amount', '40px');
        } else if (themeName === 'peak') {
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.15)');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--blur-amount', '15px');
        } else {
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.08)');
            root.style.setProperty('--blur-amount', '20px');
        }
        localStorage.setItem('ghost-theme', themeName);
    };

    // 3. MODAL ENGINE
    window.openHelp = () => {
        const helpHTML = `
            <div class="ghost-modal-tile large-tile">
                <h3 class="modal-title">😎 How to get started</h3>
                <div class="help-steps">
                    <div class="step-item"><span>1️⃣</span> Networking: Go to "Chat Requests" to search usernames.</div>
                    <div class="step-item"><span>2️⃣</span> Customization: Tap "Profile" or "Theme" to swap wallpapers.</div>
                    <div class="step-item"><span>3️⃣</span> Visuals: Long-press messages to pop the menu.</div>
                </div>
                <hr class="divider">
                <p class="credit-para">Just•Abacha😎 was created by Phestone on Jan 16, 2026. <br><i>“Design is not just what it looks like; it’s how it works in the shadows.”</i></p>
                <button class="metamorphism-green-btn" onclick="closeModal()">Close</button>
            </div>
        `;
        showGlobalModal(helpHTML);
    };

    window.openContact = () => {
        const contactHTML = `<div class="ghost-modal-tile"><div class="modal-header">Talk to the Boss</div><p>WhatsApp: +254768946798<br>Email: its.phestone@gmail.com</p><button class="metamorphism-green-btn" onclick="closeModal()">Back</button></div>`;
        showGlobalModal(contactHTML);
    };

    window.showGlobalModal = (html) => {
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

    window.showLogoutModal = () => {
        const logoutHTML = `<div class="ghost-modal-tile"><p>Do you want to logout?</p><div class="modal-btns-row"><button class="btn-logout-yes" onclick="executeLogout()">Yes</button><button class="btn-logout-no" onclick="closeModal()">No</button></div></div>`;
        showGlobalModal(logoutHTML);
    };
    
    window.executeLogout = async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    };
});
            
