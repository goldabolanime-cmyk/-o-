const fs = require("fs-extra");

// دالة لتحويل الأرقام الشرقية (١٢٣٤...) إلى أرقام عالمية (1234...) لضمان عمل الحسابات
function parseArabicNumbers(str) {
  const arabicNorm = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return str.replace(/[٠-٩]/g, (w) => arabicNorm.indexOf(w));
}

module.exports.config = {
  name: "تنظيف",
  aliases: ["", "", "clear", "purge"],
  version: "3.0.0",
  hasPermssion: 0, 
  credits: "Abdou / RIO BOT",
  description: "إلغاء إرسال (Unsend) عدد معين من رسائل البوت لدى الجميع ليظهر 'لقد ألغيت إرسال رسالة' 💫",
  commandCategory: "المطور",
  usages: "[عدد الرسائل]",
  cooldowns: 1
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // 1. التحقق من صلاحية المطور اسناداً لملف الإعدادات
  const botConfig = global.config || global.client?.config || {};
  const OWNER_IDS = (botConfig.ownerBot || []).map(String);
  const isDev = OWNER_IDS.includes(String(senderID));

  if (!isDev) {
    return api.setMessageReaction("❌", messageID, () => {}, true);
  }

  // 2. التحقق من المدخلات وتحويل الأرقام
  if (!args[0]) return; 

  let input = parseArabicNumbers(args[0].trim());
  let count = parseInt(input);

  if (isNaN(count) || count <= 0) return;
  if (count > 50) count = 50;

  try {
    const botID = String(api.getCurrentUserID());

    // 3. جلب تاريخ الشات (آخر 100 رسالة)
    const history = await api.getThreadHistory(threadID, 100);
    if (!history || !Array.isArray(history)) return;

    // تصفية رسائل البوت فقط (من الأحدث للأقدم)
    const botMessages = history.filter(msg => String(msg.senderID) === botID);

    if (botMessages.length === 0) {
      return api.setMessageReaction("🤷‍♂️", messageID, () => {}, true);
    }

    const messagesToDelete = botMessages.slice(0, count);

    // 4. السحر هنا: استخدام ميثود الحذف الصافي والمضمون لـ ws3-fca مع معالجة الـ Promise بدون الـ Callback التقليدي المسبب للمشكلة
    for (const msg of messagesToDelete) {
      try {
        // الانتشار الفوري لطلب الـ Unsend لضمان الحذف لدى الجميع وظهور عبارة الإلغاء
        await api.unsendMessage(msg.messageID);
      } catch (err) {
        // خطة احتياطية فورية في حال تعنت خوادم فيسبوك مع ميثود النواة
        if (api.deleteMessage) {
          await api.deleteMessage(msg.messageID, true);
        }
      }
    }

    // 5. تفاعل بـ 💫 على رسالة الأمر الخاص بك لتأكيد النجاح
    await api.setMessageReaction("💫", messageID, () => {}, true);

    // 6. إلغاء إرسال رسالة الأمر نفسها لتنظيف الشات كلياً
    setTimeout(async () => {
      try {
        await api.unsendMessage(messageID);
      } catch (e) {}
    }, 500);

  } catch (error) {
    console.error("[PURGE COMMAND ERROR]", error);
    return api.setMessageReaction("⚠️", messageID, () => {}, true);
  }
};
