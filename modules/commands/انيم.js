const axios = require("axios");

// دالة التنسيق الخاصة ببوتك
const BOX = (title, lines) => {
  let m = `●─────── ⌬ ───────●\n ⦿ ⟬ ${title} ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n`;
  for (const l of lines) {
    m += `┇ ${l}\n`;
  }
  return m + '●─────── ⌬ ───────●';
};

module.exports.config = {
  name: "انيم",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Abdou",
  description: "البحث عن معلومات الأنمي من موقع MyAnimeList",
  commandCategory: "العاب",
  usages: "[اسم الأنمي بالإنجليزية]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const animeQuery = args.join(" ").trim();

  if (!animeQuery) {
    return api.sendMessage(BOX("تنبيه ⚠️", ["يرجى كتابة اسم الأنمي للبحث عنه.", "مثال: .انمي Naruto"]), threadID, messageID);
  }

  try {
    // الاتصال المباشر بـ Jikan API v4 المستقر
    const res = await axios.get(`https://api.jikan.moe/v4/anime`, {
      params: { q: animeQuery, limit: 1 },
      timeout: 15000
    });

    const animeData = res.data?.data;

    // التحقق من وجود نتائج لمنع الـ Crash
    if (!animeData || animeData.length === 0) {
      return api.sendMessage(BOX("لم يتم العثور ❌", ["لم أجد أي أنمي بهذا الاسم، تأكد من كتابته بالإنجليزية بشكل صحيح."]), threadID, messageID);
    }

    const anime = animeData[0];

    // تجميع البيانات وتجهيزها داخل دالة الصندوق
    const infoLines = [
      `الاسم الأصلي: ${anime.title}`,
      `الاسم بالإنجليزية: ${anime.title_english || "غير متوفر"}`,
      `النوع: ${anime.type || "غير معروف"}`,
      `عدد الحلقات: ${anime.episodes || "مستمر"}`,
      `الحالة: ${anime.status}`,
      `التقييم: ⭐ ${anime.score || "لا يوجد"}`,
      `الموسم: ${anime.season ? `${anime.season} ${anime.year}` : "غير محدد"}`,
      `التصنيف: ${anime.genres?.map(g => g.name).join(", ") || "غير مصنف"}`,
      `💡 القصة مصغرة: ${anime.synopsis ? anime.synopsis.slice(0, 200) + "..." : "لا توجد قصة متوفرة."}`
    ];

    // إرسال الصورة بوستر الأنمي مع التفاصيل النصية بداخل صندوق التنسيق
    if (anime.images?.jpg?.image_url) {
      const stream = (await axios.get(anime.images.jpg.image_url, { responseType: "stream" })).data;
      return api.sendMessage({
        body: BOX("مَعْلُومَاتُ الأَنْمِي 🎬", infoLines),
        attachment: stream
      }, threadID, messageID);
    } else {
      return api.sendMessage(BOX("مَعْلُومَاتُ الأَنْمِي 🎬", infoLines), threadID, messageID);
    }

  } catch (error) {
    console.error("[ANIME CMD ERROR]", error.message);
    // معالجة ذكية لحظر الطلبات الزائدة
    if (error.response?.status === 429) {
      return api.sendMessage(BOX("ضغط عالي ⏱️", ["الضغط كبير على سيرفر الأنمي حالياً، انتظر ثواني وأعد المحاولة."]), threadID, messageID);
    }
    return api.sendMessage(BOX("خطأ ❌", ["حدث خطأ أثناء جلب البيانات من السيرفر."]), threadID, messageID);
  }
};
