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
                .maybeSingle(); // Stops the 'Inner Circle' stall

            if (profile) {
                document.querySelectorAll('.chat-avatar, .nav-avatar, .avatar-circle').forEach(el => {
                    if (profile.avatar_url) {
                        el.style.backgroundImage = `url(${profile.avatar_url})`;
                        el.style.backgroundSize = 'cover';
                        el.style.backgroundPosition = 'center';
                    }
                });
                document.querySelectorAll('.chat-user-name, .ghost-alias-text, #display-username').forEach(el => {
                    if (profile.username) el.innerText = profile.username;
                });
                console.log("Ghost Identity Synced: ", profile.username);
            }
        } catch (err) { console.error("Identity Stall:", err); }
    };
    
    syncChatIdentity();

    if (chatBox) {
        // --- 3. MESSAGE DISPLAY & UI ---
        const displayMessage = (msg) => {
            const isMe = msg.sender_id === user.id;
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

            // Mobile-Friendly Long Press
            let pressTimer;
            bubble.addEventListener('touchstart', () => {
                pressTimer = setTimeout(() => showActionMenu(msg, bubble.cloneNode(true)), 600);
            });
            bubble.addEventListener('touchend', () => clearTimeout(pressTimer));
            
            // Desktop Context Menu
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
                        <span onclick="unpinMessage('${p.id}')" style="cursor:pointer;">✕</span>
                    </div>
                `).join('');
            } else { pinBar.style.display = 'none'; }
        };

        // --- 6. SEND LOGIC (The 🚀 Fix) ---
        const handleSend = async () => {
            const message = msgInput.value.trim();
            if (message !== "" && friendID) {
                let content = message;
                if (replyingTo) { 
                    content = `↳ [Replying to ${replyingTo.sender}: ${replyingTo.content}]\n${message}`; 
                    cancelReply(); 
                }
                
                const { error } = await supabaseClient.from('messages').insert([{ 
                    content, 
                    sender_id: user.id, 
                    receiver_id: friendID 
                }]);

                if (error) alert("Error: " + error.message);
                else msgInput.value = ""; 
            } else if (!friendID) {
                alert("Ghost Warning: No receiver found.");
            }
        };

        if (sendBtn) {
            sendBtn.onclick = handleSend;
            msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
        }

        // --- 7. LOAD HISTORY & REALTIME ---
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

    // --- 8. VIBE NOTIFICATIONS ---
    const subscribeToVibes = () => {
        supabaseClient.channel('vibe-updates').on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'friendships', filter: `sender_id=eq.${user.id}` }, 
            async (payload) => {
                if (payload.new.status === 'accepted') {
                    const { data: rcvr } = await supabaseClient.from('profiles').select('username').eq('id', payload.new.receiver_id).maybeSingle();
                    if (rcvr) alert(`@${rcvr.username} accepted your vibe! 🚀`);
                }
            }).subscribe();
    };
    subscribeToVibes();
});

// --- GLOBAL HELPERS (Required for HTML Buttons) ---
window.setReply = (sender, content) => {
    replyingTo = { sender, content };
    const inputArea = document.querySelector('.floating-input-container');
    let preview = document.getElementById('reply-preview') || document.createElement('div');
    preview.id = 'reply-preview';
    inputArea.prepend(preview);
    preview.innerHTML = `<div class="reply-preview-box">
        <span>Replying to <b>${sender}</b></span>
        <span onclick="cancelReply()" style="cursor:pointer; color:#FF3B30;">✕</span>
    </div>`;
    document.getElementById('chat-overlay').style.display = 'none';
};

window.cancelReply = () => { document.getElementById('reply-preview')?.remove(); replyingTo = null; };

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
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

window.closeGhostModal = () => { document.getElementById('delete-modal').style.display = 'none'; };
                
