const fs = require("fs-extra");

// ذاكرة مؤقتة لتتبع جلسات التشفير الحالية بداخل الـ Memory لضمان استمرار الحوار
const cryptoSessions = new Map();

// ══════════════════════════════════════════
// 🛠️ CRYPTO HELPER FUNCTIONS
// ══════════════════════════════════════════

// 1. Rot13
function rot13(str) {
  return str.replace(/[a-zA-Z]/g, function(c) {
    return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
  });
}

// 2. Morse Code
const MORSE_DICT = {
  'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....',
  'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.',
  'q': '--.-', 'r': '.-.', 's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
  'y': '-.--', 'z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/'
};
const REVERSE_MORSE = Object.fromEntries(Object.entries(MORSE_DICT).map(([k, v]) => [v, k]));

function toMorse(str) {
  return str.toLowerCase().split('').map(c => MORSE_DICT[c] || c).join(' ');
}
function fromMorse(str) {
  return str.split(' ').map(w => REVERSE_MORSE[w] || w).join('');
}

// 5. Binary Code
function toBinary(str) {
  return str.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}
function fromBinary(binary) {
  try {
    return binary.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
  } catch (e) { return null; }
}

// 6. Caesar Cipher
function caesarEncode(str, shift = 3) {
  return str.split('').map(char => String.fromCharCode(char.charCodeAt(0) + shift)).join('');
}
function caesarDecode(str, shift = 3) {
  return str.split('').map(char => String.fromCharCode(char.charCodeAt(0) - shift)).join('');
}

// Main Process Function
function processCrypto(action, method, text) {
  try {
    if (action === "encode") {
      switch (method) {
        case "1": return Buffer.from(text, "utf8").toString("base64");
        case "2": return Buffer.from(text, "utf8").toString("hex");
        case "3": return rot13(text);
        case "4": return toMorse(text);
        case "5": return toBinary(text);
        case "6": return caesarEncode(text);
        case "7": return encodeURIComponent(text);
      }
    } else if (action === "decode") {
      switch (method) {
        case "1": return Buffer.from(text, "base64").toString("utf8");
        case "2": return Buffer.from(text, "hex").toString("utf8");
        case "3": return rot13(text); 
        case "4": return fromMorse(text);
        case "5": return fromBinary(text);
        case "6": return caesarDecode(text);
        case "7": return decodeURIComponent(text);
      }
    }
  } catch (e) {
    return null;
  }
}

// ══════════════════════════════════════════
// BOT COMMAND CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "تشفير",
  aliases: ["crypto", "cipher"],
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Abdou",
  description: "Encrypt and decrypt text using 7 different algorithms with auto-clean",
  commandCategory: "tools",
  usages: "crypto",
  cooldowns: 3
};

// ══════════════════════════════════════════
// MAIN RUN (Step 1: Choose Action)
// ══════════════════════════════════════════
module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  let session = cryptoSessions.get(senderID);
  if (!session) {
    session = { step: 1, actionType: null, methodType: null, lastBotMessageID: null };
    cryptoSessions.set(senderID, session);
  } else {
    session.step = 1;
  }

  const menuMsg = `🔐 ✦ CRYPTO SYSTEM MENU ✦ 🔐\n` +
                  `•───────────────────•\n` +
                  `💡 [Please reply to this message with a number]:\n\n` +
                  `1 ⇐ Encode Text\n` +
                  `2 ⇐ Decode Text\n\n` +
                  `❌ Type 'cancel' or anything else to exit.`;

  const sentMsg = await api.sendMessage(menuMsg, threadID, messageID);

  if (sentMsg) {
    session.lastBotMessageID = sentMsg.messageID;

    if (global.client && global.client.handleReply) {
      global.client.handleReply = global.client.handleReply.filter(r => r.author !== senderID || r.name !== module.exports.config.name);
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: sentMsg.messageID,
        author: senderID,
        createdAt: Date.now()
      });
    }
  }
};

