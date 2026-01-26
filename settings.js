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

    function openThemePanel() {
    document.getElementById('theme-panel').style.display = 'block';
}

function closeThemePanel() {
    document.getElementById('theme-panel').style.display = 'none';
}
    
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
    // 1. Clean up old ones
    const oldOverlay = document.getElementById('purge-confirm-overlay');
    if (oldOverlay) oldOverlay.remove();

    // 2. Create overlay
    const confirmOverlay = document.createElement('div');
    confirmOverlay.id = 'purge-confirm-overlay';
    
    // 3. FORCE IT TO THE FRONT (Style bypass)
    Object.assign(confirmOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(20px)',
        webkitBackdropFilter: 'blur(20px)', // Support for Safari/iOS
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '999999' // Extreme z-index to stay on top
    });

    confirmOverlay.innerHTML = `
        <div class="ghost-modal-tile" style="width: 85%; max-width: 320px; border: 1px solid rgba(255,255,255,0.1); padding: 25px; border-radius: 25px; background: #0a0a0a; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <div style="font-weight: 800; font-size: 14px; color: #FFFFFF; opacity: 0.6; margin-bottom: 20px; text-align: left;">
                Just•Abacha😎
            </div>

            <p style="color: white; font-size: 16px; text-align: left; margin-bottom: 30px; line-height: 1.4;">
                Confirming the Ghost Protocol. Messages will vanish after <b>${hours} Hours</b>.
            </p>

            <div style="display: flex; gap: 12px; width: 100%;">
                <button onclick="window.executePurgeSetting(${hours})" style="flex: 1; background: rgba(255, 69, 58, 0.2); color: #FF453A; border: 1px solid #FF453A; padding: 15px; border-radius: 15px; font-weight: 900; cursor: pointer;">
                    Confirm
                </button>
                <button onclick="document.getElementById('purge-confirm-overlay').remove()" style="flex: 1; background: rgba(50, 215, 75, 0.2); color: #32D74B; border: 1px solid #32D74B; padding: 15px; border-radius: 15px; font-weight: 900; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;

    // Always append to the body to ensure it's outside the main modal's container
    document.body.appendChild(confirmOverlay);
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

// 1. Focused Toast System
window.showGhostToast = (message) => {
    const toast = document.getElementById('ghost-toast');
    if (toast) {
        toast.innerText = message;
        toast.className = "ghost-toast show"; // Forces it to show
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }
};

// 2. Focused Wallpaper System
window.handleWallpaperUpload = (input) => {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            
            // Save to memory
            localStorage.setItem('phestone-wallpaper', imageUrl);
            
            // Visual confirmation
            alert("Wallpaper saved to memory! 🎭✨");
            console.log("Image data saved under 'phestone-wallpaper'");
            
            // Immediate preview on settings page
            document.body.style.backgroundImage = `url(${imageUrl})`;
        };
        reader.readAsDataURL(file);
    } else {
        console.error("No file selected.");
    }
};
            
window.toggleGhostMode = (isActive) => {
    const root = document.documentElement;
    
    if (isActive) {
        // 1. Apply the "Ghost" Visuals (Blue/Hollow)
        root.setAttribute('data-theme', 'ghost');
        localStorage.setItem('ghost-mode-active', 'true');
        
        // 2. Set the 24-hour Vanish Protocol
        localStorage.setItem('message-expiry', '24'); 
        alert("Ghost Mode Active: Messages vanish after 24 hours. 👻⚡");
    } else {
        // 1. Revert to Just•Abacha (Default)
        root.setAttribute('data-theme', 'default');
        localStorage.setItem('ghost-mode-active', 'false');
        
        // 2. Disable Vanish
        localStorage.removeItem('message-expiry');
        alert("Ghost Mode Deactivated.");
    }
};

// RUN ON LOAD: Keep the toggle position correct
document.addEventListener('DOMContentLoaded', () => {
    const isGhost = localStorage.getItem('ghost-mode-active') === 'true';
    const toggle = document.getElementById('ghost-toggle');
    if (toggle) toggle.checked = isGhost;
});
    
window.showGhostToast = (message) => {
    const toast = document.getElementById('ghost-toast');
    toast.innerText = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); // Vibe disappears after 3 seconds
};

window.toggleGhostMode = (isActive) => {
    const root = document.documentElement;
    
    if (isActive) {
        root.setAttribute('data-theme', 'ghost');
        localStorage.setItem('ghost-mode-active', 'true');
        localStorage.setItem('message-expiry', '24'); // 24-hour protocol [cite: 2026-01-25]
        showGhostToast("Ghost Protocol Active 👻");
    } else {
        root.setAttribute('data-theme', 'default');
        localStorage.setItem('ghost-mode-active', 'false');
        localStorage.removeItem('message-expiry');
        showGhostToast("Ghost Mode Disabled");
    }
};
    
