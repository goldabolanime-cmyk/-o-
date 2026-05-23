module.exports.config = {
  name: "حساب",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "حساب العمليات الحسابية والمعادلات الجبرية ⚖️",
  usePrefix: true,
  commandCategory: "أدوات",
  usages: "[عملية حسابية] مثال: 5+3*2 أو 2x=10",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n⚖️ الحاسبة الملكية\n───── · · · ✦ · · · ─────\n\n📍 أدخل العملية الحسابية\nمثال: .حساب 5+3*2\nأو معادلة: .حساب 2x=10`,
      threadID, messageID
    );
  }

  let fullInput = args.join(" ");
  let input = fullInput.toLowerCase().replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/:/g, "/");

  const isEquation = (input.includes("=") && (input.includes("x") || input.includes("س")));

  if (isEquation) {
    try {
      input = input.replace(/س/g, "x");
      const parts = input.split("=");
      if (parts.length !== 2) throw new Error();

      const prep = (s) => s.replace(/([^0-9*])x/g, "$11*x").replace(/^x/g, "1*x").replace(/(\d+)x/g, "$1*x");
      const left = prep(parts[0]);
      const right = prep(parts[1]);

      const solve = (v) => {
        const l = new Function("x", `return ${left}`)(v);
        const r = new Function("x", `return ${right}`)(v);
        return l - r;
      };

      const v0 = solve(0), v1 = solve(1);
      if (v0 === null || v1 === null || (v1 - v0) === 0) throw new Error();
      const x = Number((-v0 / (v1 - v0)).toFixed(4));

      return api.sendMessage(
        `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n⚖️ الحاسبة الملكية\n───── · · · ✦ · · · ─────\n\n📂 النوع: معادلة جبرية\n📝 المعادلة: 『 ${fullInput} 』\n✨ قيمة x: 『 ${x} 』\n\n───── · · · ✦ · · · ─────`,
        threadID, messageID
      );
    } catch {
      return api.sendMessage(
        `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ صيغة المعادلة غير صحيحة أو غير مدعومة.`,
        threadID, messageID
      );
    }
  }

  try {
    const clean = input.replace(/\^/g, "**");
    const result = new Function(`return ${clean}`)();
    if (isNaN(result) || !isFinite(result)) throw new Error();

    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n⚖️ الحاسبة الملكية\n───── · · · ✦ · · · ─────\n\n🔢 المسألة: 『 ${fullInput} 』\n✅ النتيجة: 『 ${result.toLocaleString()} 』\n\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  } catch {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ خطأ في التحليل، تأكد من صحة الرموز.`,
      threadID, messageID
    );
  }
};
