document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // --- 1. IDENTITY SYNC (Your Original) ---
    const syncMyHeader = async () => {
        const { data: profile } = await supabaseClient.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle();
        if (profile) {
            document.getElementById('my-own-alias').innerText = `@${profile.username}`;
            if (profile.avatar_url) document.getElementById('my-own-avatar').style.backgroundImage = `url(${profile.avatar_url})`;
        }
    };
    syncMyHeader();

    // --- 2. LOAD PENDING (Your Original) ---
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
                <div class="user-avatar" style="background-image: url(${req.profiles?.avatar_url || 'default.png'})"></div>
                <div class="user-card read-vibe">
                    <div class="user-info"><h4>${req.profiles?.username}</h4><p>Wants to vibe</p></div>
                    <button class="accept-btn" style="background:#32D74B; border:none; padding:8px 12px; border-radius:10px; font-weight:bold;" onclick="acceptVibe('${req.id}')">Accept</button>
                </div>`;
            container.appendChild(wrapper);
        });
    };

    // --- 3. LOAD ACTIVE (Adjusted for Time & Badge) ---
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

        const displayedIDs = new Set();

        for (const f of sorted) {
            let friend = f.sender_id === user.id ? f.receiver : f.sender;
            if (friend && !displayedIDs.has(friend.id)) {
                displayedIDs.add(friend.id);

                const { count: unreadCount } = await supabaseClient.from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('sender_id', friend.id).eq('receiver_id', user.id).eq('is_read', false);

                const { data: msg } = await supabaseClient.from('messages').select('*')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: false }).limit(1).maybeSingle();

                const time = msg ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                const isPinned = pinnedList.includes(friend.id);
                const badgeHtml = unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : '';

                const wrapper = document.createElement('div');
                wrapper.className = 'user-card-wrapper';
                wrapper.innerHTML = `
                    <div class="user-avatar" style="background-image: url(${friend.avatar_url || 'default.png'})"></div>
                    <div class="user-card ${unreadCount > 0 ? 'unread-vibe' : 'read-vibe'}" id="card-${friend.id}" onclick="handleEntry('${friend.id}', '${friend.avatar_url}')">
                        <div class="user-info">
                            <h4>${friend.username} ${isPinned ? '📌' : ''} ${badgeHtml}</h4>
                            <p>${msg ? msg.content.substring(0, 22) + '...' : 'Open Tunnel'}</p>
                            <span class="msg-time">${time}</span>
                        </div>
                    </div>`;
                container.appendChild(wrapper);
                addLongPress(document.getElementById(`card-${friend.id}`), friend.id, f.id, friend);
            }
        }
    };

    // --- 4. GHOST PIN LAYER LOGIC ---
    window.showPinLayer = (id, avatar, mode) => {
        let layer = document.getElementById('pin-layer-overlay');
        if (!layer) {
            layer = document.createElement('div'); 
            layer.id = 'pin-layer-overlay'; 
            layer.className = 'ghost-menu-overlay';
            document.body.appendChild(layer);
        }
        layer.style.display = 'flex';
        
        const instr = mode === "set" ? "set ur vibe lock 4 digits" : 
                      mode === "unlock" ? "confirm ur vibe to unlock" : "enter vibe";
        const btnText = mode === "set" ? "confirm lock" : 
                        mode === "unlock" ? "Unlock 🔓" : "check-in";
        const btnClass = mode === "set" ? "btn-confirm" : "btn-checkin";

        layer.innerHTML = `
            <div class="menu-box" style="position:relative; background: rgba(25, 25, 25, 0.95); border-radius: 35px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="position: absolute; top: -35px; left: -10px; width: 75px; height: 75px; border-radius: 20px; border: 2px solid #32D74B; background-image: url(${avatar}); background-size: cover;"></div>
                <div style="position: absolute; top: 15px; left: 15px; font-weight: bold; font-size: 13px;">Just•Abacha😎</div>
                <p style="text-align:center; margin-top:40px; font-size:14px; color: white;">${instr}</p>
                <input type="password" id="ghost-pin-input" maxlength="4" style="background: transparent; border: none; border-bottom: 2px solid #32D74B; color: white; text-align: center; width: 100%; font-size: 24px; margin: 20px 0; outline: none; letter-spacing: 15px;" placeholder="••••">
                <button class="${btnClass}" style="width:100%; padding:15px; border-radius:15px; font-weight:bold; border:none; cursor:pointer;" onclick="processPin('${id}', '${mode}')">${btnText}</button>
            </div>
        `;

        // 30s auto-dismiss & backdrop click
        setTimeout(() => { layer.style.display = 'none'; }, 30000);
        layer.onclick = (e) => { if(e.target === layer) layer.style.display = 'none'; };
    };

    window.processPin = (id, mode) => {
        const val = document.getElementById('ghost-pin-input').value;
        if (mode === "set") {
            if(val.length === 4) { localStorage.setItem(`locked_${id}`, val); location.reload(); }
        } else {
            const stored = localStorage.getItem(`locked_${id}`);
            if(val === stored) {
                if(mode === "unlock") { localStorage.removeItem(`locked_${id}`); location.reload(); }
                else { window.location.href = `chat.html?friend_id=${id}`; }
            } else {
                alert("Vibe Denied ☠️");
            }
        }
    };

    // --- 5. LONG PRESS MENU (The Ghost Style) ---
    window.showGhostMenu = (friendId, friendshipId, friendObj) => {
    let overlay = document.getElementById('ghost-command-overlay');
    if (!overlay) {
        overlay = document.createElement('div'); 
        overlay.id = 'ghost-command-overlay'; 
        overlay.className = 'ghost-menu-overlay';
        document.body.appendChild(overlay);
    }
    
    const isPinned = (JSON.parse(localStorage.getItem('pinned_ghosts') || '[]')).includes(friendId);
    const isLocked = localStorage.getItem(`locked_${friendId}`);

    overlay.style.display = 'flex';
    
    // THE GHOST LAYER MENU BOX
    overlay.innerHTML = `
        <div class="menu-box" style="width: 300px; padding-top: 45px;">
            <div style="position: absolute; top: -30px; left: -10px; width: 80px; height: 80px; border-radius: 20px; border: 3px solid #32D74B; background-image: url(${friendObj.avatar_url || 'default.png'}); background-size: cover; background-position: center; box-shadow: 0 10px 20px rgba(0,0,0,0.4); z-index: 10001;"></div>
            
            <div style="position: absolute; top: 15px; left: 85px; font-weight: bold; font-size: 14px; color: #32D74B; letter-spacing: 1px;">Just•Abacha😎</div>
            <div style="position: absolute; top: 32px; left: 85px; font-size: 10px; color: rgba(255,255,255,0.5);">@${friendObj.username}</div>

            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px;">
                <button onclick="viewCard('${friendObj.id}')" style="text-align: left; padding-left: 20px;">
                    <span style="margin-right: 10px;">👤</span> Profile Card
                </button>
                
                <button onclick="togglePin('${friendId}')" style="text-align: left; padding-left: 20px; border-color: ${isPinned ? '#FFD60A' : '#32D74B'}; color: ${isPinned ? '#FFD60A' : '#32D74B'};">
                    <span style="margin-right: 10px;">${isPinned ? '📍' : '📌'}</span> ${isPinned ? 'Unpin Ghost' : 'Pin to Top'}
                </button>
                
                <button onclick="toggleLock('${friendId}', '${friendObj.avatar_url}')" style="text-align: left; padding-left: 20px; border-color: ${isLocked ? '#007AFF' : '#32D74B'}; color: ${isLocked ? '#007AFF' : '#32D74B'};">
                    <span style="margin-right: 10px;">${isLocked ? '🔓' : '🔒'}</span> ${isLocked ? 'Open Tunnel' : 'Lock Tunnel'}
                </button>

                <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 5px 0;"></div>

                <button class="btn-danger" onclick="deleteChatPermanently('${friendshipId}', '${friendId}')" style="text-align: left; padding-left: 20px;">
                    <span style="margin-right: 10px;">🗑️</span> Burn Conversation
                </button>
                
                <button class="btn-cancel" onclick="document.getElementById('ghost-command-overlay').style.display='none'">Dismiss</button>
            </div>
        </div>
    `;

    // Close on clicking outside the box
    overlay.onclick = (e) => { if(e.target === overlay) overlay.style.display = 'none'; };
};
    
    // --- UTILITIES ---
    window.togglePin = (id) => {
        let pins = JSON.parse(localStorage.getItem('pinned_ghosts') || '[]');
        pins.includes(id) ? pins = pins.filter(p => p !== id) : pins.push(id);
        localStorage.setItem('pinned_ghosts', JSON.stringify(pins));
        location.reload();
    };

    window.toggleLock = (id, avatar) => {
        document.getElementById('ghost-command-overlay').style.display = 'none';
        const mode = localStorage.getItem(`locked_${id}`) ? "unlock" : "set";
        showPinLayer(id, avatar, mode);
    };

    window.handleEntry = async (id, avatar) => {
        if (localStorage.getItem(`locked_${id}`)) showPinLayer(id, avatar, "enter");
        else window.location.href = `chat.html?friend_id=${id}`;
    };

    window.deleteChatPermanently = async (fId, friendUid) => {
        if (confirm("Delete this chat and all messages?")) {
            await supabaseClient.from('messages').delete().or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendUid}),and(sender_id.eq.${friendUid},receiver_id.eq.${user.id})`);
            await supabaseClient.from('friendships').delete().eq('id', fId);
            location.reload();
        }
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
                card.innerHTML = `<div class="user-avatar" style="background-image: url(${g.avatar_url || 'default.png'})"></div><div class="user-card read-vibe"><div class="user-info"><h4>${g.username}</h4><p>Request vibe</p></div><button class="accept-btn" onclick="sendVibe('${g.id}')">Vibe</button></div>`;
                results.appendChild(card);
            });
        });
    }

    window.sendVibe = async (id) => { await supabaseClient.from('friendships').insert([{ sender_id: user.id, receiver_id: id, status: 'pending' }]); alert("Sent!"); };
    window.acceptVibe = async (id) => { await supabaseClient.from('friendships').update({ status: 'accepted' }).eq('id', id); location.reload(); };

    Promise.all([loadPending(), loadActive()]);
});
            
