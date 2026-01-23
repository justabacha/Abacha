// --- CHAT ROOM BRAIN ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get current user from the already connected client
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');

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
        }, 600); // 0.6 seconds hold
    };

    const cancelPress = () => clearTimeout(pressTimer);

    bubble.addEventListener('touchstart', startPress);
    bubble.addEventListener('touchend', cancelPress);
    bubble.addEventListener('touchmove', cancelPress);
    // --- END LONG PRESS ---

    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
};

// Function to show the Menu
const showActionMenu = (msg, clonedBubble) => {
    const overlay = document.getElementById('chat-overlay');
    const menuContainer = document.getElementById('menu-content');
    
    // Clear old content
    menuContainer.innerHTML = '';
    
    // Add the "popped" bubble
    clonedBubble.classList.add('popped-message');
    menuContainer.appendChild(clonedBubble);
    
    // Add the Action Tile
    const tile = document.createElement('div');
    tile.className = 'action-tile';
    tile.innerHTML = `
        <div class="action-item" onclick="navigator.clipboard.writeText('${msg.content}')">Copy <span>📑</span></div>
        <div class="action-item">Reply <span>✍️</span></div>
        <div class="action-item">Forward <span>📤</span></div>
        <div class="action-item">Pin <span>📌</span></div>
        <div class="action-item delete" onclick="deleteMessage('${msg.id}')">Delete <span>🗑️</span></div>
    `;
    menuContainer.appendChild(tile);
    
    overlay.style.display = 'flex';
};

        // 2. Load Past Messages
        const { data: history } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: true });
        history?.forEach(displayMessage);

        // 3. Listen for New Messages LIVE
        supabaseClient.channel('messages').on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages' 
        }, payload => {
            displayMessage(payload.new);
        }).subscribe();

        // 4. Send Message Logic
        const handleSend = async () => {
            const message = msgInput.value.trim();
            if (message !== "") {
                await supabaseClient.from('messages').insert([{ 
                    content: message, 
                    sender_email: user.email 
                }]);
                msgInput.value = "";
            }
        };

        if (sendBtn) sendBtn.onclick = handleSend;
        if (msgInput) {
            msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
        }
    }
});
              
