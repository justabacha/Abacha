// --- 1. IMMEDIATE WALLPAPER LOAD ---
(function () {
  const savedWall = localStorage.getItem("phestone-wallpaper");
  if (savedWall) {
    document.body.style.setProperty(
      "background-image",
      `url(${savedWall})`,
      "important"
    );
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
  }
})();

// --- 2. GLOBALS ---
const parseEmojis = (el) => {
  if (!el) return;
  twemoji.parse(el, {
    callback: (icon) =>
      'https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/' + icon + '.png'
  });
};
const urlParams = new URLSearchParams(window.location.search);
const friendID = urlParams.get("friend_id");
let replyingTo = null;
let currentPins = [];
let pendingPinMsg = null;
let messageToDelete = null;
let cachedMyAvatar = null;
let cachedFriendAvatar = null;
// --- 2.5 GHOST CACHE ENGINE (The Transformer) ---
const getGhostCache = (roomID) => JSON.parse(localStorage.getItem(`ghost_cache_${roomID}`)) || [];

const saveToGhostCache = (roomID, msg) => {
  let cache = getGhostCache(roomID);
  // Ensure we don't double-save
  if (!cache.find(m => m.id === msg.id || (msg.id.startsWith('temp-') && m.content === msg.content))) {
    cache.push(msg);
    // Keep it chronologically sorted
    cache.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    localStorage.setItem(`ghost_cache_${roomID}`, JSON.stringify(cache));
  }
};

const updateCacheStatus = (roomID, updatedMsg) => {
  let cache = getGhostCache(roomID);
  const index = cache.findIndex(m => m.id === updatedMsg.id);
  if (index !== -1) {
    // If it's been hidden/deleted, pluck it out of the capsule
    if (updatedMsg.hidden_from?.includes(friendID) && updatedMsg.hidden_from?.includes(updatedMsg.sender_id)) {
        cache.splice(index, 1);
    } else if (updatedMsg.hidden_from?.includes(urlParams.get("friend_id"))) {
        // Just let it be, but if WE hid it, remove from our local view
        cache.splice(index, 1);
    } else {
        cache[index] = { ...cache[index], ...updatedMsg };
    }
    localStorage.setItem(`ghost_cache_${roomID}`, JSON.stringify(cache));
  }
};

// --- 3. GLOBAL UI HELPERS ---
window.cancelReply = () => {
  document.getElementById("reply-preview-container").style.display = "none";
  replyingTo = null;
};

window.closeGhostModal = () => {
  document.getElementById("delete-modal").style.display = "none";
  document.getElementById("pin-modal").style.display = "none";
};window.deleteMessage = (id) => {
  messageToDelete = id;
  document.getElementById("delete-modal").style.display = "flex";
  document.getElementById("chat-overlay").style.display = "none";
};

window.confirmGhostDelete = async () => {
  if (!messageToDelete) return;
  
  const targetId = messageToDelete; // Capture ID immediately
  const roomID = [urlParams.get("friend_id"), (await supabaseClient.auth.getUser()).data.user.id].sort().join("_");

  // (1). OPTIMISTIC UI: Remove from DOM
  const el = document.getElementById(`msg-wrapper-${targetId}`);
  if (el) el.remove(); 

  // (2). CACHE PURGE: Prevent the "Zombie" message on refresh
  let cache = getGhostCache(roomID);
  localStorage.setItem(`ghost_cache_${roomID}`, JSON.stringify(cache.filter(m => m.id !== targetId)));

  // (3). UI CLEANUP: Close modal now so it doesn't feel laggy
  window.closeGhostModal();
  messageToDelete = null;

  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // (3a). Fetch current state to see if other person already hid it
    const { data: msg } = await supabaseClient
      .from("messages")
      .select("hidden_from, sender_id, receiver_id")
      .eq("id", targetId)
      .single();

    if (!msg) return;

    const otherPersonID = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    const isAlreadyHiddenByOther = msg.hidden_from?.includes(otherPersonID);

    if (isAlreadyHiddenByOther) {
      // (3b). Delete permanently if both hid it
      await supabaseClient.from("messages").delete().eq("id", targetId);
    } else {
      // (3c). Update hidden_from array
      const updatedHiddenFrom = [...(msg.hidden_from || []), user.id];
      await supabaseClient
        .from("messages")
        .update({ hidden_from: updatedHiddenFrom })
        .eq("id", targetId);
    }
  } catch (err) {
    console.error("Ghost Delete Logic Error:", err);
  }
};

