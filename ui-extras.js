/**
 * GHOST ACCESSORIES ENGINE - ALL-IN-ONE EDITION
 */
let ghostLikedMessages = new Set();
// 1. THE ULTIMATE LOCAL DICTIONARY (Merged for 100% reliability)
const LOCAL_EMOJIS = {
    "Smileys & Emotion": ["😀","😃","😄","😁","😆","😅","😂","🤣","🥲","☺️","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🫣","🤭","🫢","🫡","🤫","🫠","🤥","😶","😶‍🌫️","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","😵‍💫","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃"],
    "Hands & Body": ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦵","🦶","👂","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄","💋","🩸","👣","👤","👥","🫂"],
    "Vibes & Hearts": ["✨","🔥","💥","⚡️","☄️","☀️","🌤️","⛅️","🌥️","☁️","🌈","🌪️","💧","💦","☔️","🌊","🧿","🔮","🕯️","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈️","♉️","♊️","♋️","♌️","♍️","♎️","♏️","♐️","♑️","♒️","♓️","🆔","⚛️"],
    "Animals & Nature": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐒","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🐈","🐓","🦃","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲","🌵","🎄","🌲","🌳","🌴","🌱","🌿","☘️","🍀","🍃","🍂","🍁","🍄","🐚","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻"],
    "Food & Drink": ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🥪","🥙","🧆","🌮","🌯","🥗","🥘","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥛","🍼","🫖","☕️","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊"],
    "Activities & Objects": ["⚽️","🏀","🏈","⚾️","🥎","🎾","🏐","🏉","🎱","🏓","🏸","🥅","⛳️","🏹","🎣","🥊","🥋","🛹","🛼","🎿","🏋️","🧘","🏄","🏊","🚴","🏆","🥇","🥈","🥉","🏅","🎫","🎟️","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎸","🎻","🎲","🎯","🎳","🎮","🎰","⌚️","📱","💻","⌨️","🖥️","🖱️","🕹️","📷","📸","📹","🎥","📞","☎️","📺","📻","🎙️","⏱️","⏰","📡","🔋","🔌","💡","🔦","💸","💵","💶","💷","💰","💳","💎","⚖️","🔨","⚒️","🛠️","⛏️","⚙️","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️","🚬","⚰️","🪦","🔮","🧿","💊","💉","🩸","🧹","🧺","🧻","🚽","🚿","🛁","🧼","🪥","🪒","🔑","🗝️","🚪","🪑","🛋️","🛏️","🛌","🧸","🖼️","🛍️","🛒","🎁","🎈","🎉","🎊","🪄"],
    "Travel & Places": ["🌍","🌎","🌏","🪐","🌑","🌕","🌙","☀️","⭐","🌟","☁️","⚡","🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🛵","🏍️","🛺","🚲","🛴","🛹","🚂","🚁","🛸","🚀","🛫","🚢","🗼","🗽","🏟️","🏛️","🏢","🏘️","🏚️","🏠","🏡","⛪","🕋","⛩️","🌄","🌅","🌆","🌇","🌉","🏙️","⛰️","🌋","🗻","🏝️","🏜️","🏖️"],
    "Flags": ["🏁","🚩","🎌","🏴","🏳️","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️","🇰🇪","🇺🇬","🇹🇿","🇷🇼","🇿🇦","🇳🇬","🇬🇭","🇺🇸","🇬🇧","🇨🇦","🇦🇺","🇯🇲","🇧🇷","🇦🇷","🇫🇷","🇩🇪","🇮🇹","🇪🇸","🇯🇵","🇰🇷","🇨🇳","🇮🇳","🇷🇺","🇹🇷","🇲🇽","🇵🇵","🇸🇦"]
};

