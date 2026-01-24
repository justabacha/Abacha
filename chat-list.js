document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // --- IDENTITY SYNC ---
    const syncMyHeader = async () => {
        const { data: profile } = await supabaseClient.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle();
        if (profile) {
            document.getElementById('my-own-alias').innerText = `@${profile.username}`;
            if (profile.avatar_url) document.getElementById('my-own-avatar').style.backgroundImage = `url(${profile.avatar_url})`;
        }
    };
    syncMyHeader();

    // --- 1. LOAD PENDING (No Omissions) ---
    const loadPending = async () => {
        const { data: requests } = await supabaseClient.from('friendships')
            .select('id, sender_id, profiles:sender_id (username, avatar_url)')
            .eq('receiver_id', user.id).eq('status', 'pending');

        const container = document.getElementById('pending-list');
        if (!container) return;
        container.innerHTML = requests?.length ? '' : '<p style="color:gray; font-size:12px;">No new requests...</p>';
        
        requests?.forEach(req => {
            const div = document.createElement('div');
            div.className = 'user-card-wrapper';
            div.innerHTML = `
                <div class="user-card read-vibe">
                    <div class="user-avatar" style="background-image: url(${req.profiles?.avatar_url || 'default.png'})"></div>
                    <div class="user-info"><h4>${req.profiles?.username}</h4><p>Wants to vibe</p></div>
                    <button class="accept-btn" style="background:#32D74B; border:none; padding:8px; border-radius:10px; font-weight:bold;" onclick="acceptVibe('${req.id}')">Accept</button>
                </div>`;
            container.appendChild(div);
        });
    };

    // --- 2. LOAD ACTIVE (With Time & Status) ---
    const loadActive = async () => {
        const { data: friends } = await supabaseClient.from('friendships')
            .select('*, sender:profiles!friendships_sender_id_fkey(id, username, avatar_url), receiver:profiles!friendships_receiver_id_fkey(id, username, avatar_url)')
            .eq('status', 'accepted').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const container = document.getElementById('active-chats');
        if (!container) return;
        container.innerHTML = friends?.length ? '' : '<p style="color:gray; font-size:12px;">No active tunnels...</p>';

        for (const f of (friends || [])) {
            let friend = f.sender_id === user.id ? f.receiver : f.sender;
            const { data: lastMsg } = await supabaseClient.from('messages').select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: false }).limit(1).maybeSingle();

            const isUnread = lastMsg && lastMsg.receiver_id === user.id && !lastMsg.is_read;
            const time = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            const div = document.createElement('div');
            div.className = 'user-card-wrapper';
            div.innerHTML = `
                <div class="user-card ${isUnread ? 'unread-vibe' : 'read-vibe'}" id="card-${friend.id}" onclick="handleEntry('${friend.id}')">
                    <div class="user-avatar" style="background-image: url(${friend.avatar_url || 'default.png'})"></div>
                    <div class="user-info">
                        <h4>${friend.username} <span class="msg-time">${time}</span></h4>
                        <p>${lastMsg ? lastMsg.content.substring(0, 20) + '...' : 'Start vibe'}</p>
                    </div>
                </div>`;
            container.appendChild(div);
            addLongPress(document.getElementById(`card-${friend.id}`), friend.id);
        }
    };

    // --- 3. SEARCH LOGIC (Restored) ---
    const searchInput = document.getElementById('search-ghost');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const term = e.target.value.trim();
            const results = document.getElementById('search-results');
            if (term.length < 2) { results.innerHTML = ''; return; }

            const { data: ghosts } = await supabaseClient.from('profiles').select('id, username, avatar_url').ilike('username', `%${term}%`).neq('id', user.id).limit(5);
            results.innerHTML = '';
            ghosts?.forEach(g => {
                const div = document.createElement('div');
                div.className = 'user-card-wrapper';
                div.innerHTML = `
                    <div class="user-card read-vibe">
                        <div class="user-avatar" style="background-image: url(${g.avatar_url || 'default.png'})"></div>
                        <div class="user-info"><h4>${g.username}</h4><p>Tap to send vibe</p></div>
                        <button class="accept-btn" style="background:#32D74B; border:none; padding:8px; border-radius:10px; font-weight:bold;" onclick="sendVibe('${g.id}')">Vibe</button>
                    </div>`;
                results.appendChild(div);
            });
        });
    }

    // --- ACTIONS & MENU ---
    window.showGhostMenu = (id) => {
        let m = document.getElementById('ghost-menu');
        if(!m) {
            m = document.createElement('div'); m.id = 'ghost-menu'; m.className = 'ghost-menu';
            document.body.appendChild(m);
        }
        m.style.display = 'flex';
        m.innerHTML = `
            <button onclick="toggleLock('${id}')">🔒 Lock Tunnel</button>
            <button onclick="deleteVibe('${id}')" style="color:#FF3B30; border-color:#FF3B30;">🗑️ Delete Chat</button>
            <button onclick="document.getElementById('ghost-menu').style.display='none'" style="border:none; color:gray;">Cancel</button>
        `;
    };

    const addLongPress = (el, id) => {
        let t;
        el.addEventListener('touchstart', () => t = setTimeout(() => showGhostMenu(id), 800));
        el.addEventListener('touchend', () => clearTimeout(t));
    };

    window.handleEntry = (id) => {
        if(localStorage.getItem(`locked_${id}`)) {
            if(prompt("PIN:") === "1234") window.location.href = `chat.html?friend_id=${id}`;
        } else window.location.href = `chat.html?friend_id=${id}`;
    };

    window.acceptVibe = async (id) => { await supabaseClient.from('friendships').update({status:'accepted'}).eq('id', id); location.reload(); };
    window.sendVibe = async (id) => { await supabaseClient.from('friendships').insert([{sender_id: user.id, receiver_id: id, status: 'pending'}]); alert("Vibe Sent!"); };

    Promise.all([loadPending(), loadActive()]);
});
                        
