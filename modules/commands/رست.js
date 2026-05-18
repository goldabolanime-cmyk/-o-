const fs = require("fs-extra");
const path = require("path");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "رست",
  version: "21.1.0",
  hasPermssion: 2, 
  credits: "Rem Bot Developer / تعديل عبدو",
  description: "إعادة تشغيل وتحديث كامل للأوامر والأحداث بداخل النواة فورياً بدون توقف السيرفر 🚀",
  commandCategory: "نظام",
  usages: "",
  cooldowns: 10
};

const header = "✦〘•ま 𝑹𝑬𝑴-𝑩𝑶𝑻 ま•〙✦";

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const startTime = Date.now();

  try {
    // إرسال رسالة البدء أولاً
    await api.sendMessage(
      `${header}\n\n` + 
      "🔄 ┋ جاري إعادة تشغيل النواة برمجياً تلقائياً...\n" + 
      "⌛ ┋ يتم الآن إفراغ الكاش وتحديث قائمة الأوامر.\n" + 
      "📥 ┋ يرجى الانتظار ثوانٍ معدودة...", 
      threadID, 
      messageID
    );

    console.log(`[RESTART] 🔄 تم بدء عملية التحديث الساخن التلقائية بواسطة: ${senderID}`);

    // تفريغ الماب القديم تماماً لتجنب التكرار والتصادمات
    global.client.commands.clear();
    global.client.events.clear();

    // 1️⃣ تحديث ومسح كاش مجلد الأوامر (Commands) وإعادة تحميلها بشكل آمن
    const commandsDir = path.join(process.cwd(), "modules", "commands");
    if (fs.existsSync(commandsDir)) {
      const cmdFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));

      for (const file of cmdFiles) {
        try {
          const filePath = path.join(commandsDir, file);
          delete require.cache[require.resolve(filePath)]; // مسح الكاش القديم من الذاكرة

          let cmd = require(filePath);
          const configData = cmd.config || (cmd.default?.config);
          const name = configData?.name;

          if (!name) continue;

          // تسجيل الاسم الرئيسي للأمر
          global.client.commands.set(name, cmd);

          // تسجيل الأسماء البديلة (Aliases) لضمان عدم تلف استجابة النواة
          if (configData && Array.isArray(configData.aliases)) {
            for (const alias of configData.aliases) {
              global.client.commands.set(alias, cmd);
            }
          }
        } catch (e) {
          console.error(`[RESTART ERROR] خطأ في تحميل أمر ${file}:`, e.message);
        }
      }
    }

    // 2️⃣ تحديث ومسح كاش مجلد الأحداث (Events) وإعادة تحميلها
    const eventsDir = path.join(process.cwd(), "modules", "events");
    if (fs.existsSync(eventsDir)) {
      const evFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith(".js"));

      for (const file of evFiles) {
        try {
          const filePath = path.join(eventsDir, file);
          delete require.cache[require.resolve(filePath)]; // مسح الكاش القديم

          const ev = require(filePath);
          const name = ev.config?.name || ev.default?.config?.name;

          if (name) {
            global.client.events.set(name, ev);
          }
        } catch (e) {
          console.error(`[RESTART ERROR] خطأ في تحميل حدث ${file}:`, e.message);
        }
      }
    }

    // حساب الوقت المستغرق للتحديث
    const timeTaken = Date.now() - startTime;

    // إرسال تقرير النجاح التلقائي دون الحاجة لتشغيل يدوي
    return api.sendMessage(
      `${header}\n\n` + 
      `✅ ┋ تـم إعـادة تـحـمـيـل الـنـواة تـلـقـائـيـاً بـنـجـاح !\n` + 
      `📦 ┋ إجمالي الأوامر والروابط النشطة الآن: [ ${global.client.commands.size} ]\n` + 
      `⏱️ ┋ الـمـدة الـمـسـتـغـرقـة للتحديث: [ ${(timeTaken / 1000).toFixed(2)} ثانية ]\n` + 
      `⚡ ┋ سـرعـة اسـتـجـابـة الـنـواة: ${timeTaken}ms\n\n` + 
      `🟢 البوت جاهز ومستقر تلقائياً الآن ومستمر في الاستماع دون توقف!`, 
      threadID, 
      messageID
    );

  } catch (err) {
    console.error("[RESTART COMMAND CRITICAL ERROR]", err);
    return api.sendMessage(`❌ | فشل في إعادة تحميل النواة برمجياً:\n${err.message}`, threadID, messageID);
  }
};
