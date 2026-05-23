module.exports.config = {
  name: "قرعة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "نظام قرعة جماعي بمؤقت تلقائي 🎰",
  usePrefix: true,
  commandCategory: "ألعاب",
  usages: "[المبلغ] — للانضمام | بدء — لبدء السحب",
  cooldowns: 5
};

if (!global.rem_jackpot) global.rem_jackpot = new Map();

async function startDraw(api, threadID, Users, Currencies) {
  const game = global.rem_jackpot.get(threadID);
  if (!game) return;
  clearTimeout(game.timeout);

  api.sendMessage("🎡 جارٍ سحب القرعة . . .", threadID, async () => {
    const winner = game.players[Math.floor(Math.random() * game.players.length)];
    const winnerName = await Users.getNameUser(winner.id);
    await Currencies.increaseMoney(winner.id, game.totalPool);

    setTimeout(() => {
      api.sendMessage(
        `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🎰 نتيجة القرعة الملكية\n───── · · · ✦ · · · ─────\n\n👑 الفائز: ${winnerName}\n💰 الجائزة: ${game.totalPool}$\n👥 عدد المشاركين: ${game.players.length}\n\n───── · · · ✦ · · · ─────\nمبارك لك الفوز! 💸`,
        threadID
      );
      global.rem_jackpot.delete(threadID);
    }, 2000);
  });
}

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { threadID, messageID, senderID } = event;

  if (args[0] === "بدء") {
    const game = global.rem_jackpot.get(threadID);
    if (!game) return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n⚠️ لا توجد قرعة مفتوحة الآن!\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
    if (game.creator !== senderID) return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🚫 فقط منشئ القرعة يملك صلاحية البدء!\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
    if (game.players.length < 2) return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n👥 يجب انضمام شخصين على الأقل!\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
    return startDraw(api, threadID, Users, Currencies);
  }

  const betAmount = parseInt(args[0]);
  if (isNaN(betAmount) || betAmount <= 0) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🎰 نظام القرعة الملكية\n───── · · · ✦ · · · ─────\n\n📍 الاستخدام:\n• .قرعة 500 — للانضمام بمبلغ 500$\n• .قرعة بدء — لبدء السحب (المنشئ فقط)\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  const userData = await Currencies.getData(senderID);
  if (userData.money < betAmount) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ رصيدك غير كافٍ!\nتملك فقط: ${userData.money}$\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  if (!global.rem_jackpot.has(threadID)) {
    global.rem_jackpot.set(threadID, {
      creator: senderID,
      players: [],
      totalPool: 0,
      mainMsgID: null,
      timeout: null
    });

    const timeout = setTimeout(async () => {
      const game = global.rem_jackpot.get(threadID);
      if (game) {
        api.sendMessage(
          `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n⌛ انتهى الوقت (60 ثانية)!\nتم إلغاء القرعة وإعادة الأموال.\n───── · · · ✦ · · · ─────`,
          threadID
        );
        for (const p of game.players) await Currencies.increaseMoney(p.id, p.bet);
        global.rem_jackpot.delete(threadID);
      }
    }, 60000);

    global.rem_jackpot.get(threadID).timeout = timeout;
  }

  const game = global.rem_jackpot.get(threadID);
  if (game.players.find(p => p.id === senderID)) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🚫 أنت مسجل بالفعل في هذه القرعة!\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  await Currencies.decreaseMoney(senderID, betAmount);
  game.players.push({ id: senderID, bet: betAmount });
  game.totalPool += betAmount;

  const creatorName = await Users.getNameUser(game.creator);
  const msg =
    `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n` +
    `───── · · · ✦ · · · ─────\n` +
    `🎰 نظام القرعة الملكية\n` +
    `───── · · · ✦ · · · ─────\n\n` +
    `💰 الخزنة: ${game.totalPool}$\n` +
    `👥 المشاركين: ${game.players.length}\n` +
    `👤 المنشئ: ${creatorName}\n\n` +
    `💡 انضمام: .قرعة ${betAmount}\n` +
    `🎯 للبدء: .قرعة بدء (المنشئ فقط)\n` +
    `⏳ تغلق تلقائياً بعد 60 ثانية\n` +
    `───── · · · ✦ · · · ─────`;

  if (game.mainMsgID) api.unsendMessage(game.mainMsgID);
  api.sendMessage(msg, threadID, (err, info) => {
    if (!err) game.mainMsgID = info.messageID;
  });
};
