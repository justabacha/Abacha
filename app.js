// Initialize Supabase
const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Wait for the screen to be fully ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("Ghost Brain Active");

    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');

    // --- SIGNUP LOGIC ---
    if (signupBtn) {
        signupBtn.onclick = async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) return alert("Enter email and password");

            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            
            if (error) {
                alert("Signup Error: " + error.message);
            } else {
                alert("Account Created! You can now Login.");
            }
        };
    }

    // --- LOGIN LOGIC ---
    if (loginBtn) {
        loginBtn.onclick = async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) return alert("Enter email and password");

            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

            if (error) {
                alert("Login Error: " + error.message);
            } else {
                // This pushes you to the next screen
                window.location.href = './hub.html';
            }
        };
    }
});
            
