// --- 1. IMMEDIATE WALLPAPER LOAD ---
(function() {
    const savedWall = localStorage.getItem('phestone-wallpaper');
    if (savedWall) {
        document.body.style.setProperty('background-image', `url(${savedWall})`, 'important');
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
    }
})();

// --- 2. GLOBALS ---
const urlParams = new URLSearchParams(window.location.search);
const friendID = urlParams.get('friend_id');
let replyingTo = null;
let currentPins = [];
let pendingPinMsg = null;
let messageToDelete = null;

// --- 3. GLOBAL UI HELPERS (Prevents "missing logic" errors) ---
window.cancelReply = () => { 
    document.getElementById('reply-preview-container').style.display = 'none'; 
    replyingTo = null; 
};

window.closeGhostModal = () => { 
    document.getElementById('delete-modal').style.display = 'none'; 
    document.getElementById('pin-modal').style.display = 'none';
};

window.deleteMessage = (id) => { 
    messageToDelete = id; 
    document.getElementById('delete-modal').style.display = 'flex'; 
    document.getElementById('chat-overlay').style.display = 'none'; 
};

window.confirmGhostDelete = async () => { 
    if (messageToDelete) { 
        await supabaseClient.from('messages').delete().eq('id', messageToDelete); 
        location.reload(); // Hard refresh to sync state
    } 
};

window.openPinModal = (id, content) => {
    if (currentPins.length >= 2) { alert("Ghost Layer Limit: 2 Pins max."); return; }
    pendingPinMsg = { id, content };
    document.getElementById('pin-modal').style.display = 'flex';
    document.getElementById('chat-overlay').style.display = 'none';
};

window.executePin = async (hours) => {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
    await supabaseClient.from('messages').update({ pinned_until: expiry.toISOString() }).eq('id', pendingPinMsg.id);
    window.closeGhostModal();
    window.loadPins(); 
};

window.unpinMessage = async (id) => {
    await supabaseClient.from('messages').update({ pinned_until: null }).eq('id', id);
    window.loadPins();
};

