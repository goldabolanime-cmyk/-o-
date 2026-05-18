const fs = require("fs-extra");
const path = require("path");

// ════════════════════════════════════════
//          🌾 REM BOT FARM SYSTEM 🌾
//        نظام مزرعة ريم الأسطوري V8.5
// ════════════════════════════════════════

function frame(title, content) {
  return `●─────── ✾ ───────●
 ⦿ ⟬ ${title} ⟭ ⦿
⊱ ────────────── ⊰
${content}
●─────── ✾ ───────●`;
}

module.exports.config = {
  name: "مزرعتي",
  version: "8.5.0",
  hasPermssion: 0,
  credits: "Abdou / REM BOT",
  description: "نظام مزرعة اقتصادي ضخم ومتطور ومصلح بالكامل",
  commandCategory: "العاب",
  usages: "[زرع/حصاد/شراء/بيع/حالة/مخزن/زريبة/اطعام/تطوير/عمال/مطر/يومي/سرقة/تجارة/مهمة]",
  cooldowns: 5
};

// ════════════════ قاعدة البيانات ════════════════

const dataPath = path.join(__dirname, "cache", "farmSystem.json");

if (!fs.existsSync(dataPath)) {
  fs.ensureDirSync(path.dirname(dataPath));
  fs.writeFileSync(dataPath, JSON.stringify({}));
}

