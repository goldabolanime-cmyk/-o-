const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "اعلام",
  aliases: ["علم", "العلام", "flag"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Abdou / Rem Bot",
  description: "لعبة تخمين أعلام الدول، تعطي 100$ لمن يعرف اسم علم الدولة الصحيح",
  commandCategory: "العاب البنك",
  usages: " ",
  cooldowns: 5
};

// الزخرفة الملكية المعتمدة لبوتك
const BOX = (title, lines, footer = null) => {
  let m = `●─────── ✾ ───────●\n ⦿ ⟬ ${title} ⟭ ⦿\n⊱ ────────────── ⊰\n`;
  for (const l of lines) { 
    if (!l && l !== 0) { m += `\n`; } 
    else { m += `  ⟣ ${l}\n`; } 
  }
  if (footer) { 
    m += `⊱ ────────────── ⊰\n`; 
    for (const f of footer) { 
      if (!f && f !== 0) { m += `\n`; } 
      else { m += `  ⟣ ${f}\n`; } 
    } 
  }
  return m + '●─────── ✾ ───────●';
};

// قاموس ترجمة مخصص لتسهيل التعرف على إجابات الأعضاء باللغة العربية
const countryTranslations = {
  "morocco": "المغرب",
  "egypt": "مصر",
  "palestine": "فلسطين",
  "algeria": "الجزائر",
  "tunisia": "تونس",
  "libya": "ليبيا",
  "sudan": "السودان",
  "saudi arabia": "السعودية",
  "iraq": "العراق",
  "syria": "سوريا",
  "jordan": "الأردن",
  "lebanon": "لبنان",
  "yemen": "اليمن",
  "oman": "عمان",
  "united arab emirates": "الإمارات",
  "qatar": "قطر",
  "bahrain": "البحرين",
  "kuwait": "الكويت",
  "mauritania": "موريتانيا",
  "somalia": "الصومال",
  "france": "فرنسا",
  "spain": "إسبانيا",
  "italy": "إيطاليا",
  "germany": "ألمانيا",
  "united kingdom": "بريطانيا",
  "united states": "أمريكا",
  "japan": "اليابان",
  "china": "الصين",
  "brazil": "البرازيل",
  "argentina": "الأرجنتين",
  "portugal": "البرتغال",
  "russia": "روسيا",
  "turkey": "تركيا",
  "canada": "كندا",
  "australia": "أستراليا",
  "india": "الهند",
  "south korea": "كوريا الجنوبية"
};

// ══════════════════════════════════════════
// MAIN RUN (بدء المسابقة)
// ══════════════════════════════════════════
module.exports.run = async function ({ api, event, Economy }) {
  const { threadID, messageID, senderID } = event;
  const cachePath = path.join(process.cwd(), "cache", `flag_${Date.now()}.png`);

  try {
    // جلب بيانات الدول من API الشهير والموثوق
    const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,flags");
    const countries = res.data;

    // تصفية وتحديد دولة عشوائية تحتوي على ترجمة عربية مدعومة في القاموس
    const validCountries = countries.filter(c => countryTranslations[c.name.common.toLowerCase()]);
    const randomCountry = validCountries[Math.floor(Math.random() * validCountries.length)];

    const englishName = randomCountry.name.common.toLowerCase();
    const arabicAnswer = countryTranslations[englishName]; // الإجابة الصحيحة المطلوبة بالمنظومة
    const flagImgUrl = randomCountry.flags.png;

    // تحميل صورة العلم مؤقتاً في الكاش
    const imgData = (await axios.get(flagImgUrl, { responseType: "arraybuffer" })).data;
    fs.ensureDirSync(path.dirname(cachePath));
    fs.writeFileSync(cachePath, Buffer.from(imgData));

    const msgText = BOX("🏁 خَمِّنْ عَلَمَ الدَّوْلَةِ", [
      "قم بالرد على هذه الرسالة باسم الدولة الصحيح.",
      "💰 الجائزة: 100$"
    ], ["أمامك محاولة واحدة سريعة!"]);

    return api.sendMessage({
      body: msgText,
      attachment: fs.createReadStream(cachePath)
    }, threadID, (err, info) => {
      // حذف الصورة من الكاش فوراً بعد الإرسال
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);

      if (global.client && global.client.handleReply) {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          correctAnswer: arabicAnswer
        });
      }
    }, messageID);

  } catch (e) {
    console.error("[FLAG GAME ERROR]", e);
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    return api.sendMessage("❌ عذراً يابه تعذر الاتصال بـ API الأعلام حالياً. جرب مرة أخرى.", threadID, messageID);
  }
};

// ══════════════════════════════════════════
// HANDLE REPLY (التحقق من الإجابة وتوزيع الجائزة)
// ══════════════════════════════════════════
module.exports.handleReply = async function ({ api, event, handleReply, Economy }) {
  const { threadID, messageID, senderID, body } = event;
  const userAnswer = body.trim().toLowerCase();

  // تنظيف النص المدخل من ال التعريف الزائدة والهمزات لتسهيل التطابق
  const cleanString = (str) => {
    return str
      .replace(/^(ال)/, "")
      .replace(/[أإآا]/g, "ا")
      .replace(/ة/g, "ه")
      .trim();
  };

  const cleanUserAns = cleanString(userAnswer);
  const cleanCorrectAns = cleanString(handleReply.correctAnswer.toLowerCase());

  // التحقق من صحة الإجابة
  if (cleanUserAns === cleanCorrectAns) {
    const reward = 100;
    try {
      // إضافة الـ 100$ للمحفظة في البنك الخاص بالمستخدم
      await Economy.increase(reward, senderID, "money");

      const successMsg = BOX("🎉 إِجَابَةٌ صَحِيحَةٌ", [
        `أحسنت يابه! الإجابة الصحيحة هي بالفعل: ${handleReply.correctAnswer}`,
        `💰 تم إضافة ${reward}$ إلى رصيدك بالبنك بنجاح.`
      ]);

      // إزالة حلقة الرد لمنع تكرار الإجابة على نفس السؤال
      if (global.client && global.client.handleReply) {
        global.client.handleReply = global.client.handleReply.filter(r => r.messageID !== handleReply.messageID);
      }

      return api.sendMessage(successMsg, threadID, messageID);
    } catch (err) {
      console.error(err);
      return api.sendMessage(`إجابة صحيحة (${handleReply.correctAnswer})، لكن واجهت مشكلة في إضافة المال للبنك.`, threadID, messageID);
    }
  } else {
    // إجابة خاطئة
    const failMsg = BOX("❌ إِجَابَةٌ خَاطِئَةٌ", [
      "للأسف اسم الدولة غير صحيح ؛-؛",
      "حاول مرة أخرى بكتابة الأمر من جديد!"
    ]);
    return api.sendMessage(failMsg, threadID, messageID);
  }
};
