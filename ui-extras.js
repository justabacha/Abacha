/**
 * GHOST ACCESSORIES ENGINE - ALL-IN-ONE EDITION
 */

// 1. THE ULTIMATE LOCAL DICTIONARY (Merged for 100% reliability)
const LOCAL_EMOJIS = {
    "Smileys & Emotion": ["😀","😃","😄","😁","😆","😅","😂","🤣","🥲","☺️","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🫣","🤭","🫢","🫡","🤫","🫠","🤥","😶","😶‍🌫️","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","😵‍💫","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃"],
    "Hands & Body": ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦵","🦶","👂","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄","💋","🩸","👣","👤","👥","🫂"],
    "Vibes & Hearts": ["✨","🔥","💥","⚡️","☄️","☀️","🌤️","⛅️","🌥️","☁️","🌈","🌪️","💧","💦","☔️","🌊","🧿","🔮","🕯️","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈️","♉️","♊️","♋️","♌️","♍️","♎️","♏️","♐️","♑️","♒️","♓️","🆔","⚛️"],
    "Animals & Nature": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐒","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🐈","🐓","🦃","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲","🌵","🎄","🌲","🌳","🌴","🌱","🌿","☘️","🍀","🍃","🍂","🍁","🍄","🐚","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻"],
    "Food & Drink": ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🥪","🥙","🧆","taco","🌯","🥗","🥘","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥛","🍼","🫖","☕️","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊"],
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
        input.blur(); // Hide the system keyboard
        layer.style.display = 'block';
        // Lift the entire input bar exactly above the emoji tray
        mainContainer.style.transition = 'transform 0.3s cubic-bezier(0.1, 0.7, 0.1, 1)';
        mainContainer.style.transform = 'translateY(-300px)'; 
    } else {
        layer.style.display = 'none';
        mainContainer.style.transform = 'translateY(0)'; // Snap back to original position
        input.focus();
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
    msgInput.value += emoji;
    msgInput.dispatchEvent(new Event('input')); 
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