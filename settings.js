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
    
        // 5. STORAGE LOGIC (Line 94)
    window.openStorage = () => {
        // Grab the current saved limit so we can highlight it
        const currentLimit = localStorage.getItem('chat_vanish_limit') || 720;

        const storageHTML = `
            <div class="ghost-modal-tile large-tile">
                <div class="modal-header">Storage Timer</div>
                <div class="storage-options">
                    <div class="time-tile ${currentLimit == 24 ? 'active-tile' : ''}" onclick="setPurge(24)">24 Hours</div>
                    <div class="time-tile ${currentLimit == 168 ? 'active-tile' : ''}" onclick="setPurge(168)">7 Days</div>
                    <div class="time-tile ${currentLimit == 720 ? 'active-tile' : ''}" onclick="setPurge(720)">30 Days</div>
                </div>
                <div class="soft-red-warning">
                    ⚠️ Messages are permanently deleted from the database every 30-day cycle.
                </div>
                <button class="metamorphism-green-btn" onclick="closeModal()">Close</button>
            </div>
        `;
        showGlobalModal(storageHTML);
    };

 // 1. THE TRIGGER (What happens when you click a time tile)
window.setPurge = (hours) => {
    let confirmOverlay = document.getElementById('purge-confirm-overlay');
    if (!confirmOverlay) {
        confirmOverlay = document.createElement('div');
        confirmOverlay.id = 'purge-confirm-overlay';
        confirmOverlay.className = 'ghost-modal-overlay';
        confirmOverlay.style.zIndex = "3000";
        document.body.appendChild(confirmOverlay);
    }

    confirmOverlay.style.display = 'flex';
    confirmOverlay.innerHTML = `
        <div class="ghost-modal-tile" style="max-width: 320px; border: 1px solid rgba(255,255,255,0.1); background: rgba(15,15,15,0.9); backdrop-filter: blur(25px); padding: 25px; border-radius: 25px;">
            <div style="font-weight: 800; font-size: 14px; color: #FFFFFF; opacity: 0.6; margin-bottom: 15px; text-align: left; letter-spacing: 1px;">
                Just•Abacha😎
            </div>

            <p style="color: white; font-size: 16px; line-height: 1.5; text-align: left; margin-bottom: 25px; font-weight: 500;">
                Confirming the Ghost Protocol. Messages will vanish after <b>${hours === 720 ? '30 Days' : hours + ' Hours'}</b>.
            </p>

            <div style="display: flex; gap: 10px; width: 100%;">
                <button onclick="window.executePurgeSetting(${hours})" style="flex: 1; background: rgba(255, 69, 58, 0.15); color: #FF453A; border: 1px solid rgba(255, 69, 58, 0.3); padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 14px;">
                    Confirm
                </button>
                <button onclick="document.getElementById('purge-confirm-overlay').style.display='none'" style="flex: 1; background: rgba(50, 215, 75, 0.15); color: #32D74B; border: 1px solid rgba(50, 215, 75, 0.3); padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 14px;">
                    Cancel
                </button>
            </div>
        </div>
    `;
};

// 2. THE EXECUTION (What happens when you hit Red Confirm)
window.executePurgeSetting = (hours) => {
    // Save to memory for chat.js [cite: 3, 2026-01-25]
    localStorage.setItem('chat_vanish_limit', hours); 
    
    // UI Cleanup
    const overlay = document.getElementById('purge-confirm-overlay');
    if(overlay) overlay.style.display = 'none';
    
    // Close the original storage menu
    window.closeModal(); 
    
    // Small feedback so you know it worked
    console.log("Setting locked: " + hours + "hrs");
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
        
