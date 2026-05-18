const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const dataPath = path.join(__dirname, "cache", "replies.json");

module.exports.config = {
  name: "ردود",
  version: "2.1.0",
  hasPermssion: 0, 
  credits: "عبدو",
  description: "نظام الردود التلقائية المطور للجمل الكاملة والصور مع تثبيت معرف المطور",
  commandCategory: "النواميس",
  usages: "[اضافة / ازالة / قائمة]",
  cooldowns: 3,
  strictPrefix: false,
  aliases: ["رد"]
};

// تهيئة ملف الحفظ عند إقلاع السكربت
if (!fs.existsSync(dataPath)) {
  fs.outputJsonSync(dataPath, {});
}

module.exports.handleEvent = async ({ api, event }) => {
  const { threadID, messageID, body } = event;
  if (!body) return;

  try {
    const replies = fs.readJsonSync(dataPath);
    const trigger = body.trim().toLowerCase();

    // التحقق من وجود رد مطابق تماماً للجملة أو الكلمة المرسلة
    if (replies[trigger]) {
      const replyData = replies[trigger];

      if (replyData.type === "image") {
        const imgPath = path.join(__dirname, "cache", `reply_${Date.now()}.png`);

        const response = await axios({
          method: "GET",
          url: `https://images.weserv.nl/?url=${encodeURIComponent(replyData.url)}`,
          responseType: "stream"
        });

        const writer = fs.createWriteStream(imgPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        return api.sendMessage({
          body: replyData.text || "",
          attachment: fs.createReadStream(imgPath)
        }, threadID, () => {
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }, messageID);

      } else {
        return api.sendMessage(replyData.text, threadID, messageID);
      }
    }
  } catch (error) {
    console.error("[REPLY EVENT ERROR]", error.message);
  }
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, messageReply } = event;

  // 🛡️ جلب الأدمينات من السيرفر مع إضافة الآيدي الخاص بك كأدمن دائم واحتياطي
  let admins = ["100090081489341"]; 
  if (global.config && global.config.ADMINBOT) {
    admins = admins.concat(global.config.ADMINBOT);
  } else if (global.configBot && global.configBot.ADMINBOT) {
    admins = admins.concat(global.configBot.ADMINBOT);
  } else if (global.ADMINBOT) {
    admins = admins.concat(global.ADMINBOT);
  }

  // التحقق الفعلي من الصلاحية (أنت مسموح لك دائماً الآن)
  const isDeveloper = admins.includes(senderID.toString());

  if (!args[0]) {
    return api.sendMessage(
      `●─────── ⚙️ ───────●\n` +
      `   ⦿ ⟬ نِظَامُ الـرُّدُودِ التِّلْقَائِيَّةِ ⟭ ⦿\n` +
      `⊱ ────────────── ⊰\n` +
      ` ⟣ 📝 [ رد اضافة ] جملة كاملة / الرد هنا\n` +
      ` ⟣ 🖼️ [ رد اضافة ] جملة كاملة (مع الرد على صورة)\n` +
      ` ⟣ ❌ [ رد ازالة ] الجملة أو الكلمة\n` +
      ` ⟣ 📋 [ رد قائمة ] لعرض الردود المتوفرة\n` +
      `●─────── ⚙️ ───────●`, 
      threadID, messageID
    );
  }

  const action = args[0].trim();
  let replies = fs.readJsonSync(dataPath);

  // 1. أمر إضافة رد (مطور فقط)
  if (action === "اضافة" || action === "إضافة") {
    if (!isDeveloper) return api.sendMessage("⚠️ | عذراً، صلاحية إضافة الردود خاصة بمطور السيرفر فقط!", threadID, messageID);

    // دمج كافة الكلمات المدخلة بعد أمر "اضافة"
    const content = args.slice(1).join(" ");
    if (!content) return api.sendMessage("⚠️ | يرجى كتابة الجملة المراد إضافتها!", threadID, messageID);

    // أولاً: التحقق إذا كان الرد عبارة عن صورة (عبر عمل Reply على صورة)
    if (messageReply && messageReply.attachments && messageReply.attachments[0]?.type === "photo") {
      const keyword = content.trim().toLowerCase();
      const imageUrl = messageReply.attachments[0].url;

      replies[keyword] = {
        type: "image",
        url: imageUrl,
        text: ""
      };

      fs.writeJsonSync(dataPath, replies, { spaces: 2 });
      return api.sendMessage(`✅ | تَمَّتْ إِضَافَةُ رَدِّ الصُّورَةِ بِنَجَاحٍ لِلْجُمْلَةِ: [ ${keyword} ] 🖼️`, threadID, messageID);
    }

    // ثانياً: الردود النصية (دعم الجمل الكاملة قبل وبعد الفاصل المائل)
    if (!content.includes("/")) {
      return api.sendMessage("⚠️ | يرجى استخدام الفاصل المائل [ / ] للفصل بين الجملة والرد العادي الأصلي، مثال:\nرد اضافة السلام عليكم / وعليكم السلام ورحمة الله", threadID, messageID);
    }

    const parts = content.split("/");
    const keyword = parts[0].trim().toLowerCase();
    const responseText = parts.slice(1).join("/").trim();

    if (!keyword || !responseText) return api.sendMessage("⚠️ | صيغة الجملة غير مكتملة! تأكد من كتابة جملة التحفيز وجملة الرد الفعلي.", threadID, messageID);

    replies[keyword] = {
      type: "text",
      text: responseText
    };

    fs.writeJsonSync(dataPath, replies, { spaces: 2 });
    return api.sendMessage(`✅ | تَمَّتْ إِضَافَةُ الرَّدِّ النَّصِّيِّ لِلْجُمْلَةِ: [ ${keyword} ] 📝`, threadID, messageID);
  }

  // 2. أمر إزالة الرد (مطور فقط)
  if (action === "ازالة" || action === "إزالة") {
    if (!isDeveloper) return api.sendMessage("⚠️ | عذراً، صلاحية حذف الردود مخصصة للمطور فقط!", threadID, messageID);

    const keyword = args.slice(1).join(" ").trim().toLowerCase();
    if (!keyword) return api.sendMessage("⚠️ | يرجى تحديد الجملة أو الكلمة المراد إزالة ردها التلقائي!", threadID, messageID);

    if (!replies[keyword]) return api.sendMessage("🔍 | لم يتم العثور على أي رد مسجل لهذه الجملة في النظام.", threadID, messageID);

    delete replies[keyword];
    fs.writeJsonSync(dataPath, replies, { spaces: 2 });
    return api.sendMessage(`🗑️ | تَمَّ حَذْفُ الـرَّدِّ التِّلْقَائِيِّ لِلْجُمْلَةِ [ ${keyword} ] بِنَجَاحٍ.`, threadID, messageID);
  }

  // 3. أمر عرض قائمة الردود (متاح للجميع)
  if (action === "قائمة" || action === "قائمه") {
    const keys = Object.keys(replies);
    if (keys.length === 0) return api.sendMessage("📂 | لا توجد أي ردود تلقائية مسجلة في قاعدة البيانات حالياً.", threadID, messageID);

    let msgList = `●─────── 📋 ───────●\n   ⦿ ⟬ قَائِمَةُ الـرُّدُودِ الْمُسَجَّلَةِ ⟭ ⦿\n⊱ ────────────── ⊰\n`;

    keys.forEach((key, index) => {
      const typeEmoji = replies[key].type === "image" ? "🖼️ [صورة]" : "📝 [نص]";
      msgList += `  ${index + 1} ⟣ ⟬ ${key} ⟭ ↤ ${typeEmoji}\n`;
    });

    msgList += `●─────── 📋 ───────●`;
    return api.sendMessage(msgList, threadID, messageID);
  }

  return api.sendMessage("⚠️ | أمر غير معروف، استخدم [ رد ] فقط لعرض دليل الاستخدام السليم.", threadID, messageID);
};