// ══════════════════════════════════════════
// HANDLE REPLY (Interactive Steps & Clean)
// ══════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  let session = cryptoSessions.get(senderID);

  // Hybrid Check: Core tracking or fallback to Local Memory Message ID
  const isLocalMatch = session && messageReply && String(messageReply.messageID) === String(session.lastBotMessageID);
  const isCoreMatch = handleReply && senderID === handleReply.author;

  if (!isCoreMatch && !isLocalMatch) return;

  const input = body.trim();

  if (!session) {
    session = { step: 1, actionType: null, methodType: null, lastBotMessageID: null };
    cryptoSessions.set(senderID, session);
  }

  // ── STEP 1: Process Action Choice (Encode/Decode) ──
  if (session.step === 1) {
    if (input !== "1" && input !== "2") {
      cryptoSessions.delete(senderID);
      return api.sendMessage("❌ Operation cancelled.", threadID, messageID);
    }

    session.actionType = input === "1" ? "encode" : "decode";
    const actionName = input === "1" ? "ENCODE" : "DECODE";

    // Unsend previous menu
    const targetMsgID = (handleReply && handleReply.messageID) || session.lastBotMessageID;
    try { await api.unsendMessage(targetMsgID); } catch (e) {}

    const algoMenu = `⚙️ ✦ CHOOSE ALGORITHM (7 METHODS) ✦ ⚙️\n` +
                     `•───────────────────•\n` +
                     `📌 [Reply with the method number for: ${actionName}]:\n\n` +
                     `1 ⇐ Base64\n` +
                     `2 ⇐ Hexadecimal\n` +
                     `3 ⇐ Rot13\n` +
                     `4 ⇐ Morse Code\n` +
                     `5 ⇐ Binary Code (01)\n` +
                     `6 ⇐ Caesar Cipher\n` +
                     `7 ⇐ URL Encoding\n\n` +
                     `❌ Type anything else to cancel.`;

    const sentMsg = await api.sendMessage(algoMenu, threadID, messageID);

    if (sentMsg) {
      session.step = 2; // Advance step locally
      session.lastBotMessageID = sentMsg.messageID;

      if (global.client && global.client.handleReply) {
        global.client.handleReply = global.client.handleReply.filter(r => r.author !== senderID || r.name !== module.exports.config.name);
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: sentMsg.messageID,
          author: senderID,
          createdAt: Date.now()
        });
      }
    }
    return;
  }

  // ── STEP 2: Process Algorithm Choice ──
  if (session.step === 2) {
    if (!["1", "2", "3", "4", "5", "6", "7"].includes(input)) {
      cryptoSessions.delete(senderID);
      return api.sendMessage("❌ Operation cancelled.", threadID, messageID);
    }

    session.methodType = input;

    // Unsend previous menu
    const targetMsgID = (handleReply && handleReply.messageID) || session.lastBotMessageID;
    try { await api.unsendMessage(targetMsgID); } catch (e) {}

    const promptText = session.actionType === "encode" ? "text you want to encrypt" : "encrypted string to decrypt";
    const sentMsg = await api.sendMessage(`✍️ | Please send the ${promptText} now...`, threadID, messageID);

    if (sentMsg) {
      session.step = 3; // Advance step locally
      session.lastBotMessageID = sentMsg.messageID;

      if (global.client && global.client.handleReply) {
        global.client.handleReply = global.client.handleReply.filter(r => r.author !== senderID || r.name !== module.exports.config.name);
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: sentMsg.messageID,
          author: senderID,
          createdAt: Date.now()
        });
      }
    }
    return;
  }

  // ── STEP 3: Final Execution & Auto-Clean ──
  if (session.step === 3) {
    if (!input) return;

    // Auto-clean: delete prompt and user secret text message instantly
    const targetMsgID = (handleReply && handleReply.messageID) || session.lastBotMessageID;
    try { await api.unsendMessage(targetMsgID); } catch (e) {}
    try { await api.unsendMessage(messageID); } catch (e) {}

    const result = processCrypto(session.actionType, session.methodType, input);

    if (!result) {
      cryptoSessions.delete(senderID);
      return api.sendMessage("❌ Error! Failed to process data. Make sure the structure matches the chosen cipher.", threadID);
    }

    const algoNames = { 
      "1": "Base64", 
      "2": "Hexadecimal", 
      "3": "Rot13", 
      "4": "Morse Code", 
      "5": "Binary Code (01)", 
      "6": "Caesar Cipher", 
      "7": "URL Encoding" 
    };

    const finalTitle = session.actionType === "encode" ? "✅ TEXT ENCRYPTED SUCCESS" : "🔓 TEXT DECRYPTED SUCCESS";

    const outputMsg = `✨ ✦ ${finalTitle} ✦ ✨\n` +
                      `•───────────────────•\n` +
                      `⚙️ Algorithm: ${algoNames[session.methodType]}\n\n` +
                      `📝 Result:\n` +
                      `\`\`\`\n${result}\n\`\`\``;

    // Clear user memory session after completion
    cryptoSessions.delete(senderID);

    return api.sendMessage(outputMsg, threadID);
  }
};
