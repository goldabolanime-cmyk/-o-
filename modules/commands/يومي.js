module.exports.config = {
  name: "يومي",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "احصل على مكافأتك اليومية من الكاش 🎁",
  usePrefix: true,
  commandCategory: "اقتصاد",
  cooldowns: 0
};

const fs = require("fs-extra");
const path = require("path");
const DAILY_PATH = path.join(process.cwd(), "database", "daily.json");

function loadDaily() {
  try {
    if (!fs.existsSync(DAILY_PATH)) return {};
    return JSON.parse(fs.readFileSync(DAILY_PATH, "utf8") || "{}");
  } catch { return {}; }
}

function saveDaily(data) {
  try {
    fs.ensureDirSync(path.dirname(DAILY_PATH));
    fs.writeFileSync(DAILY_PATH, JSON.stringify(data, null, 2));
  } catch {}
}

function msToHMS(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}س ${m}د ${s}ث`;
}

module.exports.run = async function ({ api, event, Currencies, Users }) {
  const { threadID, messageID, senderID } = event;
  const COOLDOWN = 24 * 60 * 60 * 1000;

  const dailyData = loadDaily();
  const last = dailyData[senderID] || 0;
  const now = Date.now();
  const diff = now - last;

  if (diff < COOLDOWN) {
    const remaining = COOLDOWN - diff;
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n⏳ المكافأة اليومية\n───── · · · ✦ · · · ─────\n\n❌ لقد طالبت بمكافأتك اليوم!\n⏰ يمكنك المطالبة مجدداً بعد:\n🕐 ${msToHMS(remaining)}\n\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  const min = 500, max = 2000;
  const amount = Math.floor(Math.random() * (max - min + 1)) + min;

  dailyData[senderID] = now;
  saveDaily(dailyData);

  await Currencies.increaseMoney(senderID, amount);
  const name = await Users.getNameUser(senderID);
  const balance = (await Currencies.getData(senderID))?.money || 0;

  return api.sendMessage(
    `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🎁 المكافأة اليومية\n───── · · · ✦ · · · ─────\n\n✅ مبروك يا ${name}!\n💰 حصلت على: +${amount.toLocaleString()} $\n💼 رصيدك الآن: ${balance.toLocaleString()} $\n\n───── · · · ✦ · · · ─────\n⏰ عد غداً للمكافأة التالية 🌙`,
    threadID, messageID
  );
};
