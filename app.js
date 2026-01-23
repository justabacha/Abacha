// 1. Connection Keys
const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. The Brain - Starts when any page opens
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Ghost Engine: Online");

    // Get the current user session
    const { data: { user } } = await supabaseClient.auth.getUser();

            // --- LOGIN & SIGNUP WITH CUSTOM GHOST ALERTS ---
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            
            if (error) {
                alert("Ghost Access Denied: " + error.message);
            } else {
                // YOUR CUSTOM LOGIN SUCCESS MESSAGE
                alert("login successful 👌_phestone welcome you to Just•Abacha😎");
                window.location.href = 'hub.html';
            }
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const { error } = await supabaseClient.auth.signUp({ email, password });
            
            if (error) {
                alert("Signup Error: " + error.message);
            } else {
                // YOUR CUSTOM SIGNUP WELCOME MESSAGE
                alert("Welcome To Just•Abacha verify ur email to login");
            }
        });
    }
    
    // --- HUB ROOM: (Weather & Clock) ---
    if (document.getElementById('time')) {
        setInterval(() => {
            const now = new Date();
            document.getElementById('time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
        
        document.getElementById('temp').innerText = "24°C";
        document.getElementById('condition').innerText = "Clear Skies";
        document.getElementById('daily-quote').innerText = "“Ghost Layer: Built by Phestone.”";
    }

    // --- CHAT ROOM: (iMessage Style) ---
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('msg-input');

    if (chatBox && user) {
        const displayMessage = (msg) => {
            const isMe = msg.sender_email === user.email;
            const bubble = document.createElement('div');
            bubble.className = `message ${isMe ? 'sent' : 'received'}`;
            bubble.innerText = msg.content;
            chatBox.appendChild(bubble);
            chatBox.scrollTop = chatBox.scrollHeight;
        };

        const { data: history } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: true });
        history?.forEach(displayMessage);

        supabaseClient.channel('messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            displayMessage(payload.new);
        }).subscribe();

        const handleSend = async () => {
            const message = msgInput.value.trim();
            if (message !== "") {
                await supabaseClient.from('messages').insert([{ content: message, sender_email: user.email }]);
                msgInput.value = "";
            }
        };

        if (sendBtn) sendBtn.onclick = handleSend;
        if (msgInput) {
            msgInput.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
        }
    }
            
    // --- SETTINGS ROOM: (Profile & Logout) ---
    const logoutBtn = document.getElementById('logout-btn');
    const emailDisplay = document.getElementById('user-email') || document.getElementById('user-display-email');
    
    if (emailDisplay && user) {
        emailDisplay.innerText = user.email;
    }

    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        };
    }
});
            
