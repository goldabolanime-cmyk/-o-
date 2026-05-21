const fs = require("fs-extra");
const path = require("path");

// مسار تخزين المجموعات المستدعاة والمفعلة لضمان عدم ضياع البيانات عند ريستارت السيرفر
const activatedGroupsPath = path.join(__dirname, "cache", "activatedGroups.json");

module.exports.config = {
    name: "استدعاء",
    aliases: ["تفعيل_البوت", "تشغيل"],
    version: "1.0.0",
    hasPermssion: 2, // صلاحية أدمن البوت / المطور فقط لمنع الأعضاء من استخدامه
    credits: "Abdou / RIO BOT",
    description: "استدعاء وتفعيل البوت في المجموعة الحالية (خاص بأدمن البوت فقط)",
    commandCategory: "الادوات",
    usages: "استدعاء",
    cooldowns: 3
};

// التأكد من وجود ملف الكاش والمجلد
if (!fs.existsSync(path.dirname(activatedGroupsPath))) fs.mkdirSync(path.dirname(activatedGroupsPath));
if (!fs.existsSync(activatedGroupsPath)) fs.writeJsonSync(activatedGroupsPath, []);

module.exports.run = async function({ api, event }) {
    const { threadID, messageID } = event;

    try {
        // قراءة قائمة المجموعات المفعلة حالياً
        let activatedGroups = fs.readJsonSync(activatedGroupsPath);

        // التحقق إذا كانت المجموعة مستدعاة ومفعلة من قبل
        if (activatedGroups.includes(threadID)) {
            const alreadyMsg = `●─────── ✾ ───────●\n` +
                               ` ⦿ ⟬ تَنْبِيهُ الإِسْتِدْعَاءِ ⚠️ ⟭ ⦿\n` +
                               `┝━━━━━━━━━━━━━━━\n` +
                               `┇ ❌ هَذِهِ الْمَجْمُوعَةُ مُسْتَدْعَاةٌ بِالْفِعْلِ!\n` +
                               `┇ ⚙️ الْبَوْتُ شَغَّالٌ وَمُفَعَّلٌ هُنَا مُسْبَقاً.\n` +
                               `●─────── ✾ ───────●`;
            return api.sendMessage(alreadyMsg, threadID, messageID);
        }

        // إضافة المجموعة الحالية للقائمة المفعلة
        activatedGroups.push(threadID);
        fs.writeJsonSync(activatedGroupsPath, activatedGroups);

        // رسالة التفعيل والتشغيل بنجاح
        const successMsg = `●─────── ✾ ───────●\n` +
                             ` ⦿ ⟬ تَمَّ الإِسْتِدْعَاءُ بِنَجَاحٍ 🎉 ⟭ ⦿\n` +
                             `┝━━━━━━━━━━━━━━━\n` +
                             `┇ 🤖 تَمَّ تَشْغِيلُ الْبَوْتِ فِي هَذِهِ الْمَجْمُوعَةِ.\n` +
                             `┇ 🔓 أَوْامِرُ ريم بَوْت مُتَاحَةٌ لِلْجَمِيعِ الآنَ!\n` +
                             `●─────── ✾ ───────●`;

        return api.sendMessage(successMsg, threadID, messageID);

    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ | حدث خطأ أثناء تفعيل المجموعة في ملف التخزين.", threadID, messageID);
    }
};
