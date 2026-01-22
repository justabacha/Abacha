// 1. Connection Keys
const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. The Brain - Starts when any page opens
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Ghost Engine: Online");

    // Get the current user session
    const { data: { user } } = await supabaseClient.auth.getUser();

    // --- ROOM: HUB (Weather & Clock) ---
    if (document.getElementById('time')) {
        // Start the Digital Clock
        setInterval(() => {
            const now = new Date();
            document.getElementById('time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
        
        // Setup Weather & Quote
        document.getElementById('temp').innerText = "24°C";
        document.getElementById('condition').innerText = "Clear Skies";
        document.getElementById('daily-quote').innerText = "“Ghost Layer: Built by Phestone.”";
    }

    // --- ROOM: CHAT (iMessage Style) ---
    const chatBox = document.getElementById('chat-box');
    if (chatBox && user) {
        // Function to create the bubbles
        const displayMessage = (msg) => {
            const isMe = msg.sender_email === user.email;
            const bubble = document.createElement('div');
            // These classes use the CSS we wrote earlier
            bubble.className = `message ${isMe ? 'sent' : 'received'}`;
            bubble.innerText = msg.content;
            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
        };

        // 1. Load Past Messages
        const { data: history } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: true });
        history?.forEach(displayMessage);

        // 2. Listen for New Messages LIVE
        supabaseClient.channel('messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            displayMessage(payload.new);
        }).subscribe();

        // 3. Send Message Logic
        document.getElementById('send-btn').onclick = async () => {
            const input = document.getElementById('msg-input');
            if (input.value.trim() !== "") {
                await supabaseClient.from('messages').insert([{ 
                    content: input.value, 
                    sender_email: user.email 
                }]);
                input.value = '';
            }
        };
    }

    // --- ROOM: SETTINGS (Profile & Logout) ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        document.getElementById('user-display-email').innerText = user?.email || "Ghost User";
        logoutBtn.onclick = async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        };
    }
});
            
