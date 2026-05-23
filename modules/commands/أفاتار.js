module.exports.config = {
  name: "أفاتار",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "عرض صورة بروفايل أي مستخدم 🖼️",
  usePrefix: true,
  commandCategory: "أدوات",
  usages: "[تاغ] أو [رد على رسالة] أو بدون للصورة الشخصية",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, Users }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  let targetID = senderID;

  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (messageReply) {
    targetID = messageReply.senderID;
  }

  if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache", { recursive: true });
  const imgPath = __dirname + `/cache/avatar_${targetID}.jpg`;

  try {
    const name = await Users.getNameUser(targetID).catch(() => "مستخدم");
    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    const res = await axios.get(avatarUrl, { responseType: "arraybuffer", timeout: 10000 });
    fs.writeFileSync(imgPath, Buffer.from(res.data));

    return api.sendMessage({
      body: `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🖼️ صورة بروفايل: ${name}\n───── · · · ✦ · · · ─────`,
      attachment: fs.createReadStream(imgPath)
    }, threadID, () => {
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }, messageID);
  } catch (e) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ لم أستطع جلب صورة البروفايل.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }
};
