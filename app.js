// --- 1. CONFIGURATION ---
if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
    var SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
}
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. GHOST PROMPT ENGINE ---
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
        width: 280px;
        color: white;
        font-family: -apple-system, sans-serif;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        animation: ghostSlide 0.4s ease-out;
        pointer-events: auto;
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
        style.innerHTML = `@keyframes ghostSlide { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
        document.head.appendChild(style);
    }

    container.appendChild(tile);
    setTimeout(() => { if(tile) tile.remove(); }, 6000);
}

// --- 3. MAIN LOGIC ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log('👻 Ghost Engine: Online');

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');
    const signupButton = document.getElementById('signup-btn');
    const loginContainer = document.getElementById('login-container'); // Add this

    // --- NEW: UNLOCK THE LAYER ---
    if (loginContainer) {
        loginContainer.style.pointerEvents = "auto"; 
    }
    // --- BUTTON UNLOCK LOGIC ---
    if (passwordInput && loginButton && signupButton) {
        passwordInput.addEventListener('input', () => {
            if (passwordInput.value.length >= 6) {
                loginButton.style.pointerEvents = "auto";
                loginButton.style.background = "#32D74B";
                loginButton.style.color = "white";
                loginButton.style.opacity = "1";
                loginButton.style.cursor = "pointer";
                signupButton.style.pointerEvents = "auto";
                signupButton.style.background = "#007AFF";
                signupButton.style.color = "white";
                signupButton.style.opacity = "1";
                signupButton.style.cursor = "pointer";
            } else {
                loginButton.style.pointerEvents = "none";
                loginButton.style.background = "white";
                loginButton.style.color = "black";
                loginButton.style.opacity = "0.6";
                loginButton.style.cursor = "not-allowed";
                signupButton.style.pointerEvents = "none";
                signupButton.style.background = "transparent";
                signupButton.style.opacity = "0.6";
                signupButton.style.cursor = "not-allowed";
            }
        });
    }

    // --- LOGIN ACTION ---
    if (loginButton) {
        loginButton.onclick = async () => {
            if (passwordInput.value.length < 6) return;
            const email = emailInput.value;
            const password = passwordInput.value;
            loginButton.innerText = "Checking...";

            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            
            if (error) {
                ghostPrompt("Access Denied: " + error.message, "error");
                loginButton.innerText = "Login";
                return;
            }

            const { data: profile } = await supabaseClient.from('profiles').select('is_approved').eq('id', data.user.id).single();

            if (profile && profile.is_approved) {
                window.location.href = 'hub.html';
            } else {
                await supabaseClient.auth.signOut();
                loginButton.innerText = "Login";
                try {
                    await fetch('/api/send-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email })
                    });
                } catch (e) { console.log("API Bypass active"); }
                showGhostVerify(email);
            }
        };
    }

    // --- SIGNUP ACTION ---
    if (signupButton) {
        signupButton.onclick = async () => {
            if (passwordInput.value.length < 6) return;
            const email = emailInput.value;
            const password = passwordInput.value;
            signupButton.innerText = "Ghosting...";

            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            
            if (error) {
                ghostPrompt("Signup Error: " + error.message, "error");
                signupButton.innerText = "Sign up";
            } else {
                await supabaseClient.auth.signOut();
                signupButton.innerText = "Sign up";
                try {
                    await fetch('/api/send-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email })
                    });
                } catch (e) { console.log("API Bypass active"); }
                showGhostVerify(email);
            }
        };
    }
});

// --- VERIFICATION UI ---
window.showGhostVerify = (email) => {
    const layer = document.createElement('div');
    layer.id = "ghost-layer";
    layer.style = "position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(10px);";
    layer.innerHTML = `
        <div style="background:#1c1c1e; padding:30px; border-radius:24px; width:85%; max-width:350px; text-align:center; border:1px solid #333;">
            <div style="color:gray; font-size:12px; margin-bottom:10px; text-align:left;">|Just•Abacha😎|</div>
            <h3 style="color:white; margin:0 0 10px;">Verify Ghost</h3>
            <p style="color:gray; font-size:14px; margin-bottom:20px;">Enter the code sent to your email.</p>
            <input id="otp-input" type="text" placeholder="JA-0000-ABA" style="width:100%; padding:12px; border-radius:10px; background:#2c2c2e; border:none; color:white; text-align:center; font-weight:bold; margin-bottom:20px; text-transform: uppercase;">
            <div style="display:flex; gap:10px;">
                <button id="vibe-verify-btn" style="flex:1; padding:12px; border-radius:12px; background:#32D74B; border:none; color:white; font-weight:bold; cursor:pointer;">Vibe</button>
                <button onclick="document.getElementById('ghost-layer').remove()" style="flex:1; padding:12px; border-radius:12px; background:#007AFF; border:none; color:white; font-weight:bold; cursor:pointer;">No</button>
            </div>
        </div>
    `;
    document.body.appendChild(layer);

    document.getElementById('vibe-verify-btn').onclick = async () => {
        const btn = document.getElementById('vibe-verify-btn');
        btn.innerText = "Checking...";
        const inputCode = document.getElementById('otp-input').value.trim();
        
        const { data, error } = await supabaseClient.from('profiles').select('otp_code').eq('email', email).maybeSingle();

        if (data && data.otp_code === inputCode) {
            await supabaseClient.from('profiles').update({ is_approved: true }).eq('email', email);
            ghostPrompt("Verified! Access granted.", "success");
            setTimeout(() => location.reload(), 1500); 
        } else {
            btn.innerText = "Vibe";
            ghostPrompt("Ghost Denied: Code mismatch.", "error");
        }
    };
};