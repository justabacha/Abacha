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
            syncGhostUniverse(); // Refresh to show green dots instantly
        })
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
            typingStates[payload.userId] = payload.isTyping;
            syncGhostUniverse(); // Refresh to show "Typing..."
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && user) {
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

    // --- 2 & 3. SPEED GOD SYNC (Replaces separate loadPending and loadActive) ---
    const syncGhostUniverse = async () => {
        // Fetch ALL friends (pending & active) in one blast
        const { data: friendships, error: friendError } = await supabaseClient.from('friendships')
            .select(`
                id, status, sender_id, receiver_id, 
                sender:profiles!friendships_sender_id_fkey(id, username, avatar_url), 
                receiver:profiles!friendships_receiver_id_fkey(id, username, avatar_url)
            `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (friendError || !friendships) return;

        // Split them up locally
        const pending = friendships.filter(f => f.status === 'pending' && f.receiver_id === user.id);
        const activeRaw = friendships.filter(f => f.status === 'accepted');

        const uniqueFriends = new Map();
        for (const f of activeRaw) {
            const friendData = f.sender_id === user.id ? f.receiver : f.sender;
            if (friendData && !uniqueFriends.has(friendData.id)) {
                uniqueFriends.set(friendData.id, { ...friendData, friendshipId: f.id });
            }
        }

        const friendIds = Array.from(uniqueFriends.keys());

        // Single blast for messages to get unreads and last message info
        let latestMsgs = [];
        if (friendIds.length > 0) {
            const { data: msgs } = await supabaseClient
                .from('messages')
                .select('id, sender_id, receiver_id, content, created_at, is_read')
                .or(`sender_id.in.(${friendIds}),receiver_id.in.(${friendIds})`)
                .order('created_at', { ascending: false })
                .limit(200); // Plenty to capture recent state without heavy DB load
            
            latestMsgs = msgs || [];
        }

        // Map the stats to our friends map
        uniqueFriends.forEach((val, key) => {
            const friendMsgs = latestMsgs.filter(m => m.sender_id === key || m.receiver_id === key);
            const lastMsg = friendMsgs[0]; // Newest because of order
            const unreadCount = friendMsgs.filter(m => m.sender_id === key && m.receiver_id === user.id && m.is_read === false).length;

            uniqueFriends.get(key).last_vibe_at = lastMsg ? new Date(lastMsg.created_at).getTime() : 0;
            uniqueFriends.get(key).lastMsgText = lastMsg ? lastMsg.content : 'No vibes yet...';
            uniqueFriends.get(key).lastMsgTime = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
            uniqueFriends.get(key).unreadCount = unreadCount;
        });

        renderPendingUI(pending);
        renderActiveUI(Array.from(uniqueFriends.values()));
    };

    // --- UI RENDERING FUNCTIONS ---
 const renderPendingUI = (requests) => {
        const container = document.getElementById('pending-list');
        if (!container) return;
        
        // Clear only if count changes to prevent heavy blinking
        if (!requests?.length) {
            container.innerHTML = '<p style="color:gray; font-size:12px;">No new requests...</p>';
            return;
        }

        requests.forEach(req => {
            let wrapper = container.querySelector(`[data-req-id="${req.id}"]`);
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'user-card-wrapper';
                wrapper.setAttribute('data-req-id', req.id);
                container.appendChild(wrapper);
            }

            const newPendingContent = `
                <div class="user-avatar" style="background-image: url(${req.sender?.avatar_url || 'default.png'})"></div>
                <div class="user-card read-vibe">
                    <div class="user-info"><h4>${req.sender?.username}</h4><p>Wants to vibe</p></div>
                    <div style="display:flex; gap:8px;">
                        <button class="accept-btn" style="background:#32D74B; color:black; border:none; padding:8px 12px; border-radius:10px; font-weight:bold; font-size:11px;" onclick="acceptVibe('${req.id}')">Accept</button>
                        <button class="decline-btn" style="background:rgba(255,59,48,0.2); color:#FF3B30; border:1px solid #FF3B30; padding:8px 12px; border-radius:10px; font-weight:bold; font-size:11px;" onclick="declineVibe('${req.id}')">Nope</button>
                    </div>
                </div>`;
            
            if (wrapper.innerHTML !== newPendingContent) {
                wrapper.innerHTML = newPendingContent;
            }
        });

        // Cleanup old requests that are no longer pending
        Array.from(container.children).forEach(child => {
            const id = child.getAttribute('data-req-id');
            if (id && !requests.some(r => r.id === id)) child.remove();
        });
    };

    const renderActiveUI = (friendsList) => {
        const container = document.getElementById('active-chats');
        if (!container) return;
        
        const pinnedList = JSON.parse(localStorage.getItem('pinned_ghosts') || '[]');
        
        const sortedFriends = friendsList.sort((a, b) => {
            const aPinned = pinnedList.includes(a.id) ? 1 : 0;
            const bPinned = pinnedList.includes(b.id) ? 1 : 0;
            if (aPinned !== bPinned) return bPinned - aPinned; 
            return b.last_vibe_at - a.last_vibe_at; 
        });

        sortedFriends.forEach((friend, index) => {
            let wrapper = container.querySelector(`[data-id="${friend.id}"]`);
            
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'user-card-wrapper';
                wrapper.setAttribute('data-id', friend.id);
                wrapper.style.transition = 'all 0.5s ease-in-out'; 
                container.appendChild(wrapper);
            }

            const isPinned = pinnedList.includes(friend.id);
            const isOnline = Object.values(ghostPresence).flat().some(p => p.user_id === friend.id);
            const statusColor = isOnline ? '#32D74B' : '#FF3B30';
            const isTyping = typingStates[friend.id];
            const displayMsgText = isTyping ? `<span style="color:#32D74B; font-style:italic;">typing...</span>` : friend.lastMsgText;

            const newContent = `
                <div class="user-avatar" style="background-image: url(${friend.avatar_url || 'default.png'})"></div>
                <div style="position: absolute; left: 65px; top: 55px; width: 14px; height: 14px; background: ${statusColor}; border: 2px solid #000; border-radius: 50%; z-index: 999; box-shadow: 0 0 8px ${statusColor}; pointer-events: none;"></div>
                <div class="user-card ${friend.unreadCount > 0 ? 'unread-vibe' : 'read-vibe'}" onclick="handleEntry('${friend.id}', '${friend.avatar_url}')">
                    <div class="user-info">
                        <h4 style="display:flex; align-items:center;">
                            ${friend.username} ${isPinned ? '<span style="margin-left:5px;">📌</span>' : ''} 
                            ${friend.unreadCount > 0 ? `<span class="unread-badge" style="background:#FF3B30; color:white; padding:2px 8px; border-radius:10px; font-size:10px; margin-left:10px;">${friend.unreadCount}</span>` : ''}
                        </h4>
                        <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${displayMsgText}</p>
                        <span class="msg-time">${friend.lastMsgTime}</span>
                    </div>
                </div>`;
            
          // Use a data attribute to track current "state" to stop redraws
            const stateHash = `${friend.last_vibe_at}-${isOnline}-${isTyping}-${friend.unreadCount}`;
            if (wrapper.getAttribute('data-state') !== stateHash) {
                wrapper.innerHTML = newContent;
                wrapper.setAttribute('data-state', stateHash);
                addLongPress(wrapper, friend.id, friend.friendshipId, friend);
            }

            // The Ghost Shift
            if (container.children[index] !== wrapper) {
                container.insertBefore(wrapper, container.children[index]);
            }
        });
    };

    // --- STARTUP ---
    syncGhostUniverse(); 
    setInterval(syncGhostUniverse, 5000); // 5 seconds is perfectly fine now that it's optimized!

    // --- 4. FLOATING GHOST LAYERS & DESKTOP EVENT BINDING ---
    const addLongPress = (el, fid, fsid, fobj) => {
        let t;
        const startPress = () => t = setTimeout(() => showGhostMenu(fid, fsid, fobj), 700);
        const cancelPress = () => clearTimeout(t);

        // Mobile touch events
        el.addEventListener('touchstart', startPress);
        el.addEventListener('touchend', cancelPress);
        el.addEventListener('touchmove', cancelPress); // Cancel if scrolling

        // Desktop mouse events
        el.addEventListener('mousedown', startPress);
        el.addEventListener('mouseup', cancelPress);
        el.addEventListener('mouseleave', cancelPress);
        
        // Native Desktop Right Click
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault(); 
            showGhostMenu(fid, fsid, fobj);
        });
    };

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

    // --- 6. SEARCH & VIBES ---
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

    // Opens up the search bar with style when clicking the "+" button
    window.toggleGhostSearch = async () => {
    let overlay = document.getElementById('ghost-discovery-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ghost-discovery-overlay';
        overlay.className = 'ghost-menu-overlay';
        // Make sure the overlay itself is transparent so the card handles the blur
        overlay.style.background = "rgba(0,0,0,0.2)"; 
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';

    overlay.innerHTML = `
        <div class="glass-ghost-card" style="
            width: 92%; max-width: 380px; 
            background: rgba(255, 255, 255, 0.07); 
            backdrop-filter: blur(25px) saturate(180%);
            -webkit-backdrop-filter: blur(25px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.15); 
            border-radius: 40px; padding: 25px; position: relative; 
            box-shadow: 0 25px 50px rgba(0,0,0,0.4); 
            max-height: 85vh; display: flex; flex-direction: column;
        ">
            <button onclick="document.getElementById('ghost-discovery-overlay').style.display='none'" style="
                position: absolute; top: 20px; right: 20px; 
                background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); 
                color: white; width: 32px; height: 32px; border-radius: 50%; 
                cursor: pointer; font-weight: bold; font-size: 14px;
                display: flex; align-items: center; justify-content: center;
            ">✕</button>
            
            <div style="font-weight: 800; font-size: 19px; color: #FFFFFF; margin-bottom: 20px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 22px;">🔍</span> The Ghost Layer
            </div>
            
            <input type="text" id="module-search" placeholder="Search the void..." style="
                width:100%; padding:16px; border-radius:22px; 
                border: 1px solid rgba(255,255,255,0.1); 
                background: rgba(0,0,0,0.3); color:white; 
                margin-bottom:20px; outline:none; font-size:16px;
                box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);
            ">
            
            <div id="module-results" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 5px;">
                 <p style="color:rgba(255,255,255,0.5); font-size:13px; text-align:center;">Scanning frequencies...</p>
            </div>
        </div>`;
    
    const mSearch = document.getElementById('module-search');
    const mResults = document.getElementById('module-results');

    const loadGhosts = async (searchTerm = "") => {
        const { data: existing } = await supabaseClient
            .from('friendships')
            .select('sender_id, receiver_id')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        
        const excludedIds = [user.id];
        existing?.forEach(f => {
            excludedIds.push(f.sender_id === user.id ? f.receiver_id : f.sender_id);
        });

        let query = supabaseClient.from('profiles').select('id, username, avatar_url, city');
        if (searchTerm) query = query.ilike('username', `%${searchTerm}%`);
        
        const { data: ghosts } = await query
            .not('id', 'in', `(${excludedIds.join(',')})`)
            .limit(15);

        mResults.innerHTML = ghosts?.length ? '' : '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:20px;">No ghosts found here, mate.</p>';
        
        ghosts?.forEach(g => {
            const div = document.createElement('div');
            div.style = "display:flex; align-items:center; justify-content:space-between; padding:14px; background:rgba(255,255,255,0.06); border-radius:25px; border:1px solid rgba(255,255,255,0.05);";
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:50px; height:50px; border-radius:30px; border:1.5px solid #2828f2; background-image:url(${g.avatar_url || 'default.png'}); background-size:cover; background-position:center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);"></div>
                    <div style="display:flex; flex-direction:column;">
                        <span style="color:white; font-weight:700; font-size:15px;">${g.username}</span>
                        <span style="color:rgba(50,215,75,0.8); font-size:11px; font-weight:600; text-transform: uppercase;">${g.city || 'Ghost Zone'}</span>
                    </div>
                </div>
                <button onclick="sendVibe('${g.id}', this)" style="background:rgb(46, 251, 70); border:1.5px solid white; padding:10px 16px; border-radius:14px; font-weight:900; font-size:12px; cursor:pointer; color:black;">Vibe</button>
            `;
            mResults.appendChild(div);
        });
    };

    loadGhosts();
    mSearch.addEventListener('input', (e) => loadGhosts(e.target.value.trim()));
    mSearch.focus();
};

window.sendVibe = async (id, btn) => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerText = "Syncing...";
    
    const { error } = await supabaseClient
        .from('friendships')
        .insert([{ sender_id: user.id, receiver_id: id, status: 'pending' }]);
    
    if (error) {
        btn.innerText = "Error";
        btn.disabled = false;
    } else {
        btn.innerText = "Sent 👻";
        btn.style.background = "rgba(237, 243, 244, 0.08)";
        btn.style.color = "#32D74B";
        btn.style.border = "1.6px solid rgba(50,215,75,0.3)";
    }
};
    window.acceptVibe = async (id) => { 
        const { error } = await supabaseClient.from('friendships').update({ status: 'accepted' }).eq('id', id); 
        if (!error) await syncGhostUniverse(); 
    };

   window.declineVibe = async (id) => {
        // UI feedback: hide immediately so it feels snappy
        const el = document.querySelector(`[data-req-id="${id}"]`);
        if (el) el.style.opacity = '0.3';

        const { error } = await supabaseClient.from('friendships').delete().eq('id', id);
        
        if (error) {
            if (el) el.style.opacity = '1';
            console.error("Decline failed:", error);
        } else {
            await syncGhostUniverse(); 
        }
    };
});