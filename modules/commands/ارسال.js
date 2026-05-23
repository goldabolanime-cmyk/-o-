module.exports.config = {
  name: "ارسال",
  aliases: ["dm", "رسالة"],
  version: "1.0.0",
  hasPermssion: 2,
  credits: "REM BOT",
  description: "إرسال رسالة خاصة لمستخدم معين عبر معرفه",
  commandCategory: "مدير",
  usages: "[معرف المستخدم] [الرسالة]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (args.length < 2) {
    return api.sendMessage(
      "✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n\n" +
      "📤 ┋ أمر الإرسال الخاص\n" +
      "───── · · · ✦ · · · ─────\n" +
      "📝 ┋ الاستخدام:\n" +
      "  .ارسال [معرف] [الرسالة]\n\n" +
      "💡 ┋ مثال:\n" +
      "  .ارسال 100090081489341 أهلاً كيف حالك؟\n" +
      "───── · · · ✦ · · · ─────",
      threadID,
      messageID
    );
  }

  const targetID = args[0].trim();
  const message = args.slice(1).join(" ").trim();

  if (!message) {
    return api.sendMessage("❌ ┋ يجب كتابة نص الرسالة بعد المعرف.", threadID, messageID);
  }

  if (!/^\d+$/.test(targetID)) {
    return api.sendMessage("❌ ┋ المعرف غير صحيح، يجب أن يكون أرقاماً فقط.", threadID, messageID);
  }

  try {
    await new Promise((resolve, reject) => {
      api.sendMessage(message, targetID, (err, info) => {
        if (err) return reject(err);
        resolve(info);
      });
    });

    return api.sendMessage(
      "✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n\n" +
      "✅ ┋ تم إرسال الرسالة بنجاح!\n" +
      "───── · · · ✦ · · · ─────\n" +
      `📤 ┋ إلى: ${targetID}\n` +
      `💬 ┋ الرسالة: ${message}\n` +
      "───── · · · ✦ · · · ─────",
      threadID,
      messageID
    );
  } catch (err) {
    console.error("[ارسال ERROR]", err.message);
    return api.sendMessage(
      `❌ ┋ فشل إرسال الرسالة!\n` +
      `📛 ┋ الخطأ: ${err.message}`,
      threadID,
      messageID
    );
  }
};
