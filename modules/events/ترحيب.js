// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "الترحيب والمغادرة",
  eventType: ["log:subscribe", "log:unsubscribe"], // تفعيل أحداث الانضمام والمغادرة/الطرد
  version: "20.26.1",
  credits: "Abdou / REM BOT",
  description: "الترحيب التلقائي بالأعضاء الجدد (منفرد/جماعي) مع إشعارات المغادرة والطرد بزخرفة ريم بوت الاحترافية"
};

// ══════════════════════════════════════════
// HANDLE EVENT
// ══════════════════════════════════════════
module.exports.handleEvent = async function({ api, event, Threads }) {
  const { threadID, logMessageType, logMessageData } = event;

  // ──✨ الزخارف الموحدة الفخمة لـ ريم بوت ✨──
  const header = "╭────── ⟪ 𝑹𝑬𝑴-𝑩𝑶𝑻 ⟫ ──────╮";
  const footer = "╰────────────────────────╯";
  const divider = " ────────── ⌬ ──────────";

  // ==========================================
  // أولاً: معالجة حدث الانضمام (log:subscribe)
  // ==========================================
  if (logMessageType === "log:subscribe") {

    // 1. التحقق إذا كان المنضم هو البوت نفسه
    if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
      api.changeNickname(`【 𝑹𝑬𝑴-𝑩𝑶𝑻 】`, threadID, api.getCurrentUserID());

      const activeMsg = 
        `╭━━━━━━━━━ ❖ ━━━━━━━━━╮\n` +
        `   ♻️ 𝑹𝑬𝑴-𝑩𝑶𝑻 𝑨𝑪𝑻𝑰𝑽𝑬𝑶 ♻️\n` +
        `╰━━━━━━━━━ ❖ ━━━━━━━━━╯\n` +
        `  تم تفعيل النظام بنجاح داخل المجموعة ✅️\n\n` +
        ` 🛸 البادئة الحالية للمجموعة : [ ${global.config?.prefix || "."} ]\n` +
        `『 🎷 』 للإبلاغ عن مشكلة : .تقرير\n` +
        `『 🎊 』 لعرض الأوامر : .مساعدة\n\n` +
        ` ─── ✧ Developed By Abdou ✧ ───`;

      return api.sendMessage(activeMsg, threadID);
    }

    try {
      // 2. جلب معلومات المجموعة
      const info = await api.getThreadInfo(threadID);
      const threadName = info.threadName || "هذه المجموعة الجميلة";
      const memCount = info.participantIDs.length;

      const addedList = logMessageData.addedParticipants;

      // 🛑 [الحالة الأولى]: إذا انضم أكثر من شخص في نفس الوقت (ترحيب جماعي)
      if (addedList.length > 1) {
        let welcomeNames = "";
        let mentions = [];

        addedList.forEach((user, index) => {
          welcomeNames += ` 🌟 ${index + 1}. ${user.fullName}\n`;
          mentions.push({
            tag: user.fullName,
            id: user.userFbId
          });
        });

        const groupMsg = 
          `${header}\n` +
          `      🎉 تـرحـيـب جـمـاعـي 🎉\n` +
          `${divider}\n` +
          `『 ✨ 』 أهلاً بكم يا أبطال في مجموعتنا:\n${welcomeNames}\n` +
          `『 🏷️ 』 نورتوا في ↜ ${threadName}\n` +
          `${divider}\n` +
          `『 💬 』 نتمنى لكم قضاء وقت ممتع ومميز معنا\n` +
          `『 📜 』 يرجى الالتزام بالقوانين لتجنب الطرد\n` +
          `${divider}\n` +
          `📊 عـدد الأعـضـاء الآن ↜ [ ${memCount} ]\n` +
          `🤖 𝑹𝑬𝑴-𝑩𝑶𝑻 يرحب بالجميع!\n` +
          `${footer}`;

        return api.sendMessage({ body: groupMsg, mentions }, threadID);
      } 

      // 🟢 [الحالة الثانية]: إذا انضم شخص واحد فقط (ترحيب منفرد)
      else {
        const newUser = addedList[0];
        const userID = newUser.userFbId;
        const name = newUser.fullName;

        const singleMsg = 
          `${header}\n` +
          `       👋 عـضـو جـديـد 👋\n` +
          `${divider}\n` +
          `『 ✨ 』 أهلاً بك يا بطل ↜ ${name}\n` +
          `『 🏷️ 』 نورتنا في ↜ ${threadName}\n` +
          `${divider}\n` +
          `『 💬 』 نتمنى لك قضاء وقت ممتع معنا\n` +
          `『 📜 』 يرجى الالتزام بقوانين المجموعة\n` +
          `${divider}\n` +
          `『 ❄ 』 أنت العضو رقم ↜ [ ${memCount} ]\n` +
          `🤖 𝑹𝑬𝑴-𝑩𝑶𝑻 يرحب بك!\n` +
          `${footer}`;

        return api.sendMessage({
          body: singleMsg,
          mentions: [{ tag: name, id: userID }]
        }, threadID);
      }

    } catch (e) {
      console.error("[WELCOME ERROR]", e.message);
    }
  }

  // ==========================================
  // ثانياً: معالجة حدث المغادرة أو الطرد (log:unsubscribe)
  // ==========================================
  if (logMessageType === "log:unsubscribe") {
    const leftUserID = logMessageData.leftParticipantFbId;

    // إذا كان البوت هو من غادر أو طُرد، لا يفعل شيئاً
    if (leftUserID == api.getCurrentUserID()) return;

    try {
      // جلب معلومات المستخدم الذي غادر عبر نظام الكاش أو السيرفر
      let leftUserName = "عضو من المجموعة";
      try {
        const userInfo = await api.getUserInfo(leftUserID);
        if (userInfo && userInfo[leftUserID]) leftUserName = userInfo[leftUserID].name;
      } catch (err) {
        // إذا فشل جلب الاسم نكتفي بالاسم الافتراضي لمنع توقف السكريبت
      }

      const info = await api.getThreadInfo(threadID);
      const memCount = info.participantIDs.length;

      // 🛠️ التحقق: هل الشخص غادر بنفسه (left) أم تم طرده (removed)؟
      // إذا كان الآيدي الخاص بالشخص الذي قام بالفعل يساوي آيدي الشخص المغادر، فهو خرج بنفسه
      const isSelfLeave = logMessageData.authorFbId == leftUserID;

      let leaveMsg = "";

      if (isSelfLeave) {
        // 🚪 [رسالة المغادرة الاختيارية]
        leaveMsg = 
          `${header}\n` +
          `       🚪 غـادَر الـمـجـمـوعـة 🚪\n` +
          `${divider}\n` +
          `『 👤 』 الإسم ↜ ${leftUserName}\n` +
          `『 🆔 』 الآيدي ↜ ${leftUserID}\n` +
          `${divider}\n` +
          `『 💨 』 لقد غادرنا برغبته.. وداعاً له \n` +
          `『 📉 』 الأعضاء المتبقين ↜ [ ${memCount} ]\n` +
          `${footer}`;
      } else {
        // 🚷 [رسالة الطرد والإزالة]
        let authorName = "مسؤول";
        try {
          const authorInfo = await api.getUserInfo(logMessageData.authorFbId);
          if (authorInfo && authorInfo[logMessageData.authorFbId]) authorName = authorInfo[logMessageData.authorFbId].name;
        } catch(e){}

        leaveMsg = 
          `${header}\n` +
          `        🚷 تـمـت الإزالـة 🚷\n` +
          `${divider}\n` +
          `『 👤 』 المطرود ↜ ${leftUserName}\n` +
          `『 👮 』 الفاعل ↜ ${authorName}\n` +
          `${divider}\n` +
          `『 🔨 』 طُرد خارجاً.. القانون فوق الجميع \n` +
          `『 📉 』 الأعضاء المتبقين ↜ [ ${memCount} ]\n` +
          `${footer}`;
      }

      // إرسال رسالة المغادرة أو الطرد مع المنشن
      return api.sendMessage({
        body: leaveMsg,
        mentions: [{
          tag: leftUserName,
          id: leftUserID
        }]
      }, threadID);

    } catch (e) {
      console.error("[LEAVE/KICK EVENT ERROR]", e.message);
    }
  }
};
