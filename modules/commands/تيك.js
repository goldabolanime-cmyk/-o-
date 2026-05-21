const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "تيك",
  aliases: ["tik", "tiktok", "تيكتوك"],
  version: "1.0.0",
  hasPermssion: 0, // متاح لجميع الأعضاء
  credits: "Abdou / RIO BOT",
  description: "بحث وتحميل فيديوهات تيك توك مع عرض الصور المصغرة",
  commandCategory: "الادوات",
  usages: "[كلمة البحث]",
  cooldowns: 15
};

const API = "https://lyric-search-neon.vercel.app/kshitiz?keyword=";
const CACHE_DIR = path.join(__dirname, "cache");

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ");

  // 1. التحقق من إدخال كلمة البحث
  if (!query) {
    return api.sendMessage(
      `●─────── ✾ ───────●\n` +
      ` ⦿ ⟬ تِيكْ تُوكْ 🎵 ⟭ ⦿\n` +
      `┝━━━━━━━━━━━━━━━\n` +
      `┇ 𓋰 الاستخدام: تيك [بحث]\n` +
      `┇ 𓋰 أمثلة:\n` +
      `┇   تيك قطط مضحكة\n` +
      `┇   تيك رقص\n` +
      `┇   تيك طبخ سهل\n` +
      `●─────── ✾ ───────●`,
      threadID, messageID
    );
  }

  api.setMessageReaction("🔍", messageID, () => {}, true);

  try {
    // 2. جلب نتائج البحث من الـ API
    const res = await axios.get(API + encodeURIComponent(query), { timeout: 20000 });
    const list = res.data;

    if (!list || !list.length) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        `●─────── ✾ ───────●\n` +
        ` ⦿ ⟬ لا نَتَائِجَ ❌ ⟭ ⦿\n` +
        `┝━━━━━━━━━━━━━━━\n` +
        `┇ 🔍 لَمْ يُعْثَرْ عَلَى نَتَائِجَ لِـ "${query}"\n` +
        `●─────── ✾ ───────●`,
        threadID, messageID
      );
    }

    // أخذ أول 6 نتائج فقط
    const videos = list.slice(0, 6);
    const attachments = [];

    // تحميل الصور المصغرة للفيديوهات لعرضها كـ حزمة ألبومات في الرسالة
    for (const v of videos) {
      const thumbUrl = v.thumbnail || v.cover || v.dynamic_cover;
      if (thumbUrl) {
        try {
          const img = await axios.get(thumbUrl, { responseType: "stream", timeout: 8000 });
          attachments.push(img.data);
        } catch (e) {}
      }
    }

    // 3. بناء نص قائمة الاختيارات بزخرفة ريو بوت
    let msg = `●─────── ✾ ───────●\n`;
    msg += ` ⦿ ⟬ نَتَائِجُ تِيكْ تُوكْ 🎵 ⟭ ⦿\n`;
    msg += `┝━━━━━━━━━━━━━━━\n`;
    msg += `┇ 🔍 البَحْث: ${query}\n`;
    msg += `┝━━━━━━━━━━━━━━━\n`;

    videos.forEach((v, i) => {
      const title = v.title || v.desc || "بِدُونِ عُنْوَانٍ";
      const author = v.author?.nickname || v.author?.unique_id || v.author || "";
      msg += `┇ ${i + 1}. ${title.substring(0, 60)}\n`;
      if (author) msg += `┇    👤 ${author}\n`;
    });

    msg += `┝━━━━━━━━━━━━━━━\n`;
    msg += `┇ 👇 رُدَّ بِرَقْمٍ (1-${videos.length}) لِلتَّحْمِيلِ\n`;
    msg += `●─────── ✾ ───────●`;

    const sendPayload = { body: msg };
    if (attachments.length > 0) sendPayload.attachment = attachments;

    // 4. إرسال الرسالة وحفظها في الـ handleReply لانتظار اختيار الرقم
    api.sendMessage(sendPayload, threadID, (err, info) => {
      if (!err && info) {
        global.client.handleReply.push({
          name: module.exports.config.name,
          author: senderID,
          results: videos,
          messageID: info.messageID
        });
        api.setMessageReaction("✅", messageID, () => {}, true);
      }
    }, messageID);

  } catch (error) {
    console.error("[Tik Search Error]:", error);
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      `●─────── ✾ ───────●\n` +
      ` ⦿ ⟬ خَطَأٌ ❌ ⟭ ⦿\n` +
      `┝━━━━━━━━━━━━━━━\n` +
      `┇ 🛑 فَشَلَ الِاتِّصَالُ بِالخَادِمِ\n` +
      `●─────── ✾ ───────●`,
      threadID, messageID
    );
  }
};

