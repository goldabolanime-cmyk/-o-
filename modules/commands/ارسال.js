module.exports.config = {
  name: "ارسال",
  aliases: ["dm", "رسالة"],
  version: "1.1.0",
  hasPermssion: 2,
  credits: "REM BOT",
  description: "إرسال رسالة خاصة لمستخدم معين عبر معرفه في الماسنجر",
  commandCategory: "مدير",
  usages: "[معرف المستخدم] [الرسالة]",
  cooldowns: 5
};

function parseError(err) {
  if (!err) return "خطأ غير معروف";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  if (err.error) return String(err.error);
  if (err.errorSummary) return err.errorSummary;
  try { return JSON.stringify(err); } catch (_) { return String(err); }
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

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
      api.sendMessage(
        { body: message },
        targetID,
        (err, info) => {
          if (err) {
            console.error("[ارسال ERROR] raw:", JSON.stringify(err));
            return reject(err);
          }
          resolve(info);
        }
      );
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
    const errText = parseError(err);
    console.error("[ارسال ERROR] parsed:", errText);
    return api.sendMessage(
      "✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n\n" +
      "❌ ┋ فشل إرسال الرسالة!\n" +
      "───── · · · ✦ · · · ─────\n" +
      `📛 ┋ السبب: ${errText}\n` +
      "───── · · · ✦ · · · ─────",
      threadID,
      messageID
    );
  }
};
