// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "غادري",
  version: "20.30.0",
  hasPermssion: 2, // للمطور فقط
  credits: "REM BOT",
  description: "خروج البوت من المجموعة مع رسالة وداع وتفاعل",
  commandCategory: "نظام المطور",
  usages: "",
  cooldowns: 5
};

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const botConfig = global.client.config || {};
  const OWNER_IDS = botConfig.ownerBot || [];

  // التحقق من المالك الأساسي (عبدو)
  if (!OWNER_IDS.includes(String(senderID))) {
    return api.sendMessage("👑 ┃ عذراً، هذا الأمر مخصص لمطور ريم فقط!", threadID, messageID);
  }

  // 1. التفاعل بالرمز التعبيري المطلوبه
  api.setMessageReaction("💫", messageID, () => {}, true);

  // 2. إرسال رسالة الوداع المزخرفة (بدون إطار)
  const farewellMsg = "ま 𝑹𝑬𝑴-𝑩𝑶𝑻 ま\n\nإلـى الـلقـاء جـميـعاً •-• 👋✨";

  return api.sendMessage(farewellMsg, threadID, async () => {
    // الانتظار قليلاً لضمان رؤية الرسالة ثم المغادرة
    setTimeout(async () => {
      try {
        await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
      } catch (e) {
        console.error("خطأ أثناء المغادرة:", e);
      }
    }, 2000);
  }, messageID);
};
