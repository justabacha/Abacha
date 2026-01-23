// --- CHAT ROOM BRAIN ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get current user
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');
    
    // --- 🟢 NEW: REPLY STATE ---
    let replyingTo = null;

    if (chatBox && user) {
        // Function to create message bubbles
        const displayMessage = (msg) => {
            const isMe = msg.sender_email === user.email;
            const bubble = document.createElement('div');
            bubble.className = `message ${isMe ? 'sent' : 'received'}`;
            bubble.innerText = msg.content;

            // --- LONG PRESS LOGIC ---
            let pressTimer;
            const startPress = () => {
                pressTimer = setTimeout(() => {
                    showActionMenu(msg, bubble.cloneNode(true));
                }, 600); 
            };
            const cancelPress = () => clearTimeout(pressTimer);

            bubble.addEventListener('touchstart', startPress);
            bubble.addEventListener('touchend', cancelPress);
            bubble.addEventListener('touchmove', cancelPress);

            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
        };

        // --- 🟢 UPDATED: SHOW MENU WITH REPLY ACTION ---
        const showActionMenu = (msg, clonedBubble) => {
            const overlay = document.getElementById('chat-overlay');
            const menuContainer = document.getElementById('menu-content');
            menuContainer.innerHTML = '';
            
            clonedBubble.classList.add('popped-message');
            menuContainer.appendChild(clonedBubble);
            
            const tile = document.createElement('div');
            tile.className = 'action-tile';
            tile.innerHTML = `
                <div class="action-item" onclick="navigator.clipboard.writeText('${msg.content}'); alert('Copied!')">Copy <span>📑</span></div>
                <div class="action-item" onclick="setReply('${msg.sender_email}', '${msg.content}')">Reply <span>✍️</span></div>
                <div class="action-item">Forward <span>📤</span></div>
                <div class="action-item">Pin <span>📌</span></div>
                <div class="action-item delete" onclick="deleteMessage('${msg.id}')">Delete <span>🗑️</span></div>
            `;
            menuContainer.appendChild(tile);
            overlay.style.display = 'flex';
        };

        // --- 🟢 NEW: REPLY HELPER FUNCTIONS ---
        window.setReply = (sender, content) => {
            replyingTo = { sender, content };
            const inputArea = document.querySelector('.floating-input-container');
            let preview = document.getElementById('reply-preview');
            if(!preview) {
                preview = document.createElement('div');
                preview.id = 'reply-preview';
                inputArea.prepend(preview);
            }
            preview.innerHTML = `<div style="background:rgba(255,255,255,0.1); padding:10px; border-left:4px solid #32D74B; font-size:12px; color:white; border-radius:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span>Replying to <b>${sender}</b>: "${content.substring(0, 20)}..."</span>
                <span onclick="cancelReply()" style="color:#FF3B30; font-weight:bold; padding:5px;">✕</span>
            </div>`;
            document.getElementById('chat-overlay').style.display = 'none';
        };

        window.cancelReply = () => {
            replyingTo = null;
            document.getElementById('reply-preview')?.remove();
        };

        // 2. Load Past Messages
        const { data: history } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: true });
        history?.forEach(displayMessage);

        // 3. Listen for New Messages LIVE
        supabaseClient.channel('messages').on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'messages' 
        }, payload => {
            if (payload.eventType === 'INSERT') {
                displayMessage(payload.new);
            } else if (payload.eventType === 'DELETE') {
                location.reload();
            }
        }).subscribe();
            
        // 4. Send Message Logic
        const handleSend = async () => {
            const message = msgInput.value.trim();
            if (message !== "") {
                const payload = { 
                    content: message, 
                    sender_email: user.email 
                };
                
                // If replying, modify the content
                if (replyingTo) {
                    payload.content = `↳ [Replying to ${replyingTo.sender}: ${replyingTo.content}]\n${message}`;
                    cancelReply();
                }

                await supabaseClient.from('messages').insert([payload]);
                msgInput.value = "";
            }
        };

        if (sendBtn) sendBtn.onclick = handleSend;
        if (msgInput) {
            msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
        }
    }
});

// --- THE DELETE BRAIN ---
const deleteMessage = async (messageId) => {
    const confirmDelete = confirm("Permanently wipe this message from the Ghost Layer?");
    if (confirmDelete) {
        const { error } = await supabaseClient.from('messages').delete().eq('id', messageId);
        if (error) {
            alert("Delete failed: " + error.message);
        } else {
            location.reload(); 
        }
    }
};
            
