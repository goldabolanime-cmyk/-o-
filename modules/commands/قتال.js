// ╔══════════════════════════════════════╗
// ║        ⚔️ RIO BATTLE SYSTEM ⚔️       ║
// ╚══════════════════════════════════════╝

if (!global.rioBattle) global.rioBattle = new Map();
if (!global.rioBag) global.rioBag = new Map();
if (!global.rioSkills) global.rioSkills = new Map();

const BATTLE_TIMEOUT = 4 * 60 * 1000;

const SHOP = {
  1: { name: "💊 حبة علاج", price: 1000 },
  2: { name: "⚡ حبة شحن", price: 1200 },
  3: { name: "🌀 حبة هلوسة", price: 1500 },
  4: { name: "🦹 حبة سرقة", price: 3000 },
  5: { name: "🌟 حبة تحول فوري", price: 3200 },
  6: { name: "💣 تدمير ذاتي", price: 10000 },
  7: { name: "🎲 قاضي حظ", price: 8000 },
  8: { name: "🕊️ لص مسالم", price: 1300 },
  9: { name: "☠️ سم عفريت", price: 2000 },
  10: { name: "🪙 نبيل الفقير", price: 50 },
  11: { name: "💀 اليمت حي", price: 9000, skill: true, command: "اليمت" },
  12: { name: "🌑 رائحة عالم سفلية", price: 11000, skill: true, command: "سفلية" },
  13: { name: "⚫ هاكاي", price: 4800, skill: true, command: "هاكاي" },
  14: { name: "🛡️ تدريع", price: 7200, skill: true, command: "تدريع" },
  15: { name: "🕊️ رحيم", price: 4500, skill: true, command: "رحيم" },
  16: { name: "❌ الخطأ", price: 20000, skill: true, command: "الخطأ" },
  17: { name: "⚡ السريع", price: 9000, skill: true, command: "السريع" },
  18: { name: "👑 اللورد", price: 9600, skill: true, command: "اللورد" }
};

// ════════════════════════════════════════
// 🛠️ الوظائف المساعدة
// ════════════════════════════════════════

function createBar(current, max) {
  const total = 8;
  const filled = Math.round((current / max) * total);
  return "█".repeat(filled) + "░".repeat(total - filled);
}

function getBag(uid) {
  if (!global.rioBag.has(uid)) global.rioBag.set(uid, {});
  return global.rioBag.get(uid);
}

function getSkills(uid) {
  if (!global.rioSkills.has(uid)) global.rioSkills.set(uid, []);
  return global.rioSkills.get(uid);
}

function refreshBattleTimeout(api, threadID) {
  const battle = global.rioBattle.get(threadID);
  if (!battle) return;

  if (battle.timeout) clearTimeout(battle.timeout);
  battle.lastAction = Date.now();

  battle.timeout = setTimeout(() => {
    const currentBattle = global.rioBattle.get(threadID);
    if (!currentBattle) return;

    global.rioBattle.delete(threadID);
    api.sendMessage(`
●─────── ✾ ───────●
⦿ ⟬ ⏰ إِنْهَاء المُعْرَكَة ⟭ ⦿

❌ تم إنهاء المعركة بسبب عدم النشاط لمدة 4 دقائق!

●─────── ✾ ───────●
`, threadID);
  }, BATTLE_TIMEOUT);
}

function shopUI(page, money) {
  if (page == 1) {
    return `
●─────── ✾ ───────●
⦿ ⟬ 🏪 مَتْجَر القِتَال ⟭ ⦿

💰 أموالك: ${money.toLocaleString()}$

[1] 💊 حبة علاج
💵 1,000$

[2] ⚡ حبة شحن
💵 1,200$

[3] 🌀 حبة هلوسة
💵 1,500$

[4] 🦹 حبة سرقة
💵 3,000$

[5] 🌟 تحول فوري
💵 3,200$

[6] 💣 تدمير ذاتي
💵 10,000$

[7] 🎲 قاضي حظ
💵 8,000$

[8] 🕊️ لص مسالم
💵 1,300$

[9] ☠️ سم عفريت
💵 2,000$

[10] 🪙 نبيل الفقير
💵 50$

📦 الصفحة 1/2

✦ رد بـ:
شراء 1 3

أو:
مزيد

●─────── ✾ ───────●
`;
  }

  return `
●─────── ✾ ───────●
⦿ ⟬ 🏪 مَتْجَر القِتَال ⟭ ⦿

💰 أموالك: ${money.toLocaleString()}$

[11] 💀 اليمت حي
💵 9,000$

[12] 🌑 رائحة عالم سفلية
💵 11,000$

[13] ⚫ هاكاي
💵 4,800$

[14] 🛡️ تدريع
💵 7,200$

[15] 🕊️ رحيم
💵 4,500$

[16] ❌ الخطأ
💵 20,000$

[17] ⚡ السريع
💵 9,000$

[18] 👑 اللورد
💵 9,600$

📦 الصفحة 2/2

✦ رد بـ:
شراء 11

أو:
مزيد

●─────── ✾ ───────●
`;
}

