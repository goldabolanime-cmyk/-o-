module.exports.config = {
  name: "لاست",
  aliases: ["المجموعات", "جروبات", "groups"],
  version: "1.2.0",
  hasPermssion: 1, 
  credits: "عبدو",
  description: "عرض قائمة بأسماء المجموعات التي يتواجد فيها البوت من الذاكرة المحلية 🌐",
  commandCategory: "نظام",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // جلب جميع آيديات المجموعات المخزنة بكاش البوت لتجنب دالة getThreadList المنهارة
    const allThreads = global.data.allThreadID || [];

    if (allThreads.length === 0) {
      return api.sendMessage("🌐 ┋ لم يتم العثور على أي مجموعات مسجلة في ذاكرة البوت حالياً !", threadID, messageID);
    }

    let index = 1;
    let msg = `●─────── ⌬ ───────●\n ⦿ ⟬ ま 𝑳𝑰𝑺𝑻-𝑮𝑹𝑶𝑼𝑷𝑺 ま ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n`;

    // الدوران حول الآيديات لجلب الأسماء فقط بشكل آمن
    for (const id of allThreads) {
      try {
        // جلب معلومات الخيط من الكاش أو خادم فيسبوك بشكل مباشر وآمن لكل جروب على حدة
        const threadInfo = await api.getThreadInfo(id);

        if (threadInfo && threadInfo.isGroup) {
          const groupName = threadInfo.threadName || "مجموعة بدون اسم 👤";
          msg += ` ⟣ [${index++}] 📁 اِلسّمْ: ${groupName}\n⊱ ────────────── ⊰\n`;
        }
      } catch (err) {
        // تخطي الجروبات التالفة أو التي طردت البوت بصمت دون إيقاف السكربت
        continue;
      }
    }

    const totalGroups = index - 1;
    if (totalGroups === 0) {
      return api.sendMessage("🌐 ┋ البوت لا يتواجد في أي مجموعة نشطة حالياً !", threadID, messageID);
    }

    msg += ` 📊 إِجْمَالِي الْمَجْمُوعَاتِ: [ ${totalGroups} ]\n●─────── ⌬ ───────●`;

    return api.sendMessage(msg, threadID, messageID);

  } catch (e) {
    return api.sendMessage(`❌ ┋ حدث خطأ أثناء تنفيذ الأمر:\n${e.message}`, threadID, messageID);
  }
};
