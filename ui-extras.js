/**
 * GHOST ACCESSORIES ENGINE - ALL-IN-ONE EDITION
 */

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
window.viewFullHD = (url) => {
    const overlay = document.createElement('div');
    overlay.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.95); z-index: 9999; display: flex; 
        align-items: center; justify-content: center; cursor: zoom-out;
        backdrop-filter: blur(10px);
    `;
    overlay.innerHTML = `<img src="${url}" style="max-width: 95%; max-height: 95%; border-radius: 12px; box-shadow: 0 0 30px rgba(0,0,0,0.5);">`;
    overlay.onclick = () => overlay.remove();
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

        const uploadedUrls = await uploadPromises;
        const validUrls = uploadedUrls.filter(url => url !== null);
        const finalUrlsString = uploadedUrls.join(',');

        // Send to messages table
        const { error: msgError } = await supabaseClient.from('messages').insert([{
            content: caption || '',
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