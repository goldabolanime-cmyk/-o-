module.exports.config = {
  name: "ايدي",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Abdou / RIO BOT",
  description: "عرض المعرفات (ID) للمستخدم، المردود عليه، المجموعات، أو المشرفين بدون زخارف لسهولة النسخ",
  commandCategory: "🛡️ نظام",
  usages: "[بدون إدخال / بالرد / ادمن / غروب]",
  cooldowns: 2
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, messageReply, type } = event;
  const input = (args[0] || "").toLowerCase();

  // 1️⃣ أمر: ايدي ادمن (عرض أرقام معرفات مشرفي المجموعة)
  if (input === "ادمن" || input === "الأدمن") {
      try {
          const threadInfo = await api.getThreadInfo(threadID);
          const adminIDs = threadInfo.adminIDs.map(admin => admin.id);

          if (adminIDs.length === 0) {
              return api.sendMessage("❌ | لا يوجد مشرفين في هذه المجموعة أو لا يمكن جلبهم.", threadID, messageID);
          }

          let msg = "🆔 أرقام معرفات مشرفي المجموعة:\n\n";
          for (const id of adminIDs) {
              const name = await Users.getNameUser(id);
              msg += `${name}:\n${id}\n\n`; // الرقم في سطر منفصل تماماً بدون زخرفة لسهولة النسخ
          }

          return api.sendMessage(msg.trim(), threadID, messageID);
      } catch (e) {
          return api.sendMessage("❌ | حدث خطأ أثناء محاولة جلب معلومات المشرفين.", threadID, messageID);
      }
  }

  // 2️⃣ أمر: ايدي غروب (عرض رقم معرف المجموعة الحالي)
  if (input === "غروب" || input === "المجموعة" || input === "جروب") {
      return api.sendMessage(`${threadID}`, threadID, messageID);
  }

  // 3️⃣ أمر: ايدي بالرد (إذا قام الشخص بالرد على رسالة مستخدم آخر)
  if (type === "message_reply" && messageReply.senderID) {
      const targetID = messageReply.senderID;
      const targetName = await Users.getNameUser(targetID);

      return api.sendMessage(`🆔 ايدي: ${targetName}\n\n${targetID}`, threadID, messageID);
  }

  // 4️⃣ أمر: ايدي الشخصي (حالة عدم الرد وعدم كتابة أرجومنت)
  if (!input) {
      return api.sendMessage(`${senderID}`, threadID, messageID);
  } else {
      // في حال كتب شيئاً غير مفهوم
      return api.sendMessage("⚠️ | الاستخدام الصحيح للأمر:\n• ايدي (لعرض ايديك)\n• بالرد على شخص (لعرض ايديه)\n• ايدي غروب (ايدي المجموعة)\n• ايدي ادمن (ايديات المشرفين)", threadID, messageID);
  }
};
