document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('user-search');
    const discoveryList = document.getElementById('discovery-list');
    const requestsList = document.getElementById('requests-list');

    // 1. GET CURRENT USER DATA
    const currentUser = (await supabaseClient.auth.getUser()).data.user;

    // 2. LOAD DISCOVERY LIST (With Live Search)
    const loadDiscovery = async (searchTerm = '') => {
        let query = supabaseClient.from('profiles').select('*').neq('id', currentUser.id);

        if (searchTerm) {
            query = query.ilike('username', `%${searchTerm}%`);
        }

        const { data: users, error } = await query.limit(20);

        if (users) {
            discoveryList.innerHTML = users.map(user => `
                <div class="user-tile">
                    <div class="user-info">
                        <div class="user-name">@${user.username}</div>
                        <div class="user-bio">${user.bio || 'Silence is gold in the Ghost Layer.'}</div>
                    </div>
                    <button class="request-btn" onclick="sendVibeRequest('${user.id}', '${user.username}')">
                        Connect
                    </button>
                </div>
            `).join('');
        }
    };

    // 3. LOAD INCOMING REQUESTS
    const loadRequests = async () => {
        const { data: reqs, error } = await supabaseClient
            .from('friendships')
            .select(`
                id,
                sender_id,
                profiles!friendships_sender_id_fkey (username)
            `)
            .eq('receiver_id', currentUser.id)
            .eq('status', 'pending');

        if (reqs && reqs.length > 0) {
            requestsList.innerHTML = reqs.map(r => `
                <div class="vibe-card">
                    <div class="vibe-msg">
                        🤓 yoow this is <b>@${r.profiles.username}</b> I want to start a vibe add me to ur inner circle.
                    </div>
                    <div class="vibe-footer">...Just•Abacha😎...</div>
                    <div class="action-row">
                        <button class="btn-deny" onclick="handleVibe('${r.id}', 'deny')">Deny</button>
                        <button class="btn-accept" onclick="handleVibe('${r.id}', 'accept')">Accept</button>
                    </div>
                </div>
            `).join('');
        } else {
            requestsList.innerHTML = '<p style="opacity:0.3; font-size:12px; padding:10px;">No pending vibes...</p>';
        }
    };

    // 4. ACTION FUNCTIONS
    window.sendVibeRequest = async (targetId, targetName) => {
        const { error } = await supabaseClient
            .from('friendships')
            .insert([{ sender_id: currentUser.id, receiver_id: targetId, status: 'pending' }]);

        if (error) {
            alert("Vibe already sent or connection exists.");
        } else {
            alert(`Vibe sent to @${targetName}! 🤓`);
        }
    };

    window.handleVibe = async (requestId, action) => {
        if (action === 'accept') {
            await supabaseClient.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
            alert("Vibe Accepted. Inner Circle expanded.");
        } else {
            await supabaseClient.from('friendships').delete().eq('id', requestId);
            alert("Vibe Denied.");
        }
        loadRequests();
        loadDiscovery();
    };

    // 5. INITIALIZE & LISTENERS
    searchInput.addEventListener('input', (e) => loadDiscovery(e.target.value));
    loadDiscovery();
    loadRequests();
});
                                                