function battleUI(p1, p2, turn, action, bet) {
  return `
●─────── ✾ ───────●
⦿ ⟬ ⚔️ 𝐁𝐀𝐓𝐓𝐋𝐄 ⚔️ ⟭ ⦿

👤 ${p1.name}
❤️ ${createBar(p1.hp, p1.maxHp)}
${p1.hp}/${p1.maxHp}

⚡ ${createBar(p1.energy, p1.maxEnergy)}
${p1.energy}/${p1.maxEnergy}

━━━━━━━━━━━━━━

👤 ${p2.name}
❤️ ${createBar(p2.hp, p2.maxHp)}
${p2.hp}/${p2.maxHp}

⚡ ${createBar(p2.energy, p2.maxEnergy)}
${p2.energy}/${p2.maxEnergy}

━━━━━━━━━━━━━━

${bet > 0 ? `💰 الرهان: ${bet.toLocaleString()}$\n\n` : ""}📜 ${action}

⏳ الدور: ${turn.name}

━━━━━━━━━━━━━━

⚔️ الحركات:
هجوم - دفاع - شحن
مهارة - علاج - تحول
التميت - حقيبة - مهاراتي

●─────── ✾ ───────●
`;
}

// ════════════════════════════════════════
// 🎮 الدوال التنفيذية الأساسية
// ════════════════════════════════════════

async function runCommand({ api, event, args, Users, Currencies }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  if (global.rioBattle.has(threadID)) {
    return api.sendMessage(`
●─────── ✾ ───────●
⦿ ⟬ ⏳ مُعْرَكَة جَارِيَة ⟭ ⦿

❌ توجد معركة بالفعل!
⌛ اصبر حتى تنتهي المعركة الحالية.

●─────── ✾ ───────●
`, threadID, messageID);
  }

  if (args[0] == "متجر") {
    const money = (await Currencies.getData(senderID)).money;
    return api.sendMessage(
      shopUI(1, money),
      threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: "قتال",
          type: "shop",
          page: 1,
          author: senderID,
          messageID: info.messageID
        });
      },
      messageID
    );
  }

  let targetID = messageReply ? messageReply.senderID : Object.keys(mentions)[0];

  if (!targetID) {
    return api.sendMessage("❌ قم بمنشن شخص!", threadID, messageID);
  }

  if (targetID == senderID) {
    return api.sendMessage("❌ لا يمكنك قتال نفسك!", threadID, messageID);
  }

  const bet = parseInt(args[0]) || 0;
  const name = await Users.getNameUser(senderID);

  if (bet <= 0) {
    const p1Name = await Users.getNameUser(senderID);
    const p2Name = await Users.getNameUser(targetID);

    const battle = {
      p1: { id: senderID, name: p1Name, hp: 120, maxHp: 120, energy: 0, maxEnergy: 100, transformed: false, defending: false },
      p2: { id: targetID, name: p2Name, hp: 120, maxHp: 120, energy: 0, maxEnergy: 100, transformed: false, defending: false },
      turn: senderID,
      bet: 0,
      lastAction: Date.now()
    };

    global.rioBattle.set(threadID, battle);
    refreshBattleTimeout(api, threadID);

    return api.sendMessage(
      battleUI(battle.p1, battle.p2, battle.p1, `🔥 بدأت المعركة بين ${name} و ${p2Name}!`, 0),
      threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: "قتال",
          type: "battle",
          key: threadID,
          messageID: info.messageID
        });
      }
    );
  }

  return api.sendMessage(`
●─────── ✾ ───────●
⦿ ⟬ ⚔️ تَحَدِّي ⟭ ⦿

👤 ${name}
يتحداك بمبلغ: ${bet.toLocaleString()}$

✦ رد بـ:
قبول

●─────── ✾ ───────●
`, threadID, (err, info) => {
    global.client.handleReply.push({
      name: "قتال",
      type: "accept",
      challenger: senderID,
      target: targetID,
      bet,
      messageID: info.messageID
    });
  }, messageID);
}