function loadData() {
  return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// ════════════════ المزروعات ════════════════

const crops = {
  قمح: { price: 500, sell: 1200, growTime: 1800000, emoji: "🌾", xp: 5 },
  ذرة: { price: 900, sell: 2100, growTime: 3600000, emoji: "🌽", xp: 7 },
  بطاطا: { price: 1400, sell: 3300, growTime: 5400000, emoji: "🥔", xp: 9 },
  طماطم: { price: 1800, sell: 4200, growTime: 7200000, emoji: "🍅", xp: 11 },
  بصل: { price: 2200, sell: 5000, growTime: 7600000, emoji: "🧅", xp: 12 },
  جزر: { price: 2600, sell: 6200, growTime: 8200000, emoji: "🥕", xp: 13 },
  بطيخ: { price: 3500, sell: 8500, growTime: 10800000, emoji: "🍉", xp: 15 },
  تفاح: { price: 4500, sell: 10500, growTime: 12800000, emoji: "🍎", xp: 17 },
  عنب: { price: 5500, sell: 12500, growTime: 14800000, emoji: "🍇", xp: 19 },
  ذهب: { price: 50000, sell: 120000, growTime: 86400000, emoji: "🏆", xp: 40 }
};

// ════════════════ الحيوانات (تمت إضافة المزيد) ════════════════

const animals = {
  أرنب: { price: 3000, reward: 1500, emoji: "🐇" },
  دجاجة: { price: 5000, reward: 3000, emoji: "🐔" },
  ماعز: { price: 9000, reward: 4500, emoji: "🐐" },
  ديك_رومي: { price: 12000, reward: 5500, emoji: "🦃" },
  خروف: { price: 15000, reward: 7000, emoji: "🐑" },
  بقرة: { price: 20000, reward: 9000, emoji: "🐄" },
  حصان: { price: 45000, reward: 22000, emoji: "🐎" },
  جمل: { price: 80000, reward: 38000, emoji: "🐫" }
};

const weatherList = [
  "☀️ مشمس",
  "🌧️ ممطر",
  "⛈️ عاصفة",
  "🌤️ معتدل",
  "❄️ بارد"
];

function formatTime(ms) {
  let sec = Math.floor(ms / 1000);
  let h = Math.floor(sec / 3600);
  sec %= 3600;
  let m = Math.floor(sec / 60);
  let s = sec % 60;
  return `${h}س ${m}د ${s}ث`;
}

// ════════════════ النظام الرئيسي ════════════════

module.exports.run = async function({ api, event, args, Economy, Users }) {
  const { threadID, messageID, senderID, type, messageReply } = event;
  const action = args[0] ? args[0].toLowerCase() : "";

  const data = loadData();

  // ════════════════ إنشاء بيانات المستخدم ════════════════

  if (!data[senderID]) {
    const name = await Users.getNameUser(senderID);

    data[senderID] = {
      owner: name,
      farmName: `مزرعة ${name} 🌾`,
      level: 1,
      xp: 0,
      moisture: 50,
      health: 100,
      workers: 0,
      barns: 1,
      landSize: 1,
      weather: weatherList[Math.floor(Math.random() * weatherList.length)],
      inventory: [],
      storage: [],
      animals: [],
      moneyEarned: 0,
      cropsHarvested: 0,
      lastDaily: 0,
      lastFeed: 0,
      planted: null,
      plantedAt: null,
      protection: false,
      energy: 100,
      thievesCaught: 0
    };

    saveData(data);
  }

  const farm = data[senderID];
  const currentMoney = await Economy.getBalance(senderID, "money");

  // ════════════════ القائمة الرئيسية ════════════════

  if (!action) {
    return api.sendMessage(frame(
      "أَوَامِرُ الْمَزْرَعَةِ 🌾",
`⟣ 🌱 مزرعتي زرع [النوع]
⟣ 🌾 مزرعتي حصاد
⟣ 💰 مزرعتي بيع
⟣ 📊 مزرعتي حالة
⟣ 🏪 مزرعتي شراء
⟣ 📦 مزرعتي مخزن
⟣ 🐄 مزرعتي زريبة
⟣ 🍖 مزرعتي اطعام
⟣ ⚒️ مزرعتي تطوير
⟣ 👨‍🌾 مزرعتي عمال
⟣ 🌧️ مزرعتي مطر
⟣ 🎁 مزرعتي يومي
⟣ 🥷 مزرعتي سرقة
⟣ 💱 مزرعتي تجارة
⟣ 📜 مزرعتي مهمة`
    ), threadID, messageID);
  }

  switch(action) {

    // ════════════════ شراء ════════════════

    case "شراء": {
      if (!args[1]) {
        let text = "🛒 متجر البذور:\n\n";
        for (const crop in crops) {
          text += `⟣ ${crops[crop].emoji} ${crop} ↜ ${crops[crop].price.toLocaleString()}$\n`;
        }

        text += "\n🐄 الحيوانات المتاحة:\n\n";
        for (const animal in animals) {
          text += `⟣ ${animals[animal].emoji} ${animal} ↜ ${animals[animal].price.toLocaleString()}$\n`;
        }

        return api.sendMessage(frame("المتجر 🏪", text), threadID, messageID);
      }

      const item = args[1];

      // شراء محصول
      if (crops[item]) {
        if (currentMoney < crops[item].price) {
          return api.sendMessage(frame(
            "الرصيد غير كافٍ 💸",
            `تحتاج ${crops[item].price.toLocaleString()}$`
          ), threadID, messageID);
        }

        await Economy.decrease(crops[item].price, senderID, "money");
        farm.inventory.push(item);
        saveData(data);

        return api.sendMessage(frame(
          "تم الشراء ✅",
          `اشتريت بذور: ${item} ${crops[item].emoji}`
        ), threadID, messageID);
      }

      // شراء حيوان
      if (animals[item]) {
        if (currentMoney < animals[item].price) {
          return api.sendMessage(frame(
            "الرصيد غير كافٍ 💸",
            `تحتاج ${animals[item].price.toLocaleString()}$`
          ), threadID, messageID);
        }

        await Economy.decrease(animals[item].price, senderID, "money");
        farm.animals.push(item);
        saveData(data);

        return api.sendMessage(frame(
          "تم شراء الحيوان 🐄",
          `اشتريت ${item} ${animals[item].emoji} وأضيف للزريبة!`
        ), threadID, messageID);
      }

      return api.sendMessage(frame(
        "غير موجود ❌",
        "العنصر المحدد غير متوفر في قائمة المتجر."
      ), threadID, messageID);
    }

    // ════════════════ زرع ════════════════

    case "زرع": {
      const cropName = args.slice(1).join(" ");

      if (!cropName)
        return api.sendMessage(frame(
          "الزراعة 🌱",
          "يرجى تحديد اسم المحصول المراد زرعه."
        ), threadID, messageID);

      if (!farm.inventory.includes(cropName)) {
        return api.sendMessage(frame(
          "لا تملك البذور ❌",
          `لا تملك بذور ${cropName} في مخزن بذورك.`
        ), threadID, messageID);
      }

      if (farm.planted) {
        return api.sendMessage(frame(
          "الأرض مشغولة 🌾",
          `يوجد محصول مزروع حالياً ولم يحصد بعد: ${farm.planted}`
        ), threadID, messageID);
      }

      farm.planted = cropName;
      farm.plantedAt = Date.now();

      // إزالة حبة بذور واحدة فقط من المخزن التفاعلي البسيط
      const index = farm.inventory.indexOf(cropName);
      if (index > -1) farm.inventory.splice(index, 1);

      saveData(data);

      return api.sendMessage(frame(
        "تمت الزراعة 🌱",
        `زرعت بنجاح ${cropName} ${crops[cropName].emoji}، انتظر حتى ينضج!`
      ), threadID, messageID);
    }

    // ════════════════ حصاد ════════════════

    case "حصاد": {
      if (!farm.planted) {
        return api.sendMessage(frame(
          "لا يوجد زرع ❌",
          "الأرض قاحلة حالياً، قم بالزراعة أولاً."
        ), threadID, messageID);
      }

      const cropData = crops[farm.planted];
      const passed = Date.now() - farm.plantedAt;

      if (passed < cropData.growTime) {
        return api.sendMessage(frame(
          "المحصول لم ينضج ⏳",
          `المحصول ينمو الآن. المتبقي: ${formatTime(cropData.growTime - passed)}`
        ), threadID, messageID);
      }

      // إرسال المحصول للمخزن أولاً لكي يستطيع بيعه لاحقاً
      farm.storage.push(farm.planted);
      farm.cropsHarvested += 1;
      farm.xp += cropData.xp;

      // تغيير الطقس تلقائياً عند الحصاد كنوع من التجديد البيئي
      farm.weather = weatherList[Math.floor(Math.random() * weatherList.length)];

      // معالجة التطوير ومستوى الـ XP التراكمي العادل دون تصفير مطلق
      const xpNeeded = farm.level * 50;
      if (farm.xp >= xpNeeded) {
        farm.level += 1;
        farm.xp -= xpNeeded; // أخذ الباقي بدلاً من تصفيره كلياً
      }

      const harvested = farm.planted;
      farm.planted = null;
      farm.plantedAt = null;

      saveData(data);

      return api.sendMessage(frame(
        "تم الحصاد بنجاح 🌾",
`⟣ المحصول: ${harvested} ${cropData.emoji}
⟣ الحالة: تم نقله إلى المخزن بنجاح 📦
⟣ الخبرة: +${cropData.xp} XP
💡 استخدم [مزرعتي بيع] لتحويل محاصيل المخزن الكامنة إلى كاش!`
      ), threadID, messageID);
    }

    // ════════════════ بيع (الميزة المصلحة بالكامل) ════════════════

    case "بيع": {
      if (!farm.storage || farm.storage.length === 0) {
        return api.sendMessage(frame(
          "المخزن فارغ 📦",
          "لا توجد محاصيل ناضجة في مخزنك لبيعها للبلدية حالياً."
        ), threadID, messageID);
      }

      let totalPayout = 0;
      const soldCropsCount = farm.storage.length;

      // حساب الأسعار الإجمالية لكل المحاصيل المتواجدة بالمخزن تفصيلياً
      farm.storage.forEach(cropName => {
        if (crops[cropName]) {
          totalPayout += crops[cropName].sell;
        }
      });

      // إضافة بونس مكافأة العمال المحترفين للإنتاجية الكلية
      const workersBonus = farm.workers * 1000;
      totalPayout += workersBonus;

      await Economy.increase(totalPayout, senderID, "money");

      // تسجيل الإحصائيات والأرباح التراكمية الكلية للمزارع
      farm.moneyEarned += totalPayout;
      farm.storage = []; // تصفير وإخلاء المخزن تماماً بعد البيع الشامل

      saveData(data);

      return api.sendMessage(frame(
        "صفقة بيع ناجحة 💰",
`⟣ عدد المحاصيل المباعة: ${soldCropsCount} محصول
⟣ مكافأة طاقم العمال: +${workersBonus.toLocaleString()}$
⟣ إجمالي الكاش المستلم: +${totalPayout.toLocaleString()}$ ✅`
      ), threadID, messageID);
    }

    // ════════════════ الحالة ════════════════

    case "حالة": {
      let growth = 0;
      if (farm.planted) {
        const cropData = crops[farm.planted];
        growth = Math.min(100, Math.floor(((Date.now() - farm.plantedAt) / cropData.growTime) * 100));
      }

      return api.sendMessage(frame(
        "حالة المزرعة 📊",
`⟣ 👤 المالك: ${farm.owner}
⟣ 🏡 الاسم: ${farm.farmName}
⟣ 📈 المستوى: ${farm.level}
⟣ ⭐ الخبرة: ${farm.xp} / ${farm.level * 50} XP
⟣ 💧 الرطوبة: ${farm.moisture}%
⟣ ❤️ الصحة: ${farm.health}/100
⟣ ⚡ الطاقة: ${farm.energy}/100
⟣ 👨‍🌾 العمال: ${farm.workers} عمال
⟣ 🏚️ الحظائر: ${farm.barns}
⟣ 🌦️ الطقس الحالي: ${farm.weather}
⟣ 🌱 المزروع: ${farm.planted || "لا يوجد"}
⟣ 📊 نسبة النمو: ${growth}%
⟣ 💰 أرباح البيع الكلية: ${farm.moneyEarned.toLocaleString()}$
⟣ 🌾 إجمالي مرات الحصاد: ${farm.cropsHarvested}`
      ), threadID, messageID);
    }

    // ════════════════ العمال ════════════════

    case "عمال": {
      const price = 15000;

      if (currentMoney < price) {
        return api.sendMessage(frame(
          "الرصيد غير كافٍ 💸",
          `قيمة العقد للتوظيف هي ${price.toLocaleString()}$`
        ), threadID, messageID);
      }

      await Economy.decrease(price, senderID, "money");
      farm.workers += 1;
      saveData(data);

      return api.sendMessage(frame(
        "تم توظيف عامل 👨‍🌾",
        `تمت إضافة عامل محترف لمزرعتك لتسريع الأرباح! العدد الحالي: ${farm.workers}`
      ), threadID, messageID);
    }

    // ════════════════ المطر ════════════════

    case "مطر": {
      const random = Math.floor(Math.random() * 20) + 5;
      farm.moisture = Math.min(100, farm.moisture + random);
      farm.weather = "🌧️ ممطر";

      saveData(data);

      return api.sendMessage(frame(
        "هطلت الأمطار 🌧️",
        `تحول الطقس إلى ممطر وازدادت رطوبة التربة بمقدار ${random}%`
      ), threadID, messageID);
    }

    // ════════════════ اليومي ════════════════

    case "يومي": {
      const now = Date.now();

      if (now - farm.lastDaily < 86400000) {
        const remain = 86400000 - (now - farm.lastDaily);
        return api.sendMessage(frame(
          "المكافأة اليومية ⏳",
          `تستطيع استلام الدعم اليومي بعد: ${formatTime(remain)}`
        ), threadID, messageID);
      }

      const reward = Math.floor(Math.random() * 20000) + 10000;
      await Economy.increase(reward, senderID, "money");
      farm.lastDaily = now;
      saveData(data);

      return api.sendMessage(frame(
        "المكافأة اليومية 🎁",
        `حصلت على الدعم الزراعي اليومي بقيمة: ${reward.toLocaleString()}$`
      ), threadID, messageID);
    }

    // ════════════════ السرقة ════════════════

    case "سرقة": {
      if (type !== "message_reply") {
        return api.sendMessage(frame(
          "سرقة المزارع 🥷",
          "الرجاء الرد على رسالة الضحية لتنفيذ خطة السرقة الليلية."
        ), threadID, messageID);
      }

      const targetID = messageReply.senderID;

      if (targetID === senderID) {
        return api.sendMessage(frame("خطأ في الخطة ❌", "لا يمكنك سرقة نفسك عيني!"), threadID, messageID);
      }

      if (!data[targetID]) {
        return api.sendMessage(frame(
          "لا يملك مزرعة ❌",
          "هذا الشخص لا يملك أي استثمار زراعي لسرقته."
        ), threadID, messageID);
      }

      const success = Math.random() < 0.45;

      if (!success) {
        farm.health = Math.max(0, farm.health - 10);
        saveData(data);
        return api.sendMessage(frame(
          "فشلت السرقة 🚔",
          "أمسك بك كلب الحراسة المطور وخسرت 10 من صحة المزرعة."
        ), threadID, messageID);
      }

      const amount = Math.floor(Math.random() * 15000) + 5000;
      await Economy.increase(amount, senderID, "money");
      saveData(data);

      return api.sendMessage(frame(
        "نجحت السرقة 🥷",
        `تسللت بنجاح وسرقت من خزنته مبلغ بقيمة: ${amount.toLocaleString()}$`
      ), threadID, messageID);
    }

    // ════════════════ التجارة ════════════════

    case "تجارة": {
      const entryFee = 8000; 

      if (currentMoney < entryFee) {
        return api.sendMessage(frame(
          "رأس مال غير كافٍ 💸",
          `تحتاج على الأقل ${entryFee.toLocaleString()}$ لدخول البورصة التجارية.`
        ), threadID, messageID);
      }

      const chance = Math.random();

      if (chance < 0.4) {
        await Economy.decrease(entryFee, senderID, "money");
        return api.sendMessage(frame(
          "خسارة تجارية 📉",
          `تعرضت أسهمك الزراعية لهبوط حاد وخسرت رأس مال الصفقة بقيمة: -${entryFee.toLocaleString()}$`
        ), threadID, messageID);
      }

      const reward = Math.floor(Math.random() * 50000) + 10000;
      await Economy.increase(reward, senderID, "money");

      return api.sendMessage(frame(
        "نجحت التجارة 📈",
        `أرباح الصفقة والمضاربة في السوق صعدت بك: +${reward.toLocaleString()}$`
      ), threadID, messageID);
    }

    // ════════════════ مهمة ════════════════

    case "مهمة": {
      const missions = [
        "قم بحصاد محصول واحد غالي الثمن",
        "قم بإطعام زريبتك الحيوانية المتكاملة",
        "قم بتطوير وتوسيع حجم الحظائر الخاصة بك",
        "قم بشراء جمل أو بقرة لدعم الأرباح الكلية"
      ];

      const randomMission = missions[Math.floor(Math.random() * missions.length)];

      return api.sendMessage(frame(
        "المهمة اليومية 📜",
        `المهمة الزراعية المسندة إليك اليوم:\n\n${randomMission}`
      ), threadID, messageID);
    }

    // ════════════════ اطعام ════════════════

    case "اطعام": {
      if (!farm.animals || farm.animals.length === 0) {
        return api.sendMessage(frame(
          "الزريبة فارغة ❌",
          "لا توجد حيوانات جائعة، اذهب واشترِ بعضها من المتجر أولاً."
        ), threadID, messageID);
      }

      const now = Date.now();

      if (now - farm.lastFeed < 3600000) {
        const remainFeed = 3600000 - (now - farm.lastFeed);
        return api.sendMessage(frame(
          "تم الإطعام مسبقاً ⏳",
          `الحيوانات شبعانة الآن، يمكنك إعادة الإطعام بعد: ${formatTime(remainFeed)}`
        ), threadID, messageID);
      }

      let totalReward = 0;
      farm.animals.forEach(ani => {
        if (animals[ani]) {
          totalReward += animals[ani].reward;
        }
      });

      await Economy.increase(totalReward, senderID, "money");
      farm.lastFeed = now;
      saveData(data);

      return api.sendMessage(frame(
        "تم الإنتاج والإنعاش 🐄",
        `أطعمت حيواناتك، وقامت بإنتاج الحليب والبيض والصوف المحسوب بـ: +${totalReward.toLocaleString()}$`
      ), threadID, messageID);
    }

    // ════════════════ تطوير ════════════════

    case "تطوير": {
      const price = farm.level * 15000;

      if (currentMoney < price) {
        return api.sendMessage(frame(
          "الرصيد غير كافٍ 💸",
          `تكلفة التطوير للمستوى التالي تحتاج: ${price.toLocaleString()}$`
        ), threadID, messageID);
      }

      await Economy.decrease(price, senderID, "money");

      farm.level += 1;
      farm.landSize += 1;
      farm.barns += 1;
      farm.health = 100; // إعادة ترميم صحة المزرعة بالكامل عند التطوير

      saveData(data);

      return api.sendMessage(frame(
        "تم التطوير والترقية ⚒️",
`⟣ المستوى المعماري الجديد: ${farm.level}
⟣ حجم الأراضي التوسيعية: ${farm.landSize} 🌍
⟣ حجم الحظائر الاستيعابية: ${farm.barns} 🏚️
⟣ صحة وهياكل المزرعة: 100% ❤️`
      ), threadID, messageID);
    }

    // ════════════════ المخزن ════════════════

    case "مخزن": {
      if (!farm.storage || farm.storage.length === 0) {
        return api.sendMessage(frame(
          "المخزن فارغ 📦",
          "لا توجد أي محاصيل محصودة بداخل الصناديق حالياً."
        ), threadID, messageID);
      }

      const counts = {};
      farm.storage.forEach(x => { counts[x] = (counts[x] || 0) + 1; });

      let text = "📋 محتويات مخزنك الحالية:\n\n";
      for (const item in counts) {
        const emo = crops[item] ? crops[item].emoji : "🌱";
        text += `⟣ ${emo} ${item} × ${counts[item]}\n`;
      }

      return api.sendMessage(frame("مخزن المحاصيل 📦", text), threadID, messageID);
    }

    // ════════════════ الزريبة ════════════════

    case "زريبة": {
      if (!farm.animals || farm.animals.length === 0) {
        return api.sendMessage(frame(
          "الزريبة فارغة 🐄",
          "لا يوجد أي كائن حي في زريبتك، اذهب لشرائهم."
        ), threadID, messageID);
      }

      const counts = {};
      farm.animals.forEach(x => { counts[x] = (counts[x] || 0) + 1; });

      let text = "📋 قائمة الحيوانات المستوطنة بالمزرعة:\n\n";
      for (const a in counts) {
        const emo = animals[a] ? animals[a].emoji : "🐾";
        text += `⟣ ${emo} ${a} × ${counts[a]}\n`;
      }

      return api.sendMessage(frame("الزريبة الحيوانية 🐄", text), threadID, messageID);
    }

    // ════════════════ افتراضي ════════════════

    default: {
      return api.sendMessage(frame(
        "أمر غير معروف ❌",
        "الخيارات المدخلة خاطئة، يرجى كتابة [مزرعتي] فقط لمراجعة اللائحة الشاملة للأوامر الصحيحة."
      ), threadID, messageID);
    }
  }
};
