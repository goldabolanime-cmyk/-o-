module.exports.config = {
  name: "بحث",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "البحث في ويكيبيديا العربية 🔍",
  usePrefix: true,
  commandCategory: "خدمات",
  usages: "[نص البحث] أو [en نص] للإنجليزية",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🔍 بحث ويكيبيديا\n───── · · · ✦ · · · ─────\n\n📍 أدخل ما تريد البحث عنه.\nمثال: .بحث الذكاء الاصطناعي\nللإنجليزية: .بحث en Artificial Intelligence\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  let url = "https://ar.wikipedia.org/w/api.php";
  let content = args.join(" ");

  if (args[0] === "en") {
    url = "https://en.wikipedia.org/w/api.php";
    content = args.slice(1).join(" ");
  }

  if (!content) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n⚠️ أدخل نص البحث بعد كلمة en.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  const startTime = Date.now();

  try {
    const wiki = require("wikijs").default;
    const page = await wiki({ apiUrl: url }).page(content);
    const summary = await page.summary();
    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
    const finalSummary = summary.length > 1500 ? summary.slice(0, 1500) + "..." : summary;

    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🔍 نتيجة البحث: ${content}\n───── · · · ✦ · · · ─────\n\n${finalSummary}\n\n───── · · · ✦ · · · ─────\n📚 المصدر: ويكيبيديا\n⏳ الوقت: ${timeTaken} ثانية\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  } catch {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ لم أجد نتائج لبحثك عن: ${content}\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }
};
