// --- GHOST NOTIFICATION ENGINE ---
const GhostNotifications = {
    async init() {
        if (!('Notification' in window)) return;

        // Check if we already have permission
        if (Notification.permission === 'default') {
            this.showPermissionPrompt();
        }
    },

    showPermissionPrompt() {
        const overlay = document.createElement('div');
        overlay.id = 'notification-prompt-overlay';
        overlay.innerHTML = `
            <div class="ghost-prompt-tile" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:10000; width:85%;">
                <div class="prompt-logo">|Just•Abacha😎|</div>
                <div class="prompt-text">Want to get the vibes the second they drop? Enable alerts, blud. 🔔</div>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button class="vibe-btn" onclick="GhostNotifications.requestAccess()" style="flex:1;">Allow</button>
                    <button class="vibe-btn" onclick="this.closest('#notification-prompt-overlay').remove()" style="flex:1; background:rgba(255,255,255,0.1);">Later</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async requestAccess() {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log("Ghost Alerts: Active!");
            // Here we would register the Push Subscription to Supabase
        }
        document.getElementById('notification-prompt-overlay')?.remove();
    },
    // IN-APP TOAST (When user is active in the app)
   showInAppToast(senderName, message, senderId) {
        const currentFriend = new URLSearchParams(window.location.search).get("friend_id");
        if (currentFriend === senderId) return;

        const toast = document.createElement('div');
        toast.className = 'ghost-toast';
        toast.innerHTML = `
            <div class="ghost-toast-header">
                <span>${senderName} • Just•Abacha</span>
                <span style="opacity:0.5; font-weight:normal;">now</span>
            </div>
            <div class="ghost-toast-body">${message}</div>
        `;
        
        document.body.appendChild(toast);
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        // Click to open chat
        toast.onclick = () => {
            window.location.href = `hub.html?friend_id=${senderId}`;
        };
        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }
};

window.GhostNotifications = GhostNotifications;