const os = require("os");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "اوبتايم",
  version: "20.1.0",
  hasPermssion: 0, // متاح للجميع (ويمكنك رفعه لـ 1 أو 2 إن أردت قفله للمطورين)
  credits: "Rem Bot Developer",
  description: "عرض إحصائيات ومدة تشغيل ريم بوت V20 بالتوافق مع النواة",
  commandCategory: "نظام",
  usages: "",
  cooldowns: 3
};

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? `${d} يوم، ` : "";
  const hDisplay = h > 0 ? `${h} ساعة، ` : "";
  const mDisplay = m > 0 ? `${m} دقيقة، ` : "";
  const sDisplay = s > 0 ? `${s} ثانية` : "0 ثانية";

  return dDisplay + hDisplay + mDisplay + sDisplay;
}

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID } = event;

  try {
    // جلب الإعدادات من global.client الذي تم تعريفه في ملف الاندكس
    const botConfig = global.client.config || {};
    const OWNER_IDS = botConfig.ownerBot || [];

    // التحقق من صلاحية المستخدم الحالي بدقة بحسب شروط الاندكس
    let userRole = "عضو في البوت 👤";
    if (String(senderID) === String(OWNER_IDS[0])) {
      userRole = "المالك الأساسي (Owner) 👑";
    } else if (OWNER_IDS.includes(String(senderID))) {
      userRole = "مسؤول البوت (Admin) 🛠️";
    }

    // حساب الـ Ping (وقت الاستجابة)
    const startTime = Date.now();

    // الحصول على معلومات تشغيل النواة
    const uptimeSeconds = process.uptime();
    const botUptime = formatUptime(uptimeSeconds);

    // إحصائيات الذاكرة والمعالج
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalMemory = os.totalmem() / 1024 / 1024 / 1024;
    const platform = os.platform();
    const nodeVersion = process.version;

    // جلب إحصائيات الأوامر المحملة فعلياً في الـ Map
    const totalCommands = global.client.commands.size;
    const totalEvents = global.client.events.size;

    // إرسال رسالة أولية لقياس سرعة الرد
    return api.sendMessage("⏳ جاري استجواب نواة ريم بوت V20...", threadID, async (err, info) => {
      if (err) return;

      const ping = Date.now() - startTime;

      // تنسيق الواجهة الاحترافية المتناسقة
      const txt = 
        "🤖 ⟬ رِيمْ بُوتْ - REM BOT V20 ⟭ 🤖\n" +
        "●─────── ✾ ───────●\n" +
        `🔰 ┋ رتبتك الحالية: ${userRole}\n` +
        `⏱️ ┋ مدة التشغيل: ${botUptime}\n` +
        `⚡ ┋ سرعة الاستجابة: ${ping}ms\n` +
        " Glastonbury ━━━━━━━━━━━━━━━\n" +
        "📊 ⟬ إحصائيات ملفات البوت ⟭\n" +
        `🛠️ ┋ الأوامر النشطة: ${totalCommands} أمر\n` +
        `✨ ┋ الأحداث النشطة: ${totalEvents} حدث\n` +
        "┝━━━━━━━━━━━━━━━\n" +
        "💻 ⟬ موارد السيرفر المركزي ⟭\n" +
        `🔺 ┋ استهلاك الرام: ${memoryUsage.toFixed(2)} MB\n` +
        `⚙️ ┋ البيئة الأساسية: Node ${nodeVersion}\n` +
        `🖥️ ┋ المنصة والمستضيف: ${platform} (${os.arch()})\n` +
        `🧠 ┋ إجمالي رام السيرفر: ${totalMemory.toFixed(1)} GB\n` +
        "●─────── ✾ ───────●\n" +
        `📡 منفذ الـ Keep-Alive يعمل على البورت: 5000`;

      return api.sendMessage(txt, threadID, messageID);
    }, messageID);

  } catch (e) {
    console.error("[UPTIME ERROR]", e.message);
    return api.sendMessage(`❌ | خطأ داخلي في نظام الأوبتايم:\n${e.message}`, threadID, messageID);
  }
};
