module.exports.config = {
  name: "مسح",
  aliases: ["unsend", "حذف"],
  version: "1.0.0",
  hasPermssion: 1, // تم ضبط الصلاحية للآدمن (المسؤولين في المجموعة) والمطورين تلقائياً
  credits: "Abdou / ريم بوت",
  description: "حذف آخر رسالة أرسلها البوت في المجموعة للآدمن فقط 💫",
  commandCategory: "الادمن",
  usages: "",
  cooldowns: 1
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, isGroup } = event;

  // 1. التحقق من أن الأمر يتم تنفيذه داخل مجموعة وليس في الخاص
  if (!isGroup) return;

  try {
    // 2. جلب معلومات المجموعة للتحقق من رتبة المستخدم
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(admin => String(admin.id));

    // جلب قائمة المطورين من الـ config للدعم المتبادل
    const botConfig = global.config || global.client?.config || {};
    const OWNER_IDS = (botConfig.ownerBot || []).map(String);

    const isAdmin = adminIDs.includes(String(senderID));
    const isDev = OWNER_IDS.includes(String(senderID));

    // إذا لم يكن المستخدم آدمن أو مطور، يتجاهل البوت الأمر تماماً
    if (!isAdmin && !isDev) return;

    // 3. حذف رسالة الآدمن "مسح" فوراً لكي لا تترك أثراً في المجموعة
    await api.unsendMessage(messageID).catch(() => {});

    // 4. جلب تاريخ الرسائل القريبة (آخر 30 رسالة كافية جداً) للعثور على رسالة البوت
    const history = await api.getThreadHistory(threadID, 30);
    const botID = String(api.getCurrentUserID());

    // تصفية التاريخ لاستخراج الرسائل التي أرسلها البوت نفسه
    const botMessages = history.filter(msg => String(msg.senderID) === botID);

    // 5. إذا وجد البوت رسائل تخصه، يقوم بحذف آخر واحدة منها (الأحدث)
    if (botMessages.length > 0) {
      const lastBotMessage = botMessages[0]; // المصفوفة مرتبة من الأحدث للأقدم تلقائياً
      await api.unsendMessage(lastBotMessage.messageID);
    }

  } catch (error) {
    console.error("[UNSEND COMMAND ERROR]", error);
  }
};
