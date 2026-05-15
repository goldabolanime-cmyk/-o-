const http = require("http");
const fs = require("fs-extra");
const path = require("path");

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

// ══════════════════════════════════════════
// KEEP-ALIVE SERVER
// بيشغل سيرفر HTTP صغير على بورت 5000
// حتى Replit ما يوقف البوت بسبب عدم النشاط
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
    owner: config.ownerBot?.[0] || "N/A",
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
// AUTO-RESTART ON CRASH
// يعيد تشغيل البوت تلقائياً عند أي خطأ
// ══════════════════════════════════════════
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT ERROR]", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});

// ══════════════════════════════════════════
// BOT LOADER
// ══════════════════════════════════════════
console.log("════════════════════════════════════");
console.log(`  🤖 ${config.botName || "Bot"} v${config.version || "20.0.0"}`);
console.log(`  👑 Owner: ${config.ownerBot?.[0] || "N/A"}`);
console.log(`  📁 Commands: modules/commands/`);
console.log("════════════════════════════════════");

// تحميل الأوامر
const commandsPath = path.join(__dirname, "modules", "commands");
let loadedCount = 0;

try {
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      const cmd = require(path.join(commandsPath, file));
      const name = cmd.config?.name || file.replace(".js", "");
      console.log(`[CMD] ✅ تم تحميل: ${name}`);
      loadedCount++;
    } catch (e) {
      console.error(`[CMD] ❌ خطأ في ${file}:`, e.message);
    }
  }
} catch (e) {
  console.error("[LOADER ERROR]", e.message);
}

console.log(`\n[INFO] تم تحميل ${loadedCount} أمر`);
console.log("[INFO] البوت جاهز للتشغيل ✅");
console.log("[INFO] لتشغيل البوت الفعلي أضف ملف login.js مع الكوكيز\n");

// ══════════════════════════════════════════
// HEARTBEAT - طباعة كل 5 دقائق لإثبات النشاط
// ══════════════════════════════════════════
setInterval(() => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  console.log(`[HEARTBEAT] ✅ البوت يعمل منذ ${hours}h ${minutes}m`);
}, 5 * 60 * 1000);
