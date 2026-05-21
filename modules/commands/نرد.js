module.exports.config = {
  name: "نرد",
  aliases: ["dice", "رمي"],
  version: "1.0.5",
  hasPermssion: 0,
  credits: "Abdou",
  description: "لعبة النرد الاقتصادي والمغامرة مع قصف البطة والإوز الأسطوري",
  commandCategory: "العاب",
  usages: "[رقم النرد من 1 إلى 6] [مبلغ الرهان]",
  cooldowns: 5
};

// مصفوفة الأرقام التعبيرية (Emojis) للنرد
const diceEmojis = {
  1: "1⃣",
  2: "2⃣",
  3: "3⃣",
  4: "4⃣",
  5: "5⃣",
  6: "6⃣"
};

// قصفات عشوائية مخصصة للخاسر (بأسلوب البطة والإوزة والرموز)
const loseRoasts = [
  "🪿 خسرت! لا تبكي، ارمِ مرة ثانية وخسر أكثر 🪿🤘🏻",
  "🦆 رصيدك طار مع البط! اذهب واجمع الكاش من جديد يا بطل 🦆🤘🏻",
  "🪿 النرد جلد جيبك! ارمِ مرة أخرى ودعنا نضحك أكثر 🪿🤘🏻",
  "🦆 حظك اليوم تحت الصفر! البطة حزينة على كاشك الضائع 🦆🤘🏻",
  "🪿 خسارة أسطورية! لا تستسلم، واصل اللعب حتى تفلس تماماً 🪿🤘🏻"
];

// قصفات ومدائح تفاعلية عشوائية للرابح (بنفس الأسلوب والرموز)
const winRoasts = [
  "🪿 أسطورة! النرد انحنى لك والجيوب أصبحت ممتلئة كاش 🪿🤘🏻",
  "🦆 ضربة معلم! نهبت البنك وجعلت البط يصفق لك بحرارة 🦆🤘🏻",
  "🪿 محظوظ لدرجة مرعبة! البوت يبكي بسبب أرباحك الأسطورية 🪿🤘🏻",
  "🦆 كاش طازج في المحفظة! طار البط وجاءت الأموال والملايين 🦆🤘🏻",
  "🪿 فوز كاسح ومضاعف! اذهب واشترِ حيوانات جديدة للمزرعة 🪿🤘🏻"
];

module.exports.run = async function({ api, event, args, Economy }) {
  const { threadID, messageID, senderID } = event;

  // 1. التحقق من المدخلات (الرقم والرهان)
  const userChoice = parseInt(args[0]);
  const betAmount = parseInt(args[1]);

  if (isNaN(userChoice) || userChoice < 1 || userChoice > 6) {
    return api.sendMessage("⚠️ | يرجى تحديد رقم النرد أولاً من 1 إلى 6! مثال:\n`نرد 3 500`", threadID, messageID);
  }

  if (isNaN(betAmount) || betAmount <= 0) {
    return api.sendMessage("⚠️ | يرجى تحديد مبلغ رهاني منطقي وصحيح! مثال:\n`نرد 3 500`", threadID, messageID);
  }

  // 2. فحص رصيد المستخدم الحالي في البنك
  const currentBalance = await Economy.getBalance(senderID, "money");

  if (currentBalance < betAmount) {
    return api.sendMessage(`❌ | رصيدك الحالي غير كافٍ لخوض هذا الرهان! رصيدك هو: ${currentBalance.toLocaleString()}$`, threadID, messageID);
  }

  // 3. رمي النرد عشوائياً (من 1 إلى 6)
  const diceResult = Math.floor(Math.random() * 6) + 1;

  // اختيار القصفات العشوائية المحدثة
  const randomLoseRoast = loseRoasts[Math.floor(Math.random() * loseRoasts.length)];
  const randomWinRoast = winRoasts[Math.floor(Math.random() * winRoasts.length)];

  // 4. حالة الفوز (تطابق الاختيار مع النتيجة)
  if (userChoice === diceResult) {
    // تحديد نوع المضاعفة عشوائياً: إما ضعف واحد (x2) أو ضعفان (x3)
    const multiplier = Math.random() < 0.5 ? 2 : 3;
    const winAmount = betAmount * multiplier;

    await Economy.increase(winAmount, senderID, "money");
    const newBalance = await Economy.getBalance(senderID, "money");

    const winMsg = `●─────── ✾ ───────●\n` +
                   ` ⦿ ⟬ النَّرْدُ 🎲 ⟭ ⦿\n` +
                   `┝━━━━━━━━━━━━━━━\n` +
                   `┇ 👤 اخْتِيَارُكَ: ${diceEmojis[userChoice]} ${userChoice}\n` +
                   `┇ 🎯 نَتِيجَةُ النَّرْدِ: ${diceEmojis[diceResult]} ${diceResult}\n` +
                   `┝━━━━━━━━━━━━━━━\n` +
                   `┇ 🎉 فِزْتَ بِنَجَاحٍ! (مضاعفة ×${multiplier})\n` +
                   `┇ 💰 الأَرْبَاحُ: +${winAmount.toLocaleString()}$\n` +
                   `┇ 👛 رَصِيدُكَ الْجَدِيدُ: ${newBalance.toLocaleString()}$\n` +
                   `┝━━━━━━━━━━━━━━━\n` +
                   `┇ ${randomWinRoast}\n` +
                   `●─────── ✾ ───────●`;

    return api.sendMessage(winMsg, threadID, messageID);
  } 

  // 5. حالة الخسارة (عدم التطابق)
  else {
    await Economy.decrease(betAmount, senderID, "money");
    const newBalance = await Economy.getBalance(senderID, "money");

    const loseMsg = `●─────── ✾ ───────●\n` +
                    ` ⦿ ⟬ النَّرْدُ 🎲 ⟭ ⦿\n` +
                    `┝━━━━━━━━━━━━━━━\n` +
                    `┇ 👤 اخْتِيَارُكَ: ${diceEmojis[userChoice]} ${userChoice}\n` +
                    `┇ 🎯 نَتِيجَةُ النَّرْدِ: ${diceEmojis[diceResult]} ${diceResult}\n` +
                    `┝━━━━━━━━━━━━━━━\n` +
                    `┇ 😢 خَسِرْتَ!\n` +
                    `┇ 💸 الْخَسَارَةُ: -${betAmount.toLocaleString()}$\n` +
                    `┇ 👛 رَصِيدُكَ: ${newBalance.toLocaleString()}$\n` +
                    `┝━━━━━━━━━━━━━━━\n` +
                    `┇ ${randomLoseRoast}\n` +
                    `●─────── ✾ ───────●`;

    return api.sendMessage(loseMsg, threadID, messageID);
  }
};
