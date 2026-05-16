const fs = require("fs-extra");
const path = require("path");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "اوامر",
  version: "20.2.0",
  hasPermssion: 0,
  credits: "Rem Bot Developer",
  description: "عرض قائمة أوامر ريم بوت V20 مع ميزة الصفحات",
  commandCategory: "نظام",
  usages: "[رقم الصفحة / الكل]",
  cooldowns: 2
};

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  try {
    // جلب جميع الأوامر من الـ Map الرئيسي للبوت
    const allCommands = Array.from(global.client.commands.values());
    const totalCommands = allCommands.length;

    // ترتيب الأوامر أبجدياً
    const sortedCommands = allCommands
      .map(c => c.config?.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ar"));

    const cmdsPerPage = 20;
    const totalPages = Math.ceil(sortedCommands.length / cmdsPerPage) || 1;

    // التحقق مما إذا كان المستخدم يطلب القائمة الكاملة "الكل"
    if (args[0] === "الكل") {
      let fullTxt = "✦〘•ま 𝑹𝑬𝑴-𝑩𝑶𝑻 ま•〙✦\n\n";
      sortedCommands.forEach((cmd, index) => {
        fullTxt += ` ✦ 𓆩 ${index + 1} 𓆪 ⟻ 『${cmd}』\n`;
      });
      fullTxt += "\n───── · · · ✦ · · · ─────\n";
      fullTxt += `❄↜ الإجـمالي: ${totalCommands} أمر\n`;
      fullTxt += "───── · · · ✦ · · · ─────";
      return api.sendMessage(fullTxt, threadID, messageID);
    }

    // تحديد رقم الصفحة الحالية
    let page = parseInt(args[0]) || 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    // حساب الأوامر التي ستعرض في الصفحة الحالية
    const startIdx = (page - 1) * cmdsPerPage;
    const endIdx = startIdx + cmdsPerPage;
    const pageCommands = sortedCommands.slice(startIdx, endIdx);

    // بناء رسالة الواجهة بنفس الستايل المطلوب
    let txt = "✦〘•ま 𝑹𝑬𝑴-𝑩𝑶𝑻 ま•〙✦\n\n";

    pageCommands.forEach((cmd, index) => {
      txt += ` ✦ 𓆩 ${startIdx + index + 1} 𓆪 ⟻ 『${cmd}』\n`;
    });

    txt += "\n───── · · · ✦ · · · ─────\n";
    txt += `📖↜ الصـفحة: ${page} من ${totalPages}\n`;
    txt += `🧭↜ المعـروض: ${pageCommands.length} أمر\n`;
    txt += `❄↜ الإجـمالي: ${totalCommands} أمر\n`;
    txt += "───── · · · ✦ · · · ─────\n";
    txt += "✾ اوامــر [رقـم] للتـنقل\n";
    txt += "✾ اوامــر الكل للقـائمة الكاملة\n\n";
    txt += "💡 يمكنك الرد على هذه الرسالة برقم الصفحة مباشرة للتنقل!";

    // إرسال الرسالة وتسجيل الـ Reply ليتيح للمرء التنقل بالرد
    return api.sendMessage(txt, threadID, (err, info) => {
      if (err) return;

      // تسجيل الـ Reply في السيرفر المركزي لبوت ريم ليعمل مع مقبض الردود
      try {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          totalPages: totalPages
        });
      } catch (e) {}

    }, messageID);

  } catch (e) {
    console.error("[HELP ERROR]", e.message);
    return api.sendMessage(`❌ | خطأ في عرض الأوامر:\n${e.message}`, threadID, messageID);
  }
};

// ══════════════════════════════════════════
// HANDLE REPLY (التنقل الذكي عبر الرد)
// ══════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, threadID, messageID } = event;
  const { totalPages } = handleReply;

  // التحقق إن كان الرد عبارة عن رقم صفحة صالح
  const page = parseInt(body.trim());
  if (isNaN(page) || page < 1 || page > totalPages) return;

  // مسح الرد القديم لتجنب التكرار والازدحام
  try {
    const index = global.client.handleReply.findIndex(x => x.messageID == handleReply.messageID);
    if (index !== -1) global.client.handleReply.splice(index, 1);
  } catch {}

  // تشغيل الأمر مجدداً على الصفحة الجديدة المطلوبة
  return module.exports.run({
    api,
    event,
    args: [String(page)]
  });
};
