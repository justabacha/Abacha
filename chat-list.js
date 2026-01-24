document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // 1. Load Pending Vibes
        const loadPending = async () => {
    // We remove the '!friendships_sender_id_fkey' and use the simpler join
    const { data: requests, error } = await supabaseClient
        .from('friendships')
        .select(`
            id,
            sender_id,
            profiles:sender_id (username, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

    if (error) {
        console.error("Ghost Sync Error:", error.message);
        return;
    }

    const container = document.getElementById('pending-list');
    container.innerHTML = requests?.length ? '' : '<p style="color:gray; font-size:12px;">No new requests...</p>';
    
    requests?.forEach(req => {
        const card = document.createElement('div');
        card.className = 'user-card';
        // Note: we use req.profiles because of the alias in the select
        const sender = req.profiles;
        card.innerHTML = `
            <div class="user-avatar" style="background-image: url(${sender?.avatar_url || 'default-avatar.png'})"></div>
            <div class="user-info">
                <h4>${sender?.username || 'Unknown Ghost'}</h4>
                <p>Wants to vibe with you</p>
            </div>
            <button class="accept-btn" onclick="acceptVibe('${req.id}')">Accept</button>
        `;
        container.appendChild(card);
    });
};
    
    // 2. Load Active Chats
    const loadActive = async () => {
        const { data: friends } = await supabaseClient
            .from('friendships')
            .select(`*, sender:profiles!friendships_sender_id_fkey(id, username, avatar_url), receiver:profiles!friendships_receiver_id_fkey(id, username, avatar_url)`)
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const container = document.getElementById('active-chats');
        container.innerHTML = friends?.length ? '' : '<p style="color:gray; font-size:12px;">Find someone to chat with!</p>';

        friends?.forEach(f => {
            const friend = f.sender_id === user.id ? f.receiver : f.sender;
            const card = document.createElement('div');
            card.className = 'user-card';
            card.onclick = () => window.location.href = `chat.html?friend_id=${friend.id}`;
            card.innerHTML = `
                <div class="user-avatar" style="background-image: url(${friend.avatar_url || ''})"></div>
                <div class="user-info">
                    <h4>${friend.username}</h4>
                    <p>Tap to enter tunnel</p>
                </div>
            `;
            container.appendChild(card);
        });
    };

    // 3. Search Logic
    const searchInput = document.getElementById('search-ghost');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', async (e) => {
        const term = e.target.value.trim();
        if (term.length < 2) { searchResults.innerHTML = ''; return; }

        const { data: ghosts } = await supabaseClient
            .from('profiles')
            .select('id, username, avatar_url')
            .ilike('username', `%${term}%`)
            .neq('id', user.id)
            .limit(5);

        searchResults.innerHTML = '';
        ghosts?.forEach(g => {
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <div class="user-avatar" style="background-image: url(${g.avatar_url || ''})"></div>
                <div class="user-info">
                    <h4>${g.username}</h4>
                    <p>New Ghost found</p>
                </div>
                <button class="accept-btn" onclick="sendVibe('${g.id}')">Vibe</button>
            `;
            searchResults.appendChild(card);
        });
    });

    window.sendVibe = async (receiverId) => {
        const { error } = await supabaseClient
            .from('friendships')
            .insert([{ sender_id: user.id, receiver_id: receiverId, status: 'pending' }]);
        
        if (error) alert("Vibe already active or pending!");
        else {
            alert("Vibe sent! 🚀");
            searchInput.value = '';
            searchResults.innerHTML = '';
        }
    };

    window.acceptVibe = async (id) => {
        await supabaseClient.from('friendships').update({ status: 'accepted' }).eq('id', id);
        location.reload();
    };

    loadPending();
    loadActive();
});
            
