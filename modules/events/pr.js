module.exports.config = {
  name: "prefixEvent",
  eventType: ["log:unsubscribe", "log:subscribe", "log:thread-name", "message"],
  version: "1.1.0",
  credits: "Abdou / ريم بوت",
  description: "الاستجابة التلقائية لكلمة prefix بنص مباشر وبحروف صغيرة بدون إطار"
};

module.exports.run = async function({ api, event, Threads }) {
  const { threadID, messageID, body, type } = event;

  if (type !== "message" || !body) return;

  const messageText = body.trim().toLowerCase();

  if (messageText === "prefix") {
    try {
      // 1. التفاعل الفوري بسفينة فضائية 🛸
      if (api.setMessageReaction) {
        api.setMessageReaction("🛸", messageID, () => {}, true);
      }

      // 2. جلب البريفكس الخاص بالمجموعة أو الافتراضي
      let threadSettings = (await Threads.getData(threadID)).settings || {};
      let currentPrefix = threadSettings.PREFIX || global.config.PREFIX || "!";
      let systemPrefix = global.config.PREFIX || "!";

      // 3. بناء النص المباشر بحروف صغيرة تماماً وبدون إطار
      const msg = `🌐 system prefix: ${systemPrefix.toLowerCase()}\n` +
                  `🛸 your box chat prefix: ${currentPrefix.toLowerCase()}`;

      // 4. إرسال الرسالة للشات
      return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
      console.error("خطأ في حدث البريفكس:", error);
    }
  }
};
