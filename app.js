// 1. Connection Keys (GLOBAL ACCESS FOR ALL FILES)
window.SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
window.SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Ghost Engine: Online");

    // LOGIN & SIGNUP UI LOGIC
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');
    const signupButton = document.getElementById('signup-btn');

    if (passwordInput && loginButton) {
        passwordInput.addEventListener('input', () => {
            if (passwordInput.value.length >= 6) { 
                loginButton.style.background = "#32D74B";
                loginButton.style.color = "white";
                if(signupButton) {
                    signupButton.style.background = "#007AFF";
                    signupButton.style.border = "none";
                }
            } else {
                loginButton.style.background = "white";
                loginButton.style.color = "black";
                if(signupButton) {
                    signupButton.style.background = "transparent";
                    signupButton.style.border = "1px solid rgba(255,255,255,0.4)";
                }
            }
        });
    }

    if (loginButton) {
        loginButton.onclick = async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) alert("Ghost Access Denied: " + error.message);
            else {
                alert("login successful 👌_phestone welcome you to Just•Abacha😎");
                window.location.href = 'hub.html';
            }
        };
    }

    // HUB ROOM: (Weather, Clock & Quote)
    if (document.getElementById('time')) {
        setInterval(() => {
            const now = new Date();
            document.getElementById('time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
        
        document.getElementById('temp').innerText = "24°C";
        document.getElementById('condition').innerText = "Clear Skies";
        document.getElementById('daily-quote').innerText = "“Ghost Layer: Built by Phestone.”";
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        };
    }
});
