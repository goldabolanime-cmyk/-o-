module.exports.config = {
  name: "وصفة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "وصفة طبخ مع فيديو يوتيوب 🍳",
  usePrefix: true,
  commandCategory: "خدمات",
  usages: "[اسم الأكلة]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const ytSearch = require("youtube-search-api");
  const path = require("path");
  const { threadID, messageID } = event;

  const query = args.join(" ");
  if (!query) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🍳 المطبخ الملكي\n───── · · · ✦ · · · ─────\n\n📍 اكتب اسم الأكلة التي تريد وصفتها.\nمثال: .وصفة كسكس\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  api.sendMessage("⏳ جارٍ البحث في المطبخ الملكي...", threadID, messageID);

  try {
    const results = await ytSearch.GetListByKeyword(query + " طريقة عمل وصفة", false, 1);
    if (!results.items || results.items.length === 0) {
      return api.sendMessage(
        `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ لم أجد وصفة لهذه الأكلة.\n───── · · · ✦ · · · ─────`,
        threadID, messageID
      );
    }

    const video = results.items[0];
    const videoId = video.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const title = video.title;

    let details, description = "";
    try {
      details = await ytSearch.GetVideoDetails(videoId);
      description = details.description || "";
    } catch {}

    let ingredients = "المقادير مذكورة بالتفصيل داخل الفيديو.";
    if (description.includes("المقادير") || description.includes("المكونات")) {
      const parts = description.split(/المقادير|المكونات/i);
      if (parts[1]) {
        ingredients = parts[1].split("\n\n")[0].trim().substring(0, 500) + "...";
      }
    }

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let msg =
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n` +
      `───── · · · ✦ · · · ─────\n` +
      `🍳 وصفة: ${query}\n` +
      `───── · · · ✦ · · · ─────\n\n` +
      `📺 الفيديو: ${title}\n\n` +
      `📜 المقادير:\n${ingredients}\n\n` +
      `🔗 رابط الوصفة:\n${videoUrl}\n\n` +
      `───── · · · ✦ · · · ─────\n` +
      `🍴 بالهناء والشفاء! ✨`;

    // محاولة إرسال الصورة المصغرة
    try {
      const thumb = video.thumbnail.thumbnails[0].url;
      const filePath = path.join(cacheDir, `recipe_${videoId}.jpg`);
      const imgRes = await axios.get(thumb, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(imgRes.data));

      return api.sendMessage(
        { body: msg, attachment: fs.createReadStream(filePath) },
        threadID,
        () => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); },
        messageID
      );
    } catch {
      return api.sendMessage(msg, threadID, messageID);
    }
  } catch (e) {
    console.error(e);
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ حدث خطأ أثناء جلب الوصفة.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }
};
