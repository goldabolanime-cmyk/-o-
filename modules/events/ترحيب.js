// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "الترحيب",
  eventType: ["log:subscribe"], // حدث انضمام أعضاء
  version: "20.25.0",
  credits: "REM BOT",
  description: "الترحيب التلقائي بالأعضاء الجدد بزخرفة ريم"
};

// ══════════════════════════════════════════
// HANDLE EVENT
// ══════════════════════════════════════════
module.exports.handleEvent = async function({ api, event, Threads }) {
  const { threadID, logMessageType, logMessageData } = event;
  const header = "✦〘•ま 𝑹𝑬𝑴-𝑩𝑶𝑻 ま•〙✦";

  // التأكد أن نوع الحدث هو انضمام (subscribe)
  if (logMessageType === "log:subscribe") {

    // 1. التحقق إذا كان المنضم هو البوت نفسه
    if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
      api.changeNickname(`☬〘 ريم بوت 〙⌘『V20』☬`, threadID, api.getCurrentUserID());
      return api.sendMessage(`${header}\n\n✅ ┋ تم تفعيل ريم بوت V20 بنجاح!\n📝 ┋ اكتب [ .اوامر ] للبدء.`, threadID);
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

        const msg = 
          `${header}\n` +
          `✨ ┋ أهلاً بك يا بطل: ${name}\n` +
          `🏷️ ┋ نورتنا في: ${threadName}\n` +
          `━━━━━━━━━━━━━━━\n` +
          `💬 ┋ نتمنى لك قضاء وقت ممتع معنا\n` +
          `📜 ┋ يرجى الالتزام بقوانين المجموعة.\n` +
          `───── · · · ✦ · · · ─────\n` +
          `❄ ┋ أنت العضو رقم: [ ${memCount} ]\n` +
          `🚀 ريم بوت V20 يرحب بك!`;

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