// --- 4. MAIN CHAT ENGINE ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');
    
    if (!user || !friendID) return;

    // A. SYNC IDENTITY
    const syncReceiverHeader = async () => {
   const syncReceiverHeader = async () => {
    if (!friendID) return;

    // Explicitly query ONLY the friend's profile using the ID from the URL
    const { data: friend, error } = await supabaseClient
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', friendID) 
        .single();

    if (friend) {
        // Force update the DOM elements
        const nameEl = document.querySelector('.chat-user-name');
        const avatarEl = document.querySelector('.chat-avatar');
        
        if (nameEl) nameEl.innerText = `~${friend.username}`;
        if (avatarEl && friend.avatar_url) {
            avatarEl.style.backgroundImage = `url('${friend.avatar_url}')`;
            avatarEl.style.backgroundSize = "cover";
        }
    } else {
        console.error("Profile Sync Error:", error);
    }
};
            
    // B. LOAD PINS
    window.loadPins = async () => {
        const now = new Date().toISOString();
        const { data: pins } = await supabaseClient.from('messages').select('*').gt('pinned_until', now);
        currentPins = pins || [];
        const pinBar = document.getElementById('pinned-bar');
        if (currentPins.length > 0) {
            pinBar.style.display = 'block';
            pinBar.innerHTML = currentPins.map(p => `
                <div class="pin-item">
                    <span>📌 ${p.content.substring(0, 25)}...</span>
                    <span onclick="window.unpinMessage('${p.id}')" style="cursor:pointer; padding:5px;">✕</span>
                </div>`).join('');
        } else { pinBar.style.display = 'none'; }
    };

    // C. DISPLAY BUBBLES
    const displayMessage = async (msg) => {
        const isMe = msg.sender_id === user.id;
        const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${isMe ? 'user-wrapper' : 'ai-wrapper'}`;
        
        const { data: sender } = await supabaseClient.from('profiles').select('avatar_url').eq('id', msg.sender_id).maybeSingle();
        const avatarImg = sender?.avatar_url || 'https://i.postimg.cc/rpD4fgxR/IMG-5898-2.jpg';

        wrapper.innerHTML = `
            <img src="${avatarImg}" class="avatar">
            <div class="message ${isMe ? 'sent' : 'received'}">
                ${msg.content.includes("↳ [") 
                    ? `<div class="reply-quote">${msg.content.split(']\n')[0].replace('↳ [', '')}</div><div>${msg.content.split(']\n')[1] || ""}</div>`
                    : `<div>${msg.content}</div>`
                }
                <div class="msg-time" style="font-size:10px; opacity:0.8; margin-top:4px; text-align:right;">${timeStr}</div>
            </div>`;

        const bubble = wrapper.querySelector('.message');
        bubble.oncontextmenu = (e) => { e.preventDefault(); window.showActionMenu(msg, bubble.cloneNode(true)); };
        chatBox.appendChild(wrapper);
    };

    
    // --- LOAD HISTORY ---
const { data: history } = await supabaseClient.from('messages').select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendID}),and(sender_id.eq.${friendID},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true });

if (history) {
    chatBox.innerHTML = '';
    // Use for...of to ensure order
    for (const msg of history) { 
        await displayMessage(msg); 
    }
    
    // FORCE SCROLL TO BOTTOM
    const scrollToLatest = () => {
        chatBox.scrollTop = chatBox.scrollHeight;
        chatBox.classList.add('ready'); // Show chat once at the bottom
    };

    // Run it twice to be sure: once immediately and once after a tiny delay
    scrollToLatest();
    setTimeout(scrollToLatest, 50); 
    
    window.loadPins();
}
    
    // E. ACTION MENU (Full Options)
    // --- New Ghost Prompt Logic ---
window.showGhostPrompt = (message) => {
    const overlay = document.getElementById('ghost-prompt-overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="ghost-prompt-tile">
            <div class="prompt-logo">|Just•Abacha😎|</div>
            <div class="prompt-text">${message}</div>
            <button class="vibe-btn" onclick="document.getElementById('ghost-prompt-overlay').style.display='none'">Vibe</button>
        </div>
    `;
};

// --- Updated Action Menu ---
window.showActionMenu = (msg, clonedBubble) => {
    const overlay = document.getElementById('chat-overlay');
    const menuContainer = document.getElementById('menu-content');
    const isMe = msg.sender_id === user.id;
    const isPinned = currentPins.some(p => p.id === msg.id);
    
    menuContainer.innerHTML = '';
    menuContainer.style.alignItems = isMe ? 'flex-end' : 'flex-start';
    clonedBubble.classList.add('popped-message');
    
    const tile = document.createElement('div');
    tile.className = 'action-tile';
    tile.innerHTML = `
        <div class="action-item" onclick="window.triggerReply('${msg.sender_id}', '${msg.content.replace(/'/g, "\\'")}')">Reply <span>✍️</span></div>
        <div class="action-item" onclick="navigator.clipboard.writeText('${msg.content}')">Copy <span>📑</span></div>
        
        <div class="action-item" onclick="window.showGhostPrompt('This feature is coming soon.!🍻')">Forward <span>📤</span></div>
        
        <div class="action-item" onclick="${isPinned ? `window.unpinMessage('${msg.id}')` : `window.openPinModal('${msg.id}', '${msg.content.replace(/'/g, "\\'")}')`}">
            ${isPinned ? 'Unpin' : 'Pin'} <span>📌</span>
        </div>
        
        <div class="action-item delete" onclick="window.deleteMessage('${msg.id}')">Delete <span>🗑️</span></div>
    `;

    menuContainer.appendChild(clonedBubble);
    menuContainer.appendChild(tile);
    overlay.style.display = 'flex';
};
    
    // F. REPLY LOGIC (Identity Fix)
    window.triggerReply = async (senderId, content) => {
        let name = "Ghost";
        if (senderId === user.id) name = "Me";
        else {
            const { data: p } = await supabaseClient.from('profiles').select('username').eq('id', senderId).maybeSingle();
            name = p ? p.username : "Ghost";
        }

        replyingTo = { sender: name, content };
        const container = document.getElementById('reply-preview-container');
        container.style.display = 'block';
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; color:white;">
                <div style="border-left:3px solid #007AFF; padding-left:10px;">
                    <div style="color:#007AFF; font-size:10px; font-weight:bold;">Replying to ${name}</div>
                    <div style="font-size:12px; opacity:0.8;">${content.substring(0, 30)}...</div>
                </div>
                <span onclick="window.cancelReply()" style="color:#FF3B30; cursor:pointer;">✕</span>
            </div>`;
        document.getElementById('chat-overlay').style.display = 'none';
    };

    // G. SEND LOGIC
    const handleSend = async () => {
        const message = msgInput.value.trim();
        if (message !== "") {
            let content = message;
            if (replyingTo) { content = `↳ [Replying to ${replyingTo.sender}: ${replyingTo.content}]\n${message}`; window.cancelReply(); }
            await supabaseClient.from('messages').insert([{ content, sender_id: user.id, receiver_id: friendID, sender_email: user.email }]);
            msgInput.value = "";
        }
    };
    sendBtn.onclick = handleSend;
    msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };

    // H. REALTIME
    supabaseClient.channel('messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if ((payload.new.sender_id === user.id && payload.new.receiver_id === friendID) || (payload.new.sender_id === friendID && payload.new.receiver_id === user.id)) {
            displayMessage(payload.new).then(() => { chatBox.scrollTop = chatBox.scrollHeight; });
        }
    }).subscribe();
});
    
