const fs = require("fs-extra");

module.exports.config = {
  name: "لاست",
  aliases: ["المجموعات", "جروبات", "groups"],
  version: "1.0.0",
  hasPermssion: 2,
  credits: "عبدو",
  description: "عرض قائمة بجميع المجموعات والجروبات التي يتواجد فيها البوت مع الآيديات 🌐",
  commandCategory: "نظام",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    const threadsPath = require("path").join(process.cwd(), "database", "threads.json");
    let threadsData = {};
    try {
      threadsData = JSON.parse(fs.readFileSync(threadsPath, "utf8") || "{}");
    } catch {}

    const groupList = Object.entries(threadsData);

    if (groupList.length === 0) {
      return api.sendMessage(
        "🌐 ┋ لا توجد بيانات مجموعات محفوظة بعد.\n💡 ┋ سيتم تسجيل المجموعات تلقائياً مع استخدام البوت.",
        threadID, messageID
      );
    }

    let index = 1;
    let msg = `●─────── ⌬ ───────●\n ⦿ ⟬ ま 𝑳𝑰𝑺𝑻-𝑮𝑹𝑶𝑼𝑷𝑺 ま ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n`;

    for (const [gID, data] of groupList) {
      const groupName = data.name || "مجموعة غير مسماة";
      msg += ` ⟣ [${index++}] 📁 الاسم: ${groupName}\n ⟣ 🆔 الآيدي: ${gID}\n⊱ ────────────── ⊰\n`;
    }

    msg += ` 📊 إجمالي المجموعات: [ ${groupList.length} ]\n●─────── ⌬ ───────●`;

    return api.sendMessage(msg, threadID, messageID);

  } catch (e) {
    console.error("[GROUPS LIST ERROR]", e.message);
    return api.sendMessage(`❌ ┋ حدث خطأ:\n${e.message}`, threadID, messageID);
  }
};
