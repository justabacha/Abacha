document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('user-search');
    const discoveryList = document.getElementById('discovery-list');
    const requestsList = document.getElementById('requests-list');

    const currentUser = (await supabaseClient.auth.getUser()).data.user;

    const loadDiscovery = async (searchTerm = '') => {
        let query = supabaseClient.from('profiles').select('*').neq('id', currentUser.id);
        if (searchTerm) { query = query.ilike('username', `%${searchTerm}%`); }
        const { data: users } = await query.limit(20);
        if (users) {
            discoveryList.innerHTML = users.map(user => `
                <div class="user-tile">
                    <div class="user-info">
                        <div class="user-name">@${user.username}</div>
                        <div class="user-bio">${user.bio || 'Silence is gold in the Ghost Layer.'}</div>
                    </div>
                    <button class="request-btn" onclick="sendVibeRequest('${user.id}', '${user.username}', this)">Connect</button>
                </div>
            `).join('');
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
                    <div class="vibe-msg">🤓 yoow this is <b>@${r.profiles.username}</b> I want to start a vibe add me to ur inner circle.</div>
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
window.sendVibeRequest = async (targetId, targetName, btnElement) => {
    // PREVENT MULTIPLE CLICKS IMMEDIATELY
    if (btnElement.disabled) return; 
    btnElement.disabled = true;
    btnElement.innerText = "Connecting...";
    btnElement.style.opacity = "0.5";

    const { error } = await supabaseClient
        .from('friendships')
        .insert([{ sender_id: currentUser.id, receiver_id: targetId, status: 'pending' }]);

    if (error) {
        btnElement.innerText = "Limit Reached";
        btnElement.style.color = "#FF3B30";
        btnElement.disabled = false; // Let them try again if it was just a glitch
    } else {
        btnElement.innerText = "Vibe Sent 🤓";
        btnElement.style.background = "rgba(50, 215, 75, 0.4)";
    }
};

window.handleVibe = async (requestId, action) => {
    // SHOW LOADING IMMEDIATELY
    const overlay = document.getElementById('global-modal-overlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="ghost-modal-tile">Processing...</div>';

    if (action === 'accept') {
        const { error } = await supabaseClient.from('friendships').update({ 
            status: 'accepted',
            updated_at: new Date().toISOString() 
        }).eq('id', requestId);

        if (!error) {
            overlay.innerHTML = `
                <div class="ghost-modal-tile" style="text-align: center;">
                    <p style="font-size: 16px; margin-bottom: 20px;">✅ You just accepted the request.</p>
                    <button class="metamorphism-blue-btn" style="width: 100%; padding: 15px;" onclick="window.location.href='chat.html'">Send a Vibe</button>
                </div>`;
        }
    } else {
        await supabaseClient.from('friendships').delete().eq('id', requestId);
        location.reload(); // Hard refresh to clear the list quickly
    }
};
    
    // --- HELPER FUNCTIONS FOR MODALS ---
    window.showGlobalModal = (html) => {
        const overlay = document.getElementById('global-modal-overlay');
        overlay.innerHTML = html;
        overlay.style.display = 'flex';
    };

    window.closeModal = () => {
        document.getElementById('global-modal-overlay').style.display = 'none';
    };

    searchInput.addEventListener('input', (e) => loadDiscovery(e.target.value));
    loadDiscovery();
    loadRequests();
});
            
