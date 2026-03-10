let ghostPresence = {};
let typingStates = {}; // Tracks who is typing
window.viewCard = async function(friendId, friendObj = {}) {
    const menu = document.getElementById('ghost-command-overlay');
    if(menu) menu.style.display = 'none';

    // 1. DATA FROM LIST (Name & Avatar)
    const displayName = friendObj.username || "Ghost";
    const displayAvatar = friendObj.avatar_url || 'default.png';
    
    // 2. DATA FROM DATABASE (City & Bio)
    let displayCity = 'Ghost Zone'; // Default if not found
    let displayBio = 'Roaming the ghost layer...';
    let secureContact = "+254👻👻👻👻👻";

    try {
        const { data: p } = await supabaseClient
            .from('profiles')
            .select('*') // Pull everything to be safe
            .eq('id', friendId)
            .maybeSingle();

        if (p) {
            // Check multiple possible column names
            displayCity = p.city || p.location || 'Ghost Zone'; 
            displayBio = p.bio || p.bio_quote || 'Roaming the ghost layer...';
            
            if (p.phone_number) {
                secureContact = p.phone_number.substring(0, 4) + "👻👻👻👻👻";
            }
        }
    } catch (e) { 
        console.log("Database fetch failed, staying in Ghost Zone."); 
    }

    const displayID = `ja${Math.floor(10000 + Math.random() * 90000)}-aba`;

    let layer = document.getElementById('profile-card-overlay');
    if (!layer) {
        layer = document.createElement('div');
        layer.id = 'profile-card-overlay';
        layer.className = 'ghost-menu-overlay';
        document.body.appendChild(layer);
    }
    layer.style.display = 'flex';

    layer.innerHTML = `
        <div class="seamless-ghost-card" style="
            width: 92%; max-width: 360px; border-radius: 45px; position: relative;
            background: linear-gradient(180deg, rgba(15,15,15,0.98) 0%, rgba(40,40,40,0.8) 100%);
            backdrop-filter: blur(50px); border: 1px solid rgba(255,255,255,0.25);
            padding: 35px 25px; box-shadow: 0 0 50px rgba(0,0,0,0.9); overflow: hidden;
        ">
            <div style="font-weight: 800; font-size: 16px; color: #FFFFFF; text-shadow: 0 0 10px rgba(255,255,255,0.5); margin-bottom: 30px; letter-spacing: 1.5px; text-align: left;">
                Just•Abacha😎
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-start; width: 100%;">
                <div style="
                    width: 95px; height: 95px; border-radius: 30px; border: 3px solid #32D74B; 
                    background-image: url('${displayAvatar}'); background-size: cover; background-position: center; 
                    margin-bottom: 20px; box-shadow: 0 0 40px rgba(50, 215, 75, 0.5);
                "></div>
                
                <div style="font-size: 30px; font-weight: 900; color: #FFFFFF; margin-bottom: 10px; text-shadow: 0 2px 10px rgba(0,0,0,1);">${displayName}</div>
                
                <div style="background: rgba(50, 215, 75, 0.2); padding: 8px 15px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #32D74B;">
                    <span style="font-size: 14px; color: #32D74B; font-weight: 900; letter-spacing: 1.5px;">${secureContact}</span>
                </div>

                <div style="display: flex; gap: 45px; width: 100%; margin-bottom: 30px; text-align: left;">
                    <div>
                        <span style="display: block; font-size: 11px; color: #32D74B; font-weight: 900; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1.2px;">Location</span>
                        <span style="color: #FFFFFF; font-size: 18px; font-weight: 800;">${displayCity}</span>
                    </div>
                    <div>
                        <span style="display: block; font-size: 11px; color: #32D74B; font-weight: 900; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1.2px;">Ghost ID</span>
                        <span style="color: #FFFFFF; font-size: 16px; font-weight: 800; font-family: monospace;">${displayID}</span>
                    </div>
                </div>

                <div style="width: 100%; margin-bottom: 40px; border-left: 4px solid #32D74B; padding-left: 15px; text-align: left;">
                    <p style="margin: 0; color: #FFFFFF; font-size: 15px; line-height: 1.6; font-style: italic; font-weight: 500;">
                       "${displayBio}"
                    </p>
                </div>

                <button class="floating-btn" onclick="document.getElementById('profile-card-overlay').style.display='none'" style="
                    border: none; background: #28a745; color: white; font-weight: 900; width: 100%; 
                    border-radius: 20px; padding: 20px; font-size: 18px; box-shadow: 0 10px 20px rgba(40, 167, 69, 0.3);
                ">Dismiss</button>
            </div>
        </div>
    `;

    layer.onclick = (e) => { if(e.target === layer) layer.style.display = 'none'; };
};

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    // --- GHOST REALTIME PRESENCE & TYPING SYNC ---
    const ghostChannel = supabaseClient.channel('ghost_hub_global');

    ghostChannel
        .on('presence', { event: 'sync' }, () => {
            ghostPresence = ghostChannel.presenceState();
            loadActive(); // Refresh list to show green/red dots
        })
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
            typingStates[payload.userId] = payload.isTyping;
            loadActive(); // Refresh list to show "Typing..."
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await ghostChannel.track({
                    user_id: user.id,
                    online_at: new Date().toISOString(),
                });
            }
        });
    if (!user) return;
    // --- 1. IDENTITY SYNC ---
    const syncMyHeader = async () => {
        const { data: profile } = await supabaseClient.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle();
        if (profile) {
            document.getElementById('my-own-alias').innerText = `${profile.username}`;
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

   // --- 3. LOAD ACTIVE (Ghost-Silent Sync) ---
   const loadActive = async () => {
    const { data: friends, error: friendError } = await supabaseClient.from('friendships')
        .select(`*, sender:profiles!friendships_sender_id_fkey(id, username, avatar_url), receiver:profiles!friendships_receiver_id_fkey(id, username, avatar_url)`)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (friendError || !friends) return;

    const container = document.getElementById('active-chats');
    const pinnedList = JSON.parse(localStorage.getItem('pinned_ghosts') || '[]');
    const uniqueFriends = new Map();

    for (const f of friends) {
        const friendData = f.sender_id === user.id ? f.receiver : f.sender;
        if (friendData && !uniqueFriends.has(friendData.id)) {
            uniqueFriends.set(friendData.id, { ...friendData, friendshipId: f.id });
        }
    }

    const sortedFriends = Array.from(uniqueFriends.values()).sort((a, b) => {
        return pinnedList.includes(b.id) - pinnedList.includes(a.id);
    });

    let finalHTML = '';

    for (const friend of sortedFriends) {
        // --- FIXED SYNTAX FOR THE MESSAGE FETCH ---
        // We use a cleaner filter string without spaces
        const msgFilter = `and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`;
        
        const [unreadRes, msgRes] = await Promise.all([
            supabaseClient.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', friend.id).eq('receiver_id', user.id).eq('is_read', false),
            supabaseClient.from('messages').select('*').or(msgFilter).order('created_at', { ascending: false }).limit(1).maybeSingle()
        ]);

        const unreadCount = unreadRes.count || 0;
        const msg = msgRes.data;
        const isPinned = pinnedList.includes(friend.id);
        const time = msg ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
        const badgeHtml = unreadCount > 0 ? `<span class="unread-badge" style="background:#FF3B30; color:white; padding:2px 8px; border-radius:10px; font-size:10px; margin-left:10px;">${unreadCount}</span>` : '';
// Check presence & typing status
        const isOnline = Object.values(ghostPresence).flat().some(p => p.user_id === friend.id);
        const statusColor = isOnline ? '#32D74B' : '#FF3B30';
        const isTyping = typingStates[friend.id];
        const lastMsg = isTyping ? `<span style="color:#32D74B; font-style:italic;">typing...</span>` : (msg ? msg.content : 'No vibes yet...');

        finalHTML += `
            <div class="user-card-wrapper" data-id="${friend.id}" style="position: relative;">
                
                <div class="user-avatar" style="background-image: url(${friend.avatar_url || 'default.png'})"></div>
                
                <div style="position: absolute; left: 65px; top: 55px; width: 14px; height: 14px; background: ${statusColor}; border: 2px solid #000; border-radius: 50%; z-index: 9999; pointer-events: none; box-shadow: 0 0 8px ${statusColor};"></div>

                <div class="user-card ${unreadCount > 0 ? 'unread-vibe' : 'read-vibe'}" id="card-${friend.id}" onclick="handleEntry('${friend.id}', '${friend.avatar_url}')">
                    <div class="user-info">
                        <h4 style="display:flex; align-items:center;">
                            ${friend.username} ${isPinned ? '<span style="margin-left:5px;">📌</span>' : ''} ${badgeHtml}
                        </h4>
                        <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                            ${lastMsg}
                        </p>
                        <span class="msg-time">${time}</span>
                    </div>
                </div>
            </div>`;
    }

    if (container.innerHTML !== finalHTML) {
        container.innerHTML = finalHTML;
    }
};

    // Fast initial load, then silent background sync every 5 seconds
    loadActive(); 
    setInterval(loadActive, 5000);

    // --- 4. FLOATING GHOST LAYERS ---
window.showGhostMenu = (friendId, friendshipId, friendObj) => {
    let overlay = document.getElementById('ghost-command-overlay');
    if (!overlay) {
        overlay = document.createElement('div'); 
        overlay.id = 'ghost-command-overlay'; 
        overlay.className = 'ghost-menu-overlay';
        document.body.appendChild(overlay);
    }

    // Keep your logic for Pin and Lock status
    const isPinned = (JSON.parse(localStorage.getItem('pinned_ghosts') || '[]')).includes(friendId);
    const isLocked = localStorage.getItem(`locked_${friendId}`);

    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="menu-wrapper" style="width: 100%; height: 100%; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
            
            <div style="position: absolute; top: 40px; left: 30px; font-weight: 800; font-size: 18px; color: #FFFFFF; text-shadow: 0 0 10px rgba(255,255,255,0.4); letter-spacing: 1px;">
                Just•Abacha😎
            </div>

            <div class="floating-menu-container" style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 320px;">
                
                <div style="display: flex; flex-direction: column; align-items: center; width: 100%; margin-bottom: 30px;">
                    <div style="width: 100px; height: 100px; border-radius: 30px; border: 3px solid #32D74B; background-image: url(${friendObj.avatar_url || 'default.png'}); background-size: cover; background-position: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></div>
                    <div style="margin-top: 15px; text-align: center;">
                        <div style="font-size: 14px; color: #32D74B; font-weight: 900; letter-spacing: 1px;">${friendObj.username}</div>
                    </div>
                </div>

                <div style="width: 100%; display: flex; flex-direction: column; gap: 12px;">
                    <button class="floating-btn" onclick='viewCard("${friendId}", ${JSON.stringify(friendObj).replace(/'/g, "&apos;")})'>
                        👤 Profile Card
                    </button>

                    <button class="floating-btn" onclick="togglePin('${friendId}')">
                        ${isPinned ? '📍 Unpin' : '📌 Pin Chat'}
                    </button>

                    <button class="floating-btn" onclick="toggleLock('${friendId}', '${friendObj.avatar_url}')">
                        ${isLocked ? '🔓 Remove PIN' : '🔒 Lock Tunnel'}
                    </button>

                    <button class="floating-btn btn-ghost-yes" onclick="deleteChatPermanently('${friendshipId}', '${friendId}')" style="background: rgba(255, 69, 58, 0.2); color: #FF453A; border: 1px solid rgba(255, 69, 58, 0.3);">
                        🗑️ Burn Chat
                    </button>
                </div>
                
                <button class="btn-cancel" onclick="document.getElementById('ghost-command-overlay').style.display='none'" style="background:none; border:none; color:rgba(255,255,255,0.6); margin-top:25px; cursor:pointer; font-weight: 600;">
                    Dismiss
                </button>
            </div>
        </div>
    `;

    overlay.onclick = (e) => { if (e.target === overlay) overlay.style.display = 'none'; };
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
        
