const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    console.log('👻 Ghost Engine: Online');

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');
    const signupButton = document.getElementById('signup-btn');

    // --- 1. BUTTON COLOR & UNLOCK LOGIC (UNCHANGED) ---
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

    // --- 2. GHOST LAYER VERIFICATION UI ---
    window.showGhostVerify = (email) => {
        const layer = document.createElement('div');
        layer.id = "ghost-layer";
        layer.style = "position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(10px);";
        layer.innerHTML = `
            <div style="background:#1c1c1e; padding:30px; border-radius:24px; width:85%; max-width:350px; text-align:center; border:1px solid #333;">
                <div style="color:gray; font-size:12px; margin-bottom:10px; text-align:left;">|Just•Abacha😎|</div>
                <h3 style="color:white; margin:0 0 10px;">Verify Ghost</h3>
                <p style="color:gray; font-size:14px; margin-bottom:20px;">Enter the code sent to your email.</p>
                <input id="otp-input" type="text" placeholder="JA-0000-ABA" style="width:100%; padding:12px; border-radius:10px; background:#2c2c2e; border:none; color:white; text-align:center; font-weight:bold; margin-bottom:20px;">
                <div style="display:flex; gap:10px;">
                    <button id="vibe-verify-btn" style="flex:1; padding:12px; border-radius:12px; background:#32D74B; border:none; color:white; font-weight:bold;">Vibe</button>
                    <button onclick="document.getElementById('ghost-layer').remove()" style="flex:1; padding:12px; border-radius:12px; background:#007AFF; border:none; color:white; font-weight:bold;">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(layer);

        document.getElementById('vibe-verify-btn').onclick = async () => {
            const inputCode = document.getElementById('otp-input').value.trim();
            const { data, error } = await supabaseClient.from('profiles').select('otp_code').eq('email', email).single();

            if (data && data.otp_code === inputCode) {
                await supabaseClient.from('profiles').update({ is_approved: true }).eq('email', email);
                alert("Verified! Logging in...");
                window.location.href = 'hub.html';
            } else {
                alert("Wrong Code. Check your email again.");
            }
        };
    };

    // --- 3. LOGIN ACTION (WITH APPROVAL CHECK) ---
    if (loginButton) {
        loginButton.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            
            if (error) {
                alert("Ghost Access Denied: " + error.message);
                return;
            }

            const { data: profile } = await supabaseClient.from('profiles').select('is_approved').eq('id', data.user.id).single();
            if (profile && profile.is_approved) {
                window.location.href = 'hub.html';
            } else {
                // Not approved: Send code and show pop-up
                fetch('/api/send-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });
                showGhostVerify(email);
            }
        });
    }

    // --- 4. SIGNUP ACTION (TRIGGERS EMAIL) ---
    if (signupButton) {
        signupButton.onclick = async () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            const { error } = await supabaseClient.auth.signUp({ email, password });
            
            if (error) {
                alert("Signup Error: " + error.message);
            } else {
                // Trigger the email engine
                await fetch('/api/send-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });
                showGhostVerify(email);
            }
        };
    }

    // --- 5. HUB SYNC & CLOCK (UNCHANGED) ---
    if (!document.body.classList.contains('login-page')) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) { window.location.replace('index.html'); return; }
        const { data: profile } = await supabaseClient.from('profiles').select('avatar_url, username, city').eq('id', user.id).maybeSingle();
        if (profile) {
            document.querySelectorAll('#user-avatar, .avatar-circle, .nav-avatar, .chat-avatar').forEach(el => {
                if (profile.avatar_url) { el.style.backgroundImage = `url(${profile.avatar_url})`; el.style.backgroundSize = 'cover'; }
            });
            document.querySelectorAll('#display-username, .ghost-alias-text, .chat-user-name').forEach(el => {
                if (profile.username) el.innerText = profile.username;
            });
        }
    }

    const timeEl = document.getElementById('time');
    if (timeEl) {
        setInterval(() => {
            const now = new Date();
            timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }
});
                    