// 2. THE LOCAL SUMMONER
const loadEmojis = () => {
    const grid = document.getElementById('dynamic-emoji-grid');
    if (!grid) return;

    let emojiHTML = '';
    for (const [group, emojis] of Object.entries(LOCAL_EMOJIS)) {
        emojiHTML += `<div class="tray-category-header">${group.toUpperCase()}</div>`;
        emojis.forEach(char => { 
            // We wrap the emoji so Twemoji can find it easily
            emojiHTML += `<span onclick="insertEmoji('${char}')">${char}</span>`;
        });
    }
    grid.innerHTML = emojiHTML;
twemoji.parse(grid, {
  callback: function(icon) {
    return 'https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/' + icon + '.png';
  },
  attributes: () => ({ onerror: "this.style.display='none'" }) // Silently hides missing emojis to stop console errors
});
};

// 3. THE KEYBOARD HANDSHAKE
window.toggleEmojiLayer = () => {
    const layer = document.getElementById('ghost-emoji-layer');
    const input = document.getElementById('msg-input');
    const mainContainer = document.querySelector('.floating-input-container');
    const isOpening = (layer.style.display === 'none' || layer.style.display === '');

   if (isOpening) {
        input.blur(); 
        layer.style.display = 'block';
        // Ensure the tray is at the bottom, then lift the container
        const trayHeight = layer.offsetHeight || 300;
        mainContainer.style.transition = 'transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)';
        mainContainer.style.transform = `translateY(-${trayHeight}px)`; 
    } else {
        layer.style.display = 'none';
        mainContainer.style.transform = 'translateY(0)';
        // Give it a tiny delay so the keyboard doesn't jump the UI
        setTimeout(() => input.focus(), 50);
    }
};

document.getElementById('msg-input').addEventListener('click', () => {
    const layer = document.getElementById('ghost-emoji-layer');
    const mainContainer = document.querySelector('.floating-input-container');
    // If user clicks text area to type, hide emojis and reset position
    layer.style.display = 'none';
    mainContainer.style.transform = 'translateY(0)';
});

document.getElementById('msg-input').addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
        const layer = document.getElementById('ghost-emoji-layer');
        const mainContainer = document.querySelector('.floating-input-container');
        layer.style.display = 'none';
        mainContainer.style.transform = 'translateY(0)';
    }
});

window.insertEmoji = (emoji) => {
    const msgInput = document.getElementById('msg-input');
    const start = msgInput.selectionStart;
    const end = msgInput.selectionEnd;
    const text = msgInput.value;

    // Insert exactly where the cursor is
    msgInput.value = text.slice(0, start) + emoji + text.slice(end); 
    // Put cursor back after the new emoji
    const newPos = start + emoji.length;
    msgInput.setSelectionRange(newPos, newPos);
    
    msgInput.dispatchEvent(new Event('input'));
    msgInput.focus(); // Keep focus so the user can keep vibing
};
window.emojiBackspace = () => {
    const msgInput = document.getElementById('msg-input');
    const chars = Array.from(msgInput.value); 
    chars.pop();
    msgInput.value = chars.join("");
    msgInput.dispatchEvent(new Event('input'));
};

document.addEventListener('DOMContentLoaded', loadEmojis);
twemoji.parse(document.body, {
    callback: function(icon, options, variant) {
        // This pulls the EXACT Apple-style glossy emojis
        return 'https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/' + icon + '.png';
    },
    attributes: () => ({ onerror: "this.style.display='none'" }) // Kills the global console errors
});
// --- GHOST PHOTO ENGINE (ui-extra.js) ---

let selectedFiles = [];

// A. Trigger the hidden input
window.triggerPhotoUpload = () => {
    document.getElementById('photo-input').click();
};

