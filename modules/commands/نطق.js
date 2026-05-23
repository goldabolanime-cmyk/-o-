module.exports.config = {
  name: "نطق",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "تحويل النص إلى صوت 🔊",
  usePrefix: true,
  commandCategory: "أدوات",
  usages: "[النص] أو [رمز اللغة] [النص] مثال: en Hello",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🔊 تحويل النص إلى صوت\n───── · · · ✦ · · · ─────\n\n📍 اكتب النص الذي تريد نطقه\nمثال: .نطق مرحبا بكم\nباللغة الإنجليزية: .نطق en Hello everyone\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  const supportedLangs = ["ar", "en", "fr", "es", "de", "it", "tr", "ru", "ja", "zh", "ko", "hi", "pt"];
  let lang = "ar";
  let text = args.join(" ");

  if (args.length > 1 && supportedLangs.includes(args[0].toLowerCase())) {
    lang = args[0].toLowerCase();
    text = args.slice(1).join(" ");
  }

  if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache", { recursive: true });
  const audioPath = __dirname + `/cache/tts_${event.senderID}.mp3`;

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      timeout: 10000
    });
    fs.writeFileSync(audioPath, Buffer.from(res.data));

    return api.sendMessage({
      body: `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🔊 النطق: "${text.length > 50 ? text.slice(0, 50) + "..." : text}"`,
      attachment: fs.createReadStream(audioPath)
    }, threadID, () => {
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    }, messageID);
  } catch (e) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ فشل تحويل النص إلى صوت.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }
};
