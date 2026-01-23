// 1. Connection Keys
const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. The Brain - Starts when any page opens
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Ghost Engine: Online");

    // Get the current user session
    const { data: { user } } = await supabaseClient.auth.getUser();

    // --- 🟢 DYNAMIC BUTTON COLORS LOGIC ---
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');
    const signupButton = document.getElementById('signup-btn');

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            if (passwordInput.value.length >= 6) { 
                loginButton.style.background = "#32D74B"; // Green
                loginButton.style.color = "white";
                signupButton.style.background = "#007AFF"; // Blue
                signupButton.style.border = "none";
            } else {
                loginButton.style.background = "white";
                loginButton.style.color = "black";
                signupButton.style.background = "transparent";
                signupButton.style.border = "1px solid rgba(255,255,255,0.4)";
            }
        });
    }

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

    // --- SETTINGS LOGIC (Logout) ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        };
    }
});
            
