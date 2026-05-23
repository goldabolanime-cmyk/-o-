const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ارسال",
  aliases: ["dm", "رسالة"],
  version: "1.2.0",
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

function getErrorHint(err) {
  const raw = parseError(err);
  if (raw.includes("1545116") || raw.includes("1545096") || (err && err.error == 1545116)) {
    return (
      "⚠️ فيسبوك يمنع البوت من فتح محادثة جديدة مع هذا الشخص.\n" +
      "───── · · · ✦ · · · ─────\n" +
      "💡 الحل: اطلب من الشخص أن يرسل للبوت رسالة خاصة أولاً\n" +
      "   (يفتح الشات مع حساب البوت مرة واحدة فقط)\n" +
      "   ثم يعمل الأمر بشكل طبيعي."
    );
  }
  return `📛 ┋ السبب: ${raw}`;
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
      "───── · · · ✦ · · · ─────\n\n" +
      "⚠️ ملاحظة: يجب على الشخص أن يكون قد أرسل\n" +
      "   رسالة خاصة للبوت مرة واحدة على الأقل.",
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

  // محاولة إيجاد thread ID الخاص من ملف المستخدمين أو الكاش
  let resolvedThreadID = targetID;
  try {
    const usersPath = path.join(__dirname, "..", "..", "database", "users.json");
    if (fs.existsSync(usersPath)) {
      const users = fs.readJsonSync(usersPath);
      const userEntry = users[targetID];
      if (userEntry && userEntry.threadID) {
        resolvedThreadID = userEntry.threadID;
      }
    }
  } catch (_) {}

  let lastErr = null;

  // محاولة أولى: بالـ threadID المحفوظ أو userID مباشرة
  try {
    await new Promise((resolve, reject) => {
      api.sendMessage(
        { body: message },
        resolvedThreadID,
        (err, info) => {
          if (err) return reject(err);
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
  } catch (err1) {
    lastErr = err1;
    console.error("[ارسال] المحاولة الأولى فشلت:", parseError(err1));
  }

  // محاولة ثانية: إذا كان resolvedThreadID مختلفاً جرب الـ userID مباشرة
  if (resolvedThreadID !== targetID) {
    try {
      await new Promise((resolve, reject) => {
        api.sendMessage(
          { body: message },
          targetID,
          (err, info) => {
            if (err) return reject(err);
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
    } catch (err2) {
      lastErr = err2;
      console.error("[ارسال] المحاولة الثانية فشلت:", parseError(err2));
    }
  }

  // كل المحاولات فشلت
  const hint = getErrorHint(lastErr);
  console.error("[ارسال] كل المحاولات فشلت:", parseError(lastErr));
  return api.sendMessage(
    "✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n\n" +
    "❌ ┋ فشل إرسال الرسالة!\n" +
    "───── · · · ✦ · · · ─────\n" +
    hint + "\n" +
    "───── · · · ✦ · · · ─────",
    threadID,
    messageID
  );
};
