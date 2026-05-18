const fs = require("fs-extra");
const path = require("path");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "كود",
  version: "21.0.0",
  hasPermssion: 2, 
  credits: "Abdou",
  description: "نظام إدارة ملفات الأوامر: عرض، تعديل، حذف، وقائمة",
  commandCategory: "نظام المطور",
  usages: "[اسم الأمر] أو [تعديل] [الاسم] [الكود] أو [حذف] [الاسم] أو [قائمة]",
  cooldowns: 0
};

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;

  const botConfig = global.client?.config || global.config || {};
  const OWNER_IDS = (botConfig.ownerBot || []).map(String);
  const header = "✦〘•  𝑴𝑨𝑵𝑨𝑮𝑬𝑹 𝑪𝑶𝑫𝑬  •〙✦";

  // التحقق من صلاحية المطورين المسجلين في الإعدادات
  if (!OWNER_IDS.includes(String(senderID))) {
    return api.sendMessage("👑 ┃ عذراً، هذا الأمر مخصص لمالك البوت والمطورين فقط!", threadID, messageID);
  }

  const dirPath = path.join(__dirname);
  const files = fs.readdirSync(dirPath).filter(file => file.endsWith(".js"));

  // --- [ قائمة الملفات ] ---
  if (args[0] === "قائمة") {
    api.setMessageReaction("📋", messageID, () => {}, true);
    let msg = `${header}\n\n`;
    files.forEach((file, index) => {
      msg += ` ✦ 𓆩 ${index + 1} 𓆪 ⟻ 『${file}』\n`;
    });
    msg += `\n───── · · · ✦ · · · ─────\n`;
    msg += `❄↜ الإجـمالي: ${files.length} ملف`;
    return api.sendMessage(msg, threadID, messageID);
  }

  if (args.length === 0) {
    return api.sendMessage(`${header}\n\n⚠️ ┋ يرجى تحديد اسم الملف أو الخيار.\n💡 ┋ مثال: .كود قائمة\n💡 ┋ مثال: .كود اوبتايم`, threadID, messageID);
  }

  const isEdit = args[0] === "تعديل";
  const isDelete = args[0] === "حذف";
  const targetName = (isEdit || isDelete) ? args[1] : args[0];

  let fileName = "";
  let filePath = "";

  for (const file of files) {
    const p = path.join(dirPath, file);
    try {
      if (file === targetName || file === targetName + ".js") {
        fileName = file;
        filePath = p;
        break;
      }
      const command = require(p);
      if (command.config && command.config.name === targetName) {
        fileName = file;
        filePath = p;
        break;
      }
    } catch (e) { continue; }
  }

  if (!filePath) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`${header}\n\n❌ ┋ لم يتم العثور على ملف باسم: ${targetName}`, threadID, messageID);
  }

  // --- [ حذف الملف ] ---
  if (isDelete) {
    try {
      api.setMessageReaction("🗑️", messageID, () => {}, true);
      fs.unlinkSync(filePath);

      // إزاحته من الذاكرة الحية للمشروع الميرائي/اللافيا
      if (global.client && global.client.commands) {
        global.client.commands.delete(targetName);
      }
      return api.sendMessage(`${header}\n\n✅ ┋ تم حذف الملف [ ${fileName} ] بنجاح من السورس.`, threadID, messageID);
    } catch (err) {
      return api.sendMessage(`❌ ┃ خطأ أثناء الحذف: ${err.message}`, threadID, messageID);
    }
  }

  // --- [ عرض الكود ] ---
  if (!isEdit && !isDelete) {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    try {
      const code = fs.readFileSync(filePath, "utf-8");
      return api.sendMessage(code, threadID, (err, info) => {
        if (err) return api.sendMessage("❌ ┃ فشل في إرسال محتوى الكود الكامل.", threadID, messageID);
        api.sendMessage("🕒 ┋ سيتم حذف رسالة الكود بعد 120 ثانية للخصوصية وأمان الحساب.", threadID, () => {
          setTimeout(() => { api.unsendMessage(info.messageID); }, 120000);
        });
      }, messageID);
    } catch (err) {
      return api.sendMessage("❌ ┃ فشل في قراءة محتوى الملف.", threadID, messageID);
    }
  }

  // --- [ التعديل والإصلاح الآمن ] ---
  if (isEdit) {
    if (!args[2]) return api.sendMessage("⚠️ ┋ يرجى كتابة الكود الجديد بعد اسم الملف.", threadID, messageID);

    try {
      // جلب الكود بدقة متناهية عبر تخطي "البريفكس + كود + تعديل + اسم_الملف" بناءً على موقعه الأصلي في النص
      const searchString = args[1];
      const index = body.indexOf(searchString) + searchString.length;
      const newCode = body.slice(index).trim();

      if (!newCode) return api.sendMessage("⚠️ ┋ لم يتم العثور على أي كود جديد لحفظه.", threadID, messageID);

      // كتابة وحفظ التحديثات بالملف
      fs.writeFileSync(filePath, newCode, "utf-8");
      api.setMessageReaction("✅", messageID, () => {}, true);

      // تنظيف كاش الحزمة المحملة وإعادة التعيين بالذاكرة لتجنب كراش السيرفر
      delete require.cache[require.resolve(filePath)];
      const updated = require(filePath);

      if (updated.config && updated.config.name && global.client && global.client.commands) {
        global.client.commands.set(updated.config.name, updated);
      }

      return api.sendMessage(`${header}\n\n✅ ┋ تم تعديل وتحديث ملف [ ${fileName} ] بنجاح وحفظه في الذاكرة الحية السورس!`, threadID, messageID);
    } catch (err) {
      return api.sendMessage(`❌ ┃ فشل في حفظ التعديلات أو هناك خطأ في البنية البرمجية للكود: ${err.message}`, threadID, messageID);
    }
  }
};
