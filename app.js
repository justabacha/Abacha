const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // 1. SIGNUP
    document.getElementById('signup-btn').onclick = async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) alert("Error: " + error.message);
        else alert("Account Created! Now tap Login.");
    };

    // 2. LOGIN
    document.getElementById('login-btn').onclick = async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) alert("Login Failed: " + error.message);
        else {
            alert("Welcome to the Ghost Layer!");
            window.location.href = './hub.html';
        }
    };
});
            
