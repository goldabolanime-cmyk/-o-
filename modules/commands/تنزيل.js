const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "تنزيل",
  version: "20.90.0", // متوافق مع بنية V20
  hasPermssion: 0,
  credits: "R3D Edit + تعديل REM BOT",
  description: "تحميل تلقائي لجميع الفيديوهات بمجرد إرسال الرابط في الشات ⚡",
  commandCategory: "نظام",
  usages: "فقط ارسل الرابط مباشرة في المجموعات",
  cooldowns: 5
};

const header = "✦〘•ま 𝑹𝑬𝑴-𝑩𝑶𝑻 ま•〙✦";

// ══════════════════════════════════════════
// RUN (عند كتابة .تنزيل)
// ══════════════════════════════════════════
module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  return api.sendMessage(
    `${header}\n` +
    "📥 ┋ نـظـام الـتـحـمـيـل الـتـلـقـائـي المطور\n" +
    "───── · · · ✦ · · · ─────\n" +
    "📝 ┋ كيفية الاستخدام:\n" +
    "• فقط أرسل أي رابط فيديو داخل الشات مباشرة.\n" +
    "• سيقوم ريم بوت بالاستجابة والتحميل تلقائياً.\n\n" +
    "🌐 ┋ الروابط المدعومة:\n" +
    "• Facebook, YouTube, TikTok\n" +
    "• Instagram, Twitter (X) والمزيد...\n" +
    "───── · · · ✦ · · · ─────\n" +
    "🚀 أرسل رابطاً الآن لتجربة السرعة!",
    threadID,
    messageID
  );
};

// ══════════════════════════════════════════
// HANDLE EVENT (الاستماع التلقائي للروابط)
// ══════════════════════════════════════════
module.exports.handleEvent = async function ({ api, event }) {
  const { body, threadID, messageID } = event;
  if (!body) return;

  // فحص النصوص لاستخراج أول رابط يحتوي على http أو https
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const foundURLs = body.match(urlRegex);
  if (!foundURLs) return;

  const videoUrl = foundURLs[0];

  try {
    // التفاعل برمز الانتظار الموحد لريم بوت
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // استدعاء نظام API للتحميل الشامل
    const apiResponse = await axios.get(
      `https://noobs-api.top/dipto/alldl?url=${encodeURIComponent(videoUrl)}`
    );
    const videoData = apiResponse.data;

    if (!videoData || !videoData.result) {
      return api.setMessageReaction("❌", messageID, () => {}, true);
    }

    // تجهيز مسار الكاش داخل مجلد البوت الرئيسي
    const cacheDir = path.join(process.cwd(), "modules", "commands", "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const videoPath = path.join(cacheDir, `vdl_${Date.now()}.mp4`);

    // سحب تيار الفيديو (Stream) من السيرفر السحابي
    const videoResponse = await axios({
      method: "GET",
      url: videoData.result,
      responseType: "stream"
    });

    const writer = fs.createWriteStream(videoPath);
    videoResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const fileSize = fs.statSync(videoPath).size;
    const maxSize = 87 * 1024 * 1024; // الحد الأقصى 87 ميغابايت لمنع توقف منصة ماسنجر

    if (fileSize > maxSize) {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return api.sendMessage(`${header}\n\n❌ ┋ عذراً، حجم الفيديو كبير جداً ويتخطى حاجز الـ 87MB!`, threadID, messageID);
    }

    // صياغة رسالة النجاح بزخرفة V20 الرسمية
    let msg = `${header}\n` +
              `✅ ┋ تـم الـتـحـمـيـل بـنـجـاح !\n` +
              `───── · · · ✦ · · · ─────\n`;
    if (videoData.title) msg += `📹 ┋ العنوان: ${videoData.title}\n`;
    msg += `📊 ┋ الحجم: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`;
    msg += `🚀 ┋ المستضيف: السيرفر المركزي لريم`;

    // تغيير التفاعل لعلامة النجاح وإرسال المرفق
    api.setMessageReaction("✅", messageID, () => {}, true);

    return api.sendMessage(
      {
        body: msg,
        attachment: fs.createReadStream(videoPath)
      },
      threadID,
      () => {
        // تنظيف وحذف ملف الفيديو من كاش السيرفر فور إرساله بنجاح للمستخدم
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      },
      messageID
    );

  } catch (error) {
    console.error("[AUTO DOWNLOAD ERROR]", error.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};
