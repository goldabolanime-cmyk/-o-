const fs = require("fs-extra");
const path = require("path");

const assistantsPath = path.join(__dirname, "cache", "assistants.json");

module.exports.config = {
    name: "مساعد",
    aliases: ["المساعدين", "المساعد"],
    version: "1.0.0",
    hasPermssion: 0, // السماح بالدخول للأمر لعرض القائمة والمساعد المطور الأساسي يتحكم بالإدخال
    credits: "Abdou / RIO BOT",
    description: "نظام تعيين وإدارة المساعدين (المطورين الثانويين) للبوت",
    commandCategory: "الادوات",
    usages: "[اضافة/ازالة/قائمة/معلومات/تصفير]",
    cooldowns: 3
};

// التأكد من وجود ملف تخزين المساعدين
if (!fs.existsSync(path.dirname(assistantsPath))) fs.mkdirSync(path.dirname(assistantsPath));
if (!fs.existsSync(assistantsPath)) fs.writeJsonSync(assistantsPath, []);

module.exports.run = async function({ api, event, args, Users }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;

    // معرف المطور الأساسي (أنت) - يتم جلبه من الـ config تلقائياً
    const OWNER_IDS = (global.client.config.ownerBot || []).map(String);
    const isPrimaryOwner = OWNER_IDS.includes(String(senderID));

    let assistants = fs.readJsonSync(assistantsPath);

    // ── قوالب الزخرفة المطلوبة ──
    const mainHeader = `◆━━━━━▷ ✦ ◁━━━━━◆\n❏ طريقة الاستخدام 📖\n◆━━━━━▷ ✦ ◁━━━━━◆\n\n`;
    const mainFooter = `\n━━━━━▷ ✦ ◁━━━━━\n💡 يمكنك الرد على رسالة بدلاً من المنشن\n💡 أو استخدام الآيدي مباشرة\n◆━━━━━▷ ✦ ◁━━━━━◆`;

    if (args.length === 0) {
        const helpMsg = mainHeader +
                        `❏ مساعد اضافة [@منشن/آيدي] ➕\n` +
                        `❏ مساعد ازالة [@منشن/آيدي] ➖\n` +
                        `❏ مساعد قائمة 📋\n` +
                        `❏ مساعد بحث [اسم/آيدي] 🔍\n` +
                        `❏ مساعد معلومات [@منشن/آيدي] ℹ\n` +
                        `❏ مساعد تصفير 🧹` + 
                        mainFooter;
        return api.sendMessage(helpMsg, threadID, messageID);
    }

    const action = args[0].toLowerCase();

    // 🛡️ دالة استخراج الـ ID الذكي (منشن أو رد أو كتابة مباشرة)
    let targetID = null;
    if (messageReply) {
        targetID = String(messageReply.senderID);
    } else if (Object.keys(mentions).length > 0) {
        targetID = String(Object.keys(mentions)[0]);
    } else if (args[1] && !isNaN(args[1])) {
        targetID = String(args[1]);
    }

    // 🛑 [حماية] الإضافة، الإزالة، والتصفير مقتصرة فقط على المطور الأساسي
    if (["اضافة", "إضافة", "ازالة", "إزالة", "تصفير"].includes(action) && !isPrimaryOwner) {
        return api.sendMessage("⛔ | عذراً، إدارة وتعيين المساعدين متاح فقط للمطور الأساسي للبوت!", threadID, messageID);
    }

    // ═══════════════════════════════════════
    // ➕ 1. إضافة مساعد جديد
    // ═══════════════════════════════════════
    if (action === "اضافة" || action === "إضافة") {
        if (!targetID) return api.sendMessage("⚠️ | يرجى تحديد الحساب عن طريق المنشن، الرد على رسالته، أو كتابة الـ ID مباشرة بعد الأمر.", threadID, messageID);

        if (assistants.includes(targetID)) return api.sendMessage("⚠️ | هذا الحساب تم تعيينه كمساعد بالفعل مسبقاً.", threadID, messageID);
        if (OWNER_IDS.includes(targetID)) return api.sendMessage("⚠️ | هذا الحساب هو المطور الأساسي للبوت بالفعل ولا يمكن تكراره كمساعد.", threadID, messageID);

        assistants.push(targetID);
        fs.writeJsonSync(assistantsPath, assistants);

        const name = await Users.getNameUser(targetID);
        const successAdd = `◆━━━━━▷ ✦ ◁━━━━━◆\n` +
                           `❏ تَمَّ إِضَافَةُ مُسَاعِدٍ جَدِيدٍ 🎉\n` +
                           `◆━━━━━▷ ✦ ◁━━━━━◆\n\n` +
                           `❏ الاسْمُ : ${name}\n` +
                           `❏ الآيْدِي : ${targetID}\n` +
                           `❏ الرُّتْبَةُ : مطور ثانَوِي\n` +
                           `❏ التَّحَكُّمُ : الكل (عدا إدارة المساعدين)\n` +
                           `◆━━━━━▷ ✦ ◁━━━━━◆`;
        return api.sendMessage(successAdd, threadID, messageID);
    }

    // ═══════════════════════════════════════
    // ➖ 2. إزالة مساعد
    // ═══════════════════════════════════════
    if (action === "ازالة" || action === "إزالة") {
        if (!targetID) return api.sendMessage("⚠️ | يرجى تحديد المساعد المراد إزالته بالمنشن أو الرد أو الآيدي.", threadID, messageID);

        if (!assistants.includes(targetID)) return api.sendMessage("❌ | هذا الحساب ليس متواجداً في قائمة المساعدين الحالية.", threadID, messageID);

        assistants = assistants.filter(id => id !== targetID);
        fs.writeJsonSync(assistantsPath, assistants);

        const name = await Users.getNameUser(targetID);
        return api.sendMessage(`✅ | تم إلغاء صلاحيات المساعد بنجاح وطرد الحساب [ ${name} ] من طاقم التطوير الفني.`, threadID, messageID);
    }

    // ═══════════════════════════════════════
    // 📋 3. عرض قائمة المساعدين
    // ═══════════════════════════════════════
    if (action === "قائمة" || action === "قائمه") {
        if (assistants.length === 0) return api.sendMessage("📋 | لا يوجد أي مساعدين معينين للبوت حالياً.", threadID, messageID);

        let listMsg = `◆━━━━━▷ ✦ ◁━━━━━◆\n` +
                      `❏ قَائِمَةُ الْمُسَاعِدِينَ الْمُعْتَمَدِينَ 📋\n` +
                      `◆━━━━━▷ ✦ ◁━━━━━◆\n\n`;

        for (let i = 0; i < assistants.length; i++) {
            const id = assistants[i];
            const name = await Users.getNameUser(id);
            listMsg += `❏ الـ ID : ${id}\n` +
                       `❏ الاسْمُ : ${name}\n` +
                       `❏ الرُّتْبَةُ : مُطَوِّر ثَانَوِي 🎖️\n` +
                       `❏ التَّحَكُّمُ : الكل\n`;
            if (i < assistants.length - 1) listMsg += ` ───  ───\n`;
        }
        listMsg += `◆━━━━━▷ ✦ ◁━━━━━◆`;
        return api.sendMessage(listMsg, threadID, messageID);
    }

    // ═══════════════════════════════════════
    // 🔍 4. البحث عن مساعد بالاسم أو الآيدي
    // ═══════════════════════════════════════
    if (action === "بحث") {
        const searchQuery = args.slice(1).join(" ");
        if (!searchQuery) return api.sendMessage("⚠️ | اكتب اسم المساعد أو الآيدي الخاص به للبحث عنه.", threadID, messageID);

        let searchResult = "";
        for (const id of assistants) {
            const name = await Users.getNameUser(id);
            if (id.includes(searchQuery) || name.toLowerCase().includes(searchQuery.toLowerCase())) {
                searchResult += `◆━━━━━▷ ✦ ◁━━━━━◆\n` +
                                `❏ نَتِيجَةُ الْبَحْثِ عَنِ الْمُسَاعِدِ 🔍\n` +
                                `◆━━━━━▷ ✦ ◁━━━━━◆\n\n` +
                                `❏ الآيْدِي : ${id}\n` +
                                `❏ الاسْمُ : ${name}\n` +
                                `❏ الرُّتْبَةُ : مُطَوِّر ثَانَوِي\n` +
                                `❏ التَّحَكُّمُ : الكل\n` +
                                `◆━━━━━▷ ✦ ◁━━━━━◆\n`;
            }
        }
        if (!searchResult) return api.sendMessage("❌ | لم يتم العثور على أي مساعد يطابق بيانات البحث هذه.", threadID, messageID);
        return api.sendMessage(searchResult, threadID, messageID);
    }

    // ═══════════════════════════════════════
    // ℹ️ 5. معلومات المساعد
    // ═══════════════════════════════════════
    if (action === "معلومات") {
        if (!targetID) return api.sendMessage("⚠️ | حدد الحساب المراد عرض معلوماته بالمنشن أو الرد أو الآيدي.", threadID, messageID);

        const isUserAssistant = assistants.includes(targetID);
        const name = await Users.getNameUser(targetID);

        const infoMsg = `◆━━━━━▷ ✦ ◁━━━━━◆\n` +
                        `❏ مَعْلُومَاتُ الْحِسَابِ الْفَنِّيَّةِ ℹ\n` +
                        `◆━━━━━▷ ✦ ◁━━━━━◆\n\n` +
                        `❏ الآيْدِي : ${targetID}\n` +
                        `❏ الاسْمُ : ${name}\n` +
                        `❏ الرُّتْبَةُ : ${isUserAssistant ? "مُطَوِّر ثَانَوِي 🎖️" : "مُسْتَخْدِم عِادِي 👤"}\n` +
                        `❏ التَّحَكُّمُ : ${isUserAssistant ? "الكل (ما عدا الإدارة)" : "الأوامر العامة فقط"}\n` +
                        `◆━━━━━▷ ✦ ◁━━━━━◆`;
        return api.sendMessage(infoMsg, threadID, messageID);
    }

    // ═══════════════════════════════════════
    // 🧹 6. تصفير قائمة المساعدين بالكامل
    // ═══════════════════════════════════════
    if (action === "تصفير") {
        if (assistants.length === 0) return api.sendMessage("🧹 | القائمة فارغة بالفعل ولا يوجد مساعدين لحذفهم.", threadID, messageID);

        fs.writeJsonSync(assistantsPath, []);
        return api.sendMessage("🧹 | تم تصفير وحذف جميع المساعدين بنجاح، البوت الآن تحت سيطرتك المنفردة كلياً.", threadID, messageID);
    }
};
