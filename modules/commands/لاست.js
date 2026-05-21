const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "لاست",
  aliases: ["المجموعات", "جروبات", "groups"],
  version: "1.4.5",
  hasPermssion: 1, 
  credits: "عبدو",
  description: "عرض المجموعات مع ميزة الخروج بالرد بالرقم أو طلب الدخول بـ (دخلني رقم) 🌐",
  commandCategory: "نظام",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
    const THREADS_PATH = path.join(process.cwd(), "database", "threads.json");

    if (!fs.existsSync(THREADS_PATH)) {
      return api.sendMessage("🌐 ┋ لم يتم العثور على أي مجموعات مسجلة حالياً !", threadID, messageID);
    }

    const threadsData = fs.readJsonSync(THREADS_PATH);
    const allThreads = Object.keys(threadsData);

    if (allThreads.length === 0) {
      return api.sendMessage("🌐 ┋ قائمة المجموعات فارغة حالياً !", threadID, messageID);
    }

    let index = 1;
    let msg = `●─────── ⌬ ───────●\n ⦿ ⟬ ま 𝑳𝑰𝑺𝑻-𝑮𝑹𝑶𝑼𝑷𝑺 ま ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n`;
    const groupList = []; 

    for (const id of allThreads) {
      try {
        const threadInfo = await api.getThreadInfo(id);
        if (threadInfo) {
          const groupName = threadInfo.threadName || "مجموعة بدون اسم 👤";
          msg += ` ⟣ [${index}] 📁 اِلسّمْ: ${groupName}\n⊱ ────────────── ⊰\n`;

          groupList.push({
            number: index,
            id: id,
            name: groupName
          });
          index++;
        }
      } catch (err) {
        continue;
      }
    }

    const totalGroups = index - 1;
    if (totalGroups === 0) {
      return api.sendMessage("🌐 ┋ البوت لا يتواجد في أي مجموعة نشطة حالياً !", threadID, messageID);
    }

    msg += ` 📊 إِجْمَالِي الْمَجْمُوعَاتِ: [ ${totalGroups} ]\n\n💡 ┋ للرد والإجراء:\n- قم بالرد برقم المجموعة [للخروج منها].\n- قم بالرد بـ (دخلني رقم) [ليقوم البوت بإضافتك إليها].\n●─────── ⌬ ───────●`;

    return api.sendMessage(msg, threadID, (err, info) => {
      if (err) return console.error(err);

      // تم تغيير name إلى "لاست" مباشرة لضمان التقاط السورس للرد
      global.client.handleReply.push({
        name: "لاست",
        messageID: info.messageID,
        author: senderID,
        groupList: groupList
      });
    }, messageID);

  } catch (e) {
    return api.sendMessage(`❌ ┋ حدث خطأ أثناء تنفيذ الأمر:\n${e.message}`, threadID, messageID);
  }
};

// ══════════════════════════════════════════
// HANDLE REPLY
// ══════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  const { groupList, author } = handleReply;

  // الحماية: التحقق من أن الشخص المرسل هو صاحب الأمر الأصلي
  if (String(senderID) !== String(author)) return;

  const input = body.trim().toLowerCase();

  // 1. معالجة أمر الدخول (سواء كتب: دخلني 1 أو دخلني1)
  if (input.startsWith("دخلني")) {
    const numStr = input.replace(/[^0-9]/g, ""); // استخراج الرقم فقط
    const targetGroup = groupList.find(g => g.number == numStr);

    if (!targetGroup) {
      return api.sendMessage("❌ ┋ رقم المجموعة غير صحيح أو غير موجود بالقائمة !", threadID, messageID);
    }

    try {
      api.sendMessage(`🔄 ┋ جاري محاولة إضافتك إلى مجموعة: [ ${targetGroup.name} ]...`, threadID, messageID);

      // المحاولة الأولى: الإضافة المباشرة
      await api.addUserToGroup(String(senderID), String(targetGroup.id));
      return api.sendMessage(`✅ ┋ تم إضافتك بنجاح إلى المجموعة !`, threadID, messageID);
    } catch (err) {
      console.error("[ADD USER ERROR]", err);
      // المحاولة الثانية: جلب رابط الدعوة إذا فشلت الإضافة المباشرة بسبب الخصوصية
      try {
        const inviteLink = await api.getInviteLink(targetGroup.id);
        if (inviteLink) {
          return api.sendMessage(`⚠️ ┋ تعذر إضافتك تلقائياً بسبب إعدادات حسابك، تفضل رابط المجموعة:\n🔗 ${inviteLink}`, threadID, messageID);
        }
      } catch (e) {
        return api.sendMessage(`❌ ┋ فشل الإجراء! البوت ليس مسؤولاً (Admin) في تلك المجموعة لجلب الرابط أو إضافتك.`, threadID, messageID);
      }
    }
  } 

  // 2. معالجة أمر الخروج (الرد برقم مجرد)
  else if (!isNaN(input)) {
    const targetGroup = groupList.find(g => g.number == input);

    if (!targetGroup) {
      return api.sendMessage("❌ ┋ رقم المجموعة غير صحيح !", threadID, messageID);
    }

    try {
      api.sendMessage(`🚪 ┋ جاري مغادرة مجموعة: [ ${targetGroup.name} ] بناءً على طلبك...`, threadID, messageID);
      await api.removeUserFromGroup(api.getCurrentUserID(), targetGroup.id);
      return api.sendMessage(`✅ ┋ تم الخروج من مجموعة [ ${targetGroup.name} ] بنجاح !`, threadID, messageID);
    } catch (err) {
      return api.sendMessage(`❌ ┋ حدث خطأ أثناء محاولة الخروج من المجموعة:\n${err.message}`, threadID, messageID);
    }
  }
};
