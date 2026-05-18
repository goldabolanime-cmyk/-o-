const fs = require("fs-extra");
const path = require("path");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "اوامر",
  version: "20.5.0",
  hasPermssion: 0,
  credits: "Rem Bot Developer",
  description: "عرض قائمة أوامر ريم بوت V20 مع ميزة الصفحات وتفاصيل الأوامر",
  commandCategory: "نظام",
  usages: "[رقم الصفحة / الكل / اسم الأمر]",
  cooldowns: 2
};

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const input = (args[0] || "").trim();

  try {
    const allCommandNames = Array.from(global.client.commands.keys());
    const uniqueCommandNames = [];

    for (const name of allCommandNames) {
      const cmdObj = global.client.commands.get(name);
      const officialName = cmdObj?.config?.name || cmdObj?.default?.config?.name;
      if (officialName && !uniqueCommandNames.includes(officialName)) {
        uniqueCommandNames.push(officialName);
      }
    }

    const totalCommands = uniqueCommandNames.length;

    // ─── [ ميزة تفاصيل الأمر ] ───
    if (input && isNaN(input) && input !== "الكل") {
      const targetCmd = global.client.commands.get(input.toLowerCase());

      if (!targetCmd) {
        return api.sendMessage(`❌ | لـم يـتـم الـعـثـور عـلـى أمـر بـاسـم "${input}"`, threadID, messageID);
      }

      const cfg = targetCmd.config || targetCmd.default?.config || {};
      const permText = cfg.hasPermssion === 1 ? "المطور فقط" : cfg.hasPermssion === 2 ? "مسؤول المجموعة" : "الجميع";

      let detailTxt = `╮────────────────⟢ـ\n` +
                      `┆˼💫˹┊ الأمر ↜｢ ${cfg.name || input} ｣\n` +
                      `┆˼💫˹┊ الوصف ↜｢ ${cfg.description || "لا يوجد وصف"} ｣\n` +
                      `┆˼💫˹┊ الدور ↜｢ ${permText} ｣\n` +
                      `┆˼💫˹┊ الانتظار ↜｢ ${cfg.cooldowns || 0} ثانية ｣\n` +
                      `┆˼💫˹┊ البديلة ↜｢ ${Array.isArray(cfg.aliases) && cfg.aliases.length > 0 ? cfg.aliases.join(", ") : "لا يوجد"} ｣\n` +
                      `┆˼💫˹┊ المؤلف ↜｢ ${cfg.credits || "غير معروف"} ｣\n` +
                      `╯────────────────⟢ـ`;

      return api.sendMessage(detailTxt, threadID, messageID);
    }

    // ترتيب الأوامر أبجدياً
    const sortedCommands = uniqueCommandNames.sort((a, b) => a.localeCompare(b, "ar"));

    const cmdsPerPage = 20;
    const totalPages = Math.ceil(sortedCommands.length / cmdsPerPage) || 1;

    // القائمة الكاملة
    if (input === "الكل") {
      let fullTxt = "✦〘•ま 𝑹𝑬𝑴-𝑩𝑶𝑻 ま•〙✦\n\n";
      sortedCommands.forEach((cmd, index) => {
        fullTxt += ` ✦ 𓆩 ${index + 1} 𓆪 ⟻ 『${cmd}』\n`;
      });
      fullTxt += "\n───── · · · ✦ · · · ─────\n";
      fullTxt += `❄↜ الإجـمالي: ${totalCommands} أمر\n`;
      fullTxt += "───── · · · ✦ · · · ─────";
      return api.sendMessage(fullTxt, threadID, messageID);
    }

    // التنقل بين الصفحات
    let page = parseInt(input) || 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const startIdx = (page - 1) * cmdsPerPage;
    const endIdx = startIdx + cmdsPerPage;
    const pageCommands = sortedCommands.slice(startIdx, endIdx);

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
    txt += "✾ اوامــر الكل للقـائمة الكاملة\n";
    txt += "✾ اوامــر [اسم الأمر] لعرض تفاصيله\n\n";
    txt += "💡 يمكنك الرد على هذه الرسالة برقم الصفحة مباشرة للتنقل!";

    return api.sendMessage(txt, threadID, (err, info) => {
      if (err) return;
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
// HANDLE REPLY
// ══════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body } = event;
  const { totalPages } = handleReply;

  const page = parseInt(body.trim());
  if (isNaN(page) || page < 1 || page > totalPages) return;

  try {
    const index = global.client.handleReply.findIndex(x => x.messageID == handleReply.messageID);
    if (index !== -1) global.client.handleReply.splice(index, 1);
  } catch {}

  return module.exports.run({
    api,
    event,
    args: [String(page)]
  });
};
