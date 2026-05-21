const http = require("http");
const fs = require("fs-extra");
const path = require("path");
const { login } = require("ws3-fca");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
let config = {};
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
} catch (e) {
  console.error("[CONFIG ERROR]", e.message);
  process.exit(1);
}

const PREFIX = config.prefix || ".";
const OWNER_IDS = (config.ownerBot || []).map(String);

// مسارات الكاش والملفات الخاصة بالبادئات والاستدعاء والحظر
const prefixDataPath = path.join(__dirname, "modules", "commands", "cache", "threadPrefixes.json");
const activatedGroupsPath = path.join(__dirname, "modules", "commands", "cache", "activatedGroups.json");
const bansPath = path.join(__dirname, "modules", "commands", "cache", "bans.json");
const assistantsPath = path.join(__dirname, "modules", "commands", "cache", "assistants.json");

// التأكد من وجود ملفات الكاش الأساسية لمنع كراش التشغيل
if (!fs.existsSync(path.dirname(bansPath))) fs.mkdirSync(path.dirname(bansPath), { recursive: true });
if (!fs.existsSync(bansPath)) fs.writeJsonSync(bansPath, {});

// ══════════════════════════════════════════
// GLOBAL CLIENT
// ══════════════════════════════════════════
global.client = {
  handleReply: [],
  handleEvent: [],
  commands: new Map(),
  events: new Map(),
  config,
  maintenance: {
    isRestricted: false,
    timeoutRef: null
  }
};

// ══════════════════════════════════════════
// KEEP-ALIVE SERVER
// ══════════════════════════════════════════
const PORT = 5000;

