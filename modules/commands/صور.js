const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "صور",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "Abdou / RIO BOT",
    description: "البحث عن صور في بنترست مع نظام صفحات احترافي وزخرفة ريو بوت",
    commandCategory: "الادوات",
    usePrefix: false,
    usages: "[كلمة البحث]",
    cooldowns: 3
};

// ذاكرة مؤقتة للنتائج لكل مستخدم
if (!global.pinterestCache) global.pinterestCache = new Map();

// دالة الترجمة التلقائية إلى الإنجليزية لضمان جودة نتائج بنترست
async function translateToEnglish(text) {
    try {
        const translationResponse = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`);
        return translationResponse?.data?.[0]?.[0]?.[0] || text;
    } catch (error) {
        console.error("Error during translation:", error);
        return text;
    }
}

// دالة تحميل الصور وحفظها في الكاش مؤقتاً للإرسال
async function downloadImages(urls, startIndex, cacheDir) {
    const imgData = [];
    const paths = [];
    const end = Math.min(startIndex + 12, urls.length);

    for (let i = startIndex; i < end; i++) {
        const imgPath = path.join(cacheDir, `img_${Date.now()}_${i}.jpg`);
        try {
            const imageResponse = await axios.get(urls[i], { responseType: 'arraybuffer', timeout: 15000 });
            fs.writeFileSync(imgPath, Buffer.from(imageResponse.data, 'binary'));
            imgData.push(fs.createReadStream(imgPath));
            paths.push(imgPath);
        } catch (e) {
            console.error(`فشل تحميل صورة ${i}:`, e.message);
        }
    }
    return { imgData, paths };
}

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    api.setMessageReaction("⏱️", messageID, () => {}, true);

    if (args.length === 0) {
        return api.sendMessage("⚠️ | يرجى إدخال كلمة البحث المراد جلبها من بنترست!\nمثال: `صور انمي`", threadID, messageID);
    }

    let keySearch = args.join(" ");
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    try {
        // ترجمة كلمة البحث تلقائياً
        const translatedQuery = await translateToEnglish(keySearch);

        // جلب الصور من الـ API
        const pinterestResponse = await axios.get(`https://hiroshi-api.onrender.com/image/pinterest?search=${encodeURIComponent(translatedQuery)}`, { timeout: 20000 });
        const data = pinterestResponse.data.data;

        if (!data || data.length === 0) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("❌ | عذراً، لم أجد أي صور تطابق هذا البحث.", threadID, messageID);
        }

        // حفظ البيانات في الكاش المخصص للمستخدم
        global.pinterestCache.set(senderID, { urls: data, query: keySearch, page: 0 });

        // تحميل أول 12 صورة
        const { imgData, paths } = await downloadImages(data, 0, cacheDir);

        api.setMessageReaction("✅", messageID, () => {}, true);

        const totalPages = Math.ceil(data.length / 12);

        // بناء الرسالة بالزخرفة المفضلة لديك
        const pinterestMsg = `●─────── ✾ ───────●\n` +
                             ` ⦿ ⟬ نَتَائِجُ بِنْتِرِسْت 📸 ⟭ ⦿\n` +
                             `┝━━━━━━━━━━━━━━━\n` +
                             `┇ 🔍 الْبَحْثُ عَنْ: [ ${keySearch} ]\n` +
                             `┇ 📄 الصَّفْحَةُ: [ 1 / ${totalPages} ]\n` +
                             `┝━━━━━━━━━━━━━━━\n` +
                             `┇ 💬 قُمْ بِالرَّدِّ بِـ "التالي" أَوْ "المزيد"\n` +
                             `┇ ⏳ لِعَرْضِ 12 صُورَة أُخْرَى.\n` +
                             `●─────── ✾ ───────●`;

        api.sendMessage({
            attachment: imgData,
            body: pinterestMsg
        }, threadID, (err, info) => {
            // تنظيف الكاش من السيرفر فوراً بعد الإرسال
            paths.forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

            // حفظ معطيات الـ handleReply لانتظار الرد والتنقل بين الصفحات
            if (!err && info) {
                global.client.handleReply.push({
                    name: module.exports.config.name,
                    messageID: info.messageID,
                    author: senderID
                });
            }
        }, messageID);

    } catch (error) {
        console.error("Error fetching images:", error);
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ | حدث خطأ أثناء جلب الصور من بنترست، يرجى المحاولة لاحقاً.", threadID, messageID);
    }
};

// ═══════════════════════════════════════
// 📥 معالج التفاعل مع الصفحات (handleReply)
// ═══════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;

    // التحقق من أن الشخص الذي رد هو نفس صاحب الأمر الأصلي حماية للمود
    if (senderID !== handleReply.author) return;

    const msg = body.toLowerCase().trim();
    if (msg !== "التالي" && msg !== "المزيد" && msg !== "next" && msg !== "more") return;

    const cache = global.pinterestCache.get(senderID);
    if (!cache) {
        return api.sendMessage("❌ | انتهت جِلسة البحث الحالية، يرجى كتابة الأمر من جديد.", threadID, messageID);
    }

    const nextPage = cache.page + 1;
    const startIndex = nextPage * 12;
    const totalPages = Math.ceil(cache.urls.length / 12);

    if (startIndex >= cache.urls.length) {
        return api.sendMessage("❌ | لقَدْ وَصَلْتَ إِلى نِهَايَةِ الصُّوَرِ، لا تُوجَدُ صَفْحَاتٌ أُخْرَى.", threadID, messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    api.setMessageReaction("⏱️", messageID, () => {}, true);

    // تحميل الـ 12 صورة التالية
    const { imgData, paths } = await downloadImages(cache.urls, startIndex, cacheDir);

    if (imgData.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ | فشل تحميل مجموعة الصور التالية، حاول مجدداً.", threadID, messageID);
    }

    // تحديث رقم الصفحة في الكاش
    cache.page = nextPage;
    global.pinterestCache.set(senderID, cache);

    api.setMessageReaction("✅", messageID, () => {}, true);

    // بناء رسالة الصفحة الجديدة بالزخرفة الاحترافية
    const nextMsg = `●─────── ✾ ───────●\n` +
                    ` ⦿ ⟬ نَتَائِجُ بِنْتِرِسْت 📸 ⟭ ⦿\n` +
                    `┝━━━━━━━━━━━━━━━\n` +
                    `┇ 🔍 الْبَحْثُ عَنْ: [ ${cache.query} ]\n` +
                    `┇ 📄 الصَّفْحَةُ: [ ${nextPage + 1} / ${totalPages} ]\n` +
                    `┝━━━━━━━━━━━━━━━\n` +
                    `┇ 💬 قُمْ بِالرَّدِّ بِـ "التالي" لِلإِسْتِمْرَارِ.\n` +
                    `●─────── ✾ ───────●`;

    // سحب أو حذف رسالة الصفحة السابقة تنظيفاً للجروب (Unsend)
    try {
        await api.unsendMessage(handleReply.messageID);
    } catch (e) {}

    api.sendMessage({
        attachment: imgData,
        body: nextMsg
    }, threadID, (err, info) => {
        // تنظيف الكاش من السيرفر بعد الإرسال مباشرة
        paths.forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

        // إعادة حفظ الـ handleReply للتمكن من الانتقال للصفحة التي تليها
        if (!err && info) {
            global.client.handleReply.push({
                name: module.exports.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }
    }, messageID);
};
