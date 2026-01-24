// 1. Connection Keys
const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- NEW: Get the Friend ID from the URL (from Chat List) ---
const urlParams = new URLSearchParams(window.location.search);
const friendID = urlParams.get('friend_id');

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');
    
    let replyingTo = null;
    let messageToDelete = null;
    let pendingPinMsg = null;
    let currentPins = [];

    // --- NEW: IDENTITY SYNC BLOCK (Maintains Sync across App) ---
    const syncChatIdentity = async () => {
        if (!user) return;
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('avatar_url, username')
            .eq('id', user.id)
            .single();

        if (profile) {
            const pfpElements = document.querySelectorAll('.chat-avatar, .nav-avatar, .avatar-circle');
            pfpElements.forEach(el => {
                if (profile.avatar_url) {
                    el.style.backgroundImage = `url(${profile.avatar_url})`;
                    el.style.backgroundSize = 'cover';
                    el.style.backgroundPosition = 'center';
                }
            });
            const nameElements = document.querySelectorAll('.chat-user-name, .ghost-alias-text, #display-username');
            nameElements.forEach(el => {
                if (profile.username) el.innerText = profile.username;
            });
        }
    };
    syncChatIdentity();

    if (chatBox && user) {
        // --- 1. MESSAGE DISPLAY (REPLY UI) ---
        const displayMessage = (msg) => {
            // Updated to check sender_id for "isMe"
            const isMe = msg.sender_id === user.id || msg.sender_email === user.email;
            const bubble = document.createElement('div');
            bubble.className = `message ${isMe ? 'sent' : 'received'}`;

            if (msg.content.includes("↳ [Replying to")) {
                const parts = msg.content.split(']\n');
                const replyHeader = parts[0].replace('↳ [', '');
                const actualMessage = parts[1] || "";
                bubble.innerHTML = `<div class="reply-quote">${replyHeader}</div><div>${actualMessage}</div>`;
            } else {
                bubble.innerText = msg.content;
            }

            let pressTimer;
            bubble.addEventListener('touchstart', () => {
                pressTimer = setTimeout(() => showActionMenu(msg, bubble.cloneNode(true)), 600);
            });
            bubble.addEventListener('touchend', () => clearTimeout(pressTimer));
            bubble.addEventListener('touchmove', () => clearTimeout(pressTimer));

            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
        };

        // --- 2. ACTION MENU (PIN/UNPIN LOGIC) ---
        window.showActionMenu = (msg, clonedBubble) => {
            const overlay = document.getElementById('chat-overlay');
            const menuContainer = document.getElementById('menu-content');
            menuContainer.innerHTML = '';
            clonedBubble.classList.add('popped-message');
            menuContainer.appendChild(clonedBubble);
            
            const isPinned = currentPins.some(p => p.id === msg.id);
            
            const tile = document.createElement('div');
            tile.className = 'action-tile';
            tile.innerHTML = `
                <div class="action-item" onclick="copyToClipboard('${msg.content.replace(/'/g, "\\'")}')">Copy <span>📑</span></div>
                <div class="action-item" onclick="setReply('${msg.sender_email}', '${msg.content.replace(/'/g, "\\'")}')">Reply <span>✍️</span></div>
                <div class="action-item">Forward <span>📤</span></div>
                <div class="action-item" onclick="${isPinned ? `unpinMessage('${msg.id}')` : `openPinModal('${msg.id}', '${msg.content.replace(/'/g, "\\'")}')`}">
                    ${isPinned ? 'Unpin' : 'Pin'} <span>📌</span>
                </div>
                <div class="action-item delete" onclick="deleteMessage('${msg.id}')">Delete <span>🗑️</span></div>
            `;
            menuContainer.appendChild(tile);
            overlay.style.display = 'flex';
        };

        // --- 3. PINNING SYSTEM (2-PIN LIMIT) ---
        window.openPinModal = (id, content) => {
            if (currentPins.length >= 2) {
                alert("Ghost Layer Limit: Unpin a message first to add another.");
                document.getElementById('chat-overlay').style.display = 'none';
                return;
            }
            pendingPinMsg = { id, content };
            document.getElementById('pin-modal').style.display = 'flex';
            document.getElementById('chat-overlay').style.display = 'none';
        };

        window.executePin = async (hours) => {
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + hours);
            await supabaseClient.from('messages').update({ pinned_until: expiry.toISOString() }).eq('id', pendingPinMsg.id);
            document.getElementById('pin-modal').style.display = 'none';
            loadPins(); 
        };

        window.unpinMessage = async (id) => {
            await supabaseClient.from('messages').update({ pinned_until: null }).eq('id', id);
            document.getElementById('chat-overlay').style.display = 'none';
            loadPins();
        };

        const loadPins = async () => {
            const now = new Date().toISOString();
            const { data: pins } = await supabaseClient.from('messages').select('*').gt('pinned_until', now);
            currentPins = pins || [];
            const pinBar = document.getElementById('pinned-bar');
            if (currentPins.length > 0) {
                pinBar.style.display = 'block';
                pinBar.innerHTML = currentPins.map(p => `
                    <div class="pin-item">
                        <span>📌 ${p.content.substring(0, 25)}...</span>
                        <span onclick="unpinMessage('${p.id}')" style="font-size:12px; font-weight:bold; padding: 5px;">✕</span>
                    </div>
                `).join('');
            } else { pinBar.style.display = 'none'; }
        };

        // --- 4. HELPERS (COPY, DELETE, REPLY) ---
        window.copyToClipboard = (text) => {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            document.getElementById('chat-overlay').style.display = 'none';
        };

        window.deleteMessage = (id) => {
            messageToDelete = id;
            document.getElementById('delete-modal').style.display = 'flex';
            document.getElementById('chat-overlay').style.display = 'none';
        };

        window.confirmGhostDelete = async () => {
            if (messageToDelete) {
                await supabaseClient.from('messages').delete().eq('id', messageToDelete);
                location.reload();
            }
        };

        window.closeGhostModal = () => {
            document.getElementById('delete-modal').style.display = 'none';
            messageToDelete = null;
        };

        window.setReply = (sender, content) => {
            replyingTo = { sender, content };
            const inputArea = document.querySelector('.floating-input-container');
            let preview = document.getElementById('reply-preview') || document.createElement('div');
            preview.id = 'reply-preview';
            inputArea.prepend(preview);
            preview.innerHTML = `<div style="background:rgba(255,255,255,0.1); padding:10px; border-left:4px solid #32D74B; font-size:12px; color:white; border-radius:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span>Replying to <b>${sender}</b>: "${content.substring(0, 20)}..."</span>
                <span onclick="cancelReply()" style="color:#FF3B30; font-weight:bold; padding:5px;">✕</span>
            </div>`;
            document.getElementById('chat-overlay').style.display = 'none';
        };

        window.cancelReply = () => { replyingTo = null; document.getElementById('reply-preview')?.remove(); };

        // --- 5. INITIAL LOAD & REALTIME (Filtered by conversation) ---
        const { data: history } = await supabaseClient
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendID}),and(sender_id.eq.${friendID},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });
            
        history?.forEach(displayMessage);
        loadPins();

        supabaseClient.channel('messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
            if (payload.eventType === 'INSERT') {
                // Only display if it's part of THIS conversation
                if ((payload.new.sender_id === user.id && payload.new.receiver_id === friendID) || 
                    (payload.new.sender_id === friendID && payload.new.receiver_id === user.id)) {
                    displayMessage(payload.new);
                }
            }
            else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') location.reload();
        }).subscribe();

        // --- FIXED: THE HANDLESEND FUNCTION ---
        const handleSend = async () => {
            const message = msgInput.value.trim();
            if (message !== "" && friendID) {
                let content = message;
                if (replyingTo) { 
                    content = `↳ [Replying to ${replyingTo.sender}: ${replyingTo.content}]\n${message}`; 
                    cancelReply(); 
                }
                
                const { error } = await supabaseClient
                    .from('messages')
                    .insert([{ 
                        content, 
                        sender_id: user.id, 
                        receiver_id: friendID,
                        sender_email: user.email 
                    }]);

                if (error) {
                    console.error("Ghost Layer Sync Error:", error.message);
                    alert("Message failed: " + error.message);
                } else {
                    msgInput.value = "";
                }
            } else if (!friendID) {
                alert("Ghost Warning: No receiver selected. Go to Vibe List first.");
            }
        };

        sendBtn.onclick = handleSend;
        msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
    }
});

// --- 6. VIBE NOTIFICATION SYSTEM ---
const showVibeNotification = (text) => {
    const notify = document.createElement('div');
    notify.className = 'vibe-notification-glow';
    notify.innerHTML = `<span>🤓</span> ${text}`;
    document.body.appendChild(notify);
    setTimeout(() => {
        notify.classList.add('fade-out');
        setTimeout(() => notify.remove(), 1500);
    }, 6000);
};

const checkAcceptedVibes = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if(!user) return;
    const { data: vibes } = await supabaseClient.from('friendships')
        .select(`updated_at, profiles!friendships_receiver_id_fkey (username)`)
        .eq('sender_id', user.id).eq('status', 'accepted').order('updated_at', { ascending: false }).limit(1);

    if (vibes && vibes.length > 0) {
        const acceptTime = new Date(vibes[0].updated_at);
        if ((new Date() - acceptTime) / (1000 * 60 * 60) < 24) {
            showVibeNotification(`@${vibes[0].profiles.username} accepted your vibe!`);
        }
    }
};

const subscribeToVibes = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if(!user) return;
    supabaseClient.channel('vibe-updates').on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'friendships', filter: `sender_id=eq.${user.id}` }, 
        async (payload) => {
            if (payload.new.status === 'accepted') {
                const { data: rcvr } = await supabaseClient.from('profiles').select('username').eq('id', payload.new.receiver_id).single();
                if (rcvr) showVibeNotification(`@${rcvr.username} accepted your vibe just now! 🤓`);
            }
        }).subscribe();
};

document.addEventListener('DOMContentLoaded', () => {
    checkAcceptedVibes();
    subscribeToVibes();
});
                    
