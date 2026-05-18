module.exports.config = {
  name: "رصيدي",
  version: "1.2.6",
  hasPermssion: 0,
  credits: "عبدو",
  description: "نظام الرصيد: كشف، سرقة، تجسس، وتحويل أموال",
  commandCategory: "إقتصاد",
  usages: "[كشف / سرقة / تجسس / تحويل] (بالرد أو ذكر المبلغ)",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args, Economy, Users, Currencies }) {
  const { threadID, messageID, senderID, type, messageReply } = event;
  const moment = require("moment-timezone");

  // جلب رصيد الكاش الحالي عبر نظام Economy الخاص بك
  const userMoney = await Economy.getBalance(senderID, "money");

  // جلب البيانات الإضافية والإحصائيات عبر كائن Currencies المعتمد في السورس
  const userData = await Currencies.getData(senderID) || {};
  const userStats = userData.data || {};

  if (!userStats.steals_fail) userStats.steals_fail = 0;
  if (!userStats.steals_success) userStats.steals_success = 0;

  // 1. الحالة العادية (عرض الرصيد)
  if (args.length == 0) {
    const name = await Users.getNameUser(senderID);
    return api.sendMessage(`━━━━━━━━━━━━━━━
『 👤 』⟬ الاسم ↜ ${name} ⟭
『 💰 』⟬ الرصيد ↜ ${userMoney.toLocaleString()}$ ⟭
━━━━━━━━━━━━━━━`, threadID, messageID);
  }

  // 2. ميزة التحويل (رصيدي تحويل مبلغ - بالرد على الشخص)
  if (args[0] == "تحويل") {
    if (type !== "message_reply") return api.sendMessage("⚠️ يجب الرد على رسالة الشخص الذي تريد التحويل إليه!", threadID, messageID);

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) return api.sendMessage("⚠️ يرجى تحديد مبلغ صالح للتحويل!", threadID, messageID);
    if (userMoney < amount) return api.sendMessage(`❌ رصيدك لا يكفي! لديك فقط: ${userMoney.toLocaleString()}$`, threadID, messageID);

    const receiverID = messageReply.senderID;
    if (receiverID == senderID) return api.sendMessage("⚠️ لا يمكنك التحويل لنفسك ؛-؛", threadID, messageID);

    // عمليات الخصم والزيادة من نظام Economy الخاص بك للكاش
    await Economy.decrease(amount, senderID, "money");
    await Economy.increase(amount, receiverID, "money");

    const receiverName = await Users.getNameUser(receiverID);
    return api.sendMessage(`✅ تم تحويل ${amount.toLocaleString()}$ بنجاح إلى [ ${receiverName} ] 💸`, threadID, messageID);
  }

  // 3. ميزة الكشف (تطلب 20$)
  if (args[0] == "كشف") {
    if (userMoney < 20) return api.sendMessage("⚠️ لازم يكون عندك 20$ على الأقل للكشف!", threadID, messageID);
    await Economy.decrease(20, senderID, "money");
    return api.sendMessage("🔍 تم خصم 20$ وفحص سجلاتك.. رصيدك سليم ونظامي ✅", threadID, messageID);
  }

  // 4. ميزة السرقة (رد على الشخص لسرقته)
  if (args[0] == "سرقة") {
    if (type !== "message_reply") return api.sendMessage("⚠️ يجب الرد على رسالة الشخص الذي تريد سرقته!", threadID, messageID);

    const victimID = messageReply.senderID;
    const victimMoney = await Economy.getBalance(victimID, "money");

    if (victimMoney < 100) return api.sendMessage("❌ هذا الشخص طفران، لا يستحق عناء السرقة ؛-؛", threadID, messageID);

    const success = Math.random() < 0.15; 

    if (success) {
      const stolenAmount = Math.floor(victimMoney * 0.2); 
      await Economy.increase(stolenAmount, senderID, "money");
      await Economy.decrease(stolenAmount, victimID, "money");

      userStats.steals_success++;
      await Currencies.setData(senderID, { data: userStats });
      return api.sendMessage(`💰 عملية ناجحة! سرقت ${stolenAmount.toLocaleString()}$ من الضحية بنجاح 🥷`, threadID, messageID);
    } else {
      const fine = 80; 
      await Economy.decrease(fine, senderID, "money");

      userStats.steals_fail++;
      await Currencies.setData(senderID, { data: userStats });
      return api.sendMessage(`👮 تم القبض عليك! الغرامة: ${fine}$.. الحظ لم يحالفك هذه المرة 😭`, threadID, messageID);
    }
  }

  // 5. ميزة التجسس (تطلب 3000$ بالرد)
  if (args[0] == "تجسس") {
    if (userMoney < 3000) return api.sendMessage("⚠️ التجسس عملية مكلفة، تحتاج 3000$!", threadID, messageID);
    if (type !== "message_reply") return api.sendMessage("⚠️ رد على الشخص للتجسس على بياناته!", threadID, messageID);

    await Economy.decrease(3000, senderID, "money");
    const targetID = messageReply.senderID;

    // جلب البيانات عبر الاقتصاد وكائن الـ Currencies المخزن للسيرفر
    const targetMoney = await Economy.getBalance(targetID, "money");
    const targetData = await Currencies.getData(targetID) || {};
    const targetStats = targetData.data || {};
    const targetName = await Users.getNameUser(targetID);

    const bxBalance = targetStats.bx_balance || 0;
    const bxPrice = global.bx_market ? global.bx_market.price : 142704.17;
    const totalWealth = targetMoney + (targetStats.bank || 0) + (bxBalance * bxPrice);

    const spyMsg = `🕵️‍♂️ تَمَّ التَّجَسُّسُ بِنَجَاح على: [ ${targetName} ]
━━━━━━━━━━━━━━━
📊 تَجَسُّسُ الرَّصِيدِ:
💵 الْكَاش: ${targetMoney.toLocaleString()}$
🏦 الْبَنْك: ${(targetStats.bank || 0).toLocaleString()}$
🕒 التَّوْقِيت: ${moment.tz("Africa/Casablanca").format("hh:mm A")}
💎 الْبِيتْرِيكس: ${bxBalance} ✿
💰 إِجْمَالِي الْمَال: ${Math.floor(totalWealth).toLocaleString()}$
━━━━━━━━━━━━━━━
❌ سَرِقَاتٌ فَاشِلَة: ${targetStats.steals_fail || 0}
✅ سَرِقَاتٌ نَاجِحَة: ${targetStats.steals_success || 0}
━━━━━━━━━━━━━━━`;

    return api.sendMessage(spyMsg, threadID, messageID);
  }
};
