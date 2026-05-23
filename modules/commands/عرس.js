module.exports.config = {
  name: "عرس",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "عقد زواج ملكي مع بطاقة مدمجة بالصور 💍",
  usePrefix: true,
  commandCategory: "ترفيه",
  usages: "[تاغ] أو [رد على رسالة]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, Users }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const jimp = require("jimp");
  const path = require("path");
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  const botID = api.getCurrentUserID();
  const devID = "100090081489341";

  let targetID;
  if (type === "message_reply") {
    targetID = messageReply.senderID;
  } else if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n💍 قم بتاغ شخص أو ردّ على رسالته لإتمام مراسيم العرس!\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  if (targetID == botID) {
    const roasts = [
      "تتزوجني أنا؟ يبدو أن معاييرك سقطت في الهاوية!",
      "أنا ذكاء اصطناعي، لست مأذوناً شرعياً لأحلامك البائسة.",
      "عذراً، أنا مرتبط بالكود والخوارزميات، لا مكان للبشر في قلبي المعدني!",
      "هل سألت نفسك لماذا تريد الزواج من بوت؟ اذهب وجد حياة حقيقية!"
    ];
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🔥 ${roasts[Math.floor(Math.random() * roasts.length)]}\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  if (targetID == devID && senderID != devID) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ لا يمكن تزويج مالك البوت غصباً عنه! ابحث عن ضحية أخرى 😂\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  api.setMessageReaction("❤️", messageID, () => {}, true);
  api.sendMessage("⏳ جارٍ توثيق عقد القران الملكي...", threadID, messageID);

  try {
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    const bgUrl = "https://i.postimg.cc/6Qj3GFLS/charming-illustration-anime-bride-groom-their-wedding-day-image-depicts-couple-s-happiness-love-perf.jpg";
    const avatar1Url = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=${token}`;
    const avatar2Url = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=${token}`;

    const circleAvatar = async (url) => {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      const img = await jimp.read(res.data);
      img.circle();
      return await img.getBufferAsync(jimp.MIME_PNG);
    };

    const [bgRes, buf1, buf2] = await Promise.all([
      axios.get(bgUrl, { responseType: "arraybuffer" }),
      circleAvatar(avatar1Url),
      circleAvatar(avatar2Url)
    ]);

    const bg = await jimp.read(bgRes.data);
    const img1 = await jimp.read(buf1);
    const img2 = await jimp.read(buf2);

    bg.composite(img1.resize(170, 170), 215, 95);
    bg.composite(img2.resize(155, 155), 610, 185);

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const outputPath = path.join(cacheDir, `wedding_${senderID}_${targetID}.png`);
    await bg.writeAsync(outputPath);

    const nameOne = await Users.getNameUser(senderID);
    const nameTwo = await Users.getNameUser(targetID);

    return api.sendMessage({
      body: `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n💍 عقد قران ملكي\n───── · · · ✦ · · · ─────\n\n✨ تم الزواج بيمن وبركة بين:\n🤴 العريس: 『 ${nameOne} 』\n👸 العروس: 『 ${nameTwo} 』\n\n💌 " بارك الله لكما وبارك عليكما وجمع بينكما في خير "\n\n───── · · · ✦ · · · ─────`,
      attachment: fs.createReadStream(outputPath)
    }, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);
  } catch (e) {
    console.error(e);
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ حدث خطأ تقني أثناء إصدار الوثيقة.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }
};
