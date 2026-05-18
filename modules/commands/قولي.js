const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// دالة الزخرفة الموحدة لريم بوت
const BOX = (title, lines, footer = null) => {
  let m = `●─────── ✾ ───────●\n ⦿ ⟬ ${title} ⟭ ⦿\n⊱ ────────────── ⊰\n`;
  for (const l of lines) { 
    if (!l && l !== 0) { m += `\n`; } else { m += `  ⟣ ${l}\n`; } 
  }
  if (footer) {
    m += `⊱ ────────────── ⊰\n`;
    for (const f of footer) { 
      if (!f && f !== 0) { m += `\n`; } else { m += `  ⟣ ${f}\n`; } 
    }
  }
  return m + '●─────── ✾ ───────●';
};

module.exports.config = {
  name: "قولي",
  aliases: ["قول", "تحدث", "نطق"],
  version: "2.0.0",
  hasPermssion: 0,
  credits: "عمر / تعديل عبدو لريم",
  description: "تحويل النص أو محتوى الرسالة المردود عليها إلى مقطع صوتی",
  commandCategory: "خدمات",
  usages: "[النص أو بالرد على رسالة]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply } = event;

  // الميزة المضافة: التحقق إذا كانت الرسالة عبارة عن رد (Reply) لجلب محتواها بنجاح
  let content = "";
  if (type === "message_reply") {
    content = messageReply.body;
  } else {
    content = args.join(" ");
  }

  content = content.trim();

  if (!content) {
    return api.sendMessage(
      BOX("❌ تَنْبِيه", ["يرجى كتابة النص المراد نُطقه بعد الأمر.", "أو قم بالرد على رسالة مكتوبة لنطق ما بداخلها."]),
      threadID, messageID
    );
  }

  // إنشاء مسار الكاش الصوتي بشكل آمن
  const cacheDir = path.resolve(__dirname, 'cache');
  if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

  const audioPath = path.resolve(cacheDir, `tts_${Date.now()}_${senderID}.mp3`);

  try {
    // رابط محرك النطق من جوجل باللغة العربية الفصحى
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(content)}&tl=ar&client=tw-ob`;

    // تحميل وتدفق الملف الصوتي باستخدام axios stream لتجنب نقص الملفات الخارجية
    const response = await axios({
      method: "GET",
      url: ttsUrl,
      responseType: "stream",
      timeout: 20000
    });

    const writer = fs.createWriteStream(audioPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // إرسال المقطع الصوتي بنجاح وتنظيف الكاش فوراً
    return api.sendMessage(
      { attachment: fs.createReadStream(audioPath) },
      threadID,
      () => { try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch (_) {} },
      messageID
    );

  } catch (error) {
    console.error("[TTS ERROR]", error);
    try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch (_) {}
    return api.sendMessage(BOX("❌ خَطَأ داخِلِي", ["فشل محرك جوجل في معالجة النص وتحويله إلى صوت.", "يرجى المحاولة مرة أخرى لاحقاً."]), threadID, messageID);
  }
};
