const axios = require("axios");

module.exports.config = {
  name: "قرآن",
  version: "2.3.0",
  hasPermssion: 0,
  credits: "Abdou / RIO BOOT",
  description: "آيات، بحث، معلومات السور، إحصائيات الكلمات (تحسين البحث)",
  commandCategory: "إسلاميات",
  usages: "[عشوائي / بحث اسم_السورة رقم_الآية / تكرار كلمة / معلومات اسم_السورة / مساعدة]",
  cooldowns: 5
};

const header = (title) => `●─── ⟪ ${title} ⟫ ───●`;
const divider = () => `●─────── ⌬ ───────●`;
const row = (emoji, label, value) => `『 ${emoji} 』 ${label}↜ ${value}`;

// دالة لتنظيف النص من التشكيل والهمزات لتسهيل البحث
function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/([^\u0000-\u007F]|\w)/g, (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '') // حذف التشكيل
    .trim();
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const action = args[0];

  try {
    // --- [ أمر مساعدة ] ---
    if (action === "مساعدة") {
      const helpMsg = `${header("دليـل أوامـر الـقـرآن")}\n\n${row("📖", "قرآن عشوائي", "جلب آية عشوائية")}\n${row("🔎", "قرآن بحث", "البحث عن آية")}\n${row("📊", "قرآن تكرار", "عدد مرات ذكر كلمة")}\n${row("🕌", "قرآن معلومات", "عرض معلومات سورة")}\n\n${divider()}\n\n📌 أمثلة الاستخدام :\n• قرآن عشوائي\n• قرآن بحث البقرة 255\n• قرآن تكرار رحمة\n• قرآن معلومات الكهف\n\n${divider()}\n\n✨ جعله الله في ميزان حسناتك`;
      return api.sendMessage(helpMsg, threadID, messageID);
    }

    // --- [ أمر عشوائي ] ---
    if (!action || action === "عشوائي") {
      const res = await axios.get("https://api.alquran.cloud/v1/ayah/random/ar.alafasy");
      const data = res.data.data;
      const msg = `${header("آيـة كـريـمـة")}\n\n📖 | { ${data.text} }\n\n${divider()}\n\n${row("🕌", "السورة", data.surah.name)}\n${row("🔢", "رقم الآية", data.numberInSurah)}\n\n✨ صدق الله العظيم`;
      return api.sendMessage(msg, threadID, messageID);
    }

    // --- [ أمر بحث ] ---
    if (action === "بحث") {
      const surahInput = args[1];
      const ayahNum = args[2];
      if (!surahInput || !ayahNum) return api.sendMessage("⚠️ | مثال صحيح: قرآن بحث البقرة 255", threadID, messageID);

      const surahRes = await axios.get("https://api.alquran.cloud/v1/surah");
      const surahs = surahRes.data.data;

      const target = cleanText(surahInput);
      const surah = surahs.find(s => cleanText(s.name).includes(target) || s.englishName.toLowerCase().includes(target.toLowerCase()));

      if (!surah) return api.sendMessage("❌ | لم يتم العثور على السورة (جرب كتابة الاسم بدون تشكيل).", threadID, messageID);

      const ayahRes = await axios.get(`https://api.alquran.cloud/v1/ayah/${surah.number}:${ayahNum}/ar.alafasy`);
      const data = ayahRes.data.data;
      const msg = `${header("نـتـيـجـة الـبـحـث")}\n\n📖 | { ${data.text} }\n\n${divider()}\n\n${row("🕌", "السورة", data.surah.name)}\n${row("🔢", "الآية", data.numberInSurah)}\n\n✨ صدق الله العظيم`;
      return api.sendMessage(msg, threadID, messageID);
    }

    // --- [ أمر تكرار ] ---
    if (action === "تكرار") {
      const word = args.slice(1).join(" ");
      if (!word) return api.sendMessage("⚠️ | اكتب الكلمة.\nمثال: قرآن تكرار رحمة", threadID, messageID);

      const res = await axios.get(`https://api.alquran.cloud/v1/search/${encodeURIComponent(word)}/all/ar`);
      const count = res.data.data.count;
      const msg = `${header("إحـصـائـيـات الـكـلـمـة")}\n\n${row("🔍", "الكلمة", word)}\n${row("📊", "عدد التكرار", count)}\n\n${divider()}\n\n✨ وَذَكِّرْ فَإِنَّ الذِّكْرَى تَنْفَعُ الْمُؤْمِنِينَ`;
      return api.sendMessage(msg, threadID, messageID);
    }

    // --- [ أمر معلومات ] ---
    if (action === "معلومات") {
      const surahInput = args.slice(1).join(" ");
      if (!surahInput) return api.sendMessage("⚠️ | مثال: قرآن معلومات الكهف", threadID, messageID);

      const res = await axios.get("https://api.alquran.cloud/v1/surah");
      const surahs = res.data.data;

      const target = cleanText(surahInput);
      const index = surahs.findIndex(s => cleanText(s.name).includes(target) || s.englishName.toLowerCase().includes(target.toLowerCase()));

      if (index === -1) return api.sendMessage("❌ | السورة غير موجودة.", threadID, messageID);

      const s = surahs[index];
      const prev = index > 0 ? surahs[index - 1].name : "لا يوجد";
      const next = index < surahs.length - 1 ? surahs[index + 1].name : "لا يوجد";

      const msg = `${header("مـعـلـومـات الـسـورة")}\n\n${row("🕌", "اسم السورة", s.name)}\n${row("🔢", "ترتيبها", s.number)}\n${row("📄", "عدد الآيات", s.numberOfAyahs)}\n${row("🌍", "نوعها", s.revelationType === "Meccan" ? "مكية" : "مدنية")}\n${row("⬅️", "قبلها", prev)}\n${row("➡️", "بعدها", next)}\n\n${divider()}\n\n💡 استخدم :\nقرآن بحث ${s.name} 1`;
      return api.sendMessage(msg, threadID, messageID);
    }

    return api.sendMessage("❌ | الأمر غير معروف.\nاستخدم: قرآن مساعدة", threadID, messageID);

  } catch (e) {
    console.error("[QURAN COMMAND ERROR]", e);
    return api.sendMessage("❌ | لم يتم العثور على النتائج. تأكد من صحة رقم الآية أو اسم السورة.", threadID, messageID);
  }
};
