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
    api.sendMessage(`●─── ✾ ───●\n⏰ | إنهاء المعركة بسبب عدم النشاط لمدة 4 دقائق!\n●─── ✾ ───●`, threadID);
  }, BATTLE_TIMEOUT);
}

function shopUI(page, money) {
  if (page == 1) {
    return `●─── ⟪ 🏪 مَتْجَر القِتَال ⟫ ───●\n💰 أموالك: ${money.toLocaleString()}$\n\n` +
           `[1] 💊 حبة علاج ↜ 1,000$\n` +
           `[2] ⚡ حبة شحن ↜ 1,200$\n` +
           `[3] 🌀 حبة هلوسة ↜ 1,500$\n` +
           `[4] 🦹 حبة سرقة ↜ 3,000$\n` +
           `[5] 🌟 تحول فوري ↜ 3,200$\n` +
           `[6] 💣 تدمير ذاتي ↜ 10,000$\n` +
           `[7] 🎲 قاضي حظ ↜ 8,000$\n` +
           `[8] 🕊️ لص مسالم ↜ 1,300$\n` +
           `[9] ☠️ سم عفريت ↜ 2,000$\n` +
           `[10] 🪙 نبيل الفقير ↜ 50$\n\n` +
           `📦 الصفحة 1/2\n` +
           `✨ رد بـ: [شراء الرقم العدد] أو [مزيد]\n●─────── ⌬ ───────●`;
  }

  return `●─── ⟪ 🏪 مَتْجَر القِتَال ⟫ ───●\n💰 أموالك: ${money.toLocaleString()}$\n\n` +
         `[11] 💀 اليمت حي ↜ 9,000$\n` +
         `[12] 🌑 رائحة عالم سفلية ↜ 11,000$\n` +
         `[13] ⚫ هاكاي ↜ 4,800$\n` +
         `[14] 🛡️ تدريع ↜ 7,200$\n` +
         `[15] 🕊️ رحيم ↜ 4,500$\n` +
         `[16] ❌ الخطأ ↜ 20,000$\n` +
         `[17] ⚡ السريع ↜ 9,000$\n` +
         `[18] 👑 اللورد ↜ 9,600$\n\n` +
         `📦 الصفحة 2/2\n` +
         `✨ رد بـ: [شراء الرقم العدد] أو [مزيد]\n●─────── ⌬ ───────●`;
}

function battleUI(p1, p2, turn, action, bet) {
  return `●─── ⟪ ⚔️ 𝐁𝐀𝐓𝐓𝐋𝐄 ⚔️ ⟫ ───●\n` +
         `👤 ${p1.tag}\n❤️ ${createBar(p1.hp, p1.maxHp)} [${p1.hp}/${p1.maxHp}]\n⚡ ${createBar(p1.energy, p1.maxEnergy)} [${p1.energy}/${p1.maxEnergy}]\n` +
         `────────────────\n` +
         `👤 ${p2.tag}\n❤️ ${createBar(p2.hp, p2.maxHp)} [${p2.hp}/${p2.maxHp}]\n⚡ ${createBar(p2.energy, p2.maxEnergy)} [${p2.energy}/${p2.maxEnergy}]\n` +
         `────────────────\n` +
         `${bet > 0 ? `💰 الرهان: ${bet.toLocaleString()}$\n` : ""}` +
         `📜 ${action}\n⏳ الدور الحالي: ${turn.tag}\n` +
         `────────────────\n` +
         `🎮 الحركات: [هجوم - دفاع - شحن - استسلام]\n●─────── ⌬ ───────●`;
}

// ════════════════════════════════════════
// 🎮 الدوال التنفيذية الأساسية
// ════════════════════════════════════════

async function runCommand({ api, event, args, Currencies }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  if (global.rioBattle.has(threadID)) {
    return api.sendMessage(`⚠️ | هناك معركة جارية بالفعل في هذه المجموعة!`, threadID, messageID);
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
    return api.sendMessage("❌ | يرجى الرد على رسالة الخصم أو الإشارة إليه بالمنشن!", threadID, messageID);
  }

  if (targetID == senderID) {
    return api.sendMessage("❌ | لا يمكنك قتال نفسك يا بطل!", threadID, messageID);
  }

  const bet = parseInt(args[0]) || 0;

  if (bet <= 0) {
    const battle = {
      p1: { id: senderID, tag: "𝑷𝑳𝑨𝒀𝑬𝑹 1", hp: 120, maxHp: 120, energy: 0, maxEnergy: 100, transformed: false, defending: false },
      p2: { id: targetID, tag: "𝑶𝑷𝑷𝑶𝑵𝑬𝑵𝑻", hp: 120, maxHp: 120, energy: 0, maxEnergy: 100, transformed: false, defending: false },
      turn: senderID,
      bet: 0,
      lastAction: Date.now()
    };

    global.rioBattle.set(threadID, battle);
    refreshBattleTimeout(api, threadID);

    return api.sendMessage(
      battleUI(battle.p1, battle.p2, battle.p1, `🔥 انطلقت المعركة الملحمية! المبادرة لـ 𝑷𝑳𝑨𝒀𝑬𝑹 1`, 0),
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

  return api.sendMessage(
    `●─── ⟪ ⚔️ تَحَدِّي قِتَال ⟫ ───●\n👤 تحدي جديد من 𝑷𝑳𝑨𝒀𝑬𝑹 1\n💰 الرهان: ${bet.toLocaleString()}$\n\n✨ يرجى من الخصم الرد بكلمة [قبول] لتبدأ الملحمة!`,
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: "قتال",
        type: "accept",
        challenger: senderID,
        target: targetID,
        bet,
        messageID: info.messageID
      });
    },
    messageID
  );
}

