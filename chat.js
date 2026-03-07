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
const urlParams = new URLSearchParams(window.location.search);
const friendID = urlParams.get("friend_id");
let replyingTo = null;
let currentPins = [];
let pendingPinMsg = null;
let messageToDelete = null;

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

        if (nameEl) nameEl.textContent = `~${friend.username || 'Ghost'}`;
        
        if (avatarEl && (friend.avatar_url || friend.avatar)) {
          const img = friend.avatar_url || friend.avatar;
          avatarEl.style.backgroundImage = `url('${img}')`;
          avatarEl.style.backgroundSize = "cover";
          avatarEl.style.backgroundColor = "transparent";
        }

        // Online Logic (2-minute window)
        const isOnline = friend.last_seen && (new Date() - new Date(friend.last_seen) < 120000);
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
        .map(
          (p) => `
        <div class="pin-item">
          <span>📌 ${p.content.substring(0, 25)}...</span>
          <span onclick="window.unpinMessage('${p.id}')" style="cursor:pointer;padding:5px;">✕</span>
        </div>`
        )
        .join("");
    } else pinBar.style.display = "none";
  };

  // C. DISPLAY MESSAGE
  const displayMessage = async (msg) => {
    const isMe = msg.sender_id === user.id;
    const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const wrapper = document.createElement("div");
    // Ensure every wrapper has a unique ID for the realtime engine to target
    wrapper.id = `msg-wrapper-${msg.id}`; 
    wrapper.className = `msg-wrapper ${isMe ? "user-wrapper" : "ai-wrapper"}`;
  const { data: sender } = await supabaseClient
      .from("profiles")
      .select("avatar_url")
      .eq("id", msg.sender_id)
      .maybeSingle();

    const avatarImg =
      sender?.avatar_url ||
      "https://i.postimg.cc/rpD4fgxR/IMG-5898-2.jpg";

    wrapper.innerHTML = `
      <img src="${avatarImg}" class="avatar">
      <div class="message ${isMe ? "sent" : "received"}">
        ${
          msg.content.includes("↳ [")
            ? `<div class="reply-quote">${
                msg.content.split("]\n")[0].replace("↳ [", "")
              }</div><div>${msg.content.split("]\n")[1] || ""}</div>`
            : `<div>${msg.content}</div>`
        }
        <div class="msg-time" style="font-size:10px;opacity:0.8;margin-top:4px;text-align:right;">${timeStr}</div>
      </div>
    `;

    const bubble = wrapper.querySelector(".message");
    bubble.oncontextmenu = (e) => {
      e.preventDefault();
      window.showActionMenu(msg, bubble.cloneNode(true));
    };

    chatBox.appendChild(wrapper);
  };
