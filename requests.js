// Safety Check: Wait for Supabase to be ready
const initializeDiscovery = async () => {
    try {
        if (typeof supabaseClient === 'undefined') {
            console.error("Supabase not found. Retrying...");
            setTimeout(initializeDiscovery, 500);
            return;
        }

        const { data: authData } = await supabaseClient.auth.getUser();
        const currentUser = authData?.user;

        if (!currentUser) {
            console.error("No user logged in");
            return;
        }

        const searchInput = document.getElementById('user-search');
        const discoveryList = document.getElementById('discovery-list');
        const requestsList = document.getElementById('requests-list');

        // 1. LOAD DISCOVERY (Optimized for Mobile)
        const loadDiscovery = async (searchTerm = '') => {
            let query = supabaseClient.from('profiles').select('*').neq('id', currentUser.id);
            if (searchTerm) { query = query.ilike('username', `%${searchTerm}%`); }
            
            const { data: users } = await query.limit(15);
            if (users) {
                discoveryList.innerHTML = users.map(user => `
                    <div class="user-tile">
                        <div class="user-info">
                            <div class="user-name">@${user.username}</div>
                            <div class="user-bio">${user.bio || 'Ghosting...'}</div>
                        </div>
                        <button class="request-btn" onclick="sendVibeRequest('${user.id}', '${user.username}', this)">Connect</button>
                    </div>
                `).join('');
            }
        };

        // 2. LOAD PENDING
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
                        <div class="vibe-footer">...Just•Abacha😎...</div>
                        <div class="action-row">
                            <button class="btn-deny" onclick="handleVibe('${r.id}', 'deny')">Deny</button>
                            <button class="btn-accept" onclick="handleVibe('${r.id}', 'accept')">Accept</button>
                        </div>
                    </div>
                `).join('');
            } else {
                requestsList.innerHTML = '<p style="opacity:0.3; font-size:11px;">No pending vibes.</p>';
            }
        };

        // 3. ACTIONS
        window.sendVibeRequest = async (targetId, targetName, btn) => {
            if (btn.disabled) return;
            btn.disabled = true;
            btn.innerText = "Wait...";
            const { error } = await supabaseClient.from('friendships').insert([{ sender_id: currentUser.id, receiver_id: targetId, status: 'pending' }]);
            btn.innerText = error ? "Failed" : "Sent 🤓";
        };

        window.handleVibe = async (requestId, action) => {
            if (action === 'accept') {
                await supabaseClient.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', requestId);
                showGlobalModal(`
                    <div class="ghost-modal-tile" style="text-align:center;">
                        <p>✅ Request Accepted!</p>
                        <button class="metamorphism-blue-btn" style="width:100%; padding:12px; margin-top:10px;" onclick="window.location.href='chat.html'">Send Vibe</button>
                    </div>
                `);
            } else {
                await supabaseClient.from('friendships').delete().eq('id', requestId);
                loadRequests();
            }
        };

        // UI HELPERS
        window.showGlobalModal = (html) => {
            const overlay = document.getElementById('global-modal-overlay');
            if (overlay) {
                overlay.innerHTML = html;
                overlay.style.display = 'flex';
            } else { alert("Accepted!"); location.href='chat.html'; }
        };

        searchInput?.addEventListener('input', (e) => loadDiscovery(e.target.value));
        loadDiscovery();
        loadRequests();

    } catch (err) {
        console.error("Critical Failure:", err);
    }
};

document.addEventListener('DOMContentLoaded', initializeDiscovery);