async function replyCommand({ api, event, handleReply, Users, Currencies }) {
  const { threadID, senderID, body, messageID } = event;

  if (handleReply.type == "shop") {
    if (senderID != handleReply.author) return;

    if (body == "مزيد") {
      const next = handleReply.page == 1 ? 2 : 1;
      const money = (await Currencies.getData(senderID)).money;

      return api.sendMessage(
        shopUI(next, money),
        threadID,
        (err, info) => {
          global.client.handleReply.push({
            name: "قتال",
            type: "shop",
            page: next,
            author: senderID,
            messageID: info.messageID
          });
        }
      );
    }

    if (body.startsWith("شراء")) {
      const split = body.split(" ");
      const itemID = parseInt(split[1]);
      const amount = parseInt(split[2]) || 1;

      if (!SHOP[itemID]) {
        return api.sendMessage("❌ العنصر غير موجود!", threadID, messageID);
      }

      const item = SHOP[itemID];
      const total = item.price * amount;
      const data = await Currencies.getData(senderID);

      if (data.money < total) {
        return api.sendMessage("❌ أموالك غير كافية!", threadID, messageID);
      }

      await Currencies.setData(senderID, { money: data.money - total });

      if (item.skill) {
        const skills = getSkills(senderID);
        if (skills.find(x => x.command == item.command)) {
          return api.sendMessage("❌ لديك هذه المهارة بالفعل!", threadID, messageID);
        }
        skills.push({ name: item.name, command: item.command });
      } else {
        const bag = getBag(senderID);
        if (!bag[item.name]) bag[item.name] = 0;
        bag[item.name] += amount;
      }

      return api.sendMessage(`
●─────── ✾ ───────●
⦿ ⟬ ✅ شِرَاء نَاجِح ⟭ ⦿

📦 ${item.name} × ${amount}

💰 المتبقي:
${(data.money - total).toLocaleString()}$

●─────── ✾ ───────●
`, threadID, messageID);
    }
  }

  if (handleReply.type == "accept") {
    if (senderID != handleReply.target) return;
    if (body != "قبول") return;

    if (global.rioBattle.has(threadID)) {
      return api.sendMessage("❌ توجد معركة جارية بالفعل!", threadID, messageID);
    }

    const p1Name = await Users.getNameUser(handleReply.challenger);
    const p2Name = await Users.getNameUser(handleReply.target);

    const battle = {
      p1: { id: handleReply.challenger, name: p1Name, hp: 120, maxHp: 120, energy: 0, maxEnergy: 100, transformed: false, defending: false },
      p2: { id: handleReply.target, name: p2Name, hp: 120, maxHp: 120, energy: 0, maxEnergy: 100, transformed: false, defending: false },
      turn: handleReply.challenger,
      bet: handleReply.bet,
      lastAction: Date.now()
    };

    global.rioBattle.set(threadID, battle);
    refreshBattleTimeout(api, threadID);

    return api.sendMessage(
      battleUI(battle.p1, battle.p2, battle.p1, "🔥 بدأت المعركة!", battle.bet),
      threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: "قتال",
          type: "battle",
          key: threadID,
          messageID: info.messageID
        });
      }
    );
  }

  if (handleReply.type == "battle") {
    const battle = global.rioBattle.get(handleReply.key);
    if (!battle) return;

    refreshBattleTimeout(api, handleReply.key);
    const { p1, p2 } = battle;

    if (senderID != p1.id && senderID != p2.id) return;

    const attacker = senderID == p1.id ? p1 : p2;
    const defender = senderID == p1.id ? p2 : p1;

    if (battle.turn != senderID) return;

    let status = "";

    if (body == "هجوم") {
      let damage = Math.floor(Math.random() * 12) + 8;
      if (attacker.transformed) damage *= 1.5;

      defender.hp = Math.max(0, defender.hp - damage);
      attacker.energy = Math.min(100, attacker.energy + 15);
      status = `⚔️ ${attacker.name} ألحق ${damage} ضرر!`;
    } else {
      return;
    }

    if (defender.hp <= 0) {
      if (battle.timeout) clearTimeout(battle.timeout);
      global.rioBattle.delete(handleReply.key);

      if (battle.bet > 0) {
        const winner = await Currencies.getData(attacker.id);
        await Currencies.setData(attacker.id, {
          money: winner.money + (battle.bet * 2)
        });
      }

      return api.sendMessage(`
●─────── ✾ ───────●
⦿ ⟬ 🏆 النَّصْر ⟭ ⦿

👑 الفائز: ${attacker.name}

💀 المهزوم: ${defender.name}

${battle.bet > 0 ? `💰 الجائزة:\n${(battle.bet * 2).toLocaleString()}$` : "🎖️ معركة بدون رهان"}

●─────── ✾ ───────●
`, threadID, messageID);
    }

    battle.turn = defender.id;
    global.rioBattle.set(handleReply.key, battle);

    return api.sendMessage(
      battleUI(p1, p2, defender, status, battle.bet),
      threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: "قتال",
          type: "battle",
          key: handleReply.key,
          messageID: info.messageID
        });
      }
    );
  }
}

// ════════════════════════════════════════
// 📤 التصدير المزدوج لضمان التوافق التام
// ════════════════════════════════════════

module.exports = {
  config: {
    name: "قتال",
    version: "13.0.0",
    role: 0,
    author: "عبدو",
    description: "نظام قتال PvP أسطوري",
    category: "ألعاب",
    usages: "[منشن/رد] [رهان]",
    cooldown: 5
  },

  // لنسخ ريم الصافية والمستقبلية
  onCall: runCommand,
  onReply: replyCommand,

  // لنسخ ميراي والريبليت التي تبحث بشكل إجباري عن الهياكل التقليدية
  run: runCommand,
  handleReply: replyCommand
};
