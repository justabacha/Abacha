// --- 1. IMMEDIATE WALLPAPER LOAD ---
(function () {
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

// --- 3. GLOBAL UI HELPERS ---
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
    if (!messageToDelete) return;
    await supabaseClient.from('messages').delete().eq('id', messageToDelete);
    messageToDelete = null;
    document.getElementById('delete-modal').style.display = 'none';
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
    await supabaseClient.from('messages')
        .update({ pinned_until: expiry.toISOString() })
        .eq('id', pendingPinMsg.id);

    window.closeGhostModal();
    window.loadPins();
};

window.unpinMessage = async (id) => {
    await supabaseClient.from('messages')
        .update({ pinned_until: null })
        .eq('id', id);
    window.loadPins();
};

// --- 4. MAIN CHAT ENGINE ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');

    if (!user || !friendID) return;

    // --- A. FIXED RECEIVER HEADER (NEVER FLIPS) ---
    const { data: friend } = await supabaseClient
        .from('profiles')
        .select('avatar_url, username')
        .eq('id', friendID)
        .maybeSingle();

    if (friend) {
        document.querySelector('.chat-user-name').innerText = `~${friend.username}`;
        if (friend.avatar_url) {
            document.querySelector('.chat-avatar').style.backgroundImage = `url(${friend.avatar_url})`;
        }
    }

    // --- B. PINS (SCOPED TO THIS CHAT ONLY) ---
    window.loadPins = async () => {
        const now = new Date().toISOString();
        const { data: pins } = await supabaseClient
            .from('messages')
            .select('*')
            .gt('pinned_until', now)
            .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${friendID}),
                 and(sender_id.eq.${friendID},receiver_id.eq.${user.id})`
            );

        currentPins = pins || [];
        const pinBar = document.getElementById('pinned-bar');

        if (currentPins.length) {
            pinBar.style.display = 'block';
            pinBar.innerHTML = currentPins.map(p => `
                <div class="pin-item">
                    <span>📌 ${p.content.substring(0, 25)}...</span>
                    <span onclick="window.unpinMessage('${p.id}')" style="cursor:pointer;">✕</span>
                </div>
            `).join('');
        } else {
            pinBar.style.display = 'none';
        }
    };

    // --- C. DISPLAY MESSAGE ---
    const displayMessage = async (msg) => {
        const isMe = msg.sender_id === user.id;
        const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${isMe ? 'user-wrapper' : 'ai-wrapper'}`;

        const { data: sender } = await supabaseClient
            .from('profiles')
            .select('avatar_url')
            .eq('id', msg.sender_id)
            .maybeSingle();

        const avatarImg = sender?.avatar_url || 'https://i.postimg.cc/rpD4fgxR/IMG-5898-2.jpg';

        wrapper.innerHTML = `
            <img src="${avatarImg}" class="avatar">
            <div class="message ${isMe ? 'sent' : 'received'}">
                <div>${msg.content}</div>
                <div class="msg-time">${timeStr}</div>
            </div>
        `;

        const bubble = wrapper.querySelector('.message');
        bubble.oncontextmenu = (e) => {
            e.preventDefault();
            window.showActionMenu(msg, bubble.cloneNode(true));
        };

        chatBox.appendChild(wrapper);
    };

    // --- D. HISTORY (AUTO-SCROLL TO LATEST) ---
    const { data: history } = await supabaseClient
  .from('messages')
  .select('*')
  .or(
    `and(sender_id.eq.${user.id},receiver_id.eq.${friendID}),and(sender_id.eq.${friendID},receiver_id.eq.${user.id})`
  )
  .order('created_at', { ascending: true });
    
    chatBox.innerHTML = '';
    if (history) {
        for (const msg of history) await displayMessage(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
        window.loadPins();
    }

    // --- E. GHOST PROMPT (FORWARD PLACEHOLDER) ---
    window.showGhostPrompt = (message) => {
        const overlay = document.getElementById('ghost-prompt-overlay');
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="ghost-prompt-tile">
                <div class="prompt-logo">|Just•Abacha😎|</div>
                <div class="prompt-text">${message}</div>
                <button onclick="overlay.style.display='none'">Vibe</button>
            </div>
        `;
    };

    // --- F. ACTION MENU (E2E UI SAFE) ---
    window.showActionMenu = (msg, clonedBubble) => {
        if (![msg.sender_id, msg.receiver_id].includes(user.id)) return;

        const overlay = document.getElementById('chat-overlay');
        const menuContainer = document.getElementById('menu-content');
        const isPinned = currentPins.some(p => p.id === msg.id);

        menuContainer.innerHTML = '';
        clonedBubble.classList.add('popped-message');

        const tile = document.createElement('div');
        tile.className = 'action-tile';
        tile.innerHTML = `
            <div class="action-item" onclick="window.triggerReply('${msg.sender_id}','${msg.content.replace(/'/g, "\\'")}')">Reply ✍️</div>
            <div class="action-item" onclick="navigator.clipboard.writeText('${msg.content}')">Copy 📑</div>
            <div class="action-item" onclick="window.showGhostPrompt('Forward coming soon 🍻')">Forward 📤</div>
            <div class="action-item" onclick="${isPinned ? `window.unpinMessage('${msg.id}')` : `window.openPinModal('${msg.id}','${msg.content.replace(/'/g, "\\'")}')`}">
                ${isPinned ? 'Unpin 📌' : 'Pin 📌'}
            </div>
            <div class="action-item delete" onclick="window.deleteMessage('${msg.id}')">Delete 🗑️</div>
        `;

        menuContainer.appendChild(clonedBubble);
        menuContainer.appendChild(tile);
        overlay.style.display = 'flex';
    };

    // --- G. REPLY ---
    window.triggerReply = async (senderId, content) => {
        replyingTo = { sender: senderId === user.id ? "Me" : friend.username, content };
        const container = document.getElementById('reply-preview-container');
        container.style.display = 'block';
        container.innerHTML = `
            <div>
                <strong>Replying to ${replyingTo.sender}</strong>
                <span onclick="window.cancelReply()">✕</span>
            </div>
        `;
        document.getElementById('chat-overlay').style.display = 'none';
    };

    // --- H. SEND (UNCHANGED DATA MODEL) ---
    const handleSend = async () => {
        const message = msgInput.value.trim();
        if (!message) return;

        let content = message;
        if (replyingTo) {
            content = `↳ [Replying to ${replyingTo.sender}: ${replyingTo.content}]\n${message}`;
            window.cancelReply();
        }

        await supabaseClient.from('messages').insert([{
            content,
            sender_id: user.id,
            receiver_id: friendID,
            sender_email: user.email
        }]);

        msgInput.value = "";
    };

    sendBtn.onclick = handleSend;
    msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };

    // --- I. REALTIME ---
    supabaseClient
        .channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            if (
                (payload.new.sender_id === user.id && payload.new.receiver_id === friendID) ||
                (payload.new.sender_id === friendID && payload.new.receiver_id === user.id)
            ) {
                displayMessage(payload.new).then(() => {
                    chatBox.scrollTop = chatBox.scrollHeight;
                });
            }
        })
        .subscribe();
});
