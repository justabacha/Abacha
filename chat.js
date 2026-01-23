document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');
    let replyingTo = null;
    let messageToDelete = null;

    if (chatBox && user) {
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
                <div class="action-item" onclick="pinMessage('${msg.content.replace(/'/g, "\\'")}')">Pin <span>📌</span></div>
                <div class="action-item delete" onclick="deleteMessage('${msg.id}')">Delete <span>🗑️</span></div>
            `;
            menuContainer.appendChild(tile);
            overlay.style.display = 'flex';
        };

        window.copyToClipboard = (text) => {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            document.getElementById('chat-overlay').style.display = 'none';
        };

        window.pinMessage = (content) => {
            const pinBar = document.getElementById('pinned-bar');
            pinBar.innerHTML = `📌 <b>Pinned:</b> ${content.substring(0, 30)}...`;
            pinBar.style.display = 'block';
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
    
