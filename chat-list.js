document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // --- NEW: IDENTITY LOCK (Fixes the header swap) ---
    const syncMyHeader = async () => {
        const { data: myProfile } = await supabaseClient
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id) 
            .maybeSingle();

        if (myProfile) {
            const aliasEl = document.getElementById('display-username');
            const avatarEl = document.querySelector('.nav-avatar');
            
            if (aliasEl) aliasEl.innerText = `@${myProfile.username}`;
            if (avatarEl && myProfile.avatar_url) {
                avatarEl.style.backgroundImage = `url(${myProfile.avatar_url})`;
                avatarEl.style.backgroundSize = 'cover';
                avatarEl.style.backgroundPosition = 'center';
            }
        }
    };
    syncMyHeader(); // Run this immediately

    // --- 1. LOAD PENDING VIBES ---
    const loadPending = async () => {
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
        if (!container) return;
        
        container.innerHTML = requests?.length ? '' : '<p style="color:gray; font-size:12px;">No new requests...</p>';
        
        requests?.forEach(req => {
            const card = document.createElement('div');
            card.className = 'user-card';
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
    
    // --- 2. LOAD ACTIVE CHATS (Fixed Double-Row & Wrong Profile) ---
    const loadActive = async () => {
        const { data: friends } = await supabaseClient
            .from('friendships')
            .select(`
                *, 
                sender:profiles!friendships_sender_id_fkey(id, username, avatar_url), 
                receiver:profiles!friendships_receiver_id_fkey(id, username, avatar_url)
            `)
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const container = document.getElementById('active-chats');
        if (!container) return;

        container.innerHTML = friends?.length ? '' : '<p style="color:gray; font-size:12px;">Find someone to chat with!</p>';

        const displayedIDs = new Set();

        friends?.forEach(f => {
            const friend = f.sender_id === user.id ? f.receiver : f.sender;

            if (friend && !displayedIDs.has(friend.id)) {
                displayedIDs.add(friend.id);

                const card = document.createElement('div');
                card.className = 'user-card';
                card.onclick = () => window.location.href = `chat.html?friend_id=${friend.id}`;
                
                card.innerHTML = `
                    <div class="user-avatar" style="background-image: url(${friend.avatar_url || 'default-avatar.png'})"></div>
                    <div class="user-info">
                        <h4>${friend.username || 'Ghost'}</h4>
                        <p>Tap to enter tunnel</p>
                    </div>
                `;
                container.appendChild(card);
            }
        });
    };
    
    // --- 3. SEARCH LOGIC ---
    const searchInput = document.getElementById('search-ghost');
    const searchResults = document.getElementById('search-results');

    if (searchInput) {
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
                    <div class="user-avatar" style="background-image: url(${g.avatar_url || 'default-avatar.png'})"></div>
                    <div class="user-info">
                        <h4>${g.username}</h4>
                        <p>New Ghost found</p>
                    </div>
                    <button class="accept-btn" onclick="sendVibe('${g.id}')">Vibe</button>
                `;
                searchResults.appendChild(card);
            });
        });
    }

    // --- 4. GLOBAL ACTIONS ---
    window.sendVibe = async (receiverId) => {
        const { error } = await supabaseClient
            .from('friendships')
            .insert([{ sender_id: user.id, receiver_id: receiverId, status: 'pending' }]);
        
        if (error) alert("Vibe already active or pending!");
        else {
            alert("Vibe sent! 🚀");
            if (searchInput) { searchInput.value = ''; searchResults.innerHTML = ''; }
        }
    };

    window.acceptVibe = async (id) => {
        const { error } = await supabaseClient.from('friendships').update({ status: 'accepted' }).eq('id', id);
        if (!error) location.reload();
        else alert("Vibe Error: " + error.message);
    };

    Promise.all([loadPending(), loadActive()]);
});
                          
