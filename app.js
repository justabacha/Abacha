// ================================
// SUPABASE CONFIG
// ================================
const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ================================
// GHOST ENGINE MAIN LOGIC
// ================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('👻 Ghost Engine: Online');

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');
    const signupButton = document.getElementById('signup-btn');

    // 1. 🔥 BUTTON COLOR & UNLOCK LOGIC
    if (passwordInput && loginButton && signupButton) {
        passwordInput.addEventListener('input', () => {
            if (passwordInput.value.length >= 6) {
                // UNLOCKED: Login is Green, Signup is Blue
                loginButton.style.background = "#32D74B"; // Green per instructions
                loginButton.style.color = "white";
                loginButton.style.pointerEvents = "auto";
                loginButton.style.opacity = "1";

                signupButton.style.background = "#007AFF"; // Blue per instructions
                signupButton.style.color = "white";
                signupButton.style.border = "none";
                signupButton.style.pointerEvents = "auto";
                signupButton.style.opacity = "1";
            } else {
                // LOCKED: Reset to default
                loginButton.style.background = "white";
                loginButton.style.color = "black";
                loginButton.style.pointerEvents = "none";
                loginButton.style.opacity = "0.6";

                signupButton.style.background = "transparent";
                signupButton.style.color = "white";
                signupButton.style.border = "1px solid rgba(255,255,255,0.4)";
                signupButton.style.pointerEvents = "none";
                signupButton.style.opacity = "0.6";
            }
        });
    }

    // 2. 🔐 LOGIN ACTION (Matches your original flow)
    if (loginButton) {
        loginButton.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            
            if (error) alert("Ghost Access Denied: " + error.message);
            else window.location.href = 'hub.html';
        });
    }

    // 3. ✨ SIGNUP ACTION
    if (signupButton) {
        signupButton.onclick = async () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            const { error } = await supabaseClient.auth.signUp({ email, password });
            
            if (error) alert("Signup Error: " + error.message);
            else alert("Welcome! Verify your email to login.");
        };
    }

    // 4. 🚀 HUB IDENTITY SYNC (Runs only on Hub.html)
    if (!document.body.classList.contains('login-page')) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            window.location.replace('index.html');
            return;
        }

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('avatar_url, username, city')
            .eq('id', user.id)
            .maybeSingle();

        if (profile) {
            document.querySelectorAll('#user-avatar, .avatar-circle, .nav-avatar, .chat-avatar').forEach(el => {
                if (profile.avatar_url) {
                    el.style.backgroundImage = `url(${profile.avatar_url})`;
                    el.style.backgroundSize = 'cover';
                    el.style.backgroundPosition = 'center';
                }
            });
            document.querySelectorAll('#display-username, .ghost-alias-text, .chat-user-name').forEach(el => {
                if (profile.username) el.innerText = profile.username;
            });
            const cityElement = document.getElementById('hub-city-label');
            if (cityElement && profile.city) cityElement.innerText = profile.city;
        }
    }

    // 5. ⏰ CLOCK
    const timeEl = document.getElementById('time');
    if (timeEl) {
        setInterval(() => {
            const now = new Date();
            timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }
});
    