// D. LOAD HISTORY (Now with Ghost-Hidden Filter)
  const { data: history } = await supabaseClient
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendID}),and(sender_id.eq.${friendID},receiver_id.eq.${user.id})`)
    // NEW: Filter out messages hidden by the current user
    .not('hidden_from', 'cs', `{${user.id}}`) 
    .order("created_at", { ascending: true });

  chatBox.innerHTML = "";
  if (history) {
  chatBox.innerHTML = "";
chatBox.style.scrollBehavior = "auto";

// Render ALL messages in parallel
await Promise.all(
  history.map(msg => displayMessage(msg))
);

// Scroll ONLY after layout fully settles
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
    chatBox.classList.add('ready');
  });
});

    chatBox.classList.add("ready");
    window.loadPins();
  }

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
  };

  // F. ACTION MENU
  window.showActionMenu = (msg, clonedBubble) => {
    const overlay = document.getElementById("chat-overlay");
    const menuContainer = document.getElementById("menu-content");
    const isPinned = currentPins.some((p) => p.id === msg.id);

    menuContainer.innerHTML = "";
    clonedBubble.classList.add("popped-message");

    menuContainer.appendChild(clonedBubble);
   menuContainer.insertAdjacentHTML(
      "beforeend",
      `
      <div class="action-tile">
        <div class="action-item" onclick="window.triggerReply('${msg.sender_id}', '${msg.content.replace(/'/g, "\\'")}')">Reply ✍️</div>
        <div class="action-item" onclick="const txt='${msg.content.replace(/'/g, "\\'")}'; navigator.clipboard.writeText(txt).then(() => { alert('Ghost Copied!'); window.closeGhostModal(); document.getElementById('chat-overlay').style.display='none'; })">Copy 📑</div>
        <div class="action-item" onclick="window.showGhostPrompt('This feature is coming soon.!🍻')">Forward 📤</div>
        <div class="action-item" onclick="${isPinned ? `window.unpinMessage('${msg.id}')` : `window.openPinModal('${msg.id}', '${msg.content.replace(/'/g, "\\'")}')`}">
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

    await supabaseClient.from('messages').insert([
      {
        content,
        sender_id: user.id,
        receiver_id: friendID,
        sender_email: user.email
      }
    ]);

    msgInput.value = "";
    msgInput.style.height = 'auto'; // Reset height after sending
  };

  // Auto-stretch and Key handling
  msgInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
  });

 msgInput.addEventListener('keydown', (e) => {
      // Check if it's the Enter key
      if (e.key === "Enter") {
          // On mobile, scrollHeight usually doesn't change unless there's a real line break.
          // We allow the default behavior (new line) if Shift is held OR if it's a touch-based device
          // but we want to SEND if it's a standard Enter press on Desktop.
          
          const isMobile = window.matchMedia("(pointer: coarse)").matches;

          if (!e.shiftKey && !isMobile) {
              e.preventDefault(); // Stop the new line
              handleSend();      // Send the vibe
          }
          // On mobile, we let the default "Enter" happen so it jumps to the next line
          // The Send button (🚀) will be the primary way to send on phone.
      }
  });

  sendBtn.onclick = handleSend;
  // --- TYPING LOGIC ---
  const typingIndicator = document.getElementById("typing-indicator");
  let typingTimeout;

  // 1. Create a dedicated channel for typing
  const typingChannel = supabaseClient.channel(`typing:${friendID}`);

  // 2. Listen for typing events from the friend
  typingChannel
    .on("broadcast", { event: "typing" }, (payload) => {
      if (payload.payload.userId === friendID) {
        typingIndicator.style.display = "block";
        
        // Auto-hide after 3 seconds of no "typing" pings
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          typingIndicator.style.display = "none";
        }, 3000);
      }
    })
    .subscribe();

  // 3. Send typing signal when user types
  msgInput.addEventListener("input", () => {
    typingChannel.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id },
    });
  });

// I. REALTIME (Silent Sync)
supabaseClient
  .channel("db-changes")
  // Listen to Messages (Existing)
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "messages" },
    (payload) => {
      if (payload.eventType === "INSERT") {
        const m = payload.new;
        const isRelevant = (m.sender_id === user.id && m.receiver_id === friendID) || 
                           (m.sender_id === friendID && m.receiver_id === user.id);
        
        if (isRelevant && (!m.hidden_from || !m.hidden_from.includes(user.id))) {
          displayMessage(m);
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }
      
      if (payload.eventType === "UPDATE") {
        const m = payload.new;
        if (m.hidden_from && m.hidden_from.includes(user.id)) {
          const el = document.getElementById(`msg-wrapper-${m.id}`);
          if (el) el.remove();
        }
      }

      if (payload.eventType === "DELETE") {
        const deletedMsg = document.getElementById(`msg-wrapper-${payload.old.id}`);
        if (deletedMsg) deletedMsg.remove();
      }
    }
  )
  // ADD THIS: Listen to Friendships (For the Burn Logic)
  .on(
    "postgres_changes",
    { event: "DELETE", schema: "public", table: "friendships" },
    (payload) => {
      // If ANY friendship is deleted, we check if it's the one we are currently in
      // Since we don't have the friendship ID easily, we just verify if the chat is still valid
      window.showGhostPrompt("This connection has been burned. 💨");
      setTimeout(() => window.location.href = 'chat-list.html', 1500);
    }
  )
  .subscribe();
});
