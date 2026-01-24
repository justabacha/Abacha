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

    // --- 1. LOAD PENDING ---
    const loadPending = async () => {
        const { data: requests } = await supabaseClient.from('friendships')
            .select(`id, sender_id, profiles:sender_id (username, avatar_url)`)
            .eq('receiver_id', user.id).eq('status', 'pending');
        const container = document.getElementById('pending-list');
        if (!container) return;
        container.innerHTML = requests?.length ? '' : '<p style="color:gray; font-size:12px;">No new requests...</p>';
        requests?.forEach(req => {
            const wrapper = document.createElement('div');
            wrapper.className = 'user-card-wrapper';
            wrapper.innerHTML = `
                <div class="user-card read-vibe">
                    <div class="user-avatar" style="background-image: url(${req.profiles?.avatar_url || 'default.png'})"></div>
                    <div class="user-info"><h4>${req.profiles?.username}</h4><p>Wants to vibe</p></div>
                    <button class="accept-btn" style="background:#32D74B; border:none; padding:8px 12px; border-radius:10px; font-weight:bold;" onclick="acceptVibe('${req.id}')">Accept</button>
                </div>`;
            container.appendChild(wrapper);
        });
    };

    // --- 2. LOAD ACTIVE (With displayIDs & Pining) ---
    const loadActive = async () => {
        const { data: friends } = await supabaseClient.from('friendships')
            .select(`*, sender:profiles!friendships_sender_id_fkey(id, username, avatar_url), receiver:profiles!friendships_receiver_id_fkey(id, username, avatar_url)`)
            .eq('status', 'accepted').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const container = document.getElementById('active-chats');
        if (!container) return;
        container.innerHTML = '';

        const pinnedList = JSON.parse(localStorage.getItem('pinned_ghosts') || '[]');
        const sorted = (friends || []).sort((a, b) => {
            const idA = a.sender_id === user.id ? a.receiver_id : a.sender_id;
            const idB = b.sender_id === user.id ? b.receiver_id : b.sender_id;
            return pinnedList.includes(idB) - pinnedList.includes(idA);
        });

        const displayedIDs = new Set(); // PROTECTS AGAINST DUPLICATES

        for (const f of sorted) {
            let friend = f.sender_id === user.id ? f.receiver : f.sender;
            if (friend && !displayedIDs.has(friend.id)) {
                displayedIDs.add(friend.id);

                const { data: msg } = await supabaseClient.from('messages').select('*')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: false }).limit(1).maybeSingle();

                const isUnread = msg && msg.receiver_id === user.id && !msg.is_read;
                const time = msg ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                const isPinned = pinnedList.includes(friend.id);

                const wrapper = document.createElement('div');
                wrapper.className = 'user-card-wrapper';
                wrapper.innerHTML = `
                    <div class="user-card ${isUnread ? 'unread-vibe' : 'read-vibe'}" id="card-${friend.id}" onclick="handleEntry('${friend.id}')">
                        <div class="user-avatar" style="background-image: url(${friend.avatar_url || 'default.png'})"></div>
                        <div class="user-info">
                            <h4>${friend.username} ${isPinned ? '📌' : ''} <span class="msg-time">${time}</span></h4>
                            <p>${msg ? msg.content.substring(0, 22) + '...' : 'Open Tunnel'}</p>
                        </div>
                    </div>`;
                container.appendChild(wrapper);
                addLongPress(document.getElementById(`card-${friend.id}`), friend.id, f.id, friend);
            }
        }
    };

    // --- 3. GHOST COMMANDS ---
    window.showGhostMenu = (friendId, friendshipId, friendObj) => {
        let menu = document.getElementById('ghost-command-menu');
        if (!menu) {
            menu = document.createElement('div'); menu.id = 'ghost-command-menu'; menu.className = 'ghost-menu-overlay';
            document.body.appendChild(menu);
        }
        const isPinned = (JSON.parse(localStorage.getItem('pinned_ghosts') || '[]')).includes(friendId);
        const isLocked = localStorage.getItem(`locked_${friendId}`);

        menu.style.display = 'flex';
        menu.innerHTML = `
            <button onclick="viewCard('${friendObj.avatar_url}', '${friendObj.username}')">👤 View Card</button>
            <button onclick="togglePin('${friendId}')">${isPinned ? '📍 Unpin Chat' : '📌 Pin Chat'}</button>
            <button onclick="toggleLock('${friendId}')">${isLocked ? '🔓 Remove PIN' : '🔒 Lock Tunnel'}</button>
            <button class="btn-danger" onclick="deleteChatPermanently('${friendshipId}', '${friendId}')">🗑️ Delete Chat</button>
            <button style="border:none; color:gray;" onclick="document.getElementById('ghost-command-menu').style.display='none'">Cancel</button>
        `;
    };

    window.togglePin = (id) => {
        let pins = JSON.parse(localStorage.getItem('pinned_ghosts') || '[]');
        pins.includes(id) ? pins = pins.filter(p => p !== id) : pins.push(id);
        localStorage.setItem('pinned_ghosts', JSON.stringify(pins));
        location.reload();
    };

    window.toggleLock = (id) => {
        if(localStorage.getItem(`locked_${id}`)) {
            localStorage.removeItem(`locked_${id}`); alert("Tunnel Unlocked 🔓");
        } else {
            const p = prompt("Set 4-Digit PIN:");
            if(p && p.length === 4) { localStorage.setItem(`locked_${id}`, p); alert("Locked 🔐"); }
        }
        location.reload();
    };

    window.deleteChatPermanently = async (fId, friendUid) => {
        if (confirm("Delete this chat and all messages? |Yes| or |No|")) {
            await supabaseClient.from('messages').delete().or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendUid}),and(sender_id.eq.${friendUid},receiver_id.eq.${user.id})`);
            await supabaseClient.from('friendships').delete().eq('id', fId);
            location.reload();
        }
    };

    window.viewCard = (url, name) => {
        alert(`Ghost: ${name}\nAvatar URL: ${url}`);
    };

    window.handleEntry = (id) => {
        const pin = localStorage.getItem(`locked_${id}`);
        if (pin) {
            if (prompt("PIN:") === pin) window.location.href = `chat.html?friend_id=${id}`;
            else alert("Denied 💀");
        } else window.location.href = `chat.html?friend_id=${id}`;
    };

    const addLongPress = (el, fid, fsid, fobj) => {
        let t;
        el.addEventListener('touchstart', () => t = setTimeout(() => showGhostMenu(fid, fsid, fobj), 700));
        el.addEventListener('touchend', () => clearTimeout(t));
    };

    // --- SEARCH ---
    const searchInput = document.getElementById('search-ghost');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const term = e.target.value.trim();
            const results = document.getElementById('search-results');
            if (term.length < 2) { results.innerHTML = ''; return; }
            const { data: ghosts } = await supabaseClient.from('profiles').select('id, username, avatar_url').ilike('username', `%${term}%`).neq('id', user.id).limit(5);
            results.innerHTML = '';
            ghosts?.forEach(g => {
                const card = document.createElement('div');
                card.className = 'user-card-wrapper';
                card.innerHTML = `<div class="user-card read-vibe"><div class="user-avatar" style="background-image: url(${g.avatar_url || 'default.png'})"></div><div class="user-info"><h4>${g.username}</h4><p>Tap vibe to request</p></div><button class="accept-btn" onclick="sendVibe('${g.id}')">Vibe</button></div>`;
                results.appendChild(card);
            });
        });
    }

    window.sendVibe = async (id) => { await supabaseClient.from('friendships').insert([{ sender_id: user.id, receiver_id: id, status: 'pending' }]); alert("Sent!"); };
    window.acceptVibe = async (id) => { await supabaseClient.from('friendships').update({ status: 'accepted' }).eq('id', id); location.reload(); };

    Promise.all([loadPending(), loadActive()]);
});
                
