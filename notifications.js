// --- GHOST NOTIFICATION ENGINE ---
const GhostNotifications = {
async init() {
    if (!('Notification' in window)) return;

    const isDismissed = localStorage.getItem('ghost_notification_prompt_dismissed');
    
    // 1. Check if we are logged in
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // 2. Check the DB for an existing subscription
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('push_subscription')
        .eq('id', user.id)
        .single();

    // 3. SMART TRIGGER: Show prompt if Permission is default OR if the DB is empty (and not dismissed)
    const dbTokenMissing = !profile?.push_subscription;
    
    if ((Notification.permission === 'default' || dbTokenMissing) && !isDismissed) {
        this.showPermissionPrompt();
    }
},

  showPermissionPrompt() {
    // Check if it already exists to avoid duplicates
    if (document.getElementById('notification-prompt-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'notification-prompt-overlay';
    // Added explicit mobile-friendly styles to ensure it doesn't just look like "text"
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);";
    
    overlay.innerHTML = `
        <div class="ghost-prompt-tile" style="width:90%; max-width:400px; background:#1a1a1a; border:1px solid #2afb17; padding:20px; border-radius:20px; text-align:center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div class="prompt-logo" style="color:#ccc; font-weight:bold; font-size:1.2rem; margin-bottom:10px; margin-left:8px;">|Just•Abacha😎|</div>
            <div class="prompt-text" style="color:#fff; font-size:0.95rem; line-height:1.4;">Want to get the vibes the second they drop? Enable alerts, blud.🔔</div>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="vibe-btn" onclick="GhostNotifications.requestAccess()" style="flex:1; padding:12px; border-radius:12px; border:none; background:#fff; color:#000; font-weight:bold; cursor:pointer;">Allow</button>
                <button class="vibe-btn" onclick="GhostNotifications.dismissPrompt()" style="flex:1; padding:12px; border-radius:12px; border:none; background:rgba(255,255,255,0.1); color:#fff; cursor:pointer;">Later</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
},

async requestAccess() {
        // Use a variable for this so we don't lose context
        const self = GhostNotifications; 
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            try {
                const reg = await navigator.serviceWorker.ready;
                
                // 1. Force a fresh subscription to override any old/dead tokens
                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: 'BBw2PAT9ddA7GjRb1id0WUoeFyyfQ7-xAeJ08dtWMWbBgfD2roqHJSNV0WLAxAs2aWS_8SU7lqYFGbY68v5UeQU' 
                });

                // 2. Sync to Supabase
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    const { error } = await supabaseClient
                        .from('profiles')
                        .update({ push_subscription: sub })
                        .eq('id', user.id);
                    
                    if (!error) {
                        console.log("Ghost Identity Synced to Cloud ☁️");
                        // Only remove overlay on success
                        self.hideOverlay();
                    } else {
                        throw error;
                    }
                }
            } catch (err) {
                console.error("Failed to link Ghost Push:", err);
                alert("Safe, mate. Something went wrong linking the vibe. Try again?");
            }
        } else {
            // If they denied it, just close the prompt
            self.dismissPrompt();
        }
    },

    dismissPrompt() {
        localStorage.setItem('ghost_notification_prompt_dismissed', 'true');
        this.hideOverlay();
    },

    hideOverlay() {
        const overlay = document.getElementById('notification-prompt-overlay');
        if (overlay) overlay.remove();
    },

    showInAppToast(senderName, message, senderId) {
        const currentFriend = new URLSearchParams(window.location.search).get("friend_id");
        if (currentFriend === senderId) return;

        const toast = document.createElement('div');
        toast.className = 'toast-the-ghost'; 
        toast.innerHTML = `
            <div class="toast-the-ghost-header">
                <span>${senderName}  •|Just•Abacha|</span>
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