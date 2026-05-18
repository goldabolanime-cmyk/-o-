const fs = require("fs-extra");

// دالة الزخرفة الموحدة لريم بوت
const BOX = (title, lines, footer = null) => {
  let m = `●─────── ✾ ───────●\n ⦿ ⟬ ${title} ⟭ ⦿\n⊱ ────────────── ⊰\n`;
  for (const l of lines) { 
    if (!l && l !== 0) { m += `\n`; } else { m += `  ⟣ ${l}\n`; } 
  }
  if (footer) {
    m += `⊱ ────────────── ⊰\n`;
    for (const f of footer) { 
      if (!f && f !== 0) { m += `\n`; } else { m += `  ⟣ ${f}\n`; } 
    }
  }
  return m + '●─────── ✾ ───────●';
};

module.exports.config = {
  name: "هدية",
  aliases: ["الهدية", "يومي", "راتب_يومي"],
  version: "2.0.1",
  hasPermssion: 0,
  credits: "Abdou / ريم بوت",
  description: "استلام الهدية اليومية العشوائية مع نظام قصف جبهات كوميدي وطريقة حفظ آمنة",
  commandCategory: "العاب",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const cooldownTime = 24 * 60 * 60 * 1000; // فترة الانتظار: 24 ساعة بالملي ثانية

    // جلب بيانات المستخدم الحالية بالكامل لتجنب أخطاء الدوال المفقودة
    let userDataFull = await Currencies.getData(senderID);
    let data = userDataFull.data || {};
    if (typeof data !== 'object') data = {};

    let currentMoney = userDataFull.money || 0;
    const lastDaily = data.lastDailyTime || 0;

    // قصف جبهات للطماعين
    const greedyRoasts = [
        "وجهك مغسول بمرق؟ استلمت من قبل يا طماع 🦦",
        "تبي هدية ثانية？ روح اشتغل واترك الشحاتة 💸",
        "لو كنت تهتم بصلاتك مثل ما تهتم بالفلوس كان دخلت الجنة 🕌",
        "الحظ يعطي الحلق للي بلا أذنين، وأنت لا حظ ولا فلوس حالياً 🤡",
        "انتظر 24 ساعة يا بطل، لا تحاول تضحك عليّ 🤖⚡"
    ];

    if (Date.now() - lastDaily < cooldownTime) {
        const timeLeft = cooldownTime - (Date.now() - lastDaily);
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const roast = greedyRoasts[Math.floor(Math.random() * greedyRoasts.length)];

        return api.sendMessage(
            BOX("⚠️ طَمَعٌ زَائِدٌ", [
                `${roast}`,
                ``,
                `🕒 عُدْ بَعْدَ: ${hours} ساعة و ${minutes} دقيقة.`
            ]),
            threadID, messageID
        );
    }

    // قصف جبهات لمن استلم الهدية بنجاح
    const winRoasts = [
        "خذ الفلوس قبل ما تقطع الكهرباء وأتوقف عن العمل 🪿⚡",
        "مبروك، صرت غني ثواني قبل ما تصرفهم في القمار 🎰",
        "المال يروح ويجي، بس غباءك ثابت ما يتغير 🧠🌚",
        "استلم الهدية واختفي، وجهك يجيب النحس 👺",
        "لو جمعت هداياك كلها ما تشتري بيهم كرامة، بس خذهم 💸"
    ];

    const giftAmount = Math.floor(Math.random() * (2900 - 200 + 1)) + 200;
    const roast = winRoasts[Math.floor(Math.random() * winRoasts.length)];

    // تعديل البيانات وحفظها يدوياً بشكل آمن لحل مشكلة الدالة المفقودة
    currentMoney += giftAmount;
    data.lastDailyTime = Date.now();

    await Currencies.setData(senderID, { money: currentMoney, data: data });

    const successMsg = BOX(
        "هَدِيَّتُكَ الْيَوْمِيَّةُ 🎁",
        [
            `🎲 ${roast}`,
            ``,
            `💰 الْمَطْلُوبُ اسْتِلَامُهُ: ${giftAmount} $`,
            `👛 رَصِيدُكَ الإِجْمَالِيُّ: ${currentMoney.toLocaleString()} $`
        ],
        ["تنبيه: يمكنك العودة مجدداً بعد مرور 24 ساعة كاملة."]
    );

    return api.sendMessage(successMsg, threadID, messageID);
};
