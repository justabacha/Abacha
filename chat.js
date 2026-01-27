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
let activeUser = null;

// caches
const avatarCache = {};

// --- 3. GLOBAL UI HELPERS ---
window.cancelReply = () => {
    document.getElementById('reply-preview-container').style.display = 'none';
    replyingTo = null;
};

window.closeGhostModal = () => {
    document.getElementById('delete-modal').style.display = 'none';
    document.getElementById('pin-modal').style.display = 'none';
    document.getElementById('chat-overlay').style.display = 'none';
    document.getElementById('ghost-prompt-overlay').style.display = 'none';
};

window.deleteMessage = (id) => {
    messageToDelete = id;
    document.getElementById('delete-modal').style.display = 'flex';
    document.getElementById('chat-overlay').style.display = 'none';
};

window.confirmGhostDelete = async () => {
    if (!messageToDelete) return;

    await supabaseClient.from('messages').delete().eq('id', messageToDelete);

    const bubble = document.querySelector(`[data-msg-id="${messageToDelete}"]`);
    if (bubble) bubble.remove();

    messageToDelete = null;
    window.closeGhostModal();
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

    await supabaseClient
        .from('messages')
        .update({ pinned_until: expiry.toISOString() })
        .eq('id', pendingPinMsg.id);

    window.closeGhostModal();
    window.loadPins();
};

window.unpinMessage = async (id) => {
    await supabaseClient.from('messages').update({ pinned_until: null }).eq('id', id);
    window.loadPins();
};

// --- 4. GHOST PROMPT (FORWARD PLACEHOLDER) ---
window.showGhostPrompt = (message) => {
    const overlay = document.getElementById('ghost-prompt-overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="ghost-prompt-tile">
            <div class="prompt-logo">|Just•Abacha😎|</div>
            <div class="prompt-text">${message}</div>
            <button class="vibe-btn" onclick="window.closeGhostModal()">Vibe</button>
        </div>
    `;
};

// --- 5. MAIN CHAT ENGINE ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user || !friendID) return;
    activeUser = user;

    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');

    // --- A. LOCK RECEIVER HEADER ---
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

    // --- B. LOAD PINS (CHAT-SCOPED) ---
    window.loadPins = async () => {
        const now = new Date().toISOString();
        const { data: pins } = await supabaseClient
            .from('messages')
            .select('*')
            .gt('pinned_until', now)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendID}),
                 and(sender_id.eq.${friendID},receiver_id.eq.${user.id})`);

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
        if (
            !(
                (msg.sender_id === user.id && msg.receiver_id === friendID) ||
                (msg.sender_id === friendID && msg.receiver_id === user.id)
            )
        ) return;

        const isMe = msg.sender_id === user.id;
        const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (!avatarCache[msg.sender_id]) {
            const { data } = await supabaseClient
                .from('profiles')
                .select('avatar_url')
                .eq('id', msg.sender_id)
                .maybeSingle();
            avatarCache[msg.sender_id] = data?.avatar_url || 'https://i.postimg.cc/rpD4fgxR/IMG-5898-2.jpg';
        }

        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${isMe ? 'user-wrapper' : 'ai-wrapper'}`;
        wrapper.dataset.msgId = msg.id;

        const avatar = document.createElement('img');
        avatar.src = avatarCache[msg.sender_id];
        avatar.className = 'avatar';

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isMe ? 'sent' : 'received'}`;
        messageDiv.textContent = msg.content;

        const time = document.createElement('div');
        time.className = 'msg-time';
        time.textContent = timeStr;

        messageDiv.appendChild(time);
        wrapper.appendChild(avatar);
        wrapper.appendChild(messageDiv);

        messageDiv.oncontextmenu = (e) => {
            e.preventDefault();
            window.showActionMenu(msg, wrapper.cloneNode(true));
        };

        chatBox.appendChild(wrapper);
    };

    // --- D. LOAD HISTORY (START AT LATEST) ---
    const { data: history } = await supabaseClient
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendID}),
             and(sender_id.eq.${friendID},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

    chatBox.innerHTML = '';
    if (history) {
        for (const msg of history) await displayMessage(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    window.loadPins();

    // --- E. ACTION MENU ---
    window.showActionMenu = (msg, clonedBubble) => {
        if (msg.sender_id !== user.id && msg.receiver_id !== user.id) return;

        const overlay = document.getElementById('chat-overlay');
        const menuContainer = document.getElementById('menu-content');
        const isPinned = currentPins.some(p => p.id === msg.id);

        menuContainer.innerHTML = '';
        clonedBubble.classList.add('popped-message');

        const tile = document.createElement('div');
        tile.className = 'action-tile';
        tile.innerHTML = `
            <div class="action-item" onclick="window.triggerReply('${msg.sender_id}', '${msg.content.replace(/'/g, "\\'")}')">Reply ✍️</div>
            <div class="action-item" onclick="navigator.clipboard.writeText('${msg.content}')">Copy 📑</div>
            <div class="action-item" onclick="window.showGhostPrompt('This feature is coming soon.!🍻')">Forward 📤</div>
            <div class="action-item" onclick="${isPinned ? `window.unpinMessage('${msg.id}')` : `window.openPinModal('${msg.id}', '${msg.content.replace(/'/g, "\\'")}')`}">
                ${isPinned ? 'Unpin' : 'Pin'} 📌
            </div>
            ${msg.sender_id === user.id ? `<div class="action-item delete" onclick="window.deleteMessage('${msg.id}')">Delete 🗑️</div>` : ''}
        `;

        menuContainer.appendChild(clonedBubble);
        menuContainer.appendChild(tile);
        overlay.style.display = 'flex';
    };

    // --- F. REPLY ---
    window.triggerReply = async (senderId, content) => {
        replyingTo = {
            sender: senderId === user.id ? 'Me' : friend.username,
            content
        };

        const container = document.getElementById('reply-preview-container');
        container.style.display = 'block';
        container.innerHTML = `
            <div style="border-left:3px solid #007AFF;padding-left:10px;">
                <div style="color:#007AFF;font-size:10px;">Replying to ${replyingTo.sender}</div>
                <div style="font-size:12px;">${content.substring(0, 30)}...</div>
            </div>
            <span onclick="window.cancelReply()" style="cursor:pointer;color:red;">✕</span>
        `;
        window.closeGhostModal();
    };

    // --- G. SEND ---
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
    sender_email: user.email   // 🔥 THIS WAS MISSING
}]);  

        msgInput.value = '';
    };

    sendBtn.onclick = handleSend;
    msgInput.onkeypress = (e) => e.key === 'Enter' && handleSend();

    // --- H. REALTIME ---
    supabaseClient
        .channel(`chat:${user.id}:${friendID}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            displayMessage(payload.new).then(() => {
                chatBox.scrollTop = chatBox.scrollHeight;
            });
        })
        .subscribe();
});
