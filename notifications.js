// --- GHOST NOTIFICATION ENGINE ---
const GhostNotifications = {
async init() {
        if (!('Notification' in window)) return;

        // Corrected: Just get the item. If it exists, it's truthy.
        const isDismissed = localStorage.getItem('ghost_notification_prompt_dismissed');
        
        if (Notification.permission === 'default' && !isDismissed) {
            this.showPermissionPrompt();
        }
    },

    showPermissionPrompt() {
        const overlay = document.createElement('div');
        overlay.id = 'notification-prompt-overlay';
        overlay.innerHTML = `
            <div class="ghost-prompt-tile" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:10000; width:85%;">
                <div class="prompt-logo">|Just•Abacha😎|</div>
                <div class="prompt-text">Want to get the vibes the second they drop? Enable alerts, blud.🔔</div>
                <div style="display:flex; gap:10px; margin-top:15px;">
                <button class="vibe-btn" onclick="GhostNotifications.requestAccess()" style="flex:1;">Allow</button>
                <button class="vibe-btn" onclick="GhostNotifications.dismissPrompt()" style="flex:1; background:rgba(255,255,255,0.1);">Later</button>
            </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

   async requestAccess() {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            try {
                const reg = await navigator.serviceWorker.ready;
                // Generate the subscription
                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    // Use a public VAPID key (you'll generate this next)
                    applicationServerKey: 'BBw2PAT9ddA7GjRb1id0WUoeFyyfQ7-xAeJ08dtWMWbBgfD2roqHJSNV0WLAxAs2aWS_8SU7lqYFGbY68v5UeQU' 
                });

                // Sync to Supabase Profiles
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    const { error } = await supabaseClient
                        .from('profiles')
                        .update({ push_subscription: sub })
                        .eq('id', user.id);
                    
                    if (!error) console.log("Ghost Identity Synced to Cloud ☁️");
                }
            } catch (err) {
                console.error("Failed to link Ghost Push:", err);
            }
        }
        this.dismissPrompt();
    },
   dismissPrompt() {
        localStorage.setItem('ghost_notification_prompt_dismissed', 'true'); // Added 'true' here
        document.getElementById('notification-prompt-overlay')?.remove();
    },
    // IN-APP TOAST (When user is active in the app)
   showInAppToast(senderName, message, senderId) {
        const currentFriend = new URLSearchParams(window.location.search).get("friend_id");
        if (currentFriend === senderId) return;

        const toast = document.createElement('div');
        toast.className = 'toast-the-ghost'; // OUR NEW UNIQUE ID
        toast.innerHTML = `
            <div class="toast-the-ghost-header">
                <span>${senderName} • |Just•Abacha|</span>
                <span style="opacity:0.5; font-weight:normal;">now</span>
            </div>
            <div class="toast-the-ghost-body">${message}</div>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);

        toast.onclick = () => {
            window.location.href = `hub.html?friend_id=${senderId}`;
        };

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }
};

window.GhostNotifications = GhostNotifications;