window.openPinModal = (id, content) => {
  if (currentPins.length >= 2) {
    alert("Ghost Layer Limit: 2 Pins max.");
    return;
  }
  pendingPinMsg = { id, content };
  document.getElementById("pin-modal").style.display = "flex";
  document.getElementById("chat-overlay").style.display = "none";
};

window.executePin = async (hours) => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  
  const { error } = await supabaseClient
    .from("messages")
    .update({ pinned_until: expiry.toISOString() })
    .eq("id", pendingPinMsg.id);

  if (error) {
      window.showGhostPrompt("Pinning failed. Policy issue! 📌");
  } else {
      window.closeGhostModal();
      // Silently refresh pins without reloading page
      setTimeout(() => window.loadPins(), 300);
  }
};

window.unpinMessage = async (id) => {
  await supabaseClient
    .from("messages")
    .update({ pinned_until: null })
    .eq("id", id);
  window.loadPins();
};
// --- OPTIMIZED GHOST ENGINE ---
let heartbeatInterval;
let statusChannel;

const stopGhostServices = () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (statusChannel) statusChannel.unsubscribe();
};

const startGhostServices = (user, roomID) => {
    stopGhostServices(); 
    heartbeatInterval = setInterval(async () => {
        if (document.visibilityState === 'visible') {
            await supabaseClient.from('profiles').update({ 
                last_seen: new Date().toISOString() 
            }).eq('id', user.id);
        }
    }, 30000);

    statusChannel = supabaseClient.channel(`status_${roomID}`);
    statusChannel.on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId === friendID) {
            const indicator = document.getElementById("typing-indicator");
            if (indicator) {
                indicator.style.display = "block";
                clearTimeout(window.typingTimer);
                window.typingTimer = setTimeout(() => indicator.style.display = "none", 2000);
            }
        }
    }).subscribe();
};
window.addEventListener('beforeunload', stopGhostServices);

