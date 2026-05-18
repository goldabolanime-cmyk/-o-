const fs = require("fs-extra");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "تقييد",
  aliases: ["صيانة", "قفل_البوت"],
  version: "1.2.0",
  hasPermssion: 2, // للمطور الأساسي فقط 
  credits: "Abdou / Rem Bot",
  description: "تقييد استخدام البوت وجعله يستجيب للمطورين فقط (صيانة دائم أو مؤقت)",
  commandCategory: "نظام",
  usages: "[تشغيل / ايقاف / وقت مثل: 5m, 1h]",
  cooldowns: 3
};

const header = "◆━━━━━▷ ✦ ◁━━━━━◆";

// تهيئة جدار الحماية فور تحميل الملف في الذاكرة لكي يراه السيرفر الرئيسي مباشرة
if (global.client.maintenance === undefined) {
  global.client.maintenance = {
    isRestricted: false,
    timeoutRef: null
  };
}

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const action = (args[0] || "").toLowerCase();

  // 1️⃣ حالة إيقاف التقييد (فك التقييد يدوياً)
  if (action === "ايقاف" || action === "إيقاف") {
    if (!global.client.maintenance.isRestricted) {
      return api.sendMessage("💡 | البوت غير مقيد بالفعل وهو متاح للجميع الآن.", threadID, messageID);
    }

    if (global.client.maintenance.timeoutRef) {
      clearTimeout(global.client.maintenance.timeoutRef);
      global.client.maintenance.timeoutRef = null;
    }

    global.client.maintenance.isRestricted = false;

    let releaseMsg = `${header}\n` +
                    `✅ | تـم فـك الـتـقـيـيـد بـنـجـاح.\n` +
                    `✨ | الـبـوت عـاد لـلـعـمـل لـلـجـمـيـع الآن.\n` +
                    `${header}`;
    return api.sendMessage(releaseMsg, threadID, messageID);
  }

  // 2️⃣ حالة تشغيل التقييد الدائم
  if (action === "تشغيل") {
    if (global.client.maintenance.isRestricted && !global.client.maintenance.timeoutRef) {
      return api.sendMessage("⚠️ | البوت في وضع التقييد الدائم بالفعل.", threadID, messageID);
    }

    if (global.client.maintenance.timeoutRef) {
      clearTimeout(global.client.maintenance.timeoutRef);
      global.client.maintenance.timeoutRef = null;
    }

    global.client.maintenance.isRestricted = true;

    let restrictMsg = `${header}\n` +
                      `🔒 | تـم تـفـعـيـل الـتـقـيـيـد الـشـامـل.\n` +
                      `🛠️ | الـبـوت دخـل وضـع الـصـيـانـة الـدائمة.\n` +
                      `👤 | الاسـتـجـابـة لـلـمـطـوريـن فـقـط الآن.\n` +
                      `${header}`;
    return api.sendMessage(restrictMsg, threadID, messageID);
  }

  // 3️⃣ حالة التقييد المؤقت (مثال: تقييد 5m أو تقييد 1h)
  if (action) {
    const timeMatch = action.match(/^(\d+)(m|h|s)$/);
    if (!timeMatch) {
      return api.sendMessage("⚠️ | صيغة غير صحيحة! استخدم: [تقييد تشغيل] أو [تقييد ايقاف] أو [تقييد 5m]", threadID, messageID);
    }

    const value = parseInt(timeMatch[1]);
    const unit = timeMatch[2];
    let timeInMs = 0;
    let unitText = "";

    switch (unit) {
      case "s": timeInMs = value * 1000; unitText = "ثانية"; break;
      case "m": timeInMs = value * 60 * 1000; unitText = "دقيقة"; break;
      case "h": timeInMs = value * 60 * 60 * 1000; unitText = "ساعة"; break;
    }

    if (global.client.maintenance.timeoutRef) {
      clearTimeout(global.client.maintenance.timeoutRef);
    }

    global.client.maintenance.isRestricted = true;

    global.client.maintenance.timeoutRef = setTimeout(() => {
      global.client.maintenance.isRestricted = false;
      global.client.maintenance.timeoutRef = null;

      let endNotice = `${header}\n` +
                      `🔔 | إنـتـهـت مـدة الـصـيـانـة الـمـؤقـتـة.\n` +
                      `✅ | تـم فـك الـتـقـيـيـد تـلـقـائـيـاً بـنـجـاح.\n` +
                      `✨ | الـبـوت عـاد لـلـعـمـل لـلـجـمـيـع الآن.\n` +
                      `${header}`;
      api.sendMessage(endNotice, threadID);
    }, timeInMs);

    let tempRestrictMsg = `${header}\n` +
                          `⏳ | تـم تـقـيـيـد الـبـوت مـؤقـتـاً.\n` +
                          `🛠️ | وضـع وضـع الـصـيـانـة لـمـدة: [ ${value} ${unitText} ].\n` +
                          `👤 | الاسـتـجـابـة لـلـمـطـوريـن فـقـط حـتـى الانـتـهـاء.\n` +
                          `${header}`;
    return api.sendMessage(tempRestrictMsg, threadID, messageID);
  }

  return api.sendMessage(`ℹ️ | استخدام الأمر:\n• تقييد تشغيل (صيانة دائم)\n• تقييد ايقاف (إلغاء الصيانة)\n• تقييد [الوقت] (مثال: تقييد 15m)`, threadID, messageID);
};
