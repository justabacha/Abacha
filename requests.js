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
                    <button class="request-btn" onclick="sendVibeRequest('${user.id}', '${user.username}', this)">
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

    // 4. ACTION FUNCTIONS (UPDATED WITH ANIMATION)
    window.sendVibeRequest = async (targetId, targetName, btnElement) => {
        const originalText = btnElement.innerText;
        btnElement.innerText = "Sending...";
        btnElement.style.opacity = "0.5";
        btnElement.disabled = true;

        const { error } = await supabaseClient
            .from('friendships')
            .insert([{ sender_id: currentUser.id, receiver_id: targetId, status: 'pending' }]);

        if (error) {
            btnElement.innerText = "Already Sent";
            btnElement.style.color = "#FF3B30";
            btnElement.style.opacity = "1";
        } else {
            btnElement.innerText = "Vibe Sent 🤓";
            btnElement.style.background = "rgba(50, 215, 75, 0.4)";
            btnElement.style.color = "#fff";
            btnElement.style.opacity = "1";
            btnElement.style.border = "1px solid #32D74B";
        }
    };

    window.handleVibe = async (requestId, action) => {
        if (action === 'accept') {
            await supabaseClient.from('friendships').update({ 
                status: 'accepted',
                updated_at: new Date().toISOString() 
            }).eq('id', requestId);
            
            // CUSTOM UI FOR THE RECEIVER
            const successHTML = `
                <div class="ghost-modal-tile" style="text-align: center;">
                    <p style="font-size: 16px; margin-bottom: 20px;">✅ You just accepted the request.</p>
                    <button class="metamorphism-blue-btn" style="width: 100%; padding: 15px;" onclick="window.location.href='chat.html'">
                        Send a Vibe
                    </button>
                </div>
            `;
            showGlobalModal(successHTML);
        } else {
            await supabaseClient.from('friendships').delete().eq('id', requestId);
            closeModal();
            loadRequests();
            loadDiscovery();
        }
    };

    // 5. INITIALIZE & LISTENERS
    searchInput.addEventListener('input', (e) => loadDiscovery(e.target.value));
    loadDiscovery();
    loadRequests();
});
        
