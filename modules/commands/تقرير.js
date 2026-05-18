// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "تقرير",
  aliases: ["بلاغ", "report"],
  version: "2.0.0",
  hasPermssion: 0, // متاح للجميع
  credits: "Abdou / RIO BOT",
  description: "نظام بلاغات وتواصل لانهائي ومباشر بين المستخدمين ومطور البوت عبر الردود",
  commandCategory: "💬 تواصل",
  usages: "[محتوى التقرير أو المشكلة]",
  cooldowns: 5
};

const DEVELOPER_ID = "1345646303986676"; // ايدي المطور المستلم للبلاغات

// ══════════════════════════════════════════
// 🚀 متحكم التشغيل الأساسي (Run)
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID } = event;
  const content = args.join(" ");

  if (!content) {
    return api.sendMessage("⚠️ | يرجى كتابة نص التقرير أو المشكلة بعد الأمر.\nمثال: .تقرير واجهت مشكلة في أمر السوق", threadID, messageID);
  }

  const reportNumber = Math.floor(1000 + Math.random() * 9000);
  let senderName = await Users.getNameUser(senderID) || "مستخدم غير معروف";
  let threadName = "شات خاص";

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    if (threadInfo && threadInfo.threadName) threadName = threadInfo.threadName;
  } catch (e) {}

  const timeOptions = {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  };
  const currentTime = new Date().toLocaleString('ar-MA', timeOptions);

  const devMsg = 
    `●─────── ⌬ ───────●\n` +
    ` ⦿ ⟬ 🎫 بَلَاغٌ جَدِيدٌ #${reportNumber} ⟭ ⦿\n` +
    `┝━━━━━━━━━━━━━━━\n` +
    `┇ 👤 الْمُرْسِلُ ↜ ${senderName}\n` +
    `┇ 🆔 الآيْدِي ↜ ${senderID}\n` +
    `┇ 🌐 الْمَصْدَرُ ↜ ${threadName}\n` +
    `┇ 📅 التَّوْقِيتُ ↜ ${currentTime}\n` +
    `┝━━━━━━━━━━━━━━━\n` +
    `┇ 📩 الْمُحْتَوَى :\n` +
    `┇ ${content}\n` +
    `┝━━━━━━━━━━━━━━━\n` +
    `┇ 💡 رُدَّ عَلَى الرِّسَالَةِ لِلتَّوَاصُلِ مَعَ الْعُضْوِ\n` +
    `●─────── ⌬ ───────●`;

  api.sendMessage(devMsg, DEVELOPER_ID, (err, info) => {
    if (err) {
      return api.sendMessage("❌ | حدث خطأ أثناء إرسال البلاغ للمطور، يرجى المحاولة لاحقاً.", threadID, messageID);
    }

    // تهيئة خطوة التواصل الأولى (استلام المطور للبلاغ)
    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: info.messageID,
      authorID: senderID,
      threadID: threadID,
      type: "dev_received"
    });

    const userSuccessMsg = 
      `●─────── ⌬ ───────●\n` +
      ` ⦿ ⟬ الْبَلَاغُ 🎫 ⟭ ⦿\n` +
      `┝━━━━━━━━━━━━━━━\n` +
      `┇ ✅ تَمَّ إِرْسَالُ بَلَاغِكَ بِنَجَاحٍ\n` +
      `┇ 🎫 رَقَمُ الْبَلَاغِ: #${reportNumber}\n` +
      `●─────── ⌬ ───────●`;

    return api.sendMessage(userSuccessMsg, threadID, messageID);
  });
};

// ══════════════════════════════════════════
// 📥 معالج الردود الذكي والتواصل اللانهائي (handleReply)
// ══════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply, Users }) {
  const { senderID, body, threadID, messageID } = event;

  // 1️⃣ حلقة رد المطور (تصل مباشرة إلى المجموعة أو الشات الخاص بالمستخدم)
  if (handleReply.type === "dev_received" && String(senderID) === DEVELOPER_ID) {

    const devName = await Users.getNameUser(DEVELOPER_ID) || "مطور البوت";

    const replyToUserMsg = 
      `●─────── ⌬ ───────●\n` +
      ` ⦿ ⟬ 🔔 رَدُّ الْمُطَوِّرِ ⟭ ⦿\n` +
      `┝━━━━━━━━━━━━━━━\n` +
      `┇ 👤 مِنَ الْمُطَوِّرِ ↜ ${devName}\n` +
      `┝━━━━━━━━━━━━━━━\n` +
      `┇ 💬 الرَّسَالَةُ :\n` +
      `┇ ${body}\n` +
      `┝━━━━━━━━━━━━━━━\n` +
      `┇ 💡 يُمْكِنُكَ الرَّدُّ عَلَى هَذِهِ الرِّسَالَةِ لِمُوَاصَلَةِ الْحَدِيثِ كَمُعَقِّبٍ\n` +
      `●─────── ⌬ ───────●`;

    api.sendMessage(replyToUserMsg, handleReply.threadID, (err, info) => {
      if (err) return api.sendMessage("❌ | فشل إرسال الرد، قد يكون البوت قد طُرد من المجموعة أو الحساب مغلق.", threadID, messageID);

      // فتح إمكانية الرد اللانهائي للمستخدم ليرد على رد المطور
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        authorID: handleReply.authorID, // الايدي الأصلي لصاحب البلاغ
        threadID: handleReply.threadID, // المجموعة الأصلية
        type: "user_received"
      });

      return api.sendMessage("✅ | تم تمرير ردك بنجاح للجروب/الخاص الخاص بالمستخدم.", threadID, messageID);
    });
  }

  // 2️⃣ حلقة تعقيب العضو (تصل مباشرة إلى حساب المطور في الخاص)
  if (handleReply.type === "user_received" && String(senderID) === handleReply.authorID) {

    const userName = await Users.getNameUser(senderID) || "مستخدم";

    const replyToDevMsg = 
      `●─────── ⌬ ───────●\n` +
      ` ⦿ ⟬ 💬 تَعْقِيبٌ جَدِيدٌ ⟭ ⦿\n` +
      `┝━━━━━━━━━━━━━━━\n` +
      `┇ 👤 الْمُرْسِلُ ↜ ${userName}\n` +
      `┇ 🆔 الآيْدِي ↜ ${senderID}\n` +
      `┝━━━━━━━━━━━━━━━\n` +
      `┇ 📩 الْمُحْتَوَى :\n` +
      `┇ ${body}\n` +
      `┝━━━━━━━━━━━━━━━\n` +
      `💡 رُدَّ عَلَى الرِّسَالَةِ لِلإِجَابَةِ ومواصلة التواصل اللانهائي\n` +
      `●─────── ⌬ ───────●`;

    api.sendMessage(replyToDevMsg, DEVELOPER_ID, (err, info) => {
      if (err) return;

      // إعادة شحن حلقة التواصل للمطور مجدداً ليتمكن من الرد للمرة الثانية والثالثة... إلخ
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        authorID: senderID,
        threadID: threadID, // المجموعة الأصلية للحفاظ على مسار المحادثة
        type: "dev_received"
      });
    });
  }
};
