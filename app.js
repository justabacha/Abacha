if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(reg => {
                console.log('Ghost SW: Registered', reg);
                // Check if there is an update waiting
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New Ghost Engine update available. Please refresh.');
                        }
                    };
                };
            })
            .catch(err => console.log('Ghost SW: Failed', err));
    });
}
// --- 1. CONFIGURATION ---
if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
    var SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
}
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// --- GLOBAL ONLINE HEARTBEAT ---
const updatePresence = async () => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user) {
    await supabaseClient
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id);
  }
};

// Update immediately on load, then every 60s
updatePresence();
setInterval(updatePresence, 60000);
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
        style.innerHTML = `
            @keyframes ghostSlide { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .ghost-install-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); z-index: 100000; display: flex; align-items: center; justify-content: center; animation: ghostSlide 0.5s ease; }
            .ghost-install-card { background: rgba(28, 28, 30, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 28px; width: 85%; max-width: 320px; text-align: center; color: white; }
        `;
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
// --- 4. GHOST INSTALL ENGINE ---
let deferredPrompt;

// Check if we should show the button on page load (if event already fired)
window.addEventListener('load', () => {
    if (sessionStorage.getItem('ghost_can_install') === 'true') {
        const fixedBtn = document.getElementById('ghost-install-fixed');
        if (fixedBtn) fixedBtn.style.display = 'block';
    }
});

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Remember for other pages
    sessionStorage.setItem('ghost_can_install', 'true');

    // Show top-right button
    const fixedBtn = document.getElementById('ghost-install-fixed');
    if (fixedBtn) {
        fixedBtn.style.display = 'block';
        fixedBtn.classList.add('pulse-neon'); // Adding the glow
    }

    // Auto-popup logic
    if (!sessionStorage.getItem('ghost_install_shown')) {
        showGhostInstallPopup();
    }
});

function showGhostInstallPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'ghost-install-overlay';
    overlay.id = 'install-overlay';
    overlay.innerHTML = `
        <div class="ghost-install-card">
            <div style="font-size: 40px; margin-bottom: 15px;">👻</div>
            <h3 style="margin:0 0 10px;">Install Just•Abacha</h3>
            <p style="color:gray; font-size:14px; margin-bottom:25px;">Experience the Ghost Engine as a full app for a smoother vibe.</p>
            <button onclick="executeGhostInstall()" style="width:100%; padding:15px; border-radius:15px; background:#32D74B; color:white; border:none; font-weight:bold; cursor:pointer; margin-bottom:12px;">Install Now</button>
            <button onclick="document.getElementById('install-overlay').remove()" style="width:100%; background:transparent; color:gray; border:none; cursor:pointer; font-size:12px;">Maybe Later</button>
        </div>
    `;
    document.body.appendChild(overlay);
    sessionStorage.setItem('ghost_install_shown', 'true');
}

window.executeGhostInstall = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            sessionStorage.removeItem('ghost_can_install');
            cleanupInstallUI();
        }
        deferredPrompt = null;
    } else {
        // If we lost the prompt variable due to navigation, tell user how to do it manually
        ghostPrompt("Tap the browser menu and select 'Install' or 'Add to Home Screen'", "info");
    }
};

function cleanupInstallUI() {
    const btn = document.getElementById('ghost-install-fixed');
    if (btn) btn.remove();
    const overlay = document.getElementById('install-overlay');
    if (overlay) overlay.remove();
}
window.showGhostPrompt = ghostPrompt;

window.addEventListener('appinstalled', () => {
    sessionStorage.removeItem('ghost_can_install');
    cleanupInstallUI();
    console.log('Ghost Engine: Layer Integrated');
});