async function replyCommand({ api, event, handleReply, Currencies }) {
  const { threadID, senderID, body, messageID } = event;
  const input = body ? body.trim() : "";

  if (handleReply.type == "shop") {
    if (senderID != handleReply.author) return;

    if (input == "مزيد") {
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

    if (input.startsWith("شراء")) {
      const split = input.split(" ");
      const itemID = parseInt(split[1]);
      const amount = parseInt(split[2]) || 1;

      if (!SHOP[itemID]) {
        return api.sendMessage("❌ | العنصر المحدد غير موجود بالمتجر!", threadID, messageID);
      }

      const item = SHOP[itemID];
      const total = item.price * amount;
      const data = await Currencies.getData(senderID);

      if (data.money < total) {
        return api.sendMessage("❌ | أموالك لا تكفي لإتمام هذه الشروة!", threadID, messageID);
      }

      await Currencies.setData(senderID, { money: data.money - total });

      if (item.skill) {
        const skills = getSkills(senderID);
        if (skills.find(x => x.command == item.command)) {
          return api.sendMessage("❌ | أنت تمتلك هذه المهارة بالفعل!", threadID, messageID);
        }
        skills.push({ name: item.name, command: item.command });
      } else {
        const bag = getBag(senderID);
        if (!bag[item.name]) bag[item.name] = 0;
        bag[item.name] += amount;
      }

      return api.sendMessage(`✅ | تـم شـراء: ${item.name} × ${amount}\n💰 المتبقي في جيبك: ${(data.money - total).toLocaleString()}$`, threadID, messageID);
    }
  }

  if (handleReply.type == "accept") {
    if (senderID != handleReply.target) return;
    if (input != "قبول") return;

    if (global.rioBattle.has(threadID)) {
      return api.sendMessage("❌ | توجد معركة جارية بالفعل في هذه المجموعة!", threadID, messageID);
    }

    const battle = {
      p1: { id: handleReply.challenger, tag: "𝑷𝑳𝑨𝒀𝑬𝑹 1", hp: 120, maxHp: 120, energy: 0, maxEnergy: 100, transformed: false, defending: false },
      p2: { id: handleReply.target, tag: "𝑶𝑷𝑷𝑶𝑵𝑬𝑵𝑻", hp: 120, maxHp: 120, energy: 0, maxEnergy: 100, transformed: false, defending: false },
      turn: handleReply.challenger,
      bet: handleReply.bet,
      lastAction: Date.now()
    };

    global.rioBattle.set(threadID, battle);
    refreshBattleTimeout(api, threadID);

    return api.sendMessage(
      battleUI(battle.p1, battle.p2, battle.p1, "🔥 تم قبول التحدي! بدأت المواجهة الضارية الآن.", battle.bet),
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

    const { p1, p2 } = battle;
    if (senderID != p1.id && senderID != p2.id) return;

    const attacker = senderID == p1.id ? p1 : p2;
    const defender = senderID == p1.id ? p2 : p1;

    if (battle.turn != senderID) return;
    refreshBattleTimeout(api, handleReply.key);

    // --- [ نظام حركة الاستسلام ] ---
    if (input == "استسلام") {
      if (battle.timeout) clearTimeout(battle.timeout);
      global.rioBattle.delete(handleReply.key);

      if (battle.bet > 0) {
        const winnerData = await Currencies.getData(defender.id);
        await Currencies.setData(defender.id, {
          money: winnerData.money + (battle.bet * 2)
        });
      }

      return api.sendMessage(
        `🏳️ | رَايَة بَيْضَاء\n🏳️ رفع اللاعب [ ${attacker.tag} ] الراية البيضاء واختار الانسحاب!\n👑 الفائز بالنزال: [ ${defender.tag} ]\n\n${battle.bet > 0 ? `💰 الجائزة النقدية: ${(battle.bet * 2).toLocaleString()}$` : "🎖️ قتال ودي"}`,
        threadID,
        messageID
      );
    }

    // --- [ نظام مهارة هاكاي المخفية ] ---
    if (input.toLowerCase() == "هاكاي") {
      const skills = getSkills(senderID);
      const hasHakai = skills.find(x => x.command == "هاكاي");

      if (!hasHakai) {
        return api.sendMessage("❌ | أنت لا تملك مهارة الهاكاي في حقيبتك! يمكنك اقتناؤها من المتجر أولاً.", threadID, messageID);
      }

      if (attacker.energy < 80) {
        return api.sendMessage(`⚠️ | طاقة الأنا غير كافية! تحتاج إلى 80 طاقة لتفعيل الهاكاي (طاقتك الحالية: ${attacker.energy})`, threadID, messageID);
      }

      let hakaiDamage = Math.floor(Math.random() * 25) + 35; 
      defender.hp = Math.max(0, defender.hp - hakaiDamage);
      attacker.energy -= 80;

      let status = `⚫ | بـيـد الـمـحـو..\nأطلق [ ${attacker.tag} ] مهارة الـهـاكـاي المدمرة ومحا ${hakaiDamage} نقطة من حياة [ ${defender.tag} ]!`;

      if (defender.hp <= 0) {
        return checkWinner(api, threadID, battle, attacker, defender, Currencies, messageID);
      }

      battle.turn = defender.id;
      global.rioBattle.set(handleReply.key, battle);
      return api.sendMessage(battleUI(p1, p2, defender, status, battle.bet), threadID, (err, info) => {
        global.client.handleReply.push({ name: "قتال", type: "battle", key: handleReply.key, messageID: info.messageID });
      });
    }

    let status = "";

    if (input == "هجوم") {
      let damage = Math.floor(Math.random() * 12) + 8;
      if (attacker.transformed) damage *= 1.5;

      defender.hp = Math.max(0, defender.hp - damage);
      attacker.energy = Math.min(100, attacker.energy + 15);
      status = `⚔️ | [ ${attacker.tag} ] يوجه ضربة خاطفة ويلحق ${damage} ضرر بـ [ ${defender.tag} ]!`;
    } else if (input == "دفاع") {
      attacker.energy = Math.min(100, attacker.energy + 10);
      status = `🛡️ | [ ${attacker.tag} ] يحكم دفاعاته لتقليص الضرر وشحن طاقته الداخلية!`;
    } else if (input == "شحن") {
      attacker.energy = Math.min(100, attacker.energy + 30);
      status = `⚡ | [ ${attacker.tag} ] يركز هيبته ويرفع طاقته بمقدار 30 نقطة كاملة!`;
    } else {
      return api.sendMessage("⚠️ | خطأ في الحركة! يرجى الرد باختيار صحيح: [هجوم - دفاع - شحن - استسلام]، أو المهارة الخاصة بك.", threadID, messageID);
    }

    if (defender.hp <= 0) {
      return checkWinner(api, threadID, battle, attacker, defender, Currencies, messageID);
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

// دالة مساعدة لإنهاء المعركة وإعلان الفائز
async function checkWinner(api, threadID, battle, attacker, defender, Currencies, messageID) {
  if (battle.timeout) clearTimeout(battle.timeout);
  global.rioBattle.delete(threadID);

  if (battle.bet > 0) {
    const winner = await Currencies.getData(attacker.id);
    await Currencies.setData(attacker.id, {
      money: winner.money + (battle.bet * 2)
    });
  }

  return api.sendMessage(
    `●─── ⟪ 🏆 نِهَايَة المَعْرَكَة ⟫ ───●\n👑 الفائز الساحق: [ ${attacker.tag} ]\n💀 المهزوم المنكوب: [ ${defender.tag} ]\n\n${battle.bet > 0 ? `💰 الجائزة النقدية: ${(battle.bet * 2).toLocaleString()}$` : "🎖️ مواجهة ودية بدون رهان"}`,
    threadID,
    messageID
  );
}

// ════════════════════════════════════════
// 📤 التصدير المزدوج لضمان التوافق التام
// ════════════════════════════════════════

module.exports = {
  config: {
    name: "قتال",
    version: "14.5.0",
    role: 0,
    author: "عبدو",
    description: "نظام قتال PvP بألقاب مزخرفة ثابتة للطرفين لمنع أخطاء الأسماء",
    category: "ألعاب",
    usages: "[منشن/رد] [رهان]",
    cooldown: 5
  },

  onCall: runCommand,
  onReply: replyCommand,
  run: runCommand,
  handleReply: replyCommand
};
