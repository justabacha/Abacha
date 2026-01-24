document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');
    
    let replyingTo = null;
    let messageToDelete = null;
    let pendingPinMsg = null;
    let currentPins = [];

    // --- 1. NOTIFICATION SYSTEM (PULSE & GLOW) ---
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

        if (vibes?.length > 0) {
            const acceptTime = new Date(vibes[0].updated_at);
            if ((new Date() - acceptTime) / 3600000 < 24) {
                showVibeNotification(`@${vibes[0].profiles.username} accepted your vibe!`);
            }
        }
    };

    const subscribeToVibes = () => {
        supabaseClient.channel('vibe-updates').on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'friendships', filter: `sender_id=eq.${user.id}` }, 
            async (payload) => {
                if (payload.new.status === 'accepted') {
                    const { data: rcvr } = await supabaseClient.from('profiles').select('username').eq('id', payload.new.receiver_id).single();
                    if (rcvr) showVibeNotification(`@${rcvr.username} accepted your vibe just now! 🤓`);
                }
            }).subscribe();
    };

    // --- 2. MESSAGE RENDERING ---
    const displayMessage = (msg) => {
        const isMe = msg.sender_email === user.email;
        const bubble = document.createElement('div');
        bubble.className = `message ${isMe ? 'sent' : 'received'}`;
        if (msg.content.includes("↳ [Replying to")) {
            const parts = msg.content.split(']\n');
            bubble.innerHTML = `<div class="reply-quote">${parts[0].replace('↳ [', '')}</div><div>${parts[1] || ""}</div>`;
        } else { bubble.innerText = msg.content; }
        
        bubble.addEventListener('touchstart', () => {
            let pressTimer = setTimeout(() => showActionMenu(msg, bubble.cloneNode(true)), 600);
            bubble.addEventListener('touchend', () => clearTimeout(pressTimer));
        });

        chatBox.appendChild(bubble);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // --- 3. CORE ACTION MENU & PINNING ---
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
            <div class="action-item" onclick="${isPinned ? `unpinMessage('${msg.id}')` : `openPinModal('${msg.id}', '${msg.content.replace(/'/g, "\\'")}')`}">
                ${isPinned ? 'Unpin' : 'Pin'} <span>📌</span>
            </div>
            <div class="action-item delete" onclick="deleteMessage('${msg.id}')">Delete <span>🗑️</span></div>
        `;
        menuContainer.appendChild(tile);
        overlay.style.display = 'flex';
    };

    // --- 4. DATA INITIALIZATION & SEND ---
    const { data: history } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: true });
    history?.forEach(displayMessage);
    
    checkAcceptedVibes();
    subscribeToVibes();

    supabaseClient.channel('messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        if (payload.eventType === 'INSERT') displayMessage(payload.new);
        else if (payload.eventType === 'DELETE') location.reload();
    }).subscribe();

    const handleSend = async () => {
        const message = msgInput.value.trim();
        if (message) {
            let content = replyingTo ? `↳ [Replying to ${replyingTo.sender}: ${replyingTo.content}]\n${message}` : message;
            await supabaseClient.from('messages').insert([{ content, sender_email: user.email }]);
            msgInput.value = "";
            if(replyingTo) cancelReply();
        }
    };

    sendBtn.onclick = handleSend;
    msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
});
                
