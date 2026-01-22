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
            
// --- BUCKET LIST LOGIC ---
const addTodoBtn = document.getElementById('add-todo-btn');
if (addTodoBtn) {
    // 1. Function to Load Items
    const loadTodos = async () => {
        const { data: todos } = await supabaseClient.from('bucket_list').select('*').order('created_at', { ascending: false });
        const container = document.getElementById('todo-container');
        container.innerHTML = '';
        
        todos.forEach(item => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.innerHTML = `
                <div>
                    <strong style="${item.is_completed ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${item.title}</strong>
                    <p style="font-size: 12px; margin: 5px 0 0 0; opacity: 0.6;">${item.target_date || 'No date'}</p>
                </div>
                <input type="checkbox" ${item.is_completed ? 'checked' : ''} onclick="toggleTodo('${item.id}', ${item.is_completed})">
            `;
            container.appendChild(card);
        });
    };

    // 2. Function to Add Item
    addTodoBtn.onclick = async () => {
        const title = document.getElementById('todo-input').value;
        const date = document.getElementById('todo-date').value;
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (title) {
            await supabaseClient.from('bucket_list').insert([{ 
                title, 
                target_date: date, 
                user_email: user.email 
            }]);
            document.getElementById('todo-input').value = '';
            loadTodos();
        }
    };

    // 3. Run on Load
    loadTodos();
}

// Global Toggle Function
window.toggleTodo = async (id, currentState) => {
    await supabaseClient.from('bucket_list').update({ is_completed: !currentState }).eq('id', id);
    location.reload(); // Refresh to show changes
};
                
// --- SETTINGS LOGIC ---
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    // Show current user
    const displayUser = async () => {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) document.getElementById('user-display-email').innerText = user.email;
    };
    displayUser();

    // Logout Action
    logoutBtn.onclick = async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    };
            }
            
