// Safety Check: Wait for Supabase to be ready
const initializeDiscovery = async () => {
    // 1. SELECT UI ELEMENTS IMMEDIATELY
    const searchInput = document.getElementById('user-search');
    const discoveryList = document.getElementById('discovery-list');
    const requestsList = document.getElementById('requests-list');

    // 2. SHOW LOADING STATE IMMEDIATELY (Before Auth/Data)
    // This makes the page feel instant on your phone
    if (discoveryList) discoveryList.innerHTML = '<p style="color: #32D74B; font-size: 12px; padding: 15px; font-weight: bold; animation: pulse 1.5s infinite;">Searching the Ghost Layer... 🤓</p>';
    if (requestsList) requestsList.innerHTML = '<p style="color: #fff; opacity: 0.3; font-size: 10px; padding: 15px;">Scanning vibes...</p>';

    try {
        // 3. WAIT FOR SUPABASE CLIENT
        if (typeof supabaseClient === 'undefined') {
            setTimeout(initializeDiscovery, 300);
            return;
        }

        // 4. GET USER (The "Heavy" Part)
        const { data: authData } = await supabaseClient.auth.getUser();
        const currentUser = authData?.user;

        if (!currentUser) {
            discoveryList.innerHTML = '<p style="color: #FF3B30; font-size: 12px; padding: 15px;">Session expired. Please re-login.</p>';
            return;
        }

        // --- CORE FUNCTIONS ---
        const loadDiscovery = async (searchTerm = '') => {
            // 1. GET ALL EXISTING CONNECTIONS (EXCLUSION LIST)
            const { data: connections } = await supabaseClient
                .from('friendships')
                .select('sender_id, receiver_id')
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

            // 2. BUILD AN ARRAY OF IDs TO HIDE
            // We start with your own ID so you don't find yourself
            const excludedIDs = [currentUser.id];
            
            if (connections) {
                connections.forEach(conn => {
                    excludedIDs.push(conn.sender_id);
                    excludedIDs.push(conn.receiver_id);
                });
            }

            // 3. QUERY PROFILES (BUT EXCLUDE THE LIST)
            let query = supabaseClient
                .from('profiles')
                .select('*')
                .not('id', 'in', `(${excludedIDs.join(',')})`); // The Ghost Filter

            if (searchTerm) { 
                query = query.ilike('username', `%${searchTerm}%`); 
            }
            
            const { data: users, error } = await query.limit(15);
            
            // 4. RENDER (Your original UI logic)
            if (users && users.length > 0) {
                discoveryList.innerHTML = users.map(user => `
                    <div class="user-tile">
                        <div class="user-info">
                            <div class="user-name">@${user.username}</div>
                            <div class="user-bio">${user.bio || 'Silence is gold.'}</div>
                        </div>
                        <button class="request-btn" onclick="sendVibeRequest('${user.id}', '${user.username}', this)">Connect</button>
                    </div>
                `).join('');
            } else {
                discoveryList.innerHTML = '<p style="opacity:0.4; font-size:12px; padding:20px;">No new ghosts found. 👻</p>';
            }
        };
        
        const loadRequests = async () => {
            const { data: reqs } = await supabaseClient
                .from('friendships')
                .select(`id, sender_id, profiles!friendships_sender_id_fkey (username)`)
                .eq('receiver_id', currentUser.id)
                .eq('status', 'pending');

            if (reqs && reqs.length > 0) {
                requestsList.innerHTML = reqs.map(r => `
                    <div class="vibe-card">
                        <div class="vibe-msg">🤓 yoow this is <b>@${r.profiles.username}</b> I want to start a vibe.</div>
                        <div class="action-row">
                            <button class="btn-deny" onclick="handleVibe('${r.id}', 'deny')">Deny</button>
                            <button class="btn-accept" onclick="handleVibe('${r.id}', 'accept')">Accept</button>
                        </div>
                    </div>
                `).join('');
            } else {
                requestsList.innerHTML = '<p style="opacity:0.3; font-size:11px; padding:10px;">No pending vibes.</p>';
            }
        };

        // --- GLOBAL ACTIONS ---

        window.sendVibeRequest = async (targetId, targetName, btn) => {
            if (btn.disabled) return;
            btn.disabled = true;
            btn.innerText = "Sending...";
            const { error } = await supabaseClient.from('friendships').insert([{ sender_id: currentUser.id, receiver_id: targetId, status: 'pending' }]);
            btn.innerText = error ? "Already Sent" : "Vibe Sent 🤓";
            btn.style.opacity = "0.7";
        };

        window.handleVibe = async (requestId, action) => {
            if (action === 'accept') {
                await supabaseClient.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', requestId);
                showGlobalModal(`
                    <div class="ghost-modal-tile" style="text-align:center;">
                        <p>✅ Vibe Accepted!</p>
                        <button class="metamorphism-blue-btn" style="width:100%; padding:14px; margin-top:15px;" onclick="window.location.href='chat.html'">Send Vibe</button>
                    </div>
                `);
            } else {
                await supabaseClient.from('friendships').delete().eq('id', requestId);
                loadRequests();
            }
        };

        window.showGlobalModal = (html) => {
            const overlay = document.getElementById('global-modal-overlay');
            if (overlay) {
                overlay.innerHTML = html;
                overlay.style.display = 'flex';
            } else { alert("Accepted!"); location.href='chat.html'; }
        };

        // --- INITIALIZE ---
        searchInput?.addEventListener('input', (e) => loadDiscovery(e.target.value));
        loadDiscovery();
        loadRequests();

    } catch (err) {
        console.error("Critical Failure:", err);
    }
};

document.addEventListener('DOMContentLoaded', initializeDiscovery);
                    
