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

// مصفوفة البيانات الشاملة للمناجم العالمية
const mines = [
  { name: "سهل الملح", country: "الصين", resource: "الليثيوم 🔋", flag: "🇨🇳", min: 180, max: 400 },
  { name: "رواند كوبر", country: "زامبيا", resource: "النحاس 🟠", flag: "🇿🇲", min: 90, max: 200 },
  { name: "تشيمفونشي", country: "زامبيا", resource: "النحاس 🟠", flag: "🇿🇲", min: 95, max: 220 },
  { name: "نورلسك", country: "روسيا", resource: "النيكل 🔗", flag: "🇷🇺", min: 220, max: 500 },
  { name: "سوبر بيت", country: "أستراليا", resource: "الذهب ⛏️", flag: "🇦🇺", min: 200, max: 450 },
  { name: "مهد الذهب", country: "السعودية", resource: "الذهب ⛏️", flag: "🇸🇦", min: 140, max: 320 },
  { name: "كوبر بيلت", country: "زامبيا", resource: "النحاس 🟠", flag: "🇿🇲", min: 110, max: 250 },
  { name: "موريوس", country: "تركيا", resource: "الكروك 🔷", flag: "🇹🇷", min: 80, max: 190 },
  { name: "كارتييه", country: "كندا", resource: "الماس 💠", flag: "🇨🇦", min: 300, max: 700 },
  { name: "أرغيل", country: "أستراليا", resource: "الماس الوردي 🌸", flag: "🇦🇺", min: 350, max: 800 },
  { name: "بو غافر", country: "المغرب", resource: "الفضة ⚪", flag: "🇲🇦", min: 120, max: 280 },
  { name: "خريبكة", country: "المغرب", resource: "الفوسفات 🧪", flag: "🇲🇦", min: 100, max: 240 },
  { name: "غار جبيلات", country: "الجزائر", resource: "الحديد 🏗️", flag: "🇩🇿", min: 90, max: 210 },
  { name: "السكرية", country: "مصر", resource: "الذهب 📀", flag: "🇪🇬", min: 150, max: 340 },
  { name: "كاتانغا", country: "الكونغو", resource: "الكوبالت 🔵", flag: "🇨🇩", min: 180, max: 420 },
  { name: "أورال", country: "روسيا", resource: "البلاتين 💎", flag: "🇷🇺", min: 250, max: 550 },
  { name: "تشوكويكاماتا", country: "تشيلي", resource: "النحاس 🟠", flag: "🇨🇱", min: 130, max: 300 },
  { name: "إسكونديدا", country: "تشيلي", resource: "النحاس 🟤", flag: "🇨🇱", min: 140, max: 310 },
  { name: "مورونتاو", country: "أوزبكستان", resource: "الذهب ⛏️", flag: "🇺🇿", min: 160, max: 360 },
  { name: "غراسبيرغ", country: "إندونيسيا", resource: "ذهب ونحاس 🟡", flag: "🇮🇩", min: 190, max: 430 },
  { name: "كولار", country: "الهند", resource: "الذهب 📀", flag: "🇮🇳", min: 110, max: 260 },
  { name: "تاوتونا", country: "جنوب أفريقيا", resource: "الذهب العميق ⛏️", flag: "🇿🇦", min: 200, max: 470 },
  { name: "فينيتيا", country: "جنوب أفريقيا", resource: "الماس 💠", flag: "🇿🇦", min: 280, max: 600 },
  { name: "ساكاشيوان", country: "كندا", resource: "البوتاس 🧱", flag: "🇨🇦", min: 85, max: 180 },
  { name: "كيرونا", country: "السويد", resource: "الحديد 🏗️", flag: "🇸🇪", min: 105, max: 230 },
  { name: "هامرسلي", country: "أستراليا", resource: "الحديد 🧱", flag: "🇦🇺", min: 95, max: 215 },
  { name: "كارينغتون", country: "أمريكا", resource: "الفحم 🏴", flag: "🇺🇸", min: 70, max: 160 },
  { name: "بينغهام", country: "أمريكا", resource: "النحاس 🟠", flag: "🇺🇸", min: 125, max: 290 },
  { name: "يواكيمستال", country: "التشيك", resource: "اليورانيوم ☢️", flag: "🇨🇿", min: 400, max: 900 },
  { name: "موجوك", country: "ميانمار", resource: "الياقوت 🍎", flag: "🇲🇲", min: 320, max: 750 },
  { name: "كولمانسكوب", country: "ناميبيا", resource: "الماس الرملي 💠", flag: "🇳🇦", min: 260, max: 580 },
  { name: "بانيوادي", country: "ماليزيا", resource: "القصدير 🔩", flag: "🇲🇾", min: 80, max: 175 },
  { name: "سيتوكا", country: "البرازيل", resource: "الحديد 🏗️", flag: "🇧🇷", min: 90, max: 200 },
  { name: "سیرا بیلادا", country: "البرازيل", resource: "الذهب ⛏️", flag: "🇧🇷", min: 170, max: 390 },
  { name: "تاريكا", country: "بوليفيا", resource: "القصدير 🔗", flag: "🇧🇴", min: 75, max: 165 },
  { name: "أوجوي", country: "الغابون", resource: "المنغنيز ⛓️", flag: "🇬🇦", min: 115, max: 255 },
  { name: "توليار", country: "مدغشقر", resource: "الأحجار الكريمة 💎", flag: "🇲🇬", min: 300, max: 680 },
  { name: "كيتوي", country: "زامبيا", resource: "الزمرد 💚", flag: "🇿🇲", min: 340, max: 780 },
  { name: "بوشفيلد", country: "جنوب أفريقيا", resource: "الكروم 🔹", flag: "🇿🇦", min: 130, max: 295 },
  { name: "كولي نان", country: "تايلاند", resource: "الزنك 🔗", flag: "🇹🇭", min: 85, max: 190 }
];