// B. Handle selection & UI Preview
window.handlePhotoSelect = (event) => {
    selectedFiles = Array.from(event.target.files);
    const previewArea = document.getElementById('photo-preview-area');
    const stackContainer = document.getElementById('preview-stack-container');
    const actionBar = document.getElementById('vibe-action-bar');

    if (selectedFiles.length > 0) {
        actionBar.style.display = 'none';
        previewArea.style.display = 'block';
        stackContainer.innerHTML = '';

        // Visual Stack preview (Show up to 3)
        selectedFiles.slice(0, 3).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                // STYLED FOR THAT SMALL LEFT-SIDE PREVIEW
                img.style.width = "50px"; 
                img.style.height = "50px";
                img.style.borderRadius = "8px";
                img.style.objectFit = "cover";
                img.style.boxShadow = "2px 0 10px rgba(0,0,0,0.3)";
                img.style.marginLeft = index === 0 ? "0" : "-30px"; // The sleek overlap
                img.style.transform = `rotate(${index * 5 - 5}deg)`;
                img.style.position = "relative";
                img.style.border = "1px solid rgba(255,255,255,0.2)";
                stackContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
};

// C. Clear selection
window.clearPhotoSelection = () => {
    selectedFiles = [];
    document.getElementById('photo-preview-area').style.display = 'none';
    document.getElementById('vibe-action-bar').style.display = 'flex';
    document.getElementById('photo-input').value = '';
};
// D. Full HD View.
window.viewFullHD = (urlsString, msgId, senderId) => {
    const urls = urlsString.split(',').filter(u => u.trim() !== "");
    let currentIndex = 0;

    const overlay = document.createElement('div');
    overlay.id = "ghost-full-hd-overlay";
    overlay.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                     background: rgba(0,0,0,0.96); z-index: 9999; display: flex; 
                     flex-direction: column; align-items: center; justify-content: center;
                     backdrop-filter: blur(12px);`;

    const renderUI = () => {
        overlay.innerHTML = `
            <!-- NAVIGATION ARROWS (DESKTOP) -->
            ${urls.length > 1 ? `
                <div id="prev-ghost" style="position:absolute; left:20px; color:white; font-size:45px; cursor:pointer; z-index:10002; opacity:${currentIndex === 0 ? '0.2' : '0.7'}; transition:0.3s;">‹</div>
                <div id="next-ghost" style="position:absolute; right:20px; color:white; font-size:45px; cursor:pointer; z-index:10002; opacity:${currentIndex === urls.length - 1 ? '0.2' : '0.7'}; transition:0.3s;">›</div>
            ` : ''}

            <!-- MAIN IMAGE -->
            <img src="${urls[currentIndex]}" id="hd-image-target" style="max-width: 95%; max-height: 75%; border-radius: 12px; box-shadow: 0 0 40px rgba(0,0,0,0.6); transition: opacity 0.2s ease; object-fit: contain;">
            
            <!-- FIXED BOTTOM CONTROLS (Prevents overlap) -->
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; margin-top: 20px;">
                <!-- INSTA-DOTS INDICATOR -->
                ${urls.length > 1 ? `
                <div style="display: flex; gap: 8px; margin-bottom: 15px; z-index:10002;">
                    ${urls.map((_, i) => `
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${i === currentIndex ? '#007AFF' : 'rgba(255,255,255,0.3)'}; transition: 0.3s;"></div>
                    `).join('')}
                </div>` : ''}

                <!-- YOUR ORIGINAL ACCESSORY BAR -->
                <div class="photo-accessory-bar" style="position: static; transform: none; margin: 0;">
                    <div class="acc-btn" onclick="const sId = '${senderId}'; document.getElementById('ghost-full-hd-overlay').remove(); window.triggerReply(sId, 'Photo 📸')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10l-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
                    </div>
                    <div class="acc-btn" onclick="window.downloadGhostPhoto('${urls[currentIndex]}')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </div>
                    <div class="acc-btn" onclick="window.showGhostPrompt('Vibe coming soon, stay tuned!')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    </div>
                    <div class="acc-btn" id="heart-${msgId}" onclick="window.toggleGhostLike('${msgId}')">
                        <svg width="24" height="24" viewBox="0 0 24 24" id="svg-heart-${msgId}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <div class="acc-btn" onclick="window.showGhostPrompt('Sharing is coming! 🧬')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    </div>
                </div>
            </div>

            <div style="position:absolute; top:20px; right:20px; color:white; font-size:30px; cursor:pointer; opacity: 0.6; z-index:10005;" onclick="this.parentElement.remove()">✕</div>
        `;

        if (urls.length > 1) {
            const p = document.getElementById('prev-ghost');
            const n = document.getElementById('next-ghost');
            if(p) p.onclick = (e) => { e.stopPropagation(); move(-1); };
            if(n) n.onclick = (e) => { e.stopPropagation(); move(1); };
        }
    };

    const move = (dir) => {
        let newIndex = currentIndex + dir;
        if (newIndex >= 0 && newIndex < urls.length) {
            currentIndex = newIndex;
            renderUI();
        }
    };

    let startX = 0;
    overlay.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive: true});
    overlay.addEventListener('touchend', e => {
        let diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) move(diff > 0 ? 1 : -1);
    }, {passive: true});

    const handleKeys = (e) => {
        if (e.key === "ArrowRight") move(1);
        if (e.key === "ArrowLeft") move(-1);
        if (e.key === "Escape") overlay.remove();
    };
    window.addEventListener('keydown', handleKeys);

    const checkRemoval = setInterval(() => {
        if (!document.body.contains(overlay)) {
            window.removeEventListener('keydown', handleKeys);
            clearInterval(checkRemoval);
        }
    }, 500);

    renderUI();
    document.body.appendChild(overlay);
};
// E. THE MEGA UPLOADER (Talks to Supabase Gallery)
window.uploadAndSendPhotos = async (caption, user, friendID, roomID) => {
    if (selectedFiles.length === 0) return;

    try {
        const uploadPromises = selectedFiles.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { data, error } = await supabaseClient.storage
                .from('Gallery')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabaseClient.storage
                .from('Gallery')
                .getPublicUrl(filePath);
            
            return publicUrl;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        const finalUrlsString = uploadedUrls.join(',');

        // Send to messages table
        const { error: msgError } = await supabaseClient.from('messages').insert([{
            content: caption.trim() || 'Photo 📸', // If caption is empty, it saves "Photo 📸"
            sender_id: user.id,
            receiver_id: friendID,
            message_type: 'photo',
            file_url: finalUrlsString,
            sender_email: user.email
        }]);

        if (msgError) throw msgError;

        window.clearPhotoSelection();
        return true;

    } catch (err) {
        console.error("Ghost Upload Failed:", err);
        window.showGhostPrompt("Upload failed... check your vibe! 💀");
        return false;
    }
};
// F. DOWNLOAD LOGIC
window.downloadGhostPhoto = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Ghost-Vibe-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.showGhostPrompt("Saved to gallery! 📥");
    } catch (err) {
        window.showGhostPrompt("Download failed... 💀");
    }
};

// F. MERGED LIKE / HEART LOGIC (No Duplicates)
window.toggleGhostLike = (msgId) => {
    const btn = document.getElementById(`heart-${msgId}`);
    const heartSvg = document.getElementById(`svg-heart-${msgId}`);
    if (!btn || !heartSvg) return;

    // Use our global Set to track state so it sticks
    const isLiked = ghostLikedMessages.has(msgId);
    const stack = document.querySelector(`#msg-wrapper-${msgId} .insta-photo-stack`);
    
    if (!isLiked) {
        // F1. Update Global Memory
        ghostLikedMessages.add(msgId);
        
        // F2. Turn SVG Red & Animate
        heartSvg.setAttribute('fill', '#ff3b30');
        heartSvg.setAttribute('stroke', '#ff3b30');
        btn.classList.add('heart-active');
        
        // F3. Tack Heart on the Photostack
        if (stack && !stack.querySelector('.mini-heart')) {
            stack.insertAdjacentHTML('beforeend', '<div class="mini-heart" style="position:absolute; bottom:5px; right:5px; color:#ff3b30; font-size:14px; text-shadow: 0 0 4px black; z-index:10;">❤️</div>');
        }
    } else {
        // i. Remove from Global Memory
        ghostLikedMessages.delete(msgId);
        
        // ii. Reset SVG to Empty
        heartSvg.setAttribute('fill', 'none');
        heartSvg.setAttribute('stroke', 'currentColor');
        btn.classList.remove('heart-active');
        
        // iii. Remove Heart from the Photostack
        if (stack) {
            const mini = stack.querySelector('.mini-heart');
            if (mini) mini.remove();
        }
    }
};