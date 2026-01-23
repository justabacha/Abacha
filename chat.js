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
            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
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
              
