const fs = require("fs-extra");
const path = require("path");

// مسار حفظ بادئات المجموعات
const pathData = path.join(__dirname, "cache", "threadPrefixes.json");

module.exports.config = {
  name: "بادئة",
  version: "1.0.0",
  hasPermssion: 1, // مخصص للمشرفين والمطورين لتغيير بادئة المجموعة
  credits: "Abdou",
  description: "عرض أو تغيير أو إزالة بادئة البوت في المجموعة",
  commandCategory: "النظام",
  usages: "[بدون / تغيير / نظام]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const botConfig = global.config || {};
  const systemPrefix = botConfig.PREFIX || botConfig.prefix || ".";

  // تهيئة ملف الحفظ إذا لم يكن موجوداً
  if (!fs.existsSync(path.dirname(pathData))) fs.ensureDirSync(path.dirname(pathData));
  if (!fs.existsSync(pathData)) fs.writeFileSync(pathData, "{}", "utf8");

  let prefixes = JSON.parse(fs.readFileSync(pathData, "utf8"));
  let currentPrefix = prefixes[threadID] || systemPrefix;

  const action = args[0];

  // 1️⃣ حالة: .بادئة نظام (تغيير بادئة السورس كامل - للمطور فقط)
  if (action === "نظام") {
    const OWNER_IDS = (botConfig.ownerBot || global.client?.config?.ownerBot || []).map(String);
    if (!OWNER_IDS.includes(String(event.senderID))) {
      return api.sendMessage("❌ هذا الأمر مخصص لمطور البوت فقط لتغيير بادئة النظام العامة.", threadID, messageID);
    }

    let newSysPrefix = args.slice(1).join(" ").trim();
    if (newSysPrefix === "بدون") newSysPrefix = "";

    // تحديث البادئة في كconfig الذاكرة والملف إذا كان متاحاً
    if (global.config) global.config.PREFIX = newSysPrefix;

    return api.sendMessage(`🌐 System prefix: ${newSysPrefix}\n🛸 Your box chat prefix: ${currentPrefix}`, threadID, messageID);
  }

  // 2️⃣ حالة: .بادئة تغيير [الرمز]
  if (action === "تغيير") {
    let newPrefix = args.slice(1).join(" ").trim();

    if (!newPrefix) {
      return api.sendMessage(`⚠️ يرجى كتابة البادئة الجديدة بعد كلمة تغيير.\n💡 مثال: .بادئة تغيير #`, threadID, messageID);
    }

    if (newPrefix === "بدون") {
      prefixes[threadID] = "";
    } else {
      prefixes[threadID] = newPrefix;
    }

    fs.writeFileSync(pathData, JSON.stringify(prefixes, null, 2), "utf8");
    return api.sendMessage(`🌐 System prefix: ${systemPrefix}\n🛸 Your box chat prefix: ${prefixes[threadID]}`, threadID, messageID);
  }

  // 3️⃣ حالة: .بادئة بدون (إزالة البادئة للمجموعة ليصبح بدون بادئة)
  if (action === "بدون") {
    prefixes[threadID] = "";
    fs.writeFileSync(pathData, JSON.stringify(prefixes, null, 2), "utf8");
    return api.sendMessage(`🌐 System prefix: ${systemPrefix}\n🛸 Your box chat prefix: `, threadID, messageID);
  }

  // 4️⃣ الحالة الافتراضية: عرض البادئة الحالية عند كتابة (.بادئة) فقط
  return api.sendMessage(`🌐 System prefix: ${systemPrefix}\n🛸 Your box chat prefix: ${currentPrefix}`, threadID, messageID);
};
