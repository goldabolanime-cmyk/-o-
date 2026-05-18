const fs = require("fs-extra");
const path = __dirname + "/cache/autoReactionStatus.json";

// التأكد من وجود ملف الحفظ وتعيين القيمة الافتراضية إذا لم يكن موجوداً
if (!fs.existsSync(path)) {
  fs.outputJsonSync(path, { status: true });
}

// الآيدي الخاص بك كمطور رسمي
const DEV_ID = "100090081489341";

module.exports.config = {
  name: "تفاعل",
  version: "2.6.0",
  hasPermssion: 0, 
  credits: "Abdou / RIO BOT",
  description: "يتفاعل تلقائياً مع الإيموجيات مع ميزة التشغيل والإيقاف الدائم للمطور الرسمي",
  commandCategory: "نظام",
  usages: "[تشغيل / قفل]",
  cooldowns: 2
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, body, type, senderID } = event;

  try {
    // قراءة الحالة الحالية مباشرة من الملف الدائم
    const configData = fs.readJsonSync(path);
    if (!configData.status) return;

    if (type !== "message" || !body || String(senderID) === String(api.getCurrentUserID())) return;

    // تعبير نمطي (RegEx) شامل لجميع أنواع الإيموجيات
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/gu;
    const match = body.match(emojiRegex);

    if (match && match.length > 0) {
      const emojiToReact = match[0];

      // التفاعل الفوري على الرسالة بشكل صامت تماماً
      if (api.setMessageReaction) {
        api.setMessageReaction(emojiToReact, messageID, () => {}, true);
      }
    }
  } catch (error) {
    // كتم الأخطاء تماماً
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const input = args[0];

  // التحقق من أن المستخدم هو المطور الرسمي فقط
  const isDev = String(senderID) === DEV_ID;

  // قراءة الحالة الحالية لعرضها
  const configData = fs.readJsonSync(path);

  if (!input) {
    const statusText = configData.status ? "مفعّلة ✅" : "معطّلة ❌";
    return api.sendMessage(`⚙️ عيني هذا الأمر يعمل تلقائياً بالخلفية.\n📊 الحالة الحالية: [ ${statusText} ]\n👑 التحكم متاح للمطور فقط عبر: تفاعل [تشغيل / قفل]`, threadID, messageID);
  }

  // إذا حاول شخص غير المطور استخدام خيارات التحكم
  if (!isDev) {
    return api.sendMessage("❌ عذراً، هذا الخيار مخصص للمطور الرسمي للبوت فقط عيني!", threadID, messageID);
  }

  // معالجة خيارات التشغيل والإيقاف للمطور وحفظها بالملف الدائم
  if (input === "تشغيل" || input === "on") {
    fs.outputJsonSync(path, { status: true });
    return api.sendMessage("✅ تم تشغيل ميزة التفاعل التلقائي مع الإيموجيات بنجاح عيني.", threadID, messageID);
  } 
  else if (input === "قفل" || input === "off") {
    fs.outputJsonSync(path, { status: false });
    return api.sendMessage("❌ تم إيقاف ميزة التفاعل التلقائي مع الإيموجيات بالخلفية بنجاح.", threadID, messageID);
  } 
  else {
    return api.sendMessage("⚠️ خيار غير صحيح! استخدم: تفاعل تشغيل أو تفاعل قفل", threadID, messageID);
  }
};
