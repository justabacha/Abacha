const SUPABASE_URL = 'https://zvkretqhqmxuhgspddpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable__7_K38aDluNYgS0bxLuLfA_aV5-ZnIY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 1. AUTHENTICATION LOGIC ---
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.onclick = async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        else window.location.href = 'hub.html';
    };
}

// --- 2. WEATHER & TIME (For hub.html) ---
if (document.getElementById('weather-widget')) {
    setInterval(() => {
        const now = new Date();
        document.getElementById('time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 1000);

    // Get Weather
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        // Simple weather fetch (replace 'YOUR_API_KEY' with an OpenWeather key later)
        document.getElementById('temp').innerText = "24°C"; 
        document.getElementById('condition').innerText = "Clear Skies";
    });
}

// --- 3. GHOST CHAT (Realtime) ---
async function sendMsg() {
    const text = document.getElementById('msg-input').value;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('messages').insert([{ content: text, sender_email: user.email }]);
    document.getElementById('msg-input').value = '';
}

// Listen for new messages
supabase.channel('public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
    displayMessage(payload.new);
}).subscribe();

// --- 4. GHOST GALLERY (Auto-Delete Logic) ---
async function uploadPhoto(file, durationHours) {
    const { data: { user } } = await supabase.auth.getUser();
    const fileName = `${Date.now()}-${file.name}`;
    
    // 1. Upload to Storage
    await supabase.storage.from('gallery').upload(fileName, file);
    const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fileName);

    // 2. Save to DB with expiry
    const deleteAt = new Date();
    deleteAt.setHours(deleteAt.getHours() + parseInt(durationHours));
    
    await supabase.from('gallery').insert([{ 
        image_url: publicUrl, 
        uploader_email: user.email, 
        delete_at: deleteAt.toISOString() 
    }]);
}

// Cleanup Function (Runs on load)
async function cleanGhostGallery() {
    const now = new Date().toISOString();
    const { data: expired } = await supabase.from('gallery').delete().lt('delete_at', now).select();
    // (Optional: Code to delete from storage as well)
}
cleanGhostGallery();
               
