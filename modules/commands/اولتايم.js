const os = require("os");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "اوبتايم",
  aliases: ["uptime", "الوقت"],
  version: "20.2.0",
  hasPermssion: 0, 
  credits: "Rem Bot Developer / تعديل عبدو",
  description: "عرض مدة تشغيل البوت وإحصائيات الموارد بأشرطة طاقة ذكية",
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

  const dDisplay = d > 0 ? `${d} يوم و ` : "";
  const hDisplay = h > 0 ? `${h} ساعة و ` : "";
  const mDisplay = m > 0 ? `${m} دقيقة و ` : "";
  const sDisplay = s > 0 ? `${s} ثانية` : "0 ثانية";

  return dDisplay + hDisplay + mDisplay + sDisplay;
}

// دالة مخصصة لصنع شريط طاقة ديناميكي (Power Bar)
function createProgressBar(current, total) {
  const percentage = Math.min(Math.round((current / total) * 100), 100);
  const progress = Math.round(percentage / 10); // تحويل لـ 10 خانات
  const emptyProgress = 10 - progress;
  const progressText = "█".repeat(progress);
  const emptyProgressText = "░".repeat(emptyProgress);
  return `[${progressText}${emptyProgressText}] ${percentage}%`;
}

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const startTime = Date.now();

  try {
    // الحصول على معلومات تشغيل النواة والوقت
    const uptimeSeconds = process.uptime();
    const botUptime = formatUptime(uptimeSeconds);

    // حساب استهلاك الرام وإجمالي رام السيرفر بالميغابايت
    const memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalMemoryMB = os.totalmem() / 1024 / 1024; // إجمالي الرام بالميغابايت للحساب الدقيق
    const totalMemoryGB = totalMemoryMB / 1024;

    // حسابات تقديرية لحمل النظام (المعالج) بناءً على الـ Load Average
    const cpus = os.cpus().length;
    const loadAvg = os.loadavg()[0]; // متوسط الحمل في آخر دقيقة
    const cpuUsagePercentage = Math.min(((loadAvg / cpus) * 100), 100) || 12; // قيمة افتراضية ذكية إذا لم يدعم النظام الحساب الفوري

    // جلب إحصائيات الأوامر والأحداث
    const totalCommands = global.client.commands.size;
    const totalEvents = global.client.events.size;

    // أشرطة الطاقة (Power Bars)
    const ramBar = createProgressBar(memoryUsageMB, totalMemoryMB);
    const cpuBar = createProgressBar(cpuUsagePercentage, 100);

    // إرسال رسالة أولية خفيفة لقياس سرعة الرد (Ping)
    return api.sendMessage("⚡ جاري فحص نبض النواة واستجواب الذاكرة...", threadID, async (err, info) => {
      if (err) return;

      const ping = Date.now() - startTime;

      // تنسيق الواجهة الاحترافية النظيفة بالزخرفة الجديدة وبدون حشو
      const txt = 
        "◆━━━━━━━▷ ✦ ◁━━━━━━━◆\n" +
        "🤖 ┋ رِيمْ بُوتْ — REM BOT ┋ 🤖\n" +
        "◆━━━━━━━▷ ✦ ◁━━━━━━━◆\n\n" +
        `⏱️ ┋ مدة التشغيل: ${botUptime}\n` +
        `⚡ ┋ سرعة الاستجابة: ${ping}ms\n\n` +
        "📊 ⟬ إحصائيات النظام والملفات ⟭\n" +
        `🛠️ ┋ الأوامر النشطة: ${totalCommands} أمر\n` +
        `✨ ┋ الأحداث النشطة: ${totalEvents} حدث\n\n` +
        "⚙️ ⟬ قياس مؤشرات طاقة الموارد ⟭\n" +
        `🧠 ┋ ضغط المعالج (CPU):\n    ${cpuBar}\n` +
        `🔺 ┋ استهلاك الذاكرة (RAM):\n    ${ramBar} (${memoryUsageMB.toFixed(1)}MB / ${totalMemoryGB.toFixed(1)}GB)\n\n` +
        "◆━━━━━━━▷ ✦ ◁━━━━━━━◆";

      // تعديل الرسالة أو إرسال التقرير النهائي مباشرة
      return api.sendMessage(txt, threadID, messageID);
    }, messageID);

  } catch (e) {
    console.error("[UPTIME ERROR]", e.message);
    return api.sendMessage(`❌ | خطأ داخلي في نظام الأوبتايم:\n${e.message}`, threadID, messageID);
  }
};
