const fs = require("fs-extra");
const path = require("path");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "كود",
  version: "20.10.0",
  hasPermssion: 2, 
  credits: "REM BOT",
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

  const botConfig = global.client.config || {};
  const OWNER_IDS = botConfig.ownerBot || [];
  const header = "✦〘•ま 𝑹𝑬𝑴-𝑩𝑶𝑻 ま•〙✦";

  // التحقق من المالك الأساسي من الإعدادات
  if (String(senderID) !== String(OWNER_IDS[0])) {
    return api.sendMessage("👑 ┃ عذراً، هذا الأمر مخصص لمالك البوت فقط!", threadID, messageID);
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
      global.client.commands.delete(targetName);
      return api.sendMessage(`${header}\n\n✅ ┋ تم حذف الملف [ ${fileName} ] بنجاح.`, threadID, messageID);
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
        api.sendMessage("🕒 ┋ سيتم حذف رسالة الكود بعد 120 ثانية للخصوصية.", threadID, () => {
          setTimeout(() => { api.unsendMessage(info.messageID); }, 120000);
        });
      }, messageID);
    } catch (err) {
      return api.sendMessage("❌ ┃ فشل في قراءة محتوى الملف.", threadID, messageID);
    }
  }

  // --- [ التعديل ] ---
  if (isEdit) {
    const searchString = args[1];
    const startIndex = body.indexOf(searchString) + searchString.length;
    const newCode = body.substring(startIndex).trim();

    if (!newCode) return api.sendMessage("⚠️ ┋ يرجى كتابة الكود الجديد بعد اسم الملف.", threadID, messageID);

    try {
      fs.writeFileSync(filePath, newCode, "utf-8");
      api.setMessageReaction("✅", messageID, () => {}, true);

      delete require.cache[require.resolve(filePath)];
      const updated = require(filePath);
      if (updated.config && updated.config.name) {
        global.client.commands.set(updated.config.name, updated);
      }

      return api.sendMessage(`${header}\n\n✅ ┋ تم تحديث الملف [ ${fileName} ] بنجاح!`, threadID, messageID);
    } catch (err) {
      return api.sendMessage(`❌ ┃ فشل في حفظ التعديلات: ${err.message}`, threadID, messageID);
    }
  }
};