// --- 4. MAIN CHAT ENGINE ---
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const roomID = [user.id, friendID].sort().join("_");
  if (!user || !friendID) return;
   // START THE ENGINE FOR CURRENT CHAT
  startGhostServices(user, roomID);
  const chatBox = document.getElementById("chat-box");
  const sendBtn = document.getElementById("send-btn");
  const msgInput = document.getElementById("msg-input");

 // A. RECEIVER HEADER (Synced & Ghost-Fast)
  const syncReceiverHeader = async () => {
    const nameEl = document.getElementById('header-name');
    const avatarEl = document.getElementById('header-avatar');
    const statusEl = document.getElementById('online-status');
    const cacheKey = `ghost_user_${friendID}`;

    // A1. GHOST FAST-TRACK: Load from local storage instantly
    const cachedFriend = JSON.parse(localStorage.getItem(cacheKey));
    if (cachedFriend) {
      if (nameEl) nameEl.textContent = cachedFriend.username || 'Ghost';
      if (avatarEl && cachedFriend.avatar) {
        avatarEl.style.backgroundImage = `url('${cachedFriend.avatar}')`;
        avatarEl.style.backgroundSize = "cover";
        avatarEl.style.backgroundColor = "transparent";
      }
    }

    // A2. ROBUST LOGIC: Sync with DB
    try {
        const { data: friend, error } = await supabaseClient
          .from('profiles')
          .select('*') 
          .eq('id', friendID)
          .maybeSingle();

        if (error || !friend) return;

        // Update UI with fresh data
        const freshUsername = friend.username || 'Ghost';
        const freshAvatar = friend.avatar_url || friend.avatar;

        if (nameEl) nameEl.textContent = freshUsername;
        
        if (avatarEl && freshAvatar) {
          avatarEl.style.backgroundImage = `url('${freshAvatar}')`;
          avatarEl.style.backgroundSize = "cover";
          avatarEl.style.backgroundColor = "transparent";
        }

        // Save to cache for next time
        localStorage.setItem(cacheKey, JSON.stringify({
          username: freshUsername,
          avatar: freshAvatar
        }));

        const isOnline = friend.last_seen && (new Date() - new Date(friend.last_seen) < 60000);
        if (statusEl) {
            statusEl.textContent = isOnline ? "● ONLINE" : "● OFFLINE";
            statusEl.style.color = isOnline ? "#32D74B" : "#f21515";
        }
    } catch (err) {
        console.error("Header Sync Failed:", err);
    }
  };
  syncReceiverHeader();
  // B. LOAD PINS
 window.loadPins = async () => {
    const now = new Date().toISOString();
    const { data: pins } = await supabaseClient
      .from("messages")
      .select("*")
      .gt("pinned_until", now);

    currentPins = pins || [];
    const pinBar = document.getElementById("pinned-bar");

    if (currentPins.length) {
      pinBar.style.display = "block";
      pinBar.innerHTML = currentPins
        .map((p) => {
          // GHOST FIX: Clean the text specifically for the Pin Bar display
          let displayContent = p.content;
          if (displayContent.includes("]\n")) {
            displayContent = displayContent.split("]\n")[1] || "";
          }
          
          return `
            <div class="pin-item">
              <span>📌 ${displayContent.substring(0, 25)}${displayContent.length > 25 ? '...' : ''}</span>
              <span onclick="window.unpinMessage('${p.id}')" style="cursor:pointer;padding:5px;">✕</span>
            </div>`;
        })
        .join("");
    } else {
      pinBar.style.display = "none";
    }
};
// C. DISPLAY MESSAGE (Ghost Speed Version)
const displayMessage = (msg, friendAvatar = null, myAvatar = null) => {
    // C1. Check if ID already exists
    if (document.getElementById(`msg-wrapper-${msg.id}`)) return;

    // C2. Check for "Optimistic" duplicates (same content/sender/recent time)
    const existing = Array.from(chatBox.querySelectorAll('.msg-wrapper')).find(el => {
        return el.getAttribute('data-content') === msg.content && 
               Math.abs(parseInt(el.getAttribute('data-timestamp')) - new Date(msg.created_at).getTime()) < 5000;
    });
    if (existing) {
        // Just update the ID of the temp message to the real one from DB
        if (existing.id.startsWith('msg-wrapper-temp-')) existing.id = `msg-wrapper-${msg.id}`;
        return;
    }

    const isMe = msg.sender_id === user.id;
    const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const ticks = msg.is_read 
      ? '<span style="color: #06acff; margin-left: 4px;">✓✓</span>' 
      : '<span style="color: #c0bebe; margin-left: 4px;">✓✓</span>';

    const wrapper = document.createElement("div");
    wrapper.id = `msg-wrapper-${msg.id}`; 
    wrapper.className = `msg-wrapper ${isMe ? "user-wrapper" : "ai-wrapper"}`;
    wrapper.setAttribute('data-timestamp', new Date(msg.created_at).getTime());
    wrapper.setAttribute('data-content', msg.content);
   // Clean Fallback Logic
const myInitial = user.email ? user.email.charAt(0).toUpperCase() : 'G';
const friendInitial = document.getElementById('header-name')?.textContent?.charAt(0) || 'G';

const avatarImg = isMe 
  ? (cachedMyAvatar || `https://ui-avatars.com/api/?name=${myInitial}&background=007AFF&color=fff`) 
  : (cachedFriendAvatar || `https://ui-avatars.com/api/?name=${friendInitial}&background=32D74B&color=fff`);
   
 const isPhoto = msg.message_type === 'photo' && msg.file_url;
    
    let innerContent = '';
     if (isPhoto) {
        const urls = msg.file_url.split(',').filter(url => url.trim() !== "");
        
        innerContent = `
            <div class="insta-photo-stack ${msg.is_loading ? 'loading-stack' : ''}" 
    onclick="${msg.is_loading ? '' : `window.viewFullHD('${msg.file_url}', '${msg.id}', '${msg.sender_id}')`}"
    style="position:relative; width: 55vw; max-width: 200px; aspect-ratio: 3/4; margin-bottom: 15px; cursor: pointer; margin-left: 10px;">
    
    ${msg.is_loading ? '<div class="stack-loader"></div>' : ''}
    
    ${urls.slice(0, 3).reverse().map((url, i) => {
        // Reverse so the first image is always on top (z-index)
        // Aggressive stack: Rotate more and shift X/Y coordinates
        const index = 2 - i; // Correcting index for the top-layer
        const rotate = index * 6 - 6; // More rotation (e.g., -6, 0, 6)
        const shiftX = index * 8 - 8; // Shifts them sideways so you see the "edge"
        const shiftY = index * 4;     // Slight vertical stagger
        
        return `
            <img src="${url}" 
                 onerror="this.src='https://via.placeholder.com/150?text=Ghost+Image'" 
                 style="position:absolute; width:100%; height:100%; object-fit:cover; border-radius:18px; 
                        border:1px solid rgba(255,255,255,0.15); 
                        transform: rotate(${rotate}deg) translate(${shiftX}px, ${shiftY}px); 
                        z-index: ${10 - index}; 
                        box-shadow: -5px 8px 20px rgba(0,0,0,0.5);">
        `;
    }).reverse().join('')}

    ${urls.length > 1 && !msg.is_loading ? `
        <div style="position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:4px 10px; border-radius:10px; font-size:10px; z-index:20; backdrop-filter:blur(10px); font-weight:bold; border: 1px solid rgba(255,255,255,0.1);">
            1/${urls.length}
        </div>` : ''}
</div>
            ${msg.content ? `<div style="padding: 5px 10px; font-size: 14px; color: white; word-wrap: break-word; max-width: 60vw;">${msg.content}</div>` : ''}`;
    } else {
        innerContent = msg.content.includes("↳ [") 
          ? `<div class="reply-quote">${msg.content.split("]\n")[0].replace("↳ [", "")}</div><div>${msg.content.split("]\n")[1] || ""}</div>`
          : `<div>${msg.content}</div>`;
    }

    // This structure preserves your original avatar and layout while toggling the container class
    wrapper.innerHTML = `
      <img src="${avatarImg}" class="avatar">
      <div class="${isPhoto ? 'photo-vibe-container' : 'message ' + (isMe ? 'sent' : 'received')}">
        ${innerContent}
        <div class="msg-time" style="font-size:10px; opacity:0.7; margin-top:4px; text-align:right; display: flex; align-items: center; justify-content: flex-end; padding-right: 5px;">
          ${timeStr} ${isMe ? ticks : ''}
        </div>
      </div>
    `;

    const existingMessages = [...chatBox.querySelectorAll('.msg-wrapper')];
    const nextMsg = existingMessages.find(el => 
      parseInt(el.getAttribute('data-timestamp')) > parseInt(wrapper.getAttribute('data-timestamp'))
    );

    if (nextMsg) chatBox.insertBefore(wrapper, nextMsg);
    else chatBox.appendChild(wrapper);
    parseEmojis(wrapper);
    // GHOST FIX: Support both standard messages and photo containers for the menu
    const bubble = wrapper.querySelector(".message") || wrapper.querySelector(".photo-vibe-container");
    
    if (bubble) {
        bubble.oncontextmenu = (e) => {
            e.preventDefault();
            // Pass the original msg object so the menu knows if it's a photo or text
            window.showActionMenu(msg, bubble.cloneNode(true));
        };
    }
  };
