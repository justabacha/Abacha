// --- 1. GLOBALS & TUNNELING ---
const urlParams = new URLSearchParams(window.location.search);
const friendID = urlParams.get('friend_id');

document.addEventListener('DOMContentLoaded', async () => {
    // Relying on the supabaseClient initialized in app.js
    const { data: { user } } = await supabaseClient.auth.getUser();
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');
    
    if (!user) return;

    let replyingTo = null;
    let messageToDelete = null;
    let pendingPinMsg = null;
    let currentPins = [];

     // --- 2. IDENTITY SYNC (CRASH-PROOF) ---
    const syncChatIdentity = async () => {
        try {
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('avatar_url, username')
                .eq('id', user.id)
                .maybeSingle(); 

            if (profile) {
                // STRIP OUT '.chat-avatar' FROM HERE
                document.querySelectorAll('.nav-avatar, .my-self-avatar').forEach(el => {
                    if (profile.avatar_url) el.style.backgroundImage = `url(${profile.avatar_url})`;
                });
                // STRIP OUT '.chat-user-name' FROM HERE
                document.querySelectorAll('#display-username, .my-alias').forEach(el => {
                    if (profile.username) el.innerText = profile.username;
                });
            }
        } catch (err) { console.error("Identity Stall:", err); }
    };

    // --- NEW: SPECIFIC HEADER SYNC FOR THE RECEIVER ---
    const syncReceiverHeader = async () => {
        if (!friendID) return;
        const { data: friend } = await supabaseClient
            .from('profiles')
            .select('avatar_url, username')
            .eq('id', friendID)
            .maybeSingle();

        if (friend) {
            // Specifically target the header elements by their IDs or unique classes
            const headerName = document.querySelector('.chat-user-name');
            const headerAvatar = document.querySelector('.chat-avatar');
            
            if (headerName) headerName.innerText = `~${friend.username}`;
            if (headerAvatar && friend.avatar_url) {
                headerAvatar.style.backgroundImage = `url(${friend.avatar_url})`;
            }
        }
    };
    
    syncChatIdentity();
    syncReceiverHeader(); // Add this call
    
    if (chatBox) {
        // --- 3. MESSAGE DISPLAY & UI ---
        const displayMessage = (msg) => {
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
            bubble.oncontextmenu = (e) => {
                e.preventDefault();
                showActionMenu(msg, bubble.cloneNode(true));
            };

            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
        };

        // --- 4. ACTION MENUS (PIN/DELETE/REPLY) ---
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
                <div class="action-item" onclick="setReply('${msg.sender_email || 'Ghost'}', '${msg.content.replace(/'/g, "\\'")}')">Reply <span>✍️</span></div>
                <div class="action-item">Forward <span>📤</span></div>
                <div class="action-item" onclick="${isPinned ? `unpinMessage('${msg.id}')` : `openPinModal('${msg.id}', '${msg.content.replace(/'/g, "\\'")}')`}">
                    ${isPinned ? 'Unpin' : 'Pin'} <span>📌</span>
                </div>
                <div class="action-item delete" onclick="deleteMessage('${msg.id}')">Delete <span>🗑️</span></div>
            `;
            menuContainer.appendChild(tile);
            overlay.style.display = 'flex';
        };

        // --- 5. PINNING SYSTEM ---
        window.openPinModal = (id, content) => {
            if (currentPins.length >= 2) {
                alert("Ghost Layer Limit: 2 Pins max.");
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
                        <span onclick="unpinMessage('${p.id}')" style="cursor:pointer; padding:5px;">✕</span>
                    </div>
                `).join('');
            } else { pinBar.style.display = 'none'; }
        };

        // --- 6. SEND LOGIC (THE 🚀 FIX) ---
        const handleSend = async () => {
            const message = msgInput.value.trim();
            if (message !== "" && friendID) {
                let content = message;
                if (replyingTo) { 
                    content = `↳ [Replying to ${replyingTo.sender}: ${replyingTo.content}]\n${message}`; 
                    cancelReply(); 
                }
                const { error } = await supabaseClient.from('messages').insert([{ 
                    content: content, 
                    sender_id: user.id, 
                    receiver_id: friendID,
                    sender_email: user.email 
                }]);
                if (error) alert("Error: " + error.message);
                else msgInput.value = ""; 
            }
        };

        if (sendBtn) {
            sendBtn.onclick = handleSend;
            msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
        }

        // --- 7. HISTORY & REALTIME ---
        const { data: history } = await supabaseClient.from('messages').select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendID}),and(sender_id.eq.${friendID},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });
        history?.forEach(displayMessage);
        loadPins();

        supabaseClient.channel('messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
            if (payload.eventType === 'INSERT') {
                if ((payload.new.sender_id === user.id && payload.new.receiver_id === friendID) || 
                    (payload.new.sender_id === friendID && payload.new.receiver_id === user.id)) {
                    displayMessage(payload.new);
                }
            } else { location.reload(); }
        }).subscribe();
    }

    // --- 8. VIBE NOTIFICATION SYSTEM (RESTORED) ---
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

    const subscribeToVibes = () => {
        supabaseClient.channel('vibe-updates').on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'friendships', filter: `sender_id=eq.${user.id}` }, 
            async (payload) => {
                if (payload.new.status === 'accepted') {
                    const { data: rcvr } = await supabaseClient.from('profiles').select('username').eq('id', payload.new.receiver_id).maybeSingle();
                    if (rcvr) showVibeNotification(`@${rcvr.username} accepted your vibe just now! 🤓`);
                }
            }).subscribe();
    };

    checkAcceptedVibes();
    subscribeToVibes();
});

// --- GLOBAL HELPERS ---
window.setReply = (sender, content) => {
    replyingTo = { sender, content };
    const inputArea = document.querySelector('.floating-input-container');
    let preview = document.getElementById('reply-preview') || document.createElement('div');
    preview.id = 'reply-preview';
    inputArea.prepend(preview);
    preview.innerHTML = `<div style="background:rgba(255,255,255,0.1); padding:10px; border-left:4px solid #32D74B; font-size:12px; color:white; border-radius:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
        <span>Replying to <b>${sender}</b>: "${content.substring(0, 20)}..."</span>
        <span onclick="cancelReply()" style="color:#FF3B30; font-weight:bold; cursor:pointer; padding:5px;">✕</span>
    </div>`;
    document.getElementById('chat-overlay').style.display = 'none';
};
window.cancelReply = () => { document.getElementById('reply-preview')?.remove(); replyingTo = null; };
window.copyToClipboard = (text) => { navigator.clipboard.writeText(text); document.getElementById('chat-overlay').style.display = 'none'; };
window.deleteMessage = (id) => { messageToDelete = id; document.getElementById('delete-modal').style.display = 'flex'; document.getElementById('chat-overlay').style.display = 'none'; };
window.confirmGhostDelete = async () => { if (messageToDelete) { await supabaseClient.from('messages').delete().eq('id', messageToDelete); location.reload(); } };
window.closeGhostModal = () => { document.getElementById('delete-modal').style.display = 'none'; };
            
