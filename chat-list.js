document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // 1. Load Pending Vibes (Requests sent to YOU)
    const loadPending = async () => {
        const { data: requests } = await supabaseClient
            .from('friendships')
            .select(`id, sender_id, profiles!friendships_sender_id_fkey(username, avatar_url)`)
            .eq('receiver_id', user.id)
            .eq('status', 'pending');

        const container = document.getElementById('pending-list');
        container.innerHTML = requests?.length ? '' : '<p style="color:gray; font-size:12px;">No new vibes yet...</p>';
        
        requests?.forEach(req => {
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <div class="user-avatar" style="background-image: url(${req.profiles.avatar_url || 'default-avatar.png'})"></div>
                <div class="user-info">
                    <h4>${req.profiles.username}</h4>
                    <p>Sent you a vibe request</p>
                </div>
                <button class="accept-btn" onclick="acceptVibe('${req.id}')">Accept</button>
            `;
            container.appendChild(card);
        });
    };

    // 2. Load Active Chats
    const loadActive = async () => {
        const { data: friends } = await supabaseClient
            .from('friendships')
            .select(`*, sender:profiles!friendships_sender_id_fkey(id, username, avatar_url), receiver:profiles!friendships_receiver_id_fkey(id, username, avatar_url)`)
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const container = document.getElementById('active-chats');
        container.innerHTML = '';

        friends?.forEach(f => {
            const friend = f.sender_id === user.id ? f.receiver : f.sender;
            const card = document.createElement('div');
            card.className = 'user-card';
            card.onclick = () => window.location.href = `chat.html?friend_id=${friend.id}`;
            card.innerHTML = `
                <div class="user-avatar" style="background-image: url(${friend.avatar_url || 'default-avatar.png'})"></div>
                <div class="user-info">
                    <h4>${friend.username}</h4>
                    <p>Tap to chat</p>
                </div>
            `;
            container.appendChild(card);
        });
    };

    window.acceptVibe = async (id) => {
        await supabaseClient.from('friendships').update({ status: 'accepted' }).eq('id', id);
        location.reload();
    };

    loadPending();
    loadActive();
});
              
