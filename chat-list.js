document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    let currentInput = "";
    let padTargetId = null;
    let padMode = "";

    // --- IDENTITY SYNC (Your Original) ---
    const syncMyHeader = async () => {
        const { data: profile } = await supabaseClient.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle();
        if (profile) {
            document.getElementById('my-own-alias').innerText = `@${profile.username}`;
            if (profile.avatar_url) document.getElementById('my-own-avatar').style.backgroundImage = `url(${profile.avatar_url})`;
        }
    };
    syncMyHeader();

    // --- LOAD ACTIVE (Your Original Structure + Adjustments) ---
    const loadActive = async () => {
        const { data: friends } = await supabaseClient.from('friendships')
            .select(`*, sender:profiles!friendships_sender_id_fkey(*), receiver:profiles!friendships_receiver_id_fkey(*)`)
            .eq('status', 'accepted').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const container = document.getElementById('active-chats');
        if (!container) return;
        container.innerHTML = '';
        const displayedIDs = new Set();
        const pinnedList = JSON.parse(localStorage.getItem('pinned_ghosts') || '[]');

        for (const f of (friends || [])) {
            let friend = f.sender_id === user.id ? f.receiver : f.sender;
            if (friend && !displayedIDs.has(friend.id)) {
                displayedIDs.add(friend.id);

                const { data: msg } = await supabaseClient.from('messages').select('*')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: false }).limit(1).maybeSingle();

                // Fetch real unread count
                const { count: unreads } = await supabaseClient.from('messages').select('*', { count: 'exact', head: true })
                    .eq('sender_id', friend.id).eq('receiver_id', user.id).eq('is_read', false);

                const time = msg ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                const isPinned = pinnedList.includes(friend.id);
                const badge = unreads > 0 ? `<span class="unread-badge">${unreads}</span>` : '';

                const wrapper = document.createElement('div');
                wrapper.className = 'user-card-wrapper';
                wrapper.innerHTML = `
                    <div class="user-avatar" style="background-image: url(${friend.avatar_url || 'default.png'})"></div>
                    <div class="user-card ${unreads > 0 ? 'unread-vibe' : 'read-vibe'}" id="card-${friend.id}" onclick="handleEntry('${friend.id}')">
                        <div class="user-info">
                            <h4>${friend.username} ${isPinned ? '📌' : ''} ${badge}</h4>
                            <p>${msg ? msg.content.substring(0, 22) + '...' : 'Open Tunnel'}</p>
                            <span class="msg-time">${time}</span>
                        </div>
                    </div>`;
                container.appendChild(wrapper);
                addLongPress(document.getElementById(`card-${friend.id}`), friend.id, f.id, friend);
            }
        }
    };

    // --- GHOST PAD LOGIC ---
    window.openGhostPad = (id, mode, friend) => {
        padTargetId = id; padMode = mode; currentInput = "";
        const overlay = document.getElementById('ghost-pad-overlay');
        overlay.style.display = 'flex';
        document.getElementById('pad-avatar').style.backgroundImage = `url(${friend?.avatar_url || 'default.png'})`;
        document.getElementById('pin-disp').innerText = '◦ ◦ ◦ ◦';
        document.getElementById('pad-instr').innerText = mode === 'set' ? "set ur vibe lock 4 digits" : "enter vibe";
        document.getElementById('pad-action-btn').className = mode === 'set' ? 'btn-confirm' : 'btn-checkin';
        document.getElementById('pad-action-btn').innerText = mode === 'set' ? 'confirm lock' : 'check-in';
        
        // Auto-dismiss 30s
        setTimeout(() => { overlay.style.display = 'none'; }, 30000);
    };

    window.pressKey = (num) => {
        if(currentInput.length < 4) {
            currentInput += num;
            document.getElementById('pin-disp').innerText = '👻'.repeat(currentInput.length) + ' ◦'.repeat(4 - currentInput.length);
        }
    };

    window.submitPad = () => {
        const stored = localStorage.getItem(`locked_${padTargetId}`);
        if(padMode === 'set') {
            localStorage.setItem(`locked_${padTargetId}`, currentInput);
            location.reload();
        } else {
            if(currentInput === stored) window.location.href = `chat.html?friend_id=${padTargetId}`;
            else { document.getElementById('pad-instr').innerText = "Vibe Denied ☠️"; currentInput = ""; }
        }
    };

    window.handleEntry = (id) => {
        if (localStorage.getItem(`locked_${id}`)) {
            // Need friend object for the avatar corner
            openGhostPad(id, 'enter'); 
        } else window.location.href = `chat.html?friend_id=${id}`;
    };

    // --- REST OF YOUR ORIGINAL FUNCTIONS (Delete, Vibe, etc.) STAY UNCHANGED ---
    const addLongPress = (el, fid, fsid, fobj) => {
        let t;
        el.addEventListener('touchstart', () => t = setTimeout(() => showGhostMenu(fid, fsid, fobj), 700));
        el.addEventListener('touchend', () => clearTimeout(t));
    };

    Promise.all([loadPending(), loadActive()]);
});
            
