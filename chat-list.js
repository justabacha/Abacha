document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // --- IDENTITY SYNC (Restored) ---
    const syncMyHeader = async () => {
        const { data: profile } = await supabaseClient.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle();
        if (profile) {
            document.getElementById('my-own-alias').innerText = `@${profile.username}`;
            if (profile.avatar_url) document.getElementById('my-own-avatar').style.backgroundImage = `url(${profile.avatar_url})`;
        }
    };
    syncMyHeader();

    // --- GHOST PAD CORE ---
    let currentInput = "";
    let padTargetId = null;
    let padMode = ""; // 'set', 'enter', 'unlock'

    const openGhostPad = (targetId, mode, friendObj = {}) => {
        const overlay = document.getElementById('ghost-pad-overlay');
        overlay.style.display = 'flex';
        padTargetId = targetId;
        padMode = mode;
        currentInput = "";
        updatePinDisplay();

        // Setup UI
        const header = mode === 'set' ? "Secure Your Vibe Lock" : 
                      mode === 'unlock' ? "Confirm Vibe to Unlock" : "Enter Vibe to Proceed";
        const actionText = mode === 'set' ? "Confirm Lock" : 
                          mode === 'unlock' ? "Unlock 🔓" : "Check-in";
        const actionClass = mode === 'set' ? "btn-confirm" : "btn-checkin";

        overlay.querySelector('.card-alias-header').innerText = `Just•Abacha😎`;
        overlay.querySelector('.instruction-text').innerText = header;
        overlay.querySelector('#pad-action-btn').innerText = actionText;
        overlay.querySelector('#pad-action-btn').className = `ghost-action-btn ${actionClass}`;
        overlay.querySelector('.pad-avatar-corner').style.backgroundImage = `url(${friendObj.avatar_url || 'default.png'})`;
        
        // Auto-close timer
        setTimeout(() => overlay.style.display = 'none', 30000);
    };

    window.pressGhostKey = (num) => {
        if (currentInput.length < 4) {
            currentInput += num;
            updatePinDisplay();
        }
    };

    const updatePinDisplay = () => {
        const display = document.getElementById('pin-display');
        display.innerHTML = currentInput.split('').map(() => '👻').join('') + 
                           '◦'.repeat(4 - currentInput.length);
    };

    window.submitGhostPad = async () => {
        const storedPin = localStorage.getItem(`locked_${padTargetId}`);
        const deniedText = document.getElementById('pad-denied');
        deniedText.innerText = "";

        if (padMode === 'set') {
            if (currentInput.length === 4) {
                localStorage.setItem(`locked_${padTargetId}`, currentInput);
                location.reload();
            }
        } else if (padMode === 'enter' || padMode === 'unlock') {
            if (currentInput === storedPin) {
                if (padMode === 'unlock') {
                    localStorage.removeItem(`locked_${padTargetId}`);
                    location.reload();
                } else {
                    window.location.href = `chat.html?friend_id=${padTargetId}`;
                }
            } else {
                deniedText.innerText = "Vibe Denied ☠️";
                currentInput = "";
                updatePinDisplay();
            }
        }
    };

    // --- LOAD ACTIVE (Updated Geometry) ---
    const loadActive = async () => {
        const { data: friends } = await supabaseClient.from('friendships')
            .select(`*, sender:profiles!friendships_sender_id_fkey(*), receiver:profiles!friendships_receiver_id_fkey(*)`)
            .eq('status', 'accepted').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const container = document.getElementById('active-chats');
        container.innerHTML = '';
        const displayedIDs = new Set();

        for (const f of friends || []) {
            let friend = f.sender_id === user.id ? f.receiver : f.sender;
            if (friend && !displayedIDs.has(friend.id)) {
                displayedIDs.add(friend.id);

                const { data: msg } = await supabaseClient.from('messages').select('*')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: false }).limit(1).maybeSingle();

                const time = msg ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                
                const wrapper = document.createElement('div');
                wrapper.className = 'user-card-wrapper';
                wrapper.innerHTML = `
                    <div class="user-avatar" style="background-image: url(${friend.avatar_url || 'default.png'})"></div>
                    <div class="user-card ${msg?.is_read === false ? 'unread-vibe' : 'read-vibe'}" onclick="handleEntry('${friend.id}')">
                        <div class="user-info">
                            <h4>${friend.username}</h4>
                            <p>${msg ? msg.content.substring(0, 20) : 'Open Tunnel'}</p>
                            <span class="msg-time">${time}</span>
                        </div>
                    </div>`;
                container.appendChild(wrapper);
                addLongPress(wrapper, friend.id, f.id, friend);
            }
        }
    };

    // --- ENTRY HANDLER ---
    window.handleEntry = (id) => {
        if (localStorage.getItem(`locked_${id}`)) openGhostPad(id, 'enter');
        else window.location.href = `chat.html?friend_id=${id}`;
    };

    // --- LONG PRESS MENU ---
    window.showGhostMenu = (friendId, friendshipId, friendObj) => {
        const overlay = document.getElementById('ghost-command-overlay');
        overlay.style.display = 'flex';
        const isLocked = localStorage.getItem(`locked_${friendId}`);

        document.getElementById('menu-box').innerHTML = `
            <button onclick="viewGhostProfile('${friendId}')">👤 View Card</button>
            <button onclick="togglePin('${friendId}')">📌 Pin Chat</button>
            <button onclick="handlePadTrigger('${friendId}', '${isLocked ? 'unlock' : 'set'}')">
                ${isLocked ? '🔓 Unlock' : '🔒 Lock'}
            </button>
            <button class="btn-danger" onclick="deleteChatPermanently('${friendshipId}', '${friendId}')">🗑️ Delete</button>
            <button class="btn-cancel" onclick="document.getElementById('ghost-command-overlay').style.display='none'">Cancel</button>
        `;
    };

    window.handlePadTrigger = (id, mode) => {
        document.getElementById('ghost-command-overlay').style.display = 'none';
        openGhostPad(id, mode);
    };

    window.viewGhostProfile = async (id) => {
        const { data: p } = await supabaseClient.from('profiles').select('*').eq('id', id).single();
        alert(`Ghost Card:\nName: ${p.username}\nCity: ${p.city || 'Ghost Zone'}\nQuote: ${p.bio_quote || 'No words...'}\nNumber: ${p.phone_number || 'Encrypted'}`);
    };

    // ... [Add existing loadPending, delete, pin, and search logic here] ...
    loadActive();
    loadPending();
});
