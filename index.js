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

// ══════════════════════════════════════════
// GLOBAL CLIENT
// ══════════════════════════════════════════
global.client = {
  handleReply: [],
  handleEvent: [],
  commands: new Map(),
  events: new Map(),
  config
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
      const cmd = require(path.join(dir, file));
      const name = cmd.config?.name;
      if (!name) continue;
      global.client.commands.set(name, cmd);
      // تسجيل الأسماء المستعارة
      if (Array.isArray(cmd.config.aliases)) {
        for (const alias of cmd.config.aliases) {
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

// ── Currencies (واجهة متوافقة مع GoatBot) ─
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
// SHARED CONTEXT (يُمرَّر لكل أمر وحدث)
// ══════════════════════════════════════════
function getCtx(api, event) {
  return { api, event, Users, Economy, Currencies, Exp, Threads };
}

// ══════════════════════════════════════════
// MESSAGE HANDLER
// ══════════════════════════════════════════
async function handleMessage(api, event) {
  const { threadID, messageID, senderID, body, type, messageReply } = event;

  // XP لكل رسالة
  try { await Exp.increase(senderID, Math.floor(Math.random() * 5) + 1); } catch {}

  // ── 1. handleReply: الرد على رسالة سابقة للبوت ──
  if (messageReply?.messageID) {
    const idx = global.client.handleReply.findIndex(r => r.messageID === messageReply.messageID);
    if (idx !== -1) {
      const replyData = global.client.handleReply[idx];
      const cmd = global.client.commands.get(replyData.name);
      if (cmd?.handleReply) {
        try {
          await cmd.handleReply({ ...getCtx(api, event), handleReply: replyData });
        } catch (e) {
          console.error(`[REPLY ERROR] ${replyData.name}:`, e.message);
          api.sendMessage(`❌ | خطأ في الرد:\n${e.message}`, threadID, messageID);
        }
      }
      // تنظيف القديمة (أكثر من 5 دقائق)
      global.client.handleReply = global.client.handleReply.filter(r =>
        Date.now() - (r.createdAt || 0) < 5 * 60 * 1000
      );
      return;
    }
  }

  // ── 2. handleEvent للأوامر (يُشغَّل لكل رسالة) ──
  for (const [, cmd] of global.client.commands) {
    if (cmd.handleEvent) {
      try {
        await cmd.handleEvent(getCtx(api, event));
      } catch {}
    }
  }

  // ── 3. الأوامر بالبريفكس ──
  if (!body || !body.startsWith(PREFIX)) return;

  const args = body.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift();
  if (!commandName) return;

  const cmd = global.client.commands.get(commandName);
  if (!cmd) return;

  // فحص الصلاحيات
  const perm = cmd.config?.hasPermssion || 0;
  if (perm >= 1 && !OWNER_IDS.includes(String(senderID))) {
    return api.sendMessage("❌ | هذا الأمر للأوانر فقط", threadID, messageID);
  }

  try {
    await cmd.run({ ...getCtx(api, event), args });
  } catch (e) {
    console.error(`[CMD ERROR] ${commandName}:`, e.message);
    api.sendMessage(`❌ | خطأ في الأمر "${commandName}":\n${e.message}`, threadID, messageID);
  }
}

// ══════════════════════════════════════════
// EVENT HANDLER (للأحداث غير الرسائل)
// ══════════════════════════════════════════
async function handleEvent(api, event) {
  // أحداث التسجيل / الخروج / الدخول ← modules/events
  for (const [, ev] of global.client.events) {
    if (ev.handleEvent) {
      try {
        await ev.handleEvent(getCtx(api, event));
      } catch {}
    }
  }

  // handleEvent في الأوامر للأحداث غير الرسائل أيضاً
  for (const [, cmd] of global.client.commands) {
    if (cmd.handleEvent) {
      try {
        await cmd.handleEvent(getCtx(api, event));
      } catch {}
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
  console.log(`  🔑 البريفكس: ${PREFIX}`);
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

    // حفظ الكوكيز المحدثة
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

    // Heartbeat كل 5 دقائق
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
