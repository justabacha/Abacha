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
  
  // 1. Hide it from the UI immediately (Optimistic)
  const el = document.getElementById(`msg-wrapper-${messageToDelete}`);
  if (el) el.remove();

  // 2. SOFT DELETE: Add current user's ID to the hidden_from array
  const { data: { user } } = await supabaseClient.auth.getUser();
  
  // First, get the current array to avoid overwriting others' deletions
  const { data: msg } = await supabaseClient
    .from("messages")
    .select("hidden_from")
    .eq("id", messageToDelete)
    .single();

  const updatedHiddenFrom = [...(msg?.hidden_from || []), user.id];

  const { error } = await supabaseClient
    .from("messages")
    .update({ hidden_from: updatedHiddenFrom })
    .eq("id", messageToDelete);

  if (error) {
      console.error("Ghost Hide Failed:", error.message);
      window.showGhostPrompt("Could't hide that vibe... 💀");
  }

  messageToDelete = null;
  window.closeGhostModal();
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

// --- 4. MAIN CHAT ENGINE ---
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const roomID = [user.id, friendID].sort().join("_");
  if (!user || !friendID) return;

  const chatBox = document.getElementById("chat-box");
  const sendBtn = document.getElementById("send-btn");
  const msgInput = document.getElementById("msg-input");

  // A. RECEIVER HEADER (Synced with Chatlist Logic)
  const syncReceiverHeader = async () => {
    try {
        console.log("Ghost Protocol: Fetching friend data for", friendID);
        const { data: friend, error } = await supabaseClient
          .from('profiles')
          .select('*') // Pull all columns to match chatlist.js robustness
          .eq('id', friendID)
          .maybeSingle();

        if (error || !friend) {
          console.error("Ghost Header Error:", error);
          return;
        }

        // Target the specific elements by ID
        const nameEl = document.getElementById('header-name');
        const avatarEl = document.getElementById('header-avatar');
        const statusEl = document.getElementById('online-status');

        if (nameEl) nameEl.textContent = `${friend.username || 'Ghost'}`;
        
        if (avatarEl && (friend.avatar_url || friend.avatar)) {
          const img = friend.avatar_url || friend.avatar;
          avatarEl.style.backgroundImage = `url('${img}')`;
          avatarEl.style.backgroundSize = "cover";
          avatarEl.style.backgroundColor = "transparent";
        }

        // Online Logic (2-minute window)
        const isOnline = friend.last_seen && (new Date() - new Date(friend.last_seen) < 12000);
        if (statusEl) {
            statusEl.textContent = isOnline ? "● ONLINE" : "● OFFLINE";
            statusEl.style.color = isOnline ? "#32D74B" : "#f21515";
        }
    } catch (err) {
        console.error("Header Sync Failed:", err);
    }
  };

  // Run header sync first
  await syncReceiverHeader();
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
    if (document.getElementById(`msg-wrapper-${msg.id}`)) return;

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
    // USES PRE-FETCHED AVATARS (No testing links!)
    const avatarImg = isMe 
      ? (myAvatar || "https://i.postimg.cc/rpD4fgxR/IMG-5898-2.jpg") 
      : (friendAvatar || "https://i.postimg.cc/rpD4fgxR/IMG-5898-2.jpg");

    wrapper.innerHTML = `
      <img src="${avatarImg}" class="avatar">
      <div class="message ${isMe ? "sent" : "received"}">
        ${msg.content.includes("↳ [") 
          ? `<div class="reply-quote">${msg.content.split("]\n")[0].replace("↳ [", "")}</div><div>${msg.content.split("]\n")[1] || ""}</div>`
          : `<div>${msg.content}</div>`
        }
        <div class="msg-time" style="font-size:10px; opacity:1.0; margin-top:4px; text-align:right; display: flex; align-items: center; justify-content: flex-end;">
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
    const bubble = wrapper.querySelector(".message");
    bubble.oncontextmenu = (e) => {
      e.preventDefault();
      window.showActionMenu(msg, bubble.cloneNode(true));
    };
  };
// --- D. LOAD HISTORY (Ghost Speed Edition + Fail Safe) ---
const loadGhostHistory = async () => {
  // Move msgFilter out of the try block so the background sync can see it!
  const msgFilter = `and(sender_id.eq."${user.id}",receiver_id.eq."${friendID}"),and(sender_id.eq."${friendID}",receiver_id.eq."${user.id}")`;
  try {
    chatBox.style.opacity = "0"; // Hide until ready

    const { data: profiles, error: pError } = await supabaseClient
      .from('profiles')
      .select('id, avatar_url')
      .in('id', [user.id, friendID]);

    if (pError) throw pError;

    cachedMyAvatar = profiles?.find(p => p.id === user.id)?.avatar_url;
    cachedFriendAvatar = profiles?.find(p => p.id === friendID)?.avatar_url;
   // FAST SNAP (Last 12)
    const { data: recentHistory } = await supabaseClient
      .from("messages")
      .select("*")
      .or(msgFilter)
      .not('hidden_from', 'cs', `{${user.id}}`)
      .order("created_at", { ascending: false })
      .limit(12);

    if (recentHistory) {
      chatBox.innerHTML = "";
      [...recentHistory].reverse().forEach(msg => displayMessage(msg, cachedFriendAvatar, cachedMyAvatar));
      
      chatBox.scrollTop = chatBox.scrollHeight;
      chatBox.classList.add('ready');
      
      // Mark as read in background
      supabaseClient.from("messages").update({ is_read: true })
        .eq("sender_id", friendID).eq("receiver_id", user.id).eq("is_read", false).then();
    }
  } catch (err) {
    console.error("Ghost Load Error:", err);
  } finally {
    // ALWAYS show the chatbox, even if empty/error, to prevent "Hardcode" freeze
    chatBox.style.opacity = "1";
  }

  // BACKGROUND SYNC (Load the rest)
  const { data: fullHistory } = await supabaseClient
    .from("messages")
    .select("*")
    .or(msgFilter)
    .not('hidden_from', 'cs', `{${user.id}}`)
    .order("created_at", { ascending: true });

  if (fullHistory) {
    fullHistory.forEach(msg => {
      if (!document.getElementById(`msg-wrapper-${msg.id}`)) {
        displayMessage(msg, cachedFriendAvatar, cachedMyAvatar);
      }
    });
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
// --- TYPING LOGIC ---
  const typingIndicator = document.getElementById("typing-indicator");
  let typingTimeout;
  
  const statusChannel = supabaseClient.channel(`status_${roomID}`, {
    config: { broadcast: { self: false } }
  });

  statusChannel
    .on("broadcast", { event: "typing" }, (payload) => {
        // Friend is typing!
        if (payload.payload.userId === friendID) {
            typingIndicator.style.display = "block";
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                typingIndicator.style.display = "none";
            }, 2000);
        }
    })
    .subscribe();

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
        
        if (m.sender_id !== user.id) {
          displayMessage(m, cachedFriendAvatar, cachedMyAvatar);
          supabaseClient.from("messages").update({ is_read: true }).eq("id", m.id).then();
        } else {
          // ID SWAP LOGIC
        const temps = chatBox.querySelectorAll('[id^="msg-wrapper-temp-"]');
          temps.forEach(t => {
            if (t.getAttribute('data-content').trim() === m.content.trim()) {
              t.id = `msg-wrapper-${m.id}`;
              // Update timestamp to real DB time
              t.setAttribute('data-timestamp', new Date(m.created_at).getTime());
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
      
      // 1. Handle Deletion
      if (m.hidden_from?.includes(user.id)) {
        document.getElementById(`msg-wrapper-${m.id}`)?.remove();
        return;
      }

      // 2. Handle Blue Ticks (Wait for ID swap if needed)
      if (m.is_read) {
        // Try finding by Real ID
        let msgEl = document.getElementById(`msg-wrapper-${m.id}`);
        
        // FAIL-SAFE: If the ID swap hasn't happened yet, and we have content
        if (!msgEl && m.content) {
           const temps = chatBox.querySelectorAll('[id^="msg-wrapper-temp-"]');
           temps.forEach(t => {
             if (t.getAttribute('data-content').trim() === m.content.trim()) {
               msgEl = t;
               msgEl.id = `msg-wrapper-${m.id}`; // Force the swap now
             }
           });
        }

        // Check if it's OUR message using the DOM class, avoiding missing payload data
       if (msgEl && msgEl.classList.contains('user-wrapper')) {
          const timeContainer = msgEl.querySelector('.msg-time');
          // Only update if it's not already blue to save resources
          if (timeContainer && !timeContainer.querySelector('span[style*="#06acff"]')) {
            const timeText = timeContainer.innerText.replace('✓✓', '').trim();
            timeContainer.innerHTML = `${timeText} <span style="color: #06acff; margin-left: 4px;">✓✓</span>`;
          }
        }
      }
}
  )
  .subscribe();
// Single optimized heartbeat
  const ghostHeartbeat = async () => {
    await supabaseClient
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id);
  };
  ghostHeartbeat(); 
  setInterval(ghostHeartbeat, 25000);
});
