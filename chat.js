document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');
    let replyingTo = null;

    if (chatBox && user) {
        // --- UPDATED DISPLAY LOGIC (WITH BLUE REPLY QUOTE) ---
        const displayMessage = (msg) => {
            const isMe = msg.sender_email === user.email;
            const bubble = document.createElement('div');
            bubble.className = `message ${isMe ? 'sent' : 'received'}`;

            // Check if message is a reply to style it with the blue distinction
            if (msg.content.includes("↳ [Replying to")) {
                const parts = msg.content.split(']\n');
                const replyHeader = parts[0].replace('↳ [', '');
                const actualMessage = parts[1] || "";

                bubble.innerHTML = `
                    <div class="reply-quote">${replyHeader}</div>
                    <div>${actualMessage}</div>
                `;
            } else {
                bubble.innerText = msg.content;
            }

            // --- LONG PRESS LOGIC ---
            let pressTimer;
            bubble.addEventListener('touchstart', () => {
                pressTimer = setTimeout(() => showActionMenu(msg, bubble.cloneNode(true)), 600);
            });
            bubble.addEventListener('touchend', () => clearTimeout(pressTimer));
            bubble.addEventListener('touchmove', () => clearTimeout(pressTimer));

            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
        };

        // --- UPDATED ACTION MENU (COPY & PIN LOGIC) ---
        const showActionMenu = (msg, clonedBubble) => {
            const overlay = document.getElementById('chat-overlay');
            const menuContainer = document.getElementById('menu-content');
            menuContainer.innerHTML = '';
            clonedBubble.classList.add('popped-message');
            menuContainer.appendChild(clonedBubble);
            
            const tile = document.createElement('div');
            tile.className = 'action-tile';
            tile.innerHTML = `
                <div class="action-item" onclick="copyToClipboard('${msg.content.replace(/'/g, "\\'")}')">Copy <span>📑</span></div>
                <div class="action-item" onclick="setReply('${msg.sender_email}', '${msg.content.replace(/'/g, "\\'")}')">Reply <span>✍️</span></div>
                <div class="action-item">Forward <span>📤</span></div>
                <div class="action-item" onclick="pinMessage('${msg.id}')">Pin <span>📌</span></div>
                <div class="action-item delete" onclick="deleteMessage('${msg.id}')">Delete <span>🗑️</span></div>
            `;
            menuContainer.appendChild(tile);
            overlay.style.display = 'flex';
        };

        // --- CLIPBOARD & PIN HELPERS ---
        window.copyToClipboard = (text) => {
            navigator.clipboard.writeText(text);
            // Optional: You can add a Ghost-style toast notification here later
            document.getElementById('chat-overlay').style.display = 'none';
        };

        window.pinMessage = (id) => {
            console.log("Pinning message:", id);
            // This will link to your Hub Dashboard Pin logic later
            alert("Message pinned to Ghost Hub");
            document.getElementById('chat-overlay').style.display = 'none';
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

        const { data: history } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: true });
        history?.forEach(displayMessage);

        supabaseClient.channel('messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
            if (payload.eventType === 'INSERT') displayMessage(payload.new);
            else if (payload.eventType === 'DELETE') location.reload();
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

const deleteMessage = async (id) => {
    if (confirm("Wipe this message from the Ghost Layer?")) {
        await supabaseClient.from('messages').delete().eq('id', id);
        location.reload();
    }
};
                
