document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // --- IDENTITY LOCK (Header) ---
    const syncMyHeader = async () => {
        const { data: myProfile } = await supabaseClient
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id) 
            .maybeSingle();

        if (myProfile) {
            const aliasEl = document.getElementById('my-own-alias');
            const avatarEl = document.getElementById('my-own-avatar');
            if (aliasEl) aliasEl.innerText = `@${myProfile.username}`;
            if (avatarEl && myProfile.avatar_url) {
                avatarEl.style.backgroundImage = `url(${myProfile.avatar_url})`;
            }
        }
    };
    syncMyHeader(); 

    // --- 1. LOAD PENDING VIBES ---
    const loadPending = async () => {
        const { data: requests, error } = await supabaseClient
            .from('friendships')
            .select(`id, sender_id, profiles:sender_id (username, avatar_url)`)
            .eq('receiver_id', user.id)
            .eq('status', 'pending');

        const container = document.getElementById('pending-list');
        if (!container) return;
        container.innerHTML = requests?.length ? '' : '<p style="color:gray; font-size:12px;">No new requests...</p>';
        
        requests?.forEach(req => {
            const card = document.createElement('div');
            card.className = 'user-card-wrapper';
            card.innerHTML = `
                <div class="user-card read-vibe">
                    <div class="user-avatar" style="background-image: url(${req.profiles?.avatar_url || 'default-avatar.png'})"></div>
                    <div class="user-info">
                        <h4>${req.profiles?.username || 'Ghost'}</h4>
                        <p>Wants to vibe</p>
                    </div>
                    <button class="accept-btn" style="background:#32D74B; border:none; padding:8px 15px; border-radius:12px; font-weight:bold; cursor:pointer;" onclick="acceptVibe('${req.id}')">Accept</button>
                </div>`;
            container.appendChild(card);
        });
    };
    
    // --- 2. LOAD ACTIVE CHATS ---
    const loadActive = async () => {
        const { data: friends } = await supabaseClient
            .from('friendships')
            .select(`*, sender:profiles!friendships_sender_id_fkey(id, username, avatar_url), receiver:profiles!friendships_receiver_id_fkey(id, username, avatar_url)`)
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const container = document.getElementById('active-chats');
        if (!container) return;
        container.innerHTML = friends?.length ? '' : '<p style="color:gray; font-size:12px;">Find someone to chat with!</p>';

        const displayedIDs = new Set();
        for (const f of (friends || [])) {
            let friend = f.sender_id === user.id ? f.receiver : f.sender;
            if (friend && !displayedIDs.has(friend.id)) {
                displayedIDs.add(friend.id);

                const { data: lastMsg } = await supabaseClient
                    .from('messages').select('*')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: false }).limit(1).maybeSingle();

                const isUnread = lastMsg && lastMsg.receiver_id === user.id && !lastMsg.is_read;
                const statusClass = isUnread ? 'unread-vibe' : 'read-vibe';
                const time = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                const msgPreview = lastMsg ? lastMsg.content.substring(0, 25) + '...' : 'Tap to enter tunnel';

                const wrapper = document.createElement('div');
                wrapper.className = 'user-card-wrapper';
                wrapper.innerHTML = `
                    <div class="swipe-action swipe-pin">📌</div>
                    <div class="swipe-action swipe-delete">🗑️</div>
                    <div class="user-card ${statusClass}" id="card-${friend.id}" onclick="handleEntry('${friend.id}')">
                        <div class="user-avatar" style="background-image: url(${friend.avatar_url || 'default-avatar.png'})"></div>
                        <div class="user-info">
                            <h4>${friend.username} <span class="msg-time">${time}</span></h4>
                            <p>${msgPreview}</p>
                        </div>
                    </div>`;
                container.appendChild(wrapper);
                
                addLongPress(document.getElementById(`card-${friend.id}`), friend.id);
                addSwipeLogic(wrapper);
            }
        }
    };
    
    // --- 3. SEARCH LOGIC ---
    const searchInput = document.getElementById('search-ghost');
    const searchResults = document.getElementById('search-results');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const term = e.target.value.trim();
            if (term.length < 2) { searchResults.innerHTML = ''; return; }
            const { data: ghosts } = await supabaseClient.from('profiles').select('id, username, avatar_url').ilike('username', `%${term}%`).neq('id', user.id).limit(5);
            searchResults.innerHTML = '';
            ghosts?.forEach(g => {
                const card = document.createElement('div');
                card.className = 'user-card-wrapper';
                card.innerHTML = `
                    <div class="user-card read-vibe">
                        <div class="user-avatar" style="background-image: url(${g.avatar_url || 'default-avatar.png'})"></div>
                        <div class="user-info"><h4>${g.username}</h4><p>New Ghost found</p></div>
                        <button class="accept-btn" style="background:#32D74B; border:none; padding:8px 15px; border-radius:12px; font-weight:bold; cursor:pointer;" onclick="sendVibe('${g.id}')">Vibe</button>
                    </div>`;
                searchResults.appendChild(card);
            });
        });
    }

    // --- GLOBAL ACTIONS ---
    window.handleEntry = (friendId) => {
        if (localStorage.getItem(`locked_${friendId}`)) {
            if (prompt("Enter 4-Digit PIN:") === "1234") window.location.href = `chat.html?friend_id=${friendId}`;
            else alert("Access Denied 💀");
        } else {
            window.location.href = `chat.html?friend_id=${friendId}`;
        }
    };

    const addLongPress = (el, id) => {
        let timer;
        el.addEventListener('touchstart', () => timer = setTimeout(() => {
            if(confirm("Lock this chat tunnel?")) localStorage.setItem(`locked_${id}`, 'true');
        }, 800));
        el.addEventListener('touchend', () => clearTimeout(timer));
    };

    const addSwipeLogic = (wrapper) => {
        let startX;
        const card = wrapper.querySelector('.user-card');
        card.addEventListener('touchstart', e => startX = e.touches[0].clientX);
        card.addEventListener('touchmove', e => {
            let diff = e.touches[0].clientX - startX;
            if (Math.abs(diff) > 10) {
                if (diff < -50) card.style.transform = 'translateX(-70px)';
                if (diff > 50) card.style.transform = 'translateX(70px)';
            }
        });
        card.addEventListener('touchend', () => setTimeout(() => card.style.transform = 'translateX(0)', 2000));
    };

    window.sendVibe = async (id) => {
        await supabaseClient.from('friendships').insert([{ sender_id: user.id, receiver_id: id, status: 'pending' }]);
        alert("Vibe sent! 🚀");
    };

    window.acceptVibe = async (id) => {
        await supabaseClient.from('friendships').update({ status: 'accepted' }).eq('id', id);
        location.reload();
    };

    Promise.all([loadPending(), loadActive()]);
});
            
