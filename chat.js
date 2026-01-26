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
let replyingTo = null; // Global for reply system

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');
    
    if (!user || !friendID) return;

    // --- 1. IDENTITY FIX (Targeted) ---
    const syncReceiverHeader = async () => {
        const { data: friend } = await supabaseClient
            .from('profiles').select('avatar_url, username').eq('id', friendID).maybeSingle();
        if (friend) {
            const headerName = document.querySelector('.chat-user-name');
            const headerAvatar = document.querySelector('.chat-avatar');
            if (headerName) headerName.innerText = `~${friend.username}`;
            if (headerAvatar && friend.avatar_url) headerAvatar.style.backgroundImage = `url(${friend.avatar_url})`;
        }
    };
    syncReceiverHeader();

    // --- 2. MESSAGE DISPLAY (With Time & No Storm) ---
    const displayMessage = async (msg) => {
        const isMe = msg.sender_id === user.id || msg.sender_email === user.email;
        const createdAt = new Date(msg.created_at);
        const timeStr = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${isMe ? 'user-wrapper' : 'ai-wrapper'}`;
        
        // Use sender ID to get avatar
        const { data: sender } = await supabaseClient.from('profiles').select('avatar_url').eq('id', msg.sender_id).maybeSingle();
        const avatarImg = sender?.avatar_url || 'https://i.postimg.cc/rpD4fgxR/IMG-5898-2.jpg';

        wrapper.innerHTML = `
            <img src="${avatarImg}" class="avatar">
            <div class="message ${isMe ? 'sent' : 'received'}">
                ${msg.content.includes("↳ [") 
                    ? `<div class="reply-quote">${msg.content.split(']\n')[0].replace('↳ [', '')}</div><div>${msg.content.split(']\n')[1] || ""}</div>`
                    : `<div>${msg.content}</div>`
                }
                <div class="msg-time" style="font-size:9px; opacity:0.5; margin-top:4px; text-align:right;">${timeStr}</div>
            </div>
        `;

        // Long Press Logic
        wrapper.querySelector('.message').oncontextmenu = (e) => {
            e.preventDefault();
            showActionMenu(msg, wrapper.querySelector('.message').cloneNode(true));
        };

        chatBox.appendChild(wrapper);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // --- 3. LOAD HISTORY ---
    const { data: history } = await supabaseClient.from('messages').select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendID}),and(sender_id.eq.${friendID},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
    
    if (history) {
        chatBox.innerHTML = ''; // Clear "Inner Circle" or old text
        history.forEach(displayMessage);
        setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 200);
    }

    // --- 4. REALTIME ---
    supabaseClient.channel('messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if ((payload.new.sender_id === user.id && payload.new.receiver_id === friendID) || 
            (payload.new.sender_id === friendID && payload.new.receiver_id === user.id)) {
            displayMessage(payload.new);
        }
    }).subscribe();

    // --- 5. SEND LOGIC ---
    const handleSend = async () => {
        const message = msgInput.value.trim();
        if (message !== "") {
            let content = message;
            if (replyingTo) { 
                content = `↳ [Replying to ${replyingTo.sender}: ${replyingTo.content}]\n${message}`; 
                window.cancelReply(); 
            }
            await supabaseClient.from('messages').insert([{ 
                content: content, sender_id: user.id, receiver_id: friendID, sender_email: user.email
            }]);
            msgInput.value = "";
        }
    };
    sendBtn.onclick = handleSend;
});

// --- GLOBAL HELPERS (Move these outside the DOMContentLoaded) ---
window.setReply = async (senderEmail, content) => {
    const { data: p } = await supabaseClient.from('profiles').select('username').eq('email', senderEmail).maybeSingle();
    const name = p ? p.username : "Ghost";
    replyingTo = { sender: name, content };
    const container = document.getElementById('reply-preview-container');
    if (container) {
        container.style.display = 'block';
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; color:white;">
                <div style="border-left:2px solid #007AFF; padding-left:10px;">
                    <div style="color:#007AFF; font-size:10px; font-weight:bold;">Replying to ${name}</div>
                    <div style="font-size:12px; opacity:0.8;">${content.substring(0, 25)}...</div>
                </div>
                <span onclick="window.cancelReply()" style="color:#FF3B30; cursor:pointer;">✕</span>
            </div>`;
    }
    document.getElementById('chat-overlay').style.display = 'none';
};

window.cancelReply = () => {
    const container = document.getElementById('reply-preview-container');
    if (container) container.style.display = 'none';
    replyingTo = null;
};
                                                       
