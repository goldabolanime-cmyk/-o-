module.exports.config = {
  name: "كراش",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "أظهر اهتمامك بشخص ما بأسلوب ريم 💖",
  usePrefix: true,
  commandCategory: "ترفيه",
  usages: "[تاغ] أو [رد على رسالة]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const { threadID, messageID, messageReply, mentions } = event;

  let targetID;
  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (messageReply) {
    targetID = messageReply.senderID;
  } else {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n💖 من هو الكراش؟\nقم بتاغ شخص أو ردّ على رسالته.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  const gifs = [
    "https://i.postimg.cc/1zK2zQSB/fullmetal-alchemist-roy-mustang.gif",
    "https://i.postimg.cc/xTkw3hGM/witch-watch.gif"
  ];
  const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

  if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache", { recursive: true });
  const gifPath = __dirname + `/cache/crush_${threadID}.gif`;

  api.sendMessage("⏳ جارٍ تجهيز مشاعر الكراش...", threadID, messageID);

  try {
    const name = await Users.getNameUser(targetID);
    const res = await axios.get(randomGif, { responseType: "arraybuffer" });
    fs.writeFileSync(gifPath, Buffer.from(res.data));

    return api.sendMessage({
      body: `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n😍 كـراش نـيـوز\n───── · · · ✦ · · · ─────\n\n✨ الكراش المقدس: 『 ${name} 』\n\n💌 " أنا أهتم لأجل هذا الشخص جداً "\n\n───── · · · ✦ · · · ─────`,
      attachment: fs.createReadStream(gifPath)
    }, threadID, () => {
      if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
    }, messageID);
  } catch (e) {
    console.error(e);
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ حدث خطأ في تحميل الـ GIF.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }
};
