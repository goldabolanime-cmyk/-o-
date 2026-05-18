// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "الترحيب",
  eventType: ["log:subscribe"], // حدث انضمام أعضاء
  version: "20.26.0",
  credits: "Abdou / REM BOT",
  description: "الترحيب التلقائي بالأعضاء الجدد وزخرفة ريم بوت الاحترافية"
};

// ══════════════════════════════════════════
// HANDLE EVENT
// ══════════════════════════════════════════
module.exports.handleEvent = async function({ api, event, Threads }) {
  const { threadID, logMessageType, logMessageData } = event;

  // الهيدر الموحد لرسائل الترحيب بالأعضاء باسم ريم بوت
  const header = "●─── ⟪ 𝑹𝑬𝑴-𝑩𝑶𝑻 ⟫ ───●";
  const divider = "●─────── ⌬ ───────●";

  // التأكد أن نوع الحدث هو انضمام (subscribe)
  if (logMessageType === "log:subscribe") {

    // 1. التحقق إذا كان المنضم هو البوت نفسه
    if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
      // تعيين الكنية المطلوبة تماماً باسم ريم بوت بنفس الستايل
      api.changeNickname(`【 𝑹𝑬𝑴-𝑩𝑶𝑻 】`, threadID, api.getCurrentUserID());

      // رسالة تفعيل البوت داخل إطار وزخرفة لائقة باسم ريم بوت
      const activeMsg = 
        `╭━━━━━ ❖ ━━━━━╮\n` +
        `  ♻️ 𝑹𝑬𝑴-𝑩𝑶𝑻 ♻️\n` +
        `╰━━━━━ ❖ ━━━━━╯\n` +
        ` تم التفعيل بنجاح ✅️\n\n` +
        `『 🎷 』 للابلاغ عن مشكلة : .تقرير\n` +
        `『 🎊 』 للمساعدة : .مساعدة\n\n` +
        `─── ✧ By abdo ✧ ───`;

      return api.sendMessage(activeMsg, threadID);
    }

    try {
      // 2. جلب معلومات المجموعة (الاسم وعدد الأعضاء)
      const info = await api.getThreadInfo(threadID);
      const threadName = info.threadName || "هذه المجموعة الجميلة";
      const memCount = info.participantIDs.length;

      // 3. معالجة الترحيب لكل عضو منضم (في حال تم إضافة أكثر من شخص معاً)
      for (let newUser of logMessageData.addedParticipants) {
        const userID = newUser.userFbId;
        const name = newUser.fullName;

        // رسالة الترحيب بالأعضاء الجدد داخل إطار متناسق مع ريم بوت
        const msg = 
          `${header}\n` +
          `『 ✨ 』 أهلاً بك يا بطل ↜ ${name}\n` +
          `『 🏷️ 』 نورتنا في ↜ ${threadName}\n` +
          `${divider}\n` +
          `『 💬 』 نتمنى لك قضاء وقت ممتع معنا\n` +
          `『 📜 』 يرجى الالتزام بقوانين المجموعة\n` +
          `${divider}\n` +
          `『 ❄ 』 أنت العضو رقم ↜ [ ${memCount} ]\n` +
          `🤖 𝑹𝑬𝑴-𝑩𝑶𝑻 يرحب بك!`;

        // 4. إرسال رسالة الترحيب مع المنشن (Tag)
        api.sendMessage({
          body: msg,
          mentions: [{
            tag: name,
            id: userID
          }]
        }, threadID);
      }
    } catch (e) {
      console.error("[WELCOME ERROR]", e.message);
    }
  }
};
