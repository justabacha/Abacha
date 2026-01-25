window.viewCard = async function(friendId) {
    const menu = document.getElementById('ghost-command-overlay');
    if(menu) menu.style.display = 'none';

    try {
        const { data: p, error } = await supabaseClient
            .from('profiles')
            .select('username, avatar_url, city, bio, phone_number') 
            .eq('id', friendId)
            .maybeSingle();

        const displayName = p?.username || "Ghost";
        const displayAvatar = p?.avatar_url || 'default.png';
        const displayCity = p?.city || 'Nairobi'; // Default based on your sketch
        const displayBio = p?.bio || 'Roaming the ghost layer...';
        const displayID = friendId.substring(0, 4).toUpperCase();
        
        // SECURE CONTACT LOGIC: +254 👻👻👻👻👻
        let rawPhone = p?.phone_number || "";
        let secureContact = rawPhone ? rawPhone.substring(0, 4) + "👻👻👻👻👻" : "+254👻👻👻👻👻";

        let layer = document.getElementById('profile-card-overlay');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'profile-card-overlay';
            layer.className = 'ghost-menu-overlay';
            document.body.appendChild(layer);
        }
        layer.style.display = 'flex';

        layer.innerHTML = `
            <div class="floating-card-wrapper" style="width: 90%; max-width: 350px; position: relative; display: flex; flex-direction: column; align-items: center;">
                
                <div style="width: 100%; backdrop-filter: blur(40px); background: rgba(0,0,0,0.6); padding: 15px; border-radius: 25px 25px 0 0; border: 1px solid rgba(255,255,255,0.1); border-bottom: none; z-index: 2; margin-bottom: -10px;">
                    <div style="font-weight: bold; font-size: 18px; color: white; text-align: left; padding-left: 10px;">Just•Abacha😎</div>
                </div>

                <div style="width: 100%; backdrop-filter: blur(15px); background: rgba(255,255,255,0.05); padding: 30px 20px 20px 20px; border-radius: 0 0 35px 35px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; z-index: 1;">
                    
                    <div style="width: 95px; height: 95px; border-radius: 30px; border: 2px solid #32D74B; background-image: url(${displayAvatar}); background-size: cover; background-position: center; margin-bottom: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.4);"></div>
                    
                    <div style="font-size: 20px; font-weight: 800; color: white; margin-bottom: 5px;">~${displayName}</div>
                    
                    <div style="background: rgba(0,0,0,0.3); padding: 6px 20px; border-radius: 50px; border: 1px solid rgba(50, 215, 75, 0.3); margin-bottom: 20px;">
                        <span style="font-size: 12px; color: #32D74B; letter-spacing: 1px;">${secureContact}</span>
                    </div>

                    <div style="display: flex; gap: 10px; width: 100%; margin-bottom: 15px;">
                        <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 15px; text-align: center;">
                            <span style="display: block; font-size: 9px; color: gray; text-transform: uppercase;">Location</span>
                            <span style="color: white; font-size: 13px;">${displayCity}</span>
                        </div>
                        <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 15px; text-align: center;">
                            <span style="display: block; font-size: 9px; color: gray; text-transform: uppercase;">Ghost ID</span>
                            <span style="color: white; font-size: 13px;">#${displayID}</span>
                        </div>
                    </div>

                    <div style="width: 100%; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 20px; margin-bottom: 25px; text-align: center;">
                        <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 14px; font-style: italic; line-height: 1.4;">
                           "${displayBio}"
                        </p>
                    </div>

                    <button class="floating-btn" onclick="document.getElementById('profile-card-overlay').style.display='none'" style="border: none; background: #28a745; color: white; font-weight: bold; width: 100%; border-radius: 18px; padding: 14px; font-size: 16px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">Dismiss</button>
                </div>
            </div>
        `;

        layer.onclick = (e) => { if(e.target === layer) layer.style.display = 'none'; };

    } catch (err) {
        console.error("Layout Engine Error:", err);
    }
};
                                                                            
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // --- 1. IDENTITY SYNC ---
    const syncMyHeader = async () => {
        const { data: profile } = await supabaseClient.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle();
        if (profile) {
            document.getElementById('my-own-alias').innerText = `@${profile.username}`;
            if (profile.avatar_url) document.getElementById('my-own-avatar').style.backgroundImage = `url(${profile.avatar_url})`;
        }
    };
    syncMyHeader();

    // --- 2. LOAD PENDING ---
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

    // --- 3. LOAD ACTIVE (Basin Geometry) ---
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
                const { count: unreadCount } = await supabaseClient.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', friend.id).eq('receiver_id', user.id).eq('is_read', false);
                const { data: msg } = await supabaseClient.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`).order('created_at', { ascending: false }).limit(1).maybeSingle();
                
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

    // --- 4. FLOATING GHOST LAYERS ---
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
    overlay.innerHTML = `
        <div class="floating-menu-container">
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; margin-bottom: 25px;">
                <div style="width: 85px; height: 85px; border-radius: 25px; border: 2px solid #32D74B; background-image: url(${friendObj.avatar_url || 'default.png'}); background-size: cover; background-position: center; box-shadow: 0 10px 20px rgba(0,0,0,0.3);"></div>
                <div style="margin-top: 12px; text-align: center;">
                    <div style="font-weight: bold; font-size: 18px; color: white; letter-spacing: 0.5px;">Just•Abacha😎</div>
                    <div style="font-size: 13px; color: #32D74B; opacity: 0.8; margin-top: 2px;">~${friendObj.username}</div>
                </div>
            </div>

            <button class="floating-btn" onclick="viewCard('${friendObj.id}')">👤 Profile Card</button>
            <button class="floating-btn" onclick="togglePin('${friendId}')">${isPinned ? '📍 Unpin' : '📌 Pin Chat'}</button>
            <button class="floating-btn" onclick="toggleLock('${friendId}', '${friendObj.avatar_url}')">${isLocked ? '🔓 Remove PIN' : '🔒 Lock Tunnel'}</button>
            <button class="floating-btn btn-ghost-yes" onclick="deleteChatPermanently('${friendshipId}', '${friendId}')">🗑️ Burn Chat</button>
            
            <button class="btn-cancel" onclick="document.getElementById('ghost-command-overlay').style.display='none'" style="background:none; border:none; color:rgba(255,255,255,0.5); margin-top:15px; cursor:pointer;">Dismiss</button>
        </div>
    `;
};
    
    window.showPinLayer = (id, avatar, mode) => {
        let layer = document.getElementById('pin-layer-overlay');
        if (!layer) {
            layer = document.createElement('div'); layer.id = 'pin-layer-overlay'; layer.className = 'ghost-menu-overlay';
            document.body.appendChild(layer);
        }
        layer.style.display = 'flex';
        let currentPin = "";
        const renderPinContent = () => {
            const instr = mode === "set" ? "set ur vibe lock" : "confirm ur vibe";
            const ghostDisplay = currentPin.split('').map(() => '👻').join('') + '•'.repeat(4 - currentPin.length);
            layer.innerHTML = `
                <div class="floating-menu-container">
                    <div style="display: flex; align-items: center; width: 100%; margin-bottom: 10px; padding-left: 10px;">
                        <div style="width: 70px; height: 70px; border-radius: 20px; border: 2px solid #32D74B; background-image: url(${avatar}); background-size: cover; margin-right: 15px;"></div>
                        <div style="font-weight: bold; font-size: 16px; color: white;">Just•Abacha😎</div>
                    </div>
                    <p style="color:white; font-size:13px; opacity:0.7;">${instr}</p>
                    <div class="ghost-pin-display" id="ghost-visual-pin" style="font-size: 24px; letter-spacing: 8px; color: #32D74B; margin: 20px 0;">${ghostDisplay}</div>
                    <input type="number" id="hidden-pin-input" pattern="[0-9]*" inputmode="numeric" maxlength="4" autofocus style="position:absolute; opacity:0; pointer-events:none;">
                    <button class="floating-btn" id="confirm-pin-btn" style="background:#32D74B; color:black;">Check-in</button>
                </div>`;
            const input = document.getElementById('hidden-pin-input');
            input.focus();
            input.addEventListener('input', (e) => {
                currentPin = e.target.value.substring(0, 4);
                document.getElementById('ghost-visual-pin').innerText = currentPin.split('').map(() => '👻').join('') + '•'.repeat(4 - currentPin.length);
            });
            document.getElementById('confirm-pin-btn').onclick = () => processPinAction(id, mode, currentPin);
        };
        renderPinContent();
    };

    window.processPinAction = (id, mode, pinVal) => {
        if (pinVal.length !== 4) return;
        if (mode === "set") { localStorage.setItem(`locked_${id}`, pinVal); location.reload(); }
        else {
            if (pinVal === localStorage.getItem(`locked_${id}`)) {
                mode === "unlock" ? (localStorage.removeItem(`locked_${id}`), location.reload()) : (window.location.href = `chat.html?friend_id=${id}`);
            } else { alert("Vibe Denied ☠️"); }
        }
    };

    // --- 5. UTILITIES ---
    window.togglePin = (id) => {
        let pins = JSON.parse(localStorage.getItem('pinned_ghosts') || '[]');
        pins.includes(id) ? pins = pins.filter(p => p !== id) : pins.push(id);
        localStorage.setItem('pinned_ghosts', JSON.stringify(pins));
        location.reload();
    };

    window.toggleLock = (id, avatar) => {
        const menu = document.getElementById('ghost-command-overlay');
        if(menu) menu.style.display = 'none';
        const mode = localStorage.getItem(`locked_${id}`) ? "unlock" : "set";
        showPinLayer(id, avatar, mode);
    };

    window.handleEntry = async (id, avatar) => {
        if (localStorage.getItem(`locked_${id}`)) showPinLayer(id, avatar, "enter");
        else window.location.href = `chat.html?friend_id=${id}`;
    };

    window.deleteChatPermanently = (fId, friendUid) => {
        const menu = document.getElementById('ghost-command-overlay');
        if(menu) menu.style.display = 'none';
        let layer = document.getElementById('delete-layer-overlay');
        if (!layer) {
            layer = document.createElement('div'); layer.id = 'delete-layer-overlay'; layer.className = 'ghost-menu-overlay';
            document.body.appendChild(layer);
        }
        layer.style.display = 'flex';
        layer.innerHTML = `
            <div class="floating-menu-container">
                <div style="display: flex; align-items: center; width: 100%; margin-bottom: 20px; padding-left: 10px;">
                    <div style="width: 60px; height: 60px; border-radius: 15px; border: 2px solid #FF3B30; background-color: #000; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 24px;">🗑️</div>
                    <div style="font-weight: bold; font-size: 16px; color: white;">Just•Abacha😎</div>
                </div>
                <p style="color:white; text-align:center; font-size:14px; margin-bottom: 20px;">Delete this chat? Action is permanent.</p>
                <button class="floating-btn btn-ghost-yes" id="confirm-delete-btn">Burn Everything 🔥</button>
                <button class="floating-btn btn-ghost-cancel" onclick="document.getElementById('delete-layer-overlay').style.display='none'">Cancel</button>
            </div>`;
        document.getElementById('confirm-delete-btn').onclick = async () => {
            await supabaseClient.from('messages').delete().or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendUid}),and(sender_id.eq.${friendUid},receiver_id.eq.${user.id})`);
            await supabaseClient.from('friendships').delete().eq('id', fId);
            location.reload();
        };
    };

    const addLongPress = (el, fid, fsid, fobj) => {
        let t;
        el.addEventListener('touchstart', () => t = setTimeout(() => showGhostMenu(fid, fsid, fobj), 700));
        el.addEventListener('touchend', () => clearTimeout(t));
    };

    // --- 6. SEARCH ---
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
        
