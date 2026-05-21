const { translate } = require("@vitalets/google-translate-api");

module.exports.config = {
  name: "ترجمة",
  aliases: ["translate", "ترجم"],
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Abdou / RIO BOT",
  description: "ترجمة ذكية تلقائية (عربي/إنجليزي) تدعم الرد وبدون زخارف لسهولة النسخ",
  commandCategory: "أدوات",
  usages: "[النص] أو بالرد على رسالة",
  cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, type, messageReply } = event;

  let textToTranslate = "";

  // 1. التحقق إذا كان المستخدم يستعمل ميزة الرد (Reply)
  if (type === "message_reply") {
    textToTranslate = messageReply.body;
  } else {
    textToTranslate = args.join(" ");
  }

  // إذا لم يكتب نصاً ولم يقم بالرد
  if (!textToTranslate) {
    return api.sendMessage("⚠️ | يرجى كتابة نص للترجمة أو الرد على رسالة لشخص ما!", threadID, messageID);
  }

  try {
    // 2. التفاعل الفوري مع رسالة المستخدم بإيموجي الكرة الأرضية
    api.setMessageReaction("🌐", messageID, () => {}, true);

    // 3. فحص لغة النص المكتوب لتحديد الوجهة تلقائياً
    // فحص إذا كان النص يحتوي على حروف عربية
    const isArabic = /[\u0600-\u06FF]/.test(textToTranslate);
    const targetLang = isArabic ? "en" : "ar";

    // 4. طلب الترجمة من الخادم
    const res = await translate(textToTranslate, { to: targetLang });

    // 5. إرسال النتيجة مصلحة ومباشرة بدون أي إطارات أو زخرفة لسهولة النسخ
    return api.sendMessage(res.text, threadID, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ | حدث خطأ أثناء الاتصال بسيرفر الترجمة، حاول مجدداً.", threadID, messageID);
  }
};
