module.exports.config = {
  name: "مسح",
  aliases: ["un", "حذف", "unsend"],
  version: "1.0.0",
  hasPermssion: 0, // يمكن للجميع استخدامه لحذف رسائل البوت
  credits: "Abdou",
  description: "حذف رسائل البوت عن طريق الرد عليها (Reply)",
  commandCategory: "system",
  usages: "[قم بالرد على رسالة البوت التي تريد حذفها]",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, type, messageReply, senderID } = event;

  // 1. التحقق مما إذا كان المستخدم قد قام بالرد على رسالة بالفعل
  if (type !== "message_reply") {
    return api.sendMessage(
      "⚠️ | عذراً، يجب أن تقوم بالرد (Reply) على الرسالة التي تريد مني حذفها!", 
      threadID, 
      messageID
    );
  }

  // 2. التحقق مما إذا كانت الرسالة المراد حذفها قد أُرسلت بواسطة البوت نفسه
  // البوت لا يستطيع حذف رسائل الأعضاء الآخرين، بل يحذف رسائله فقط
  if (messageReply.senderID != api.getCurrentUserID()) {
    return api.sendMessage(
      "❌ | لا يمكنني حذف هذه الرسالة لأنها لا تخصني! يمكنني فقط مسح رسائلي الخاصة.", 
      threadID, 
      messageID
    );
  }

  // 3. تنفيذ عملية الحذف (Unsend) بناءً على الـ messageID للرسالة المردود عليها
  return api.unsendMessage(messageReply.messageID, (err) => {
    if (err) {
      return api.sendMessage(
        "❌ | حدث خطأ أثناء محاولة حذف الرسالة، قد تكون قديمة جداً أو تم حذفها بالفعل.", 
        threadID, 
        messageID
      );
    }
  });
};