// مسار مستقل لحفظ كولداون المناجم لعدم تداخل قواعد البيانات
const cooldownPath = require("path").join(process.cwd(), "database", "mines_cooldowns.json");

function getCooldownData() {
  try {
    if (!fs.existsSync(cooldownPath)) {
      fs.ensureDirSync(require("path").dirname(cooldownPath));
      fs.writeJsonSync(cooldownPath, {});
    }
    return fs.readJsonSync(cooldownPath);
  } catch (e) {
    return {};
  }
}

module.exports.config = {
  name: "منجم",
  aliases: ["المناجم", "تعدين", "عمل_منجم"],
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Abdou / ريم بوت",
  description: "العمل في ثمانية مناجم عشوائية فريدة وجني الأموال كل 6 ساعات",
  commandCategory: "العاب",
  usages: "",
  cooldowns: 5
};

// ══════════════════════════════════════════
// HANDLE REPLY (معالجة اختيار المنجم)
// ══════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply, Economy }) {
  const { body, senderID, threadID, messageID } = event;

  if (String(senderID) !== String(handleReply.author)) return;

  const choice = parseInt(body.trim());
  const userMines = handleReply.userMines;

  if (!userMines || isNaN(choice) || choice < 1 || choice > userMines.length) {
    return api.sendMessage(`⚠️ خيار غير صحيح! يرجى اختيار رقم متاح بين 1 و ${userMines.length}.`, threadID, messageID);
  }

  const selectedMine = userMines[choice - 1];
  const salary = Math.floor(Math.random() * (selectedMine.max - selectedMine.min + 1)) + selectedMine.min;

  try {
    // 1. تسجيل الكولداون في ملف الـ JSON المخصص
    let cooldownData = getCooldownData();
    cooldownData[String(senderID)] = Date.now();
    fs.writeJsonSync(cooldownPath, cooldownData);

    // 2. إضافة الأموال مباشرة كـ (money) متوافق تماماً مع ملف بنكك
    await Economy.increase(parseInt(salary), senderID, "money");

    // حذف قائمة الاختيارات السابقة
    if (handleReply.messageID) {
      api.unsendMessage(handleReply.messageID).catch(() => {});
    }

    const successMessage = BOX(
      "تَمَّ الْعَمَلُ بِنَجَاحٍ ⛏️",
      [
        `الْمَنْجَمُ: منجم ${selectedMine.name} ${selectedMine.flag || "🌍"}`,
        `الْمَوْقِعُ: ${selectedMine.country}`,
        `الْمَوْرِدُ: ${selectedMine.resource}`,
        ``,
        `💰 الأَجْرُ الْمُكْتَسَبُ: ${salary.toLocaleString()} $`
      ],
      ["أداء ممتاز يا بطل! ريم تفخر بجهودك المتواصلة."]
    );

    return api.sendMessage(successMessage, threadID, messageID);
  } catch (error) {
    console.error("[MINING ECONOMY ERROR]", error);
    return api.sendMessage("❌ عذراً عيني حدث خطأ أثناء تسجيل الأجر في البنك.", threadID, messageID);
  }
};

// ══════════════════════════════════════════
// MAIN RUN (المعالج الأساسي للأمر)
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const cooldownTime = 6 * 60 * 60 * 1000; // 6 ساعات

  let cooldownData = getCooldownData();
  const lastMine = cooldownData[String(senderID)] || 0;

  if (Date.now() - lastMine < cooldownTime) {
    const timeLeft = cooldownTime - (Date.now() - lastMine);
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return api.sendMessage(
      BOX("⏳ الْمَنْجَمُ مُغْلَقٌ", [
        "عذراً، المناجم مغلقة الآن لأعمال الصيانة والراحة.",
        `يرجى العودة بعد: ${hours} ساعة و ${minutes} دقيقة.`
      ]),
      threadID, messageID
    );
  }

  const shuffled = [...mines].sort(() => 0.5 - Math.random());
  const selectedForUser = shuffled.slice(0, 8);

  let lines = ["قم بالرد على هذه الرسالة برقم المنجم للبدء في التنقيب:"];

  selectedForUser.forEach((m, index) => {
    lines.push(`[${index + 1}] منجم ${m.name} ${m.flag || "🌍"}`);
    lines.push(`    🌍 البلد: ${m.country} | 🔋 المورد: ${m.resource}`);
    lines.push(`    💰 نطاق الأجر: ${m.min}$ — ${m.max}$`);
    if (index < selectedForUser.length - 1) lines.push(""); 
  });

  const menuMsg = BOX("اخْتَرْ مَنْجَمَكَ ⛏️", lines, ["اكتب الرقم فقط لبدء العمل"]);

  return api.sendMessage(menuMsg, threadID, (err, info) => {
    if (!err && info) {
      const replyObj = {
        name: "منجم",
        messageID: info.messageID,
        author: senderID,
        userMines: selectedForUser
      };

      if (global.client && global.client.handleReply) {
        global.client.handleReply.push(replyObj);
      } else if (global.Mirai && global.Mirai.handleReply) {
        global.Mirai.handleReply.push(replyObj);
      } else {
        if (!global.handleReply) global.handleReply = [];
        global.handleReply.push(replyObj);
      }
    }
  }, messageID);
};
