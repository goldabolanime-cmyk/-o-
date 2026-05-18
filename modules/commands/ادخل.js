// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "ادخل",
  version: "2.0.0",
  hasPermssion: 1, // مخصص للمشرفين والمطورين فقط
  credits: "Abdou",
  description: "إدخال وإضافة الأعضاء إلى المجموعة مباشرة (بالرد أو بالآيدي)",
  commandCategory: "إدارة Mجموعات",
  usages: "[بالرد على إشعار المغادرة/الرسالة] أو [كتابة الآيدي]",
  cooldowns: 2
};

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, messageReply, senderID } = event;
  const botID = api.getCurrentUserID();

  // 1️⃣ التحقق من رتبة المنفذ (يجب أن يكون أدمن أو مطور السورس)
  const threadInfo = await api.getThreadInfo(threadID);
  const adminIDs = threadInfo.adminIDs.map(a => String(a.id));
  const botConfig = global.client?.config || global.config || {};
  const OWNER_IDS = (botConfig.ownerBot || []).map(String);

  if (!adminIDs.includes(String(senderID)) && !OWNER_IDS.includes(String(senderID))) {
    return api.sendMessage("👑 ┃ عذراً، هذا الأمر مخصص لمالك البوت وأدمن المجموعة فقط!", threadID, messageID);
  }

  // 2️⃣ استخراج الآيدي المستهدف (سواء بالرد أو عبر الـ args)
  let targetID = "";

  if (messageReply) {
    targetID = messageReply.senderID;
  } else if (args[0]) {
    targetID = args[0].trim();
  }

  if (!targetID || isNaN(targetID)) {
    return api.sendMessage("⚠️ ┃ يرجى الرد على رسالة الشخص (أو إشعار المغادرة) أو كتابة الآيدي بشكل صحيح بعد الأمر.\n💡 ┋ مثال: .ادخل 61587705922600", threadID, messageID);
  }

  // التحقق من أن المستهدف ليس البوت نفسه
  if (String(targetID) === String(botID)) {
    return api.sendMessage("🤖 ┃ أنا موجود بالفعل داخل المجموعة يا رئيس!", threadID, messageID);
  }

  // التحقق إذا كان العضو موجوداً بالفعل في المجموعة لتفادي إرسال طلبات مكررة
  if (threadInfo.participantIDs.map(String).includes(String(targetID))) {
    return api.sendMessage("👤 ┃ هذا العضو متواجد ومشارك بالفعل داخل هذه المجموعة حالياً.", threadID, messageID);
  }

  // 3️⃣ تنفيذ عملية الإضافة الفورية مباشرة
  api.addUserToGroup(targetID, threadID, (err) => {
    if (err) {
      // إذا رفضت المنصة الإضافة بسبب إعدادات الخصوصية للحساب المستهدف
      return api.sendMessage(`❌ ┃ تعذر إضافة العضو ذو المعرف [${targetID}] مباشرة.\n🛡️ ┃ السبب: قيود وإعدادات الخصوصية الخاصة بحساب العضو تمنع البوتات أو غير الأصدقاء من إضافته للمجموعات يدويًا.`, threadID, messageID);
    }

    // في حالة نجاح الإضافة
    return api.sendMessage(`✅ ┃ تم إدخال وإضافة العضو بنجاح إلى المجموعة!`, threadID, messageID);
  });
};