// ═══════════════════════════════════════
// 📥 معالج التحميل عند رد العضو برقم الفيديو
// ═══════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, body, senderID, messageID } = event;

  // التحقق من أن الشخص الذي يقوم بالرد هو صاحب الأمر منعاً للتداخل
  if (senderID !== handleReply.author) return;

  const index = parseInt(body.trim());
  if (isNaN(index) || index < 1 || index > handleReply.results.length) {
    return api.sendMessage(
      `●─────── ✾ ───────●\n` +
      ` ⦿ ⟬ تَنْبِيهٌ ⚠️ ⟭ ⦿\n` +
      `┝━━━━━━━━━━━━━━━\n` +
      `┇ 🔢 اخْتَرْ رَقْماً صَحِيحاً مِثْلَ (1-${handleReply.results.length})\n` +
      `●─────── ✾ ───────●`,
      threadID, messageID
    );
  }

  const video = handleReply.results[index - 1];

  // سحب قائمة الاختيارات فوراً لبدء عملية التحميل وتنظيف الشات
  try { await api.unsendMessage(handleReply.messageID); } catch (e) {}

  // إزالة الجلسة من الذاكرة المؤقتة
  const idx = global.client.handleReply.findIndex(r => r.messageID === handleReply.messageID);
  if (idx !== -1) global.client.handleReply.splice(idx, 1);

  api.sendMessage(
    `●─────── ✾ ───────●\n` +
    ` ⦿ ⟬ جَارٍ التَّحْمِيلُ ⏳ ⟭ ⦿\n` +
    `┝━━━━━━━━━━━━━━━\n` +
    `┇ 🎵 ${(video.title || video.desc || "فيديو").substring(0, 50)}\n` +
    `●─────── ✾ ───────●`,
    threadID,
    async (err, loadingInfo) => {
      if (err) return;

      let filePath = null;
      try {
        await fs.ensureDir(CACHE_DIR);
        filePath = path.join(CACHE_DIR, `tik_${Date.now()}.mp4`);

        const videoUrl = video.videoUrl || video.play || video.wmplay;
        if (!videoUrl) throw new Error("رابط الفيديو غير متوفر");

        // تنزيل ملف الفيديو كـ Stream إلى الكاش
        const writer = fs.createWriteStream(filePath);
        const res = await axios({
          url: videoUrl,
          method: "GET",
          responseType: "stream",
          timeout: 60000,
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        res.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        // منع إرسال الملفات الضخمة التي قد تتسبب في كراش أو حظر اتصال السيرفر
        if (stats.size > 50 * 1024 * 1024) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          try { await api.unsendMessage(loadingInfo.messageID); } catch (e) {}
          return api.sendMessage(
            `●─────── ✾ ───────●\n` +
            ` ⦿ ⟬ تَنْبِيهٌ ⚠️ ⟭ ⦿\n` +
            `┝━━━━━━━━━━━━━━━\n` +
            `┇ 📦 حَجْمُ الفِيدِيو كَبِيرٌ جِدّاً (${sizeMB} MB)\n` +
            `┇ 🔄 حَاوِلْ البَحْثَ مَرَّةً أُخْرَى\n` +
            `●─────── ✾ ───────●`,
            threadID, messageID
          );
        }

        // إزالة رسالة "جارٍ التحميل" لإرسال الفيديو النهائي
        try { await api.unsendMessage(loadingInfo.messageID); } catch (e) {}

        const title = video.title || video.desc || "بِدُونِ عُنْوَانٍ";
        const author = video.author?.nickname || video.author?.unique_id || video.author || "";

        let finalMsg = `●─────── ✾ ───────●\n`;
        finalMsg += ` ⦿ ⟬ تِيكْ تُوكْ 🎵 ⟭ ⦿\n`;
        finalMsg += `┝━━━━━━━━━━━━━━━\n`;
        finalMsg += `┇ 🎬 ${title.substring(0, 60)}\n`;
        if (author) finalMsg += `┇ 👤 ${author}\n`;
        finalMsg += `┇ 📦 الحَجْم: ${sizeMB} MB\n`;
        finalMsg += `●─────── ✾ ───────●`;

        api.sendMessage({
          body: finalMsg,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          // مسح الملف من خادم الاستضافة (كاش ريبليت) فور الإرسال للحفاظ على مساحة المشروع
          setTimeout(() => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }, 5000);
        }, messageID);

      } catch (error) {
        console.error("[Tik Download Error]:", error);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        try { await api.unsendMessage(loadingInfo.messageID); } catch (e) {}
        api.sendMessage(
          `●─────── ✾ ───────●\n` +
          ` ⦿ ⟬ خَطَأٌ ❌ ⟭ ⦿\n` +
          `┝━━━━━━━━━━━━━━━\n` +
          `┇ 🛑 فَشَلَ تَحْمِيلُ الفِيدِيو\n` +
          `┇ 🔄 حَاوِلْ مَرَّةً أُخْرَى\n` +
          `●─────── ✾ ───────●`,
          threadID, messageID
        );
      }
    },
    messageID
  );
};
