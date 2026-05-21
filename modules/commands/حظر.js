const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "حظر",
  version: "1.0.0",
  hasPermssion: 1, // متاح للمطورين والمساعدين حسب إعدادات الـ index المحدثة
  credits: "Gemini AI",
  description: "نظام حظر المستخدمين من استخدام البوت (مؤقت / دائم / فك حظر)",
  commandCategory: "المطور",
  usages: "[بالرد أو الآيدي] + [الوقت أو فك]",
  cooldowns: 2
};

module.exports.run = async ({ api, event, args, Users }) => {
  const { threadID, messageID, senderID, type, messageReply } = event;

  // مسارات ملفات الكاش للإصدارات الأمنية
  const bansPath = path.join(__dirname, "cache", "bans.json");
  const assistantsPath = path.join(__dirname, "cache", "assistants.json");

  // جلب إعدادات البوت لمعرفة المطورين الأساسيين
  let config = {};
  try {
    config = fs.readJsonSync(path.join(__dirname, "..", "..", "config.json"));
  } catch (e) {}
  const OWNER_IDS = (config.ownerBot || []).map(String);

  // جلب المساعدين من الكاش
  let assistants = [];
  try {
    if (fs.existsSync(assistantsPath)) assistants = fs.readJsonSync(assistantsPath);
  } catch (e) {}

  // تحديد الآيدي المستهدف (سواء بالرد أو بكتابة الآيدي مباشرة في الـ args)
  let targetID = null;
  let timeArg = args[0]; // المعطى الأول الافتراضي للوقت في حالة الرد

  if (type === "message_reply") {
    targetID = String(messageReply.senderID);
  } else if (args[0] && !isNaN(args[0])) {
    targetID = String(args[0]);
    timeArg = args[1]; // المعطى الثاني يصبح هو الوقت في حالة كتابة الآيدي
  }

  if (!targetID) {
    return api.sendMessage("⚠️ | يرجى الرد على رسالة الشخص أو كتابة الـ ID الخاص به لحظرها أو فك حظره.", threadID, messageID);
  }

  // 🛡️ [جدار الحماية الأمني للمطورين والمساعدين]
  const isTargetOwner = OWNER_IDS.includes(targetID);
  const isTargetAssistant = assistants.includes(targetID);

  if (isTargetOwner || isTargetAssistant) {
    return api.sendMessage("❌ | حماية برمجية! لا يمكنك حظر المطورين الأساسيين أو مساعدي الإدارة.", threadID, messageID);
  }

  // قراءة سجل الحظر الحالي
  let bans = {};
  if (fs.existsSync(bansPath)) {
    try { bans = fs.readJsonSync(bansPath); } catch (e) {}
  }

  const targetName = await Users.getNameUser(targetID);

  // 🔓 [نظام فك الحظر]
  if (timeArg === "فك" || args[0] === "فك" || args[1] === "فك") {
    if (!bans[targetID]) {
      return api.sendMessage(`👤 | المستخدم (${targetName}) ليس محظوراً في سجلات البوت بالفعل.`, threadID, messageID);
    }
    delete bans[targetID];
    fs.writeJsonSync(bansPath, bans);
    return api.sendMessage(`✅ | تم فك الحظر بنجاح عن المستخدم: ${targetName}\n🆔 | ID: ${targetID}\n🤖 يمكنه الآن استخدام البوت مجدداً.`, threadID, messageID);
  }

  // ⏳ [تحليل ومعالجة مدة الحظر]
  let banType = "permanent";
  let durationMs = 0;
  let timeString = "دائم ♾️";

  if (timeArg) {
    const match = timeArg.match(/^(\d+)([mdh])$/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      if (unit === "m") {
        durationMs = value * 60 * 1000; // دقيقة
        timeString = `${value} دقيقة`;
      } else if (unit === "d") {
        // بناءً على طلبك: حظر 1d يحظر لساعة واحدة
        durationMs = value * 60 * 60 * 1000; // ساعة واحدة لكل وحدة d
        timeString = `${value} ساعة`;
      } else if (unit === "h") {
        durationMs = value * 60 * 60 * 1000; // ساعة كمعيار إضافي احتياطي
        timeString = `${value} ساعة`;
      }
      banType = "temporary";
    }
  }

  // تجهيز بيانات الحظر لحفظها
  const expiresAt = banType === "temporary" ? Date.now() + durationMs : null;

  bans[targetID] = {
    name: targetName,
    type: banType,
    bannedAt: Date.now(),
    expiresAt: expiresAt,
    bannedBy: senderID
  };

  // حفظ التحديثات في ملف bans.json الكاش
  fs.writeJsonSync(bansPath, bans);

  // إرسال رسالة التأكيد المخصصة
  const responseMsg = `🚫 | تم حظر المستخدم من استخدام البوت بنجاح!\n\n` +
                      `👤 | الاسم: ${targetName}\n` +
                      `🆔 | الآيدي: ${targetID}\n` +
                      `⏳ | مدة الحظر: ${timeString}\n` +
                      `🛡️ | بواسطة: ${await Users.getNameUser(senderID)}`;

  return api.sendMessage(responseMsg, threadID, messageID);
};
