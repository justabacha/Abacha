(function() {
    const savedWall = localStorage.getItem('phestone-wallpaper');
    if (savedWall) {
        document.body.style.setProperty('background-image', `url(${savedWall})`, 'important');
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
    }
})();

const urlParams = new URLSearchParams(window.location.search);
const friendID = urlParams.get('friend_id');
let replyingTo = null;
let currentPins = [];
let pendingPinMsg = null;
let messageToDelete = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');
    
    if (!user || !friendID) return;

    // --- 1. HEADER SYNC ---
    const syncReceiverHeader = async () => {
        const { data: friend } = await supabaseClient.from('profiles').select('avatar_url, username').eq('id', friendID).maybeSingle();
        if (friend) {
            document.querySelector('.chat-user-name').innerText = `~${friend.username}`;
            if (friend.avatar_url) document.querySelector('.chat-avatar').style.backgroundImage = `url(${friend.avatar_url})`;
        }
    };
    syncReceiverHeader();

    // --- 2. PINNING SYSTEM ---
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
                </div>
            `).join('');
        } else { pinBar.style.display = 'none'; }
    };

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
        window.loadPins(); 
    };

    window.unpinMessage = async (id) => {
        await supabaseClient.from('messages').update({ pinned_until: null }).eq('id', id);
        window.loadPins();
    };

    // --- 3. DISPLAY MESSAGE ---
    const displayMessage = async (msg) => {
        const isMe = msg.sender_id === user.id || msg.sender_email === user.email;
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
                <div class="msg-time">${timeStr}</div>
            </div>
        `;

        const bubble = wrapper.querySelector('.message');
        bubble.oncontextmenu = (e) => { e.preventDefault(); window.showActionMenu(msg, bubble.cloneNode(true)); };

        chatBox.appendChild(wrapper);
    };

    // --- 4. LOAD HISTORY (The Storm Killer) ---
    const { data: history } = await supabaseClient.from('messages').select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendID}),and(sender_id.eq.${friendID},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
    
    if (history) {
        chatBox.innerHTML = '';
        for (const msg of history) { await displayMessage(msg); }
        chatBox.scrollTop = chatBox.scrollHeight;
        chatBox.classList.add('ready');
        window.loadPins();
    }

    // --- 5. REALTIME ---
    supabaseClient.channel('messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        if (payload.eventType === 'INSERT') {
            if ((payload.new.sender_id === user.id && payload.new.receiver_id === friendID) || (payload.new.sender_id === friendID && payload.new.receiver_id === user.id)) {
                displayMessage(payload.new).then(() => { chatBox.scrollTop = chatBox.scrollHeight; });
            }
        } else { location.reload(); }
    }).subscribe();

    // --- 6. SEND LOGIC ---
    const handleSend = async () => {
        const message = msgInput.value.trim();
        const vanishLimit = localStorage.getItem('message-expiry') === '24' ? 24 : 720;
        if (message !== "" && friendID) {
            let content = message;
            if (replyingTo) { content = `↳ [Replying to ${replyingTo.sender}: ${replyingTo.content}]\n${message}`; window.cancelReply(); }
            await supabaseClient.from('messages').insert([{ content, sender_id: user.id, receiver_id: friendID, sender_email: user.email, vanish_hours: vanishLimit }]);
            msgInput.value = "";
        }
    };
    sendBtn.onclick = handleSend;
    msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
});

// --- GLOBAL HELPERS ---
window.showActionMenu = (msg, clonedBubble) => {
    const overlay = document.getElementById('chat-overlay');
    const menuContainer = document.getElementById('menu-content');
    const isMe = msg.sender_id === friendID ? false : true;
    const isPinned = currentPins.some(p => p.id === msg.id);
    
    menuContainer.innerHTML = '';
    menuContainer.style.alignItems = isMe ? 'flex-end' : 'flex-start';
    clonedBubble.classList.add('popped-message');
    
    const tile = document.createElement('div');
    tile.className = 'action-tile';
    tile.innerHTML = `
        <div class="action-item" onclick="window.setReply('${msg.sender_email}', '${msg.content.replace(/'/g, "\\'")}')">Reply <span>✍️</span></div>
        <div class="action-item" onclick="navigator.clipboard.writeText('${msg.content}')">Copy <span>📑</span></div>
        <div class="action-item" onclick="alert('Forwarding coming soon to Ghost Layer!')">Forward <span>📤</span></div>
        <div class="action-item" onclick="${isPinned ? `window.unpinMessage('${msg.id}')` : `window.openPinModal('${msg.id}', '${msg.content.replace(/'/g, "\\'")}')`}">
            ${isPinned ? 'Unpin' : 'Pin'} <span>📌</span>
        </div>
        <div class="action-item delete" onclick="window.deleteMessage('${msg.id}')">Delete <span>🗑️</span></div>
    `;

    menuContainer.appendChild(clonedBubble);
    menuContainer.appendChild(tile);
    overlay.style.display = 'flex';
};

window.deleteMessage = (id) => { messageToDelete = id; document.getElementById('delete-modal').style.display = 'flex'; document.getElementById('chat-overlay').style.display = 'none'; };
window.confirmGhostDelete = async () => { if (messageToDelete) { await supabaseClient.from('messages').delete().eq('id', messageToDelete); location.reload(); } };
window.setReply = async (email, content) => {
    const { data: p } = await supabaseClient.from('profiles').select('username').eq('email', email).maybeSingle();
    replyingTo = { sender: p ? p.username : "Ghost", content };
    const container = document.getElementById('reply-preview-container');
    container.style.display = 'block';
    container.innerHTML = `<div style="display:flex; justify-content:space-between; color:white;"><div style="border-left:2px solid #007AFF; padding-left:10px;"><div style="color:#007AFF; font-size:10px; font-weight:bold;">Replying to ${replyingTo.sender}</div><div style="font-size:12px; opacity:0.7;">${content.substring(0, 25)}...</div></div><span onclick="window.cancelReply()" style="color:#FF3B30; cursor:pointer;">✕</span></div>`;
    document.getElementById('chat-overlay').style.display = 'none';
};
window.cancelReply = () => { document.getElementById('reply-preview-container').style.display = 'none'; replyingTo = null; };
window.closeGhostModal = () => { document.getElementById('delete-modal').style.display = 'none'; };
                    