const server = http.createServer((req, res) => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const status = {
    status: "running",
    bot: config.botName || "Bot",
    version: config.version || "20.0.0",
    owner: OWNER_IDS[0] || "N/A",
    commands: global.client.commands.size,
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    uptimeSeconds: Math.floor(uptime),
    timestamp: new Date().toISOString()
  };

  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(status, null, 2));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[KEEP-ALIVE] ✅ السيرفر يعمل على البورت ${PORT}`);
});

// ══════════════════════════════════════════
// LOAD COMMANDS
// ══════════════════════════════════════════
function loadCommands() {
  const dir = path.join(__dirname, "modules", "commands");
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      delete require.cache[require.resolve(path.join(dir, file))];
      let cmd = require(path.join(dir, file));

      const configData = cmd.config || (cmd.default?.config);
      const name = configData?.name;

      if (!name) continue;

      global.client.commands.set(name, cmd);

      if (configData && Array.isArray(configData.aliases)) {
        for (const alias of configData.aliases) {
          global.client.commands.set(alias, cmd);
        }
      }
      console.log(`[CMD] ✅ ${name}`);
    } catch (e) {
      console.error(`[CMD] ❌ ${file}: ${e.message}`);
    }
  }

  console.log(`[INFO] تم تحميل ${global.client.commands.size} أمر\n`);
}

// ══════════════════════════════════════════
// LOAD EVENTS
// ══════════════════════════════════════════
function loadEvents() {
  const dir = path.join(__dirname, "modules", "events");
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      delete require.cache[require.resolve(path.join(dir, file))];
      const ev = require(path.join(dir, file));
      const name = ev.config?.name;
      if (!name) continue;
      global.client.events.set(name, ev);
      console.log(`[EVT] ✅ ${name}`);
    } catch (e) {
      console.error(`[EVT] ❌ ${file}: ${e.message}`);
    }
  }
}

// ══════════════════════════════════════════
// 🧠 خوارزمية التخمين الذكي
// ══════════════════════════════════════════
function stringSimilarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  let longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  return (longerLength - editDistance(longer, shorter)) / longerLength;
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  let costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// ══════════════════════════════════════════
// DATABASE CONTROLLERS
// ══════════════════════════════════════════
const DB_PATH       = path.join(__dirname, "database", "users.json");
const EXP_PATH      = path.join(__dirname, "database", "exp.json");
const THREADS_PATH  = path.join(__dirname, "database", "threads.json");
const ECONOMY_PATH  = path.join(__dirname, "database", "economy.json");

function readJSON(p) {
  try {
    fs.ensureDirSync(path.dirname(p));
    if (!fs.existsSync(p)) fs.writeFileSync(p, "{}");
    return JSON.parse(fs.readFileSync(p, "utf8") || "{}");
  } catch { return {}; }
}

function writeJSON(p, data) {
  try {
    fs.ensureDirSync(path.dirname(p));
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  } catch {}
}

// ── Users ──────────────────────────────
const Users = {
  find: async (uid) => {
    const data = readJSON(DB_PATH);
    return { data: { data: data[String(uid)] || {} } };
  },
  getNameUser: async (uid) => {
    const data = readJSON(DB_PATH);
    return data[String(uid)]?.name || String(uid);
  }
};

// ── Exp ────────────────────────────────
const Exp = {
  check: async (uid) => {
    const data = readJSON(EXP_PATH);
    const user = data[String(uid)] || { exp: 0, currentLevel: 1, levelUpExp: 500 };
    return { data: user };
  },
  increase: async (uid, amount) => {
    const data = readJSON(EXP_PATH);
    if (!data[String(uid)]) data[String(uid)] = { exp: 0, currentLevel: 1, levelUpExp: 500 };
    data[String(uid)].exp += Number(amount) || 0;
    while (data[String(uid)].exp >= data[String(uid)].levelUpExp) {
      data[String(uid)].exp -= data[String(uid)].levelUpExp;
      data[String(uid)].currentLevel++;
      data[String(uid)].levelUpExp = Math.floor(data[String(uid)].levelUpExp * 1.2);
    }
    writeJSON(EXP_PATH, data);
    return data[String(uid)];
  }
};

// ── Threads ────────────────────────────
const Threads = {
  getData: async (tid) => {
    const data = readJSON(THREADS_PATH);
    return data[String(tid)] || {};
  },
  update: async (tid, updates) => {
    const data = readJSON(THREADS_PATH);
    if (!data[String(tid)]) data[String(tid)] = {};
    Object.assign(data[String(tid)], updates);
    writeJSON(THREADS_PATH, data);
    return data[String(tid)];
  }
};

// ── Economy ────────────────────────────
const Economy = {
  getBalance: async (uid, type = "money") => {
    const data = readJSON(ECONOMY_PATH);
    return data[String(uid)]?.[type] || 0;
  },
  increase: async (amount, uid, type = "money") => {
    const data = readJSON(ECONOMY_PATH);
    if (!data[String(uid)]) data[String(uid)] = { money: 0, bank: 0 };
    data[String(uid)][type] = (data[String(uid)][type] || 0) + Number(amount);
    writeJSON(ECONOMY_PATH, data);
    return data[String(uid)][type];
  },
  decrease: async (amount, uid, type = "money") => {
    const data = readJSON(ECONOMY_PATH);
    if (!data[String(uid)]) data[String(uid)] = { money: 0, bank: 0 };
    data[String(uid)][type] = Math.max(0, (data[String(uid)][type] || 0) - Number(amount));
    writeJSON(ECONOMY_PATH, data);
    return data[String(uid)][type];
  }
};

// ── Currencies ─────────────────────────
const Currencies = {
  getData: async (uid) => {
    const data = readJSON(ECONOMY_PATH);
    if (!data[String(uid)]) data[String(uid)] = { money: 0, bank: 0 };
    return data[String(uid)];
  },
  setData: async (uid, updates) => {
    const data = readJSON(ECONOMY_PATH);
    if (!data[String(uid)]) data[String(uid)] = { money: 0, bank: 0 };
    Object.assign(data[String(uid)], updates);
    writeJSON(ECONOMY_PATH, data);
    return data[String(uid)];
  },
  getBalance: async (uid, type = "money") => {
    const data = readJSON(ECONOMY_PATH);
    return data[String(uid)]?.[type] || 0;
  },
  increase: async (amount, uid, type = "money") => {
    const data = readJSON(ECONOMY_PATH);
    if (!data[String(uid)]) data[String(uid)] = { money: 0, bank: 0 };
    data[String(uid)][type] = (data[String(uid)][type] || 0) + Number(amount);
    writeJSON(ECONOMY_PATH, data);
    return data[String(uid)][type];
  },
  decrease: async (amount, uid, type = "money") => {
    const data = readJSON(ECONOMY_PATH);
    if (!data[String(uid)]) data[String(uid)] = { money: 0, bank: 0 };
    data[String(uid)][type] = Math.max(0, (data[String(uid)][type] || 0) - Number(amount));
    writeJSON(ECONOMY_PATH, data);
    return data[String(uid)][type];
  }
};

// ══════════════════════════════════════════
// SHARED CONTEXT
// ══════════════════════════════════════════
function getCtx(api, event) {
  return { api, event, Users, Economy, Currencies, Exp, Threads };
}

// ══════════════════════════════════════════
// MESSAGE HANDLER
// ══════════════════════════════════════════
async function handleMessage(api, event) {
  const { threadID, messageID, senderID, body, type, messageReply } = event;

  // 📥 [نظام الكاش الذكي لحفظ الأسماء وتجنب الـ UID]
  if (senderID) {
    try {
      const usersData = readJSON(DB_PATH);
      // التحقق مما إذا كان حقل الاسم المرسل من السوكيت متوفراً، وبأن المستخدم غير مسجل مسبقاً باسم صحيح
      const currentPushName = event.senderName || event.pushName; 

      if (currentPushName && (!usersData[String(senderID)] || !usersData[String(senderID)].name)) {
        if (!usersData[String(senderID)]) usersData[String(senderID)] = {};
        usersData[String(senderID)].name = currentPushName;
        writeJSON(DB_PATH, usersData);
      }
    } catch (err) {
      console.error("[AUTO PROFILE CACHE ERROR]", err.message);
    }
  }

  const isOwner = OWNER_IDS.includes(String(senderID));

  // جلب المساعدين للتحقق من الاستثناءات والقرارات الأمنية
  let assistants = [];
  try {
    if (fs.existsSync(assistantsPath)) assistants = fs.readJsonSync(assistantsPath);
  } catch(e){}
  const isAssistant = assistants.includes(String(senderID));

  // 🛑 [نظام التحقق الصارم من الحظر الشامل]
  if (!isOwner && !isAssistant) {
    try {
      if (fs.existsSync(bansPath)) {
        const bans = fs.readJsonSync(bansPath);
        if (bans[String(senderID)]) {
          const banData = bans[String(senderID)];

          if (banData.type === "permanent" || banData.expiresAt > Date.now()) {
            return; // تجاهل الرسالة تماماً وبصمت مطلق
          } else {
            delete bans[String(senderID)];
            fs.writeJsonSync(bansPath, bans);
          }
        }
      }
    } catch (e) {
      console.error("[BAN SYSTEM CHECK ERROR]", e.message);
    }
  }

  // 🛡️ [جدار حماية التقييد والصيانة]
  if (global.client.maintenance && global.client.maintenance.isRestricted) {
    if (!isOwner) return;
  }

  if (!body) return;

  // 🛡️ [نظام حماية الاستدعاء المتقدم]
  let activatedGroups = [];
  try {
    if (fs.existsSync(activatedGroupsPath)) {
      activatedGroups = fs.readJsonSync(activatedGroupsPath);
    }
  } catch (e) {
    console.error("[ACTIVATED GROUPS READ ERROR]", e.message);
  }

  const cleanBody = body.trim();
  const lowerBody = cleanBody.toLowerCase();

  const isCallCommand = lowerBody.startsWith("استدعاء") || lowerBody.startsWith(`${PREFIX}استدعاء`);

  if (!activatedGroups.includes(String(threadID)) && !isOwner && !isCallCommand) {
    return;
  }

  try { await Exp.increase(senderID, Math.floor(Math.random() * 5) + 1); } catch {}

  // ── 1. handleReply ──
  if (messageReply?.messageID) {
    const idx = global.client.handleReply.findIndex(r => r.messageID === messageReply.messageID);
    if (idx !== -1) {
      const replyData = global.client.handleReply[idx];
      const cmd = global.client.commands.get(replyData.name);

      const runReply = cmd?.handleReply || cmd?.default?.handleReply;
      if (runReply) {
        try {
          await runReply({ ...getCtx(api, event), handleReply: replyData });
        } catch (e) {
          console.error(`[REPLY ERROR] ${replyData.name}:`, e.message);
          api.sendMessage(`❌ | خطأ في الرد:\n${e.message}`, threadID, messageID);
        }
      }
      global.client.handleReply = global.client.handleReply.filter(r =>
        Date.now() - (r.createdAt || 0) < 5 * 60 * 1000
      );
      return;
    }
  }

  // ── 2. handleEvent للأوامر ──
  for (const [, cmd] of global.client.commands) {
    const eventFunc = cmd.handleEvent || cmd.default?.handleEvent;
    if (eventFunc) {
      try { await eventFunc(getCtx(api, event)); } catch {}
    }
  }

  const currentSystemPrefix = config.prefix || PREFIX;
  let currentThreadPrefix = currentSystemPrefix;

  try {
    if (fs.existsSync(prefixDataPath)) {
      const threadPrefixes = JSON.parse(fs.readFileSync(prefixDataPath, "utf8"));
      if (threadPrefixes[threadID] !== undefined) {
        currentThreadPrefix = threadPrefixes[threadID];
      }
    }
  } catch (e) {
    console.error("[THREAD PREFIX READ ERROR]", e.message);
  }

  if (["بادئة", "البادئة", "prefix"].includes(lowerBody)) {
    const prefixMsg = `🌐 System prefix: ${currentSystemPrefix}\n🛸 Your box chat prefix: ${currentThreadPrefix}`;
    return api.sendMessage(prefixMsg, threadID, messageID);
  }

  if (lowerBody === "مسح" || lowerBody === "حذف") {
    const cmd = global.client.commands.get("مسح");
    if (cmd) {
      const runFunc = cmd.run || cmd.default?.run;
      if (runFunc) {
        try {
          return await runFunc({ ...getCtx(api, event), args: [] });
        } catch (e) {
          console.error(`[NOPREFIX CMD ERROR] مسح:`, e.message);
        }
      }
    }
  }

  let hasValidPrefix = false;
  let commandString = cleanBody;

  if (currentThreadPrefix !== "" && cleanBody.startsWith(currentThreadPrefix)) {
    hasValidPrefix = true;
    commandString = cleanBody.slice(currentThreadPrefix.length).trim();
  } else if (currentThreadPrefix === "") {
    hasValidPrefix = true;
    commandString = cleanBody;
  }

  if (!hasValidPrefix) return;

  if (currentThreadPrefix !== "" && cleanBody === currentThreadPrefix) {
    return api.setMessageReaction("😿", messageID, (err) => {
      if (err) console.error("[REACTION ERROR]", err);
    }, true);
  }

  const args = commandString.split(/\s+/);
  const commandName = args.shift().toLowerCase();
  if (!commandName) return;

  const cmd = global.client.commands.get(commandName);

  if (!cmd) {
    if (currentThreadPrefix === "") return;

    let bestMatch = "";
    let highestScore = 0;
    const allCommandNames = Array.from(global.client.commands.keys());

    for (const name of allCommandNames) {
      const score = stringSimilarity(commandName, name);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = name;
      }
    }

    if (highestScore >= 0.40 && bestMatch) {
      return api.sendMessage(
        `💫 | هـاذا الـامـر غـيـر مـوجـود\n` +
        `💫 | جرب امر "${currentThreadPrefix}${bestMatch}"`, 
        threadID, 
        messageID
      );
    } else {
      return api.sendMessage(`💫 | هـاذا الـامـر غـيـر مـوجـود`, threadID, messageID);
    }
  }

  const configData = cmd.config || cmd.default?.config;
  const perm = configData?.hasPermssion || 0;

  if (perm >= 1 && !isOwner && !isAssistant) {
    return api.sendMessage("⛔ | هذا الأمر متاح للمطورين فقط.", threadID, messageID);
  }

  const runFunc = cmd.run || cmd.default?.run;
  if (!runFunc) {
    return api.sendMessage(`❌ | خطأ: بنية أمر "${commandName}" غير صالحة للنواة.`, threadID, messageID);
  }

  try {
    await runFunc({ ...getCtx(api, event), args });
  } catch (e) {
    console.error(`[CMD ERROR] ${commandName}:`, e.message);
    api.sendMessage(`❌ | خطأ في الأمر "${commandName}":\n${e.message}`, threadID, messageID);
  }
}

// ══════════════════════════════════════════
// EVENT HANDLER
// ══════════════════════════════════════════
async function handleEvent(api, event) {
  if (global.client.maintenance && global.client.maintenance.isRestricted) {
    if (!OWNER_IDS.includes(String(event.senderID))) {
      return; 
    }
  }

  let assistants = [];
  try {
    if (fs.existsSync(assistantsPath)) assistants = fs.readJsonSync(assistantsPath);
  } catch(e){}
  const isOwner = OWNER_IDS.includes(String(event.senderID));
  const isAssistant = assistants.includes(String(event.senderID));

  if (!isOwner && !isAssistant && event.senderID) {
    try {
      if (fs.existsSync(bansPath)) {
        const bans = fs.readJsonSync(bansPath);
        if (bans[String(event.senderID)]) {
          const banData = bans[String(event.senderID)];
          if (banData.type === "permanent" || banData.expiresAt > Date.now()) {
            return;
          }
        }
      }
    } catch(e){}
  }

  for (const [, ev] of global.client.events) {
    const eventFunc = ev.handleEvent || ev.default?.handleEvent;
    if (eventFunc) {
      try { await eventFunc(getCtx(api, event)); } catch {}
    }
  }

  for (const [, cmd] of global.client.commands) {
    const eventFunc = cmd.handleEvent || cmd.default?.handleEvent;
    if (eventFunc) {
      try { await eventFunc(getCtx(api, event)); } catch {}
    }
  }
}

// ══════════════════════════════════════════
// LOGIN & START
// ══════════════════════════════════════════
function startBot() {
  const appstatePath = path.join(__dirname, "appstate.json");

  if (!fs.existsSync(appstatePath)) {
    console.error("[LOGIN] ❌ ملف appstate.json غير موجود");
    return;
  }

  let appState;
  try {
    appState = JSON.parse(fs.readFileSync(appstatePath, "utf8"));
  } catch (e) {
    console.error("[LOGIN] ❌ خطأ في قراءة الكوكيز:", e.message);
    return;
  }

  console.log("════════════════════════════════════");
  console.log(`  🤖 ${config.botName || "Bot"} v${config.version || "20.0.0"}`);
  console.log(`  👑 Owner: ${OWNER_IDS[0] || "N/A"}`);
  console.log(`  🔑 البريفكس النظام: ${PREFIX}`);
  console.log("════════════════════════════════════");
  console.log("[LOGIN] 🔄 جاري الاتصال بفيسبوك...");

  login(appState, {
    logLevel: "silent",
    listenEvents: true,
    autoMarkDelivery: false,
    autoMarkRead: false,
    selfListen: false,
    forceLogin: true
  }, (err, api) => {
    if (err) {
      console.error("[LOGIN] ❌ فشل الاتصال:", err.message || err);
      console.log("[LOGIN] 🔄 إعادة المحاولة بعد 30 ثانية...");
      setTimeout(startBot, 30000);
      return;
    }

    try {
      fs.writeFileSync(appstatePath, JSON.stringify(api.getAppState(), null, 2));
    } catch {}

    const botID = api.getCurrentUserID();
    console.log(`[LOGIN] ✅ تم الاتصال! ID البوت: ${botID}`);

    api.setOptions({
      listenEvents: true,
      selfListen: false,
      logLevel: "silent",
      updatePresence: false,
      autoMarkDelivery: false,
      autoMarkRead: false
    });

    loadCommands();
    loadEvents();

    console.log("[BOT] 🟢 البوت يستمع للرسائل...\n");

    api.listen((err, event) => {
      if (err) {
        console.error("[LISTEN ERROR]", JSON.stringify(err));
        const errStr = JSON.stringify(err);
        if (
          errStr.includes("Not logged in") ||
          errStr.includes("Connection closed") ||
          errStr.includes("stop_listening") ||
          errStr.includes("1357004")
        ) {
          console.log("[BOT] 🔄 إعادة الاتصال بعد 15 ثانية...");
          setTimeout(startBot, 15000);
        }
        return;
      }

      if (!event) return;

      switch (event.type) {
        case "message":
        case "message_reply":
          handleMessage(api, event).catch(() => {});
          break;

        default:
          handleEvent(api, event).catch(() => {});
          break;
      }
    });

    setInterval(() => {
      const uptime = process.uptime();
      const h = Math.floor(uptime / 3600);
      const m = Math.floor((uptime % 3600) / 60);
      console.log(`[HEARTBEAT] ✅ ${h}h ${m}m | أوامر: ${global.client.commands.size}`);
    }, 5 * 60 * 1000);
  });
}

// ══════════════════════════════════════════
// ERROR GUARDS
// ══════════════════════════════════════════
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT]", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("[REJECTION]", reason?.message || reason);
});

// ══════════════════════════════════════════
// START
// ══════════════════════════════════════════
startBot();
