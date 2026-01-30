Const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- GHOST PROMPT ENGINE ---
function ghostPrompt(message, type = "success") {
    let container = document.getElementById('ghost-prompt-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ghost-prompt-container';
        container.style = "position:fixed; top:60px; left:50%; transform:translateX(-50%); z-index:100000; display:flex; flex-direction:column; gap:12px; align-items: center; width: 100%; pointer-events: none;";
        document.body.appendChild(container);
    }

    const tile = document.createElement('div');
    const isSuccess = type === "success";
    const btnColor = isSuccess ? "#32D74B" : "#007AFF"; 
    const btnText = isSuccess ? "vibe" : "ok";

tile.style = `
    background: rgba(28, 28, 30, 0.85);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px;
    border-radius: 18px;
    width: 280px; /* Slightly wider for better centering */
    color: white;
    font-family: -apple-system, sans-serif;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    animation: ghostSlide 0.4s ease-out;
    pointer-events: auto; /* 🚨 Crucial: This makes the buttons clickable! */
`;
    
    tile.innerHTML = `
        <div style="color:gray; font-size:10px; margin-bottom:8px; display:flex; justify-content:space-between;">
            <span>|Just•Abacha😎|</span>
            <span onclick="this.parentElement.parentElement.remove()" style="cursor:pointer;">✕</span>
        </div>
        <div style="font-size: 14px; margin-bottom: 12px; line-height:1.4;">${message}</div>
        <button onclick="this.parentElement.remove()" style="width:100%; padding:10px; border-radius:10px; border:none; background:${btnColor}; color:white; font-weight:bold; cursor:pointer;">
            ${btnText}
        </button>
    `;

    if (!document.getElementById('ghost-anim')) {
        const style = document.createElement('style');
        style.id = 'ghost-anim';
 style.innerHTML = `
    @keyframes ghostSlide { 
        from { transform: translateY(-30px); opacity: 0; } 
        to { transform: translateY(0); opacity: 1; } 
    }
`;
        document.head.appendChild(style);
    }

    container.appendChild(tile);
    setTimeout(() => { if(tile) tile.remove(); }, 6000);
}

            // ... (Supabase Init and Ghost Prompt Engine stay exactly the same)

document.addEventListener('DOMContentLoaded', async () => {
    console.log('👻 Ghost Engine: Online');

    // 🚨 1. IMMEDIATELY HIDE SPLASH (Added this to the top)
    const splash = document.querySelector('.splash-screen') || document.getElementById('splash');
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
        }, 800); // 0.8s vibe then vanish
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');
    const signupButton = document.getElementById('signup-btn');

    // --- 1. BUTTON COLOR & UNLOCK LOGIC --- (Keep your original code)
    if (passwordInput && loginButton && signupButton) {
        passwordInput.addEventListener('input', () => {
            if (passwordInput.value.length >= 6) {
                loginButton.style.background = "#32D74B";
                loginButton.style.color = "white";
                loginButton.style.pointerEvents = "auto";
                loginButton.style.opacity = "1";
                signupButton.style.background = "#007AFF";
                signupButton.style.color = "white";
                signupButton.style.border = "none";
                signupButton.style.pointerEvents = "auto";
                signupButton.style.opacity = "1";
            } else {
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

    // --- 2. GHOST LAYER VERIFICATION UI --- (Keep your original code)
    // ... (Your showGhostVerify function)

    // --- 3. LOGIN ACTION --- (Keep your original code)
    // ... (Your loginButton.addEventListener)

    // --- 4. SIGNUP ACTION --- (Keep your original code)
    // ... (Your signupButton.onclick)
    
    // --- 5. HUB SYNC & IDENTITY GATEKEEPER --- (The Fixed Version)
    if (!document.body.classList.contains('login-page')) {
        try {
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
                // Sync UI elements (Your original querySelectors)
                document.querySelectorAll('#user-avatar, .avatar-circle, .nav-avatar, .chat-avatar').forEach(el => {
                    if (profile.avatar_url) { 
                        el.style.backgroundImage = `url(${profile.avatar_url})`; 
                        el.style.backgroundSize = 'cover'; 
                    }
                });
                document.querySelectorAll('#display-username, .ghost-alias-text, .chat-user-name').forEach(el => {
                    if (profile.username) el.innerText = profile.username;
                });

                // 🚨 NEW IDENTITY CHECK
                // If they haven't set a username, send them to the profile page
                if (!profile.username || profile.username === "" || profile.username === "New Ghost") {
                    ghostPrompt("Identity Sync Required...", "success");
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 1500);
                }
            }
        } catch (err) {
            console.error("Engine Sync Failure:", err);
        }
    }

    // --- 6. CLOCK --- (Keep your original code)
    const timeEl = document.getElementById('time');
    if (timeEl) {
        setInterval(() => {
            const now = new Date();
            timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }
});
