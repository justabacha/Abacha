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