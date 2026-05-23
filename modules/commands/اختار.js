module.exports.config = {
  name: "اختار",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "اختار خيار عشوائي من بين عدة خيارات 🎲",
  usePrefix: true,
  commandCategory: "أدوات",
  usages: "خيار1 | خيار2 | خيار3 ...",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const input = args.join(" ");
  const options = input.split("|").map(o => o.trim()).filter(o => o.length > 0);

  if (options.length < 2) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🎲 اختيار عشوائي\n───── · · · ✦ · · · ─────\n\n📍 ضع خيارين على الأقل مفصولة بـ |\nمثال: .اختار القهوة | الشاي | العصير\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  const chosen = options[Math.floor(Math.random() * options.length)];
  const list = options.map((o, i) => `${i + 1}. ${o}`).join("\n");

  return api.sendMessage(
    `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🎲 اختيار عشوائي\n───── · · · ✦ · · · ─────\n\n📋 الخيارات:\n${list}\n\n───── · · · ✦ · · · ─────\n✅ اخترت لك: 【 ${chosen} 】\n───── · · · ✦ · · · ─────`,
    threadID, messageID
  );
};
