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
// --- GLOBAL GHOST LISTENER (IN-APP TOASTS) ---
const startGlobalListener = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    supabaseClient
        .channel('global_notifications')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${user.id}` 
        }, async (payload) => {
            const msg = payload.new;
            
            // Fetch sender name for the toast
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('id', msg.sender_id)
                .single();

            const senderName = profile?.username || "Someone";
            
            // Trigger the slick pop-up!
            if (window.GhostNotifications) {
                window.GhostNotifications.showInAppToast(senderName, msg.content, msg.sender_id);
            }
        })
        .subscribe();
};

// Start listening for vibes
startGlobalListener();
// --- 2. GHOST PROMPT ENGINE ---
function ghostPrompt(message, type = "success") {
    let container = document.getElementById('ghost-prompt-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ghost-prompt-container';
        document.body.appendChild(container);
    }

    const tile = document.createElement('div');
    const isSuccess = type === "success";
    const btnColor = isSuccess ? "#32D74B" : "#007AFF"; 
    const btnText = isSuccess ? "vibe" : "ok";

    tile.className= 'ghost-tile';
    
   tile.innerHTML = `
    <div class="header">
        <span style="letter-spacing: 1px;">|Just•Abacha😎|</span>
        <span onclick="this.parentElement.parentElement.remove()" style="cursor:pointer; font-size: 14px; padding: 4px;">✕</span>
    </div>
    <div style="font-size: 13px; margin: 4px 0 14px 0; line-height: 1.4; color: #efefef; text-align: center;">
        ${message}
    </div>
    <button class="vibe-btn ${isSuccess ? 'bg-green' : 'bg-blue'}" onclick="this.parentElement.remove()" style="margin-top: auto;">
        ${btnText}
    </button>
