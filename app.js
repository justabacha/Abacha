// ================================
// SUPABASE
// ================================
const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ================================
// DOM READY
// ================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('👻 Ghost Engine: Online');

  // ================================
  // LOGIN PAGE LOGIC
  // ================================
  if (document.body.classList.contains('login-page')) {

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');
    const signupButton = document.getElementById('signup-btn');

    // 🔥 Button color logic (RESTORED)
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

    // 🔐 LOGIN
    if (loginButton) {
      loginButton.onclick = async () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          alert("Ghost Access Denied: " + error.message);
        } else {
          window.location.href = 'hub.html';
        }
      };
    }

    // ✨ SIGNUP
    if (signupButton) {
      signupButton.onclick = async () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        const { error } = await supabaseClient.auth.signUp({
          email,
          password
        });

        if (error) {
          alert("Signup Error: " + error.message);
        } else {
          alert("Welcome! Verify your email to login.");
        }
      };
    }

    return; // 🚫 STOP app.js here for login page
  }

  // ================================
  // HUB / OTHER PAGES
  // ================================
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    window.location.replace('index.html');
    return;
  }

  // Identity sync
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('avatar_url, username, city')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    document.querySelectorAll('.chat-avatar, .avatar-circle').forEach(el => {
      if (profile.avatar_url) {
        el.style.backgroundImage = `url(${profile.avatar_url})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
      }
    });

    document.querySelectorAll('.chat-user-name').forEach(el => {
      if (profile.username) el.innerText = profile.username;
    });
  }

  // Clock
  const timeEl = document.getElementById('time');
  if (timeEl) {
    setInterval(() => {
      const now = new Date();
      timeEl.innerText = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }, 1000);
  }
});
