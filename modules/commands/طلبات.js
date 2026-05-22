const fs = require("fs-extra");
const path = require("path");

const activatedGroupsPath = path.join(__dirname, "cache", "activatedGroups.json");
const pendingGroupsPath = path.join(__dirname, "cache", "pendingGroups.json");

module.exports = {
  config: {
    name: "طلبات",
    aliases: ["الطلبات", "requests", "req"],
    version: "1.0.0",
    hasPermssion: 2, // متاح فقط للمطورين والادمن حسب نظام الحماية لديك
    description: "إدارة طلبات المجموعات المعلقة والموافقة على تفعيل البوت داخلها أو رفضها",
    credits: "Abdou",
    usePrefix: true,
    category: "المطور"
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    // التأكد من وجود ملف الكاش الخاص بالطلبات
    if (!fs.existsSync(pendingGroupsPath)) fs.writeJsonSync(pendingGroupsPath, {});
    if (!fs.existsSync(activatedGroupsPath)) fs.writeJsonSync(activatedGroupsPath, []);

    let pendingGroups = fs.readJsonSync(pendingGroupsPath);
    let activatedGroups = fs.readJsonSync(activatedGroupsPath);
    const pendingList = Object.values(pendingGroups);

    // الحالة 1: عرض قائمة المجموعات المعلقة
    if (args.length === 0) {
      if (pendingList.length === 0) {
        return api.sendMessage("📥 | لا توجد مجموعات معلقة في قائمة الانتظار حالياً.", threadID, messageID);
      }

      let msg = "📝 ── [ قائمة المجموعات المعلقة ] ── 📝\n\n";
      pendingList.forEach((group, index) => {
        msg += `${index + 1} ── •\n`;
        msg += `📌 اسم المجموعة: ${group.name}\n`;
        msg += `🆔 المعرف (ID): ${group.id}\n`;
        msg += `⏰ تاريخ الطلب: ${group.time}\n\n`;
      });

      msg += `💡 [ للموافقة أو الرفض ]:\n`;
      msg += `• اكتب: طلبات موافقة [الرقم]\n`;
      msg += `• اكتب: طلبات رفض [الرقم]\n\n`;
      msg += `💫 أو استخدم الـ ID مباشرة:\n`;
      msg += `• طلبات تفعيل [ID المجموعه]`;

      return api.sendMessage(msg, threadID, messageID);
    }

    const action = args[0].toLowerCase();

    // الحالة 2: الموافقة على مجموعة من القائمة
    if (action === "موافقة" || action === "موافق" || action === "قبول") {
      const index = parseInt(args[1]) - 1;
      if (isNaN(index) || index < 0 || index >= pendingList.length) {
        return api.sendMessage("❌ | يرجى إدخال رقم مجموعة صحيح من القائمة.", threadID, messageID);
      }

      const targetGroup = pendingList[index];

      // إضافة المجموعة للمفعلة وحذفها من المعلقة
      if (!activatedGroups.includes(targetGroup.id)) {
        activatedGroups.push(targetGroup.id);
        fs.writeJsonSync(activatedGroupsPath, activatedGroups);
      }
      delete pendingGroups[targetGroup.id];
      fs.writeJsonSync(pendingGroupsPath, pendingGroups);

      // إرسال إشعار للمطور وتنبيه في المجموعة المقبولة
      api.sendMessage(`✅ | تم تفعيل البوت بنجاح لمجموعة: "${targetGroup.name}" (${targetGroup.id}).`, threadID, messageID);
      return api.sendMessage("🤖 | تم تفعيل البout في هذه المجموعة من قبل مطور البوت! يمكنك الآن استخدام كافة الأوامر بنجاح.", targetGroup.id);
    }

    // الحالة 3: رفض مجموعة وحذفها من القائمة
    if (action === "رفض" || action === "حذف") {
      const index = parseInt(args[1]) - 1;
      if (isNaN(index) || index < 0 || index >= pendingList.length) {
        return api.sendMessage("❌ | يرجى إدخال رقم مجموعة صحيح من القائمة.", threadID, messageID);
      }

      const targetGroup = pendingList[index];
      delete pendingGroups[targetGroup.id];
      fs.writeJsonSync(pendingGroupsPath, pendingGroups);

      api.sendMessage(`❌ | تم رفض وحذف مجموعة: "${targetGroup.name}" من قائمة الانتظار.`, threadID, messageID);
      return api.sendMessage("⚠️ | عذراً، تم رفض طلب تفعيل البوت في هذه المجموعة من قبل الإدارة.", targetGroup.id);
    }

    // الحالة 4: تفعيل مباشر عبر الـ ID دون الحاجة للقائمة
    if (action === "تفعيل" || action === "اضافة") {
      const targetID = args[1];
      if (!targetID) {
        return api.sendMessage("❌ | يرجى كتابة الـ ID الخاص بالمجموعة بعد الأمر.\nمثال: طلبات تفعيل 123456789", threadID, messageID);
      }

      if (!activatedGroups.includes(String(targetID))) {
        activatedGroups.push(String(targetID));
        fs.writeJsonSync(activatedGroupsPath, activatedGroups);
      }

      // حذفها من قائمة الانتظار إذا كانت موجودة فيها بالصدفة
      if (pendingGroups[String(targetID)]) {
        delete pendingGroups[String(targetID)];
        fs.writeJsonSync(pendingGroupsPath, pendingGroups);
      }

      api.sendMessage(`✅ | تم تفعيل المجموعة ذات المعرف [${targetID}] بنجاح ومباشرة!`, threadID, messageID);
      return api.sendMessage("🤖 | تم تفعيل المجموعة مباشرة بواسطة الإدارة! البوت متاح للعمل الآن.", String(targetID));
    }

    // رسالة مساعدة في حال كتابة وسيط خاطئ
    return api.sendMessage(`⚠️ | أمر غير معروف. استخدم:\n• طلبات (لعرض القائمة)\n• طلبات موافقة [الرقم]\n• طلبات رفض [الرقم]\n• طلبات تفعيل [ID]`, threadID, messageID);
  }
};
