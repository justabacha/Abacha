document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');
    
    let replyingTo = null;
    let messageToDelete = null;
    let pendingPinMsg = null;
    let currentPins = [];

    if (chatBox && user) {
        // --- 1. MESSAGE DISPLAY (REPLY UI) ---
        const displayMessage = (msg) => {
            const isMe = msg.sender_email === user.email;
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
        const showActionMenu = (msg, clonedBubble) => {
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
            
            await supabaseClient.from('messages')
                .update({ pinned_until: expiry.toISOString() })
                .eq('id', pendingPinMsg.id);
            
            document.getElementById('pin-modal').style.display = 'none';
            loadPins(); 
        };

        window.unpinMessage = async (id) => {
            await supabaseClient.from('messages')
                .update({ pinned_until: null })
                .eq('id', id);
            document.getElementById('chat-overlay').style.display = 'none';
            loadPins();
        };

        const loadPins = async () => {
            const now = new Date().toISOString();
            const { data: pins } = await supabaseClient.from('messages')
                .select('*')
                .gt('pinned_until', now);
            
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
            } else {
                pinBar.style.display = 'none';
            }
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

        // --- 5. INITIAL LOAD & REALTIME ---
        const { data: history } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: true });
        history?.forEach(displayMessage);
        loadPins();

        supabaseClient.channel('messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
            if (payload.eventType === 'INSERT') displayMessage(payload.new);
            else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') location.reload();
        }).subscribe();

        const handleSend = async () => {
            const message = msgInput.value.trim();
            if (message !== "") {
                let content = message;
                if (replyingTo) { 
                    content = `↳ [Replying to ${replyingTo.sender}: ${replyingTo.content}]\n${message}`; 
                    cancelReply(); 
                }
                await supabaseClient.from('messages').insert([{ content, sender_email: user.email }]);
                msgInput.value = "";
            }
        };

        sendBtn.onclick = handleSend;
        msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
    }
});
     // --- SENDER NOTIFICATION SYSTEM ---

const checkAcceptedVibes = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();

    // Look for vibes you sent that were recently accepted
    const { data: vibes, error } = await supabaseClient
        .from('friendships')
        .select(`
            updated_at,
            profiles!friendships_receiver_id_fkey (username)
        `)
        .eq('sender_id', user.id)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false })
        .limit(1);

    if (vibes && vibes.length > 0) {
        const vibe = vibes[0];
        const acceptTime = new Date(vibe.updated_at);
        
        // Only show if it happened in the last 24 hours to avoid old spam
        const hoursDiff = (new Date() - acceptTime) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
            const timeAgo = formatTimeAgo(acceptTime);
            showVibeNotification(`@${vibe.profiles.username} accepted your vibe ${timeAgo}`);
        }
    }
};

// HELPER: CALCULATE EXACT TIME
const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `just now`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return `recently`;
};

// UI: POP THE GLOWING NOTIFICATION
const showVibeNotification = (text) => {
    const notify = document.createElement('div');
    notify.className = 'vibe-notification-glow';
    notify.innerHTML = `<span>🤓</span> ${text}`;
    document.body.appendChild(notify);
    
    // Auto-dissolve after 6 seconds
    setTimeout(() => {
        notify.classList.add('fade-out');
        setTimeout(() => notify.remove(), 1500);
    }, 6000);
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAcceptedVibes();
});
                                                                   
// --- INSTANT VIBE NOTIFICATION (REALTIME) ---

const subscribeToVibes = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();

    const vibeSubscription = supabaseClient
        .channel('vibe-updates')
        .on(
            'postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'friendships',
                filter: `sender_id=eq.${user.id}` 
            }, 
            async (payload) => {
                // If the status changed to accepted
                if (payload.new.status === 'accepted') {
                    // Fetch the username of the person who accepted
                    const { data: receiver } = await supabaseClient
                        .from('profiles')
                        .select('username')
                        .eq('id', payload.new.receiver_id)
                        .single();

                    if (receiver) {
                        showVibeNotification(`@${receiver.username} accepted your vibe just now! 🤓`);
                    }
                }
            }
        )
        .subscribe();
};

// Start listening when the page loads
document.addEventListener('DOMContentLoaded', () => {
    subscribeToVibes();
});
    
