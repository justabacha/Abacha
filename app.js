const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Ghost Engine: Online");

    const syncGlobalIdentity = async () => {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('avatar_url, username, city')
            .eq('id', user.id)
            .maybeSingle(); // FIX: Changed .single() to .maybeSingle()

        if (profile) {
            const pfpElements = document.querySelectorAll('#user-avatar, .avatar-circle, .nav-avatar, .chat-avatar');
            pfpElements.forEach(el => {
                if (profile.avatar_url) {
                    el.style.backgroundImage = `url(${profile.avatar_url})`;
                    el.style.backgroundSize = 'cover';
                    el.style.backgroundPosition = 'center';
                }
            });

            const nameElements = document.querySelectorAll('#display-username, .ghost-alias-text, .chat-user-name');
            nameElements.forEach(el => {
                if (profile.username) el.innerText = profile.username;
            });

            const cityElement = document.getElementById('hub-city-label');
            if (cityElement && profile.city) cityElement.innerText = profile.city;
        }
    };
    
    syncGlobalIdentity();

    // Login/Signup Logic (Keeping your original code exactly)
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');
    const signupButton = document.getElementById('signup-btn');

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            if (passwordInput.value.length >= 6) { 
                loginButton.style.background = "#32D74B";
                loginButton.style.color = "white";
                signupButton.style.background = "#007AFF";
                signupButton.style.border = "none";
            } else {
                loginButton.style.background = "white";
                loginButton.style.color = "black";
                signupButton.style.background = "transparent";
                signupButton.style.border = "1px solid rgba(255,255,255,0.4)";
            }
        });
    }

    if (loginButton) {
        loginButton.onclick = async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) alert("Ghost Access Denied: " + error.message);
            else window.location.href = 'hub.html';
        };
    }

    if (signupButton) {
        signupButton.onclick = async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const { error } = await supabaseClient.auth.signUp({ email, password });
            if (error) alert("Signup Error: " + error.message);
            else alert("Welcome! Verify your email to login.");
        };
    }
    
    if (document.getElementById('time')) {
        setInterval(() => {
            const now = new Date();
            document.getElementById('time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }
});
            
