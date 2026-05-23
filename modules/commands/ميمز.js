module.exports.config = {
  name: "ميمز",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "صناعة ميم Drake بنصين مخصصين 😂",
  usePrefix: true,
  commandCategory: "ترفيه",
  usages: "[النص الأول]\n[النص الثاني]",
  cooldowns: 10
};

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + " ";
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = test;
    }
  }
  lines.push(line.trim());
  return lines;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  const axios = require("axios");
  const fs = require("fs-extra");
  const { loadImage, createCanvas } = require("canvas");

  const content = body.slice(body.indexOf(args[0])).split("\n");
  if (!args[0] || content.length < 2) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n📍 اكتب الميم بالطريقة الآتية:\n.ميمز النص الأول (الخطأ)\nالنص الثاني (الصح)\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  const textTop = content[0].trim();
  const textBottom = content[1].trim();
  if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache", { recursive: true });
  const pathImg = __dirname + `/cache/meme_${senderID}.png`;

  try {
    const imageUrl = "https://i.postimg.cc/8z5gqHn5/drake-clean.jpg";
    const buf = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;
    const base = await loadImage(Buffer.from(buf));
    const canvas = createCanvas(base.width, base.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    ctx.textAlign = "start";
    ctx.font = "bold 35px Arial, sans-serif";

    const linesTop = wrapText(ctx, textTop, 550);
    const linesBottom = wrapText(ctx, textBottom, 550);

    ctx.fillText(linesTop.join("\n"), 600, 200);
    ctx.fillText(linesBottom.join("\n"), 600, 750);

    fs.writeFileSync(pathImg, canvas.toBuffer());

    return api.sendMessage({
      body: `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n😂 ميم ريم الملكي`,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    }, messageID);
  } catch (e) {
    console.error(e);
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ حدث خطأ في معالجة الصورة.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }
};
