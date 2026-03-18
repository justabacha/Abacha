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
    const inputContainer = input.parentElement; // Targets the container holding your text area
    
    if (layer.style.display === 'none' || layer.style.display === '') {
        input.blur(); 
        
        // Force the layer to act like a mobile keyboard at the bottom
        layer.style.position = 'fixed';
        layer.style.bottom = '0';
        layer.style.left = '0';
        layer.style.width = '100%';
        layer.style.height = '300px'; 
        layer.style.zIndex = '9999';
        layer.style.display = 'block';
        
        // Push the input text area up so it isn't hidden by the emojis
        inputContainer.style.transition = 'transform 0.3s ease';
        inputContainer.style.transform = 'translateY(-300px)';
    } else {
        layer.style.display = 'none';
        inputContainer.style.transform = 'translateY(0)';
        input.focus();
    }
};

document.getElementById('msg-input').addEventListener('click', () => {
    document.getElementById('ghost-emoji-layer').style.display = 'none';
});

document.getElementById('msg-input').addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
        document.getElementById('ghost-emoji-layer').style.display = 'none';
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