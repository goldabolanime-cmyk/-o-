const http = require("http");
const fs = require("fs-extra");
const path = require("path");
const login = require("fca-unofficial");

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
const OWNER_IDS = config.ownerBot || [];

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
// MOCK DATABASE CONTROLLERS
// (يمكن استبدالها بـ DB حقيقية)
// ══════════════════════════════════════════
const DB_PATH = path.join(__dirname, "database", "users.json");
const EXP_PATH = path.join(__dirname, "database", "exp.json");
const THREADS_PATH = path.join(__dirname, "database", "threads.json");
const ECONOMY_PATH = path.join(__dirname, "database", "economy.json");

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

// ══════════════════════════════════════════
// MESSAGE HANDLER
// ══════════════════════════════════════════
async function handleMessage(api, event) {
  const { threadID, messageID, senderID, body } = event;

  if (!body) return;

  // XP لكل رسالة
  try { await Exp.increase(senderID, Math.floor(Math.random() * 5) + 1); } catch {}

  // تحقق من البريفكس
  if (!body.startsWith(PREFIX)) return;

  const args = body.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift();

  // البحث عن الأمر
  const cmd = global.client.commands.get(commandName);
  if (!cmd) return;

  // فحص الصلاحيات
  const hasPermission = cmd.config?.hasPermssion || 0;
  if (hasPermission === 1 && !OWNER_IDS.includes(String(senderID))) {
    return api.sendMessage("❌ | هذا الأمر للأوانر فقط", threadID, messageID);
  }
  if (hasPermission === 2 && String(senderID) !== String(OWNER_IDS[0])) {
    return api.sendMessage("❌ | هذا الأمر للمالك فقط", threadID, messageID);
  }

  try {
    await cmd.run({
      api,
      event,
      args,
      Users,
      Economy,
      Exp,
      Threads
    });
  } catch (e) {
    console.error(`[CMD ERROR] ${commandName}:`, e.message);
    api.sendMessage(`❌ | خطأ في الأمر:\n${e.message}`, threadID, messageID);
  }
}

// ══════════════════════════════════════════
// EVENT HANDLER
// ══════════════════════════════════════════
async function handleEvent(api, event) {
  for (const [, ev] of global.client.events) {
    try {
      if (ev.handleEvent) {
        await ev.handleEvent({ api, event, Users, Exp, Threads, Economy });
      }
    } catch {}
  }

  // handleEvent في الأوامر أيضاً
  for (const [, cmd] of global.client.commands) {
    try {
      if (cmd.handleEvent) {
        await cmd.handleEvent({ api, event, Users, Exp, Threads, Economy });
      }
    } catch {}
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

  login({ appState }, (err, api) => {
    if (err) {
      console.error("[LOGIN] ❌ فشل الاتصال:", err.message || err);

      // إعادة المحاولة بعد 30 ثانية
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

    // إعدادات API
    api.setOptions({
      listenEvents: true,
      selfListen: false,
      logLevel: "silent",
      forceLogin: false,
      updatePresence: false,
      autoMarkDelivery: false,
      autoMarkRead: false
    });

    // تحميل الأوامر والأحداث
    loadCommands();
    loadEvents();

    console.log("[BOT] 🟢 البوت يستمع للرسائل...\n");

    // الاستماع للأحداث
    api.listenMqtt((err, event) => {
      if (err) {
        console.error("[LISTEN ERROR]", err.message || err);

        // إعادة الاتصال عند انقطاع الاتصال
        if (
          err.error === "Not logged in" ||
          err.error === "Connection closed" ||
          err.type === "stop_listening"
        ) {
          console.log("[BOT] 🔄 إعادة الاتصال...");
          setTimeout(startBot, 10000);
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