// --- D. LOAD HISTORY (Ghost Speed Edition + Fail Safe) ---
const loadGhostHistory = async () => {
  const roomID = [user.id, friendID].sort().join("_");
  const msgFilter = `and(sender_id.eq."${user.id}",receiver_id.eq."${friendID}"),and(sender_id.eq."${friendID}",receiver_id.eq."${user.id}")`;

  try {
    chatBox.style.opacity = "1"; 

    // D1. FETCH AVATARS FIRST
    // We need this so both Cache and DB messages have the right images
    const { data: profiles, error: pError } = await supabaseClient
      .from('profiles')
      .select('id, avatar_url')
      .in('id', [user.id, friendID]);

    if (!pError) {
      cachedMyAvatar = profiles?.find(p => p.id === user.id)?.avatar_url;
      cachedFriendAvatar = profiles?.find(p => p.id === friendID)?.avatar_url;
    }

    // D2. INSTANT LOAD FROM LOCAL CACHE
    const localMsgs = getGhostCache(roomID);
    if (localMsgs.length > 0) {
      chatBox.innerHTML = "";
      localMsgs.forEach(msg => displayMessage(msg, cachedFriendAvatar, cachedMyAvatar));
      chatBox.scrollTop = chatBox.scrollHeight;
      chatBox.classList.add('ready');
      chatBox.style.opacity = "1"; // Show cache immediately
    }

    // D3. FETCH THE DELTA (New messages only)
    const lastTimestamp = localMsgs.length > 0 
      ? localMsgs[localMsgs.length - 1].created_at 
      : new Date(0).toISOString();

    const { data: newVibes } = await supabaseClient
      .from("messages")
      .select("*")
      .or(msgFilter)
      .gt("created_at", lastTimestamp)
      .not('hidden_from', 'cs', `{${user.id}}`)
      .order("created_at", { ascending: true });

    if (newVibes && newVibes.length > 0) {
      newVibes.forEach(msg => {
        if (!document.getElementById(`msg-wrapper-${msg.id}`)) {
          displayMessage(msg, cachedFriendAvatar, cachedMyAvatar);
          saveToGhostCache(roomID, msg);
        }
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    // D4. BACKGROUND MARK AS READ (Your original Logic)
    supabaseClient.from("messages")
      .update({ is_read: true })
      .eq("sender_id", friendID)
      .eq("receiver_id", user.id)
      .eq("is_read", false)
      .then();

    // D5. BACKGROUND SYNC (Keep cache fresh for deletions/ticks)
    const { data: syncCheck } = await supabaseClient
      .from("messages")
      .select("*")
      .or(msgFilter)
      .order("created_at", { ascending: false })
      .limit(50);

    if (syncCheck) {
      syncCheck.forEach(m => updateCacheStatus(roomID, m));
    }

  } catch (err) {
    console.error("Ghost Load Error:", err);
  } finally {
    chatBox.style.opacity = "1"; // Fail-safe show
  }
  window.loadPins();
};
loadGhostHistory();
  // E. GHOST PROMPT (FORWARD)
  window.showGhostPrompt = (message) => {
    const overlay = document.getElementById("ghost-prompt-overlay");
    overlay.style.display = "flex";
    overlay.innerHTML = `
      <div class="ghost-prompt-tile">
        <div class="prompt-logo">|Just•Abacha😎|</div>
        <div class="prompt-text">${message}</div>
        <button class="vibe-btn" onclick="document.getElementById('ghost-prompt-overlay').style.display='none'">Vibe</button>
      </div>`;
      // Auto-pull back up after 3s if they don't click "Vibe"
    setTimeout(() => {
        if (overlay.style.display === "flex") {
            overlay.style.display = "none";
        }
    }, 3000);
  };

  // F. ACTION MENU
 window.showActionMenu = (msg, clonedBubble) => {
    const overlay = document.getElementById("chat-overlay");
    const menuContainer = document.getElementById("menu-content");
    const isPinned = currentPins.some((p) => p.id === msg.id);

    // WHATSAPP STYLE: Grab only the actual message text for the UI/Pins
    let cleanText = msg.content;
    if (cleanText.includes("]\n")) {
        cleanText = cleanText.split("]\n")[1] || "";
    }

    const safeContent = cleanText
        .replace(/'/g, "\\'")
        .replace(/\n/g, " ")
        .trim();

    menuContainer.innerHTML = "";
    clonedBubble.classList.add("popped-message");

    menuContainer.appendChild(clonedBubble);
    menuContainer.insertAdjacentHTML(
      "beforeend",
      `
      <div class="action-tile">
        <div class="action-item" onclick="window.triggerReply('${msg.sender_id}', '${safeContent}')">Reply ✍️</div>
        <div class="action-item" onclick="navigator.clipboard.writeText('${safeContent}').then(() => { alert('Ghost Copied!'); document.getElementById('chat-overlay').style.display='none'; })">Copy 📑</div>
        <div class="action-item" onclick="window.showGhostPrompt('This feature is coming soon.!🍻')">Forward 📤</div>
        <div class="action-item" onclick="${isPinned ? `window.unpinMessage('${msg.id}')` : `window.openPinModal('${msg.id}', '${safeContent}')`}">
            ${isPinned ? "Unpin" : "Pin"} 📌
        </div>
        <div class="action-item delete" onclick="window.deleteMessage('${msg.id}')">Delete 🗑️</div>
      </div>`
    );

    overlay.style.display = "flex";
};

  // G. REPLY
  window.triggerReply = async (senderId, content) => {
  let name;

  if (senderId === user.id) {
    name = "You";
  } else {
    const { data: p } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', senderId)
      .single();

    name = p?.username || "User";
  }

  replyingTo = { senderId, name, content };

  const container = document.getElementById('reply-preview-container');
  container.style.display = 'block';
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; color:white;">
      <div style="border-left:4px solid #007AFF; padding-left:10px;">
        <div style="color:#007AFF; font-size:10px; font-weight:bold;">
          Replying to ${name}
        </div>
        <div style="font-size:12px; opacity:0.8;">
          ${content.substring(0, 30)}...
        </div>
      </div>
      <span onclick="window.cancelReply()" style="color:#FF3B30; cursor:pointer;">✕</span>
    </div>
  `;

  document.getElementById('chat-overlay').style.display = 'none';
};
  // H. SEND & INPUT ENGINE
 const handleSend = async () => {
    const message = msgInput.value.trim();

    // GHOST CHECK: If we have photos, use the uploader from ui-extra.js
    if (typeof selectedFiles !== 'undefined' && selectedFiles.length > 0) {
        // --- GHOST OPTIMISTIC PHOTO STACK ---
        const tempId = 'temp-photo-' + Date.now();
        // Create local preview URLs so we don't wait for upload to see the images
        const localPreviews = selectedFiles.slice(0, 3).map(file => URL.createObjectURL(file));
        
        const tempMsg = {
            id: tempId,
            content: message || 'Photo 📸',
            sender_id: user.id,
            receiver_id: friendID,
            message_type: 'photo',
            file_url: localPreviews.join(','), 
            created_at: new Date().toISOString(),
            is_loading: true // This triggers the spinner and blur
        };

        displayMessage(tempMsg, cachedFriendAvatar, cachedMyAvatar);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Reset input immediately to prevent double-sending
        msgInput.value = "";
        msgInput.style.height = 'auto';

        const success = await window.uploadAndSendPhotos(message, user, friendID, roomID);
        
        if (!success) {
            document.getElementById(`msg-wrapper-${tempId}`)?.remove();
            window.showGhostPrompt("Upload failed! 💀");
        }
        return; 
    }
    if (!message) return;

    let content = message;
    if (replyingTo) {
      content = `↳ [Replying to ${replyingTo.name}: ${replyingTo.content}]\n${message}`;
      window.cancelReply();
    }

    // --- INSTANT DISPLAY (Optimistic) ---
    const tempId = 'temp-' + Date.now();
    const tempMsg = {
        id: tempId,
        content: content,
        sender_id: user.id,
        receiver_id: friendID,
        created_at: new Date().toISOString()
    };
    displayMessage(tempMsg, cachedFriendAvatar, cachedMyAvatar);
    saveToGhostCache(roomID, tempMsg);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    chatBox.scrollTop = chatBox.scrollHeight;
    
    msgInput.value = "";
    msgInput.style.height = 'auto';//reset height after sending

    // --- BACKGROUND SEND ---
    const { error } = await supabaseClient.from('messages').insert([
      {
        content,
        sender_id: user.id,
        receiver_id: friendID,
        sender_email: user.email
      }
    ]);

    if (error) {
        document.getElementById(`msg-wrapper-${tempId}`)?.remove();
        window.showGhostPrompt("Vibe failed to send... 💀");
    }
  };

  // Ghost Expansion Engine
  msgInput.addEventListener('input', function() {
      this.style.height = 'auto'; // Reset to calculate actual scrollHeight
      const offset = this.offsetHeight - this.clientHeight;
      const newHeight = this.scrollHeight + offset;
      
      // Limit to about 5 lines (approx 120px)
      if (newHeight < 120) {
          this.style.height = newHeight + 'px';
          this.style.overflowY = 'hidden';
      } else {
          this.style.height = '120px';
          this.style.overflowY = 'scroll';
      }
      // 👇 EMOJI PREVIEW MAGIC
    const preview = document.getElementById('emoji-preview');
    preview.innerText = this.value;

    parseEmojis(preview);
  });

 msgInput.addEventListener('keydown', (e) => {
      // Check if it's the Enter key
      if (e.key === "Enter") {
          const isMobile = window.matchMedia("(pointer: coarse)").matches;

          if (!e.shiftKey && !isMobile) {
              e.preventDefault(); // Stop the new line
              handleSend();      // Send the vibe
          }
      }
  });

  sendBtn.onclick = handleSend;

  // Send typing signal
  let lastTypingSignal = 0;
  msgInput.addEventListener("input", () => {
    const now = Date.now();
    // Only send the signal once every 2 seconds to keep the connection clear
    if (now - lastTypingSignal > 2000) {
      statusChannel.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: user.id },
      });
      lastTypingSignal = now;
    }
  });

  // Fix: Auto-refresh Online status every 10 seconds
  setInterval(syncReceiverHeader, 10000);

// I. REALTIME (Optimized for Race Conditions)
const dbChannel = supabaseClient
  .channel(`chat_messages_${roomID}`)
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "messages" },
    (payload) => {
      const m = payload.new;
      if ((m.sender_id === user.id || m.receiver_id === user.id) && (m.sender_id === friendID || m.receiver_id === friendID)) {
        saveToGhostCache(roomID, m);
        if (m.sender_id !== user.id) {
          displayMessage(m, cachedFriendAvatar, cachedMyAvatar);
          supabaseClient.from("messages").update({ is_read: true }).eq("id", m.id).then();
       } else {
          // ID SWAP LOGIC (Handles both Text and Photos)
          const temps = chatBox.querySelectorAll('[id^="msg-wrapper-temp-"]');
          temps.forEach(t => {
            const isMatch = m.message_type === 'photo' 
                ? t.id.includes('temp-photo') // Match photo temp
                : t.getAttribute('data-content').trim() === m.content.trim(); // Match text temp

            if (isMatch) {
              t.id = `msg-wrapper-${m.id}`;
              t.setAttribute('data-timestamp', new Date(m.created_at).getTime());
              
              // If it's a photo, kill the loader and refresh the stack with HD URLs
              if (m.message_type === 'photo') {
                  const stack = t.querySelector('.insta-photo-stack');
                  if (stack) {
                      stack.classList.remove('loading-stack');
                      stack.onclick = () => window.viewFullHD(m.file_url.split(',')[0]);
                      const loader = stack.querySelector('.stack-loader');
                      if (loader) loader.remove();
                  }
              }
              saveToGhostCache(roomID, m);
            }
          });
        }
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
      }
    }
  )
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "messages" },
    (payload) => {
      const m = payload.new;
      updateCacheStatus(roomID, m);
      // I1. Handle Deletion/Hiding for the current user
      if (m.hidden_from?.includes(user.id)) {
        const el = document.getElementById(`msg-wrapper-${m.id}`);
        if (el) el.remove();
        //purge from cache so it doesn't come back on refresh
        let cache = getGhostCache(roomID);
        localStorage.setItem(`ghost_cache_${roomID}`, JSON.stringify(cache.filter(msg => msg.id !== m.id)));
        return;
      }

    // I2. Handle Blue Ticks (Wait for ID swap if needed)
      if (m.is_read) {
        let msgEl = document.getElementById(`msg-wrapper-${m.id}`);
        
        // GHOST FAIL-SAFE: If the ID hasn't swapped yet, find it by content or photo status
        if (!msgEl) {
           const temps = chatBox.querySelectorAll('[id^="msg-wrapper-temp-"]');
           temps.forEach(t => {
             const isPhotoMatch = m.message_type === 'photo' && t.id.includes('temp-photo');
             const isTextMatch = m.content && t.getAttribute('data-content')?.trim() === m.content.trim();

             if (isPhotoMatch || isTextMatch) {
               msgEl = t;
               msgEl.id = `msg-wrapper-${m.id}`; // Force the ID swap now blud
             }
           });
        }

        // PAINT THE BLUE TICKS
        if (msgEl && msgEl.classList.contains('user-wrapper')) {
          const timeContainer = msgEl.querySelector('.msg-time');
          
          // Check if it's already blue to avoid flickering
          if (timeContainer && !timeContainer.querySelector('span[style*="#06acff"]')) {
            const timeOnly = timeContainer.textContent.replace('✓✓', '').trim();
            // Use innerHTML to inject the blue tick span
            timeContainer.innerHTML = `${timeOnly} <span style="color: #06acff; margin-left: 4px;">✓✓</span>`;
          }
        }
      }
    }
  )
  .on(
    "postgres_changes",
    { event: "DELETE", schema: "public", table: "messages" },
    (payload) => {
      const deletedId = payload.old.id;
      document.getElementById(`msg-wrapper-${deletedId}`)?.remove();
      let cache = getGhostCache(roomID);
      localStorage.setItem(`ghost_cache_${roomID}`, JSON.stringify(cache.filter(msg => msg.id !== deletedId)));
    }
  )
  .subscribe();

});
