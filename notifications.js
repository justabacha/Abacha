// --- GHOST NOTIFICATION ENGINE ---
const GhostNotifications = {
async init() {
    if (!('Notification' in window)) return;

    // Wait a tiny bit to ensure supabaseClient is defined from app.js
    if (typeof supabaseClient === 'undefined') {
        setTimeout(() => this.init(), 500);
        return;
    }

    const isDismissed = localStorage.getItem('ghost_notification_prompt_dismissed');
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('push_subscription')
        .eq('id', user.id)
        .single();

    const dbTokenMissing = !profile?.push_subscription;
    
    // If we have permission but NO token in DB, skip the custom prompt and just re-register
    if (Notification.permission === 'granted' && dbTokenMissing) {
        this.requestAccess();
        return;
    }

    if ((Notification.permission === 'default' || dbTokenMissing) && !isDismissed) {
        this.showPermissionPrompt();
    }
},

showPermissionPrompt() {
    if (document.getElementById('notification-prompt-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'notification-prompt-overlay';
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(8px); padding:20px;";
    
    overlay.innerHTML = `
        <div class="ghost-prompt-tile" style="width:100%; max-width:350px; background:#111; border:1px solid #2afb17; padding:24px; border-radius:24px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
            <div class="prompt-logo" style="color:#888; font-weight:600; font-size:0.9rem; text-align:left; margin-bottom:12px; letter-spacing:0.5px;">|Just•Abacha😎|</div>
            <div class="prompt-text" style="color:#fff; font-size:1.05rem; line-height:1.4; text-align:left; font-weight:500;">Want to get the vibes the second they drop? Enable alerts, blud.🔔</div>
            <div style="display:flex; gap:12px; margin-top:24px;">
                <button class="vibe-btn" onclick="GhostNotifications.handleAllowClick()" style="flex:1.5; padding:14px; border-radius:12px; border:none; background:#fff; color:#000; font-weight:bold; cursor:pointer; font-size:1rem;">Allow</button>
                <button class="vibe-btn" onclick="GhostNotifications.dismissPrompt()" style="flex:1; padding:14px; border-radius:12px; border:none; background:rgba(255,255,255,0.08); color:#888; cursor:pointer; font-size:1rem;">Later</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
},

async handleAllowClick() {
    // This intermediate step ensures the browser sees a "User Gesture"
    await this.requestAccess();
},

async requestAccess() {
    const self = GhostNotifications; 
    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: 'BBw2PAT9ddA7GjRb1id0WUoeFyyfQ7-xAeJ08dtWMWbBgfD2roqHJSNV0WLAxAs2aWS_8SU7lqYFGbY68v5UeQU' 
            });

            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                const { error } = await supabaseClient
                    .from('profiles')
                    .update({ push_subscription: sub })
                    .eq('id', user.id);
                
                if (!error) {
                    console.log("Ghost Identity Synced ☁️");
                    self.hideOverlay();
                } else { throw error; }
            }
        } else {
            self.dismissPrompt();
        }
    } catch (err) {
        console.error("Ghost Link Failed:", err);
        self.hideOverlay(); // Close it anyway so it doesn't get stuck
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
    toast.innerHTML = `<div class="toast-the-ghost-header"><span>${senderName} •|Abacha|</span></div><div class="toast-the-ghost-body">${message}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    toast.onclick = () => { window.location.href = `hub.html?friend_id=${senderId}`; };
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 5000);
}
};

window.GhostNotifications = GhostNotifications;