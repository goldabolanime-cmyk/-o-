const axios = require("axios");

module.exports.config = {
  name: "اية",
  aliases: ["آية", "تخمين_الاية", "قرآن"],
  version: "3.5.0",
  hasPermssion: 0,
  credits: "Abdou / RIO BOT",
  description: "لعبة تخمين اسم السورة من خلال الآية مع نظام مكافآت وقبول الإجابات بدون تشكيل",
  commandCategory: "العاب",
  usages: "اية (تظهر آية عشوائية وتنتظر التخمين بالرد)",
  cooldowns: 5
};

// 🧼 دالة ذكية لتنظيف النصوص
function normalizeText(text) {
  if (!text) return "";
  return text
    .trim()
    .replace(/[\u064B-\u065F]/g, "") // إزالة التشكيل بالكامل
    .replace(/[أإآٱ]/g, "ا")         // تحويل الألف
    .replace(/ة/g, "ه")             // التاء المربوطة
    .replace(/ى/g, "ي")             // الألف المقصورة
    .replace(/-/g, " ")             // الشرطات
    .replace(/\s+/g, " ");          // المسافات الزائدة
}

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // 1. توليد رقم آية عشوائي
    const randomVerseNumber = Math.floor(Math.random() * 6236) + 1;

    // 2. جلب بيانات الآية من الـ API
    const response = await axios.get(`https://api.alquran.cloud/v1/ayah/${randomVerseNumber}/ar.uran`);

    if (!response.data || response.data.status !== "OK") {
      return api.sendMessage("❌ | عذراً، حدث خطأ أثناء الاتصال بخادم الآيات.", threadID, messageID);
    }

    const ayahData = response.data.data;
    const verseText = ayahData.text;
    const correctSurahName = ayahData.surah.name; 

    // 3. بناء الرسالة مع عرض المكافآت بالتفصيل
    const quranMsg = `●─────── ✾ ───────●\n` +
                      ` ⦿ ⟬ خَمِّنِ اسْمَ السُّورَةِ 📖 ⟭ ⦿\n` +
                      `┝━━━━━━━━━━━━━━━\n` +
                      `┇ 💬 الآيَة: ﴿ ${verseText} ﴾\n` +
                      `┝━━━━━━━━━━━━━━━\n` +
                      `┇ 💸 مُكَافَأَةُ اسْمِ السُّورَةِ: 120$\n` +
                      `┇ 🧱 مُكَافَأَةُ الْجُزْءِ: 120$\n` +
                      `┇ 🔢 مُكَافَأَةُ رَقْمِ الآيَةِ: 120$\n` +
                      `┇ 🏹 مُكَافَأَةُ التَّرْتِيبِ: 120$\n` +
                      `┝━━━━━━━━━━━━━━━\n` +
                      `┇ ⏳ قُمْ بِالرَّدِّ عَلَى هَذِهِ الرِّسَالَةِ بِاسْمِ السُّورَةِ!\n` +
                      `┇ ⏰ سَتُلْغَى اللَّعْبَةُ وَتُحْذَفُ بَعْدَ 70 ثَانِيَةٍ.\n` +
                      `●─────── ✾ ───────●`;

    const sentMsg = await api.sendMessage(quranMsg, threadID, (err, info) => {
      if (err) return;

      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        correctAnswer: correctSurahName,
        juz: ayahData.juz,
        number: ayahData.numberInSurah,
        order: ayahData.surah.number,
        threadID
      });
    }, messageID);

    // 4. مؤقت الحذف التلقائي بعد 70 ثانية
    setTimeout(async () => {
      try {
        await api.unsendMessage(sentMsg.messageID);
        const index = global.client.handleReply.findIndex(r => r.messageID === sentMsg.messageID);
        if (index !== -1) global.client.handleReply.splice(index, 1);
      } catch (e) {}
    }, 70000);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ | حدث خطأ أثناء بدء اللعبة، حاول مجدداً.", threadID, messageID);
  }
};

// ═══════════════════════════════════════
// 📥 معالج التحقق من الإجابات (handleReply)
// ═══════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply, Economy, Users }) {
  const { threadID, senderID, body, messageID } = event;

  // تنظيف المدخلات لمقارنة عادلة بدون تشكيل أو همزات
  let userAnswer = normalizeText(body);
  let officialAnswer = normalizeText(handleReply.correctAnswer);

  // إزالة كلمة "سورة" إذا كُتبت في البداية لتسهيل المطابقة
  userAnswer = userAnswer.replace(/^سوره\s+/i, "");
  officialAnswer = officialAnswer.replace(/^سوره\s+/i, "");

  // 🎯 فحص إذا نجح المستخدم في تخمين اسم السورة فقط
  if (userAnswer === officialAnswer) {
    const reward = 120; // مكافأة اسم السورة التي طلبها

    // إيداع المكافأة في رصيد الفائز
    await Economy.increase(reward, senderID, "money");
    const userName = await Users.getNameUser(senderID);

    // بناء رسالة الفوز الاحترافية وعرض بقية تفاصيل الآية ليتعلمها الأعضاء
    const winMsg = `●─────── ✾ ───────●\n` +
                   ` ⦿ ⟬ إِجَابَةٌ صَحِيحَةٌ 🎉 ⟭ ⦿\n` +
                   `┝━━━━━━━━━━━━━━━\n` +
                   `┇ 👤 الْفَائِزُ: ${userName}\n` +
                   `┇ 📑 السُّورَةُ الصَّحِيحَةُ: ${handleReply.correctAnswer}\n` +
                   `┝━━━━━━━━━━━━━━━\n` +
                   `┇ 💰 الْجَائِزَةُ الْمَمْنُوحَةُ: +${reward}$\n` +
                   `┇ 🧱 بَقِيَّةُ التَّفَاصِيلِ الْمَخْفِيَّةِ:\n` +
                   `┇ ├─ الجزء: [ ${handleReply.juz} ]\n` +
                   `┇ ├─ رقم الآية: [ ${handleReply.number} ]\n` +
                   `┇ └─ ترتيب السورة: [ ${handleReply.order} ]\n` +
                   `●─────── ✾ ───────●`;

    api.sendMessage(winMsg, threadID, messageID);

    // 🗑️ حذف رسالة السؤال السابقة فوراً لمنع التفاعل المكرر وتنظيف الشات
    try {
      await api.unsendMessage(handleReply.messageID);
    } catch (e) {}

    // مسح بيانات اللعبة الحالية من السجلات لإنهاء الجولة
    const index = global.client.handleReply.findIndex(r => r.messageID === handleReply.messageID);
    if (index !== -1) global.client.handleReply.splice(index, 1);

  } else {
    // إذا كانت الإجابة خاطئة تماماً، يتم إعلامه وترك السؤال متاحاً للباقين
    return api.sendMessage("❌ | إجابة خاطئة! حاول تخمين اسم السورة مرة أخرى.", threadID, messageID);
  }
};