`;

    if (!document.getElementById('ghost-anim')) {
        const style = document.createElement('style');
        style.id = 'ghost-anim';
       style.innerHTML = `
            @keyframes ghostSlide { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes ghostBlinkRed { 0% { background: #FF3B30; } 50% { background: #1c1c1e; } 100% { background: #FF3B30; } }
            .ghost-install-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); z-index: 100000; display: flex; align-items: center; justify-content: center; animation: ghostSlide 0.5s ease; }
            .ghost-install-card { background: rgba(28, 28, 30, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 28px; width: 85%; max-width: 320px; text-align: center; color: white; }
            .ghost-spinner {
                width: 24px; height: 24px;
                border: 3px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: ghostSpin 0.8s linear infinite;
                display: inline-block;
                vertical-align: middle;
            }
            @keyframes ghostSpin { to { transform: rotate(360deg); } }
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

            const { data: profile } = await supabaseClient.from('profiles').select('is_approved').eq('id', data.user.id).maybeSingle();

            if (profile && profile.is_approved) {
                window.location.href = 'hub.html';
            } else {
               // SEAMLESS: LOGIN ONLY (No OTP)
              loginButton.innerText = "Login";
              window.location.href = 'hub.html';
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

            let { data, error } = await supabaseClient.auth.signUp({ 
                email, 
                password,
                options: {
                    data: {
                        username: email.split('@')[0] || "Ghost"
                    }
                }
            });

            if (error && error.message.includes("already registered")) {
                const { data: retryData, error: retryError } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (retryError) {
                    ghostPrompt("Vibe Mismatch: Email taken, different password.", "error");
                    signupButton.innerText = "Sign up";
                    return;
                }
                data = retryData;
                error = null;
            }

            if (error) {
                ghostPrompt("Signup Error: " + error.message, "error");
                signupButton.innerText = "Sign up";
            } else {
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
    layer.style = "position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(10px); transition: background 0.3s ease;";
  layer.innerHTML = `
    <style>
        @keyframes vibeLoaderSpin { to { transform: rotate(360deg); } }
        .vibe-loader { width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: vibeLoaderSpin 0.8s linear infinite; margin: 0 auto; }
    </style>
    <div style="background:#1c1c1e; padding:40px 30px 30px 30px; border-radius:28px; width:88%; max-width:350px; text-align:center; border:1px solid #333; position:relative; box-shadow: 0 30px 60px rgba(0,0,0,0.7);">
        
        <!-- THE ROOF: Absolute Positioning for Premium Feel -->
        <div style="position:absolute; top:15px; left:20px; color:gray; font-size:10px; opacity:0.6;">|Just•Abacha😎|</div>
        <div onclick="document.getElementById('ghost-layer').remove()" style="position:absolute; top:10px; right:15px; color:white; opacity:0.5; cursor:pointer; font-size:20px; padding:5px;">✕</div>

        <h3 style="color:white; margin:10px 0 10px; font-size:22px; letter-spacing:-0.5px;">Verify Ghost</h3>
        <p style="color:gray; font-size:14px; margin-bottom:25px;">Enter the code sent to your email.</p>
        
        <input id="otp-input" type="text" placeholder="JA-0000-ABA" style="width:100%; padding:14px; border-radius:12px; background:#2c2c2e; border:1px solid #444; color:white; text-align:center; font-weight:bold; margin-bottom:20px; text-transform: uppercase; font-size:18px;">

        <!-- Info Hint Tag -->
        <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:25px; color:white; opacity:0.8;">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; border:1px solid white; border-radius:50%; font-size:10px; font-family:serif; font-weight:bold; line-height:1;">i</span>
            <span style="font-size:12px;">Check your spam if not found, mate.</span>
        </div>

        <div style="display:flex; gap:12px;">
            <button id="vibe-verify-btn" style="flex:1; padding:14px; border-radius:14px; background:#32D74B; border:none; color:white; font-weight:bold; cursor:pointer; font-size:14px;">Vibe</button>
            <button id="resend-ghost-btn" style="flex:1; padding:14px; border-radius:14px; background:#007AFF; border:none; color:white; font-weight:bold; cursor:pointer; font-size:14px;">Resend</button>
        </div>
    </div>
`;
    document.body.appendChild(layer);
    // --- RESEND LOGIC ENGINE ---
document.getElementById('resend-ghost-btn').onclick = async () => {
    const resendBtn = document.getElementById('resend-ghost-btn');
    const originalContent = resendBtn.innerHTML;
    
    // Lock button & show loader
    resendBtn.innerHTML = '<div class="vibe-loader"></div>';
    resendBtn.style.pointerEvents = "none";
    resendBtn.style.opacity = "0.7";

    try {
        const response = await fetch('/api/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        if (response.ok) {
            ghostPrompt("New Code Ghosted! Watch your spam, blud.", "success");
            resendBtn.innerHTML = "Sent!";
            resendBtn.style.background = "#32D74B"; // Turn green briefly for success
        } else {
            throw new Error();
        }
    } catch (e) {
        ghostPrompt("Resend Failed. Try again, bestie.", "error");
        resendBtn.innerHTML = "Retry";
    }

    // Reset button after 4 seconds
    setTimeout(() => {
        resendBtn.innerHTML = "Resend";
        resendBtn.style.background = "#007AFF";
        resendBtn.style.pointerEvents = "auto";
        resendBtn.style.opacity = "1";
    }, 4000);
};

    document.getElementById('vibe-verify-btn').onclick = async () => {
        const btn = document.getElementById('vibe-verify-btn');
        const originalBg = btn.style.background;
        const inputCode = document.getElementById('otp-input').value.trim();
        
        // 1. Show only the spinner on the button, lock it
        btn.innerHTML = '<div class="vibe-loader"></div>';
        btn.style.pointerEvents = "none";

        const { data } = await supabaseClient.from('profiles').select('otp_code').eq('email', email).maybeSingle();

        if (data && data.otp_code === inputCode) {
            // 2. Instantly update the DB so they are logged in
            await supabaseClient.from('profiles').update({ is_approved: true }).eq('email', email);
            
            // 3. Fire the ghost prompt on the screen (not the button)
            ghostPrompt("Access Granted. Entering Hub...", "success");

            // 4. Black out everything underneath to physically block the login form from flashing
            const loginContainer = document.getElementById('login-container');
            if (loginContainer) loginContainer.style.opacity = "0";
            layer.style.background = "black";
           // 5. Hold this cover for 3 seconds, then start the fade-out
            setTimeout(() => {
                // Smoothly dissolve the layer
                layer.style.transition = "opacity 1.5s ease";
                layer.style.opacity = "0";
                // Redirect mid-fade so the transition feels connected
                setTimeout(() => {
                    window.location.href = 'onboarding.html';
                }, 1000); 
            }, 3000);
            
        } else {
            // ERROR HANDLING
            btn.innerHTML = "WRONG CODE";
            btn.style.animation = "ghostBlinkRed 0.5s infinite";
            if (navigator.vibrate) navigator.vibrate(500);
            
            setTimeout(() => {
                btn.innerHTML = "Vibe";
                btn.style.animation = "";
                btn.style.background = originalBg;
                btn.style.pointerEvents = "auto";
            }, 2000);
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
// --- 5. GHOST GESTURE & NAV ENGINE (v3 - INTERACTION ARMED) ---
(function() {
    const ghostNavMap = {
        'settings.html': 'hub.html',
        'profile.html': 'settings.html',
        'chat-list.html': 'hub.html',
        'chat.html': 'chat-list.html'
    };

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    let lastBackPress = 0;

    // Function to arm the trap
    const armGhostTrap = () => {
        if (window.location.hash !== '#ghost') {
            // Push state twice to create a "buffer"
            window.history.pushState(null, null, window.location.pathname + '#ghost');
            window.history.pushState(null, null, window.location.pathname + '#ghost');
            console.log("👻 Ghost Engine: Trap Armed via Interaction");
        }
    };

    // Listen for the first touch/click to arm the trap (Bypasses browser restrictions)
    document.addEventListener('touchstart', armGhostTrap, { once: true });
    document.addEventListener('click', armGhostTrap, { once: true });

    window.addEventListener('popstate', function(event) {
        const destination = ghostNavMap[currentPath];

        if (currentPath === 'hub.html') {
            const now = Date.now();
            if (now - lastBackPress < 2000) {
                // Double swipe: Exit
                console.log("👻 Ghost Engine: Exiting...");
            } else {
                lastBackPress = now;
                
                // Trigger Feedback
                if (typeof ghostPrompt === 'function') {
                    ghostPrompt("Swipe again to exit Ghost.", "info");
                }
                
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]); // Double-thump vibration
                }

                // Re-arm the trap immediately
                window.history.pushState(null, null, window.location.pathname + '#ghost');
            }
        } else if (destination) {
            // Navigate to ghost map parent
            window.location.href = destination;
        } else {
            // Prevent going back to login/index if on a functional page
            window.history.pushState(null, null, window.location.pathname + '#ghost');
        }
    }, false);
})();
GhostNotifications.init();
