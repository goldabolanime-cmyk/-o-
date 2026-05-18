// الآيدي الخاص بك كمطور رسمي
const DEV_ID = "100090081489341";

module.exports.config = {
  name: "المطور",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "Abdou",
  description: "عرض معلومات مطور البوت بتصميم ملكي مع ميزة الحالة المباشرة",
  commandCategory: "النظام",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Threads }) {
  const { threadID, messageID } = event;

  try {
    // 1. حساب ميزة الحالة (موجود / مش موجود) بذكاء من كاش الذاكرة
    let isOnline = false;
    if (global.data && global.data.allUserID) {
      isOnline = global.data.allUserID.includes(DEV_ID);
    }
    const devStatus = isOnline ? "موجود 🟢" : "مش موجود 🔴";

    // 2. جلب البريفكس المعتمد في المجموعة الحالية
    let threadSettings = (await Threads.getData(threadID)).settings || {};
    let currentPrefix = threadSettings.PREFIX || global.config.PREFIX || "!";

    // 3. بناء نص الزخرفة الملكي المنساب والمتناسق
    const infoMessage = 
`╭────────────────────⟢
┆ ˼👑˹ DEV — INFO
┆ ˼👤˹ 𝗔𝗯𝗼𝘂𝘁 𝗗𝗲𝘃 ↜ عبدو
├────────────────────⟢
┆ ˼لقب˹ آلَلَقُبً   ↜ 安倍🖤
┆ ˼💼˹ آلَدٍوٌر    ↜ Developer / System Controller
┆ ˼📊˹ آلَحًآلَةّ   ↜ ${devStatus}
├────────────────────⟢
┆ ˼🤖˹ 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲 ↜ KAIROS
┆ ˼💻˹ آلَنِوٌعٌ   ↜ MESSENGER BOT ❖
├────────────────────⟢
┆ ˼📖˹ حـكـمـة الـمـطـور 
┆ _*ويــبقــى آســــمي دائمــاً عـقــدة لبعـض الاشــخاص🖤👅"!*_ 
┆ _ _ _ _ _ _ _ 👑✌🏻
├────────────────────⟢
┆ ˼🌐˹ 𝗖𝗼𝗻𝘁𝗮𝗰𝘁 𝑭𝑨𝑪𝑬𝑩𝑶𝑶𝑲
┆ ➤ https://www.facebook.com/abdosama465h
├────────────────────⟢
┆ ˼🔑˹ Prefix    ↜ [ ${currentPrefix} ]
╰────────────────────⟢`;

    // 4. إرسال رسالة مباشرة بدون إطارات إضافية لتظهر الزخرفة بشكل مثالي
    return api.sendMessage(infoMessage, threadID, messageID);

  } catch (error) {
    // كتم الخطأ بذكاء وإرسال الرسالة الأساسية في حال وجود أي مشكلة بالكاش
    const backupMessage = 
`╭────────────────────⟢
┆ ˼👑˹ DEV — INFO
┆ ˼👤˹ 𝗔𝗯𝗼𝘂𝘁 𝗗𝗲𝘃 ↜ عبدو
├────────────────────⟢
┆ ˼لقب˹ آلَلَقُبً   ↜ 安倍🖤
┆ ˼💼˹ آلَدٍوٌر    ↜ Developer
┆ ˼🌐˹ 𝑭𝑨𝑪𝑬𝑩𝑶𝑶𝑲  ↜ https://www.facebook.com/abdosama465h
╰────────────────────⟢`;
    return api.sendMessage(backupMessage, threadID, messageID);
  }
};
